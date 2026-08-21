# FormSection

FormSection provides a semantic section for larger forms, settings screens, and profile pages.

It is a structure component, not a validation engine. Individual fields validate themselves, while `Form` collects registered field validation results for submit and reset workflows.

## When To Use

Use `FormSection` when a form has several meaningful areas, such as account details, notification settings, billing information, or security options.

Use `FieldGroup` inside a form section when several controls answer one grouped question.

Use `Form` around one or more form sections when submit, reset, validation summaries, first-invalid focus, and validation announcements should be handled as one workflow.

## Quick Start

Minimal section:

```ts
FormSection({
    title: "Account details",
    children: [
        TextField({ label: "Display name" }),
        TextField({ label: "Email", type: "email" })
    ]
});
```

With description and actions:

```ts
FormSection({
    title: "Notification settings",
    description: "Choose how the app should contact you.",
    actions: [
        Button({ text: "Save settings", variant: "primary" })
    ],
    children: [
        FieldGroup({
            label: "Channels",
            children: [
                Checkbox({ label: "Email" }),
                Checkbox({ label: "SMS" })
            ]
        })
    ]
});
```

Inside a validating form:

```ts
Form({
    children: ({ field }) => FormSection({
        title: "Profile",
        description: "These fields are validated on submit.",
        children: [
            field(TextField({
                label: "Display name",
                required: true
            })),
            field(TextField({
                label: "Email",
                type: "email"
            }))
        ]
    }),
    actions: Button({
        text: "Save profile",
        type: "submit",
        variant: "primary"
    })
});
```

## Layers

- Composition API: `FormSection(options)`
- Reuses: native `<section>`, heading, description slot, body slot, `ActionsBar`

## Behavior

- Creates a native section labelled by its heading.
- Connects an optional visible description with `aria-describedby`.
- Keeps body content and section actions in separate areas.
- Uses `ActionsBar` for section action layout.
- Does not submit forms, trap focus, or collect validation results by itself.
- Exposes stable data attributes for styling.

## Options

- `title` - Required visible section heading content.
- `description` - Optional supporting content connected to the section.
- `children` - Fields, field groups, or composed nodes inside the section body.
- `actions` - Optional section actions, usually buttons. They are rendered through the `ActionsBar` primary slot.
- `headingLevel` - Heading level from `2` to `6`. Defaults to `3`. Creation-time option.
- `variant` - `"default"` or `"plain"`.
- `size` - `"md"`.
- `headingOptions` - Common DOM options for the heading.
- `descriptionOptions` - Common DOM options for the description slot.
- `bodyOptions` - Common DOM options for the body slot.
- `actionsOptions` - Common DOM options for the actions slot.
- common composition options from [foundation.md](./foundation.md#common-composition-options).

## Update Notes

```ts
const section = FormSection({
    title: "Profile",
    children: [
        TextField({ label: "Display name" })
    ]
});

section.setTitleContent("Public profile");
section.setDescription("This information appears on your public page.");
section.setActions(Button({ text: "Save profile", variant: "primary" }));
```

`headingLevel` is creation-time only. Create a new section if the document outline changes.

## Validation Actions

`FormSection` does not collect or submit validation results by itself. For application forms, prefer wrapping sections in `Form` and registering fields through the `Form` children callback or the `fields` option. This lets the form validate all registered fields, announce validation results, move focus to the first invalid field, and reset validation state consistently.

```ts
Form({
    children: ({ field }) => [
        FormSection({
            title: "Account",
            children: [
                field(TextField({
                    label: "Display name",
                    required: true,
                    validationMessages: {
                        valueMissing: "Enter a display name."
                    }
                })),
                field(TextField({
                    label: "Public email",
                    type: "email",
                    placeholder: "name@example.com"
                }))
            ]
        })
    ],
    actions: [
        Button({ text: "Save profile", type: "submit", variant: "primary" }),
        Button({ text: "Reset", type: "reset", variant: "secondary" })
    ]
});
```

For small non-form settings panels, a section action may still call an individual field's `validate()` method directly, but this should stay local and intentional.

## Styling

Useful hooks include `[data-af-composition="form-section"]`, `[data-af-form-section-header]`, `[data-af-form-section-heading]`, `[data-af-form-section-description]`, `[data-af-form-section-body]`, `[data-af-form-section-actions]`, `[data-af-variant]`, `[data-af-size]`, and the shared ActionsBar hooks `[data-af-composition="actions-bar"]`, `[data-af-actions-bar-secondary]`, and `[data-af-actions-bar-primary]`.

```ts
FormSection({
    title: "Security",
    className: "security-section"
});
```

## Manual Checks

- The section heading is visible and has the correct document level.
- Screen readers can understand the section name from the heading.
- Description is announced when supported by the browser and screen reader pair.
- Actions are reachable after the section content.
- Fields and field groups inside the body keep their own labels, descriptions, errors, and validation behavior.
- When wrapped in `Form`, submit validates registered fields and focuses the first invalid field.
- Layout remains readable on small screens.
