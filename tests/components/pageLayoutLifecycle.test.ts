import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPage } from "../../packages/components/src/page";
import { applyPageLayout, type PageLayoutOptions } from "../../packages/components/src/page-layout";

const cleanups: Array<() => void> = [];
const resizeObservers: ResizeProbe[] = [];
const mutationObservers: MutationProbe[] = [];
const frames = new Map<number, FrameRequestCallback>();
let nextFrame = 0;

class ResizeProbe {
    observe = vi.fn(); unobserve = vi.fn(); disconnect = vi.fn();
    constructor(readonly callback: ResizeObserverCallback) { resizeObservers.push(this); }
    emit() { this.callback([], this as unknown as ResizeObserver); }
}
class MutationProbe {
    observe = vi.fn(); disconnect = vi.fn();
    constructor(readonly callback: MutationCallback) { mutationObservers.push(this); }
    emit(target: Node, addedNodes: Node[] = [], removedNodes: Node[] = []) {
        this.callback([{ target, addedNodes, removedNodes } as unknown as MutationRecord], this as unknown as MutationObserver);
    }
}
function fixture(options: PageLayoutOptions = {}) {
    const page = createPage({ theme: "light" }); cleanups.push(page.destroy);
    const input = document.createElement("input");
    page.header(input).navigation(document.createElement("a"));
    const before = document.createElement("div"); before.setAttribute("data-af-app-shell-before-outlet", "");
    const content = document.createElement("section"); page.setMainContent(before, content);
    document.body.append(page.element);
    const header = page.element.querySelector<HTMLElement>("header")!;
    const navigation = page.element.querySelector<HTMLElement>("nav")!;
    let headerHeight = 80;
    vi.spyOn(header, "getBoundingClientRect").mockImplementation(() => new DOMRect(0, 0, 300, headerHeight));
    vi.spyOn(navigation, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 0, 300, 40));
    vi.spyOn(before, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 0, 300, 30));
    const layout = applyPageLayout(page, options); cleanups.push(layout.destroy);
    return { page, layout, header, navigation, before, input, content, setHeaderHeight(value: number) { headerHeight = value; } };
}
function scrollTo(y: number) {
    vi.stubGlobal("scrollY", y); window.dispatchEvent(new Event("scroll"));
    const pending = [...frames]; frames.clear(); pending.forEach(([, callback]) => callback(0));
}
const visible = (page: { element: HTMLElement }) => page.element.getAttribute("data-af-page-chrome-visible");

beforeEach(() => {
    resizeObservers.length = 0; mutationObservers.length = 0; frames.clear(); nextFrame = 0;
    vi.stubGlobal("ResizeObserver", ResizeProbe); vi.stubGlobal("MutationObserver", MutationProbe);
    vi.stubGlobal("scrollY", 0);
    vi.stubGlobal("requestAnimationFrame", vi.fn((callback: FrameRequestCallback) => { frames.set(++nextFrame, callback); return nextFrame; }));
    vi.stubGlobal("cancelAnimationFrame", vi.fn((id: number) => frames.delete(id)));
});
afterEach(() => {
    cleanups.splice(0).reverse().forEach(cleanup => { try { cleanup(); } catch { /* Expected exceptional cleanup. */ } });
    vi.restoreAllMocks(); vi.unstubAllGlobals();
});

describe("PageLayout ownership and measurement", () => {
    it("keeps late updates inert and destruction idempotent", () => {
        const { page, layout } = fixture({ chrome: "fixed" }); layout.destroy(); const markup = page.element.outerHTML;
        layout.update({ mode: "document", chrome: "reveal", maxWidth: "20rem" }); layout.destroy();
        expect(page.element.outerHTML).toBe(markup); expect(layout.isDestroyed()).toBe(true);
        expect(resizeObservers[0]!.disconnect).toHaveBeenCalledOnce();
    });

    it("restores authored CSS priority while preserving unrelated styles", () => {
        const page = createPage({ theme: "light" }); cleanups.push(page.destroy);
        page.element.style.setProperty("--af-page-layout-gutter", "3rem", "important");
        page.element.style.setProperty("color", "red");
        // jsdom does not retain priority for custom properties; verify the CSSOM contract.
        const priority = page.element.style.getPropertyPriority.bind(page.element.style);
        vi.spyOn(page.element.style, "getPropertyPriority").mockImplementation(name => name === "--af-page-layout-gutter" ? "important" : priority(name));
        const write = vi.spyOn(page.element.style, "setProperty");
        const layout = applyPageLayout(page, { gutter: "1rem" }); layout.destroy();
        expect(page.element.style.getPropertyValue("--af-page-layout-gutter")).toBe("3rem");
        expect(write).toHaveBeenCalledWith("--af-page-layout-gutter", "3rem", "important");
        expect(page.element.style.color).toBe("red");
    });

    it("reuses its observer and existing targets across ordinary updates", () => {
        const { layout, header } = fixture(); const observer = resizeObservers[0]!;
        layout.update({ maxWidth: "60rem" }); mutationObservers[0]!.emit(header);
        expect(resizeObservers).toHaveLength(1); expect(observer.observe).toHaveBeenCalledTimes(3);
        expect(observer.disconnect).not.toHaveBeenCalled();
    });

    it("does not remeasure chrome for unrelated outlet edits", () => {
        const { header, content } = fixture(); const measure = vi.mocked(header.getBoundingClientRect); measure.mockClear();
        mutationObservers[0]!.emit(content, [document.createElement("p")]);
        expect(measure).not.toHaveBeenCalled();
    });

    it("unobserves a removed native region and measures its replacement", () => {
        const { page, header } = fixture(); const next = document.createElement("header"); next.setAttribute("data-af-page-header", "");
        vi.spyOn(next, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 0, 300, 110));
        header.replaceWith(next); mutationObservers[0]!.emit(page.element, [next], [header]);
        expect(resizeObservers[0]!.unobserve).toHaveBeenCalledWith(header);
        expect(resizeObservers[0]!.observe).toHaveBeenCalledWith(next);
        expect(page.element.style.getPropertyValue("--af-page-header-block-size")).toBe("110px");
    });

    it("reserves each fixed region at its own flow position", () => {
        const { page, header, navigation, before, layout } = fixture({ chrome: { header: "sticky", navigation: "fixed", beforeOutlet: "fixed" } });
        expect(header.nextElementSibling).toBe(navigation);
        expect(navigation.nextElementSibling?.getAttribute("data-af-page-chrome-placeholder")).toBe("navigation");
        expect(before.nextElementSibling?.getAttribute("data-af-page-chrome-placeholder")).toBe("before-outlet");
        expect(page.element.querySelectorAll("[data-af-page-chrome-placeholder]")).toHaveLength(2);
        expect(page.element.style.getPropertyValue("--af-page-fixed-chrome-block-size")).toBe("70px");
        layout.update({ chrome: "normal" }); expect(page.element.querySelector("[data-af-page-chrome-placeholder]")).toBeNull();
    });

    it("removes hidden fixed reservation and recomputes following offsets", () => {
        const { page, header } = fixture({ chrome: "fixed" }); header.hidden = true; mutationObservers[0]!.emit(header);
        expect(header.nextElementSibling?.hasAttribute("data-af-page-chrome-placeholder")).toBe(false);
        expect(page.element.style.getPropertyValue("--af-page-navigation-offset-block-size")).toBe("0px");
        expect(page.element.style.getPropertyValue("--af-page-fixed-chrome-block-size")).toBe("70px");
    });

    it("ignores retained observer callbacks after destruction", () => {
        const { page, layout, header } = fixture(); layout.destroy(); const markup = page.element.outerHTML;
        resizeObservers[0]!.emit(); mutationObservers[0]!.emit(header);
        expect(page.element.outerHTML).toBe(markup);
    });

    it("restores all borrowed state even if an observer cleanup throws", () => {
        const { page, layout } = fixture({ chrome: "fixed", maxWidth: "12rem" });
        resizeObservers[0]!.disconnect.mockImplementation(() => { throw new Error("resize cleanup"); });
        expect(() => layout.destroy()).toThrow("resize cleanup");
        expect(mutationObservers[0]!.disconnect).toHaveBeenCalledOnce();
        expect(page.element.hasAttribute("data-af-page-layout")).toBe(false);
        expect(page.element.style.getPropertyValue("--af-page-layout-max-width")).toBe("");
        expect(page.element.querySelector("[data-af-page-chrome-placeholder]")).toBeNull();
    });

    it("cleans partial construction after resize observation fails", () => {
        class FailingResize extends ResizeProbe { override observe = vi.fn(() => { throw new Error("resize setup"); }); }
        vi.stubGlobal("ResizeObserver", FailingResize);
        const page = createPage({ theme: "light" }); cleanups.push(page.destroy); page.header(document.createElement("div"));
        expect(() => applyPageLayout(page, { chrome: "fixed" })).toThrow("resize setup");
        expect(resizeObservers[0]!.disconnect).toHaveBeenCalledOnce();
        expect(page.element.hasAttribute("data-af-page-layout")).toBe(false);
        expect(page.element.querySelector("[data-af-page-chrome-placeholder]")).toBeNull();
    });

    it("cleans both observers after mutation observation fails", () => {
        class FailingMutation extends MutationProbe { override observe = vi.fn(() => { throw new Error("mutation setup"); }); }
        vi.stubGlobal("MutationObserver", FailingMutation);
        expect(() => fixture()).toThrow("mutation setup");
        expect(resizeObservers[0]!.disconnect).toHaveBeenCalledOnce(); expect(mutationObservers[0]!.disconnect).toHaveBeenCalledOnce();
    });

    it("remeasures on native resize without ResizeObserver", () => {
        vi.stubGlobal("ResizeObserver", undefined);
        const { page, setHeaderHeight, layout } = fixture(); setHeaderHeight(120); window.dispatchEvent(new Event("resize"));
        expect(page.element.style.getPropertyValue("--af-page-header-block-size")).toBe("120px");
        layout.destroy(); setHeaderHeight(160); window.dispatchEvent(new Event("resize"));
        expect(page.element.style.getPropertyValue("--af-page-header-block-size")).toBe("");
    });
});

describe("PageLayout reveal lifecycle", () => {
    it("hides on downward scroll and shows on the first upward movement", () => {
        const { page } = fixture({ chrome: "reveal" }); scrollTo(200); expect(visible(page)).toBe("false");
        scrollTo(199); expect(visible(page)).toBe("true");
    });

    it("keeps keyboard focus visible and reveals hidden chrome on focus", () => {
        const { page, input } = fixture({ chrome: "reveal" }); input.focus(); scrollTo(200); expect(visible(page)).toBe("true");
        input.blur(); scrollTo(300); expect(visible(page)).toBe("false"); input.focus(); expect(visible(page)).toBe("true");
    });

    it("reveals an expanded descendant without waiting for another scroll", () => {
        const { page, input } = fixture({ chrome: "reveal" }); scrollTo(200); expect(visible(page)).toBe("false");
        input.setAttribute("aria-expanded", "true"); mutationObservers[0]!.emit(input); expect(visible(page)).toBe("true");
        scrollTo(300); expect(visible(page)).toBe("true");
    });

    it("cancels and ignores a queued frame when reveal is reconfigured", () => {
        const { page, layout } = fixture({ chrome: "reveal" }); vi.stubGlobal("scrollY", 200); window.dispatchEvent(new Event("scroll"));
        const stale = [...frames.values()][0]!; layout.update({ chrome: "normal" }); stale(0);
        expect(visible(page)).toBe("true"); expect(frames.size).toBe(0);
    });

    it("retired scroll and focus listeners cannot schedule work after destroy", () => {
        const scrollListeners: EventListener[] = []; const add = window.addEventListener.bind(window);
        vi.spyOn(window, "addEventListener").mockImplementation((type, callback, options) => {
            if (type === "scroll") scrollListeners.push(callback as EventListener); add(type, callback, options);
        });
        const { layout } = fixture({ chrome: "reveal" }); layout.destroy(); scrollListeners[0]!(new Event("scroll"));
        expect(frames.size).toBe(0);
    });

    it("removes the installed scroll listener after later focus-listener setup fails", () => {
        const page = createPage({ theme: "light" }); cleanups.push(page.destroy);
        const remove = vi.spyOn(window, "removeEventListener");
        vi.spyOn(page.element, "addEventListener").mockImplementation(() => { throw new Error("focus setup"); });
        expect(() => applyPageLayout(page, { chrome: "reveal" })).toThrow("focus setup");
        expect(remove.mock.calls.some(([type]) => type === "scroll")).toBe(true);
        expect(page.element.hasAttribute("data-af-page-layout")).toBe(false);
    });
});
