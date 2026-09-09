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
- Moves focus to the first invalid field by default.
- Runs native reset effects before calling an optional reset callback.
- Uses `announceValidation: "auto"` by default, so invalid submit does not duplicate the focused field speech.
- Announces a custom validation summary when `validationSummaryMessage` is provided, or detailed validation feedback when focus is not moved.
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
- `announceValidation` - Controls aggregate validation live-region feedback. Defaults to `"auto"`. Use `false` to keep the form silent, `true` to force aggregate announcements, or `"auto"` to avoid duplicate speech when focus moves to the first invalid field.
- `announceSuccess` - Announces success after valid submit. Defaults to `false`. Provide `successMessage` when enabling this.
- `successMessage` - Success announcement message. No framework-authored success text is announced when this is omitted.
- `validationSummaryMessage` - Optional localized summary builder for invalid submit announcements. In `"auto"` mode this is the only form-level message announced when focus also moves to the first invalid field.
- `clearValidationOnReset` - Clears validation state on native reset. Defaults to `true`.
- `focusFirstOnReset` - Moves focus to the first registered field after reset. Defaults to `true`.
- `variant` - `"default"` or `"plain"`.
- `size` - `"md"`.
- `onValidate` - Called after validation.
- `onSubmit` - Called after submit handling.
- `onValidSubmit` - Called when submit validation passes.
- `onInvalidSubmit` - Called when submit validation fails.
- `onReset` - Called after native reset effects, validation cleanup, and optional focus restoration finish. Use it for an application-owned localized reset result.
- `actionsOptions` - Common DOM options for the actions slot.
- common composition options from [foundation.md](./foundation.md#common-composition-options).

## Speech And Validation

`Form` owns aggregate validation coordination, but it does not always speak.

Registered fields are validated with `announce: false`, so invalid submit does not produce both field-level live messages and field focus speech. With the default `announceValidation: "auto"`, the form stays silent when it also moves focus to the first invalid field. The focused field then provides the detailed label, state, description, and error context.

Use `validationSummaryMessage` when an application needs a short localized submit result such as "Check the highlighted fields." In `"auto"` mode that short summary may be announced before focus moves, while detailed errors still belong to the fields themselves.

Use `announceValidation: true` only when the workflow deliberately needs aggregate speech even though focus may move. Use `announceValidation: false` when a page-level `StatusMessage`, toast, or custom announcer owns the submit result.

`Form` does not invent reset copy. Use `onReset` when the application should
announce a concise localized outcome such as "Profile form cleared." The
callback runs after validation cleanup and optional first-field focus
restoration, so it describes completed state rather than a pending reset.

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
- Invalid submit does not duplicate field errors through both form and field live regions.
- Focus moves to the first invalid field.
- Field error messages remain visible and connected to controls.
- Valid submit calls the valid callback.
- Reset clears validation state, restores focus according to `focusFirstOnReset`, and invokes `onReset` once after those effects finish.
- Layout remains readable on small screens.
