# Button

Button provides accessible action controls with default styling hooks.

## When To Use

Use `Button` for actions, not navigation. For navigation, use `Link`.

Native `<button>` behavior is preferred. Enhancement APIs can also add button semantics and keyboard activation to non-native elements when needed.

## Quick Start

```ts
Button({
    text: "Save",
    variant: "primary",
    hint: "Saves the current draft without publishing.",
    onPress() {
        save();
    }
});
```

Visual and screen reader hint:

```ts
Button({
    text: "Save",
    hint: "Saves the current draft without publishing.",
    hintDisplay: "both"
});
```

Changing-label action with visual state:

```ts
Button({
    text: "Enable option",
    variant: "secondary",
    onPress(_event, button) {
        const selected = button.toggleSelected();

        button.setText(selected ? "Disable option" : "Enable option");
    }
});
```

Stable-label toggle button:

```ts
Button({
    text: "Favorite",
    pressed: false,
    variant: "secondary",
    onPress(_event, button) {
        const pressed = button.getPressed() !== true;

        button.setPressed(pressed);
    }
});
```

Use `pressed` when the visible label stays stable and the button represents an on/off state. Use `selected` when the button only needs visual/action state or when the label itself changes from one action to the next.

Enhance existing HTML:

```ts
const button = createButton(existingButton, {
    variant: "primary",
    onPress() {
        save();
    }
});
```

## Layers

- Enhancement API: `createButton(element, options)`
- Composition API: `Button(options)`
- Reuses: core button behavior, component lifecycle, selected state helper, and shared control hint

## Behavior

- Preserves native button behavior when used with `<button>`.
- Sets `type="button"` by default for native buttons.
- Adds `role="button"` for non-native triggers.
- Routes `Enter` and `Space` activation for non-native triggers through the normal click path.
- Supports disabled state.
- Supports `aria-pressed` for true toggle buttons with stable labels.
- Supports visual selected state through `data-af-selected`.
- Supports optional `hint` through `aria-describedby` and optional visual tooltip.
- Exposes stable data attributes for styling.
- Restores original attributes on `destroy()`.

## Options

- `text` - Simple visible label.
- `children` - Rich content instead of `text`.
- `disabled` - Disables the button.
- `pressed` - Adds `aria-pressed` for true toggle buttons with stable labels.
- `selected` - Adds visual/action state through `data-af-selected`; it is not an ARIA state.
- `hint` - Supporting context for the button.
- `hintId` - Custom id for the generated hint text.
- `hintDisplay` - `"description"`, `"tooltip"`, `"both"`, or `"none"`.
- `hintAnnounceOnHover` - Announces hint text when a mouse pointer enters the button.
- `type` - `"button"`, `"submit"`, or `"reset"`.
- `variant` - `"primary"`, `"secondary"`, `"ghost"`, or `"danger"`.
- `size` - `"md"`.
- `onPress` - Called when the button is activated.
- common composition options from [foundation.md](./foundation.md#common-composition-options).

## Styling

Useful hooks include `[data-af-component="button"]`, `[data-af-variant]`, `[data-af-state]`, and `[data-af-selected="true"]`.

```ts
Button({
    text: "Delete",
    variant: "danger",
    className: "danger-action"
});
```

## Manual Checks

- Tab reaches the button.
- Focus indicator is visible.
- `Enter` activates the button.
- `Space` activates the button.
- Disabled state cannot be activated.
- Stable-label toggle buttons announce pressed state through `aria-pressed`.
- Hint is announced on focus when `hintDisplay` is `"description"` or `"both"`.
- Visual tooltip appears on hover/focus when `hintDisplay` is `"tooltip"` or `"both"`.
- Text contrast is readable in light and dark themes.
- Touch target is comfortable on mobile.

