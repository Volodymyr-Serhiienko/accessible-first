import { restoreAttribute } from "../../../core/src/dom";
import { addEventListener } from "../../../core/src/events";
import type { FormFieldInvalidState } from "../../../core/src/form-field";
import { createComponentLifecycle } from "../foundation";
import { textFieldEmailPattern } from "./emailValidation";
import type {
    TextField,
    TextFieldElement,
    TextFieldInputType,
    TextFieldOptions,
    TextFieldSize,
    TextFieldUpdateOptions,
    TextFieldValueChangeDetail,
    TextFieldVariant
} from "./types";

const inputTypes = new Set<TextFieldInputType>([
    "text",
    "email",
    "password",
    "search",
    "tel",
    "url",
    "number"
]);

function isInputElement(element: TextFieldElement): element is HTMLInputElement {
    return element.localName === "input";
}

function normalizeInputType(value: string | undefined): TextFieldInputType {
    return inputTypes.has(value as TextFieldInputType)
        ? value as TextFieldInputType
        : "text";
}

function getChangeDetail(control: TextFieldElement, event: Event): TextFieldValueChangeDetail {
    return {
        value: control.value,
        event
    };
}

function syncNullableAttribute(
    element: HTMLElement,
    name: string,
    value: string | null | undefined
): void {
    if (value === undefined) return;

    if (value === null) {
        element.removeAttribute(name);
        return;
    }

    element.setAttribute(name, value);
}

function syncNumberAttribute(
    element: HTMLElement,
    name: string,
    value: number | null | undefined
): void {
    if (value === undefined) return;

    if (value === null) {
        element.removeAttribute(name);
        return;
    }

    element.setAttribute(name, String(value));
}

function getInputPattern(
    type: TextFieldInputType,
    pattern: string | null | undefined,
    hasExplicitPattern: boolean,
    originalPattern: string | null
): string | null | undefined {
    if (hasExplicitPattern) {
        return pattern ?? null;
    }

    if (originalPattern !== null) {
        return undefined;
    }

    return type === "email" ? textFieldEmailPattern : null;
}

/**
 * Enhances a native input or textarea with Accessible First lifecycle,
 * form attributes, state helpers, styling hooks, and value callbacks.
 */
export function createTextField(
    element: TextFieldElement,
    options: TextFieldOptions = {}
): TextField {
    const lifecycle = createComponentLifecycle(element, {
        name: "text-field",
        initialState: options.disabled ? "disabled" : "ready"
    });

    const originalType = isInputElement(element) ? element.getAttribute("type") : null;
    const originalValue = element.value;
    const originalDisabled = element.disabled;
    const originalRequired = element.required;
    const originalReadOnly = element.readOnly;
    const originalName = element.getAttribute("name");
    const originalPlaceholder = element.getAttribute("placeholder");
    const originalAutocomplete = element.getAttribute("autocomplete");
    const originalInputMode = element.getAttribute("inputmode");
    const originalMinLength = element.getAttribute("minlength");
    const originalMaxLength = element.getAttribute("maxlength");
    const originalPattern = element.getAttribute("pattern");
    const originalAriaInvalid = element.getAttribute("aria-invalid");
    const originalVariant = element.getAttribute("data-af-variant");
    const originalSize = element.getAttribute("data-af-size");
    const originalMultiline = element.getAttribute("data-af-multiline");
    const originalInvalidMarker = element.getAttribute("data-af-invalid");

    let value = options.value ?? options.defaultValue ?? element.value;
    let type: TextFieldInputType = options.type ?? (isInputElement(element) ? normalizeInputType(element.type) : "text");
    let disabled = options.disabled ?? element.disabled;
    let required = options.required ?? element.required;
    let readOnly = options.readOnly ?? element.readOnly;
    let invalid: FormFieldInvalidState = options.invalid ?? false;
    let name = options.name;
    let placeholder = options.placeholder;
    let autocomplete = options.autocomplete;
    let inputMode = options.inputMode;
    let minLength = options.minLength;
    let maxLength = options.maxLength;
    let pattern = options.pattern;
    let hasExplicitPattern = "pattern" in options;
    let variant: TextFieldVariant = options.variant ?? "default";
    let size: TextFieldSize = options.size ?? "md";
    let onValueInput = options.onValueInput ?? null;
    let onValueChange = options.onValueChange ?? null;
    let textField!: TextField;

    function syncValue(): void {
        element.value = value;
    }

    function syncDisabled(): void {
        element.disabled = disabled;
        lifecycle.setState(disabled ? "disabled" : "ready");
    }

    function syncRequired(): void {
        element.required = required;
    }

    function syncReadOnly(): void {
        element.readOnly = readOnly;
    }

    function syncInvalid(): void {
        if (invalid) {
            element.setAttribute("aria-invalid", String(invalid));
            element.setAttribute("data-af-invalid", "true");
            return;
        }

        element.removeAttribute("aria-invalid");
        element.removeAttribute("data-af-invalid");
    }

    function syncAttributes(): void {
        if (isInputElement(element)) {
            element.type = type;
            syncNullableAttribute(
                element,
                "pattern",
                getInputPattern(type, pattern, hasExplicitPattern, originalPattern)
            );
        } else if (pattern !== undefined) {
            element.removeAttribute("pattern");
        }

        element.setAttribute("data-af-variant", variant);
        element.setAttribute("data-af-size", size);
        element.setAttribute("data-af-multiline", String(!isInputElement(element)));

        syncNullableAttribute(element, "name", name);
        syncNullableAttribute(element, "placeholder", placeholder);
        syncNullableAttribute(element, "autocomplete", autocomplete);
        syncNullableAttribute(element, "inputmode", inputMode);
        syncNumberAttribute(element, "minlength", minLength);
        syncNumberAttribute(element, "maxlength", maxLength);
    }

    function handleInput(event: Event): void {
        value = element.value;
        onValueInput?.(getChangeDetail(element, event), textField);
    }

    function handleChange(event: Event): void {
        value = element.value;
        onValueChange?.(getChangeDetail(element, event), textField);
    }

    syncAttributes();
    syncValue();
    syncDisabled();
    syncRequired();
    syncReadOnly();
    syncInvalid();

    lifecycle.addCleanup(addEventListener<Event>(element, "input", handleInput));
    lifecycle.addCleanup(addEventListener<Event>(element, "change", handleChange));

    lifecycle.addCleanup(() => {
        element.value = originalValue;
        element.disabled = originalDisabled;
        element.required = originalRequired;
        element.readOnly = originalReadOnly;

        if (isInputElement(element)) {
            restoreAttribute(element, "type", originalType);
        }

        restoreAttribute(element, "name", originalName);
        restoreAttribute(element, "placeholder", originalPlaceholder);
        restoreAttribute(element, "autocomplete", originalAutocomplete);
        restoreAttribute(element, "inputmode", originalInputMode);
        restoreAttribute(element, "minlength", originalMinLength);
        restoreAttribute(element, "maxlength", originalMaxLength);
        restoreAttribute(element, "pattern", originalPattern);
        restoreAttribute(element, "aria-invalid", originalAriaInvalid);
        restoreAttribute(element, "data-af-variant", originalVariant);
        restoreAttribute(element, "data-af-size", originalSize);
        restoreAttribute(element, "data-af-multiline", originalMultiline);
        restoreAttribute(element, "data-af-invalid", originalInvalidMarker);
    });

    textField = {
        element,
        control: element,

        getValue(): string {
            return value;
        },

        setValue(nextValue): void {
            if (lifecycle.isDestroyed()) return;

            value = nextValue;
            syncValue();
        },

        setDisabled(nextDisabled): void {
            if (lifecycle.isDestroyed()) return;

            disabled = nextDisabled;
            syncDisabled();
        },

        isDisabled(): boolean {
            return disabled;
        },

        setRequired(nextRequired): void {
            if (lifecycle.isDestroyed()) return;

            required = nextRequired;
            syncRequired();
        },

        isRequired(): boolean {
            return required;
        },

        setReadOnly(nextReadOnly): void {
            if (lifecycle.isDestroyed()) return;

            readOnly = nextReadOnly;
            syncReadOnly();
        },

        isReadOnly(): boolean {
            return readOnly;
        },

        setInvalid(nextInvalid): void {
            if (lifecycle.isDestroyed()) return;

            invalid = nextInvalid;
            syncInvalid();
        },

        update(nextOptions: TextFieldUpdateOptions): void {
            if ("value" in nextOptions) this.setValue(nextOptions.value ?? "");

            if (nextOptions.type !== undefined) type = nextOptions.type;
            if (nextOptions.disabled !== undefined) this.setDisabled(nextOptions.disabled);
            if (nextOptions.required !== undefined) this.setRequired(nextOptions.required);
            if (nextOptions.readOnly !== undefined) this.setReadOnly(nextOptions.readOnly);
            if (nextOptions.invalid !== undefined) this.setInvalid(nextOptions.invalid);
            if ("name" in nextOptions) name = nextOptions.name ?? null;
            if ("placeholder" in nextOptions) placeholder = nextOptions.placeholder ?? null;
            if ("autocomplete" in nextOptions) autocomplete = nextOptions.autocomplete ?? null;
            if ("inputMode" in nextOptions) inputMode = nextOptions.inputMode ?? null;
            if ("minLength" in nextOptions) minLength = nextOptions.minLength ?? null;
            if ("maxLength" in nextOptions) maxLength = nextOptions.maxLength ?? null;
            if ("pattern" in nextOptions) {
                hasExplicitPattern = true;
                pattern = nextOptions.pattern ?? null;
            }
            if (nextOptions.variant !== undefined) variant = nextOptions.variant;
            if (nextOptions.size !== undefined) size = nextOptions.size;

            if ("onValueInput" in nextOptions) {
                onValueInput = nextOptions.onValueInput ?? null;
            }

            if ("onValueChange" in nextOptions) {
                onValueChange = nextOptions.onValueChange ?? null;
            }

            syncAttributes();
        },

        destroy(): void {
            lifecycle.destroy();
        },

        isDestroyed(): boolean {
            return lifecycle.isDestroyed();
        }
    };

    return textField;
}
