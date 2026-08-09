# Hints And Announcements

Accessible First uses one perception model across components so developers do not have to guess which option to use.

## Vocabulary

`label` is the control name.

Use it to answer: what is this?

Examples: "Save", "Dark theme", "Add to favorites".

`hint` is supporting context for a control.

Use it to answer: what should the user know before activating this?

Examples: "Saves the current draft without publishing.", "Opens advanced filters.".

`tooltip` is a short visual helper attached to pointer hover or keyboard focus.

Use it only for optional, short, non-interactive helper text. Tooltip must not be the only place where important information exists because touch devices do not have reliable hover.

`description` is visible explanatory content owned by a component or region.

Use it for dialogs, popovers, disclosures, panels, fields, and other components where the explanation belongs to the opened or visible content.

`announcement` is a live-region message for a state change or event.

Use it to answer: what just happened?

Examples: "Draft saved.", "Dialog opened.", "No matching results.".

`toast` is a visible non-modal notification.

Use it for application feedback that should remain available visually. Toast should not steal focus. If the user must act, use Dialog, AlertDialog, inline content, or a future notification center instead of relying only on a toast action.

## Baseline Rules

- Important information must not live only in a tooltip.
- Every control can have a programmatic hint through `aria-describedby` when the hint helps understanding.
- Visual tooltip is optional enhancement, not the primary accessibility channel.
- Mobile-friendly visual help should be visible in the layout, not hidden behind hover.
- Opening components may use `description` for visible context and `announcement` for concise open feedback.
- Action results should use toast or another visible status pattern, not tooltip.
- Assertive announcements are reserved for urgent updates.
- Repeated identical announcements must be supported by the live-region engine.

## Component API Direction

Simple controls should converge on:

```ts
Button({
    text: "Save",
    hint: "Saves the current draft without publishing."
});
```

Optional visual tooltip should be explicit. Use `both` when the hint should be available to screen readers and also shown as a visual tooltip:

```ts
Button({
    text: "Save",
    hint: "Saves the current draft without publishing.",
    hintDisplay: "both"
});
```

For simple controls, `hintDisplay` supports:

- `"description"` - programmatic hint through `aria-describedby`; default and safest baseline.
- `"tooltip"` - visual tooltip only.
- `"both"` - `aria-describedby` plus visual tooltip.
- `"none"` - stores no hint output.

Components with a visible layout wrapper, such as future fields and settings groups, should support visible helper text:

```ts
Checkbox({
    label: "Email updates",
    hint: "We send product updates no more than once a week.",
    hintDisplay: "visible"
});
```

This keeps the common mental model stable while allowing each component to choose the safest visual rendering it can support.

## Tooltip Rules

Tooltip should follow WCAG hover/focus expectations:

- dismissible without moving focus or pointer;
- hoverable when pointer-triggered;
- persistent until dismissed, focus/hover leaves, or information is no longer valid.

Tooltip content is short and passive. If the content needs focusable controls, use Popover or Dialog.

## Toast Rules

Toast is visible feedback and should be announced through hidden live regions.

Toast actions are convenience actions only. They must not be the only way to complete an important task because focus does not move to the toast when it appears.

Use persistent toast for messages that should remain visible until dismissed. Use timed toast only when the message is short and non-critical.
