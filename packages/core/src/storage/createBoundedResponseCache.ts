/** Public-response cache identity, byte limits and optional storage adapter. */
export interface BoundedResponseCacheOptions {
    readonly name: string;
    readonly maxBytes: number;
    readonly maxEntryBytes?: number;
    /** Null forces a bounded memory cache, useful on insecure origins and in tests. */
    readonly storage?: CacheStorage | null;
}

/** Serialized reads, writes and reference-based retention within a bounded cache. */
export interface BoundedResponseCache {
    read(url: string): Promise<Response | null>;
    write(url: string, response: Response): Promise<boolean>;
    /** Retains the union of currently referenced immutable URLs, not one view's subset. */
    retain(urls: ReadonlySet<string>): Promise<void>;
}

type ResponseStore = Pick<Cache, "match" | "put" | "delete" | "keys">;
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
    async function entries(cache: ResponseStore) {
        const result: { request: Request; bytes: number; used: number }[] = [];
        for (const request of await cache.keys()) {
            const response = await cache.match(request);
            const value = response ? metadata(response) : null;
            if (value) result.push({ request, ...value });
            else await cache.delete(request);
        }
        return result;
    }
    return {
        read(url) {
            return serial(async cache => {
                const response = await cache.match(url);
                if (!response) return null;
                const value = metadata(response);
                if (!value) { await cache.delete(url); return null; }
                const headers = new Headers(response.headers);
                headers.set(usedHeader, String(now()));
                try { await cache.put(url, new Response(response.clone().body, { status: 200, headers })); }
                catch { /* Failure to update LRU must not hide an already readable response. */ }
                return response;
            }, null);
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
                            // A cloned stream's cancel can wait for the caller's unread tee branch.
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
                const records = (await entries(cache)).filter(entry => entry.request.url !== new Request(url).url)
                    .sort((left, right) => left.used - right.used);
                let total = records.reduce((sum, entry) => sum + entry.bytes, 0);
                for (const entry of records) {
                    if (total + bytes <= maximum) break;
                    await cache.delete(entry.request);
                    total -= entry.bytes;
                }
                const headers = new Headers(response.headers);
                headers.set(sizeHeader, String(bytes)); headers.set(usedHeader, String(now()));
                headers.set("Content-Length", String(bytes));
                headers.delete("Content-Encoding");
                await cache.put(url, new Response(data, { status: 200, headers }));
                return true;
            }, false);
        },
        retain(urls) {
            return serial(async cache => {
                const keep = new Set([...urls].map(url => new Request(url).url));
                for (const entry of await entries(cache)) if (!keep.has(entry.request.url)) await cache.delete(entry.request);
            }, undefined);
        }
    };
}
