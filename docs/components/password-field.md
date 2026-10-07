# PasswordField

`PasswordField` composes `TextField` and `IconButton`. It retains native forms,
validation, autocomplete and mobile keyboard behavior, and starts masked.

```ts
const password = PasswordField({
    label: "Password",
    name: "password",
    autocomplete: "current-password",
    required: true,
    locale
});
```

Use `autocomplete: "new-password"` for registration and confirmation fields.
Options and validation methods match [TextField](./text-field.md), except that
the component owns `type` and does not accept `multiline`. `visibilityLabel`
overrides the localized `passwordField.visibilityLabel` fallback.

The right-side native button has a stable name ("Show password"), `aria-pressed`
for visible/hidden state and `aria-controls` pointing to its input. Tab, Enter,
Space and touch use native button behavior. Activation keeps focus on the button,
preserves the value/selection, and never submits the form. Moving from the input
to its reveal button does not trigger blur validation. Screen-reader character
echo is controlled by the reader's settings; revealing makes the input ordinary
text but does not force speech or announce the password through a live region.

`visibilityButton`, `isPasswordVisible()` and `setPasswordVisible(boolean)` expose
the visibility state. `update()` accepts field options, `locale` and
`visibilityLabel`. Disabled/read-only fields disable reveal and restore masking;
clearing the value and `destroy()` also restore masking. `destroy()` releases
the button and locale subscription. Visibility is ephemeral: do not persist it
or log/store the password. Showing a password can expose it to nearby people.

Styles reuse TextField width and validation layout. `data-af-password-field` and
`data-af-password-visibility` provide hooks; the button retains a 44px target,
including on narrow screens and RTL layouts. Lucide notices are recorded in
[THIRD_PARTY_NOTICES.md](../../THIRD_PARTY_NOTICES.md).

Manual checks: keyboard activation, focus visibility, touch, screen-reader pressed
state and editable-text reading, autofill, repeat-password validation and RTL.
