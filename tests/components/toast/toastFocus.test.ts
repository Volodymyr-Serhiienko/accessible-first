import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastViewport, type Toast } from "../../../packages/components/src/toast";

function control(toast: Toast, kind = "close"): HTMLButtonElement {
    return toast.element.querySelector<HTMLButtonElement>(`[data-af-toast-${kind}]`)!;
}

describe("Toast focus ownership", () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it("pauses expiry on keyboard focus even when hover pausing is disabled", () => {
        const viewport = ToastViewport({ duration: 100, pauseOnHover: false });
        document.body.append(viewport.element);
        const toast = viewport.show("Saved");
        control(toast).focus();
        toast.element.dispatchEvent(new Event("pointerleave"));
        toast.resetDuration();
        vi.advanceTimersByTime(200);
        expect(toast.isClosed()).toBe(false);
        const outside = document.createElement("button");
        document.body.append(outside);
        outside.focus();
        vi.advanceTimersByTime(100);
        expect(toast.isClosed()).toBe(true);
        expect(document.activeElement).toBe(outside);
        viewport.destroy();
    });

    it("keeps expiry paused while focus moves between toast controls", () => {
        const viewport = ToastViewport({ duration: 100 });
        document.body.append(viewport.element);
        const toast = viewport.show({ description: "Saved", actionText: "Undo" });
        control(toast, "action").focus();
        control(toast).focus();
        vi.advanceTimersByTime(200);
        expect(toast.isClosed()).toBe(false);
        viewport.destroy();
    });

    it("does not restart expiry on pointer leave while keyboard focus is inside", () => {
        const viewport = ToastViewport({ duration: 100 });
        document.body.append(viewport.element);
        const toast = viewport.show("Saved");
        toast.element.dispatchEvent(new Event("pointerenter"));
        control(toast).focus();
        toast.element.dispatchEvent(new Event("pointerleave"));
        vi.advanceTimersByTime(200);
        expect(toast.isClosed()).toBe(false);
        viewport.destroy();
    });

    it("preserves a focused action when a toast is updated", () => {
        const viewport = ToastViewport({ duration: 100 });
        document.body.append(viewport.element);
        const toast = viewport.show({ description: "Saved", actionText: "Undo" });
        control(toast, "action").focus();
        toast.update({ description: "Saved again" });
        expect(document.activeElement).toBe(control(toast, "action"));
        vi.advanceTimersByTime(200);
        expect(toast.isClosed()).toBe(false);
        viewport.destroy();
    });

    it("returns focus to the entry control on explicit dismissal", () => {
        const entry = document.createElement("button");
        document.body.append(entry);
        const viewport = ToastViewport();
        document.body.append(viewport.element);
        const toast = viewport.show("Saved");
        entry.focus();
        control(toast).focus();
        control(toast).click();
        expect(document.activeElement).toBe(entry);
        viewport.destroy();
    });

    it("does not override focus moved by an action callback", () => {
        const next = document.createElement("button");
        document.body.append(next);
        const viewport = ToastViewport();
        document.body.append(viewport.element);
        const toast = viewport.show({ description: "Saved", actionText: "Details", onAction: () => next.focus() });
        control(toast, "action").focus();
        control(toast, "action").click();
        expect(toast.isClosed()).toBe(true);
        expect(document.activeElement).toBe(next);
        viewport.destroy();
    });

    it("uses the remaining toast control when an update removes the focused action", () => {
        const viewport = ToastViewport({ duration: 100 });
        document.body.append(viewport.element);
        const toast = viewport.show({ description: "Saved", actionText: "Undo" });
        control(toast, "action").focus();
        toast.update({ actionText: "" });
        expect(document.activeElement).toBe(control(toast));
        vi.advanceTimersByTime(200);
        expect(toast.isClosed()).toBe(false);
        viewport.destroy();
    });

    it("returns to the entry control when an update removes all focused controls", () => {
        const entry = document.createElement("button");
        document.body.append(entry);
        const viewport = ToastViewport();
        document.body.append(viewport.element);
        const toast = viewport.show("Saved");
        entry.focus();
        control(toast).focus();
        toast.update({ dismissible: false });
        expect(document.activeElement).toBe(entry);
        viewport.destroy();
    });

    it("applies runtime hover policy changes without overriding focused pause", () => {
        const viewport = ToastViewport({ duration: 100, pauseOnHover: false });
        document.body.append(viewport.element);
        const toast = viewport.show("Saved");
        toast.element.dispatchEvent(new Event("pointerenter"));
        viewport.update({ pauseOnHover: true });
        vi.advanceTimersByTime(200);
        expect(toast.isClosed()).toBe(false);
        control(toast).focus();
        viewport.update({ pauseOnHover: false });
        vi.advanceTimersByTime(200);
        expect(toast.isClosed()).toBe(false);
        viewport.destroy();
    });

    it("protects the focused toast from background limit eviction", () => {
        const viewport = ToastViewport({ limit: 1 });
        document.body.append(viewport.element);
        const first = viewport.show("First");
        control(first).focus();
        const second = viewport.show("Second");
        expect(first.isClosed()).toBe(false);
        expect(second.isClosed()).toBe(true);
        expect(document.activeElement).toBe(control(first));
        viewport.destroy();
    });

    it("retains a focused toast at limit zero until focus leaves", () => {
        const viewport = ToastViewport();
        document.body.append(viewport.element);
        const toast = viewport.show("Saved");
        control(toast).focus();
        viewport.update({ limit: 0 });
        expect(toast.isClosed()).toBe(false);
        const outside = document.createElement("button");
        document.body.append(outside);
        outside.focus();
        expect(toast.isClosed()).toBe(true);
        expect(document.activeElement).toBe(outside);
        viewport.destroy();
    });

    it("finishes viewport destruction even if a close callback throws", () => {
        const viewport = ToastViewport();
        document.body.append(viewport.element);
        viewport.show({ description: "First", onClose: () => { throw new Error("Close failed"); } });
        viewport.show("Second");
        vi.advanceTimersByTime(50);
        expect(() => viewport.destroy()).toThrow("Close failed");
        expect(viewport.getToasts()).toEqual([]);
        expect(document.querySelectorAll("[data-af-live-region]")).toHaveLength(0);
        expect(viewport.element.hasAttribute("role")).toBe(false);
        expect(() => viewport.destroy()).not.toThrow();
    });

    it("does not mutate or resubscribe after destruction", () => {
        const viewport = ToastViewport();
        viewport.destroy();
        const html = viewport.element.outerHTML;
        const subscribe = vi.fn(() => () => undefined);
        viewport.update({ label: "Late", locale: { t: () => "Late", subscribe } });
        expect(subscribe).not.toHaveBeenCalled();
        expect(viewport.element.outerHTML).toBe(html);
    });

    it("only announces the latest queued revision at its own priority", () => {
        const viewport = ToastViewport();
        document.body.append(viewport.element);
        const toast = viewport.show({ description: "Old", politeness: "assertive" });
        toast.update({ description: "New", politeness: "polite" });
        vi.advanceTimersByTime(100);
        expect([...document.querySelectorAll('[aria-live="polite"]')].map((node) => node.textContent)).toContain("New");
        expect([...document.querySelectorAll('[aria-live="assertive"]')].every((node) => !node.textContent)).toBe(true);
        viewport.destroy();
    });
});
