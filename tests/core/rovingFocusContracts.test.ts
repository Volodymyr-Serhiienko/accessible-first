import { describe, expect, it, vi } from "vitest";
import { createRovingFocus } from "../../packages/core/src/roving-focus";

function fixture() {
    const container = document.createElement("div");
    const buttons = ["One", "Two", "Three"].map((text) => {
        const button = document.createElement("button");
        button.textContent = text;
        return button;
    });
    container.append(...buttons);
    document.body.append(container);
    let items: HTMLElement[] = buttons;
    // jsdom has no layout; actual availability is exercised in the browser fixture.
    for (const element of [container, ...buttons]) vi.spyOn(element, "getClientRects").mockReturnValue([{}] as unknown as DOMRectList);
    const roving = createRovingFocus(container, { getItems: () => items, isItemDisabled: () => false });
    roving.activate();
    return { container, buttons, roving, replace: (next: HTMLElement[]) => { items = next; roving.refresh(); } };
}

function key(target: HTMLElement, init: KeyboardEventInit = {}): KeyboardEvent {
    const event = new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true, ...init });
    target.dispatchEvent(event);
    return event;
}

describe("roving focus boundaries", () => {
    it("rejects an element outside the current collection without moving focus", () => {
        const { buttons, roving } = fixture();
        const outsider = document.createElement("button");
        document.body.append(outsider);
        try {
            buttons[0]!.focus();
            expect(roving.setCurrentItem(outsider, { focus: true })).toBe(false);
            expect(document.activeElement).toBe(buttons[0]);
            expect(roving.getCurrentItem()).toBe(buttons[0]);
        } finally { roving.deactivate(); }
    });

    it("synchronizes a natively focused item before keyboard movement", () => {
        const { buttons, roving } = fixture();
        try {
            buttons[1]!.focus();
            expect(roving.getCurrentItem()).toBe(buttons[1]);
            expect(buttons.map((item) => item.tabIndex)).toEqual([-1, 0, -1]);
            key(buttons[1]!);
            expect(document.activeElement).toBe(buttons[2]);
        } finally { roving.deactivate(); }
    });

    it("restores and releases removed items on refresh, not only at teardown", () => {
        const { buttons, roving, replace } = fixture();
        try {
            replace(buttons.slice(1));
            expect(buttons[0]!.hasAttribute("tabindex")).toBe(false);
            buttons[0]!.tabIndex = 4;
            expect(roving.getCurrentItem()).toBe(buttons[1]);
        } finally { roving.deactivate(); }
        expect(buttons[0]!.tabIndex).toBe(4);
        expect(buttons[1]!.hasAttribute("tabindex")).toBe(false);
    });

    it.each(["ctrlKey", "altKey", "metaKey", "isComposing", "handled"])("does not take over %s navigation", (flag) => {
        const { buttons, roving } = fixture();
        try {
            buttons[0]!.focus();
            const event = new KeyboardEvent("keydown", { key: "End", bubbles: true, cancelable: true,
                ...(flag === "handled" ? {} : { [flag]: true }) });
            if (flag === "handled") event.preventDefault();
            buttons[0]!.dispatchEvent(event);
            expect(document.activeElement).toBe(buttons[0]);
            expect(roving.getCurrentItem()).toBe(buttons[0]);
            if (flag !== "handled") expect(event.defaultPrevented).toBe(false);
        } finally { roving.deactivate(); }
    });

    it("ignores keyboard input from an editable descendant or the container itself", () => {
        const container = document.createElement("div");
        const first = document.createElement("div");
        const second = document.createElement("button");
        const input = document.createElement("input");
        first.append(input);
        container.append(first, second);
        document.body.append(container);
        const roving = createRovingFocus(container, { getItems: () => [first, second], isItemDisabled: () => false });
        roving.activate();
        try {
            input.focus();
            expect(key(input, { key: "End" }).defaultPrevented).toBe(false);
            expect(document.activeElement).toBe(input);
            expect(key(container).defaultPrevented).toBe(false);
        } finally { roving.deactivate(); }
    });

    it("lets a nested collection handle its own arrows without moving its parent", () => {
        const { container, buttons, roving } = fixture();
        const nested = document.createElement("div");
        const first = document.createElement("button");
        const last = document.createElement("button");
        nested.append(first, last);
        for (const element of [nested, first, last]) vi.spyOn(element, "getClientRects").mockReturnValue([{}] as unknown as DOMRectList);
        container.insertBefore(nested, buttons[0]!);
        const child = createRovingFocus(nested, { getItems: () => [first, last], isItemDisabled: () => false });
        child.activate();
        try {
            first.focus();
            key(first);
            expect(document.activeElement).toBe(last);
            expect(roving.getCurrentItem()).toBe(buttons[0]);
        } finally { child.deactivate(); roving.deactivate(); }
    });

    it("restores original tabindex values and does nothing on refresh while inactive", () => {
        const container = document.createElement("div");
        const one = document.createElement("button");
        const two = document.createElement("button");
        two.tabIndex = 7;
        container.append(one, two);
        document.body.append(container);
        const roving = createRovingFocus(container, { getItems: () => [one, two], isItemDisabled: () => false });
        roving.activate();
        roving.deactivate();
        roving.refresh();
        expect(one.hasAttribute("tabindex")).toBe(false);
        expect(two.tabIndex).toBe(7);
        one.focus();
        expect(key(one).defaultPrevented).toBe(false);
        expect(document.activeElement).toBe(one);
    });
});
