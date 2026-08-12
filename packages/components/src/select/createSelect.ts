import { restoreAttribute } from "../../../core/src/dom";
import { addEventListener } from "../../../core/src/events";
import { createComponentLifecycle } from "../foundation";
import type { Select, SelectChangeDetail, SelectOptions, SelectSize, SelectUpdateOptions, SelectValue, SelectVariant } from "./types";

function toValueArray(value: SelectValue): string[] {
    return Array.isArray(value) ? value : [value];
}

function normalizeVisibleRows(value: number | null | undefined): number | null {
    if (value === null || value === undefined) return null;

    const rows = Math.floor(value);

    return rows > 0 ? rows : null;
}

function getSelectedOptions(element: HTMLSelectElement): HTMLOptionElement[] {
    return Array.from(element.selectedOptions);
}

function getOptionText(option: HTMLOptionElement): string {
    return option.textContent?.trim() || option.value;
}

function getValues(element: HTMLSelectElement): string[] {
    return getSelectedOptions(element).map((option) => option.value);
}

function getTexts(element: HTMLSelectElement): string[] {
    return getSelectedOptions(element).map(getOptionText);
}

function setSelectedValue(element: HTMLSelectElement, value: SelectValue): void {
    const values = toValueArray(value);

    if (!element.multiple) {
        element.value = values[0] ?? "";
        return;
    }

    const selectedValues = new Set(values);

    for (const option of Array.from(element.options)) {
        option.selected = selectedValues.has(option.value);
    }
}

function getChangeDetail(element: HTMLSelectElement, event: Event): SelectChangeDetail {
    const values = getValues(element);
    const texts = getTexts(element);

    return {
        value: element.value,
        values,
        text: texts[0] ?? element.value,
        texts,
        selectedOptions: getSelectedOptions(element),
        selectedIndex: element.selectedIndex,
        event
    };
}

/**
 * Enhances a native HTMLSelectElement with Accessible First lifecycle,
 * styling attributes, state helpers, and value-change callbacks.
 */
export function createSelect(
    element: HTMLSelectElement,
    options: SelectOptions = {}
): Select {
    const lifecycle = createComponentLifecycle(element, {
        name: "select",
        initialState: options.disabled ? "disabled" : "ready"
    });

    const originalDisabled = element.disabled;
    const originalRequired = element.required;
    const originalMultiple = element.multiple;
    const originalValues = getValues(element);
    const originalName = element.getAttribute("name");
    const originalVariant = element.getAttribute("data-af-variant");
    const originalSize = element.getAttribute("data-af-size");
    const originalVisibleRows = element.getAttribute("size");

    let disabled = options.disabled ?? element.disabled;
    let required = options.required ?? element.required;
    let multiple = options.multiple ?? element.multiple;
    let name = options.name;
    let variant: SelectVariant = options.variant ?? "default";
    let size: SelectSize = options.size ?? "md";
    let visibleRows = options.visibleRows;
    let onValueChange = options.onValueChange ?? null;
    let component!: Select;

    function syncDisabled(): void {
        element.disabled = disabled;
        lifecycle.setState(disabled ? "disabled" : "ready");
    }

    function syncRequired(): void {
        element.required = required;
    }

    function syncMultiple(): void {
        element.multiple = multiple;
    }

    function syncName(): void {
        if (name === undefined) return;

        if (name === null) {
            element.removeAttribute("name");
            return;
        }

        element.name = name;
    }

    function syncVisibleRows(): void {
        if (visibleRows === undefined) return;

        const rows = normalizeVisibleRows(visibleRows);

        if (rows === null) {
            element.removeAttribute("size");
            return;
        }

        element.size = rows;
    }

    function syncAttributes(): void {
        element.setAttribute("data-af-variant", variant);
        element.setAttribute("data-af-size", size);
    }

    function handleChange(event: Event): void {
        onValueChange?.(getChangeDetail(element, event), component);
    }

    syncMultiple();
    syncDisabled();
    syncRequired();
    syncName();
    syncVisibleRows();
    syncAttributes();

    if (options.value !== undefined) {
        setSelectedValue(element, options.value);
    }

    lifecycle.addCleanup(addEventListener<Event>(element, "change", handleChange));

    lifecycle.addCleanup(() => {
        element.disabled = originalDisabled;
        element.required = originalRequired;
        element.multiple = originalMultiple;
        setSelectedValue(element, originalValues);

        restoreAttribute(element, "name", originalName);
        restoreAttribute(element, "data-af-variant", originalVariant);
        restoreAttribute(element, "data-af-size", originalSize);
        restoreAttribute(element, "size", originalVisibleRows);
    });

    component = {
        element,
        select: element,

        getValue(): string {
            return element.value;
        },

        getValues(): string[] {
            return getValues(element);
        },

        setValue(value): void {
            if (lifecycle.isDestroyed()) return;

            setSelectedValue(element, value);
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

        setMultiple(nextMultiple): void {
            if (lifecycle.isDestroyed()) return;

            multiple = nextMultiple;
            syncMultiple();
        },

        isMultiple(): boolean {
            return multiple;
        },

        update(nextOptions: SelectUpdateOptions): void {
            if (nextOptions.disabled !== undefined) {
                this.setDisabled(nextOptions.disabled);
            }

            if (nextOptions.required !== undefined) {
                this.setRequired(nextOptions.required);
            }

            if (nextOptions.multiple !== undefined) {
                this.setMultiple(nextOptions.multiple);
            }

            if ("name" in nextOptions) {
                name = nextOptions.name ?? null;
                syncName();
            }

            if ("visibleRows" in nextOptions) {
                visibleRows = nextOptions.visibleRows ?? null;
                syncVisibleRows();
            }

            if ("onValueChange" in nextOptions) {
                onValueChange = nextOptions.onValueChange ?? null;
            }

            if (nextOptions.variant !== undefined) {
                variant = nextOptions.variant;
            }

            if (nextOptions.size !== undefined) {
                size = nextOptions.size;
            }

            syncAttributes();

            if (nextOptions.value !== undefined) {
                this.setValue(nextOptions.value);
            }
        },

        destroy(): void {
            lifecycle.destroy();
        },

        isDestroyed(): boolean {
            return lifecycle.isDestroyed();
        }
    };

    return component;
}
