# ThemeToggle

ThemeToggle creates a ready-to-use control for switching between light and dark page themes.

It is intended for headers, application shells, settings panels, and playground/demo pages where theme switching should be accessible and consistent.

## When To Use

Use `ThemeToggle` when the page already uses Accessible First theme tokens and should let users switch the active color scheme.

Use lower-level theme helpers when an application needs a custom settings UI, a persisted profile preference, or a multi-option theme selector.

## Quick Start

Button display, which is the default:

```ts
ThemeToggle({
    variant: "secondary"
});
```

Compact switch display for dense headers:

```ts
ThemeToggle({
    display: "switch",
    variant: "secondary"
});
```

Inside a header:

```ts
Row(
    Brand({ name: "Accessible First" }),
    ThemeToggle({ display: "switch", variant: "secondary" })
);
```

## Layers

- Composition API: `ThemeToggle(options)`
- Reuses: `Button`, page theme tokens, `data-af-theme`, shared control hints, and optional live-region announcements

## Behavior

- Reads the current resolved theme from `document.documentElement`.
- In `display: "button"`, shows an action label: `"Dark theme"` in light mode and `"Light theme"` in dark mode.
- In `display: "switch"`, exposes a stable switch label and `aria-checked`, while the visual control shows sun/moon icons.
- Applies dark theme with `data-af-theme="dark"`.
- Applies light theme by removing `data-af-theme`, matching the framework's existing token strategy.
- Keeps its visual selected state synchronized with the active dark theme in button display.
- Observes external `data-af-theme` changes, including system-theme synchronization from `createPage({ theme: "system" })`.
- Announces theme changes by default.
- Switch display shows and announces a tooltip by default using the current action label.

## Options

- `target` - Theme target element. Defaults to `document.documentElement`.
- `display` - `"button"` or `"switch"`. Defaults to `"button"`.
- `toDarkLabel` - Button text or switch tooltip while the current theme is light. Defaults to `"Dark theme"`.
- `toLightLabel` - Button text or switch tooltip while the current theme is dark. Defaults to `"Light theme"`.
- `switchLabel` - Stable accessible label for switch display. Defaults to localized `"Dark theme"`.
- `selectedTheme` - Theme that marks the button visually selected. Defaults to `"dark"`. Use `null` to disable selected styling. Used by button display.
- `announcement` - `true`, `false`, fixed text, or a function. Defaults to `true`.
- `announcementPoliteness` - `"polite"` or `"assertive"`. Defaults to `"polite"`.
- `onThemeChange` - Called after the toggle changes the theme.
- common button options from [button.md](./button.md).
- common composition options from [foundation.md](./foundation.md#common-composition-options).

## Manual Checks

- Initial text or switch state matches the already applied theme.
- Initial selected state matches the already applied theme in button display.
- Button and switch displays toggle between light and dark themes.
- Screen reader users hear the changed theme.
- Switch display exposes `role="switch"` and `aria-checked`.
- Switch display shows a tooltip on pointer hover and announces that hint when hover announcements are enabled.
- The control updates if the page theme changes externally.