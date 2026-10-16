import { afterEach, describe, expect, it, vi } from "vitest";
import { createAppIdentity, createAppIdentityDocumentMetadata, createAppIdentityRouteDiagnosticsOptions,
    createAppIdentityRouteDocumentMetadata, createAppIdentityRouteDocumentMetadataOptions, createAppIdentityWebAppManifest } from "../../packages/components/src/app-identity";
import { createAppRouteDocumentMetadata, inspectAppRoutes, type AppRouteDescriptor } from "../../packages/components/src/app-routes";
import { createAppLocalization } from "../../packages/components/src/localization";
import { createPublicStaticAppTemplate, createPublicHashAppTemplate, createPublicLinkAppTemplate } from "../../packages/components/src/public-app";
import { P } from "../../packages/components/src";
import type { DocumentMetadataStructuredDataValue } from "../../packages/components/src/document-metadata";

const cleanups: Array<() => void> = [];
afterEach(() => { cleanups.splice(0).reverse().forEach(cleanup => cleanup()); });
const identity = () => createAppIdentity({ name: "App", description: "App description", url: "https://example.test/", lang: "en", themeColor: "#fff",
    icons: { svg: "logo.svg", png192: "192.png", png512: "512.png", preview: { url: "preview.png", alt: "Preview" } }, softwareApplication: { operatingSystem: "Web" } });
const data = (value: unknown) => value as Record<string, DocumentMetadataStructuredDataValue>;
const route: AppRouteDescriptor = { id: "home", title: "Home", href: "/home", description: "Home description" };

describe("App identity recipes", () => {
    it("copies and freezes the identity records/arrays without freezing caller-owned nested data", () => {
        const categories = ["education"]; const softwareApplication = { operatingSystem: "Web" };
        const options = { name: "App", description: "Description", themeColor: "#fff", categories, softwareApplication };
        const app = createAppIdentity(options); categories.push("games"); softwareApplication.operatingSystem = "Changed";
        expect(app).toMatchObject({ shortName: "App", socialDescription: "Description", twitterDescription: "Description", softwareDescription: "Description", backgroundColor: "#fff", categories: ["education"], softwareApplication: { operatingSystem: "Web" } });
        expect([app, app.icons, app.categories, app.softwareApplication].every(Object.isFrozen)).toBe(true);
        expect(Object.isFrozen(options)).toBe(false);
    });

    it("maps identity defaults to metadata and manifest while preserving explicit per-call omissions", () => {
        const app = identity(); const metadata = createAppIdentityDocumentMetadata(app);
        expect(metadata).toMatchObject({ title: "App", canonical: "https://example.test/", description: "App description", icons: [{ href: "logo.svg", type: "image/svg+xml" }] });
        expect(createAppIdentityDocumentMetadata(app, { description: null, canonical: null, icons: null, openGraph: false, twitter: null, structuredData: false }))
            .toMatchObject({ description: null, canonical: null, icons: null, twitter: null });
        const omitted = createAppIdentityDocumentMetadata(app, { openGraph: false, structuredData: false });
        expect(omitted).not.toHaveProperty("openGraph"); expect(omitted).not.toHaveProperty("structuredData");
        const manifest = createAppIdentityWebAppManifest(app, { name: "Local name", icons: null, scope: null });
        expect(manifest.name).toBe("Local name"); expect(manifest).not.toHaveProperty("icons"); expect(manifest).not.toHaveProperty("scope");
    });

    it("keeps SoftwareApplication additional JSON members as data, not object prototypes", () => {
        const metadata = createAppIdentityDocumentMetadata(identity(), { softwareApplication: { additionalData: JSON.parse('{"__proto__":{"injected":true},"name":"Custom"}') } });
        const structured = data(metadata.structuredData);
        expect(Object.getPrototypeOf(structured)).toBe(Object.prototype); expect(structured.injected).toBeUndefined();
        expect(Object.prototype.hasOwnProperty.call(structured, "__proto__")).toBe(true); expect(structured.name).toBe("Custom");
    });

    it("uses final route overrides in generated WebPage JSON-LD and does not call unused fallbacks", () => {
        const getTitle = vi.fn(() => "Unused"); const getDescription = vi.fn(() => "Unused"); const getCanonical = vi.fn(() => "https://unused.test/");
        const metadata = createAppIdentityRouteDocumentMetadata(identity(), { ...route, metadata: { title: "Explicit", description: "Explicit description", canonical: "https://example.test/final" } },
            { getTitle, getDescription, getCanonical });
        expect(data(metadata.structuredData)).toMatchObject({ name: "Explicit", description: "Explicit description", url: "https://example.test/final" });
        for (const resolver of [getTitle, getDescription, getCanonical]) expect(resolver).not.toHaveBeenCalled();
    });

    it("resolves each fallback once per route snapshot and keeps repeated calls fresh", () => {
        const getMetadata = vi.fn(() => ({})); const getTitle = vi.fn(() => "Resolved title");
        const getDescription = vi.fn(() => "Resolved description"); const getCanonical = vi.fn(() => "https://example.test/resolved");
        const options = createAppIdentityRouteDocumentMetadataOptions(identity(), { getMetadata, getTitle, getDescription, getCanonical });
        const first = createAppRouteDocumentMetadata(route, options);
        expect(data(first.structuredData)).toMatchObject({ name: first.title, description: first.description, url: first.canonical });
        for (const resolver of [getMetadata, getTitle, getDescription, getCanonical]) expect(resolver).toHaveBeenCalledOnce();
        createAppRouteDocumentMetadata(route, options);
        for (const resolver of [getMetadata, getTitle, getDescription, getCanonical]) expect(resolver).toHaveBeenCalledTimes(2);
    });

    it("supplies custom structured-data resolvers a separate resolved snapshot", () => {
        const structured = { "@type": "WebPage" }; const getStructuredData = vi.fn((_route, snapshot) => { snapshot.title = "Mutated copy"; return structured; });
        const metadata = createAppRouteDocumentMetadata(route, { getStructuredData });
        expect(metadata.title).toBe("Home"); expect(metadata.structuredData).toBe(structured);
        expect(getStructuredData).toHaveBeenCalledWith(route, expect.objectContaining({ description: "Home description" }));
    });

    it.each([null, { "@type": "Custom" }])("does not run a structured-data fallback over explicit %j", structuredData => {
        const getStructuredData = vi.fn(() => { throw new Error("Unused"); });
        const metadata = createAppIdentityRouteDocumentMetadata(identity(), { ...route, metadata: { title: null, description: null, canonical: null, structuredData } }, { getStructuredData });
        expect(metadata).toMatchObject({ title: null, description: null, canonical: null, structuredData });
        expect(getStructuredData).not.toHaveBeenCalled();
    });

    it("supports directly invoking the generated resolver and disabling generated WebPage data", () => {
        const options = createAppIdentityRouteDocumentMetadataOptions(identity());
        expect(data(options.getStructuredData?.(route))).toMatchObject({ name: "Home - App", url: "https://example.test/home" });
        expect(createAppIdentityRouteDocumentMetadata(identity(), route, { webPageStructuredData: false })).not.toHaveProperty("structuredData");
    });

    it("normalizes foreign-realm URL values before returning route JSON-LD", () => {
        const iframe = document.createElement("iframe"); document.body.append(iframe);
        try {
            const ForeignURL = (iframe.contentWindow as unknown as { URL: typeof URL }).URL;
            const url = new ForeignURL("https://example.test/foreign");
            const metadata = createAppIdentityRouteDocumentMetadata(identity(), route, { getCanonical: () => url, webSiteUrl: url });
            expect(data(metadata.structuredData).url).toBe("https://example.test/foreign");
            expect(data(data(metadata.structuredData).isPartOf).url).toBe("https://example.test/foreign");
        } finally { iframe.remove(); }
    });

    it("checks final metadata overrides rather than warning about unused route defaults", () => {
        const sparse = { id: "home", title: "", metadata: { title: "Actual title", description: "Actual description", canonical: "https://example.test/", structuredData: { "@context": "https://schema.org", "@type": "WebPage" } } };
        const report = inspectAppRoutes([sparse], { requireDescription: true, requireDocumentTitle: true, requireCanonical: true, requireStructuredData: true });
        expect(report.issues.map(issue => issue.code).filter(code => code.startsWith("route.document") || code.startsWith("route.description"))).toEqual([]);
        const cleared = inspectAppRoutes([{ ...route, metadata: { title: null, description: null } }], { requireDescription: true, requireDocumentTitle: true });
        expect(cleared.issues.map(issue => issue.code)).toEqual(["route.description.missing", "route.document-title.missing"]);
    });

    it("shares the final diagnostics snapshot with identity JSON-LD without duplicate lookups", () => {
        const getMetadata = vi.fn(() => ({ title: "Final title", description: "Final description", canonical: "https://example.test/final" }));
        const options = createAppIdentityRouteDiagnosticsOptions(identity(), { getMetadata });
        const original = options.getStructuredData!;
        options.getStructuredData = vi.fn((current, snapshot) => original(current, snapshot));
        expect(inspectAppRoutes([route], options).status).toBe("healthy");
        expect(getMetadata).toHaveBeenCalledOnce();
        expect(options.getStructuredData).toHaveBeenCalledWith(route, expect.objectContaining({ title: "Final title", description: "Final description" }));
    });
});

describe("Public template metadata refresh", () => {
    it.each([false, true])("lets explicit shell title override identity, with metadata priority=%s", withMetadata => {
        const app = createPublicStaticAppTemplate({ identity: identity(), content: P("Content"), diagnostics: false,
            shell: { title: "Shell title", ...(withMetadata ? { metadata: { title: "Metadata title" } } : {}) } }); cleanups.push(app.destroy);
        expect(document.title).toBe(withMetadata ? "Metadata title" : "Shell title");
        app.refresh(); expect(document.title).toBe(withMetadata ? "Metadata title" : "Shell title");
    });
    it("refreshes identity metadata once without rerendering content when requested", () => {
        let current = createAppIdentity({ name: "First", description: "First description", url: "https://example.test/first" });
        const resolve = vi.fn(() => current); const content = vi.fn(() => P("Stable content")); const metadata = vi.fn(() => ({ robots: "noindex" }));
        const app = createPublicStaticAppTemplate({ identity: resolve, shell: { metadata }, content, diagnostics: false }); cleanups.push(app.destroy);
        resolve.mockClear(); metadata.mockClear();
        current = createAppIdentity({ name: "Second", description: "Second description", url: "https://example.test/second" });
        app.refresh({ content: false });
        expect(document.title).toBe("Second"); expect(document.querySelector('meta[name="description"]')?.getAttribute("content")).toBe("Second description");
        expect(document.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe("https://example.test/second");
        expect(document.querySelector('meta[name="robots"]')?.getAttribute("content")).toBe("noindex");
        expect(resolve).toHaveBeenCalledOnce(); expect(metadata).toHaveBeenCalledOnce(); expect(content).toHaveBeenCalledOnce();
    });

    it("refreshes locale-dependent identity and honors explicit metadata disable", () => {
        const locale = createAppLocalization({ supportedLocales: ["en", "uk"], initialLocale: "en", fallbackLocale: "en", storage: null, navigatorSource: null }); cleanups.push(locale.destroy);
        const app = createPublicStaticAppTemplate({ identity: () => createAppIdentity({ name: locale.getLocale(), lang: locale.getLocale() }),
            locale, localeRefresh: { schedule: "sync" }, content: () => P("Content"), diagnostics: false }); cleanups.push(app.destroy);
        locale.setLocale("uk"); expect(document.title).toBe("uk"); expect(document.documentElement.lang).toBe("uk");
        app.destroy();
        document.title = "Authored";
        const disabled = createPublicStaticAppTemplate({ identity: identity(), shell: { metadata: false }, content: P("Content"), diagnostics: false }); cleanups.push(disabled.destroy);
        disabled.refresh(); expect(document.title).toBe("Authored");
    });

    it.each(["hash", "link"] as const)("keeps %s route metadata after manual chrome refresh", kind => {
        const shell = { title: () => "Shell title", metadata: () => ({ title: "Shell metadata" }) };
        const chrome = { header: false, navigation: false, breadcrumbs: false, search: false, commands: false } as const;
        if (kind === "hash") {
            const app = createPublicHashAppTemplate({ routes: [{ ...route, render: () => P("Home") }], identity: identity(), shell, routeChrome: chrome, start: false, diagnostics: false, initialScrollReset: false }); cleanups.push(app.destroy);
            app.router.navigate("home", { scroll: false, announcement: false, focusTarget: null, updateHistory: false });
            expect(document.title).toBe("Home - App"); app.refreshChrome(); expect(document.title).toBe("Home - App");
        } else {
            const app = createPublicLinkAppTemplate({ routes: [route], current: "home", identity: identity(), shell, routeChrome: chrome, diagnostics: false }); cleanups.push(app.destroy);
            expect(document.title).toBe("Home - App"); app.refreshChrome(); expect(document.title).toBe("Home - App");
        }
    });
});
