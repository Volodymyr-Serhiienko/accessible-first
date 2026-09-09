import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi
} from "vitest";
import {
    ToastViewport,
    type ToastCloseReason
} from "../../../packages/components/src/toast";

describe("ToastViewport", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("renders non-modal feedback, announces it once, and cleans up after dismissal", () => {
        const closeReasons: ToastCloseReason[] = [];
        const viewport = ToastViewport({
            label: "Application notifications",
            duration: null
        });

        document.body.append(viewport.element);

        const toast = viewport.show({
            title: "Draft saved",
            description: "Your changes were saved locally.",
            variant: "success",
            onClose(reason) {
                closeReasons.push(reason);
            }
        });

        expect(viewport.element.getAttribute("role")).toBe("region");
        expect(viewport.element.getAttribute("aria-label"))
            .toBe("Application notifications");
        expect(toast.element.getAttribute("role")).toBeNull();
        expect(toast.element.getAttribute("aria-live")).toBeNull();
        expect(toast.element.getAttribute("data-af-variant")).toBe("success");
        expect(toast.element.textContent)
            .toContain("Draft saved");
        expect(toast.element.textContent)
            .toContain("Your changes were saved locally.");

        vi.runAllTimers();

        const politeText = [
            ...document.querySelectorAll<HTMLElement>('[aria-live="polite"]')
        ].map((region) => region.textContent);

        expect(politeText)
            .toContain("Draft saved. Your changes were saved locally.");

        const closeButton = toast.element
            .querySelector<HTMLButtonElement>("[data-af-toast-close]");

        expect(closeButton).not.toBeNull();

        closeButton?.click();

        expect(toast.isClosed()).toBe(true);
        expect(closeReasons).toEqual(["dismiss"]);
        expect(viewport.getToasts()).toEqual([]);

        viewport.destroy();

        expect(viewport.element.hasAttribute("role")).toBe(false);
        expect(viewport.element.hasAttribute("aria-label")).toBe(false);
        expect(document.querySelectorAll("[data-af-live-region]"))
            .toHaveLength(0);
    });

    it("enforces its visible limit and closes timed notifications", () => {
        const closeReasons: ToastCloseReason[] = [];
        const viewport = ToastViewport({
            limit: 1,
            duration: 40,
            dismissible: false
        });

        document.body.append(viewport.element);

        const first = viewport.show({
            description: "First notification",
            onClose(reason) {
                closeReasons.push(reason);
            }
        });

        const second = viewport.show({
            description: "Second notification",
            onClose(reason) {
                closeReasons.push(reason);
            }
        });

        expect(first.isClosed()).toBe(true);
        expect(second.isClosed()).toBe(false);
        expect(closeReasons).toEqual(["limit"]);
        expect(viewport.getToasts()).toEqual([second]);

        vi.advanceTimersByTime(40);

        expect(second.isClosed()).toBe(true);
        expect(closeReasons).toEqual(["limit", "timeout"]);
        expect(viewport.getToasts()).toEqual([]);

        viewport.destroy();
    });
});
