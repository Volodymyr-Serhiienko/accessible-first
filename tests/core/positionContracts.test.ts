import { afterEach, describe, expect, it, vi } from "vitest";
import { createPopoverPosition } from "../../packages/core/src/popover-position";

function rect(element: HTMLElement, left: number, top: number, width: number, height: number) {
    vi.spyOn(element, "getBoundingClientRect").mockReturnValue({
        x: left, y: top, left, top, width, height, right: left + width, bottom: top + height,
        toJSON: () => ({})
    });
}

function fixture() {
    const anchor = document.createElement("button");
    const popup = document.createElement("div");
    document.body.append(anchor, popup);
    rect(anchor, 200, 140, 80, 20);
    rect(popup, 0, 0, 160, 100);
    return { anchor, popup };
}

afterEach(() => vi.useRealTimers());

describe("Popover positioning contracts", () => {
    it.each(["start", "end"] as const)("resolves horizontal %s alignment using live anchor direction", (alignment) => {
        const { anchor, popup } = fixture();
        const position = createPopoverPosition(anchor, popup, { alignment, shift: false, flip: false, autoUpdate: false });
        expect(position.getState()?.x).toBe(alignment === "start" ? 200 : 120);
        anchor.style.direction = "rtl";
        expect(position.update().x).toBe(alignment === "start" ? 120 : 200);
        position.destroy();
    });

    it("converts absolute coordinates to the scrolled, bordered offset parent", () => {
        const { anchor, popup } = fixture();
        rect(anchor, 150, 140, 80, 20);
        const parent = document.createElement("div");
        document.body.append(parent);
        parent.append(anchor, popup);
        rect(parent, 100, 80, 400, 300);
        Object.defineProperties(parent, { clientLeft: { value: 4 }, clientTop: { value: 6 }, scrollLeft: { value: 12 }, scrollTop: { value: 30 } });
        Object.defineProperty(popup, "offsetParent", { value: parent });
        const position = createPopoverPosition(anchor, popup, { strategy: "absolute", shift: false, flip: false, autoUpdate: false });
        expect(position.getState()).toMatchObject({ x: 150, y: 164 });
        expect(popup.style.left).toBe("58px");
        expect(popup.style.top).toBe("108px");
        position.destroy();
    });

    it("restores only borrowed inline properties, including their priority", () => {
        const { anchor, popup } = fixture();
        popup.style.setProperty("left", "12px", "important");
        popup.style.setProperty("position", "relative", "important");
        const position = createPopoverPosition(anchor, popup, { autoUpdate: false });
        popup.style.color = "red";
        position.destroy();
        expect(popup.style.getPropertyValue("left")).toBe("12px");
        expect(popup.style.getPropertyPriority("left")).toBe("important");
        expect(popup.style.getPropertyPriority("position")).toBe("important");
        expect(popup.style.color).toBe("red");
    });

    it("flips at the lower viewport edge and shifts horizontally", () => {
        const { anchor, popup } = fixture();
        rect(anchor, window.innerWidth - 30, window.innerHeight - 30, 20, 20);
        const position = createPopoverPosition(anchor, popup, { autoUpdate: false });
        expect(position.getState()).toMatchObject({ side: "top", x: window.innerWidth - 168, y: window.innerHeight - 134 });
        position.destroy();
    });

    it("does not flip or shift when both are disabled", () => {
        const { anchor, popup } = fixture();
        rect(anchor, window.innerWidth - 30, window.innerHeight - 30, 20, 20);
        const position = createPopoverPosition(anchor, popup, { autoUpdate: false, flip: false, shift: false });
        expect(position.getState()).toMatchObject({ side: "bottom", x: window.innerWidth - 30, y: window.innerHeight - 6 });
        position.destroy();
    });

    it.each(["fixed", "absolute"] as const)("excludes scrollbar space from %s placement", strategy => {
        const { anchor, popup } = fixture();
        vi.spyOn(document.documentElement, "clientWidth", "get").mockReturnValue(800);
        vi.spyOn(document.documentElement, "clientHeight", "get").mockReturnValue(600);
        rect(anchor, 790, 590, 20, 20);
        const position = createPopoverPosition(anchor, popup, { strategy, autoUpdate: false });
        expect(position.getState()).toMatchObject({ side: "top", x: 632, y: 486 });
        position.destroy();
    });

    it.each(["fixed", "absolute"] as const)("shifts %s popups inside client bounds when flipping is disabled", strategy => {
        const { anchor, popup } = fixture();
        vi.spyOn(document.documentElement, "clientWidth", "get").mockReturnValue(800);
        vi.spyOn(document.documentElement, "clientHeight", "get").mockReturnValue(600);
        rect(anchor, 790, 590, 20, 20);
        const position = createPopoverPosition(anchor, popup, { strategy, autoUpdate: false, flip: false });
        expect(position.getState()).toMatchObject({ side: "bottom", x: 632, y: 492 });
        position.destroy();
    });

    it("uses the anchor document's client bounds", () => {
        const frame = document.createElement("iframe"); document.body.append(frame);
        const owner = frame.contentDocument!;
        const anchor = owner.createElement("button"); const popup = owner.createElement("div"); owner.body.append(anchor, popup);
        vi.spyOn(owner.documentElement, "clientWidth", "get").mockReturnValue(450);
        vi.spyOn(owner.documentElement, "clientHeight", "get").mockReturnValue(350);
        rect(anchor, 430, 330, 20, 20); rect(popup, 0, 0, 160, 100);
        const position = createPopoverPosition(anchor, popup, { autoUpdate: false });
        expect(position.getState()).toMatchObject({ side: "top", x: 282, y: 226 });
        position.destroy(); frame.remove();
    });

    it("coalesces scroll events and cancels pending positioning on destroy", () => {
        vi.useFakeTimers();
        const { anchor, popup } = fixture();
        const position = createPopoverPosition(anchor, popup);
        const read = vi.mocked(anchor.getBoundingClientRect);
        read.mockClear();
        window.dispatchEvent(new Event("scroll"));
        document.dispatchEvent(new Event("scroll"));
        vi.advanceTimersByTime(20);
        expect(read).toHaveBeenCalledOnce();
        window.dispatchEvent(new Event("resize"));
        position.destroy();
        vi.advanceTimersByTime(20);
        expect(read).toHaveBeenCalledOnce();
    });
});
