import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi
} from "vitest";
import {
    createTooltip
} from "../../../packages/components/src/tooltip";

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
            text: "Saves the current draft."
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

        trigger.dispatchEvent(new Event("focusin", { bubbles: true }));
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

        trigger.dispatchEvent(new Event("focusin", { bubbles: true }));
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
