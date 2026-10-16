import { afterEach, describe, expect, it, vi } from "vitest";
import { H2, P } from "../../../packages/components/src/composition";
import { PageOutlet, type ComposedPageOutlet } from "../../../packages/components/src/page-outlet";

const outlets: ComposedPageOutlet[] = [];
afterEach(() => {
    for (const outlet of outlets.splice(0)) {
        try { outlet.destroy(); } catch { /* Some tests deliberately fail cleanup. */ }
    }
    vi.restoreAllMocks();
});

function fixture() {
    const outlet = PageOutlet({ scrollOnRender: false });
    outlets.push(outlet);
    document.body.append(outlet.element);
    const scroll = vi.fn();
    outlet.element.scrollIntoView = scroll;
    return { outlet, scroll };
}

function frames() {
    const pending: FrameRequestCallback[] = [];
    vi.spyOn(window, "requestAnimationFrame").mockImplementation(callback => pending.push(callback));
    const cancel = vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
    return { pending, cancel, flush: () => pending.splice(0).forEach(callback => callback(0)) };
}

function liveText() {
    return [...document.querySelectorAll("[data-af-live-region]")].map(region => region.textContent).join(" ");
}

describe("PageOutlet render revisions", () => {
    it("keeps the newer screen and its effects when old child cleanup renders again", () => {
        vi.useFakeTimers();
        const { outlet, scroll } = fixture();
        outlet.render({ element: document.createElement("p"), destroy() {
            outlet.render(H2("Latest"), { documentTitle: "Latest", title: "Latest" });
        } });
        const destroy = vi.fn();
        const obsolete = { element: document.createElement("h2"), destroy };
        const focus = vi.fn(() => obsolete.element);
        const announce = vi.fn(() => "Obsolete");
        outlet.render(obsolete, { documentTitle: "Obsolete", title: "Obsolete", focusTarget: focus, announcement: announce, scroll: true });
        vi.advanceTimersByTime(50);
        expect(outlet.element.textContent).toBe("Latest");
        expect(document.title).toBe("Latest");
        expect(document.activeElement?.textContent).toBe("Latest");
        expect(destroy).toHaveBeenCalledOnce();
        expect(focus).not.toHaveBeenCalled();
        expect(announce).not.toHaveBeenCalled();
        expect(scroll).not.toHaveBeenCalled();
        expect(liveText()).not.toContain("Obsolete");
    });

    it("stops old effects when cleanup destroys the outlet", () => {
        const { outlet, scroll } = fixture();
        outlet.render({ element: document.createElement("p"), destroy: () => outlet.destroy() });
        const focus = vi.fn(() => document.body);
        outlet.render(H2("Obsolete"), { documentTitle: "Obsolete", focusTarget: focus, scroll: true });
        expect(outlet.element.isConnected).toBe(false);
        expect(document.title).not.toBe("Obsolete");
        expect(focus).not.toHaveBeenCalled();
        expect(scroll).not.toHaveBeenCalled();
    });

    it.each(["render", "destroy", "update"] as const)("does not focus an obsolete target when a focus resolver calls %s", action => {
        const { outlet } = fixture();
        const old = document.createElement("button"); document.body.append(old);
        const oldFocus = vi.spyOn(old, "focus");
        const announce = vi.fn(() => "Obsolete");
        outlet.render(H2("Old"), { focusTarget: () => {
            if (action === "render") outlet.render(H2("Latest"));
            else if (action === "destroy") outlet.destroy();
            else outlet.update({ label: "Latest label" });
            return old;
        }, announcement: announce });
        expect(oldFocus).not.toHaveBeenCalled();
        expect(announce).not.toHaveBeenCalled();
    });

    it("does not announce or reschedule old work after a native focus listener navigates", () => {
        const { outlet } = fixture(); const raf = frames();
        const heading = H2("Old");
        heading.element.addEventListener("focus", () => outlet.render(H2("Latest")));
        const announce = vi.fn(() => "Old");
        outlet.render(heading, { scroll: true, announcement: announce });
        expect(outlet.element.textContent).toBe("Latest");
        expect(document.activeElement?.textContent).toBe("Latest");
        expect(announce).not.toHaveBeenCalled();
        expect(raf.pending).toHaveLength(0);
    });

    it.each(["render", "destroy"] as const)("drops a message returned by an announcement resolver that calls %s", action => {
        vi.useFakeTimers();
        const { outlet } = fixture(); const raf = frames();
        outlet.render(P("Old"), { scroll: true, focusTarget: null, announcement: () => {
            if (action === "render") outlet.render(H2("Latest"));
            else outlet.destroy();
            return "Obsolete speech";
        } });
        vi.advanceTimersByTime(50);
        expect(liveText()).not.toContain("Obsolete speech");
        expect(raf.pending).toHaveLength(0);
    });

    it("stops a render if synchronous scrolling navigates to another screen", () => {
        const { outlet, scroll } = fixture();
        scroll.mockImplementationOnce(() => outlet.render(H2("Latest")));
        const focus = vi.fn(() => document.body);
        outlet.render(H2("Old"), { scroll: true, focusTarget: focus });
        expect(outlet.element.textContent).toBe("Latest");
        expect(focus).not.toHaveBeenCalled();
    });

    it.each(["render", "update", "setTitle", "destroy"] as const)("cancels the previous scroll frame on %s, even if a canceled callback still runs", action => {
        const { outlet, scroll } = fixture(); const raf = frames();
        outlet.render(H2("First"), { scroll: true });
        if (action === "render") outlet.render(H2("Latest"));
        else if (action === "update") outlet.update({ label: "Latest" });
        else if (action === "setTitle") outlet.setTitle("Latest");
        else outlet.destroy();
        expect(raf.cancel).toHaveBeenCalledWith(1);
        raf.flush(); expect(scroll).toHaveBeenCalledOnce();
    });

    it("schedules only the newest follow-up scroll and releases its handle once run", () => {
        const { outlet, scroll } = fixture(); const raf = frames();
        outlet.render(H2("First"), { scroll: true });
        outlet.render(H2("Latest"), { scroll: true });
        raf.flush(); expect(scroll).toHaveBeenCalledTimes(3);
        outlet.destroy(); expect(raf.cancel).toHaveBeenCalledTimes(1);
    });

    it("clears pending speech when the next screen relies on focus instead", () => {
        vi.useFakeTimers();
        const { outlet } = fixture();
        outlet.render(P("First"), { title: "Obsolete speech", focusTarget: null });
        outlet.render(H2("Latest"));
        vi.advanceTimersByTime(50);
        expect(liveText()).not.toContain("Obsolete speech");
        expect(document.activeElement?.textContent).toBe("Latest");
    });

    it("does not clear announcements owned by a different outlet", () => {
        vi.useFakeTimers();
        const first = fixture().outlet; const second = fixture().outlet;
        first.render(P("First"), { announcement: "Retained speech", focusTarget: null });
        second.render(H2("Second"));
        vi.advanceTimersByTime(50);
        expect(liveText()).toContain("Retained speech");
    });

    it("does not overwrite a nested update's accessible label", () => {
        const { outlet } = fixture();
        outlet.render({ element: document.createElement("p"), destroy: () => outlet.update({ label: "Latest label" }) });
        outlet.update({ label: "Old label", children: [P("Replacement")] });
        expect(outlet.element.getAttribute("aria-label")).toBe("Latest label");
    });
});

describe("PageOutlet terminal lifetime", () => {
    it.each(["render", "setContent", "update"] as const)("does not accept content through %s after destroy", action => {
        const { outlet } = fixture();
        outlet.destroy();
        const destroy = vi.fn(); const element = document.createElement("p");
        const content = { element, destroy };
        const focus = vi.fn(() => document.body);
        if (action === "render") outlet.render(content, { documentTitle: "Late", focusTarget: focus });
        else if (action === "setContent") outlet.setContent([content], { documentTitle: "Late", focusTarget: focus });
        else outlet.update({ children: [content], documentTitle: "Late", label: "Late", className: "late" });
        expect(outlet.element.contains(element)).toBe(false);
        expect(outlet.element.className).not.toContain("late");
        expect(document.title).not.toBe("Late");
        expect(focus).not.toHaveBeenCalled();
        expect(destroy).not.toHaveBeenCalled();
    });

    it("ignores late title and focus requests without invoking their callback", () => {
        const { outlet } = fixture();
        outlet.setTitle("Retained"); outlet.destroy(); outlet.setTitle("Late");
        const focus = vi.fn(() => document.body);
        expect(outlet.focus(focus)).toBe(false);
        expect(outlet.getTitle()).toBe("Retained"); expect(focus).not.toHaveBeenCalled();
    });

    it("makes destruction terminal even if a child cleanup throws", () => {
        const { outlet } = fixture(); const raf = frames();
        const error = new Error("Cleanup failed");
        const destroy = vi.fn(() => { throw error; });
        outlet.render({ element: document.createElement("p"), destroy }, { scroll: true });
        expect(outlet.destroy).toThrow(error);
        expect(outlet.element.isConnected).toBe(false);
        expect(raf.cancel).toHaveBeenCalledOnce();
        expect(() => outlet.destroy()).not.toThrow();
        outlet.render(P("Late")); expect(destroy).toHaveBeenCalledOnce();
    });

    it("focuses an element from another document realm", () => {
        const frame = document.createElement("iframe"); document.body.append(frame);
        const doc = frame.contentDocument!;
        const button = doc.createElement("button"); doc.body.append(button);
        const { outlet } = fixture();
        expect(outlet.focus(button)).toBe(true);
        expect(doc.activeElement).toBe(button);
    });
});
