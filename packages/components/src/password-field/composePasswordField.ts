import { Icon } from "../composition";
import { IconButton, type ComposedIconButton } from "../icon-button";
import { accessibleFirstEnglishMessages, getLocaleText, type LocaleTextProvider } from "../localization";
import { TextField, type ComposedTextField, type TextFieldCompositionOptions,
    type TextFieldMessageKey } from "../text-field";

/** Localized label for the stable-name password visibility toggle. */
export type PasswordFieldMessageKey = "passwordField.visibilityLabel";

/** Native password field options; masking is owned by the visibility control. */
export interface PasswordFieldOptions extends Omit<TextFieldCompositionOptions, "type" | "multiline" | "locale"> {
    visibilityLabel?: string;
    locale?: LocaleTextProvider<PasswordFieldMessageKey | TextFieldMessageKey> | null;
}

/** Updates for an existing PasswordField; the initial value remains creation-time only. */
export interface PasswordFieldUpdateOptions extends Partial<Omit<PasswordFieldOptions, "defaultValue">> {}

/** A form-compatible text field with an independently focusable visibility toggle. */
export interface ComposedPasswordField extends Omit<ComposedTextField, "control" | "update"> {
    readonly control: HTMLInputElement;
    readonly visibilityButton: ComposedIconButton;
    isPasswordVisible(): boolean;
    setPasswordVisible(visible: boolean): void;
    update(options: PasswordFieldUpdateOptions): void;
}

// Lucide Eye / EyeOff (ISC); see THIRD_PARTY_NOTICES.md.
const EYE = [
    "M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0",
    "M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0"
];
const EYE_OFF = [
    "M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49",
    "M14.084 14.158a3 3 0 0 1-4.242-4.242",
    "M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143",
    "m2 2 20 20"
];

/** Creates a masked native input with a localized, keyboard/touch-accessible reveal button. */
export function PasswordField(options: PasswordFieldOptions): ComposedPasswordField {
    let locale = options.locale ?? null;
    let visibilityLabel = options.visibilityLabel;
    let visible = false;
    let disposed = false;
    let unsubscribeLocale: (() => void) | null = null;
    const { visibilityLabel: _label, ...fieldOptions } = options;
    const field = TextField({ ...fieldOptions, type: "password", multiline: false });
    const control = field.control as HTMLInputElement;
    const updateField = field.update;
    const setValue = field.setValue;
    const setDisabled = field.setDisabled;
    const setReadOnly = field.setReadOnly;
    const destroyField = field.destroy;
    field.element.setAttribute("data-af-password-field", "");

    function label(): string {
        return visibilityLabel ?? getLocaleText(locale, "passwordField.visibilityLabel",
            accessibleFirstEnglishMessages["passwordField.visibilityLabel"]);
    }

    const button = IconButton({
        label: label(), pressed: false, type: "button", variant: "ghost",
        hintDisplay: "none", hintAnnounceOnHover: false,
        icon: Icon({ path: EYE, variant: "outline", size: "1.25rem" }),
        attributes: { "data-af-password-visibility": "", "aria-controls": control.id },
        onPress: () => setPasswordVisible(!visible)
    });
    field.controlWrapper.append(button.element);

    function setPasswordVisible(next: boolean): void {
        if (disposed || (next && (field.isDisabled() || field.isReadOnly()))) return;
        visible = next;
        const start = control.selectionStart;
        const end = control.selectionEnd;
        const direction = control.selectionDirection;
        updateField({ type: visible ? "text" : "password" });
        if (start !== null && end !== null) control.setSelectionRange(start, end, direction ?? "none");
        button.update({ pressed: visible,
            icon: Icon({ path: visible ? EYE_OFF : EYE, variant: "outline", size: "1.25rem" }) });
    }

    function sync(): void {
        if (disposed) return;
        button.setDisabled(field.isDisabled() || field.isReadOnly());
        button.update({ label: label(), attributes: { "aria-controls": control.id } });
    }

    function subscribeLocale(): void {
        unsubscribeLocale?.();
        unsubscribeLocale = locale?.subscribe?.(sync) ?? null;
    }

    const composed: ComposedPasswordField = Object.assign(field, {
        control, visibilityButton: button,
        isPasswordVisible: () => visible,
        setPasswordVisible,
        setValue(value: string): void {
            setValue(value);
            if (!value) setPasswordVisible(false);
        },
        setDisabled(value: boolean): void {
            if (value) setPasswordVisible(false);
            setDisabled(value);
            sync();
        },
        setReadOnly(value: boolean): void {
            if (value) setPasswordVisible(false);
            setReadOnly(value);
            sync();
        },
        update(next: PasswordFieldUpdateOptions): void {
            if (disposed) return;
            const { visibilityLabel: nextLabel, ...nextField } = next;
            if ("visibilityLabel" in next) visibilityLabel = nextLabel;
            if ("locale" in next) { locale = next.locale ?? null; subscribeLocale(); }
            updateField({ ...nextField, type: visible ? "text" : "password" });
            if (field.isDisabled() || field.isReadOnly() || !field.getValue()) setPasswordVisible(false);
            sync();
        },
        destroy(): void {
            if (disposed) return;
            setPasswordVisible(false);
            disposed = true;
            unsubscribeLocale?.();
            button.destroy();
            destroyField();
        }
    });
    subscribeLocale();
    sync();
    return composed;
}
