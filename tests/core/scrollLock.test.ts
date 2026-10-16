import { describe, expect, it, vi } from "vitest";
import { createScrollLock } from "../../packages/core/src/scroll";

describe("Document scroll locks", () => {
    it("keeps nested locks until the last owner releases them", () => {
        const first = createScrollLock(document.body);
        const second = createScrollLock(document.body);
        const scroll = vi.spyOn(window, "scrollTo");
        first.activate();
        first.activate();
        second.activate();
        first.destroy();
        expect(document.body.style.position).toBe("fixed");
        expect(scroll).not.toHaveBeenCalled();
        second.deactivate();
        expect(document.body.style.position).toBe("");
        expect(document.documentElement.style.overflow).toBe("");
        expect(scroll).toHaveBeenCalledOnce();
        second.destroy();
    });

    it("restores borrowed style values and priorities without erasing unrelated edits", () => {
        document.body.style.setProperty("position", "relative", "important");
        document.body.style.setProperty("padding-right", "9px", "important");
        document.documentElement.style.setProperty("overflow", "auto", "important");
        const lock = createScrollLock(document.body);
        lock.activate();
        document.body.style.color = "red";
        lock.destroy();
        expect(document.body.style.position).toBe("relative");
        expect(document.body.style.getPropertyPriority("position")).toBe("important");
        expect(document.body.style.paddingRight).toBe("9px");
        expect(document.body.style.getPropertyPriority("padding-right")).toBe("important");
        expect(document.documentElement.style.getPropertyPriority("overflow")).toBe("important");
        expect(document.body.style.color).toBe("red");
        document.body.removeAttribute("style");
        document.documentElement.style.removeProperty("overflow");
    });

    it("cannot relock a document after destruction", () => {
        const lock = createScrollLock(document.body);
        lock.activate();
        lock.destroy();
        lock.activate();
        expect(lock.isActive()).toBe(false);
        expect(document.body.style.position).toBe("");
    });

    it("takes a fresh style snapshot after an ordinary deactivate/reactivate", () => {
        const lock = createScrollLock(document.body);
        lock.activate();
        lock.deactivate();
        document.body.style.position = "relative";
        lock.activate();
        lock.destroy();
        expect(document.body.style.position).toBe("relative");
        document.body.removeAttribute("style");
    });

    it("can be destroyed through an unbound cleanup callback", () => {
        const lock = createScrollLock(document.body);
        lock.activate();
        const destroy = lock.destroy;
        expect(() => destroy()).not.toThrow();
        expect(lock.isActive()).toBe(false);
        expect(document.body.style.position).toBe("");
    });

    it("keeps valid offsets for negative scroll coordinates", () => {
        const original = Object.getOwnPropertyDescriptor(window, "scrollX")!;
        Object.defineProperty(window, "scrollX", { configurable: true, value: -30 });
        const lock = createScrollLock(document.body);
        try {
            lock.activate();
            expect(document.body.style.left).toBe("30px");
            expect(document.body.style.boxSizing).toBe("border-box");
        } finally {
            lock.destroy();
            Object.defineProperty(window, "scrollX", original);
        }
    });
});
