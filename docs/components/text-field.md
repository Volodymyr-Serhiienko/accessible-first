# TextField

TextField provides an accessible native text input or textarea with a visible label, optional description, optional error message, and Accessible First styling hooks.

## When To Use

Use `TextField` when users need to enter short or long free-form text.

Use `Combobox` when users should type and choose from known options. Use `Select`, `Listbox`, or `RadioGroup` when the value should come from a fixed set.

## Quick Start

Minimal text input:

```ts
TextField({
    label: "Full name"
});
```

With description and callback:

```ts
TextField({
    label: "Email",
    type: "email",
    placeholder: "name@example.com",
    description: "Used for account notifications.",
    onValueChange(detail) {
        console.log(detail.value);
    }
});
```

Required field with blur validation:

```ts
TextField({
    label: "Email",
    type: "email",
    required: true,
    description: "Required. Used for account notifications.",
    validationMessages: {
        valueMissing: "Enter your email address.",
        typeMismatch: "Enter a valid email address."
    }
});
```

Multiline textarea:

```ts
TextField({
    label: "Feedback",
    multiline: true,
    rows: 4,
    description: "Share any accessibility issues you noticed."
});
```

Enhance existing HTML:

```ts
const field = createTextField(existingInput, {
    required: true,
    onValueInput(detail) {
        console.log(detail.value);
    }
});
```

## Layers

- Enhancement API: `createTextField(control, options)`
- Composition API: `TextField(options)`
- Reuses: native `<input>` or `<textarea>`, component lifecycle, form-field semantics

## Behavior

- Uses native input and textarea controls for keyboard support, forms, autofill, validation, and mobile keyboards.
- Connects the composed visible label through a native `<label for="...">`.
- Connects optional description and error slots through form-field semantics.
- Supports value/defaultValue, disabled, required, readOnly, invalid, name, placeholder, autocomplete, inputMode, length limits, pattern, and input type.
- Supports field-level validation on blur.
- Shows required fields with a visible required marker.
- Can show visual valid/invalid state and connect/announce the validation message.
- Emits `onValueInput` during typing and `onValueChange` on native change.
- Exposes stable data attributes for styling.
- Restores enhanced control attributes on `destroy()`.

## Options

- `label` - Required visible label content.
- `description` - Optional supporting content connected to the control.
- `errorMessage` - Optional error content connected when `invalid` is active.
- `value` - Controlled current value.
- `defaultValue` - Initial value. Creation-time option.
- `type` - `"text"`, `"email"`, `"password"`, `"search"`, `"tel"`, `"url"`, or `"number"` for single-line inputs.
- `multiline` - Creates a textarea instead of an input.
- `rows` - Visible textarea rows when `multiline` is true.
- `disabled` - Disables the control.
- `required` - Marks the control as required.
- `readOnly` - Marks the control as read-only.
- `invalid` - Sets invalid state and connects `errorMessage` when present.
- `name` - Native form field name.
- `placeholder` - Native placeholder text.
- `autocomplete` - Native autocomplete token.
- `inputMode` - Native inputmode hint.
- `minLength` - Native minlength.
- `maxLength` - Native maxlength.
- `pattern` - Native pattern for single-line input.
- `validateOnBlur` - Validates when focus leaves the control. Defaults to `true`.
- `validateOnInput` - Validates while typing. Defaults to `false`.
- `showValidState` - Shows visual valid state when the field is valid. Defaults to `true`.
- `announceValidation` - Announces invalid validation messages from composed fields. Defaults to `true`.
- `validationMessages` - Custom messages for native validation states.
- `validator` - Optional custom validator returning an error message or `null`.
- `onValidationChange` - Called when validation state changes.
- `variant` - `"default"` or `"plain"`.
- `size` - `"md"`.
- `onValueInput` - Called on native input events.
- `onValueChange` - Called on native change events.
- `controlOptions` - Common DOM options for the native input or textarea.
- `labelOptions` - Common DOM options for the label.
- `descriptionOptions` - Common DOM options for the description slot.
- `errorOptions` - Common DOM options for the error slot.
- common composition options from [foundation.md](./foundation.md#common-composition-options).

## Update Notes

`defaultValue` and `multiline` are creation-time options. Use `setValue()` or `update({ value })` to change the current value.

```ts
const field = TextField({
    label: "Full name"
});

field.setValue("Ada Lovelace");
field.update({
    invalid: true,
    errorMessage: "Full name is required."
});
```

The composed text field also exposes slot helpers:

```ts
field.setLabelContent("Display name");
field.setDescription("Shown to other users.");
field.setErrorMessage(null);
```

Programmatic validation:

```ts
const result = field.validate();

if (!result.valid) {
    console.log(result.message);
}
```

## Styling

Useful hooks include `[data-af-composition="text-field"]`, `[data-af-component="text-field"]`, `[data-af-text-field-label]`, `[data-af-text-field-control-wrap]`, `[data-af-text-field-control]`, `[data-af-text-field-validation-icon]`, `[data-af-text-field-description]`, `[data-af-text-field-error]`, `[data-af-required]`, `[data-af-validation-state]`, `[data-af-multiline]`, `[data-af-variant]`, `[data-af-size]`, and `[data-af-state]`.

```ts
TextField({
    label: "Project name",
    className: "project-name-field"
});
```

## Manual Checks

- Tab reaches the text field.
- Focus indicator is visible.
- Label click moves focus to the control.
- Mobile keyboard matches the input type or inputMode.
- Screen readers announce label, role, value, description, required, invalid, read-only, and error message when present.
- Required field has a visible required marker.
- Invalid field shows an error marker and announces the validation message after blur.
- Valid field can show a success marker after blur.
- Disabled field cannot be changed.
- Read-only field can be focused but not edited.
- Text contrast is readable in light and dark themes.
