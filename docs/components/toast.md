# Toast

Toast provides visible, non-modal notifications for short application feedback.

## When To Use

Use `Toast` for messages such as saved changes, background completion, recoverable warnings, or short errors that do not require a modal workflow.

Do not use toast for critical confirmations, long instructions, or information that must block the user. Use `AlertDialog`, `Dialog`, visible inline validation, or page content when the user must make a decision.

Avoid interactive toast actions in accessible production flows. A toast does not receive focus when it appears, and the framework does not yet provide a reliable keyboard or screen reader route into the notification viewport. If a user must press a button, prefer `Dialog` or `AlertDialog`.

Persistent toasts that rely on a close button have the same limitation. Use them carefully, and prefer timed status messages unless the application provides another obvious way to manage notifications.

## Quick Start

```ts
const notifications = ToastViewport({
    placement: "bottom-end",
    limit: 4
});

notifications.show({
    title: "Draft saved",
    description: "Your changes were saved locally.",
    variant: "success"
});
```

Auto-dismiss is opt-in:

```ts
notifications.show({
    title: "Copied",
    description: "The share link was copied.",
    duration: 5000
});
```

Enhance an existing container:

```ts
const notifications = createToastViewport(element, {
    label: "Notifications",
    placement: "bottom-end"
});
```

## Layers

- Enhancement API: `createToastViewport(element, options)`
- Composition API: `ToastViewport(options)`
- Reuses: component lifecycle, native buttons, hidden live-region announcements, and theme tokens

## Behavior

- Adds visible notifications to a fixed viewport.
- Does not move focus when a toast appears.
- Announces messages through hidden live regions while keeping the visible toast card non-modal.
- Defaults to persistent messages. Set `duration` when auto-dismiss is appropriate.
- Provides a close button by default, but do not rely on that close button as the only accessible way to clear important UI.
- Supports one optional action button as a limited convenience feature.
- Interactive toast actions are not recommended for flows that must be fully accessible to blind keyboard or screen reader users.
- Pauses auto-dismiss on mouse hover when `pauseOnHover` is enabled.
- Can limit the number of visible toasts.
- Restores original viewport attributes on `destroy()`.

## Options

Viewport options:

- `placement` - `"top-start"`, `"top-end"`, `"bottom-start"`, or `"bottom-end"`.
- `label` - Accessible label for the notification region.
- `limit` - Maximum visible toasts. `null` means no limit.
- `duration` - Default auto-dismiss duration in milliseconds. `null` means persistent.
- `dismissible` - Shows close buttons by default.
- `closeLabel` - Accessible label for close buttons.
- `pauseOnHover` - Pauses auto-dismiss while the mouse is over a toast.
- `newestOnTop` - Inserts new toasts before older ones.
- common composition options from [foundation.md](./foundation.md#common-composition-options).

Toast options:

- `id` - Custom toast id.
- `title` - Short heading text.
- `description` - Supporting message text.
- `variant` - `"info"`, `"success"`, `"warning"`, or `"danger"`.
- `politeness` - `"polite"` or `"assertive"`. Danger toasts default to assertive.
- `duration` - Per-toast auto-dismiss duration. `null` keeps the toast open.
- `dismissible` - Per-toast close button control.
- `closeLabel` - Per-toast close button label.
- `actionText` - Optional action button text. Limited feature; prefer `Dialog` or `AlertDialog` for required actions.
- `actionLabel` - Optional accessible label for the action button.
- `onAction` - Called when the action button is pressed.
- `onClose` - Called when the toast closes.

## Interactive Action Limitation

Toast is intentionally non-modal and does not move focus. This is good for status messages, but poor for required actions.

Current interactive toasts can contain action or close buttons, but reaching those buttons without a mouse or touch pointer is not reliable enough for accessible application workflows. On a long page, keyboard users may need to tab through large parts of the document to reach the notification viewport. Screen reader users may also have to know how to search for the notification region manually.

For now, treat toast buttons as experimental convenience controls only. Do not use them as the only way to undo, confirm, cancel, save, delete, dismiss an important blocking message, or complete an important task. Use `Dialog`, `AlertDialog`, inline page actions, or another visible control near the user workflow.

## Styling

Useful hooks include `[data-af-component="toast-viewport"]`, `[data-af-toast]`, `[data-af-toast-content]`, `[data-af-toast-title]`, `[data-af-toast-description]`, `[data-af-toast-actions]`, `[data-af-toast-action]`, and `[data-af-toast-close]`.

Useful CSS custom properties:

- `--af-z-toast` - toast viewport stacking level.
- `--af-toast-width` - maximum viewport width.

## Manual Checks

- Toast appears visually without moving focus.
- Screen reader announces the message once.
- Toasts that contain buttons are not required for the primary workflow.
- Action buttons are avoided for required workflows.
- If an action button is used anyway, the same action exists elsewhere in the page or in a dialog.
- Persistent toasts remain until dismissed.
- Timed toasts give enough time to read and pause on hover.
- Toasts fit on small mobile screens.
