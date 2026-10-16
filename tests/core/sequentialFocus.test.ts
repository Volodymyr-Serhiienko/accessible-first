import { describe, expect, it, vi } from "vitest";
import { isVisible } from "../../packages/core/src/dom";
import { createFocusTrap, focusFirst, focusLast, getFocusableElements } from "../../packages/core/src/focus";

function mount(html: string): HTMLElement {
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.append(container);
    // jsdom has no layout or native Tab navigation; browser fixtures cover both.
    for (const element of container.querySelectorAll<HTMLElement>("*")) {
        vi.spyOn(element, "getClientRects").mockReturnValue([{}] as unknown as DOMRectList);
    }
    return container;
}

function ids(container: HTMLElement, backward = false): string[] {
    return getFocusableElements(container, backward).map((element) => element.id);
}

function tab(element: HTMLElement, shiftKey = false): KeyboardEvent {
    const event = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true, shiftKey });
    element.dispatchEvent(event);
    return event;
}

describe("light-DOM sequential focus", () => {
    it("sorts positive tabindex stably before ordinary controls and excludes negatives", () => {
        const container = mount('<button id="zero">Zero</button><button id="two" tabindex="2">Two</button><button id="one" tabindex="1">One</button><button id="two-later" tabindex="2">Two later</button><button tabindex="-2">Excluded</button><input id="last">');
        expect(ids(container)).toEqual(["one", "two", "two-later", "zero", "last"]);
        expect(focusFirst(container)).toBe(true);
        expect(document.activeElement?.id).toBe("one");
        expect(focusLast(container)).toBe(true);
        expect(document.activeElement?.id).toBe("last");
    });

    it("uses a checked native radio as the sole stop for its group", () => {
        const container = mount('<input type="radio" name="group" id="first" checked><input type="radio" name="group" id="last">');
        expect(ids(container)).toEqual(["first"]);
        expect(ids(container, true)).toEqual(["first"]);
    });

    it("chooses directional boundaries for an unchecked group without changing its value", () => {
        const container = mount('<input type="radio" name="group" id="first"><input type="radio" name="group" id="last">');
        expect(ids(container)).toEqual(["first"]);
        expect(ids(container, true)).toEqual(["last"]);
        focusLast(container);
        expect(document.activeElement?.id).toBe("last");
        expect(container.querySelector(":checked")).toBeNull();
        expect(ids(container)).toEqual(["last"]);
    });

    it("does not group unnamed radios or equal names belonging to different forms", () => {
        const container = mount('<input type="radio" id="unnamed-one"><input type="radio" id="unnamed-two"><form><input type="radio" name="same" id="form-one" checked></form><form><input type="radio" name="same" id="form-two" checked></form>');
        expect(ids(container)).toEqual(["unnamed-one", "unnamed-two", "form-one", "form-two"]);
    });

    it("honors external form ownership and checked members outside the container", () => {
        const outer = mount('<form id="owner"></form><input type="radio" name="a&quot;]" form="owner" checked><section><input type="radio" name="a&quot;]" form="owner" id="inside"><input type="radio" name="a&quot;]" id="other-owner"></section>');
        expect(ids(outer.querySelector("section")!)).toEqual(["other-owner"]);
    });

    it("does not let disabled or negative-tabindex checked radios remove an available stop", () => {
        const container = mount('<input type="radio" name="disabled" checked disabled><input type="radio" name="disabled" id="enabled"><input type="radio" name="negative" checked tabindex="-1"><input type="radio" name="negative" id="ordinary">');
        expect(ids(container)).toEqual(["enabled", "ordinary"]);
    });

    it("keeps radio groups isolated between roots", () => {
        const outer = mount('<input type="radio" name="same" checked>');
        const root = outer.attachShadow({ mode: "open" });
        const container = document.createElement("section");
        root.append(container);
        container.innerHTML = '<input type="radio" name="same" id="inside">';
        vi.spyOn(container.firstElementChild!, "getClientRects").mockReturnValue([{}] as unknown as DOMRectList);
        expect(ids(container)).toEqual(["inside"]);
    });
});

describe("native-boundary focus traps", () => {
    it("wraps the actual positive-tabindex boundaries", () => {
        const container = mount('<button id="zero">Zero</button><button id="two" tabindex="2">Two</button><button id="one" tabindex="1">One</button>');
        const trap = createFocusTrap(container);
        trap.activate();
        try {
            expect(document.activeElement?.id).toBe("one");
            expect(tab(document.activeElement as HTMLElement, true).defaultPrevented).toBe(true);
            expect(document.activeElement?.id).toBe("zero");
            expect(tab(document.activeElement as HTMLElement).defaultPrevented).toBe(true);
            expect(document.activeElement?.id).toBe("one");
        } finally { trap.deactivate(); }
    });

    it("wraps a single checked group even if its checked radio is not last in HTML", () => {
        const container = mount('<input type="radio" name="group" id="first" checked><input type="radio" name="group" id="last">');
        const trap = createFocusTrap(container);
        trap.activate();
        try {
            expect(tab(document.activeElement as HTMLElement).defaultPrevented).toBe(true);
            expect(document.activeElement?.id).toBe("first");
        } finally { trap.deactivate(); }
    });

    it("does not wrap an unchecked middle group across ordinary controls", () => {
        const container = mount('<button>Before</button><input type="radio" name="group" id="first"><button>Middle</button><input type="radio" name="group" id="last"><button>After</button>');
        const trap = createFocusTrap(container);
        trap.activate();
        try {
            const first = container.querySelector<HTMLElement>("#first")!;
            first.focus();
            expect(tab(first).defaultPrevented).toBe(false);
            expect(tab(first, true).defaultPrevented).toBe(false);
        } finally { trap.deactivate(); }
    });

    it("focuses an empty container, contains Tab and restores its opener and borrowed attribute", () => {
        const opener = document.createElement("button");
        const container = mount("<p>Only text</p>");
        document.body.append(opener);
        opener.focus();
        const trap = createFocusTrap(container);
        trap.activate();
        expect(document.activeElement).toBe(container);
        expect(container.tabIndex).toBe(-1);
        expect(tab(container).defaultPrevented).toBe(true);
        expect(tab(container, true).defaultPrevented).toBe(true);
        trap.deactivate();
        expect(document.activeElement).toBe(opener);
        expect(container.hasAttribute("tabindex")).toBe(false);
    });

    it("uses a semantic fallback without adding a permanent Tab stop", () => {
        const container = mount("<h2>Fallback</h2>");
        const opener = document.createElement("button");
        document.body.append(opener);
        opener.focus();
        const heading = container.querySelector<HTMLElement>("h2")!;
        const trap = createFocusTrap(container, { fallbackFocus: heading });
        trap.activate();
        try {
            expect(document.activeElement).toBe(heading);
            expect(tab(heading).defaultPrevented).toBe(true);
        } finally { trap.deactivate(); }
        expect(heading.hasAttribute("tabindex")).toBe(false);
    });
});

describe("visibility without checkVisibility support", () => {
    it("rejects nested open-details content inside a closed outer details", () => {
        const container = mount('<details><summary id="summary"><button id="allowed">Summary action</button></summary><details open><summary id="nested">Nested</summary><button id="hidden">Hidden</button></details></details>');
        expect(ids(container)).toEqual(["summary", "allowed"]);
        expect(isVisible(container.querySelector<HTMLElement>("#nested")!)).toBe(false);
        expect(isVisible(container.querySelector<HTMLElement>("#hidden")!)).toBe(false);
    });

    it("rejects content-visibility:hidden descendants but permits a visible visibility override", () => {
        const container = mount('<div style="content-visibility:hidden"><button id="hidden">Hidden</button></div><div style="visibility:hidden"><button id="visible" style="visibility:visible">Visible</button></div>');
        expect(ids(container)).toEqual(["visible"]);
    });

    it("uses native visibility when available without testing opacity or viewport position", () => {
        const container = mount("<button>Candidate</button>");
        const element = container.firstElementChild as HTMLElement;
        const check = vi.fn().mockReturnValue(false);
        Object.defineProperty(element, "checkVisibility", { configurable: true, value: check });
        expect(isVisible(element)).toBe(false);
        expect(check).toHaveBeenCalledWith({ visibilityProperty: true });
    });
});
