import { describe, expect, it } from "vitest";
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
