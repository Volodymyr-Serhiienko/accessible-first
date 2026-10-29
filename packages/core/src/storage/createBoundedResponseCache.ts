/** Public-response cache identity, byte limits and optional storage adapter. */
export interface BoundedResponseCacheOptions {
    readonly name: string;
    readonly maxBytes: number;
    readonly maxEntryBytes?: number;
    /** Null forces a bounded memory cache, useful on insecure origins and in tests. */
    readonly storage?: CacheStorage | null;
}

/** Fast reads, serialized mutations and reference-based retention within a bounded cache. */
export interface BoundedResponseCache {
    read(url: string): Promise<Response | null>;
    write(url: string, response: Response): Promise<boolean>;
    /** Retains the union of currently referenced immutable URLs, not one view's subset. */
    retain(urls: ReadonlySet<string>): Promise<void>;
}

type ResponseStore = Pick<Cache, "match" | "put" | "delete" | "keys">;
type Entry = { url: string; bytes: number; used: number };
const sizeHeader = "X-AF-Cache-Bytes";
const usedHeader = "X-AF-Cache-Used";

function memoryStore(): ResponseStore {
    const values = new Map<string, Response>();
    return {
        async match(request) { return values.get(new Request(request).url)?.clone(); },
        async put(request, response) { values.set(new Request(request).url, response.clone()); },
        async delete(request) { return values.delete(new Request(request).url); },
        async keys() { return [...values.keys()].map(url => new Request(url)); }
    };
}

/** Bounded public full-response storage. No fetching, credentials, opaque responses or partial ranges. */
export function createBoundedResponseCache(options: BoundedResponseCacheOptions): BoundedResponseCache {
    const maximum = options.maxBytes;
    const entryMaximum = options.maxEntryBytes ?? maximum;
    if (!options.name.trim() || !Number.isSafeInteger(maximum) || maximum <= 0
        || !Number.isSafeInteger(entryMaximum) || entryMaximum <= 0 || entryMaximum > maximum)
        throw new TypeError("invalid-response-cache-options");
    const indexUrl = `https://accessible-first.invalid/cache-index/${encodeURIComponent(options.name)}`;
    const touches = new Map<string, number>();
    let store: Promise<ResponseStore> | null = null;
    let queue = Promise.resolve();
    let clock = 0;
    const now = () => clock = Math.max(Date.now(), clock + 1);
    const open = () => store ??= (async () => {
        try {
            const storage = options.storage === undefined ? globalThis.caches : options.storage;
            return storage ? await storage.open(options.name) : memoryStore();
        } catch { return memoryStore(); }
    })();
    function serial<T>(run: (cache: ResponseStore) => Promise<T>, fallback: T): Promise<T> {
        const operation = queue.then(async () => {
            try {
                const locks = typeof navigator === "undefined" ? undefined : navigator.locks;
                return locks ? await locks.request(`af-response-cache:${options.name}`, async () => run(await open())) : await run(await open());
            } catch { return fallback; }
        });
        queue = operation.then(() => undefined);
        return operation;
    }
    function metadata(response: Response): { bytes: number; used: number } | null {
        const bytes = Number(response.headers.get(sizeHeader));
        const used = Number(response.headers.get(usedHeader));
        return Number.isSafeInteger(bytes) && bytes > 0 && bytes <= entryMaximum && Number.isSafeInteger(used) && used > 0
            ? { bytes, used } : null;
    }
    async function entries(cache: ResponseStore): Promise<Map<string, Entry>> {
        let result: Map<string, Entry> | null = null;
        try {
            const saved = await cache.match(indexUrl);
            if (saved && Number(saved.headers.get("Content-Length")) <= 4 * 1024 * 1024) {
                const text = await saved.text();
                if (text.length > 4 * 1024 * 1024) throw new Error("cache-index-too-large");
                const raw: unknown = JSON.parse(text);
                if (!Array.isArray(raw)) throw new Error("cache-index-invalid");
                result = new Map();
                for (const entry of raw) {
                    if (!Array.isArray(entry) || entry.length !== 3 || typeof entry[0] !== "string"
                        || entry[0] === indexUrl || new Request(entry[0]).url !== entry[0]
                        || !Number.isSafeInteger(entry[1]) || entry[1] <= 0 || entry[1] > entryMaximum
                        || !Number.isSafeInteger(entry[2]) || entry[2] <= 0 || result.has(entry[0])) throw new Error("cache-index-invalid");
                    result.set(entry[0], { url: entry[0], bytes: entry[1] as number, used: entry[2] as number });
                }
            }
        } catch { result = null; }
        // Missing/dirty indexes also cover interrupted writes and migration from the old header-only cache.
        if (!result) {
            result = new Map();
            for (const request of await cache.keys()) {
                if (request.url === indexUrl) continue;
                const response = await cache.match(request);
                const value = response ? metadata(response) : null;
                if (value) result.set(request.url, { url: request.url, ...value });
                else await cache.delete(request);
            }
        }
        for (const [url, used] of touches) {
            const entry = result.get(url);
            if (entry) entry.used = Math.max(entry.used, used);
        }
        return result;
    }
    async function saveIndex(cache: ResponseStore, records: Map<string, Entry>): Promise<void> {
        await cache.put(indexUrl, new Response(JSON.stringify([...records.values()].map(entry => [entry.url, entry.bytes, entry.used]))));
        for (const [url, used] of touches) if (!records.has(url) || records.get(url)!.used >= used) touches.delete(url);
    }
    return {
        async read(url) {
            try {
                const key = new Request(url).url;
                if (key === indexUrl) return null;
                // A readable hit never waits for a maintenance lock or rewrites the MP3 body.
                const response = await (await open()).match(key);
                if (!response || !metadata(response)) return null;
                touches.delete(key); touches.set(key, now());
                if (touches.size > 4096) touches.delete(touches.keys().next().value!);
                return response;
            } catch { return null; }
        },
        async write(url, response) {
            if (response.status !== 200 || response.type === "opaque" || response.headers.has("Content-Range")
                || /(?:^|,)\s*(?:no-store|private)(?:\s|,|=|$)/i.test(response.headers.get("Cache-Control") ?? "")) return false;
            const length = Number(response.headers.get("Content-Length"));
            if (length > entryMaximum) return false;
            const chunks: Uint8Array[] = [];
            let bytes = 0;
            try {
                const reader = response.clone().body?.getReader();
                if (!reader) return false;
                try {
                    for (;;) {
                        const { value, done } = await reader.read();
                        if (done) break;
                        bytes += value.byteLength;
                        if (bytes > entryMaximum) {
                            void reader.cancel().catch(() => undefined);
                            return false;
                        }
                        chunks.push(value);
                    }
                } finally { reader.releaseLock(); }
            } catch { return false; }
            if (!bytes) return false;
            const data = new Uint8Array(bytes);
            let offset = 0;
            for (const chunk of chunks) { data.set(chunk, offset); offset += chunk.byteLength; }
            return serial(async cache => {
                const key = new Request(url).url;
                if (key === indexUrl) return false;
                const records = await entries(cache);
                records.delete(key);
                // A failed/crashed mutation leaves a dirty marker, never an undercounting index.
                await cache.put(indexUrl, new Response("dirty"));
                let total = [...records.values()].reduce((sum, entry) => sum + entry.bytes, 0);
                for (const entry of [...records.values()].sort((left, right) => left.used - right.used)) {
                    if (total + bytes <= maximum) break;
                    await cache.delete(entry.url); records.delete(entry.url); total -= entry.bytes;
                }
                const used = now(), headers = new Headers(response.headers);
                headers.set(sizeHeader, String(bytes)); headers.set(usedHeader, String(used));
                headers.set("Content-Length", String(bytes)); headers.delete("Content-Encoding");
                await cache.put(key, new Response(data, { status: 200, headers }));
                records.set(key, { url: key, bytes, used });
                await saveIndex(cache, records);
                return true;
            }, false);
        },
        retain(urls) {
            return serial(async cache => {
                const keep = new Set([...urls].map(url => new Request(url).url));
                const records = await entries(cache);
                await cache.put(indexUrl, new Response("dirty"));
                for (const entry of records.values()) if (!keep.has(entry.url)) {
                    await cache.delete(entry.url); records.delete(entry.url);
                }
                await saveIndex(cache, records);
            }, undefined);
        }
    };
}
