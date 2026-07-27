# Button Component

## Purpose

The Button component provides accessible button behavior and default styling hooks.

Native `button` elements are preferred. Non-native elements receive button semantics and keyboard activation.

## Public API

```ts
const button = createButton(element, {
    variant: "primary",
    onPress: () => {
        console.log("Pressed");
    }
});

button.setDisabled(true);
button.destroy();
```

---

## Behavior

* Preserves native button behavior when used with <button>
* Sets type="button" by default for native buttons
* Adds role="button" for non-native triggers
* Routes Enter and Space activation for non-native triggers through the normal click path
* Supports disabled state
* Supports toggle button state with aria-pressed
* Exposes stable data attributes for styling
* Restores original attributes on destroy

## Manual Testing

### Desktop:

* Tab reaches the button
* Focus indicator is clearly visible
* Enter activates the button
* Space activates the button
* Disabled state cannot be activated
* Text contrast is readable in light and dark themes

### Mobile:

* Tap activates the button
* Target size is comfortable
* Disabled state cannot be activated
* Screen reader announces the accessible name and button role
* Toggle buttons announce pressed state
