# AccountControl

An application-owned account action presented as a text button or a profile icon.
It composes `Button`, `Icon`, control hints and the locale provider. Authentication,
navigation, permissions, HTTP requests and storage remain outside the component.

## Quick Start

```ts
const account = AccountControl({
    display: "button",
    signedIn: false,
    onSignIn: () => openLogin(),
    onSignOut: () => requestLogout()
});

// Update only after the application's server confirms the operation.
account.update({ signedIn: true, pending: false });
```

For a shared session store, supply `source: { getState, subscribe }`. Its state is
`{ signedIn, pending }`, and `subscribe(listener)` must return an unsubscribe function.
Source state takes precedence over the direct `signedIn`/`pending` options.

In `AppHeader`, opt in with `account: { source, onSignIn, onSignOut }`. The generated
action follows the theme toggle and moves with the same HeaderTools control set.
Omitting `account` leaves existing headers unchanged.

## Options And Controller

- `display`: `"button"` (default) or `"icon"`.
- `signedIn`, `pending`: direct UI state, both false by default.
- `source`: optional external state source; use null to detach it.
- `signInLabel`, `signOutLabel`, `accountLabel`: action labels and the account tooltip.
- `locale`: fallback text provider for `accountControl.signInLabel`,
  `accountControl.signOutLabel`, `accountControl.accountLabel`.
- `onSignIn`, `onSignOut`: receive the native event and composed control.
- Native button/base options include `disabled`, `variant`, `id`, attributes and hints.
  The default variant is ghost; pending also disables the button.
- `getState()`, `update(partialOptions)`, `destroy()` and the underlying `button`.

## Behavior And Accessibility

The component does not optimistically change sign-in state, announce success or
handle errors. The application confirms actions and provides visible feedback.
This is a native action button, not a switch or an `aria-pressed` authentication flag.
Enter/Space activate it using normal button behavior. Pending sets `aria-busy` and
blocks repeated activation without changing the action label.

The icon variant has the current action as its accessible name. Both variants keep
the account description in `aria-describedby`, so screen readers can read it on
focus. By default, the visual tooltip appears only on mouse hover, not focus
(`hintDisplay: "both"`, `hintShowOnFocus: false`, `hintAnnounceOnHover: false`).
Applications can override these native Button hint options; hover does not add a
separate live announcement by default.
Text mode reserves space for both labels. State and display changes update the same
button element. Locale/source subscriptions are removed on replacement or destroy.

UI state is not authorization: protected application operations must still be checked
on the server. A failed request must not be treated as a successful sign-out.

## Styling And Manual Checks

Use `data-af-account-control`, `data-af-account-control-display` and
`data-af-account-control-signed-in`; native Button styles remain the visual base.
The icon uses the shared target size, and action text stays on one line.

- Check Enter/Space, pending/retry and both confirmed session states.
- Verify stable label width, the icon's accessible name and a short account tooltip.
- Check responsive HeaderTools ordering after the theme control.
- Verify errors are visible/announced once and learner content is not restarted on logout.
