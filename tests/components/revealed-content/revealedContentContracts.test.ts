import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi
} from "vitest";
import {
    Accordion
} from "../../../packages/components/src/accordion";
import {
    Disclosure
} from "../../../packages/components/src/disclosure";
import {
    Popover
} from "../../../packages/components/src/popover";

const announcementDelay = 50;

function getPoliteMessages(): string[] {
    return [
        ...document.querySelectorAll<HTMLElement>('[aria-live="polite"]')
    ].map((region) => region.textContent ?? "");
}

function setBoundingRect(
    element: HTMLElement,
    left: number,
    top: number,
    width: number,
    height: number
): void {
    const right = left + width;
    const bottom = top + height;
    const rect = {
        x: left,
        y: top,
        width,
        height,
        top,
        right,
        bottom,
        left,
        toJSON: () => ({})
    } as DOMRect;

    Object.defineProperty(element, "getBoundingClientRect", {
        configurable: true,
        value: () => rect
    });
}

describe("revealed content contracts", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("keeps a disclosure description out of trigger speech and announces it when opened", () => {
        const changes: boolean[] = [];
        const disclosure = Disclosure({
            trigger: "Project details",
            description: "Use Tab to reach the actions in this panel.",
            panel: "Project information and actions.",
            onOpenChange(open) {
                changes.push(open);
            }
        });

        document.body.append(disclosure.element);

        expect(disclosure.trigger.getAttribute("aria-expanded")).toBe("false");
        expect(disclosure.trigger.getAttribute("aria-controls"))
            .toBe(disclosure.panel.id);
        expect(disclosure.trigger.hasAttribute("aria-describedby")).toBe(false);
        expect(disclosure.panel.hidden).toBe(true);

        disclosure.trigger.click();

        expect(disclosure.isOpen()).toBe(true);
        expect(disclosure.trigger.getAttribute("aria-expanded")).toBe("true");
        expect(disclosure.panel.hidden).toBe(false);
        expect(changes).toEqual([true]);

        vi.advanceTimersByTime(announcementDelay);

        expect(getPoliteMessages())
            .toContain("Use Tab to reach the actions in this panel.");

        disclosure.trigger.click();

        expect(disclosure.isOpen()).toBe(false);
        expect(disclosure.panel.hidden).toBe(true);
        expect(changes).toEqual([true, false]);

        disclosure.destroy();
    });

    it("gives accordion items independent semantic panels and concise open feedback", () => {
        const changes: Array<{ value: string; open: boolean }> = [];
        const accordion = Accordion({
            items: [
                {
                    value: "details",
                    trigger: "Project details",
                    description: "Project details are shown in this panel.",
                    panel: "Project information."
                },
                {
                    value: "locked",
                    trigger: "Locked details",
                    description: "This panel is unavailable.",
                    panel: "Unavailable information.",
                    disabled: true
                }
            ],
            onOpenChange(detail) {
                changes.push({
                    value: detail.value,
                    open: detail.open
                });
            }
        });

        document.body.append(accordion.element);

        const details = accordion.items[0];
        const locked = accordion.items[1];

        if (!details || !locked) {
            throw new Error("Expected two composed accordion items.");
        }

        expect(details.heading.tagName).toBe("H3");
        expect(details.trigger.hasAttribute("aria-describedby")).toBe(false);
        expect(details.panel.getAttribute("role")).toBe("region");
        expect(details.panel.getAttribute("aria-labelledby"))
            .toBe(details.trigger.id);

        details.trigger.click();

        expect(details.isOpen()).toBe(true);
        expect(details.panel.hidden).toBe(false);
        expect(changes).toEqual([{ value: "details", open: true }]);

        vi.advanceTimersByTime(announcementDelay);

        expect(getPoliteMessages())
            .toContain("Project details are shown in this panel.");

        locked.trigger.click();

        expect(locked.isOpen()).toBe(false);
        expect(changes).toEqual([{ value: "details", open: true }]);

        details.trigger.click();

        expect(details.isOpen()).toBe(false);
        expect(changes).toEqual([
            { value: "details", open: true },
            { value: "details", open: false }
        ]);

        accordion.destroy();
    });

    it("announces a composed popover description on open without attaching it to the trigger", () => {
        const popover = Popover({
            trigger: "Open guidance",
            description: "Use Tab to move into the guidance panel.",
            children: ["Guidance content."]
        });

        setBoundingRect(popover.trigger, 40, 40, 160, 44);
        setBoundingRect(popover.content, 40, 92, 240, 96);

        document.body.append(popover.element);

        expect(popover.content.hidden).toBe(true);
        expect(popover.trigger.hasAttribute("aria-describedby")).toBe(false);
        expect(popover.content.hasAttribute("aria-describedby")).toBe(false);

        popover.trigger.focus();
        popover.trigger.click();

        expect(popover.isOpen()).toBe(true);
        expect(popover.content.hidden).toBe(false);
        expect(popover.trigger.getAttribute("aria-expanded")).toBe("true");

        vi.advanceTimersByTime(announcementDelay);

        expect(getPoliteMessages())
            .toContain("Use Tab to move into the guidance panel.");

        const escape = new KeyboardEvent("keydown", {
            key: "Escape",
            bubbles: true,
            cancelable: true
        });

        document.dispatchEvent(escape);

        expect(escape.defaultPrevented).toBe(true);
        expect(popover.isOpen()).toBe(false);
        expect(popover.content.hidden).toBe(true);
        expect(document.activeElement).toBe(popover.trigger);

        popover.destroy();
    });
});
