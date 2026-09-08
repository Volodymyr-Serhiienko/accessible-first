import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi
} from "vitest";
import {
    AlertDialog
} from "../../../packages/components/src/alert-dialog";
import {
    Dialog
} from "../../../packages/components/src/dialog";
import {
    createPopover
} from "../../../packages/components/src/popover";

const announcementDelay = 50;

function createButton(text: string): HTMLButtonElement {
    const button = document.createElement("button");

    button.type = "button";
    button.textContent = text;

    return button;
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

describe("overlay contracts", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("opens a dialog with native relationships and restores trigger focus after Escape", () => {
        const dialog = Dialog({
            trigger: "Open settings",
            title: "Settings",
            description: "Change application preferences."
        });

        document.body.append(dialog.element);

        dialog.trigger.focus();
        dialog.trigger.click();

        expect(dialog.isOpen()).toBe(true);
        expect(dialog.dialogElement.hidden).toBe(false);
        expect(dialog.dialogElement.getAttribute("role")).toBe("dialog");
        expect(dialog.dialogElement.getAttribute("aria-modal")).toBe("true");
        expect(dialog.trigger.getAttribute("aria-controls"))
            .toBe(dialog.dialogElement.id);
        expect(dialog.trigger.getAttribute("aria-expanded")).toBe("true");
        expect(dialog.dialogElement.contains(document.activeElement))
            .toBe(true);

        const escape = new KeyboardEvent("keydown", {
            key: "Escape",
            bubbles: true,
            cancelable: true
        });

        document.dispatchEvent(escape);

        expect(escape.defaultPrevented).toBe(true);
        expect(dialog.isOpen()).toBe(false);
        expect(dialog.dialogElement.hidden).toBe(true);
        expect(dialog.trigger.getAttribute("aria-expanded")).toBe("false");
        expect(document.activeElement).toBe(dialog.trigger);

        dialog.destroy();
    });

    it("uses alert dialog safety defaults for focus and outside pointer dismissal", () => {
        const alertDialog = AlertDialog({
            trigger: "Delete lesson",
            title: "Delete this lesson?",
            description: "This action cannot be undone."
        });
        const outside = createButton("Outside");

        document.body.append(alertDialog.element, outside);

        alertDialog.trigger.focus();
        alertDialog.trigger.click();

        expect(alertDialog.isOpen()).toBe(true);
        expect(alertDialog.dialogElement.getAttribute("role"))
            .toBe("alertdialog");
        expect(alertDialog.dialogElement.getAttribute("aria-modal"))
            .toBe("true");

        const descriptionId = alertDialog.dialogElement
            .getAttribute("aria-describedby") ?? "";

        expect(descriptionId).not.toBe("");
        expect(document.getElementById(descriptionId)?.textContent)
            .toBe("This action cannot be undone.");
        expect(document.activeElement).toBe(alertDialog.cancelButton);

        outside.dispatchEvent(new Event("pointerdown", {
            bubbles: true,
            cancelable: true
        }));

        expect(alertDialog.isOpen()).toBe(true);

        alertDialog.confirmButton.click();

        expect(alertDialog.isOpen()).toBe(false);
        expect(document.activeElement).toBe(alertDialog.trigger);

        alertDialog.destroy();
    });

    it("keeps popover trigger semantics, announces configured opening text, and closes with Escape", () => {
        const trigger = createButton("More information");
        const content = document.createElement("div");

        content.hidden = true;
        content.textContent = "Additional lesson details.";

        setBoundingRect(trigger, 40, 40, 160, 44);
        setBoundingRect(content, 40, 92, 240, 96);

        document.body.append(trigger, content);

        const popover = createPopover(content, {
            trigger,
            contentId: "lesson-details",
            role: "dialog",
            announcement: "Lesson details opened."
        });

        trigger.focus();
        trigger.click();

        expect(popover.isOpen()).toBe(true);
        expect(content.hidden).toBe(false);
        expect(trigger.getAttribute("aria-haspopup")).toBe("dialog");
        expect(trigger.getAttribute("aria-controls"))
            .toBe("lesson-details");
        expect(trigger.getAttribute("aria-expanded")).toBe("true");

        vi.advanceTimersByTime(announcementDelay);

        const politeText = [
            ...document.querySelectorAll<HTMLElement>('[aria-live="polite"]')
        ].map((region) => region.textContent);

        expect(politeText).toContain("Lesson details opened.");

        const escape = new KeyboardEvent("keydown", {
            key: "Escape",
            bubbles: true,
            cancelable: true
        });

        document.dispatchEvent(escape);

        expect(escape.defaultPrevented).toBe(true);
        expect(popover.isOpen()).toBe(false);
        expect(content.hidden).toBe(true);
        expect(trigger.getAttribute("aria-expanded")).toBe("false");
        expect(document.activeElement).toBe(trigger);

        popover.destroy();

        expect(trigger.hasAttribute("aria-haspopup")).toBe(false);
        expect(trigger.hasAttribute("aria-controls")).toBe(false);
        expect(trigger.hasAttribute("aria-expanded")).toBe(false);
    });
});
