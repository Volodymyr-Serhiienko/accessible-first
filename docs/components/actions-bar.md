# ActionsBar

ActionsBar provides a consistent layout for related page, form, section, dialog, and card actions.

It is a structure component, not a toolbar. Use `Toolbar` for dense tool controls with toolbar semantics. Use `ActionsBar` for command buttons such as save, cancel, reset, delete, continue, or review.

## When To Use

Use `ActionsBar` when a UI area has one or more related actions and you want predictable alignment, wrapping, and mobile behavior.

Common places:

- form section actions;
- dialog footer actions;
- settings page actions;
- card or panel actions;
- page-level primary and secondary commands.

## Quick Start

Minimal actions:

```ts
ActionsBar({
    label: "Profile actions",
    primary: Button({ text: "Save profile", variant: "primary" }),
    secondary: Button({ text: "Cancel", variant: "secondary" })
});
```

Right-aligned actions:

```ts
ActionsBar({
    align: "end",
    primary: [
        Button({ text: "Cancel", variant: "secondary" }),
        Button({ text: "Save", variant: "primary" })
    ]
});
```

Separated primary and secondary actions:

```ts
ActionsBar({
    align: "between",
    secondary: Button({ text: "Reset" }),
    primary: Button({ text: "Continue", variant: "primary" })
});
```

Labelled by visible text:

```ts
ActionsBar({
    labelledBy: "profile-actions-heading",
    primary: Button({ text: "Save", variant: "primary" })
});
```

## Layers

- Composition API: `ActionsBar(options)`
- Reuses: native `<div>`, optional `role="group"`, composition slots

## Behavior

- Groups related actions visually.
- Adds `role="group"` with `aria-label` when `label` is provided, or with `aria-labelledby` when `labelledBy` is provided.
- Keeps secondary and primary actions in separate slots.
- Supports start, end, between, and stretch alignment.
- Wraps actions on small screens.
- Can be reused internally by components such as `Dialog` and `AlertDialog` for consistent action layout.
- Does not add keyboard behavior because native controls own their interactions.
- Does not use live regions or forced announcements; actions speak through their own button or link labels.
- Exposes stable data attributes for styling.

## Options

- `label` - Optional accessible group label.
- `labelledBy` - Optional id of visible text that labels the action group. Prefer this when a nearby heading already names the group.
- `primary` - Main action or actions.
- `secondary` - Secondary action or actions.
- `children` - Convenience content when separate slots are not needed.
- `align` - `"start"`, `"end"`, `"between"`, or `"stretch"`. Defaults to `"end"`.
- `variant` - `"default"` or `"plain"`.
- `size` - `"md"`.
- `primaryOptions` - Common DOM options for the primary slot.
- `secondaryOptions` - Common DOM options for the secondary slot.
- common composition options from [foundation.md](./foundation.md#common-composition-options).

## Update Notes

```ts
const actions = ActionsBar({
    label: "Account actions",
    primary: Button({ text: "Save", variant: "primary" })
});

actions.setSecondary(Button({ text: "Cancel", variant: "secondary" }));
actions.update({
    align: "between"
});
```

## Styling

Useful hooks include `[data-af-composition="actions-bar"]`, `[data-af-actions-bar-secondary]`, `[data-af-actions-bar-primary]`, `[data-af-align]`, `[data-af-variant]`, and `[data-af-size]`.

```ts
ActionsBar({
    className: "profile-actions",
    primary: Button({ text: "Save", variant: "primary" })
});
```

## Manual Checks

- Buttons or links remain reachable in logical order.
- Visible order matches expected action priority.
- Group label is useful when the actions need extra context.
- `label` and `labelledBy` are not both needed; visible headings should usually use `labelledBy`.
- Actions wrap cleanly on small screens.
- Touch targets remain comfortable on mobile.
- Text contrast is readable in light and dark themes.
