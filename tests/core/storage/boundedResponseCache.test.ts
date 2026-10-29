import { afterEach, describe, expect, it, vi } from "vitest";
import { createBoundedResponseCache } from "../../../packages/core/src/storage/createBoundedResponseCache";

const address = (key: string) => `https://cache.example/${key}`;
const cache = () => createBoundedResponseCache({ name: "test", maxBytes: 8, maxEntryBytes: 4, storage: null });

describe("createBoundedResponseCache", () => {
    it("keeps a byte-bounded LRU and touches readable entries", async () => {
        const storage = cache();
        expect(await storage.write(address("a"), new Response("aaaa"))).toBe(true);
        await storage.write(address("b"), new Response("bbbb"));
        expect(await (await storage.read(address("a")))?.text()).toBe("aaaa");
        await storage.write(address("c"), new Response("cccc"));
        expect(await storage.read(address("b"))).toBeNull();
        expect(await storage.read(address("a"))).not.toBeNull();
        expect(await storage.read(address("c"))).not.toBeNull();
    });

    it("replaces an existing URL without double counting and serializes concurrent writes", async () => {
        const storage = cache();
        await Promise.all([storage.write(address("a"), new Response("aaaa")), storage.write(address("a"), new Response("aa")),
            storage.write(address("b"), new Response("bbbb"))]);
        expect(await (await storage.read(address("a")))?.text()).toBe("aa");
        expect(await (await storage.read(address("b")))?.text()).toBe("bbbb");
    });

    it("retains only referenced URLs without deleting the cache itself", async () => {
        const storage = cache();
        await storage.write(address("a"), new Response("aaaa"));
        await storage.write(address("b"), new Response("bbbb"));
        await storage.retain(new Set([address("b")]));
        expect(await storage.read(address("a"))).toBeNull();
        expect(await storage.read(address("b"))).not.toBeNull();
    });

    it("rejects errors, partial/private/oversized responses, including streamed excess", async () => {
        const storage = cache();
        for (const response of [new Response("oops", { status: 404 }), new Response("part", { status: 206 }),
            new Response("part", { headers: { "Content-Range": "bytes 0-3/8" } }),
            new Response("data", { headers: { "Cache-Control": "private, max-age=10" } }),
            new Response("data", { headers: { "Cache-Control": "no-store" } }), new Response("abcde"),
            new Response("data", { headers: { "Content-Length": "20" } })])
            expect(await storage.write(address("a"), response)).toBe(false);
        expect(await storage.read(address("a"))).toBeNull();
    });

    it("falls back to bounded memory if persistent storage is blocked", async () => {
        const storage = createBoundedResponseCache({ name: "blocked", maxBytes: 4,
            storage: { open: async () => { throw new Error("security"); } } as unknown as CacheStorage });
        await storage.write(address("a"), new Response("data"));
        expect(await (await storage.read(address("a")))?.text()).toBe("data");
    });

    it("rejects invalid capacities", () => {
        expect(() => createBoundedResponseCache({ name: "", maxBytes: 4 })).toThrow();
        expect(() => createBoundedResponseCache({ name: "test", maxBytes: 4, maxEntryBytes: 5 })).toThrow();
    });
});


const deferred = () => { let resolve!: () => void; const promise = new Promise<void>(done => { resolve = done; }); return {promise,resolve}; };
function sharedStorage() {
    const data = new Map<string, Response>(), calls: string[] = [];
    const key = (input: RequestInfo | URL) => new Request(input).url;
    const cache = {
        async match(input: RequestInfo | URL) { const url = key(input); calls.push("match:" + url); return data.get(url)?.clone(); },
        async put(input: RequestInfo | URL, response: Response) { const url = key(input); calls.push("put:" + url); data.set(url, response.clone()); },
        async delete(input: RequestInfo | URL) { return data.delete(key(input)); },
        async keys() { calls.push("keys"); return [...data.keys()].map(url => new Request(url)); }
    };
    return {data,calls,cache,storage:{open:async()=>cache} as unknown as CacheStorage};
}
afterEach(() => vi.unstubAllGlobals());

describe("bounded cache scalable persistence", () => {
    it("migrates header-only entries once, then writes without per-file scans and reads without puts", async () => {
        const shared = sharedStorage();
        for (let i=0;i<1000;i++) shared.data.set(address(String(i)),new Response("data",{headers:{"X-AF-Cache-Bytes":"4","X-AF-Cache-Used":String(i+1)}}));
        const storage=createBoundedResponseCache({name:"scale",maxBytes:8000,maxEntryBytes:4,storage:shared.storage});
        await storage.write(address("first"),new Response("data"));
        expect(shared.calls.filter(c=>c==="keys")).toHaveLength(1);
        shared.calls.length=0;
        await storage.write(address("second"),new Response("data"));
        expect(shared.calls.filter(c=>c==="keys")).toHaveLength(0);
        expect(shared.calls.filter(c=>c.startsWith("match:"))).toHaveLength(1);
        shared.calls.length=0;
        expect(await (await storage.read(address("first")))?.text()).toBe("data");
        expect(shared.calls.filter(c=>c.startsWith("put:"))).toHaveLength(0);
    });
    it("returns an existing hit while a maintenance write is blocked", async () => {
        const shared=sharedStorage(), storage=createBoundedResponseCache({name:"latency",maxBytes:8,storage:shared.storage});
        await storage.write(address("old"),new Response("data"));
        const entered=deferred(),release=deferred(),put=shared.cache.put;
        shared.cache.put=async(input,response)=>{if(new Request(input).url===address("new")){entered.resolve();await release.promise;}await put(input,response);};
        const write=storage.write(address("new"),new Response("next"));
        await entered.promise;
        try {expect(await (await storage.read(address("old")))?.text()).toBe("data");}
        finally {release.resolve();await write;}
    });
    it("rebuilds after a failed index commit without losing byte accounting", async () => {
        const shared=sharedStorage(), storage=createBoundedResponseCache({name:"repair",maxBytes:8,maxEntryBytes:4,storage:shared.storage});
        await storage.write(address("a"),new Response("aaaa"));
        const put=shared.cache.put;let fail=true;
        shared.cache.put=async(input,response)=>{
            if(fail&&new Request(input).url.includes("/cache-index/")&&(await response.clone().text()).startsWith("[")){fail=false;throw Error("interrupted");}
            await put(input,response);
        };
        expect(await storage.write(address("b"),new Response("bbbb"))).toBe(false);
        const recovered=createBoundedResponseCache({name:"repair",maxBytes:8,maxEntryBytes:4,storage:shared.storage});
        expect(await recovered.write(address("c"),new Response("cccc"))).toBe(true);
        expect([...shared.data.keys()].filter(url=>url.startsWith("https://cache.example/"))).toHaveLength(2);
        expect(await recovered.read(address("c"))).not.toBeNull();
    });
    it("shares a locked index between instances and preserves the common byte cap", async () => {
        const shared=sharedStorage();let queue=Promise.resolve();
        vi.stubGlobal("navigator",{locks:{request:(_name:string,run:()=>Promise<unknown>)=>{
            const next=queue.then(run);queue=next.then(()=>undefined,()=>undefined);return next;
        }}});
        const options={name:"tabs",maxBytes:8,maxEntryBytes:4,storage:shared.storage};
        const a=createBoundedResponseCache(options),b=createBoundedResponseCache(options);
        await Promise.all([a.write(address("a"),new Response("aaaa")),b.write(address("b"),new Response("bbbb"))]);
        await b.write(address("c"),new Response("cccc"));
        expect([...shared.data.keys()].filter(url=>url.startsWith("https://cache.example/"))).toHaveLength(2);
        expect(await b.read(address("c"))).not.toBeNull();
        await a.retain(new Set([address("c")]));
        expect(await b.read(address("b"))).toBeNull();
    });
});
