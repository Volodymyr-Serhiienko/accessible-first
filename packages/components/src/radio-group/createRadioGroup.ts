import { createAttributeSnapshot } from "../../../core/src/dom";
import { addEventListener } from "../../../core/src/events";
import type { FormFieldInvalidState } from "../../../core/src/form-field";
import { createId } from "../../../core/src/id";
import { createComponentLifecycle } from "../foundation";
import type {
    RadioGroup,
    RadioGroupChangeDetail,
    RadioGroupIsRadioDisabled,
    RadioGroupOptions,
    RadioGroupOrientation,
    RadioGroupSize,
    RadioGroupUpdateOptions,
    RadioGroupValue,
    RadioGroupVariant
} from "./types";

interface RadioSnapshot {
    type: string | null;
    name: string | null;
    checked: boolean;
    disabled: boolean;
    required: boolean;
    ariaInvalid: string | null;
    dataInput: string | null;
    dataChecked: string | null;
}

function getRadioInputs(
    element: HTMLElement,
    radios: HTMLInputElement[] | undefined
): HTMLInputElement[] {
    return radios
        ? radios.filter((radio) => radio.type === "radio")
        : Array.from(element.querySelectorAll<HTMLInputElement>('input[type="radio"]'));
}

function getCommonName(radios: HTMLInputElement[]): string | null {
    const names = new Set(radios.map((radio) => radio.name).filter(Boolean));

    return names.size === 1 ? [...names][0] ?? null : null;
}

function getRadioValue(radio: HTMLInputElement): string {
    return radio.value;
}

function isFieldSet(element: HTMLElement): element is HTMLFieldSetElement {
    return element.localName === "fieldset";
}

function getSelectedInput(radios: HTMLInputElement[]): HTMLInputElement | null {
    return radios.find((radio) => radio.checked) ?? null;
}

function getInitialValue(
    options: RadioGroupOptions,
    radios: HTMLInputElement[]
): RadioGroupValue {
    if ("value" in options) return options.value ?? null;
    if ("defaultValue" in options) return options.defaultValue ?? null;

    return getSelectedInput(radios)?.value ?? null;
}

function getChangeDetail(
    radios: HTMLInputElement[],
    event: Event
): RadioGroupChangeDetail {
    const input = getSelectedInput(radios);

    return {
        value: input ? getRadioValue(input) : null,
        input,
        event
    };
}

function isRadioEventTarget(target: EventTarget | null): target is HTMLInputElement {
    return target instanceof HTMLInputElement && target.type === "radio";
}

/**
 * Enhances a native radio group with Accessible First lifecycle,
 * styling attributes, value helpers, and value-change callbacks.
 */
export function createRadioGroup(
    element: HTMLElement,
    options: RadioGroupOptions = {}
): RadioGroup {
    const lifecycle = createComponentLifecycle(element, {
        name: "radio-group",
        initialState: options.disabled ? "disabled" : "ready"
    });

    const attributes = createAttributeSnapshot();
    const radioSnapshots = new Map<HTMLInputElement, RadioSnapshot>();

    const originalFieldSetDisabled = isFieldSet(element) ? element.disabled : false;
    let radioSource = options.radios;
    let radios = getRadioInputs(element, radioSource);
    let value = getInitialValue(options, radios);
    let disabled = options.disabled ?? false;
    let required = options.required ?? false;
    let invalid: FormFieldInvalidState = options.invalid ?? false;
    let name = options.name ?? getCommonName(radios) ?? createId("af-radio-group");
    let orientation: RadioGroupOrientation = options.orientation ?? "vertical";
    let variant: RadioGroupVariant = options.variant ?? "default";
    let size: RadioGroupSize = options.size ?? "md";
    let isRadioDisabled: RadioGroupIsRadioDisabled | null = options.isRadioDisabled ?? null;
    let onValueChange = options.onValueChange ?? null;
    let radioGroup!: RadioGroup;

    function rememberRadio(radio: HTMLInputElement): void {
        if (radioSnapshots.has(radio)) return;

        radioSnapshots.set(radio, {
            type: radio.getAttribute("type"),
            name: radio.getAttribute("name"),
            checked: radio.checked,
            disabled: radio.disabled,
            required: radio.required,
            ariaInvalid: radio.getAttribute("aria-invalid"),
            dataInput: radio.getAttribute("data-af-radio-input"),
            dataChecked: radio.getAttribute("data-af-checked")
        });
    }

    function getOwnDisabled(radio: HTMLInputElement): boolean {
        return isRadioDisabled?.(radio) ?? radioSnapshots.get(radio)?.disabled ?? radio.disabled;
    }

    function syncRootAttributes(): void {
        element.setAttribute("data-af-variant", variant);
        element.setAttribute("data-af-size", size);
        element.setAttribute("data-af-orientation", orientation);

        if (invalid) {
            element.setAttribute("aria-invalid", String(invalid));
            element.setAttribute("data-af-invalid", "true");
        } else {
            element.removeAttribute("aria-invalid");
            element.removeAttribute("data-af-invalid");
        }

        if (isFieldSet(element)) {
            element.disabled = disabled;
        }

        lifecycle.setState(disabled ? "disabled" : "ready");
    }

    function syncRadio(radio: HTMLInputElement): void {
        const ownDisabled = getOwnDisabled(radio);

        radio.type = "radio";
        radio.name = name;
        radio.checked = value !== null && getRadioValue(radio) === value;
        radio.disabled = disabled || ownDisabled;
        radio.required = required && !radio.disabled;
        radio.setAttribute("data-af-radio-input", "");
        radio.setAttribute("data-af-checked", String(radio.checked));

        if (invalid) {
            radio.setAttribute("aria-invalid", String(invalid));
        } else {
            radio.removeAttribute("aria-invalid");
        }
    }

    function syncRadios(): void {
        for (const radio of radios) {
            rememberRadio(radio);
            syncRadio(radio);
        }
    }

    function sync(): void {
        syncRootAttributes();
        syncRadios();
    }

    function setValue(nextValue: RadioGroupValue): void {
        if (lifecycle.isDestroyed()) return;

        value = nextValue;
        syncRadios();
    }

    function refresh(): void {
        if (lifecycle.isDestroyed()) return;

        radios = getRadioInputs(element, radioSource);
        sync();
    }

    function handleChange(event: Event): void {
        if (!isRadioEventTarget(event.target) || !radios.includes(event.target)) {
            return;
        }

        value = getSelectedInput(radios)?.value ?? null;
        syncRadios();
        onValueChange?.(getChangeDetail(radios, event), radioGroup);
    }

    attributes.remember(element, "aria-invalid");
    attributes.remember(element, "data-af-variant");
    attributes.remember(element, "data-af-size");
    attributes.remember(element, "data-af-orientation");
    attributes.remember(element, "data-af-invalid");

    sync();

    lifecycle.addCleanup(addEventListener<Event>(element, "change", handleChange));

    lifecycle.addCleanup(() => {
        attributes.restore();

        if (isFieldSet(element)) {
            element.disabled = originalFieldSetDisabled;
        }

        for (const [radio, snapshot] of radioSnapshots) {
            radio.checked = snapshot.checked;
            radio.disabled = snapshot.disabled;
            radio.required = snapshot.required;

            if (snapshot.type === null) radio.removeAttribute("type");
            else radio.setAttribute("type", snapshot.type);

            if (snapshot.name === null) radio.removeAttribute("name");
            else radio.setAttribute("name", snapshot.name);

            if (snapshot.ariaInvalid === null) radio.removeAttribute("aria-invalid");
            else radio.setAttribute("aria-invalid", snapshot.ariaInvalid);

            if (snapshot.dataInput === null) radio.removeAttribute("data-af-radio-input");
            else radio.setAttribute("data-af-radio-input", snapshot.dataInput);

            if (snapshot.dataChecked === null) radio.removeAttribute("data-af-checked");
            else radio.setAttribute("data-af-checked", snapshot.dataChecked);
        }
    });

    radioGroup = {
        element,
        group: element,

        get radios(): HTMLInputElement[] {
            return [...radios];
        },

        getValue(): RadioGroupValue {
            return value;
        },

        getSelectedInput(): HTMLInputElement | null {
            return getSelectedInput(radios);
        },

        setValue,

        setDisabled(nextDisabled): void {
            if (lifecycle.isDestroyed()) return;

            disabled = nextDisabled;
            sync();
        },

        isDisabled(): boolean {
            return disabled;
        },

        setRequired(nextRequired): void {
            if (lifecycle.isDestroyed()) return;

            required = nextRequired;
            syncRadios();
        },

        isRequired(): boolean {
            return required;
        },

        setInvalid(nextInvalid): void {
            if (lifecycle.isDestroyed()) return;

            invalid = nextInvalid;
            sync();
        },

        refresh,

        update(nextOptions: RadioGroupUpdateOptions): void {
            if (nextOptions.radios !== undefined) {
                radioSource = nextOptions.radios;
                radios = getRadioInputs(element, radioSource);
            }

            if ("value" in nextOptions) {
                value = nextOptions.value ?? null;
            }

            if (nextOptions.disabled !== undefined) disabled = nextOptions.disabled;
            if (nextOptions.required !== undefined) required = nextOptions.required;
            if (nextOptions.invalid !== undefined) invalid = nextOptions.invalid;
            if (nextOptions.name !== undefined) name = nextOptions.name;
            if (nextOptions.orientation !== undefined) orientation = nextOptions.orientation;
            if (nextOptions.variant !== undefined) variant = nextOptions.variant;
            if (nextOptions.size !== undefined) size = nextOptions.size;
            if (nextOptions.isRadioDisabled !== undefined) isRadioDisabled = nextOptions.isRadioDisabled;

            if ("onValueChange" in nextOptions) {
                onValueChange = nextOptions.onValueChange ?? null;
            }

            sync();
        },

        destroy(): void {
            lifecycle.destroy();
        },

        isDestroyed(): boolean {
            return lifecycle.isDestroyed();
        }
    };

    return radioGroup;
}
