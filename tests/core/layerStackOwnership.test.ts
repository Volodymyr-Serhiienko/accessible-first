import { describe, expect, it, vi } from "vitest";
import { createDismissableLayer } from "../../packages/core/src/dismissable-layer";
import { createOverlayStack } from "../../packages/core/src/overlay-stack";

describe("Layer stack ownership", () => {
    it("does not resurrect stale or foreign stack entries", () => {
        const stack = createOverlayStack();
        const element = document.createElement("div");
        const old = stack.add(element);
        const current = stack.add(element);
        stack.bringToFront(old);
        expect(stack.getEntries()).toEqual([current]);
        stack.remove(current);
        stack.bringToFront(current);
        expect(stack.getEntries()).toEqual([]);
    });

    it.each(["pointerdown", "focusin"])("dismisses only one layer per %s even when stack and listener order differ", (type) => {
        const stack = createOverlayStack();
        const firstElement = document.createElement("div");
        const secondElement = document.createElement("div");
        const outside = document.createElement("button");
        document.body.append(firstElement, secondElement, outside);
        const dismissFirst = vi.fn(() => first.deactivate());
        const dismissSecond = vi.fn(() => second.deactivate());
        const first = createDismissableLayer(firstElement, { overlayStack: stack, dismissOnFocusOutside: true, onDismiss: dismissFirst });
        const second = createDismissableLayer(secondElement, { overlayStack: stack, dismissOnFocusOutside: true, onDismiss: dismissSecond });
        stack.bringToFront(stack.getEntries()[0]!);
        const event = new Event(type, { bubbles: true, cancelable: true });
        outside.dispatchEvent(event);
        expect(dismissFirst).toHaveBeenCalledOnce();
        expect(dismissSecond).not.toHaveBeenCalled();
        expect(event.defaultPrevented).toBe(false);
        first.destroy();
        second.destroy();
    });

    it.each(["keydown", "pointerdown", "focusin"])("does not dismiss after destruction inside the %s callback", (type) => {
        const element = document.createElement("div");
        document.body.append(element);
        const onDismiss = vi.fn();
        const stop = () => layer.destroy();
        const layer = createDismissableLayer(element, { dismissOnFocusOutside: true,
            onEscapeKeyDown: stop, onPointerDownOutside: stop, onFocusOutside: stop, onDismiss });
        document.body.dispatchEvent(type === "keydown"
            ? new KeyboardEvent(type, { key: "Escape", bubbles: true, cancelable: true })
            : new Event(type, { bubbles: true, cancelable: true }));
        expect(onDismiss).not.toHaveBeenCalled();
    });

    it("does not pass an outside event to lower layers when the top callback closes itself", () => {
        const stack = createOverlayStack();
        const firstElement = document.createElement("div");
        const secondElement = document.createElement("div");
        document.body.append(firstElement, secondElement);
        const lower = vi.fn();
        const first = createDismissableLayer(firstElement, { overlayStack: stack, onPointerDownOutside: () => first.destroy() });
        const second = createDismissableLayer(secondElement, { overlayStack: stack, onPointerDownOutside: lower });
        stack.bringToFront(stack.getEntries()[0]!);
        document.body.dispatchEvent(new Event("pointerdown", { bubbles: true }));
        expect(lower).not.toHaveBeenCalled();
        second.destroy();
    });

    it("does not apply an old outside event after deactivate/reactivate in its callback", () => {
        const element = document.createElement("div");
        document.body.append(element);
        const onDismiss = vi.fn();
        const layer = createDismissableLayer(element, { onDismiss, onPointerDownOutside: () => { layer.deactivate(); layer.activate(); } });
        document.body.dispatchEvent(new Event("pointerdown", { bubbles: true }));
        expect(onDismiss).not.toHaveBeenCalled();
        expect(layer.isActive()).toBe(true);
        layer.destroy();
    });

    it("keeps independent custom stacks independently dismissable", () => {
        const element = document.createElement("div");
        const other = document.createElement("div");
        document.body.append(element, other);
        const firstDismiss = vi.fn();
        const secondDismiss = vi.fn();
        const first = createDismissableLayer(element, { overlayStack: createOverlayStack(), onDismiss: firstDismiss });
        const second = createDismissableLayer(other, { overlayStack: createOverlayStack(), onDismiss: secondDismiss });
        document.body.dispatchEvent(new Event("pointerdown", { bubbles: true }));
        expect(firstDismiss).toHaveBeenCalledOnce();
        expect(secondDismiss).toHaveBeenCalledOnce();
        first.destroy();
        second.destroy();
    });

    it("does not notify outside callbacks after destruction in a branch resolver", () => {
        const element = document.createElement("div");
        document.body.append(element);
        const onPointerDownOutside = vi.fn();
        const layer = createDismissableLayer(element, { branches: [() => { layer.destroy(); return null; }], onPointerDownOutside });
        document.body.dispatchEvent(new Event("pointerdown", { bubbles: true }));
        expect(onPointerDownOutside).not.toHaveBeenCalled();
    });
});
