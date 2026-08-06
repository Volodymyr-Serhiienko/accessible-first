# Dialog

Dialog provides an accessible modal overlay component.

## When To Use

Use `Dialog` for modal workflows that temporarily move attention into an overlay.

Use `AlertDialog` for important confirmations or destructive decisions.

## Quick Start

```ts
Dialog({
    trigger: "Open dialog",
    title: "Project settings",
    description: "Change project options.",
    children: [
        P("Dialog content goes here.")
    ],
    actions: Button({
        text: "Save"
    })
});
```

Content-heavy dialog:

```ts
Dialog({
    trigger: "Read details",
    title: "Details",
    descriptionMode: "content",
    initialFocusTarget: "title",
    children: [
        P("Longer content can start from the dialog title.")
    ]
});
```

## Layers

- Enhancement API: `createDialog(element, options)`
- Composition API: `Dialog(options)`
- Reuses: core `createDialog`, focus trap, dismissable layer, overlay stack, scroll lock

## Behavior

- Adds `role="dialog"` by default.
- Adds `aria-modal="true"` for modal dialogs.
- Requires an accessible name through `aria-labelledby` or `aria-label`.
- Composition API creates a visible title and links it with `aria-labelledby`.
- Description is connected with `aria-describedby` by default when provided.
- Default initial focus target is the first focusable element inside the dialog.
- `initialFocusTarget` can move initial focus to `"title"`, `"description"`, or `"dialog"` for content-heavy cases.
- `descriptionMode: "content"` keeps the description as visible content only.
- Moves focus inside the dialog on open.
- Keeps `Tab` and `Shift+Tab` inside the dialog while modal focus trapping is enabled.
- Locks page scrolling behind modal dialogs by default.
- Restores focus to the trigger on close by default.
- Closes with `Escape` by default.
- Can close on pointer interaction outside the dialog surface.
- Provides a visible close button in the composition API by default.
- Trigger receives `aria-haspopup="dialog"`, `aria-controls`, and `aria-expanded`.

## Options

- `trigger` - Required trigger content.
- `title` - Required visible dialog title.
- `description` - Optional short description.
- `descriptionMode` - `"aria"` or `"content"`.
- `initialFocusTarget` - `"first"`, `"title"`, `"description"`, or `"dialog"`.
- `initialFocus` - Custom element or function for initial focus.
- `children` - Main dialog content.
- `actions` - Footer action content.
- `closeText` - Text for the default close button.
- `hideCloseButton` - Hides the default close button for specialized dialogs.
- `open` - Controlled open state.
- `defaultOpen` - Opens initially.
- `modal` - Enables modal semantics.
- `lockScroll` - Locks page scrolling while open. Defaults to `modal`.
- `trapFocus` - Keeps tab navigation inside the dialog.
- `closeOnEscape` - Allows `Escape` to close the dialog.
- `restoreFocus` - Restores focus to the opener on close.
- `variant` - `"default"` or `"plain"`.
- `size` - `"md"`.
- `onOpenChange` - Called when the dialog opens or closes.
- common composition options from [foundation.md](./foundation.md#common-composition-options).

## Styling

Useful hooks include `[data-af-component="dialog"]`, `[data-af-open]`, `[data-af-dialog-surface]`, `[data-af-dialog-title]`, `[data-af-dialog-description]`, `[data-af-dialog-body]`, and `[data-af-dialog-actions]`.

```ts
Dialog({
    trigger: "Open settings",
    title: "Settings",
    className: "settings-dialog",
    children: [...]
});
```

## Manual Checks

- Trigger announces that it opens a dialog.
- Opening moves focus inside the dialog.
- Dialog has a clear accessible name.
- `Tab` and `Shift+Tab` do not leave a trapped modal dialog.
- Page behind the dialog does not scroll while modal dialog is open.
- `Escape` closes the dialog when enabled.
- Close button closes the dialog.
- Focus returns to the trigger after closing.
- Mobile screen reader can open, read, and close the dialog.
