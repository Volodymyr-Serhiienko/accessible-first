import { afterEach, describe, expect, it, vi } from "vitest";
import { createDocumentMetadata, createAppDocumentMetadata, type DocumentMetadataStructuredData } from "../../packages/components/src/document-metadata";
import { createPublicHashAppTemplate } from "../../packages/components/src/public-app";

const cleanups: Array<() => void> = [];
const own = (options: Parameters<typeof createDocumentMetadata>[0] = {}) => {
    const value = createDocumentMetadata(options); cleanups.push(value.destroy); return value;
};
function doc() { const value = document.implementation.createHTMLDocument("Original title"); value.documentElement.lang = "en"; return value; }
function meta(owner: Document, key: string, content: string, attribute = "name") {
    const element = owner.createElement("meta"); element.setAttribute(attribute, key); element.content = content; owner.head.append(element); return element;
}
function link(owner: Document, rel: string, href: string) {
    const element = owner.createElement("link"); element.rel = rel; element.setAttribute("href", href); owner.head.append(element); return element;
}
afterEach(() => {
    cleanups.splice(0).reverse().forEach(cleanup => { try { cleanup(); } catch { /* Expected cleanup failure. */ } });
    vi.restoreAllMocks();
});

describe("Hash template document-title priority", () => {
    const routes = ["First", "Second"].map(title => ({ id: title.toLowerCase(), title, render: () => document.createElement("p") }));
    const navigate = { scroll: false, announcement: false, focusTarget: null, updateHistory: false } as const;

    it("keeps route titles after shell refresh without rendering or resolving metadata twice", () => {
        const getMetadata = vi.fn((route: { title: string }) => ({ title: route.title }));
        const app = createPublicHashAppTemplate({ routes, start: false, diagnostics: false, refreshChromeOnRouteChange: true,
            shell: { title: () => "Application", metadata: () => ({ title: "Application metadata", robots: "noindex" }) },
            routeChrome: { header: false, navigation: false, breadcrumbs: false, search: false, commands: false }, router: { getDocumentMetadata: getMetadata } });
        cleanups.push(app.destroy);
        app.router.navigate("first", navigate); expect(document.title).toBe("First"); expect(getMetadata).toHaveBeenCalledOnce();
        app.refreshChrome(); expect(document.title).toBe("First"); expect(getMetadata).toHaveBeenCalledOnce();
        app.router.navigate("second", navigate); expect(document.title).toBe("Second"); expect(getMetadata).toHaveBeenCalledTimes(2);
    });

    it("preserves default router titles even when generated route metadata is disabled", () => {
        const app = createPublicHashAppTemplate({ routes, start: false, diagnostics: false, routeMetadata: false,
            refreshChromeOnRouteChange: true, shell: { title: () => "Application" }, routeChrome: true }); cleanups.push(app.destroy);
        app.router.navigate("first", navigate); expect(document.title).toBe("First");
        app.router.navigate("second", navigate); expect(document.title).toBe("Second");
    });

    it("still allows an explicit route-chrome title override", () => {
        const app = createPublicHashAppTemplate({ routes, start: false, diagnostics: false, refreshChromeOnRouteChange: true,
            shell: { title: () => "Application" }, routeChrome: { header: false, navigation: false, breadcrumbs: false, search: false, commands: false, shell: { title: "Explicit override" } } });
        cleanups.push(app.destroy); app.router.navigate("first", navigate); expect(document.title).toBe("Explicit override");
    });
});

describe("DocumentMetadata lifecycle and head ownership", () => {
    it("does not restore title or language it never changed", () => {
        const owner = doc(); const controller = own({ document: owner, description: "Managed" });
        owner.title = "Other owner"; owner.documentElement.lang = "uk"; controller.destroy();
        expect(owner.title).toBe("Other owner"); expect(owner.documentElement.lang).toBe("uk");
    });

    it("captures title and language at their first actual ownership", () => {
        const owner = doc(); const controller = own({ document: owner }); owner.title = "Before first write"; owner.documentElement.lang = "pl";
        controller.update({ title: "Owned", lang: "ru" }); controller.destroy();
        expect(owner.title).toBe("Before first write"); expect(owner.documentElement.lang).toBe("pl");
    });

    it("restores an absent language and resets individual fields to their baseline", () => {
        const owner = doc(); owner.documentElement.removeAttribute("lang"); const description = meta(owner, "description", "Authored");
        const controller = own({ document: owner, title: "Managed", lang: "ru", description: "New" });
        controller.update({ title: null, lang: null, description: null });
        expect(owner.title).toBe("Original title"); expect(owner.documentElement.hasAttribute("lang")).toBe(false); expect(description.content).toBe("Authored");
    });

    it("leaves every late mutation inert and repeated destroy does not undo later owners", () => {
        const owner = doc(); const controller = own({ document: owner, title: "Owned" }); controller.destroy(); owner.title = "Next owner";
        const html = owner.documentElement.outerHTML;
        controller.update({ title: "Late", lang: "ru", icons: [{ href: "late.svg" }], structuredData: { late: true }, canonical: "https://late.test/" }); controller.destroy();
        expect(owner.documentElement.outerHTML).toBe(html);
    });

    it("preserves borrowed node identities and unrelated attributes", () => {
        const owner = doc(); const canonical = link(owner, "alternate Canonical", "/original"); canonical.dataset.extra = "before";
        const description = meta(owner, "Description", "Authored");
        const controller = own({ document: owner, canonical: "https://example.test/new", description: "New" });
        canonical.dataset.extra = "after"; controller.destroy();
        expect(owner.head.querySelectorAll("link")).toHaveLength(1); expect(canonical.rel).toBe("alternate Canonical");
        expect(canonical.getAttribute("href")).toBe("/original"); expect(canonical.dataset.extra).toBe("after");
        expect(owner.head.querySelector("meta[name='Description']")).toBe(description); expect(description.content).toBe("Authored");
    });

    it("restores removed authored meta and cleans its managed replacement", () => {
        const owner = doc(); const original = meta(owner, "description", "Authored"); const controller = own({ document: owner, description: "First" });
        original.remove(); controller.update({ description: "Replacement" }); const replacement = owner.head.querySelector("meta[name='description']")!;
        controller.destroy(); expect(owner.head.querySelector("meta[name='description']")).toBe(original); expect(original.content).toBe("Authored");
        expect(replacement.parentNode).toBeNull();
    });

    it("removes generated tags even if another integration moved or renamed them", () => {
        const owner = doc(); const controller = own({ document: owner, description: "Owned", canonical: "/owned" });
        const description = owner.head.querySelector("meta[name='description']")!; const canonical = owner.head.querySelector("link")!;
        owner.body.append(description, canonical); description.setAttribute("name", "moved"); controller.destroy();
        expect(description.parentNode).toBeNull(); expect(canonical.parentNode).toBeNull();
    });

    it("does not remove unrelated tags inserted by another integration", () => {
        const owner = doc(); const controller = own({ document: owner, description: "Owned" }); const external = meta(owner, "description", "External");
        controller.destroy(); expect(external.parentNode).toBe(owner.head); expect(external.content).toBe("External");
    });

    it("clears stale manifest credentials when switching to the string form", () => {
        const owner = doc(); const manifest = link(owner, "Manifest", "original.webmanifest"); manifest.setAttribute("crossorigin", "anonymous");
        const controller = own({ document: owner, manifest: { href: "new.webmanifest", crossOrigin: "use-credentials" } });
        controller.update({ manifest: "plain.webmanifest" }); expect(manifest.hasAttribute("crossorigin")).toBe(false);
        controller.destroy(); expect(manifest.getAttribute("crossorigin")).toBe("anonymous"); expect(manifest.getAttribute("href")).toBe("original.webmanifest");
    });

    it("retains unchanged managed icons and structured-data elements", () => {
        const owner = doc(); const options = { icons: [{ href: "logo.svg" }], structuredData: { "@type": "WebSite", name: "Fixture" } };
        const controller = own({ document: owner, ...options }); const icon = owner.head.querySelector("link"); const script = owner.head.querySelector("script");
        controller.update(options); expect(owner.head.querySelector("link")).toBe(icon); expect(owner.head.querySelector("script")).toBe(script);
    });

    it("preserves authored icons and JSON-LD while replacing only generated content", () => {
        const owner = doc(); const icon = link(owner, "icon", "authored.svg"); const script = owner.createElement("script"); script.type = "application/ld+json"; owner.head.append(script);
        const controller = own({ document: owner, icons: [{ href: "generated.svg" }], structuredData: { name: "Generated" } });
        controller.update({ icons: null, structuredData: null }); expect(owner.head.querySelectorAll("link")).toHaveLength(1);
        expect(icon.parentNode).toBe(owner.head); expect(script.parentNode).toBe(owner.head);
    });

    it("keeps the existing document intact when JSON preparation fails", () => {
        const owner = doc(); const controller = own({ document: owner, title: "Stable", structuredData: { name: "Stable" } });
        const circular: Record<string, unknown> = {}; circular.self = circular; const html = owner.documentElement.outerHTML;
        expect(() => controller.update({ title: "Obsolete", structuredData: circular as DocumentMetadataStructuredData })).toThrow();
        expect(owner.documentElement.outerHTML).toBe(html);
    });

    it("does not rewrite unchanged named or social meta attributes", () => {
        const owner = doc(); const controller = own({ document: owner, description: "Stable", openGraph: { title: "Stable" } });
        const description = owner.head.querySelector("meta[name='description']")!; const social = owner.head.querySelector("meta[property='og:title']")!;
        const namedWrite = vi.spyOn(description, "setAttribute"); const socialWrite = vi.spyOn(social, "setAttribute");
        controller.update({ description: "Stable", openGraph: { title: "Stable" } });
        expect(namedWrite).not.toHaveBeenCalled(); expect(socialWrite).not.toHaveBeenCalled();
    });

    it("replaces social groups without leaving old generated image details", () => {
        const owner = doc(); const site = meta(owner, "og:site_name", "Authored", "property");
        const controller = own({ document: owner, openGraph: { title: "First", siteName: "Managed", image: { url: "https://example.test/a.png", width: 512, alt: "First image" } } });
        controller.update({ openGraph: { title: "Next" } });
        expect(owner.head.querySelector("meta[property='og:image'],meta[property='og:image:width'],meta[property='og:image:alt']")).toBeNull();
        expect(site.content).toBe("Authored"); expect(owner.head.querySelector("meta[property='og:title']")?.getAttribute("content")).toBe("Next");
    });

    it("does not erase old icons when preparing a replacement icon fails", () => {
        const owner = doc(); const controller = own({ document: owner, icons: [{ href: "stable.svg" }] }); const icon = owner.head.querySelector("link");
        expect(() => controller.update({ icons: [{ get href(): string { throw new Error("icon preparation"); } }] })).toThrow("icon preparation");
        expect(owner.head.querySelector("link")).toBe(icon);
    });

    it("uses the newer update started by a URL serializer", () => {
        const owner = doc(); const controller = own({ document: owner });
        const url = new URL("https://old.test/"); url.toString = () => { controller.update({ title: "Latest", description: "Latest" }); return "https://old.test/"; };
        controller.update({ title: "Obsolete", canonical: url, description: "Obsolete" });
        expect(owner.title).toBe("Latest"); expect(owner.head.querySelector("meta[name='description']")?.getAttribute("content")).toBe("Latest"); expect(owner.head.querySelector("link")).toBeNull();
    });

    it("does not commit after a JSON serializer destroys the controller", () => {
        const owner = doc(); const controller = own({ document: owner, title: "Owned" });
        const data = { toJSON() { controller.destroy(); return { name: "Late" }; } } as unknown as DocumentMetadataStructuredData;
        controller.update({ title: "Late", structuredData: data }); expect(owner.title).toBe("Original title"); expect(owner.head.querySelector("script")).toBeNull();
    });

    it("escapes raw HTML delimiters while keeping valid JSON-LD values", () => {
        const owner = doc(); own({ document: owner, structuredData: { name: "</script><img src=x>" } });
        const script = owner.head.querySelector("script")!; expect(script.textContent).not.toContain("<");
        expect(JSON.parse(script.textContent!)).toEqual({ name: "</script><img src=x>" }); expect(owner.head.querySelector("img")).toBeNull();
    });

    it("attempts every teardown after one borrowed tag restoration fails", () => {
        const owner = doc(); const description = meta(owner, "description", "Authored");
        const controller = own({ document: owner, title: "Owned", lang: "ru", description: "Owned", robots: "noindex", icons: [{ href: "logo.svg" }], structuredData: { name: "Owned" } });
        vi.spyOn(description, "setAttribute").mockImplementation(() => { throw new Error("restore tag"); });
        expect(() => controller.destroy()).toThrow("restore tag");
        expect(owner.title).toBe("Original title"); expect(owner.documentElement.lang).toBe("en");
        expect(owner.head.querySelector("meta[name='robots'], link, script")).toBeNull();
    });

    it("cleans completed construction work after a later DOM write fails", () => {
        const owner = doc(); const append = owner.head.append.bind(owner.head);
        vi.spyOn(owner.head, "append").mockImplementation((...nodes) => {
            if (nodes.some(node => typeof node !== "string" && node.nodeName === "LINK")) throw new Error("head write");
            append(...nodes);
        });
        expect(() => createDocumentMetadata({ document: owner, title: "Temporary", description: "Temporary", icons: [{ href: "logo.svg" }] })).toThrow("head write");
        expect(owner.title).toBe("Original title"); expect(owner.head.querySelector("meta[name='description'], link")).toBeNull();
    });

    it("resolves same-origin iframe URL values in metadata and app recipes", () => {
        const iframe = document.createElement("iframe"); document.body.append(iframe); const frame = iframe.contentWindow as Window & typeof globalThis;
        const foreign = new frame.URL("https://example.test/image.png");
        const recipe = createAppDocumentMetadata({ name: "Fixture", image: foreign, softwareApplication: {} });
        expect(recipe.twitter?.image).toBe(foreign); expect(recipe.structuredData).toEqual(expect.objectContaining({ image: foreign.href }));
        const owner = doc(); own({ document: owner, openGraph: { image: foreign }, canonical: foreign });
        expect(owner.head.querySelector("meta[property='og:image']")?.getAttribute("content")).toBe(foreign.href);
        iframe.remove();
    });
});
