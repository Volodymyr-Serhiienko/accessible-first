import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppShell, Combobox, createAppLocalization, createContentSlot, createHashRoutedApp, createLinkRoutedApp, Link,
    createPublicStaticAppTemplate, mount, P, Panel, Row, Section, Stack } from "../../packages/components/src";
import { addPageHideCleanup } from "../../packages/core/src/events";

beforeEach(() => vi.stubGlobal("matchMedia", vi.fn(() => ({
    matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn()
}))));
afterEach(() => { document.body.replaceChildren(); vi.unstubAllGlobals(); });

function child(destroy: () => void = vi.fn()) {
    return { element: document.createElement("span"), destroy };
}

describe("composition ownership", () => {
    it.each(["stack", "row", "panel", "section", "tag"] as const)("destroys nested %s children once", kind => {
        const leaf = child();
        const nested = P(leaf);
        const wrapper = kind === "stack" ? Stack(nested) : kind === "row" ? Row(nested)
            : kind === "panel" ? Panel(nested) : kind === "section" ? Section({ title: "Section", children: [nested] }) : P(nested);
        wrapper.destroy?.();
        wrapper.destroy?.();
        expect(leaf.destroy).toHaveBeenCalledOnce();
    });

    it("retains shared siblings on replacement, and finishes all cleanup on failure", () => {
        const parent = document.createElement("div");
        const kept = child();
        const removed = child();
        const added = child(() => { throw new Error("child cleanup failed"); });
        const slot = createContentSlot(parent, [removed, kept]);
        slot.set([added, kept]);
        expect(removed.destroy).toHaveBeenCalledOnce();
        expect(kept.destroy).not.toHaveBeenCalled();
        expect(parent.children).toHaveLength(2);
        expect(() => slot.dispose()).toThrow("child cleanup failed");
        expect(kept.destroy).toHaveBeenCalledOnce();
        expect(() => slot.dispose()).not.toThrow();
    });

    it("unmounts the DOM even if an owned destroy callback throws", () => {
        const target = document.createElement("div");
        const tree = mount(child(() => { throw new Error("failed"); }), target);
        expect(() => tree.unmount()).toThrow("failed");
        expect(target.children).toHaveLength(0);
        expect(() => tree.unmount()).not.toThrow();
    });

    it("cleans every shell slot and removes the page after a content error", () => {
        const footer = child();
        const after = child();
        const shell = AppShell({ content: Stack(child(() => { throw new Error("outlet failed"); })),
            afterOutlet: after, footer });
        document.body.append(shell.element);
        expect(() => shell.destroy()).toThrow("outlet failed");
        expect(footer.destroy).toHaveBeenCalledOnce();
        expect(after.destroy).toHaveBeenCalledOnce();
        expect(shell.element.isConnected).toBe(false);
        expect(() => shell.destroy()).not.toThrow();
    });
});

describe("public app lifecycle", () => {
    it("destroys replaced screen controls but retains shared chrome between routes", () => {
        const shared = child();
        const controls: ReturnType<typeof Combobox>[] = [];
        const render = () => {
            const control = Combobox({ label: "Choice", items: [{ value: "one", label: "One" }] });
            controls.push(control);
            return Stack(control);
        };
        const app = createHashRoutedApp({ start: false, refreshChromeOnRouteChange: true,
            routes: [{ id: "home", title: "Home", render }, { id: "other", title: "Other", render }],
            renderChrome: () => ({ afterOutlet: [Link({ text: "Navigation", href: "#home" }), shared] }) });
        const options = { scroll: false, announcement: false, focusTarget: null };
        app.router.navigate("home", options);
        app.router.navigate("other", options);
        expect(controls).toHaveLength(2);
        expect(controls[0]!.isDestroyed()).toBe(true);
        expect(controls[1]!.isDestroyed()).toBe(false);
        expect(shared.destroy).not.toHaveBeenCalled();
        app.destroy();
        expect(controls[1]!.isDestroyed()).toBe(true);
        expect(shared.destroy).toHaveBeenCalledOnce();
    });

    it("retains page-exit cleanup across repeated BFCache hides", () => {
        const destroy = vi.fn();
        const remove = addPageHideCleanup(window, destroy);
        window.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: true }));
        window.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: true }));
        expect(destroy).not.toHaveBeenCalled();
        window.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: false }));
        window.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: false }));
        expect(destroy).toHaveBeenCalledOnce();
        remove();
    });

    it.each(["hash", "link", "static"] as const)("destroys the %s template after BFCache restoration and real exit", kind => {
        const target = document.createElement("div");
        document.body.append(target);
        const options = { mount: target, shell: { content: P("Content") } };
        const app = kind === "hash" ? createHashRoutedApp({ ...options, start: false, routes: [{ id: "home", title: "Home", render: () => P("Home") }] })
            : kind === "link" ? createLinkRoutedApp({ ...options, routes: [{ id: "home", title: "Home", href: "/" }] })
            : createPublicStaticAppTemplate({ mount: target, diagnostics: false, content: P("Content") });
        window.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: true }));
        expect(app.isDestroyed()).toBe(false);
        window.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: false }));
        expect(app.isDestroyed()).toBe(true);
        expect(target.children).toHaveLength(0);
    });

    it.each([false as const, { schedule: "sync" as const, immediate: true }])("supports static locale refresh %j", localeRefresh => {
        const locale = createAppLocalization({ supportedLocales: ["en", "uk"], fallbackLocale: "en", initialLocale: "en",
            storage: null, navigatorSource: null, messages: { en: { text: "Hello" }, uk: { text: "Privit" } } });
        const app = createPublicStaticAppTemplate({ locale, localeRefresh, diagnostics: false,
            content: () => P(locale.t("text")) });
        expect(app.shell.outlet.element.textContent).toBe("Hello");
        locale.setLocale("uk", { persist: false });
        expect(app.shell.outlet.element.textContent).toBe(localeRefresh === false ? "Hello" : "Privit");
        app.destroy();
        locale.destroy();
    });
});
