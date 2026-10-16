import { describe, expect, it, vi } from "vitest";
import { createPublicAppDiagnosticsRunner, createPublicAppManifestDiagnosticsOptions, createPublicAppPageDiagnosticsOptions } from "../../packages/components/src/app-diagnostics";
import { createAppIdentity } from "../../packages/components/src/app-identity";
import { createAppLocalization } from "../../packages/components/src/localization";
import type { PageDiagnosticsReport } from "../../packages/components/src/page";

describe("Public app diagnostics snapshots", () => {
    it("uses one identity per inspection for both route metadata and manifest", () => {
        const complete = createAppIdentity({ name: "Complete", description: "Description", url: "https://example.test/", themeColor: "#ffffff",
            icons: { png192: "icon.png" } });
        const sparse = createAppIdentity({ name: "Sparse" });
        const identity = vi.fn().mockReturnValueOnce(complete).mockReturnValueOnce(sparse);
        const runner = createPublicAppDiagnosticsRunner({ identity, routes: [{ id: "home", title: "Home" }], log: false });
        const first = runner.inspect();
        expect(identity).toHaveBeenCalledOnce();
        expect(first.sources.map(source => source.id)).toEqual(["routes", "manifest"]);
        expect(first.sources[1]?.status).toBe("healthy");
        const second = runner.inspect();
        expect(identity).toHaveBeenCalledTimes(2);
        expect(second.sources[1]?.status).toBe("needs-attention");
    });

    it("passes strict defaults to an inspectable page and preserves source order", () => {
        const report = { status: "healthy", issues: [], errorCount: 0, warningCount: 0, infoCount: 0 } as unknown as PageDiagnosticsReport;
        const inspect = vi.fn(() => report);
        const runner = createPublicAppDiagnosticsRunner({ page: { inspect }, pageOptions: { documentMetadata: { requireManifest: false } },
            routes: [], manifest: { name: "App" }, sources: [{ id: "custom", report: { status: "blocked" } }], log: false });
        const result = runner.inspect();
        expect(inspect).toHaveBeenCalledWith(expect.objectContaining({ log: false,
            documentMetadata: expect.objectContaining({ requireManifest: false, requireCanonical: true }) }));
        expect(result.sources.map(source => source.id)).toEqual(["page", "routes", "manifest", "custom"]);
        expect(result.status).toBe("blocked");
    });

    it.each([false, null, () => null] as const)("allows explicitly disabled manifest %s without falling back to identity", manifest => {
        const runner = createPublicAppDiagnosticsRunner({ identity: createAppIdentity({ name: "App" }), manifest });
        expect(runner.inspect().sources).toEqual([]);
    });

    it("infers required app messages and lets callers override them", () => {
        const locale = createAppLocalization<"en", "present" | "missing">({ supportedLocales: ["en"], fallbackLocale: "en",
            messages: { en: { present: "Present" } }, requiredMessageSources: [["present", "missing"]],
            requireFrameworkMessages: false, storage: null });
        try {
            const inferred = createPublicAppDiagnosticsRunner({ locale, manifest: false }).inspect();
            expect(inferred.sources[0]?.status).not.toBe("healthy");
            const explicit = createPublicAppDiagnosticsRunner({ locale, localeOptions: { requiredMessages: ["present"] }, manifest: false }).inspect();
            expect(explicit.sources[0]?.status).toBe("healthy");
        } finally { locale.destroy(); }
    });

    it("keeps strict defaults immutable while allowing per-runner overrides", () => {
        const page = createPublicAppPageDiagnosticsOptions({ log: true, documentMetadata: { requireCanonical: false } });
        expect(page.log).toBe(true); expect(page.documentMetadata?.requireCanonical).toBe(false);
        expect(createPublicAppPageDiagnosticsOptions().documentMetadata?.requireCanonical).toBe(true);
        expect(createPublicAppManifestDiagnosticsOptions({ requireIcons: false }).requireIcons).toBe(false);
        expect(createPublicAppManifestDiagnosticsOptions().requireIcons).toBe(true);
    });

    it("skips absent lazy sources and propagates failures without logging", () => {
        const log = vi.fn(); const runner = createPublicAppDiagnosticsRunner({ page: () => null, routes: () => null, locale: () => null, identity: () => null, sources: () => null, log });
        expect(runner.inspect().sources).toEqual([]); expect(log).not.toHaveBeenCalled();
        expect(() => createPublicAppDiagnosticsRunner({ identity: () => { throw new Error("Identity failed"); } }).inspect()).toThrow("Identity failed");
    });
});
