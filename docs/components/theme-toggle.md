# ThemeToggle

ThemeToggle creates a ready-to-use button for switching between light and dark page themes.

It is intended for headers, application shells, settings panels, and playground/demo pages where theme switching should be accessible and consistent.

## When To Use

Use `ThemeToggle` when the page already uses Accessible First theme tokens and should let users switch the active color scheme.

Use lower-level theme helpers when an application needs a custom settings UI, a persisted profile preference, or a multi-option theme selector.

## Quick Start

```ts
ThemeToggle({
    variant: "secondary"
});
```

Inside a header:

```ts
Row(
    Brand({ name: "Accessible First" }),
    ThemeToggle({ variant: "secondary" })
);
```

## Layers

- Composition API: `ThemeToggle(options)`
- Reuses: `Button`, page theme tokens, `data-af-theme`, and optional live-region announcements

## Behavior

- Reads the current resolved theme from `document.documentElement`.
- Shows an action label: `"Dark theme"` in light mode and `"Light theme"` in dark mode.
- Applies dark theme with `data-af-theme="dark"`.
- Applies light theme by removing `data-af-theme`, matching the framework's existing token strategy.
- Keeps its visual selected state synchronized with the active dark theme.
- Observes external `data-af-theme` changes, including system-theme synchronization from `createPage({ theme: "system" })`.
- Announces theme changes by default.

## Options

- `target` - Theme target element. Defaults to `document.documentElement`.
- `toDarkLabel` - Button text while the current theme is light. Defaults to `"Dark theme"`.
- `toLightLabel` - Button text while the current theme is dark. Defaults to `"Light theme"`.
- `selectedTheme` - Theme that marks the button visually selected. Defaults to `"dark"`. Use `null` to disable selected styling.
- `announcement` - `true`, `false`, fixed text, or a function. Defaults to `true`.
- `announcementPoliteness` - `"polite"` or `"assertive"`. Defaults to `"polite"`.
- `onThemeChange` - Called after the toggle changes the theme.
- common button options from [button.md](./button.md).
- common composition options from [foundation.md](./foundation.md#common-composition-options).

## Manual Checks

- Initial text matches the already applied theme.
- Initial selected state matches the already applied theme.
- Button toggles between light and dark themes.
- Screen reader users hear the changed theme.
- The button updates if the page theme changes externally.
