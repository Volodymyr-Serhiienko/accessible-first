# Icon Button

Icon Button is an icon-only action component with built-in keyboard behavior, disabled state, pressed state, and accessible-name protection.

## When To Use

Use Icon Button for compact actions where the visual icon is enough for sighted users, but the control still needs a meaningful accessible name for assistive technologies.

## Accessibility

- Uses native `button` behavior when attached to a `<button>`.
- Adds `role="button"` and keyboard activation when attached to a non-button element.
- Supports `Enter` and `Space` activation for non-native buttons.
- Supports `aria-label` through `label`.
- Supports `aria-labelledby` through `labelledBy`.
- Supports `aria-pressed` for toggle icon buttons.
- Uses at least a 44 by 44 CSS pixel target by default.
- Shows a visible focus indicator through `:focus-visible`.
- Falls back to `aria-label="Icon button"` and `data-af-warning="missing-accessible-name"` when no accessible name is provided.

## Example

```ts
import { createIconButton } from "@accessible-first/components";

const button = createIconButton(document.querySelector("[data-save]")!, {
    label: "Save",
    variant: "secondary",
    onPress() {
        saveDocument();
    }
});
```

## Toggle Example

```ts
const button = createIconButton(document.querySelector("[data-favorite]")!, {
    label: "Add to favorites",
    pressed: false,
    onPress() {
        const nextPressed = button.getPressed() !== true;
        button.setPressed(nextPressed);
        button.setLabel(nextPressed ? "Remove from favorites" : "Add to favorites");
    }
});
```

---

## Manual Checks

### Desktop:

* The button receives focus with Tab.
* The focus indicator is clearly visible.
* Enter activates non-native icon buttons.
* Space activates non-native icon buttons.
* Disabled buttons cannot be activated.
* Toggle buttons expose aria-pressed.
* Screen readers announce a meaningful name and button role.

### Mobile:

* The touch target is at least 44 by 44 CSS pixels.
* The button can be activated by touch.
* Screen readers announce the name, role, and pressed state where applicable.

---

## Notes

A generic fallback label prevents a completely nameless control, but production icon buttons should always provide a meaningful label or labelledBy.
