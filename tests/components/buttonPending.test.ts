import { afterEach, describe, expect, it, vi } from "vitest";
import { Button, createActionAnnouncer, createButton, createPendingState } from "../../packages/components/src";

afterEach(() => { vi.useRealTimers(); document.body.replaceChildren(); });
const speech = () => [...document.querySelectorAll("[data-af-live-region]")].map(region => region.textContent).join("");

describe("focus-preserving pending actions", () => {
    it("blocks repeated presses and native submission without disabling or renaming the button", () => {
        const press = vi.fn();
        const submit = vi.fn((event: Event) => event.preventDefault());
        const form = document.createElement("form");
        form.addEventListener("submit", submit);
        const button = Button({ text: "Save", type: "submit", onPress: press, pendingMessage: false });
        form.append(button.element);
        document.body.append(form);
        button.element.focus();
        button.setPending(true);
        button.element.click();
        button.element.click();
        expect(press).not.toHaveBeenCalled();
        expect(submit).not.toHaveBeenCalled();
        expect(button.element.disabled).toBe(false);
        expect(button.element.hasAttribute("aria-disabled")).toBe(false);
        expect(button.element.getAttribute("aria-busy")).toBe("true");
        expect(button.element.textContent).toBe("Save");
        expect(document.activeElement).toBe(button.element);
        button.update({ pending: false });
        button.element.click();
        expect(press).toHaveBeenCalledOnce();
        expect(submit).toHaveBeenCalledOnce();
        button.setDisabled(true);
        expect(button.element.disabled).toBe(true);
        button.destroy();
    });

    it("guards Enter and Space activation on enhanced custom buttons", () => {
        const press = vi.fn();
        const element = document.createElement("div");
        const button = createButton(element, { pending: true, onPress: press });
        document.body.append(element);
        element.focus();
        element.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", cancelable: true }));
        element.dispatchEvent(new KeyboardEvent("keyup", { key: " ", cancelable: true }));
        expect(press).not.toHaveBeenCalled();
        expect(element.tabIndex).toBe(0);
        expect(document.activeElement).toBe(element);
        button.setPending(false);
        element.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", cancelable: true }));
        expect(press).toHaveBeenCalledOnce();
        button.destroy();
    });

    it("announces a long wait once outside the busy subtree and does not erase a newer result", () => {
        vi.useFakeTimers();
        const resolve = vi.fn(() => "Подождите");
        const button = Button({ text: "Save", pendingMessage: resolve });
        document.body.append(button.element);
        button.setPending(true);
        vi.advanceTimersByTime(499);
        expect(speech()).toBe("");
        vi.advanceTimersByTime(51);
        expect(speech()).toBe("Подождите");
        expect(button.element.querySelector("[data-af-live-region]")).toBeNull();
        button.element.click();
        vi.advanceTimersByTime(1000);
        expect(resolve).toHaveBeenCalledOnce();
        const result = createActionAnnouncer();
        result.announce("Saved");
        button.setPending(false);
        button.destroy();
        vi.advanceTimersByTime(50);
        expect(speech()).toBe("Saved");
        result.destroy();
    });

    it("keeps initial/background work silent and cancels quick or disposed requests", () => {
        vi.useFakeTimers();
        const button = Button({ pending: true });
        document.body.append(button.element);
        vi.advanceTimersByTime(1000);
        expect(speech()).toBe("");
        button.element.click();
        vi.advanceTimersByTime(550);
        expect(speech()).toBe("Please wait");
        button.setPending(false);
        button.setPending(true);
        vi.advanceTimersByTime(100);
        button.setPending(false);
        vi.advanceTimersByTime(1000);
        expect(speech()).toBe("");
        button.setPending(true);
        button.destroy();
        vi.advanceTimersByTime(1000);
        expect(speech()).toBe("");
    });

    it("supports shared waiting state, message suppression and original attribute restoration", () => {
        vi.useFakeTimers();
        const element = document.createElement("section");
        element.setAttribute("aria-busy", "false");
        document.body.append(element);
        const pending = createPendingState(element, { pendingMessage: "Wait" });
        pending.setPending(true);
        pending.update({ pendingMessage: false });
        vi.advanceTimersByTime(1000);
        expect(speech()).toBe("");
        pending.destroy();
        expect(element.getAttribute("aria-busy")).toBe("false");
        expect(element.hasAttribute("data-af-pending")).toBe(false);
    });
});
