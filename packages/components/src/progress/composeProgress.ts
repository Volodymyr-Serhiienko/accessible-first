import { createId } from "../../../core/src/id";
import {
    applyCompositionElementOptions,
    createContentSlot,
    createElement,
    getCompositionElementOptions,
    hasCompositionContent,
    setElementAttributeValue,
    toCompositionChildren,
    type BaseCompositionOptions,
    type ComposedNode,
    type CompositionContent
} from "../composition";

/**
 * Content accepted by Progress label and description slots.
 */
export type ProgressCompositionContent = CompositionContent;

/**
 * Current progress value. null means indeterminate progress.
 */
export type ProgressValue = number | null;

/**
 * Visual intent for Progress.
 */
export type ProgressVariant = "default" | "success" | "warning" | "danger";

/**
 * Progress size token.
 */
export type ProgressSize = "md";

/**
 * Options for creating a Progress component.
 */
export interface ProgressOptions extends BaseCompositionOptions {
    label: ProgressCompositionContent;
    value?: ProgressValue;
    max?: number;
    description?: ProgressCompositionContent | null;
    valueText?: string | null;
    showValue?: boolean;
    variant?: ProgressVariant;
    size?: ProgressSize;
    labelOptions?: BaseCompositionOptions;
    controlOptions?: BaseCompositionOptions;
    descriptionOptions?: BaseCompositionOptions;
    valueOptions?: BaseCompositionOptions;
}

/**
 * Options accepted by ComposedProgress.update().
 */
export interface ProgressUpdateOptions extends Partial<ProgressOptions> {}

/**
 * Composed accessible progress indicator.
 */
export interface ComposedProgress extends ComposedNode<HTMLElement> {
    readonly element: HTMLElement;
    readonly header: HTMLElement;
    readonly label: HTMLLabelElement;
    readonly control: HTMLProgressElement;
    readonly valueText: HTMLElement;
    readonly description: HTMLElement;
    getValue(): ProgressValue;
    getMax(): number;
    setLabel(content: ProgressCompositionContent): void;
    setValue(value: ProgressValue): void;
    setMax(max: number): void;
    setDescription(content: ProgressCompositionContent | null): void;
    setValueText(text: string | null): void;
    update(options: ProgressUpdateOptions): void;
    destroy(): void;
}

type ProgressSlotContent = Exclude<ProgressCompositionContent, undefined> | null;

function normalizeSlotContent(content: ProgressCompositionContent | null): ProgressSlotContent {
    return content === undefined ? null : content;
}

function normalizeMax(max: number | null | undefined): number {
    return typeof max === "number" && Number.isFinite(max) && max > 0 ? max : 100;
}

function normalizeValue(value: ProgressValue | undefined, max: number): ProgressValue {
    if (value === null || value === undefined) return null;
    if (!Number.isFinite(value)) return null;

    return Math.min(Math.max(value, 0), max);
}

function getValueRatio(value: ProgressValue, max: number): number | null {
    if (value === null) return null;

    return max > 0 ? value / max : 0;
}

function getGeneratedValueText(value: ProgressValue, max: number): string | null {
    const ratio = getValueRatio(value, max);

    if (ratio === null) return null;

    return `${Math.round(ratio * 100)}%`;
}

/**
 * Creates an accessible native progress indicator with label and optional value text.
 */
export function Progress(options: ProgressOptions): ComposedProgress {
    const element = createElement("div", getCompositionElementOptions(options, {
        "data-af-composition": "progress"
    }));

    const header = createElement("div", {
        attributes: {
            "data-af-progress-header": ""
        }
    });

    const label = createElement("label", getCompositionElementOptions(options.labelOptions, {
        "data-af-progress-label": ""
    }));

    const valueText = createElement("span", getCompositionElementOptions(options.valueOptions, {
        "data-af-progress-value": ""
    }));

    const control = createElement("progress", getCompositionElementOptions(options.controlOptions, {
        "data-af-progress-control": ""
    }));

    const description = createElement("div", getCompositionElementOptions(options.descriptionOptions, {
        "data-af-progress-description": ""
    }));

    if (!control.id) {
        control.id = createId("af-progress");
    }

    if (!description.id) {
        description.id = createId("af-progress-description");
    }

    let max = normalizeMax(options.max);
    let value: ProgressValue = normalizeValue(options.value, max);
    let variant: ProgressVariant = options.variant ?? "default";
    let size: ProgressSize = options.size ?? "md";
    let showValue = options.showValue ?? value !== null;
    let descriptionContent: ProgressSlotContent = normalizeSlotContent(options.description);
    let explicitValueText = options.valueText ?? null;
    let hasDescription = hasCompositionContent(descriptionContent);

    const labelSlot = createContentSlot(label, toCompositionChildren(options.label));
    const descriptionSlot = createContentSlot(description, toCompositionChildren(descriptionContent));
    const valueSlot = createContentSlot(valueText);

    header.append(label, valueText);
    element.append(header, control, description);

    function getCurrentValueText(): string | null {
        if (explicitValueText !== null) return explicitValueText;
        if (!showValue) return null;

        return getGeneratedValueText(value, max);
    }

    function syncValueText(): void {
        const text = getCurrentValueText();

        valueSlot.set(text === null ? [] : [text]);
        valueText.hidden = text === null;
        setElementAttributeValue(control, "aria-valuetext", text);
    }

    function sync(): void {
        const ratio = getValueRatio(value, max);
        const state = value === null ? "indeterminate" : "determinate";

        element.setAttribute("data-af-composition", "progress");
        element.setAttribute("data-af-state", state);
        element.setAttribute("data-af-variant", variant);
        element.setAttribute("data-af-size", size);

        label.htmlFor = control.id;
        control.max = max;

        if (value === null) {
            control.removeAttribute("value");
        } else {
            control.value = value;
        }

        control.style.setProperty("--af-progress-value-ratio", String(ratio ?? 0));

        description.hidden = !hasDescription;
        setElementAttributeValue(control, "aria-describedby", hasDescription ? description.id : null);

        syncValueText();
    }

    function setLabel(content: ProgressCompositionContent): void {
        labelSlot.set(toCompositionChildren(content));
        sync();
    }

    function setValue(nextValue: ProgressValue): void {
        value = normalizeValue(nextValue, max);
        sync();
    }

    function setMax(nextMax: number): void {
        max = normalizeMax(nextMax);
        value = normalizeValue(value, max);
        sync();
    }

    function setDescription(content: ProgressCompositionContent | null): void {
        descriptionContent = normalizeSlotContent(content);
        hasDescription = hasCompositionContent(descriptionContent);
        descriptionSlot.set(toCompositionChildren(descriptionContent));
        sync();
    }

    function setValueText(text: string | null): void {
        explicitValueText = text;
        sync();
    }

    sync();

    return {
        element,
        header,
        label,
        control,
        valueText,
        description,

        getValue() {
            return value;
        },

        getMax() {
            return max;
        },

        setLabel,
        setValue,
        setMax,
        setDescription,
        setValueText,

        update(nextOptions) {
            applyCompositionElementOptions(element, nextOptions);

            if (nextOptions.labelOptions !== undefined) {
                applyCompositionElementOptions(label, nextOptions.labelOptions);
            }

            if (nextOptions.controlOptions !== undefined) {
                applyCompositionElementOptions(control, nextOptions.controlOptions);
                if (!control.id) control.id = createId("af-progress");
            }

            if (nextOptions.descriptionOptions !== undefined) {
                applyCompositionElementOptions(description, nextOptions.descriptionOptions);
                if (!description.id) description.id = createId("af-progress-description");
            }

            if (nextOptions.valueOptions !== undefined) {
                applyCompositionElementOptions(valueText, nextOptions.valueOptions);
            }

            if ("label" in nextOptions) setLabel(nextOptions.label);
            if (nextOptions.max !== undefined) setMax(nextOptions.max);
            if ("value" in nextOptions) setValue(nextOptions.value ?? null);
            if ("description" in nextOptions) setDescription(nextOptions.description ?? null);
            if ("valueText" in nextOptions) setValueText(nextOptions.valueText ?? null);
            if (nextOptions.showValue !== undefined) showValue = nextOptions.showValue;
            if (nextOptions.variant !== undefined) variant = nextOptions.variant;
            if (nextOptions.size !== undefined) size = nextOptions.size;

            sync();
        },

        destroy() {
            labelSlot.dispose();
            descriptionSlot.dispose();
            valueSlot.dispose();
        }
    };
}
