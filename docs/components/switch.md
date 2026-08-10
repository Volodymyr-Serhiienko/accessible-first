# Switch

Switch provides an accessible on/off control for immediate settings with a visible label, optional description, optional error message, and Accessible First styling hooks.

## When To Use

Use `Switch` for settings that can be turned on or off and take effect immediately or almost immediately.

Use `Checkbox` for independent form choices, confirmations, and agreements. Use `RadioGroup` when users must choose one option from a small mutually exclusive set.

## Quick Start

Minimal switch:

```ts
Switch({
    label: "Reduce motion"
});
```

With description and callback:

```ts
Switch({
    label: "Email notifications",
    description: "Send updates about important account activity.",
    defaultChecked: true,
    onCheckedChange(detail) {
        console.log(detail.checked);
    }
});
```

Enhance existing HTML:

```ts
const switchControl = createSwitch(existingInput, {
    defaultChecked: true,
    onCheckedChange(detail) {
        console.log(detail.checked);
    }
});
```

## Layers

- Enhancement API: `createSwitch(input, options)`
- Composition API: `Switch(options)`
- Reuses: native `<input type="checkbox">`, `role="switch"`, component lifecycle, form-field semantics

## Behavior

- Uses a native checkbox input for focus, keyboard support, form submission, and mobile reliability.
- Adds `role="switch"` and synchronized `aria-checked`.
- Connects the composed visible label through a native `<label for="...">`.
- Connects optional description and error slots through form-field semantics.
- Supports checked/defaultChecked, disabled, required, invalid, name, and value.
- Emits normalized checked-change details after user interaction.
- Exposes stable data attributes for styling.
- Restores enhanced input attributes on `destroy()`.

Native keyboard behavior is used: `Tab` reaches the switch and `Space` toggles it.

## Options

- `label` - Required visible label content.
- `description` - Optional supporting content connected to the switch.
- `errorMessage` - Optional error content connected when `invalid` is active.
- `checked` - Controlled checked state.
- `defaultChecked` - Initial checked state. Creation-time option.
- `disabled` - Disables the switch.
- `required` - Marks the native input as required.
- `invalid` - Sets invalid state and connects `errorMessage` when present.
- `name` - Native form field name.
- `value` - Native checked submission value.
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
const switchControl = Switch({
    label: "Reduce motion"
});

switchControl.setChecked(true);
switchControl.toggleChecked();
switchControl.update({
    disabled: true
});
```

The composed switch also exposes slot helpers:

```ts
switchControl.setLabelContent("Reduce animation");
switchControl.setDescription("Fewer interface transitions will be used.");
switchControl.setErrorMessage(null);
```

## Styling

Useful hooks include `[data-af-composition="switch"]`, `[data-af-switch-input]`, `[data-af-switch-label]`, `[data-af-switch-track]`, `[data-af-switch-thumb]`, `[data-af-switch-description]`, `[data-af-switch-error]`, `[data-af-checked]`, `[data-af-variant]`, `[data-af-size]`, and `[data-af-state]`.

```ts
Switch({
    label: "Enable diagnostics",
    className: "settings-switch"
});
```

## Manual Checks

- Tab reaches the switch.
- Focus indicator is visible.
- `Space` toggles the switch.
- Label click toggles the switch.
- Screen readers announce label, switch role, state, description, and error message when present.
- Disabled switch cannot be changed.
- Touch target is comfortable on mobile.
- Text contrast is readable in light and dark themes.
