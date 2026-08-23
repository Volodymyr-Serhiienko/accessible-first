# AlertDialog

AlertDialog is a stricter dialog preset for important confirmations and destructive actions.

## When To Use

Use `AlertDialog` when the user must make a deliberate decision before continuing, especially for destructive actions.

Use `Dialog` for ordinary modal workflows.

## Quick Start

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

## Layers

- Composition API: `AlertDialog(options)`
- Reuses: `Dialog`, `Button`, `ActionsBar` through `Dialog`
- Built on dialog focus trapping, dismissable layer behavior, overlay stack, and scroll lock

## Behavior

- Uses `role="alertdialog"`.
- Requires a visible `title`.
- Requires a short `description`.
- Connects the title with `aria-labelledby`.
- Connects the description with `aria-describedby`.
- Does not use live-region announcements; opening speech comes from focus, the alert dialog title, and the required programmatic description.
- Moves focus inside the alert dialog on open.
- Focuses the cancel action by default as the safer action.
- Falls back to the confirm action if the cancel action is disabled.
- Keeps `Tab` and `Shift+Tab` inside while modal focus trapping is enabled.
- Locks page scrolling behind the alert dialog by default.
- Does not close on outside pointer interaction by default.
- Closes with `Escape` by default.
- Confirm and cancel actions close the alert dialog unless their handler calls `event.preventDefault()`.
- Restores focus to the trigger on close by default.

## Options

- `trigger` - Required trigger content.
- `title` - Required visible alert dialog title.
- `description` - Required short description connected with `aria-describedby`.
- `confirmText` - Confirm button text. Provide localized text for application UI; a generic fallback is used when omitted.
- `cancelText` - Cancel button text. Provide localized text for application UI; a generic fallback is used when omitted.
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
- `trapFocus` - Keeps tab navigation inside the alert dialog.
- `closeOnEscape` - Allows `Escape` to close the alert dialog.
- `restoreFocus` - Restores focus to the opener on close.
- `dismissOnPointerDownOutside` - Allows outside pointer dismissal when explicitly set to `true`.
- common composition options from [foundation.md](./foundation.md#common-composition-options).

## Focus And Decision Safety

AlertDialog is the safest pattern when the user must make a decision before continuing. It moves focus directly to an action, traps keyboard navigation while open, and keeps the decision visible until the user cancels, confirms, or dismisses it with an allowed keyboard command.

The default focus target is the cancel action. This avoids placing keyboard and screen reader users on a destructive confirmation by default. Use `focusTarget: "confirm"` only for harmless or strongly expected confirmations.

The required `description` should be short and specific. It is connected with `aria-describedby` so assistive technology can announce the consequence before the user chooses an action.

## Update Notes

`alertDialog.update()` accepts runtime content, visual, and decision options such as `open`, `title`, `description`, `children`, `confirmText`, `cancelText`, button variants and disabled states, `focusTarget`, `modal`, `lockScroll`, and `closeOnEscape`.

Creation-time dialog wiring options are intentionally not updateable: `defaultOpen`, `trapFocus`, `restoreFocus`, `fallbackFocus`, `useOverlayStack`, and `overlayStack`. Create a new alert dialog when those contracts need to change.

## Styling

AlertDialog reuses Dialog, ActionsBar, and Button styling hooks, including `[data-af-component="dialog"]`, `[data-af-dialog-surface]`, `[data-af-dialog-actions]`, `[data-af-composition="actions-bar"]`, and button `[data-af-variant]`.

```ts
AlertDialog({
    trigger: "Delete project",
    title: "Delete project?",
    description: "This action cannot be undone.",
    className: "danger-confirmation"
});
```

## Manual Checks

- Trigger announces that it opens a dialog.
- Opening announces title and description.
- Initial focus lands on the cancel action by default.
- Cancel and confirm actions are reachable immediately after opening.
- Confirm action is visually distinct for destructive flows.
- `Tab` and `Shift+Tab` do not leave the alert dialog.
- Page behind the alert dialog does not scroll while open.
- Outside pointer interaction does not close it by default.
- `Escape` closes it unless disabled.
- Confirm and cancel actions close it by default.
- Focus returns to the trigger after closing.
