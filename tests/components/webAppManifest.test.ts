import { describe, expect, it } from "vitest";
import { createAppWebAppManifest, createWebAppManifest, createWebAppManifestJson, inspectWebAppManifest } from "../../packages/components/src/web-app-manifest";

describe("Web app manifest generation and diagnostics", () => {
    it("provides low-level and app defaults while respecting explicit omissions", () => {
        expect(createWebAppManifest({ name: "App" })).toEqual({ name: "App", start_url: ".", display: "standalone" });
        expect(createAppWebAppManifest({ name: "App", themeColor: "#fff" })).toMatchObject({ scope: ".", background_color: "#fff" });
        const omitted = createAppWebAppManifest({ name: "App", startUrl: null, scope: null, display: null, backgroundColor: null, themeColor: "#fff" });
        for (const key of ["start_url", "scope", "display", "background_color"]) expect(omitted).not.toHaveProperty(key);
    });

    it("serializes URLs and copies typed collections without changing caller data", () => {
        const categories = ["education"]; const displayOverride = ["standalone"];
        const icon = { src: new URL("https://example.test/icon.png"), sizes: "192x192", type: "image/png", formFactor: "wide" };
        const manifest = createWebAppManifest({ name: "App", categories, displayOverride, icons: [icon], startUrl: new URL("https://example.test/"),
            shortcuts: [{ name: "Lessons", shortName: "Learn", url: new URL("https://example.test/#lessons"), icons: [icon] }] });
        categories.push("games"); displayOverride.push("browser"); icon.sizes = "512x512";
        expect(manifest.categories).toEqual(["education"]); expect(manifest.display_override).toEqual(["standalone"]);
        expect(manifest.icons).toEqual([expect.objectContaining({ src: "https://example.test/icon.png", sizes: "192x192", form_factor: "wide" })]);
        expect(JSON.parse(createWebAppManifestJson({ name: "App" })).name).toBe("App");
    });

    it("expands the icon set before custom icons and null suppresses the complete set", () => {
        const iconSet = { svg: "logo.svg", png192: "192.png", png512: "512.png" };
        const manifest = createAppWebAppManifest({ name: "App", iconSet, icons: [{ src: "custom.png" }] });
        expect((manifest.icons as Array<{ src: string }>).map(icon => icon.src)).toEqual(["logo.svg", "192.png", "512.png", "custom.png"]);
        expect(createAppWebAppManifest({ name: "App", iconSet, icons: null })).not.toHaveProperty("icons");
        expect(createAppWebAppManifest({ name: "App", iconSet: false })).not.toHaveProperty("icons");
    });

    it("keeps extras as own JSON members, including prototype-shaped names", () => {
        const manifest = createWebAppManifest({ name: "Original", extras: JSON.parse('{"name":"Override","__proto__":{"injected":true},"constructor":"custom"}') });
        expect(Object.getPrototypeOf(manifest)).toBe(Object.prototype);
        expect(Object.prototype.hasOwnProperty.call(manifest, "__proto__")).toBe(true);
        expect(manifest.injected).toBeUndefined(); expect(manifest.name).toBe("Override");
        expect(JSON.parse(JSON.stringify(manifest)).__proto__).toEqual({ injected: true });
    });

    it.each([undefined, null, "", "   ", 42])("rejects an unusable required name %s", name => {
        const report = inspectWebAppManifest({ name } as unknown as { name: string });
        expect(report.status).toBe("blocked"); expect(report.errorCount).toBe(1);
    });

    it("checks supplied optional string shapes without inventing platform support rules", () => {
        const report = inspectWebAppManifest({ name: "App", lang: 1, dir: false, id: {}, scope: [], orientation: 12, display: "future-display-mode" });
        expect(report.errorCount).toBe(5);
        expect(report.issues.map(issue => issue.member)).toEqual(["lang", "dir", "id", "scope", "orientation"]);
    });

    it("does not count a maskable declaration without an icon source as a usable icon", () => {
        const report = inspectWebAppManifest({ name: "App", icons: [{ purpose: "maskable", sizes: 192, type: null }] }, { requireMaskableIcon: true });
        expect(report.errorCount).toBe(3);
        expect(report.issues.some(issue => issue.code === "manifest.icon.maskable.missing")).toBe(true);
    });

    it("keeps missing size/type informational and accepts an ordinary generated app manifest", () => {
        expect(inspectWebAppManifest({ name: "App", icons: [{ src: "icon.png" }] })).toMatchObject({ status: "healthy", infoCount: 2 });
        const manifest = createAppWebAppManifest({ name: "App", shortName: "App", description: "Description", themeColor: "#fff", iconSet: { png192: "icon.png" } });
        expect(inspectWebAppManifest(manifest, { requireIcons: true, requireMaskableIcon: true }).status).toBe("healthy");
    });

    it("reports malformed icon and shortcut arrays without altering their data", () => {
        const manifest = Object.freeze({ name: "App", icons: Object.freeze([]), shortcuts: [null, { name: "", url: "" }] });
        const report = inspectWebAppManifest(manifest);
        expect(report.errorCount).toBe(3); expect(report.warningCount).toBe(1);
        expect(inspectWebAppManifest({ name: "App", icons: {}, shortcuts: 1 }).errorCount).toBe(2);
    });
});
