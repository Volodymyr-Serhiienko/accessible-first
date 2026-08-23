# FieldGroup

FieldGroup provides a semantic container for related form controls with a shared visible label, optional description, optional group error, and Accessible First styling hooks.

## When To Use

Use `FieldGroup` when several controls answer one larger question or belong to one form section.

Use `RadioGroup` for one-of-many choices. Use `Checkbox`, `Switch`, `TextField`, `Select`, or `Combobox` for the individual controls inside the group.

## Quick Start

Minimal group:

```ts
FieldGroup({
    label: "Contact details",
    children: [
        TextField({ label: "Email", type: "email" }),
        TextField({ label: "Phone", type: "tel" })
    ]
});
```

With description and validation state:

```ts
const group = FieldGroup({
    label: "Notification preferences",
    description: "Choose at least one way we can contact you.",
    required: true,
    invalid: true,
    errorMessage: "Choose at least one contact method.",
    children: [
        Checkbox({ label: "Email updates" }),
        Checkbox({ label: "SMS updates" })
    ]
});

group.setInvalid(false);
group.setErrorMessage(null);
```

Horizontal controls:

```ts
FieldGroup({
    label: "Visible density",
    orientation: "horizontal",
    children: [
        Switch({ label: "Compact rows" }),
        Switch({ label: "Large controls" })
    ]
});
```

## Layers

- Composition API: `FieldGroup(options)`
- Reuses: native `<fieldset>` and `<legend>`, form-field semantics, composition slots

## Behavior

- Uses a native fieldset and legend by default.
- Connects optional group description through form-field semantics by default.
- Supports `descriptionMode: "content"` when the group description should stay visible without being connected through `aria-describedby`.
- Always connects visible group error text when `invalid` is active, because validation feedback must be programmatically available.
- Shows a visible required marker when `required` is true.
- Supports disabled and invalid group states.
- Does not validate child controls by itself. Individual fields own their own validation.
- Does not use live regions by itself; pair it with field validation, form feedback, or toast/status helpers when dynamic feedback must be spoken.
- Exposes stable data attributes for styling.

## Options

- `label` - Required group label content rendered as a legend.
- `description` - Optional supporting content connected to the group.
- `errorMessage` - Optional error content connected when `invalid` is active.
- `children` - Controls or composed nodes inside the group.
- `disabled` - Disables the whole fieldset.
- `required` - Marks the group as required and shows a visible required marker.
- `invalid` - Sets invalid group state and connects `errorMessage` when present.
- `descriptionMode` - `"aria"` or `"content"`. Defaults to `"aria"` for form-group context. Use `"content"` to reduce repeated group description speech.
- `orientation` - `"vertical"` or `"horizontal"`.
- `variant` - `"default"` or `"plain"`.
- `size` - `"md"`.
- `legendOptions` - Common DOM options for the legend.
- `bodyOptions` - Common DOM options for the body slot.
- `descriptionOptions` - Common DOM options for the description slot.
- `errorOptions` - Common DOM options for the error slot.
- common composition options from [foundation.md](./foundation.md#common-composition-options).

## Update Notes

```ts
const group = FieldGroup({
    label: "Profile",
    children: [
        TextField({ label: "Display name" })
    ]
});

group.setDescription("Shown in public profile pages.");
group.setInvalid(true);
group.setErrorMessage("Complete the required profile fields.");
group.update({
    orientation: "horizontal"
});
```

The composed group exposes slot helpers:

```ts
group.setLabelContent("Account profile");
group.setChildren([
    TextField({ label: "Display name" }),
    TextField({ label: "Username" })
]);
```

## Styling

Useful hooks include `[data-af-composition="field-group"]`, `[data-af-field-group-legend]`, `[data-af-field-group-description]`, `[data-af-field-group-error]`, `[data-af-field-group-body]`, `[data-af-required]`, `[data-af-invalid]`, `[data-af-orientation]`, `[data-af-variant]`, `[data-af-size]`, and `[data-af-state]`.

```ts
FieldGroup({
    label: "Billing",
    className: "billing-group"
});
```

## Description Speech

Use the default `descriptionMode: "aria"` when the group description gives important instructions for answering the grouped controls. This keeps the description programmatically attached to the fieldset.

Use `descriptionMode: "content"` when the description is helpful visible context but becomes too repetitive with the target screen reader/browser combination. Error text remains connected while `invalid` is active.

## Manual Checks

- The group label is announced before or with controls inside the group.
- The group description is announced when `descriptionMode: "aria"` and supported by the screen reader/browser pair.
- Required and invalid group states are visible.
- Error text is connected when `invalid` is active.
- Child controls keep their own labels, descriptions, validation, and keyboard behavior.
- Disabled group prevents interaction with child form controls.
- Horizontal layout wraps on small screens.
- Text contrast is readable in light and dark themes.
