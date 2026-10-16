import { afterEach, describe, expect, it, vi } from "vitest";
import { Checkbox } from "../../../packages/components/src/checkbox";
import { Switch } from "../../../packages/components/src/switch";
import { RadioGroup } from "../../../packages/components/src/radio-group";
import { Select } from "../../../packages/components/src/select";
import { TextField } from "../../../packages/components/src/text-field";
import { PasswordField } from "../../../packages/components/src/password-field";

afterEach(() => vi.useRealTimers());

describe("Composed field lifetime", () => {
    it.each(["checkbox", "switch", "radio", "text"] as const)("finishes %s cleanup after a child throws", kind => {
        const failure = vi.fn(() => { throw new Error("child failed"); });
        const other = vi.fn();
        const label = { element: document.createElement("span"), destroy: failure };
        const description = { element: document.createElement("span"), destroy: other };
        const changed = vi.fn();
        const field = kind === "checkbox" ? Checkbox({ label, description, onCheckedChange: changed })
            : kind === "switch" ? Switch({ label, description, onCheckedChange: changed })
            : kind === "radio" ? RadioGroup({ label, description, items: [{ value: "a", label: "A" }], onValueChange: changed })
            : TextField({ label, description, onValueInput: changed });
        expect(() => field.destroy()).toThrow("child failed");
        expect(field.isDestroyed()).toBe(true);
        expect(other).toHaveBeenCalledOnce();
        expect(() => field.destroy()).not.toThrow();
        const input = field.element.querySelector("input")!;
        input.dispatchEvent(new Event(kind === "text" ? "input" : "change", { bubbles: true }));
        expect(changed).not.toHaveBeenCalled();
        const before = field.element.outerHTML;
        field.setLabelContent("Late");
        field.setDescription("Late");
        field.setErrorMessage("Late");
        field.setInvalid(true);
        field.update({ label: "Late", disabled: true });
        expect(field.element.outerHTML).toBe(before);
        expect(failure).toHaveBeenCalledOnce();
    });

    it("makes select/item and radio-item setters inert after destruction", () => {
        const select = Select({ label: "Area", items: [{ value: "a", label: "A" }] });
        const selectItem = select.items[0]!;
        select.destroy();
        const before = select.element.outerHTML;
        select.setLabel("Late");
        selectItem.setLabel("Late");
        selectItem.setDisabled(true);
        select.update({ label: "Late", items: [{ label: "Late" }] });
        expect(select.element.outerHTML).toBe(before);

        const group = RadioGroup({ label: "Area", items: [{ value: "a", label: "A" }] });
        const item = group.items[0]!;
        group.destroy();
        const groupBefore = group.element.outerHTML;
        item.setLabelContent("Late");
        item.setDescription("Late");
        item.setDisabled(true);
        expect(group.element.outerHTML).toBe(groupBefore);
    });

    it("cleans every radio item when an earlier child cleanup fails", () => {
        const first = vi.fn(() => { throw new Error("radio child failed"); });
        const second = vi.fn();
        const field = RadioGroup({ label: "Area", items: [
            { value: "a", label: { element: document.createElement("span"), destroy: first } },
            { value: "b", label: { element: document.createElement("span"), destroy: second } }
        ] });
        expect(() => field.destroy()).toThrow("radio child failed");
        expect(second).toHaveBeenCalledOnce();
        expect(field.isDestroyed()).toBe(true);
        expect(field.element.hasAttribute("data-af-component")).toBe(false);
    });

    it("does not run validation or resubscribe after destroy", () => {
        const validator = vi.fn(() => "Bad");
        const onValidationChange = vi.fn();
        const subscribe = vi.fn(() => vi.fn());
        const field = TextField({ label: "Email", validator, onValidationChange });
        field.destroy();
        const before = field.element.outerHTML;
        expect(field.validate()).toMatchObject({ valid: false, state: "idle" });
        field.clearValidation();
        field.update({ locale: { t: () => "Text", subscribe } });
        expect(validator).not.toHaveBeenCalled();
        expect(onValidationChange).not.toHaveBeenCalled();
        expect(subscribe).not.toHaveBeenCalled();
        expect(field.element.outerHTML).toBe(before);
    });

    it("stops validation destroyed from a custom validator", () => {
        const onValidationChange = vi.fn();
        const field = TextField({ label: "Name", onValidationChange, validator(_value, _control, current) {
            current.destroy();
            return "Obsolete";
        } });
        expect(field.validate()).toMatchObject({ valid: false, state: "idle" });
        expect(field.control.validity.customError).toBe(false);
        expect(onValidationChange).not.toHaveBeenCalled();
    });

    it("stops validation destroyed from a native invalid listener", () => {
        const onValidationChange = vi.fn();
        const field = TextField({ label: "Name", required: true, onValidationChange });
        field.control.addEventListener("invalid", () => field.destroy(), { once: true });
        expect(field.validate()).toMatchObject({ valid: false, state: "idle" });
        expect(onValidationChange).not.toHaveBeenCalled();
        expect(field.control.hasAttribute("aria-invalid")).toBe(false);
    });

    it("does not overwrite a newer validation from inside its validator", () => {
        let reentered = false;
        const field = TextField({ label: "Name", validator(_value, _control, current) {
            if (!reentered) {
                reentered = true;
                current.setValue("New value");
                current.validate({ announce: false });
                return "Obsolete";
            }
            return null;
        } });
        expect(field.validate()).toMatchObject({ valid: false, state: "idle" });
        expect(field.getValidationState()).toBe("valid");
        expect(field.control.validity.customError).toBe(false);
        expect(field.errorMessage.textContent).toBe("");
        field.destroy();
    });

    it("does not reapply state after an onValidationChange callback clears it", () => {
        const field = TextField({ label: "Name", required: true, onValidationChange(_detail, current) { current.clearValidation(); } });
        expect(field.validate({ announce: false })).toMatchObject({ valid: false, state: "idle" });
        expect(field.getValidationState()).toBe("idle");
        expect(field.control.hasAttribute("aria-invalid")).toBe(false);
        field.destroy();
    });

    it.each(["disabled", "readOnly"] as const)("does not custom-validate a natively barred %s field", key => {
        const validator = vi.fn(() => "Bad");
        const field = TextField({ label: "Name", [key]: true, validator });
        expect(field.validate()).toMatchObject({ valid: true, state: "idle" });
        expect(validator).not.toHaveBeenCalled();
        expect(field.control.validity.customError).toBe(false);
        field.destroy();
    });

    it("clears standalone custom validation only after an uncanceled native reset", async () => {
        const field = TextField({ label: "Name", defaultValue: "Good", validator: value => value === "Good" ? null : "Bad" });
        const form = document.createElement("form");
        form.append(field.element);
        document.body.append(form);
        field.setValue("Bad");
        field.validate({ announce: false });
        form.addEventListener("reset", event => event.preventDefault(), { once: true });
        form.reset();
        await Promise.resolve();
        expect(field.getValidationState()).toBe("invalid");
        form.reset();
        await Promise.resolve();
        expect(field.getValue()).toBe("Good");
        expect(field.getValidationState()).toBe("idle");
        expect(field.control.validity.customError).toBe(false);
        field.destroy();
    });

    it("cancels queued validation speech when validation is cleared", () => {
        vi.useFakeTimers();
        const field = TextField({ label: "Name", required: true, validationMessages: { valueMissing: "Missing name" } });
        document.body.append(field.element);
        field.validate();
        field.clearValidation();
        vi.runAllTimers();
        expect(document.querySelector("[data-af-live-region]")?.textContent ?? "").toBe("");
        field.destroy();
    });

    it("keeps the required label marker in sync with its controller setter", () => {
        const field = TextField({ label: "Name" });
        field.setRequired(true);
        expect(field.label.hasAttribute("data-af-required")).toBe(true);
        field.setRequired(false);
        expect(field.label.hasAttribute("data-af-required")).toBe(false);
        field.destroy();
    });

    it("cancels a validation destroyed from its completion callback", () => {
        const field = TextField({ label: "Name", value: "Valid", onValidationChange(_detail, current) { current.destroy(); } });
        expect(field.validate()).toMatchObject({ valid: false, state: "idle" });
        expect(field.isDestroyed()).toBe(true);
        expect(field.control.hasAttribute("aria-invalid")).toBe(false);
    });

    it("finishes password cleanup when a locale unsubscribe throws", () => {
        const unsubscribe = vi.fn(() => { throw new Error("unsubscribe failed"); });
        // TextField and the password toggle have separate locale subscriptions.
        const field = PasswordField({ label: "Password", locale: { t: () => "Reveal", subscribe: () => unsubscribe } });
        expect(() => field.destroy()).toThrow("unsubscribe failed");
        expect(unsubscribe).toHaveBeenCalledTimes(2);
        expect(field.isDestroyed()).toBe(true);
        expect(field.visibilityButton.isDestroyed()).toBe(true);
        expect(field.control.hasAttribute("data-af-component")).toBe(false);
        expect(() => field.destroy()).not.toThrow();
    });

    it("blocks late password mutators after destroy", () => {
        const field = PasswordField({ label: "Password", value: "Demo" });
        field.destroy();
        const before = field.element.outerHTML;
        field.setPasswordVisible(true);
        field.setValue("Late");
        field.setDisabled(true);
        field.setReadOnly(true);
        expect(field.element.outerHTML).toBe(before);
    });
});
