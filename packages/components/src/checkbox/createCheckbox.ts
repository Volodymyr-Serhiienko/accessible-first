import { restoreAttribute } from "../../../core/src/dom";
import { addEventListener } from "../../../core/src/events";
import type { FormFieldInvalidState } from "../../../core/src/form-field";
import { createComponentLifecycle } from "../foundation";
import type {
    Checkbox,
    CheckboxChangeDetail,
    CheckboxCheckedState,
    CheckboxOptions,
    CheckboxSize,
    CheckboxUpdateOptions,
    CheckboxVariant
} from "./types";

function normalizeCheckedState(value: CheckboxCheckedState | undefined): CheckboxCheckedState {
    return value ?? false;
}

function getInputCheckedState(input: HTMLInputElement): CheckboxCheckedState {
    return input.indeterminate ? "mixed" : input.checked;
}

function getChangeDetail(input: HTMLInputElement, event: Event): CheckboxChangeDetail {
    const checkedState = getInputCheckedState(input);

    return {
        checked: checkedState === true,
        checkedState,
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

/**
 * Enhances a native checkbox input with Accessible First lifecycle,
 * styling attributes, state helpers, and checked-change callbacks.
 */
export function createCheckbox(
    element: HTMLInputElement,
    options: CheckboxOptions = {}
): Checkbox {
    const lifecycle = createComponentLifecycle(element, {
        name: "checkbox",
        initialState: options.disabled ? "disabled" : "ready"
    });

    const originalType = element.getAttribute("type");
    const originalChecked = element.checked;
    const originalIndeterminate = element.indeterminate;
    const originalDisabled = element.disabled;
    const originalRequired = element.required;
    const originalName = element.getAttribute("name");
    const originalValue = element.getAttribute("value");
    const originalAriaInvalid = element.getAttribute("aria-invalid");
    const originalAriaChecked = element.getAttribute("aria-checked");
    const originalVariant = element.getAttribute("data-af-variant");
    const originalSize = element.getAttribute("data-af-size");
    const originalCheckedMarker = element.getAttribute("data-af-checked");
    const originalInvalidMarker = element.getAttribute("data-af-invalid");

    let checked = normalizeCheckedState(options.checked ?? options.defaultChecked);
    let disabled = options.disabled ?? element.disabled;
    let required = options.required ?? element.required;
    let invalid: FormFieldInvalidState = options.invalid ?? false;
    let name = options.name;
    let value = options.value;
    let variant: CheckboxVariant = options.variant ?? "default";
    let size: CheckboxSize = options.size ?? "md";
    let onCheckedChange = options.onCheckedChange ?? null;
    let checkbox!: Checkbox;

    function syncChecked(): void {
        element.checked = checked === true;
        element.indeterminate = checked === "mixed";
        element.setAttribute("data-af-checked", String(checked));
        element.setAttribute("aria-checked", checked === "mixed" ? "mixed" : String(checked));
    }

    function syncDisabled(): void {
        element.disabled = disabled;
        lifecycle.setState(disabled ? "disabled" : "ready");
    }

    function syncRequired(): void {
        element.required = required;
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
        element.type = "checkbox";
        element.setAttribute("data-af-variant", variant);
        element.setAttribute("data-af-size", size);
        syncNullableAttribute(element, "name", name);
        syncNullableAttribute(element, "value", value);
    }

    function handleChange(event: Event): void {
        checked = getInputCheckedState(element);
        syncChecked();
        onCheckedChange?.(getChangeDetail(element, event), checkbox);
    }

    syncAttributes();
    syncChecked();
    syncDisabled();
    syncRequired();
    syncInvalid();

    lifecycle.addCleanup(addEventListener<Event>(element, "change", handleChange));

    lifecycle.addCleanup(() => {
        element.checked = originalChecked;
        element.indeterminate = originalIndeterminate;
        element.disabled = originalDisabled;
        element.required = originalRequired;

        restoreAttribute(element, "type", originalType);
        restoreAttribute(element, "name", originalName);
        restoreAttribute(element, "value", originalValue);
        restoreAttribute(element, "aria-invalid", originalAriaInvalid);
        restoreAttribute(element, "aria-checked", originalAriaChecked);
        restoreAttribute(element, "data-af-variant", originalVariant);
        restoreAttribute(element, "data-af-size", originalSize);
        restoreAttribute(element, "data-af-checked", originalCheckedMarker);
        restoreAttribute(element, "data-af-invalid", originalInvalidMarker);
    });

    checkbox = {
        element,
        input: element,

        setChecked(nextChecked): void {
            if (lifecycle.isDestroyed()) return;

            checked = nextChecked;
            syncChecked();
        },

        getChecked(): CheckboxCheckedState {
            return checked;
        },

        isChecked(): boolean {
            return checked === true;
        },

        toggleChecked(force): boolean {
            if (lifecycle.isDestroyed()) return checked === true;

            this.setChecked(force ?? checked !== true);
            return this.isChecked();
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

        setInvalid(nextInvalid): void {
            if (lifecycle.isDestroyed()) return;

            invalid = nextInvalid;
            syncInvalid();
        },

        update(nextOptions: CheckboxUpdateOptions): void {
            if ("checked" in nextOptions) {
                this.setChecked(nextOptions.checked ?? false);
            }

            if (nextOptions.disabled !== undefined) {
                this.setDisabled(nextOptions.disabled);
            }

            if (nextOptions.required !== undefined) {
                this.setRequired(nextOptions.required);
            }

            if (nextOptions.invalid !== undefined) {
                this.setInvalid(nextOptions.invalid);
            }

            if ("name" in nextOptions) {
                name = nextOptions.name ?? null;
            }

            if ("value" in nextOptions) {
                value = nextOptions.value ?? null;
            }

            if (nextOptions.variant !== undefined) {
                variant = nextOptions.variant;
            }

            if (nextOptions.size !== undefined) {
                size = nextOptions.size;
            }

            if ("onCheckedChange" in nextOptions) {
                onCheckedChange = nextOptions.onCheckedChange ?? null;
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

    return checkbox;
}
