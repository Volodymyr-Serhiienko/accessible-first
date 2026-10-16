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

* Connects non-native labels with aria-labelledby
* Connects native label elements with for, and uses a fieldset's own legend natively
* Connects descriptions with aria-describedby
* Connects errors with aria-errormessage
* Keeps errors separate from aria-describedby to avoid duplicate error speech
* Supports required state
* Supports disabled state
* Supports read-only state
* Supports invalid, grammar, and spelling states
* Restores borrowed state attributes and releases owned relationships on destroy

## Relationship Ownership

Field relationships merge with current authored IDs instead of replacing the whole
attribute. Field, ControlHint and Tooltip controllers coordinate overlapping IDs;
each update/destroy removes only its contribution, regardless of teardown order.
Later unrelated IDs survive, and deliberately removed authored IDs are not restored.
Native label bindings are released when replaced. An external change to that label's
`for` is preserved if the field has not explicitly rebound it again.

Automatically generated IDs remain stable for the referenced DOM element's lifetime.
They are not exclusive borrowed attributes: deleting one controller must not break
another field's reference to the same help element. Caller-supplied string IDs are
resolved in the control's document and may refer to future markup. Element references
must belong to that document; cross-document references are ignored without mutation.
Native labels work across iframe realms without redundant `aria-labelledby`.

Single-valued state attributes (`required`, `disabled`, `readonly`, `aria-invalid`
and corresponding state ARIA) are still borrowed/restored by this controller; assign
one owner for those states. Do not rewrite IDs or a shared relationship behind an
active controller. Direct writes of unrelated tokens are preserved, but an external
writer claiming the exact same injected token cannot be distinguished from its owner.
Low-level ARIA setters deliberately replace a complete value and do not acquire ownership.

`destroy()` is idempotent; later setters/update are inert. Relationship/label cleanup
finishes even if another cleanup fails, then the first failure is rethrown. Native
field semantics and validation event announcements remain separate responsibilities.

## Principles

* No framework dependency
* Works with native and custom controls
* Accessible relationships are centralized
* Validation semantics are separate from validation logic
* Small foundation for form components
