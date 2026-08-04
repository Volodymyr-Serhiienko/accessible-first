# AlertDialog

AlertDialog provides a stricter dialog preset for important confirmations and destructive actions.

## Status

Initial component implementation.

## Layers

- Composition API: `AlertDialog(options)`
- Reuses: `Dialog`, `Button`
- Built on top of dialog focus trapping, dismissable layer behavior, overlay stack, and scroll lock

## Behavior

- Uses `role="alertdialog"`.
- Requires a visible `title`.
- Requires a short `description`.
- Connects the title with `aria-labelledby`.
- Connects the description with `aria-describedby`.
- Moves focus inside the alert dialog on open.
- Focuses the cancel action by default as the safer action.
- Falls back to the confirm action if the cancel action is disabled.
- Keeps Tab and Shift+Tab inside the alert dialog while modal focus trapping is enabled.
- Locks page scrolling behind the alert dialog by default.
- Does not close on outside pointer interaction by default.
- Closes with Escape by default.
- Confirm and cancel actions close the alert dialog unless their handler calls `event.preventDefault()`.
- Restores focus to the trigger on close by default.

## Composition Example

```ts
AlertDialog({
    trigger: "Delete project",
    title: "Delete project?",
    description: "This action cannot be undone.",
    confirmText: "Delete project",
    cancelText: "Cancel",
    onConfirm() {
        deleteProject();
    }
});
```

## Options

- `trigger` - Required trigger content.
- `title` - Required visible alert dialog title.
- `description` - Required short description connected with `aria-describedby`.
- `confirmText` - Confirm button text. Defaults to `"Confirm"`.
- `cancelText` - Cancel button text. Defaults to `"Cancel"`.
- `confirmVariant` - Confirm button variant. Defaults to `"danger"`.
- `cancelVariant` - Cancel button variant. Defaults to `"secondary"`.
- `confirmSize` - Confirm button size token.
- `cancelSize` - Cancel button size token.
- `confirmDisabled` - Disables the confirm action.
- `cancelDisabled` - Disables the cancel action.
- `focusTarget` - `"cancel"` or `"confirm"`. Defaults to `"cancel"`.
- `onConfirm` - Called when the confirm action is activated.
- `onCancel` - Called when the cancel action is activated.
- `onOpenChange` - Called when the alert dialog opens or closes.
- `children` - Optional supporting content.
- `open` - Controlled open state.
- `defaultOpen` - Opens initially.
- `modal` - Enables modal semantics.
- `lockScroll` - Locks page scrolling while open. Defaults to `modal`.
- `trapFocus` - Keeps Tab navigation inside the alert dialog.
- `closeOnEscape` - Allows Escape to close the alert dialog.
- `restoreFocus` - Restores focus to the opener on close.
- `dismissOnPointerDownOutside` - Allows outside pointer dismissal when explicitly set to `true`.
- `id`, `className`, `attributes` - Common DOM options.

## Manual Checks

* Trigger announces that it opens a dialog.
* Opening announces the alert dialog title and description.
* Initial focus lands on the cancel action by default.
* Confirm action is visually distinct for destructive flows.
* Tab and Shift+Tab do not leave the alert dialog.
* Page behind the alert dialog does not scroll while open.
* Outside pointer interaction does not close it by default.
* Escape closes it unless disabled.
* Confirm and cancel actions close it by default.
* Focus returns to the trigger after closing.
* Mobile screen reader can open, understand, and close the alert dialog.
