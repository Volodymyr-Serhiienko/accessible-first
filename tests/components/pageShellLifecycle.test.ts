import { afterEach, describe, expect, it, vi } from "vitest";
import { createPage, type Page } from "../../packages/components/src/page";
import { AppShell, type ComposedAppShell } from "../../packages/components/src/app-shell";
import { createContentSlot } from "../../packages/components/src/composition";
import { getDestroyer, toNode } from "../../packages/components/src/composition/append";

const cleanups: Array<() => void> = [];
function own<T extends { destroy(): void }>(value: T): T { cleanups.push(value.destroy); return value; }
function child(text: string, destroy = vi.fn()) { const element = document.createElement("div"); element.textContent = text; return { element, destroy }; }
function localeProbe(fail = false) {
    let listener = () => {};
    const unsubscribe = vi.fn(() => { if (fail) throw new Error("unsubscribe"); });
    return { locale: { t: (key: string) => key, subscribe(callback: () => void) { listener = callback; return unsubscribe; } }, unsubscribe, emit: () => listener() };
}

afterEach(() => {
    cleanups.splice(0).reverse().forEach(cleanup => { try { cleanup(); } catch { /* Expected exceptional cleanup. */ } });
    document.body.replaceChildren(); vi.restoreAllMocks(); vi.unstubAllGlobals();
});

describe("Page managed regions", () => {
    it("makes the native skip-link target focusable without adding a tab stop", () => {
        const page = own(createPage()); document.body.append(page.element);
        expect(page.main.getAttribute("tabindex")).toBe("-1");
        page.main.focus(); expect(document.activeElement).toBe(page.main);
        expect(page.main.tabIndex).toBe(-1);
    });

    it.each(["header", "navigation", "footer"] as const)("retains the same owned %s node", region => {
        const page = own(createPage()); const content = child("Retained"); const input = document.createElement("input"); content.element.append(input);
        page[region](content); document.body.append(page.element); input.focus(); page[region](content);
        expect(document.activeElement).toBe(input); expect(content.destroy).not.toHaveBeenCalled();
        page.destroy(); expect(content.destroy).toHaveBeenCalledOnce();
    });

    it("keeps all late mutators inert, including document metadata and focus", () => {
        const original = document.title; const page = own(createPage({ title: "Owned title" }));
        document.body.append(page.element); page.destroy(); const markup = page.element.outerHTML;
        const input = document.createElement("input"); document.body.append(input); input.focus();
        const late = child("Late");
        page.header(late).navigation(late).footer(late).section(late).appendToMain(late).setMainContent(late).focusMain();
        page.update({ title: "late", skipLink: "late", metadata: { description: "late" } }); page.updateMetadata({ title: "late metadata" });
        expect(page.element.outerHTML).toBe(markup); expect(document.title).toBe(original); expect(document.activeElement).toBe(input);
        expect(late.destroy).not.toHaveBeenCalled();
    });

    it("restores a title first changed by a late update with metadata disabled", () => {
        const original = document.title; const page = own(createPage({ metadata: false }));
        page.update({ title: "Later title" }); expect(document.title).toBe("Later title");
        page.destroy(); expect(document.title).toBe(original);
    });

    it("restores original title after adding a metadata controller later", () => {
        const original = document.title; const page = own(createPage({ metadata: false, title: "Direct" }));
        page.updateMetadata({ description: "Later metadata" }); page.update({ title: "Managed" }); page.destroy();
        expect(document.title).toBe(original);
    });

    it("continues a region replacement after an old child cleanup fails", () => {
        const old = child("Old", vi.fn(() => { throw new Error("content"); })); const next = child("Next");
        const page = own(createPage()); page.header(old);
        expect(() => page.header(next)).toThrow("content"); expect(page.element.querySelector("header")?.textContent).toBe("Next");
        page.destroy(); expect(next.destroy).toHaveBeenCalledOnce();
    });

    it("keeps a newer region installed during old cleanup", () => {
        let page: Page; const newest = child("Newest"); const candidate = child("Obsolete");
        const old = child("Old", vi.fn(() => page.header(newest))); page = own(createPage()); page.header(old); page.header(candidate);
        expect(page.element.querySelector("header")?.textContent).toBe("Newest"); expect(candidate.destroy).toHaveBeenCalledOnce();
    });

    it("appends main content without detaching focused existing content", () => {
        const page = own(createPage()); const input = document.createElement("input"); const first = { element: input, destroy: vi.fn() };
        page.section(first); document.body.append(page.element); input.focus(); const second = child("Second"); page.appendToMain(second);
        expect(document.activeElement).toBe(input); expect(page.main.children).toHaveLength(2);
        page.setMainContent(second); expect(first.destroy).toHaveBeenCalledOnce(); expect(second.destroy).not.toHaveBeenCalled();
    });

    it("cancels a pending main append when rendering its node replaces the content", () => {
        const page = own(createPage()); const latest = child("Latest"); const obsolete = { get element() { page.setMainContent(latest); return document.createElement("div"); }, destroy: vi.fn() };
        page.appendToMain(obsolete); expect(page.main.textContent).toBe("Latest"); expect(obsolete.destroy).toHaveBeenCalledOnce();
    });

    it("ignores stale locale callbacks and releases all regions after an unsubscribe error", () => {
        const first = localeProbe(true); const next = localeProbe(); const page = own(createPage({ locale: first.locale }));
        const regions = [child("Header"), child("Navigation"), child("Main"), child("Footer")];
        page.header(regions[0]!).navigation(regions[1]!).section(regions[2]!).footer(regions[3]!);
        expect(() => page.update({ locale: next.locale, skipLink: "Newest" })).toThrow("unsubscribe"); first.emit();
        expect(page.element.querySelector("[data-af-skip-link]")?.textContent).toBe("Newest");
        page.destroy(); expect(regions.every(region => region.destroy.mock.calls.length === 1)).toBe(true); expect(next.unsubscribe).toHaveBeenCalledOnce();
    });

    it("cleans the theme and subscription after initial localization fails", () => {
        const theme = document.documentElement.getAttribute("data-af-theme"); const probe = localeProbe();
        expect(() => createPage({ theme: "dark", locale: { ...probe.locale, t() { throw new Error("locale"); } } })).toThrow("locale");
        expect(document.documentElement.getAttribute("data-af-theme")).toBe(theme); expect(probe.unsubscribe).toHaveBeenCalledOnce();
    });

    it("supports a missing matchMedia API without preventing page creation", () => {
        vi.stubGlobal("matchMedia", undefined); const theme = document.documentElement.getAttribute("data-af-theme");
        const page = own(createPage()); expect(document.documentElement.getAttribute("data-af-theme")).toBeNull(); page.destroy();
        expect(document.documentElement.getAttribute("data-af-theme")).toBe(theme);
    });

    it("supports legacy media listeners and ignores retained notifications after destruction", () => {
        let listener = () => {}; const removeListener = vi.fn(() => { throw new Error("media cleanup"); });
        vi.stubGlobal("matchMedia", () => ({ matches: true, addListener(callback: () => void) { listener = callback; }, removeListener }));
        const theme = document.documentElement.getAttribute("data-af-theme"); const page = own(createPage());
        expect(() => page.destroy()).toThrow("media cleanup"); listener();
        expect(document.documentElement.getAttribute("data-af-theme")).toBe(theme); expect(removeListener).toHaveBeenCalledOnce();
    });
});

describe("Managed append and failed content materialization", () => {
    it("materializes a composed node once without reading it again for cleanup", () => {
        const element = document.createElement("div");
        const read = vi.fn(() => element);
        const controller = { get element() { return read(); }, destroyed: false, destroy() { this.destroyed = true; } };
        expect(toNode(controller)).toBe(element);
        getDestroyer(controller)!();
        expect(read).toHaveBeenCalledOnce();
        expect(controller.destroyed).toBe(true);
    });

    it("cleans failed append candidates while preserving existing DOM and focus", () => {
        const parent = document.createElement("div");
        const input = document.createElement("input");
        const retained = { element: input, destroy: vi.fn() };
        const next = child("Next");
        const bad = { get element(): HTMLElement { throw new Error("append render"); }, destroy: vi.fn() };
        const slot = createContentSlot(parent, [retained]); cleanups.push(slot.dispose);
        document.body.append(parent); input.focus();
        expect(() => slot.append([next, bad])).toThrow("append render");
        expect(parent.children).toHaveLength(1); expect(document.activeElement).toBe(input);
        expect(retained.destroy).not.toHaveBeenCalled();
        expect(next.destroy).toHaveBeenCalledOnce(); expect(bad.destroy).toHaveBeenCalledOnce();
    });

    it("disposes all initial candidates after one element getter fails", () => {
        const first = child("First"); const bad = { get element(): HTMLElement { throw new Error("render"); }, destroy: vi.fn() };
        expect(() => createContentSlot(document.createElement("div"), [first, bad])).toThrow("render");
        expect(first.destroy).toHaveBeenCalledOnce(); expect(bad.destroy).toHaveBeenCalledOnce();
    });

    it("cleans a failed replacement candidate without destroying retained content", () => {
        const parent = document.createElement("div"); const retained = child("Retained"); const next = child("Next");
        const bad = { get element(): HTMLElement { throw new Error("render"); }, destroy: vi.fn() };
        const slot = createContentSlot(parent, [retained]); cleanups.push(slot.dispose);
        expect(() => slot.set([retained, next, bad])).toThrow("render");
        expect(retained.destroy).not.toHaveBeenCalled(); expect(next.destroy).toHaveBeenCalledOnce(); expect(bad.destroy).toHaveBeenCalledOnce();
    });

    it("owns each appended composed object only once at disposal", () => {
        const parent = document.createElement("div"); const content = child("Shared"); const slot = createContentSlot(parent, [content]);
        slot.append([content]); slot.dispose(); slot.dispose(); expect(content.destroy).toHaveBeenCalledOnce();
    });
});

describe("AppShell slot lifetime", () => {
    it("retains stable chrome nodes through repeated shell updates", () => {
        const header = child("Header"); const nav = child("Nav"); const footer = child("Footer");
        const shell = own(AppShell({ header, navigation: nav, footer, layout: false }));
        shell.update({ header, navigation: nav, footer });
        expect([header, nav, footer].every(content => content.destroy.mock.calls.length === 0)).toBe(true);
        shell.destroy(); expect([header, nav, footer].every(content => content.destroy.mock.calls.length === 1)).toBe(true);
    });

    it("does not overwrite a newer multi-slot update from child cleanup", () => {
        let shell: ComposedAppShell; const nextHeader = child("Latest header"); const nextFooter = child("Latest footer");
        const old = child("Old", vi.fn(() => shell.update({ header: nextHeader, footer: nextFooter })));
        shell = own(AppShell({ header: old, layout: false })); shell.update({ header: child("Obsolete"), footer: child("Unconsumed") });
        expect(shell.element.querySelector("header")?.textContent).toBe("Latest header");
        expect(shell.element.querySelector("footer")?.textContent).toBe("Latest footer");
    });

    it("does not revive chrome after cleanup destroys the shell", () => {
        let shell: ComposedAppShell; const old = child("Old", vi.fn(() => shell.destroy())); const candidate = child("Candidate");
        shell = own(AppShell({ header: old, layout: false })); document.body.append(shell.element); shell.setHeader(candidate);
        expect(shell.isDestroyed()).toBe(true); expect(shell.element.isConnected).toBe(false); expect(candidate.destroy).toHaveBeenCalledOnce();
    });

    it("updates hidden region state despite a child cleanup failure", () => {
        const old = child("Old", vi.fn(() => { throw new Error("content"); })); const shell = own(AppShell({ footer: old, layout: false }));
        expect(() => shell.setFooter(null)).toThrow("content"); expect(shell.element.querySelector<HTMLElement>("footer")!.hidden).toBe(true);
    });

    it("hides an emptied outlet slot even if old content cleanup fails", () => {
        const old = child("Old", vi.fn(() => { throw new Error("content"); })); const shell = own(AppShell({ beforeOutlet: old, layout: false }));
        expect(() => shell.setBeforeOutlet(null)).toThrow("content");
        expect(shell.element.querySelector<HTMLElement>("[data-af-app-shell-before-outlet]")!.hidden).toBe(true);
    });

    it("releases all constructed siblings when a later slot fails", () => {
        const before = child("Before"); const content = child("Content"); const original = document.title;
        const bad = { get element(): HTMLElement { throw new Error("render"); }, destroy: vi.fn() };
        expect(() => AppShell({ title: "Temporary", content, beforeOutlet: before, afterOutlet: bad, layout: false })).toThrow("render");
        expect(before.destroy).toHaveBeenCalledOnce(); expect(content.destroy).toHaveBeenCalledOnce(); expect(bad.destroy).toHaveBeenCalledOnce();
        expect(document.title).toBe(original);
    });

    it("cleans every region and clears its layout reference after exceptional destruction", () => {
        const contents = Array.from({ length: 6 }, (_, index) => child(String(index), vi.fn(() => { if (index === 1) throw new Error("content"); })));
        const shell = own(AppShell({ header: contents[0], navigation: contents[1], beforeOutlet: contents[2], content: contents[3], afterOutlet: contents[4], footer: contents[5] }));
        document.body.append(shell.element); expect(() => shell.destroy()).toThrow("content");
        expect(contents.every(content => content.destroy.mock.calls.length === 1)).toBe(true); expect(shell.layout).toBeNull(); expect(shell.element.isConnected).toBe(false);
    });

    it("releases a removed layout reference before its cleanup throws", () => {
        const shell = own(AppShell()); const layout = shell.layout!; const original = layout.destroy;
        const cleanup = vi.spyOn(layout, "destroy").mockImplementation(() => { original(); throw new Error("layout"); });
        expect(() => shell.update({ layout: false })).toThrow("layout"); expect(shell.layout).toBeNull();
        shell.destroy(); expect(cleanup).toHaveBeenCalledOnce();
    });

    it("leaves all late shell methods inert", () => {
        const shell = own(AppShell({ layout: false })); shell.destroy(); const markup = shell.element.outerHTML; const title = document.title;
        shell.setHeader("late").setNavigation("late").setBeforeOutlet("late").setAfterOutlet("late").setFooter("late").render("late").updateMetadata({ title: "late" });
        shell.update({ title: "late", header: "late", layout: {} });
        expect(shell.focus()).toBe(false); expect(shell.element.outerHTML).toBe(markup); expect(document.title).toBe(title);
    });
});
