import { describe, expect, it, vi } from "vitest";
import { getActiveElement, getOwnerDocument, getOwnerWindow, isHTMLElement } from "../../packages/core/src/dom";
import { createFocusStack, createFocusTrap, focusProgrammatically, getActiveVirtualKeyboardElement } from "../../packages/core/src/focus";

describe("focus document ownership", () => {
    it("uses an iframe document itself rather than the global document", () => {
        const frame = document.createElement("iframe");
        document.body.append(frame);
        const owner = frame.contentDocument!;
        const input = owner.createElement("input");
        owner.body.append(input);
        input.focus();
        expect(isHTMLElement(input)).toBe(true);
        expect(getOwnerDocument(owner)).toBe(owner);
        expect(getOwnerWindow(owner)).toBe(frame.contentWindow);
        expect(getActiveElement(owner)).toBe(input);
    });

    it("finds a virtual-keyboard target from a node in another realm", () => {
        const frame = document.createElement("iframe");
        document.body.append(frame);
        const input = frame.contentDocument!.createElement("input");
        frame.contentDocument!.body.append(input);
        input.focus();
        expect(getActiveVirtualKeyboardElement(input)).toBe(input);
        input.readOnly = true;
        expect(getActiveVirtualKeyboardElement(input)).toBeNull();
    });

    it("restores temporary tabindex even if a focus implementation throws", () => {
        const heading = document.createElement("h2");
        document.body.append(heading);
        vi.spyOn(heading, "focus").mockImplementation(() => { throw new Error("Focus failed"); });
        expect(() => focusProgrammatically(heading)).toThrow("Focus failed");
        expect(heading.hasAttribute("tabindex")).toBe(false);
    });

    it("keeps semantic focus out of the Tab order and releases temporary tabindex on blur", () => {
        const heading = document.createElement("h2");
        const next = document.createElement("button");
        document.body.append(heading, next);
        expect(focusProgrammatically(heading)).toBe(true);
        expect(heading.getAttribute("tabindex")).toBe("-1");
        expect(document.activeElement).toBe(heading);
        expect(focusProgrammatically(heading)).toBe(true);
        next.focus();
        expect(heading.hasAttribute("tabindex")).toBe(false);
        expect(document.activeElement).toBe(next);
    });

    it("does not remove an author tabindex change made while the semantic target was focused", () => {
        const heading = document.createElement("h2");
        const next = document.createElement("button");
        document.body.append(heading, next);
        focusProgrammatically(heading);
        heading.tabIndex = 0;
        next.focus();
        expect(heading.tabIndex).toBe(0);
    });

    it("preserves an existing negative tabindex without replacing it", () => {
        const heading = document.createElement("h2");
        heading.tabIndex = -2;
        document.body.append(heading);
        expect(focusProgrammatically(heading)).toBe(true);
        expect(heading.getAttribute("tabindex")).toBe("-2");
    });

    it("captures and restores a nested focus flow in the owning document", () => {
        const first = document.createElement("button");
        const second = document.createElement("button");
        document.body.append(first, second);
        const stack = createFocusStack();
        first.focus();
        stack.capture(document);
        second.focus();
        stack.capture(document);
        expect(stack.restore()).toBe(true);
        expect(document.activeElement).toBe(second);
        expect(stack.restore()).toBe(true);
        expect(document.activeElement).toBe(first);
        expect(stack.size()).toBe(0);
    });
});

describe("focus trap keyboard ownership", () => {
    it.each(["ctrlKey", "altKey", "metaKey", "isComposing", "handled"])("leaves %s Tab to its owner", (flag) => {
        const container = document.createElement("div");
        const first = document.createElement("button");
        const last = document.createElement("button");
        container.append(first, last);
        document.body.append(container);
        // Mock geometry only; real availability and native Tab are browser checks.
        for (const item of [first, last]) vi.spyOn(item, "getClientRects").mockReturnValue([{}] as unknown as DOMRectList);
        const trap = createFocusTrap(container);
        trap.activate();
        try {
            last.focus();
            const event = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true,
                ...(flag === "handled" ? {} : { [flag]: true }) });
            if (flag === "handled") event.preventDefault();
            last.dispatchEvent(event);
            expect(document.activeElement).toBe(last);
            if (flag !== "handled") expect(event.defaultPrevented).toBe(false);
        } finally { trap.deactivate(); }
    });

    it("does not override a Tab wrap already handled by a nested trap", () => {
        const parent = document.createElement("div");
        const before = document.createElement("button");
        const child = document.createElement("div");
        const first = document.createElement("button");
        child.append(first);
        parent.append(before, child);
        document.body.append(parent);
        for (const item of [before, first]) vi.spyOn(item, "getClientRects").mockReturnValue([{}] as unknown as DOMRectList);
        const outer = createFocusTrap(parent);
        const inner = createFocusTrap(child);
        outer.activate();
        inner.activate();
        try {
            first.focus();
            first.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true }));
            expect(document.activeElement).toBe(first);
        } finally { inner.deactivate(); outer.deactivate(); }
    });
});
