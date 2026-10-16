import { describe, expect, it, vi } from "vitest";
import { createAppRouteSitemapEntries, createAppRouteSitemapXml, inspectAppRouteSitemap, type AppRouteSitemapEntry } from "../../packages/components/src/app-routes";

const entry = { loc: "https://example.test/" };
const codes = (entries: AppRouteSitemapEntry[], options: Parameters<typeof inspectAppRouteSitemap>[1] = {}) => inspectAppRouteSitemap(entries, options).issues.map(issue => issue.code);

describe("Route sitemap generation", () => {
    it("excludes disabled/no-canonical routes before invoking optional metadata resolvers", () => {
        const routes = [{ id: "first", title: "First", href: "/first" }, { id: "disabled", title: "Disabled", disabled: true }, { id: "private", title: "Private" }];
        const getLastModified = vi.fn(() => "2026-10-15");
        const entries = createAppRouteSitemapEntries(routes, { baseUrl: "https://example.test/app/", getCanonical: route => route.id === "private" ? null : undefined,
            getLastModified, getChangeFrequency: () => "weekly", getPriority: () => 0 });
        expect(entries).toEqual([{ loc: "https://example.test/first", route: routes[0], lastmod: "2026-10-15", changefreq: "weekly", priority: 0 }]);
        expect(getLastModified).toHaveBeenCalledOnce();
        expect(createAppRouteSitemapEntries(routes)).toEqual([]);
    });

    it("allows an explicit include/canonical policy and does not mutate routes", () => {
        const route = Object.freeze({ id: "hidden", title: "Hidden", disabled: true });
        const entries = createAppRouteSitemapEntries([route], { includeRoute: () => true, getCanonical: () => new URL("https://example.test/public"),
            getLastModified: () => null, getPriority: () => null, getChangeFrequency: () => null });
        expect(entries).toEqual([{ loc: "https://example.test/public", route }]);
    });

    it("serializes native and foreign-realm dates and rejects invalid Date values", () => {
        const iframe = document.createElement("iframe"); document.body.append(iframe);
        try {
            const ForeignDate = (iframe.contentWindow as unknown as { Date: DateConstructor }).Date;
            const date = new ForeignDate("2026-10-15T12:30:00Z");
            const entries = createAppRouteSitemapEntries([{ id: "home", title: "Home" }], { getCanonical: () => entry.loc, getLastModified: () => date });
            expect(entries[0]?.lastmod).toBe("2026-10-15T12:30:00.000Z");
            expect(() => createAppRouteSitemapEntries([{ id: "home", title: "Home" }], { getCanonical: () => entry.loc, getLastModified: () => new Date(NaN) })).toThrow(RangeError);
        } finally { iframe.remove(); }
    });

    it.each([true, false])("produces parseable escaped XML, pretty=%s", pretty => {
        const text = 'https://example.test/?q=\"<word>\"&other=\'value\'';
        const xml = createAppRouteSitemapXml([{ loc: text, lastmod: "2026-10-15", changefreq: "weekly", priority: 0 }], { pretty });
        const parsed = new DOMParser().parseFromString(xml, "application/xml");
        expect(parsed.querySelector("parsererror")).toBeNull();
        expect(parsed.documentElement.namespaceURI).toBe("http://www.sitemaps.org/schemas/sitemap/0.9");
        expect(parsed.querySelector("loc")?.textContent).toBe(text);
        expect(parsed.querySelector("priority")?.textContent).toBe("0");
        expect(xml.includes("\n")).toBe(pretty);
    });

    it.each(["\u0000", "\u000b", "\ud800", "\udfff", "\ufffe", "\uffff"])("rejects text that XML 1.0 cannot represent (%j)", character => {
        expect(() => createAppRouteSitemapXml([{ loc: entry.loc + character }])).toThrow(TypeError);
    });

    it("retains astral Unicode and prevents injected priority markup", () => {
        const xml = createAppRouteSitemapXml([{ loc: entry.loc + String.fromCodePoint(0x1f600), priority: "</priority><injected/>" as unknown as number }]);
        const parsed = new DOMParser().parseFromString(xml, "application/xml");
        expect(parsed.querySelector("parsererror")).toBeNull(); expect(parsed.querySelector("injected")).toBeNull();
        expect(parsed.querySelector("loc")?.textContent).toBe(entry.loc + String.fromCodePoint(0x1f600));
    });
});

describe("Sitemap diagnostics", () => {
    it.each(["2026", "2026-10", "2026-10-15", "2024-02-29", "2000-02-29", "2026-10-15T12:30Z", "2026-10-15T12:30:45+03:00", "2026-10-15T12:30:45.123456-03:30"])("accepts W3C date %s", lastmod => {
        expect(codes([{ ...entry, lastmod }])).toEqual([]);
    });

    it.each(["0000-01-01", "2026-02-29", "1900-02-29", "2026-04-31", "2026-00-10", "2026-13-01", "2026-01-00", "2026-1-1", "10/15/2026", "October 15, 2026", "2026-10-15 12:30:00Z", "2026-10-15T12:30:00", "2026-10-15T24:00Z", "2026-10-15T12:60Z", "2026-10-15T12:30:60Z", "2026-10-15T12:30+24:00", "2026-10-15T12:30+03:60"])("rejects malformed/impossible date %s", lastmod => {
        expect(codes([{ ...entry, lastmod }])).toContain("sitemap.lastmod.invalid");
    });

    it("finds equivalent URL duplicates and preserves the original entry references", () => {
        const first = { loc: "https://EXAMPLE.test:443" }; const second = { loc: entry.loc };
        const report = inspectAppRouteSitemap([first, second]);
        expect(report.issues[0]).toMatchObject({ code: "sitemap.loc.duplicate", entry: second, relatedEntry: first });
    });

    it("detects mixed hosts, ports and protocols and allows an explicit relaxed policy", () => {
        const entries = [entry, { loc: "http://example.test/other" }, { loc: "https://example.test:8443/" }, { loc: "https://other.test/" }];
        expect(codes(entries)).toEqual(["sitemap.loc.scheme", "sitemap.loc.host", "sitemap.loc.host"]);
        expect(codes(entries, { requireSingleHost: false })).toEqual([]);
    });

    it("does not let an invalid protocol choose the single-host baseline", () => {
        expect(codes([{ loc: "mailto:test@example.test" }, entry])).toEqual(["sitemap.loc.protocol"]);
    });

    it("detects control characters, credentials and fragments without deleting data", () => {
        expect(codes([{ loc: "https://example.test/\npart" }])).toContain("sitemap.loc.characters");
        expect(codes([{ loc: "https://user:password@example.test/" }])).toContain("sitemap.loc.credentials");
        expect(codes([{ loc: entry.loc + "#lesson" }])).toEqual(["sitemap.loc.hash"]);
        expect(codes([{ loc: entry.loc + "#lesson" }], { allowHash: true })).toEqual([]);
    });

    it("enforces the default URL-length boundary and falls back from invalid limits", () => {
        const short = { loc: entry.loc + "x".repeat(2047 - entry.loc.length) };
        const long = { loc: short.loc + "x" };
        expect(codes([short])).toEqual([]); expect(codes([long])).toContain("sitemap.loc.too-long");
        expect(codes([long], { maxLocLength: NaN })).toContain("sitemap.loc.too-long");
        expect(codes([long], { maxLocLength: 3000 })).toEqual([]);
    });

    it("reports empty/relative URLs and invalid optional values without mutating entries", () => {
        expect(codes([])).toEqual(["sitemap.empty"]);
        expect(codes([{ loc: " " }, { loc: "/relative" }])).toEqual(["sitemap.loc.empty", "sitemap.loc.invalid"]);
        const value = Object.freeze({ ...entry, lastmod: " ", priority: Infinity, changefreq: "bad" as "weekly" });
        expect(codes([value])).toEqual(["sitemap.lastmod.empty", "sitemap.changefreq.invalid", "sitemap.priority.invalid"]);
    });
});
