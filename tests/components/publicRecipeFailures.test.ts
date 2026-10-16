import { afterEach, describe, expect, it, vi } from "vitest";
import { createHashRoutedApp, createLinkRoutedApp, createPublicHashRoutedApp, createPublicLinkRoutedApp, createPublicStaticAppTemplate, createLocaleRefresh, P } from "../../packages/components/src";
import type { LocaleChangeDetail } from "../../packages/components/src/localization";

const cleanups: Array<() => void> = [];
afterEach(() => { cleanups.splice(0).reverse().forEach(cleanup => { try { cleanup(); } catch { /* Expected teardown failure. */ } }); vi.restoreAllMocks(); });
const route = { id: "home", title: "Home", href: "/", render: () => P("Home") };
const startOptions = { scroll: false, announcement: false, focusTarget: null } as const;
function localeFixture() {
    let listener: ((detail: LocaleChangeDetail<"en">) => void) | undefined;
    const unsubscribe = vi.fn(); const getLocale = vi.fn(() => "en" as const);
    return { unsubscribe, getLocale, emit: () => listener?.({ locale: "en", previousLocale: "en", source: "programmatic" }),
        locale: { getLocale, subscribe: vi.fn((next: typeof listener) => { listener = next; return unsubscribe; }) } };
}

describe("Public recipe failed setup", () => {
    it("cleans the shell when hash router construction fails", () => {
        const destroy = vi.fn();
        expect(() => createHashRoutedApp({ routes: [], shell: { content: { element: document.createElement("p"), destroy }, title: "Temporary" } })).toThrow("at least one route");
        expect(destroy).toHaveBeenCalledOnce(); expect(document.title).not.toBe("Temporary");
    });

    it.each(["hash", "link"] as const)("unsubscribes and destroys the %s shell after chrome setup fails", kind => {
        const locale = localeFixture(); const destroy = vi.fn(); const error = new Error("Chrome failed");
        const options = { routes: [route], locale: locale.locale, shell: { content: { element: document.createElement("p"), destroy } }, renderChrome: () => { throw error; } };
        expect(() => kind === "hash" ? createHashRoutedApp({ ...options, start: false }) : createLinkRoutedApp(options)).toThrow(error);
        expect(locale.unsubscribe).toHaveBeenCalledOnce(); expect(destroy).toHaveBeenCalledOnce();
        locale.emit(); expect(locale.unsubscribe).toHaveBeenCalledOnce();
    });

    it.each(["hash", "link", "static"] as const)("cleans a %s shell after a mount target failure", kind => {
        const destroy = vi.fn(); const shell = { content: { element: document.createElement("p"), destroy } };
        expect(() => kind === "hash" ? createHashRoutedApp({ routes: [route], shell, mount: "#missing-target", start: false })
            : kind === "link" ? createLinkRoutedApp({ routes: [route], shell, mount: "#missing-target" })
                : createPublicStaticAppTemplate({ content: shell.content, mount: "#missing-target", diagnostics: false })).toThrow();
        expect(destroy).toHaveBeenCalledOnce();
    });

    it.each(["hash", "link", "static"] as const)("cleans the mounted %s app if a diagnostics logger throws", kind => {
        const target = document.createElement("div"); document.body.append(target);
        const destroy = vi.fn(); const error = new Error("Logger failed"); const content = { element: document.createElement("p"), destroy };
        const diagnostics = { page: false as const, routes: false as const, log: () => { throw error; } };
        expect(() => kind === "hash" ? createPublicHashRoutedApp({ routes: [route], shell: { content }, mount: target, startOptions, diagnostics: { ...diagnostics, logOnRouteChange: true }, initialScrollReset: false })
            : kind === "link" ? createPublicLinkRoutedApp({ routes: [route], shell: { content }, mount: target, diagnostics: { ...diagnostics, logOnCreate: true } })
                : createPublicStaticAppTemplate({ content, mount: target, diagnostics: { page: false, log: diagnostics.log } })).toThrow(error);
        expect(target.children).toHaveLength(0); expect(destroy).toHaveBeenCalledOnce();
    });

    it("preserves the original startup error even if child destruction also fails", () => {
        const error = new Error("Original startup error");
        const target = document.createElement("div"); document.body.append(target);
        expect(() => createPublicStaticAppTemplate({ content: { element: document.createElement("p"), destroy: () => { throw new Error("Cleanup failed"); } }, mount: target,
            diagnostics: { page: false, log: () => { throw error; } } })).toThrow(error);
        expect(target.children).toHaveLength(0);
    });

    it.each(["hash", "link", "static"] as const)("does not resolve diagnostics or log after the %s app is destroyed", kind => {
        const sources = vi.fn(() => []); const log = vi.fn();
        const diagnostics = { page: false as const, routes: false as const, sources, log };
        const app = kind === "hash" ? createPublicHashRoutedApp({ routes: [route], start: false, diagnostics, initialScrollReset: false })
            : kind === "link" ? createPublicLinkRoutedApp({ routes: [route], diagnostics: { ...diagnostics, logOnRefresh: true } })
                : createPublicStaticAppTemplate({ content: P("Content"), diagnostics: { page: false, sources, log, logOnCreate: false } });
        app.destroy(); expect(app.inspectDiagnostics()).toBeNull(); expect(app.logDiagnostics()).toBeNull(); app.refresh();
        expect(sources).not.toHaveBeenCalled(); expect(log).not.toHaveBeenCalled();
    });

    it("cancels startup scroll work on real page exit, but not BFCache hide", () => {
        const app = createPublicHashRoutedApp({ routes: [route], diagnostics: false, startOptions }); cleanups.push(app.destroy);
        const reset = app.initialScrollReset!; expect(reset).not.toBeNull();
        window.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: true })); expect(app.isDestroyed()).toBe(false); expect(reset.isCanceled()).toBe(false);
        window.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: false })); expect(app.isDestroyed()).toBe(true); expect(reset.isCanceled()).toBe(true);
        expect(app.initialScrollReset).toBeNull();
    });

    it("cleans a manually started public hash app when its startup hook fails", () => {
        const target = document.createElement("div"); document.body.append(target);
        const app = createPublicHashRoutedApp({ routes: [route], mount: target, start: false, router: { inspect: () => { throw new Error("Startup failed"); } }, diagnostics: false }); cleanups.push(app.destroy);
        expect(() => app.start(startOptions)).toThrow("Startup failed"); expect(app.isDestroyed()).toBe(true); expect(target.children).toHaveLength(0); expect(app.initialScrollReset).toBeNull();
    });
});

describe("Locale refresh terminal setup", () => {
    it("unsubscribes if synchronous immediate rendering fails", () => {
        const fixture = localeFixture(); const refresh = vi.fn(() => { throw new Error("Refresh failed"); });
        expect(() => createLocaleRefresh({ locale: fixture.locale, refresh, schedule: "sync", immediate: true })).toThrow("Refresh failed");
        expect(fixture.unsubscribe).toHaveBeenCalledOnce(); fixture.emit(); expect(refresh).toHaveBeenCalledOnce();
    });

    it("does not read locale or schedule work after destruction, including stale events", () => {
        const fixture = localeFixture(); const refresh = vi.fn(); const schedule = vi.spyOn(window, "requestAnimationFrame");
        const controller = createLocaleRefresh({ locale: fixture.locale, refresh });
        controller.destroy(); controller.refresh(); fixture.emit();
        expect(fixture.getLocale).toHaveBeenCalledOnce(); expect(schedule).not.toHaveBeenCalled(); expect(refresh).not.toHaveBeenCalled();
    });
});
