import { restoreAttribute } from "../../../core/src/dom";
import { addEventListener } from "../../../core/src/events";
import type { FormFieldInvalidState } from "../../../core/src/form-field";
import { createComponentLifecycle } from "../foundation";
import type {
    Switch,
    SwitchChangeDetail,
    SwitchOptions,
    SwitchSize,
    SwitchUpdateOptions,
    SwitchVariant
} from "./types";

function normalizeChecked(value: boolean | undefined): boolean {
    return value ?? false;
}

function getChangeDetail(input: HTMLInputElement, event: Event): SwitchChangeDetail {
    return {
        checked: input.checked,
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
 * Enhances a native checkbox input as an accessible switch.
 */
export function createSwitch(
    element: HTMLInputElement,
    options: SwitchOptions = {}
): Switch {
    const lifecycle = createComponentLifecycle(element, {
        name: "switch",
        initialState: options.disabled ? "disabled" : "ready"
    });

    const originalType = element.getAttribute("type");
    const originalRole = element.getAttribute("role");
    const originalChecked = element.checked;
    const originalDisabled = element.disabled;
    const originalRequired = element.required;
    const originalName = element.getAttribute("name");
    const originalValue = element.getAttribute("value");
    const originalAriaChecked = element.getAttribute("aria-checked");
    const originalAriaInvalid = element.getAttribute("aria-invalid");
    const originalVariant = element.getAttribute("data-af-variant");
    const originalSize = element.getAttribute("data-af-size");
    const originalCheckedMarker = element.getAttribute("data-af-checked");
    const originalInvalidMarker = element.getAttribute("data-af-invalid");

    let checked = normalizeChecked(options.checked ?? options.defaultChecked);
    let disabled = options.disabled ?? element.disabled;
    let required = options.required ?? element.required;
    let invalid: FormFieldInvalidState = options.invalid ?? false;
    let name = options.name;
    let value = options.value;
    let variant: SwitchVariant = options.variant ?? "default";
    let size: SwitchSize = options.size ?? "md";
    let onCheckedChange = options.onCheckedChange ?? null;
    let switchControl!: Switch;

    function syncChecked(): void {
        element.checked = checked;
        element.setAttribute("aria-checked", String(checked));
        element.setAttribute("data-af-checked", String(checked));
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
        element.setAttribute("role", "switch");
        element.setAttribute("data-af-variant", variant);
        element.setAttribute("data-af-size", size);
        syncNullableAttribute(element, "name", name);
        syncNullableAttribute(element, "value", value);
    }

    function handleChange(event: Event): void {
        checked = element.checked;
        syncChecked();
        onCheckedChange?.(getChangeDetail(element, event), switchControl);
    }

    syncAttributes();
    syncChecked();
    syncDisabled();
    syncRequired();
    syncInvalid();

    lifecycle.addCleanup(addEventListener<Event>(element, "change", handleChange));

    lifecycle.addCleanup(() => {
        element.checked = originalChecked;
        element.disabled = originalDisabled;
        element.required = originalRequired;

        restoreAttribute(element, "type", originalType);
        restoreAttribute(element, "role", originalRole);
        restoreAttribute(element, "name", originalName);
        restoreAttribute(element, "value", originalValue);
        restoreAttribute(element, "aria-checked", originalAriaChecked);
        restoreAttribute(element, "aria-invalid", originalAriaInvalid);
        restoreAttribute(element, "data-af-variant", originalVariant);
        restoreAttribute(element, "data-af-size", originalSize);
        restoreAttribute(element, "data-af-checked", originalCheckedMarker);
        restoreAttribute(element, "data-af-invalid", originalInvalidMarker);
    });

    switchControl = {
        element,
        input: element,

        setChecked(nextChecked): void {
            if (lifecycle.isDestroyed()) return;

            checked = nextChecked;
            syncChecked();
        },

        getChecked(): boolean {
            return checked;
        },

        isChecked(): boolean {
            return checked;
        },

        toggleChecked(force): boolean {
            if (lifecycle.isDestroyed()) return checked;

            this.setChecked(force ?? !checked);
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

        update(nextOptions: SwitchUpdateOptions): void {
            if ("checked" in nextOptions) {
                this.setChecked(nextOptions.checked ?? false);
            }

            if (nextOptions.disabled !== undefined) this.setDisabled(nextOptions.disabled);
            if (nextOptions.required !== undefined) this.setRequired(nextOptions.required);
            if (nextOptions.invalid !== undefined) this.setInvalid(nextOptions.invalid);
            if ("name" in nextOptions) name = nextOptions.name ?? null;
            if ("value" in nextOptions) value = nextOptions.value ?? null;
            if (nextOptions.variant !== undefined) variant = nextOptions.variant;
            if (nextOptions.size !== undefined) size = nextOptions.size;
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

    return switchControl;
}
