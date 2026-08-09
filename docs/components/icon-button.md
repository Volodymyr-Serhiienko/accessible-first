# IconButton

IconButton is an icon-only action component with accessible-name protection, default tooltip behavior, and optional selected or pressed state.

## When To Use

Use `IconButton` for compact actions where the visual icon is enough for sighted users, but assistive technologies still need a meaningful name.

For actions with visible text, prefer `Button`.

## Quick Start

```ts
IconButton({
    label: "Save",
    hint: "Saves the current draft.",
    hintDisplay: "both",
    icon: Icon({
        path: "M5 3h12l2 2v16H5V3Z"
    }),
    onPress() {
        save();
    }
});
```

Dynamic action with changing label and icon:

```ts
IconButton({
    label: "Add to favorites",
    icon: favoriteIcon(false),
    onPress(_event, button) {
        const selected = button.toggleSelected();
        const label = selected ? "Remove from favorites" : "Add to favorites";

        button.update({
            label,
            icon: favoriteIcon(selected)
        });
    }
});
```

Enhance existing HTML:

```ts
const button = createIconButton(existingButton, {
    label: "Save",
    variant: "secondary"
});
```

## Layers

- Enhancement API: `createIconButton(element, options)`
- Composition API: `IconButton(options)`
- Reuses: core button behavior, selected state, shared control hint, tooltip, hover announcement, and component lifecycle

## Behavior

- Uses native button behavior when attached to a `<button>`.
- Adds `role="button"` and keyboard activation when attached to a non-button element.
- Supports `aria-label` through `label`.
- Supports `aria-labelledby` through `labelledBy`.
- Supports `aria-pressed` for true toggle icon buttons with stable labels.
- Uses at least a 44 by 44 CSS pixel target by default.
- Shows a visible focus indicator.
- Shows a visual tooltip by default when `label` is provided.
- Announces tooltip or label on mouse hover by default.
- Supports the same `hint` and `hintDisplay` model as Button and Link.
- Falls back to `aria-label="Icon button"` and `data-af-warning="missing-accessible-name"` when no accessible name is provided.

## Options

- `label` - Accessible name for icon-only buttons.
- `labelledBy` - References visible text by id instead of `label`.
- `icon` - Icon content.
- `children` - Rich content instead of `icon`.
- `title` - Native title attribute. Avoid unless specifically needed.
- `hint` - Supporting context for the icon button.
- `hintId` - Custom id for the generated hint text.
- `hintDisplay` - `"description"`, `"tooltip"`, `"both"`, or `"none"`.
- `hintAnnounceOnHover` - Announces hint text when a mouse pointer enters the icon button.
- `tooltip` - Backward-compatible visual hint alias. Defaults to `label`; use `null` to disable the default label tooltip.
- `announceOnHover` - Backward-compatible alias for `hintAnnounceOnHover`.
- `selected` - Adds visual/action state through `data-af-selected`.
- `pressed` - Adds `aria-pressed` for true toggle icon buttons with stable labels.
- `disabled` - Disables the button.
- `type` - `"button"`, `"submit"`, or `"reset"`.
- `variant` - `"primary"`, `"secondary"`, `"ghost"`, or `"danger"`.
- `size` - `"md"`.
- `onPress` - Called when activated.
- common composition options from [foundation.md](./foundation.md#common-composition-options).

## Styling

Useful hooks include `[data-af-component="icon-button"]`, `[data-af-tooltip]`, `[data-af-selected="true"]`, `[aria-pressed]`, `[data-af-variant]`, and `[data-af-state]`.

```ts
IconButton({
    label: "Save",
    icon: saveIcon,
    className: "toolbar-save"
});
```

## Manual Checks

- Tab reaches the button.
- Focus indicator is visible.
- Disabled buttons cannot be activated.
- Toggle buttons expose pressed state where used.
- Screen readers announce a meaningful name and button role.
- Default label tooltip remains readable in light and dark themes.
- Hint is announced on focus when `hintDisplay` is `"description"` or `"both"`.
- Visual tooltip appears on hover/focus when `hintDisplay` is `"tooltip"` or `"both"`.
- Touch target is at least 44 by 44 CSS pixels.
