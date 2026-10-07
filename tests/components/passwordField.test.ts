import { describe, expect, it, vi } from "vitest";
import { Form, PasswordField, createLocaleController } from "../../packages/components/src";

describe("PasswordField", () => {
    it("starts masked, preserves value/selection, and exposes a stable native toggle", () => {
        const field = PasswordField({ label: "Password", name: "password", autocomplete: "current-password" });
        document.body.append(field.element);
        field.setValue("demo-password");
        field.control.focus();
        field.control.setSelectionRange(2, 5, "backward");
        const button = field.visibilityButton.element;
        expect(field.control.type).toBe("password");
        expect(button.type).toBe("button");
        expect(button.getAttribute("aria-controls")).toBe(field.control.id);
        expect(button.getAttribute("aria-pressed")).toBe("false");
        button.focus();
        button.click();
        expect(field.control.type).toBe("text");
        expect(field.getValue()).toBe("demo-password");
        expect(field.control.selectionStart).toBe(2);
        expect(field.control.selectionEnd).toBe(5);
        expect(field.control.selectionDirection).toBe("backward");
        expect(field.control.autocomplete).toBe("current-password");
        expect(document.activeElement).toBe(button);
        expect(button.getAttribute("aria-label")).toBe("Show password");
        expect(button.getAttribute("aria-pressed")).toBe("true");
        button.click();
        expect(field.control.type).toBe("password");
        expect(button.getAttribute("aria-label")).toBe("Show password");
        field.destroy();
    });

    it("does not submit or validate an empty field when toggling visibility", () => {
        const onValidSubmit = vi.fn();
        const onValidationChange = vi.fn();
        const field = PasswordField({ label: "Password", required: true, onValidationChange });
        const form = Form({ fields: [field], children: [field], preventDefault: true, onValidSubmit });
        document.body.append(form.element);
        field.control.focus();
        field.visibilityButton.element.focus();
        field.visibilityButton.element.click();
        expect(field.getValidationState()).toBe("idle");
        expect(onValidationChange).not.toHaveBeenCalled();
        expect(onValidSubmit).not.toHaveBeenCalled();
        expect(field.validate({ announce: false }).valid).toBe(false);
        form.destroy();
    });

    it("keeps repeat-password validation and masked cleanup intact", () => {
        const field = PasswordField({ label: "Repeat", required: true,
            validator: value => value === "demo" ? null : "Different password" });
        field.setValue("incorrect");
        field.setPasswordVisible(true);
        expect(field.validate({ announce: false }).valid).toBe(false);
        field.setValue("demo");
        expect(field.validate({ announce: false }).valid).toBe(true);
        field.setValue("");
        expect(field.isPasswordVisible()).toBe(false);
        expect(field.control.type).toBe("password");
        field.destroy();
    });

    it("disables reveal for disabled/read-only fields and supports updates", () => {
        const field = PasswordField({ label: "Password", defaultValue: "demo", readOnly: true });
        expect(field.visibilityButton.element.disabled).toBe(true);
        field.setPasswordVisible(true);
        expect(field.control.type).toBe("password");
        field.setReadOnly(false);
        field.setPasswordVisible(true);
        field.setDisabled(true);
        expect(field.control.type).toBe("password");
        expect(field.visibilityButton.element.disabled).toBe(true);
        field.update({ disabled: false, visibilityLabel: "Reveal", controlOptions: { id: "new-password-id" } });
        expect(field.visibilityButton.element.disabled).toBe(false);
        expect(field.visibilityButton.element.getAttribute("aria-label")).toBe("Reveal");
        expect(field.visibilityButton.element.getAttribute("aria-controls")).toBe(field.control.id);
        field.destroy();
    });

    it("refreshes localized labels and removes subscriptions/listeners on destroy", () => {
        const locale = createLocaleController({ supportedLocales: ["en", "ru"], fallbackLocale: "en",
            messages: { ru: { "passwordField.visibilityLabel": "Показать пароль" } } });
        const field = PasswordField({ label: "Password", locale });
        field.setValue("demo");
        locale.setLocale("ru");
        expect(field.visibilityButton.element.getAttribute("aria-label")).toBe("Показать пароль");
        field.setPasswordVisible(true);
        field.destroy();
        expect(field.control.type).toBe("password");
        field.visibilityButton.element.click();
        expect(field.control.type).toBe("password");
        locale.setLocale("en");
        field.destroy();
        locale.destroy();
    });
});
