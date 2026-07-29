# Dialog

Dialog provides an accessible modal overlay component.

## Status

Initial component implementation.

## Layers

- Enhancement API: `createDialog(element, options)`
- Composition API: `Dialog(options)`
- Reuses: core `createDialog`, `createFocusTrap`, `createDismissableLayer`, `overlay-stack`

## Behavior

- Adds `role="dialog"` by default.
- Adds `aria-modal="true"` for modal dialogs.
- Requires an accessible name through `aria-labelledby` or `aria-label`.
- Composition API creates a visible title and links it automatically.
- Moves focus inside the dialog on open.
- Keeps Tab and Shift+Tab inside the dialog while modal focus trapping is enabled.
- Restores focus to the trigger on close by default.
- Closes with Escape by default.
- Can close on pointer interaction outside the dialog surface.
- Provides a visible close button in the composition API by default.
- The composition close button can be hidden with `hideCloseButton` for specialized dialogs that provide their own actions.
- Trigger receives `aria-haspopup="dialog"`, `aria-controls`, and `aria-expanded`.

## Composition Example

```ts
Dialog({
    trigger: "Open dialog",
    title: "Settings",
    description: "Change project settings.",
    children: [
        P("Dialog content goes here.")
    ],
    closeText: "Close",
    hideCloseButton: false
});
```

## Manual Checks

* Trigger announces that it opens a dialog.
* Opening moves focus inside the dialog.
* Dialog has a clear accessible name.
* Tab and Shift+Tab do not leave the dialog.
* Escape closes the dialog.
* Close button closes the dialog.
* Focus returns to the trigger after closing.
* Mobile screen reader can open, read, and close the dialog.
