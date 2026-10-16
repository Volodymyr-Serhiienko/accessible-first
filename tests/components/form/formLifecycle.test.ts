import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Form, type FormValidatableField } from "../../../packages/components/src/form";

function field() {
    const control = document.createElement("input");
    control.setAttribute("aria-label", "Name");
    return {
        element: control,
        control,
        validate: vi.fn(() => ({ valid: false, message: "Enter a name." })),
        clearValidation: vi.fn()
    } satisfies FormValidatableField;
}

function messages(owner = document): string[] {
    return [...owner.querySelectorAll("[aria-live]")].map((region) => region.textContent ?? "");
}

describe("Form focus and lifecycle", () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it("announces errors when an invalid control cannot receive focus", () => {
        const item = field();
        item.control.disabled = true;
        const form = Form({ children: [item], scrollFirstInvalid: false });
        document.body.append(form.element);
        form.validate();
        vi.advanceTimersByTime(50);
        expect(messages()).toContain("Name: Enter a name.");
        form.destroy();
    });

    it("tries the next invalid control without marking the unavailable field valid", () => {
        const first = field();
        first.control.disabled = true;
        const second = field();
        const form = Form({ children: [first, second], scrollFirstInvalid: false });
        document.body.append(form.element);
        const result = form.validate();
        expect(result.invalidResults).toHaveLength(2);
        expect(document.activeElement).toBe(second.control);
        expect(messages()).toEqual([]);
        form.destroy();
    });

    it("announces updated errors when the invalid field already has focus", () => {
        const item = field();
        const form = Form({ children: [item], scrollFirstInvalid: false });
        document.body.append(form.element);
        item.control.focus();
        form.validate();
        vi.advanceTimersByTime(50);
        expect(document.activeElement).toBe(item.control);
        expect(messages()).toContain("Name: Enter a name.");
        form.destroy();
    });

    it("leaves validation and focus intact when a later listener cancels reset", () => {
        const item = field();
        const onReset = vi.fn();
        const form = Form({ children: [item], onReset, scrollFirstInvalid: false });
        document.body.append(form.element);
        item.control.defaultValue = "Original";
        item.control.value = "Draft";
        form.validate({ focus: false, announce: false });
        const other = document.createElement("button");
        form.element.append(other);
        other.focus();
        form.element.addEventListener("reset", (event) => event.preventDefault());
        form.reset();
        vi.advanceTimersByTime(20);
        expect(item.control.value).toBe("Draft");
        expect(item.clearValidation).not.toHaveBeenCalled();
        expect(form.element.getAttribute("data-af-validation-state")).toBe("invalid");
        expect(document.activeElement).toBe(other);
        expect(onReset).not.toHaveBeenCalled();
        form.destroy();
    });

    it("keeps a completed reset when a second reset in the same frame is canceled", () => {
        const item = field();
        const onReset = vi.fn();
        const form = Form({ children: [item], onReset });
        document.body.append(form.element);
        form.reset();
        const cancel = (event: Event) => event.preventDefault();
        form.element.addEventListener("reset", cancel, { once: true });
        form.reset();
        vi.advanceTimersByTime(20);
        expect(item.clearValidation).toHaveBeenCalledOnce();
        expect(onReset).toHaveBeenCalledOnce();
        expect(onReset.mock.calls[0]?.[0].event.defaultPrevented).toBe(false);
        form.destroy();
    });

    it("uses the first reachable field after reset", () => {
        const first = field();
        first.control.disabled = true;
        const second = field();
        const form = Form({ children: [first, second] });
        document.body.append(form.element);
        form.reset();
        vi.advanceTimersByTime(20);
        expect(document.activeElement).toBe(second.control);
        form.destroy();
    });

    it("cancels pending reset work and ignores later calls after destruction", () => {
        const item = field();
        const onReset = vi.fn();
        const onValidate = vi.fn();
        const childrenFactory = vi.fn(() => item);
        const form = Form({ children: [item], onReset, onValidate });
        document.body.append(form.element);
        form.reset();
        form.destroy();
        const html = form.element.outerHTML;
        form.reset();
        form.submit();
        form.clearValidation();
        form.registerField(item);
        form.setFields([item]);
        form.setChildren(childrenFactory);
        form.setActions("Late actions");
        form.update({ name: "late", children: childrenFactory });
        expect(form.validate()).toMatchObject({ valid: false, state: "idle", fields: [], results: [] });
        vi.advanceTimersByTime(50);
        expect(item.validate).not.toHaveBeenCalled();
        expect(item.clearValidation).not.toHaveBeenCalled();
        expect(childrenFactory).not.toHaveBeenCalled();
        expect(onReset).not.toHaveBeenCalled();
        expect(onValidate).not.toHaveBeenCalled();
        expect(form.element.outerHTML).toBe(html);
        expect(form.getFields()).toEqual([]);
        expect(messages()).toEqual([]);
    });

    it("stops validation if a field destroys the form", () => {
        const first = field();
        const second = field();
        const onValidate = vi.fn();
        const form = Form({ children: [first, second], onValidate });
        document.body.append(form.element);
        first.validate.mockImplementation(() => {
            form.destroy();
            return { valid: false, message: "Gone" };
        });
        expect(form.validate().valid).toBe(false);
        expect(second.validate).not.toHaveBeenCalled();
        expect(onValidate).not.toHaveBeenCalled();
        expect(messages()).toEqual([]);
    });

    it.each(["onValidate", "onSubmit"] as const)("stops the submit callback chain after destruction in %s", (callback) => {
        const onValidSubmit = vi.fn();
        const onSubmit = vi.fn();
        const form = Form({
            preventDefault: false,
            onValidSubmit,
            onSubmit,
            [callback]: () => form.destroy()
        });
        document.body.append(form.element);
        const event = new SubmitEvent("submit", { cancelable: true });
        form.element.dispatchEvent(event);
        expect(event.defaultPrevented).toBe(true);
        expect(onValidSubmit).not.toHaveBeenCalled();
        if (callback === "onValidate") expect(onSubmit).not.toHaveBeenCalled();
    });

    it("does not handle a submit already canceled by the application", () => {
        const onSubmit = vi.fn();
        const form = Form({ onSubmit });
        document.body.append(form.element);
        const event = new SubmitEvent("submit", { cancelable: true });
        event.preventDefault();
        form.element.dispatchEvent(event);
        expect(onSubmit).not.toHaveBeenCalled();
        form.destroy();
    });

    it("prevents native submission if an unvalidated submit destroys the form", () => {
        const form = Form({ preventDefault: false, validateOnSubmit: false, onSubmit: () => form.destroy() });
        document.body.append(form.element);
        const event = new SubmitEvent("submit", { cancelable: true });
        form.element.dispatchEvent(event);
        expect(event.defaultPrevented).toBe(true);
    });

    it("does not announce or call validation callbacks after focus destroys the form", () => {
        const item = field();
        const onValidate = vi.fn();
        const form = Form({ children: [item], onValidate, scrollFirstInvalid: false });
        document.body.append(form.element);
        item.control.addEventListener("focus", () => form.destroy());
        expect(form.validate().valid).toBe(false);
        vi.advanceTimersByTime(50);
        expect(onValidate).not.toHaveBeenCalled();
        expect(messages()).toEqual([]);
    });

    it("finishes all cleanup once when a child cleanup throws", () => {
        const failure = new Error("Child cleanup failed");
        const bodyCleanup = vi.fn(() => { throw failure; });
        const actionCleanup = vi.fn();
        const form = Form({
            children: { element: document.createElement("div"), destroy: bodyCleanup },
            actions: { element: document.createElement("button"), destroy: actionCleanup },
            fields: [field()],
            focusFirstInvalid: false
        });
        document.body.append(form.element);
        form.validate();
        vi.advanceTimersByTime(50);
        expect(() => form.destroy()).toThrow(failure);
        expect(actionCleanup).toHaveBeenCalledOnce();
        expect(messages()).toEqual([]);
        expect(() => form.destroy()).not.toThrow();
        expect(bodyCleanup).toHaveBeenCalledOnce();
        expect(actionCleanup).toHaveBeenCalledOnce();
    });

    it("disposes children returned by a factory that destroyed its form", () => {
        const form = Form();
        const destroy = vi.fn();
        const child = { element: document.createElement("div"), destroy };
        form.setChildren(() => {
            form.destroy();
            return child;
        });
        expect(destroy).toHaveBeenCalledOnce();
        expect(form.body.childNodes).toHaveLength(0);
        expect(form.getFields()).toEqual([]);
    });

    it("announces in the form's current owner document", () => {
        const frame = document.createElement("iframe");
        document.body.append(frame);
        const owner = frame.contentDocument!;
        const item = field();
        const form = Form({ children: [item], focusFirstInvalid: false });
        owner.body.append(form.element);
        form.validate();
        vi.advanceTimersByTime(50);
        expect(messages(owner)).toContain("Name: Enter a name.");
        expect(messages()).toEqual([]);
        form.destroy();
        frame.remove();
    });
});
