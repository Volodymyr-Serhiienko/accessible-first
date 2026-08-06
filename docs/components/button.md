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
    onPress() {
        save();
    }
});
```

Toggle-like action with changing label:

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
- Reuses: core button behavior and component lifecycle

## Behavior

- Preserves native button behavior when used with `<button>`.
- Sets `type="button"` by default for native buttons.
- Adds `role="button"` for non-native triggers.
- Routes `Enter` and `Space` activation for non-native triggers through the normal click path.
- Supports disabled state.
- Supports `aria-pressed` for true toggle buttons with stable labels.
- Supports visual selected state through `data-af-selected`.
- Exposes stable data attributes for styling.
- Restores original attributes on `destroy()`.

## Options

- `text` - Simple visible label.
- `children` - Rich content instead of `text`.
- `disabled` - Disables the button.
- `pressed` - Adds `aria-pressed` for true toggle buttons with stable labels.
- `selected` - Adds visual/action state through `data-af-selected`.
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
- Toggle buttons announce pressed state.
- Text contrast is readable in light and dark themes.
- Touch target is comfortable on mobile.
