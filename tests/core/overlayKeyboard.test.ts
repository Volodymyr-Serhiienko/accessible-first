import { describe, expect, it, vi } from "vitest";
import { createDialog } from "../../packages/core/src/dialog";
import { createDismissableLayer } from "../../packages/core/src/dismissable-layer";

function escape(target: HTMLElement, flag = ""): KeyboardEvent {
    const event = new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true,
        ...(flag === "handled" ? {} : { [flag]: true }) });
    if (flag === "handled") event.preventDefault();
    target.dispatchEvent(event);
    return event;
}

describe("overlay Escape ownership", () => {
    it.each(["handled", "isComposing", "ctrlKey", "altKey", "metaKey"])("core dialog leaves %s Escape to its owner", (flag) => {
        const element = document.createElement("div");
        document.body.append(element);
        const dialog = createDialog(element);
        try {
            escape(element, flag);
            expect(dialog.isOpen()).toBe(true);
        } finally { dialog.destroy(); }
    });

    it.each(["handled", "isComposing", "ctrlKey", "altKey", "metaKey"])("dismissable layer leaves %s Escape to its owner", (flag) => {
        const element = document.createElement("div");
        document.body.append(element);
        const onEscapeKeyDown = vi.fn();
        const onDismiss = vi.fn();
        const layer = createDismissableLayer(element, { onEscapeKeyDown, onDismiss });
        try {
            escape(element, flag);
            expect(onEscapeKeyDown).not.toHaveBeenCalled();
            expect(onDismiss).not.toHaveBeenCalled();
        } finally { layer.destroy(); }
    });

    it("closes only the inner core dialog for a single Escape", () => {
        const outer = document.createElement("div");
        const inner = document.createElement("div");
        outer.append(inner);
        document.body.append(outer);
        const parent = createDialog(outer);
        const child = createDialog(inner);
        try {
            expect(escape(inner).defaultPrevented).toBe(true);
            expect(child.isOpen()).toBe(false);
            expect(parent.isOpen()).toBe(true);
            escape(outer);
            expect(parent.isOpen()).toBe(false);
        } finally { child.destroy(); parent.destroy(); }
    });
});
