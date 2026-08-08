# Select

Select provides an accessible native select component with Accessible First lifecycle, styling hooks, optional visible label, and composition-friendly value callbacks.

## When To Use

Use `Select` when users need to choose one or more values from a native form control.

This component intentionally builds on the platform `<select>` element. That keeps mobile behavior, form integration, browser validation, and screen reader support reliable without adding custom popover complexity.

For editable autocomplete or filtered popup selection, use `Combobox`.

## Quick Start

```ts
Select({
    label: "Documentation area",
    placeholder: "Choose an area",
    items: [
        { value: "components", label: "Components" },
        { value: "patterns", label: "Page patterns" },
        { value: "testing", label: "Testing" }
    ],
    onValueChange(detail) {
        console.log(detail.value, detail.text);
    }
});
```

Multiple selection:

```ts
Select({
    label: "Testing targets",
    multiple: true,
    visibleRows: 4,
    defaultValue: ["keyboard", "mobile"],
    items: [
        { value: "keyboard", label: "Keyboard" },
        { value: "screen-reader", label: "Screen reader" },
        { value: "mobile", label: "Mobile" },
        { value: "automation", label: "Automation later" }
    ]
});
```

## Layers

- Enhancement API: `createSelect(element, options)`
- Composition API: `Select(options)`
- Reuses: native `<select>`, component lifecycle, composition options

## Behavior

- Uses native select semantics instead of recreating select behavior with custom DOM.
- Supports single and multiple selection.
- Native multiple select uses the platform selection model with modifier keys.
- For modifier-free multi-selection in application UI, prefer `Listbox` with `selectionMode: "multiple"`.
- Supports native form submission through `name`.
- Supports native `required`, `disabled`, and browser validation behavior.
- Emits normalized value details on change.
- Connects an optional visible label to the select with `for` and `id`.
- Keeps styling/debug attributes on the select control.
- Maps `visibleRows` to the native `size` attribute.

Keyboard and assistive technology behavior is provided by the browser and platform accessibility APIs.

## Options

Root options:

- `label` - Optional visible label text.
- `labelOptions` - Common DOM options for the label element.
- `selectOptions` - Common DOM options for the native select element.
- `placeholder` - Single-select placeholder shown when no initial value exists. Creation-time option.
- `items` - Required list of option definitions.
- `value` - Controlled value or values.
- `defaultValue` - Initially selected value or values. Creation-time option.
- `disabled` - Disables the select.
- `required` - Marks the select as required.
- `multiple` - Enables multiple selection.
- `visibleRows` - Number of visible native option rows. Useful for multiple selects. Maps to the native `size` attribute.
- `name` - Native form field name.
- `variant` - `"default"` or `"plain"`.
- `size` - `"md"`.
- `onValueChange` - Called when selection changes.
- common composition options from [foundation.md](./foundation.md#common-composition-options).

Item options:

- `value` - Stable option value.
- `label` - Required option text.
- `disabled` - Disables one option.
- `defaultSelected` - Selects one option initially when `value` and `defaultValue` are not provided.
- `optionOptions` - Common DOM options for the native option element.

## Update Notes

`placeholder` and `defaultValue` are creation-time options.

`visibleRows` can be updated later:

```ts
select.update({
    visibleRows: 6
});
```

Change selected values through `value` or controller methods:

```ts
const select = Select({
    label: "Area",
    items: [
        { value: "components", label: "Components" },
        { value: "patterns", label: "Patterns" }
    ]
});

select.setValue("patterns");
```

Item updates are partial and matched by index:

```ts
select.update({
    items: [
        { label: "UI components" },
        { disabled: true }
    ]
});
```

## Styling

Useful hooks include `[data-af-composition="select"]`, `[data-af-component="select"]`, `[data-af-select-label]`, `[data-af-select-control]`, `[data-af-select-option]`, `[data-af-variant]`, and `[data-af-state]`.

```ts
Select({
    className: "settings-select",
    label: "Theme",
    items: [...]
});
```

## Manual Checks

- Label is announced with the select.
- Single selection announces the current option.
- Multiple selection works with the platform interaction model.
- Disabled select cannot be changed.
- Disabled options cannot be selected.
- Required state participates in native validation.
- Focus indicator is visible.
- Touch behavior opens the native picker on mobile.
