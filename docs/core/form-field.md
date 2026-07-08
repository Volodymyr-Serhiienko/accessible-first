# Form Field Module

## Purpose

The Form Field module manages accessible relationships and state for form controls.

It is used by inputs, textareas, selects, custom controls, form fields, validation messages, and higher-level form components.

## Public API

### createFormField()

Creates accessible form field semantics for a control.

```ts
const field = createFormField(input, {
    label,
    description,
    errorMessage,
    required: true,
    invalid: false
});

field.setInvalid(true);
field.setErrorMessage(error);
field.destroy();
```

---

## Behavior

* Connects labels with aria-labelledby
* Connects native label elements with for
* Connects descriptions with aria-describedby
* Connects errors with aria-errormessage
* Includes error messages in aria-describedby
* Supports required state
* Supports disabled state
* Supports read-only state
* Supports invalid, grammar, and spelling states
* Preserves and restores original attributes on destroy

## Principles

* No framework dependency
* Works with native and custom controls
* Accessible relationships are centralized
* Validation semantics are separate from validation logic
* Small foundation for form components
