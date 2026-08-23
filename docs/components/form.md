# Form

Form provides a semantic native form wrapper that can collect field validation results and handle submit validation.

It is a composition component. It does not replace native form controls, `TextField`, `FieldGroup`, or `FormSection`; it coordinates them.

## When To Use

Use `Form` when a page or panel has fields that should be validated together before saving or submitting.

Use `FormSection` inside `Form` when the form has several meaningful areas.

## Quick Start

```ts
Form({
    children: ({ field }) => [
        field(TextField({
            label: "Display name",
            required: true
        })),
        field(TextField({
            label: "Email",
            type: "email"
        }))
    ],
    actions: Button({
        text: "Save",
        type: "submit",
        variant: "primary"
    }),
    onValidSubmit(detail) {
        saveProfile(detail);
    }
});
```

With sections:

```ts
Form({
    children: ({ field }) => [
        FormSection({
            title: "Profile",
            children: [
                field(TextField({
                    label: "Display name",
                    required: true
                })),
                field(TextField({
                    label: "Public email",
                    type: "email"
                }))
            ]
        })
    ],
    actions: Button({
        text: "Save profile",
        type: "submit",
        variant: "primary"
    })
});
```

Explicit field registration:

```ts
const displayName = TextField({ label: "Display name", required: true });
const email = TextField({ label: "Email", type: "email" });

Form({
    fields: [displayName, email],
    children: [displayName, email],
    actions: Button({ text: "Save", type: "submit" })
});
```

## Layers

- Composition API: `Form(options)`
- Reuses: native `<form>`, `ActionsBar`, `TextField.validate()`, validation announcements

## Behavior

- Creates a native `<form>`.
- Uses `noValidate` by default to avoid inaccessible browser validation bubbles while keeping the native constraint validation API available.
- Validates registered fields on submit by default.
- Prevents default submit by default.
- Announces a validation summary when fields are invalid.
- Moves focus to the first invalid field by default.
- Uses `ActionsBar` for form-level actions.
- Does not own field layout; use `FormSection`, `FieldGroup`, and layout primitives inside it.

## Options

- `children` - Form content or a function that receives a registration context.
- `fields` - Explicit list of validatable fields.
- `actions` - Optional form-level actions, usually submit and reset buttons.
- `name` - Native form name.
- `action` - Native form action.
- `method` - Native form method.
- `target` - Native form target.
- `autocomplete` - Native form autocomplete value.
- `noValidate` - Sets native `form.noValidate`. Defaults to `true`.
- `preventDefault` - Prevents default submit. Defaults to `true`.
- `validateOnSubmit` - Runs registered field validation on submit. Defaults to `true`.
- `focusFirstInvalid` - Moves focus to the first invalid field. Defaults to `true`.
- `scrollFirstInvalid` - Scrolls the first invalid field into view. Defaults to `true`.
- `announceValidation` - Announces invalid validation summaries. Defaults to `true`.
- `announceSuccess` - Announces success after valid submit. Defaults to `false`. Provide `successMessage` when enabling this.
- `successMessage` - Success announcement message. No framework-authored success text is announced when this is omitted.
- `validationSummaryMessage` - Optional localized summary builder for invalid submit announcements. By default, the form announces the registered field messages without adding framework-authored prose.
- `clearValidationOnReset` - Clears validation state on native reset. Defaults to `true`.
- `focusFirstOnReset` - Moves focus to the first registered field after reset. Defaults to `true`.
- `variant` - `"default"` or `"plain"`.
- `size` - `"md"`.
- `onValidate` - Called after validation.
- `onSubmit` - Called after submit handling.
- `onValidSubmit` - Called when submit validation passes.
- `onInvalidSubmit` - Called when submit validation fails.
- `actionsOptions` - Common DOM options for the actions slot.
- common composition options from [foundation.md](./foundation.md#common-composition-options).

## Speech And Validation

`Form` owns aggregate validation announcements. Registered fields are validated with `announce: false`, so invalid submit does not produce both field-level live messages and a form summary.

Use `validationSummaryMessage` when an application needs localized summary wording, a custom count, or a shorter message for long forms. Keep field error text visible and connected to the field itself.

## Field Contract

A field can participate in `Form` validation when it exposes:

```ts
{
    element: HTMLElement;
    control?: HTMLElement;
    validate(options): { valid: boolean; message: string };
}
```

`TextField` already satisfies this contract.

## Update Notes

```ts
const form = Form({
    fields: [displayName],
    children: [displayName]
});

form.setFields([displayName, email]);
form.setActions(Button({ text: "Save", type: "submit" }));
form.validate();
```

`method`, `action`, `target`, `autocomplete`, validation behavior, callbacks, fields, children, actions, variant, and size can be updated.

## Styling

Useful hooks include `[data-af-composition="form"]`, `[data-af-form-body]`, `[data-af-form-actions]`, `[data-af-validation-state]`, `[data-af-variant]`, `[data-af-size]`, and the shared ActionsBar hooks.

## Manual Checks

- Submit button triggers validation.
- Invalid submit announces a useful summary without duplicating each field live region.
- Focus moves to the first invalid field.
- Field error messages remain visible and connected to controls.
- Valid submit calls the valid callback.
- Reset behavior remains native unless customized by application code.
- Layout remains readable on small screens.
