# Checkbox

Checkbox provides an accessible native checkbox with Accessible First styling hooks, form-field relationships, and optional mixed state.

## When To Use

Use `Checkbox` when users can turn one independent option on or off.

For a mutually exclusive choice, use a future `RadioGroup`. For a setting that behaves like an immediate on/off switch, use a future `Switch`.

## Quick Start

Minimal checkbox:

```ts
Checkbox({
    label: "Email updates"
});
```

With description and change callback:

```ts
Checkbox({
    label: "Email updates",
    description: "Receive product updates no more than once a week.",
    defaultChecked: true,
    onCheckedChange(detail) {
        console.log(detail.checked);
    }
});
```

Required checkbox with an error message:

```ts
const agreement = Checkbox({
    label: "I agree to the accessibility checklist",
    description: "Required before publishing this page.",
    required: true,
    invalid: true,
    errorMessage: "This checkbox is required."
});

agreement.setInvalid(false);
agreement.setErrorMessage(null);
```

Mixed state:

```ts
Checkbox({
    label: "Select all visible items",
    checked: "mixed"
});
```

Enhance existing HTML:

```ts
const checkbox = createCheckbox(existingInput, {
    defaultChecked: true,
    onCheckedChange(detail) {
        console.log(detail.checkedState);
    }
});
```

## Layers

- Enhancement API: `createCheckbox(input, options)`
- Composition API: `Checkbox(options)`
- Reuses: native `<input type="checkbox">`, component lifecycle, form-field semantics

## Behavior

- Uses the native checkbox input for role, keyboard support, form submission, and mobile reliability.
- Connects the composed visible label through a native `<label for="...">`.
- Connects optional description and error slots through form-field semantics.
- Supports `checked`, `defaultChecked`, and `"mixed"` checked state.
- Maps `"mixed"` to the native `indeterminate` state.
- Emits normalized change details after user interaction.
- Supports disabled, required, invalid, name, and value.
- Exposes stable data attributes for styling.
- Restores enhanced input attributes on `destroy()`.

Native keyboard behavior is used: `Tab` reaches the checkbox and `Space` toggles it.

## Options

Root options:

- `label` - Required visible label content.
- `description` - Optional supporting content connected to the checkbox.
- `errorMessage` - Optional error content connected when `invalid` is active.
- `checked` - Controlled checked state: `true`, `false`, or `"mixed"`.
- `defaultChecked` - Initial checked state. Creation-time option.
- `disabled` - Disables the checkbox.
- `required` - Marks the checkbox as required.
- `invalid` - Sets `aria-invalid` and connects `errorMessage` when present.
- `name` - Native form field name.
- `value` - Native checkbox submission value.
- `variant` - `"default"` or `"plain"`.
- `size` - `"md"`.
- `onCheckedChange` - Called after user interaction changes state.
- `inputOptions` - Common DOM options for the native input.
- `labelOptions` - Common DOM options for the label.
- `descriptionOptions` - Common DOM options for the description slot.
- `errorOptions` - Common DOM options for the error slot.
- common composition options from [foundation.md](./foundation.md#common-composition-options).

## Update Notes

`defaultChecked` is creation-time only. Use `setChecked()` or `update({ checked })` to change the current state.

```ts
const checkbox = Checkbox({
    label: "Email updates"
});

checkbox.setChecked(true);
checkbox.setChecked("mixed");
checkbox.update({
    disabled: true
});
```

The composed checkbox also exposes slot helpers:

```ts
checkbox.setLabelContent("Receive weekly updates");
checkbox.setDescription("You can unsubscribe at any time.");
checkbox.setErrorMessage(null);
```

## Styling

Useful hooks include `[data-af-composition="checkbox"]`, `[data-af-checkbox-input]`, `[data-af-checkbox-label]`, `[data-af-checkbox-indicator]`, `[data-af-checkbox-description]`, `[data-af-checkbox-error]`, `[data-af-checked]`, `[data-af-variant]`, `[data-af-size]`, and `[data-af-state]`.

```ts
Checkbox({
    label: "Enable beta features",
    className: "settings-checkbox"
});
```

## Manual Checks

- Tab reaches the checkbox.
- Focus indicator is visible.
- `Space` toggles the checkbox.
- Label click toggles the checkbox.
- Checked, unchecked, and mixed states are visually clear.
- Screen readers announce label, role, state, required, invalid, description, and error message.
- Disabled checkbox cannot be changed.
- Touch target is comfortable on mobile.
- Text contrast is readable in light and dark themes.
