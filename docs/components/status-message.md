# StatusMessage

StatusMessage provides visible inline feedback for a completed action, validation result, loading result, or small workflow state.

Use it when the user should see feedback in the current page or panel. It can also announce the same result through the shared action announcer when the feedback is caused by a user action.

## When To Use

Use `StatusMessage` for feedback that belongs near the control or workflow that produced it.

Common places:

- saved settings;
- invalid choices that are not tied to one native form field;
- import/export results;
- retryable loading errors;
- compact success, warning, or informational states in settings and setup screens.

Use `Toast` when the feedback is global, temporary, and not tied to one visible area. Use field validation messages for field errors. Use `Dialog` or `AlertDialog` when the user must make a decision.

## Quick Start

Hidden until needed:

```ts
const status = StatusMessage({
    hidden: true
});

status.update({
    variant: "success",
    icon: "✓",
    text: "Language pair saved.",
    hidden: false,
    announcement: true
});
```

Visual only:

```ts
StatusMessage({
    variant: "info",
    icon: "i",
    text: "Current pair: English to Ukrainian.",
    announcement: false
});
```

Custom spoken text:

```ts
status.update({
    variant: "danger",
    icon: "!",
    text: "Choose two different languages.",
    hidden: false,
    announcement: "Language setup error. Choose two different languages."
});
```

## Layers

- Composition API: `StatusMessage(options)`
- Reuses: native visible content, managed composition slots, optional `createActionAnnouncer()`
- Does not use `role="status"` on the visible element by default; optional speech is sent through a hidden announcer so repeated identical messages can still be spoken

## Behavior

- Renders visible inline feedback.
- Supports `"neutral"`, `"info"`, `"success"`, `"warning"`, and `"danger"` variants.
- Supports optional decorative icon content.
- Starts hidden when no text is provided unless `hidden` is explicitly set.
- Keeps visible text in normal reading order.
- Announces only when `announcement` is provided or `announce()` is called.
- Does not steal focus.
- Does not replace field-level validation messages.
- Exposes stable data attributes for styling.

## Options

- `text` - Visible status text or rich content.
- `icon` - Optional decorative icon or media content.
- `iconPosition` - `"start"` or `"end"`. Defaults to `"start"`.
- `variant` - `"neutral"`, `"info"`, `"success"`, `"warning"`, or `"danger"`. Defaults to `"neutral"`.
- `size` - `"md"`.
- `hidden` - Whether the message is hidden.
- `announcement` - `true`, `false`, fixed text, or a function. `true` announces the visible text.
- `announcementPoliteness` - `"polite"` or `"assertive"`. Defaults to `"polite"`.
- `announcer` - Optional shared `ActionAnnouncer`. If omitted, the component creates one lazily.
- `iconOptions` - Common DOM options for the icon slot.
- `contentOptions` - Common DOM options for the content slot.
- common composition options from [foundation.md](./foundation.md#common-composition-options).

## Update Notes

```ts
const status = StatusMessage({ hidden: true });

status.update({
    variant: "danger",
    icon: "!",
    text: "Import failed.",
    hidden: false,
    announcement: true,
    announcementPoliteness: "assertive"
});

status.hide();
```

Use `announcement: true` on the update that represents the completed action. Do not leave important workflow instructions only in a status message if the next required action is elsewhere on the page.

## Styling

Useful hooks include `[data-af-composition="status-message"]`, `[data-af-status-message-icon]`, `[data-af-status-message-content]`, `[data-af-variant]`, `[data-af-size]`, and `[data-af-icon-position]`.

```ts
StatusMessage({
    className: "settings-status",
    variant: "success",
    text: "Preferences saved."
});
```

The default styles provide readable light and dark theme colors for every variant.

## Manual Checks

- The visible message is close to the workflow that produced it.
- Color is not the only source of meaning.
- Repeating the same action repeats the spoken result when `announcement` is enabled.
- The message does not duplicate speech from focused fields, section descriptions, or toasts.
- The message remains readable in light and dark themes.
- The message fits on small screens.
