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
- Reuses: core `createDialog`, focus trap, dismissable layer, overlay stack, scroll lock, `ActionsBar`

## Behavior

- Adds `role="dialog"` by default.
- Adds `aria-modal="true"` for modal dialogs.
- Requires an accessible name through `aria-labelledby` or `aria-label`.
- Composition API creates a visible title and links it with `aria-labelledby`.
- Description is connected with `aria-describedby` by default when provided.
- Default initial focus target is the first focusable element inside the dialog.
- `initialFocusTarget` can move initial focus to `"title"`, `"description"`, or `"dialog"` for content-heavy cases.
- `descriptionMode: "content"` keeps the description as visible content only.
- Does not use live-region announcements; opening speech comes from focus, the dialog title, and the optional programmatic description.
- Moves focus inside the dialog on open.
- Keeps `Tab` and `Shift+Tab` inside the dialog while modal focus trapping is enabled.
- Locks page scrolling behind modal dialogs by default.
- Restores focus to the trigger on close by default.
- Closes with `Escape` by default.
- Can close on pointer interaction outside the dialog surface.
- Provides a visible close button in the composition API by default.
- Uses `ActionsBar` for footer action layout.
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
- `closeText` - Text for the default close button. Provide localized text for application UI.
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

## Focus And Description

Dialog is the preferred component when the user must press a button, choose an option, or complete a focused workflow. Unlike `Toast`, a dialog moves focus inside itself when it opens and keeps keyboard navigation inside the modal while focus trapping is enabled.

Use `description` for a short explanation that helps the user understand the dialog before acting. By default, the description is connected with `aria-describedby`, so screen readers can announce it as part of the dialog context.

Use `descriptionMode: "content"` when the description is long, when it is repeated in the main body, or when screen reader testing shows that the same text is being spoken twice.

## Update Notes

`dialog.update()` accepts runtime content, visual, and behavior options such as `open`, `modal`, `lockScroll`, `closeOnEscape`, outside-dismiss options, `title`, `description`, `children`, `actions`, `variant`, and `size`.

Creation-time focus and stack wiring options are intentionally not updateable: `defaultOpen`, `trapFocus`, `restoreFocus`, `initialFocus`, `fallbackFocus`, `initialFocusTarget`, `useOverlayStack`, and `overlayStack`. Create a new dialog when those contracts need to change.

## Styling

Useful hooks include `[data-af-component="dialog"]`, `[data-af-open]`, `[data-af-dialog-surface]`, `[data-af-dialog-title]`, `[data-af-dialog-description]`, `[data-af-dialog-body]`, `[data-af-dialog-actions]`, and the shared ActionsBar hooks `[data-af-composition="actions-bar"]`, `[data-af-actions-bar-secondary]`, and `[data-af-actions-bar-primary]`.

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
- Short description is useful and not repeated unnecessarily.
- `Tab` and `Shift+Tab` do not leave a trapped modal dialog.
- Page behind the dialog does not scroll while modal dialog is open.
- `Escape` closes the dialog when enabled.
- Close button closes the dialog.
- Focus returns to the trigger after closing.
- Mobile screen reader can open, read, and close the dialog.
