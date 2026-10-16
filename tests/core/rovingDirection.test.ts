import { describe, expect, it, vi } from "vitest";
import { createRovingFocus } from "../../packages/core/src/roving-focus";

function fixture(orientation: "horizontal" | "vertical" | "both" = "horizontal") {
    const container = document.createElement("div");
    const items = ["First", "Middle", "Last"].map(text => { const element = document.createElement("button"); element.textContent = text; return element; });
    container.append(...items); document.body.append(container);
    for (const item of [container, ...items]) vi.spyOn(item, "getClientRects").mockReturnValue([{}] as unknown as DOMRectList);
    const roving = createRovingFocus(container, { getItems: () => items, orientation });
    roving.activate();
    return { container, items, roving };
}
function key(target: HTMLElement, key: string): void { target.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true })); }

describe("roving direction", () => {
    it.each(["horizontal", "both"] as const)("mirrors horizontal arrows for %s in RTL", (orientation) => {
        const { container, items, roving } = fixture(orientation);
        container.style.direction = "rtl";
        try {
            items[1]!.focus(); key(items[1]!, "ArrowLeft"); expect(document.activeElement).toBe(items[2]);
            key(items[2]!, "ArrowRight"); expect(document.activeElement).toBe(items[1]);
        } finally { roving.deactivate(); }
    });
    it("reads direction on each key rather than freezing it at construction", () => {
        const { container, items, roving } = fixture();
        try {
            items[1]!.focus(); key(items[1]!, "ArrowRight"); expect(document.activeElement).toBe(items[2]);
            container.style.direction = "rtl";
            key(items[2]!, "ArrowRight"); expect(document.activeElement).toBe(items[1]);
        } finally { roving.deactivate(); }
    });
    it("keeps vertical arrows and Home/End in logical collection order", () => {
        const { container, items, roving } = fixture("both");
        container.style.direction = "rtl";
        try {
            items[1]!.focus(); key(items[1]!, "ArrowDown"); expect(document.activeElement).toBe(items[2]);
            key(items[2]!, "ArrowUp"); expect(document.activeElement).toBe(items[1]);
            key(items[1]!, "Home"); expect(document.activeElement).toBe(items[0]);
            key(items[0]!, "End"); expect(document.activeElement).toBe(items[2]);
            roving.movePrevious(); expect(document.activeElement).toBe(items[1]);
            roving.moveNext(); expect(document.activeElement).toBe(items[2]);
        } finally { roving.deactivate(); }
    });
});
