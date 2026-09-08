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
        expect(trigger.querySelector("[data-af-tooltip-visual]")?.textContent)
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
