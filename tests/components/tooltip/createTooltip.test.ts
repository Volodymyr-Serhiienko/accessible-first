import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi
} from "vitest";
import {
    createTooltip,
    Tooltip
} from "../../../packages/components/src/tooltip";
import { createPopover } from "../../../packages/components/src/popover";

const announcementDelay = 50;

function createTrigger(): HTMLButtonElement {
    const trigger = document.createElement("button");

    trigger.type = "button";
    trigger.textContent = "Save";
    document.body.append(trigger);

    return trigger;
}

function createRect(
    left: number,
    right: number,
    top = 0,
    bottom = 32
): DOMRect {
    return {
        x: left,
        y: top,
        top,
        right,
        bottom,
        left,
        width: right - left,
        height: bottom - top,
        toJSON: () => ({})
    } as DOMRect;
}

describe("createTooltip", () => {
    it("exposes only its own visual layer for local styling throughout its lifecycle", () => {
        const first = createTooltip(createTrigger(), { text: "Translation" });
        const second = createTooltip(createTrigger(), { text: "Tools" });
        try {
            const visual = first.getVisualElement();
            expect(visual?.hasAttribute("data-af-tooltip-visual")).toBe(true);
            expect(visual).not.toBe(first.getContentElement());
            expect(visual).not.toBe(second.getVisualElement());
            visual?.classList.add("translation-tooltip");
            first.setText("Updated translation");
            expect(first.getVisualElement()).toBe(visual);
            expect(first.getVisualElement()?.classList.contains("translation-tooltip")).toBe(true);
            expect(second.getVisualElement()?.classList.contains("translation-tooltip")).toBe(false);
            first.setText(null);
            expect(first.getVisualElement()).toBeNull();
            expect(visual?.isConnected).toBe(false);
            first.setText("Restored translation");
            expect(first.getVisualElement()?.isConnected).toBe(true);
            expect(first.getVisualElement()).not.toBe(visual);
            first.destroy();
            expect(first.getVisualElement()).toBeNull();
            expect(second.getVisualElement()?.isConnected).toBe(true);
        } finally {
            first.destroy();
            second.destroy();
        }
    });

    it.each(["enhancement", "composition"] as const)("%s defaults to a focus description and a hover-only visual layer", kind => {
        const trigger = createTrigger();
        const tooltip = kind === "enhancement" ? createTooltip(trigger, { text: "Draft help" })
            : Tooltip({ trigger, text: "Draft help" });
        if ("element" in tooltip) document.body.append(tooltip.element);
        try {
            trigger.focus();
            const describedBy = trigger.getAttribute("aria-describedby")!;
            expect(document.getElementById(describedBy)?.textContent).toBe("Draft help");
            expect(document.querySelector("[data-af-tooltip-visible]")).toBeNull();
            const touch = new Event("pointerenter");
            Object.defineProperty(touch, "pointerType", { value: "touch" });
            trigger.dispatchEvent(touch);
            expect(document.querySelector("[data-af-tooltip-visible]")).toBeNull();
            trigger.dispatchEvent(new Event("pointerenter"));
            expect(document.querySelector("[data-af-tooltip-visible]")).not.toBeNull();
            trigger.dispatchEvent(new Event("pointerleave"));
            expect(document.querySelector("[data-af-tooltip-visible]")).toBeNull();
            expect(document.getElementById(describedBy)?.textContent).toBe("Draft help");
        } finally { tooltip.destroy(); }
    });

    it("keeps visual text in its own scroller without replacing the pointer bridge on updates", () => {
        const trigger = createTrigger();
        const tooltip = createTooltip(trigger, {
            text: "Short hint.",
            describe: true
        });
        const visual = document.querySelector<HTMLElement>("[data-af-tooltip-visual]");
        const content = visual?.querySelector<HTMLElement>("[data-af-tooltip-text]");

        expect(content?.parentElement).toBe(visual);
        expect(content?.textContent).toBe("Short hint.");
        expect(visual?.getAttribute("aria-hidden")).toBe("true");

        tooltip.setText("A longer hint that wraps onto multiple lines.");

        expect(visual?.querySelector("[data-af-tooltip-text]")).toBe(content);
        expect(content?.textContent).toBe("A longer hint that wraps onto multiple lines.");
        expect(tooltip.getContentElement()?.textContent).toBe(content?.textContent);

        tooltip.setText(null);
        expect(document.querySelector("[data-af-tooltip-text]")).toBeNull();
        tooltip.setText("Restored hint.");
        expect(document.querySelector("[data-af-tooltip-text]")?.textContent).toBe("Restored hint.");
        tooltip.destroy();
        expect(document.querySelector("[data-af-tooltip-text]")).toBeNull();
    });

    it("preserves the visual-focus option when a composed trigger is replaced", () => {
        const trigger = createTrigger();
        const composed = Tooltip({ trigger, text: "Account", showOnFocus: false });
        document.body.append(composed.element);
        trigger.focus();
        expect(document.querySelector("[data-af-tooltip-visible]")).toBeNull();
        expect(trigger.hasAttribute("aria-describedby")).toBe(true);
        composed.setShowOnFocus(true);
        expect(document.querySelector("[data-af-tooltip-visible]")).not.toBeNull();
        composed.update({ trigger: createTrigger(), showOnFocus: false });
        composed.target.focus();
        expect(document.querySelector("[data-af-tooltip-visible]")).toBeNull();
        composed.destroy();
    });

    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("connects optional description text and restores original attributes", () => {
        const trigger = createTrigger();

        trigger.setAttribute("aria-describedby", "existing-description");

        const tooltip = createTooltip(trigger, {
            id: "save-tooltip",
            text: "Saves the current draft.",
            describe: true
        });
        const content = tooltip.getContentElement();

        expect(trigger.hasAttribute("data-af-tooltip")).toBe(true);
        expect(trigger.getAttribute("aria-describedby"))
            .toContain("existing-description");
        expect(trigger.getAttribute("aria-describedby"))
            .toContain("save-tooltip");
        expect(content?.id).toBe("save-tooltip");
        expect(content?.getAttribute("role")).toBe("tooltip");
        expect(content?.textContent).toBe("Saves the current draft.");
        expect(document.querySelector("[data-af-tooltip-visual]")?.textContent)
            .toBe("Saves the current draft.");

        tooltip.setText(null);

        expect(trigger.hasAttribute("data-af-tooltip")).toBe(false);
        expect(trigger.getAttribute("aria-describedby"))
            .toBe("existing-description");
        expect(tooltip.getContentElement()).toBeNull();

        tooltip.destroy();

        expect(trigger.hasAttribute("data-af-tooltip")).toBe(false);
        expect(trigger.hasAttribute("data-af-tooltip-dismissed")).toBe(false);
        expect(trigger.getAttribute("aria-describedby"))
            .toBe("existing-description");
    });

    it("dismisses an active tooltip with Escape without moving focus", () => {
        const trigger = createTrigger();
        const tooltip = createTooltip(trigger, {
            text: "Saves the current draft.", showOnFocus: true
        });

        trigger.focus();

        const escape = new KeyboardEvent("keydown", {
            key: "Escape",
            bubbles: true,
            cancelable: true
        });

        document.dispatchEvent(escape);

        expect(escape.defaultPrevented).toBe(true);
        expect(trigger.getAttribute("data-af-tooltip-dismissed"))
            .toBe("true");
        expect(document.activeElement).toBe(trigger);

        tooltip.destroy();
    });

    it("does not consume later Escape keys after dismissal until a new hover or focus session", () => {
        const trigger = createTrigger();
        const tooltip = createTooltip(trigger, { text: "Hint", showOnFocus: true });
        const escape = () => {
            const event = new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true });
            trigger.dispatchEvent(event);
            return event.defaultPrevented;
        };
        try {
            trigger.focus();
            expect(escape()).toBe(true);
            expect(escape()).toBe(false);
            expect(document.activeElement).toBe(trigger);
            trigger.blur();
            trigger.focus();
            expect(escape()).toBe(true);
        } finally {
            tooltip.destroy();
        }
    });

    it("lets a popover handle the next Escape after its trigger tooltip has been dismissed", () => {
        const trigger = createTrigger();
        const tooltip = createTooltip(trigger, { text: "Open tools" });
        const panel = document.createElement("div");
        const action = document.createElement("button");
        action.textContent = "Panel action";
        panel.append(action);
        document.body.append(panel);
        const popover = createPopover(panel, { trigger, closeOnAnchorHidden: false, autoUpdate: false });
        try {
            trigger.dispatchEvent(new Event("pointerenter"));
            trigger.click();
            action.focus();
            action.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
            expect(popover.isOpen()).toBe(true);
            expect(trigger.getAttribute("data-af-tooltip-dismissed")).toBe("true");
            action.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
            expect(popover.isOpen()).toBe(false);
            expect(document.activeElement).toBe(trigger);
        } finally {
            popover.destroy();
            tooltip.destroy();
        }
    });

    it("shifts a visual tooltip left after pointer entry to keep its right edge inside the viewport", () => {
        const trigger = createTrigger();
        const tooltip = createTooltip(trigger, {
            text: "Saves the current draft."
        });
        const visual = trigger.ownerDocument.querySelector<HTMLElement>(
            "[data-af-tooltip-visual]"
        );
        const originalInnerWidth = window.innerWidth;

        expect(visual).not.toBeNull();

        vi.runAllTimers();

        Object.defineProperty(window, "innerWidth", {
            configurable: true,
            value: 320
        });

        vi.spyOn(visual!, "getBoundingClientRect")
            .mockReturnValue(createRect(0, 80));
        vi.spyOn(trigger, "getBoundingClientRect")
            .mockReturnValue(createRect(280, 300, 100, 132));

        const pointerEnter = new Event("pointerenter");

        Object.defineProperty(pointerEnter, "pointerType", {
            value: "mouse"
        });

        trigger.dispatchEvent(pointerEnter);
        vi.advanceTimersByTime(20);

        expect(visual!.style.getPropertyValue("--af-tooltip-left"))
            .toBe("232px");
        expect(visual!.style.getPropertyValue("--af-tooltip-top"))
            .toBe("60px");
        expect(visual!.getAttribute("data-af-tooltip-placement")).toBe("top");
        expect(visual!.hasAttribute("data-af-tooltip-positioned")).toBe(true);

        Object.defineProperty(window, "innerWidth", {
            configurable: true,
            value: originalInnerWidth
        });

        tooltip.destroy();
    });

    it("uses a document overlay while preserving pointer access to the visible tooltip", () => {
        const trigger = createTrigger();
        const tooltip = createTooltip(trigger, {
            text: "Saves the current draft."
        });
        const visual = trigger.ownerDocument.querySelector<HTMLElement>(
            "[data-af-tooltip-visual]"
        );
        const pointerEnter = new Event("pointerenter");

        expect(visual).not.toBeNull();
        expect(visual?.parentElement).toBe(document.body);

        Object.defineProperty(pointerEnter, "pointerType", {
            value: "mouse"
        });

        trigger.dispatchEvent(pointerEnter);
        vi.advanceTimersByTime(20);

        const pointerLeaveTrigger = new Event("pointerleave");

        Object.defineProperty(pointerLeaveTrigger, "relatedTarget", {
            value: visual
        });

        trigger.dispatchEvent(pointerLeaveTrigger);

        expect(visual?.hasAttribute("data-af-tooltip-visible")).toBe(true);

        const pointerLeaveVisual = new Event("pointerleave");

        Object.defineProperty(pointerLeaveVisual, "relatedTarget", {
            value: null
        });

        visual?.dispatchEvent(pointerLeaveVisual);

        expect(visual?.hasAttribute("data-af-tooltip-visible")).toBe(false);

        tooltip.destroy();
    });

    it("shifts a visual tooltip right to keep its left edge inside the viewport", () => {
        const trigger = createTrigger();
        const tooltip = createTooltip(trigger, {
            text: "Saves the current draft."
        });
        const visual = trigger.ownerDocument.querySelector<HTMLElement>(
            "[data-af-tooltip-visual]"
        );

        expect(visual).not.toBeNull();

        vi.runAllTimers();

        vi.spyOn(visual!, "getBoundingClientRect")
            .mockReturnValue(createRect(0, 80));
        vi.spyOn(trigger, "getBoundingClientRect")
            .mockReturnValue(createRect(20, 40, 100, 132));

        trigger.dispatchEvent(new Event("pointerenter"));
        vi.advanceTimersByTime(20);

        expect(visual!.style.getPropertyValue("--af-tooltip-left"))
            .toBe("8px");
        expect(visual!.style.getPropertyValue("--af-tooltip-top"))
            .toBe("60px");
        expect(visual!.getAttribute("data-af-tooltip-placement")).toBe("top");
        expect(visual!.hasAttribute("data-af-tooltip-positioned")).toBe(true);

        tooltip.destroy();
    });

    it("opens below a trigger near the top edge without leaving the viewport", () => {
        const trigger = createTrigger();
        const tooltip = createTooltip(trigger, {
            text: "Saves the current draft."
        });
        const visual = trigger.ownerDocument.querySelector<HTMLElement>(
            "[data-af-tooltip-visual]"
        );
        const originalInnerHeight = window.innerHeight;

        expect(visual).not.toBeNull();

        vi.runAllTimers();

        Object.defineProperty(window, "innerHeight", {
            configurable: true,
            value: 200
        });

        vi.spyOn(visual!, "getBoundingClientRect")
            .mockReturnValue(createRect(0, 80, 0, 40));
        vi.spyOn(trigger, "getBoundingClientRect")
            .mockReturnValue(createRect(20, 40, 4, 36));

        trigger.dispatchEvent(new Event("pointerenter"));
        vi.advanceTimersByTime(20);

        expect(visual!.style.getPropertyValue("--af-tooltip-left"))
            .toBe("8px");
        expect(visual!.style.getPropertyValue("--af-tooltip-top"))
            .toBe("44px");
        expect(visual!.getAttribute("data-af-tooltip-placement"))
            .toBe("bottom");

        Object.defineProperty(window, "innerHeight", {
            configurable: true,
            value: originalInnerHeight
        });

        tooltip.destroy();
    });

    it("uses the shared live region only when hover announcement is enabled", () => {
        const trigger = createTrigger();
        const tooltip = createTooltip(trigger, {
            text: "Saves the current draft.",
            announceOnHover: true
        });
        const pointerEnter = new Event("pointerenter");

        Object.defineProperty(pointerEnter, "pointerType", {
            value: "mouse"
        });

        trigger.dispatchEvent(pointerEnter);
        vi.advanceTimersByTime(announcementDelay);

        const politeText = [
            ...document.querySelectorAll<HTMLElement>('[aria-live="polite"]')
        ].map((region) => region.textContent);

        expect(politeText).toContain("Saves the current draft.");

        tooltip.destroy();

        expect(document.querySelectorAll("[data-af-live-region]"))
            .toHaveLength(0);
    });
});
