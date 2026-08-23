# SettingsGroup

SettingsGroup is a semantic page-building component for application settings, preferences, account screens, and configuration panels.

It is intentionally close to FormSection, but its purpose is broader: FormSection describes a section inside a form, while SettingsGroup describes a meaningful group of settings on an application screen. It can contain switches, selects, text fields, custom content, and optional actions.

## Quick Start

```ts
SettingsGroup({
    title: "Learning preferences",
    description: "Choose how practice sessions should behave.",
    children: [
        Switch({
            label: "Reduce motion",
            description: "Use fewer animations in the interface."
        }),
        Select({
            label: "Daily goal",
            items: [
                { value: "10", label: "10 words" },
                { value: "20", label: "20 words" },
                { value: "30", label: "30 words" }
            ]
        })
    ]
});
```

## Behavior

- Uses a labelled `section` internally.
- Connects the group title with `aria-labelledby`.
- Keeps the optional description as visible content by default, without forcing it through `aria-describedby`.
- Supports `descriptionMode: "aria"` when the section itself should be described by the visible description.
- Keeps settings controls as native, reachable elements inside the group.
- Does not use live regions or forced announcements; controls announce their own labels, descriptions, and validation state.
- Reuses the existing form-section foundation instead of duplicating accessibility logic.
- Reuses the existing actions layout through FormSection and ActionsBar.

## Options

- `title` - required group title.
- `description` - optional explanatory content.
- `children` - settings controls or any composed content.
- `actions` - optional action buttons, usually save/reset/apply actions.
- `descriptionMode` - `"content"` or `"aria"`. Defaults to `"content"`, which avoids repeated description speech while keeping the text visible.
- `headingLevel` - heading level for the group title. Defaults to `3`.
- `variant` - `default` or `plain`. Defaults to `default`.
- `size` - currently `md`.
- `headingOptions`, `descriptionOptions`, `bodyOptions`, `actionsOptions` - advanced DOM options for inner parts.
- Base options: `id`, `className`, `attributes`.

## Styling

SettingsGroup has accessible default styling and can be customized through:

- `className`
- `attributes`
- CSS custom properties
- part-specific options such as `bodyOptions` and `actionsOptions`

Use `variant: "plain"` when the surrounding page already provides the visual container.

## Description Speech

Use the default `descriptionMode: "content"` for most settings screens. The description remains visible and readable in normal document navigation, but it is not attached to the section as an automatic spoken description. This keeps focus movement between controls quieter.

Use `descriptionMode: "aria"` only when the whole settings group needs to be announced with its description as a named section.

## Accessibility Notes

Use SettingsGroup when settings belong together conceptually. Avoid putting unrelated controls into one group just because they appear on the same page.

When actions are required to save changes, make them explicit with clear button labels. When settings apply immediately, prefer controls such as Switch without extra save actions.
