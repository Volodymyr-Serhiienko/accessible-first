# RadioGroup

RadioGroup provides an accessible native radio-button group with a shared label, optional description, optional error message, and composition-friendly value callbacks.

## When To Use

Use `RadioGroup` when users must choose one option from a small set of mutually exclusive options.

For independent on/off choices, use `Checkbox`. For long lists, search, or compact native pickers, use `Select`, `Listbox`, or `Combobox` depending on the interaction.

## Quick Start

Minimal radio group:

```ts
RadioGroup({
    label: "Theme",
    items: [
        { value: "system", label: "System" },
        { value: "light", label: "Light" },
        { value: "dark", label: "Dark" }
    ]
});
```

With default value and callback:

```ts
RadioGroup({
    label: "Testing target",
    description: "Choose the main environment for this check.",
    defaultValue: "keyboard",
    items: [
        { value: "keyboard", label: "Keyboard" },
        { value: "screen-reader", label: "Screen reader" },
        { value: "mobile", label: "Mobile" }
    ],
    onValueChange(detail) {
        console.log(detail.value, detail.selectedText);
    }
});
```

Required group with an error message:

```ts
const group = RadioGroup({
    label: "Release confidence",
    required: true,
    invalid: true,
    errorMessage: "Choose a release confidence level.",
    items: [
        { value: "low", label: "Low" },
        { value: "medium", label: "Medium" },
        { value: "high", label: "High" }
    ],
    onValueChange(_detail, radioGroup) {
        radioGroup.setInvalid(false);
        radioGroup.setErrorMessage(null);
    }
});
```

Enhance existing HTML:

```ts
const radioGroup = createRadioGroup(existingFieldset, {
    required: true,
    onValueChange(detail) {
        console.log(detail.value);
    }
});
```

## Layers

- Enhancement API: `createRadioGroup(element, options)`
- Composition API: `RadioGroup(options)`
- Reuses: native `<input type="radio">`, `<fieldset>`, `<legend>`, component lifecycle, form-field semantics

## Behavior

- Uses native radio inputs for role, keyboard support, form submission, validation, and mobile reliability.
- Uses a composed `<fieldset>` and `<legend>` for the group label.
- Connects optional group description and error message.
- Connects optional per-option descriptions.
- Keeps all radios in one generated or provided `name` group.
- Supports `value`, `defaultValue`, disabled, required, invalid, orientation, variant, and size.
- Supports disabled individual options.
- Emits normalized value details after user interaction.
- Exposes stable data attributes for styling.
- Restores enhanced group and input attributes on `destroy()`.

Native keyboard behavior is used. `Tab` enters the radio group, and arrow-key behavior is provided by the browser/platform for radios with the same `name`.

## Options

Root options:

- `label` - Required group label content rendered as a legend.
- `description` - Optional group description.
- `errorMessage` - Optional group error content connected when `invalid` is active.
- `items` - Required list of radio item definitions.
- `value` - Controlled selected value or `null`.
- `defaultValue` - Initial selected value. Creation-time option.
- `disabled` - Disables the whole group.
- `required` - Marks radio inputs as required.
- `invalid` - Sets invalid state and connects `errorMessage` when present.
- `name` - Native radio group name. Generated when omitted.
- `orientation` - `"vertical"` or `"horizontal"`.
- `variant` - `"default"` or `"plain"`.
- `size` - `"md"`.
- `onValueChange` - Called after user interaction changes selection.
- `labelOptions` - Common DOM options for the legend.
- `descriptionOptions` - Common DOM options for the group description.
- `errorOptions` - Common DOM options for the group error.
- common composition options from [foundation.md](./foundation.md#common-composition-options).

Item options:

- `value` - Stable option value.
- `label` - Required option label content.
- `description` - Optional option-specific description.
- `disabled` - Disables one option.
- `defaultSelected` - Selects one option initially when `value` and `defaultValue` are not provided.
- `itemOptions` - Common DOM options for the item wrapper.
- `inputOptions` - Common DOM options for the native radio input.
- `labelOptions` - Common DOM options for the option label.
- `descriptionOptions` - Common DOM options for the option description.

## Update Notes

`defaultValue` is creation-time only. Use `setValue()` or `update({ value })` to change the current selection.

```ts
const group = RadioGroup({
    label: "Theme",
    items: [
        { value: "system", label: "System" },
        { value: "light", label: "Light" },
        { value: "dark", label: "Dark" }
    ]
});

group.setValue("dark");
group.update({
    orientation: "horizontal"
});
```

Item updates are partial and matched by index:

```ts
group.update({
    items: [
        { label: "Use system theme" },
        { disabled: true }
    ]
});
```

The composed group also exposes slot helpers:

```ts
group.setLabelContent("Preferred theme");
group.setDescription("Used for the playground preview.");
group.setErrorMessage(null);
```

## Styling

Useful hooks include `[data-af-composition="radio-group"]`, `[data-af-component="radio-group"]`, `[data-af-radio-group-legend]`, `[data-af-radio-group-description]`, `[data-af-radio-group-error]`, `[data-af-radio-group-items]`, `[data-af-radio-group-item]`, `[data-af-radio-input]`, `[data-af-radio-label]`, `[data-af-radio-indicator]`, `[data-af-radio-description]`, `[data-af-orientation]`, `[data-af-variant]`, `[data-af-size]`, and `[data-af-state]`.

```ts
RadioGroup({
    label: "Density",
    className: "settings-radio-group",
    items: [...]
});
```

## Manual Checks

- Tab reaches the radio group.
- Focus indicator is visible on the focused option.
- Arrow keys move through options according to native browser behavior.
- Label click selects an option.
- Only one option can be selected.
- Required and invalid states are announced.
- Group label, description, option labels, and option descriptions are announced.
- Disabled options cannot be selected.
- Touch targets are comfortable on mobile.
- Text contrast is readable in light and dark themes.
