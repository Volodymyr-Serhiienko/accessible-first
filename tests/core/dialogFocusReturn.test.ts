import { describe, expect, it, vi } from "vitest";
import { createDialog } from "../../packages/core/src/dialog";

function fixture() {
    const opener = document.createElement("button");
    const outside = document.createElement("button");
    const element = document.createElement("div");
    const inside = document.createElement("button");
    element.hidden = true;
    element.append(inside);
    document.body.append(opener, element, outside);
    opener.focus();
    return { opener, outside, element, inside };
}

describe("Dialog return-focus ownership", () => {
    it.each([{ modal: false }, { trapFocus: false }])("restores focus without a Tab trap: %j", (options) => {
        const { opener, element, inside } = fixture();
        const dialog = createDialog(element, { ...options, initialFocus: inside });
        dialog.open();
        expect(document.activeElement).toBe(inside);
        dialog.close();
        expect(document.activeElement).toBe(opener);
        dialog.destroy();
    });

    it("does not steal focus already moved outside an untrapped dialog", () => {
        const { outside, element, inside } = fixture();
        const dialog = createDialog(element, { modal: false, initialFocus: inside });
        dialog.open();
        outside.focus();
        dialog.close();
        expect(document.activeElement).toBe(outside);
        dialog.destroy();
    });

    it("honors restoreFocus false for an untrapped dialog", () => {
        const { opener, element, inside } = fixture();
        const dialog = createDialog(element, { modal: false, initialFocus: inside, restoreFocus: false });
        dialog.open();
        dialog.close();
        expect(document.activeElement).not.toBe(opener);
        dialog.destroy();
    });

    it("captures a fresh opener on each untrapped opening", () => {
        const { opener, outside, element, inside } = fixture();
        const dialog = createDialog(element, { modal: false, initialFocus: inside });
        dialog.open();
        dialog.close();
        expect(document.activeElement).toBe(opener);
        outside.focus();
        dialog.open();
        dialog.close();
        expect(document.activeElement).toBe(outside);
        dialog.destroy();
    });

    it("restores untrapped focus on destruction and ignores late calls", () => {
        const { opener, element, inside } = fixture();
        const onOpenChange = vi.fn();
        const dialog = createDialog(element, { modal: false, initialFocus: inside, onOpenChange });
        dialog.open();
        dialog.destroy();
        expect(document.activeElement).toBe(opener);
        const html = element.outerHTML;
        onOpenChange.mockClear();
        dialog.open();
        dialog.close();
        dialog.toggle();
        expect(element.outerHTML).toBe(html);
        expect(onOpenChange).not.toHaveBeenCalled();
    });

    it("does not focus a removed opener or guess another destination", () => {
        const { opener, element, inside, outside } = fixture();
        const dialog = createDialog(element, { modal: false, initialFocus: inside });
        dialog.open();
        opener.remove();
        const focus = vi.spyOn(outside, "focus");
        dialog.close();
        expect(focus).not.toHaveBeenCalled();
        expect(document.activeElement).not.toBe(opener);
        dialog.destroy();
    });

    it.each([true, false])("keeps a newer reopening visible during return focus (trapped=%s)", (trapFocus) => {
        const { opener, element, inside } = fixture();
        const onOpenChange = vi.fn();
        const dialog = createDialog(element, { trapFocus, initialFocus: inside, onOpenChange });
        dialog.open();
        onOpenChange.mockClear();
        opener.addEventListener("focus", () => dialog.open(), { once: true });
        dialog.close();
        expect(dialog.isOpen()).toBe(true);
        expect(element.hidden).toBe(false);
        expect(document.activeElement).toBe(inside);
        expect(onOpenChange.mock.calls).toEqual([[true]]);
        dialog.destroy();
    });

    it("does not notify a stale opening after initial focus destroys the dialog", () => {
        const { element, inside } = fixture();
        const onOpenChange = vi.fn();
        const dialog = createDialog(element, { initialFocus: inside, onOpenChange });
        inside.addEventListener("focus", () => dialog.destroy(), { once: true });
        dialog.open();
        expect(element.hidden).toBe(true);
        expect(element.hasAttribute("role")).toBe(false);
        expect(onOpenChange).not.toHaveBeenCalled();
    });

    it("restores owned attributes even if return focus throws", () => {
        const { opener, element, inside } = fixture();
        const dialog = createDialog(element, { initialFocus: inside });
        dialog.open();
        vi.spyOn(opener, "focus").mockImplementation(() => { throw new Error("Focus failed"); });
        expect(() => dialog.destroy()).toThrow("Focus failed");
        expect(element.hidden).toBe(true);
        expect(element.hasAttribute("role")).toBe(false);
        expect(element.hasAttribute("tabindex")).toBe(false);
        expect(() => dialog.destroy()).not.toThrow();
    });
});
