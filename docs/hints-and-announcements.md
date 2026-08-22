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

Use it for application feedback that should remain available visually. Toast should not steal focus. If the user must act, use Dialog, AlertDialog, inline content, or another visible control in the current workflow instead of relying on a toast action.

## Baseline Rules

- Important information must not live only in a tooltip.
- Every control can have a programmatic hint through `aria-describedby` when the hint helps understanding.
- Visual tooltip is optional enhancement, not the primary accessibility channel.
- Mobile-friendly visual help should be visible in the layout, not hidden behind hover.
- Opening components may use `description` for visible context and `announcement` for concise open feedback.
- For non-modal expandable components, a short visible `description` may be announced on open when no explicit `announcement` is provided.
- Prefer `announcement` for event wording such as "Panel opened"; keep `description` useful as visible text.
- Action results should use toast or another visible status pattern, not tooltip.
- Assertive announcements are reserved for urgent updates.
- Repeated identical announcements must be supported by the live-region engine.
- Do not route the same wording through several channels at once. A field error should not be both fully announced by a form live region and then immediately repeated by focus on the invalid field.
- Child controls own their own labels, descriptions, errors, and hints. Parent sections and panels should not make every child focus repeat the parent description.

## Description Exposure Rules

Visible descriptions and programmatic descriptions are related, but they are not always the same thing.

Use visible `description` content to explain a component, panel, section, or field in the page. Then decide whether that same text should also be connected with `aria-describedby`.

Use `descriptionMode: "content"` when:

- the description is useful visually and in normal reading order;
- the description is long enough that repeating it during focus movement would be noisy;
- child controls already have their own labels, descriptions, errors, or hints;
- a form submit moves focus directly to a field that should be read on its own.

Use `descriptionMode: "aria"` when:

- the component or container itself is the meaningful focus target;
- the description is short and essential for understanding that focused target;
- the text should be spoken as part of the component context.

Do not make ordinary layout sections tabbable only so their descriptions can be read. Prefer native headings, landmarks, and reading order for document navigation. A structural container should become a focus target only when it is a real workflow destination, route target, panel entry point, or widget surface.

When focus moves into a component, the focused thing should decide what is spoken:

- focusing a section or panel may speak its title and short programmatic description;
- focusing a field should speak the field label, field description, validation state, and field error;
- focusing a button or link should speak its label and optional hint;
- focusing a child control should not normally repeat the parent panel description.

For validation, avoid detailed live-region errors when focus also moves to the first invalid field. In that case, the focused field provides the detailed error context. Use form-level announcements only for deliberate summaries or when focus is not moved.

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

Components with a visible layout wrapper, such as fields and settings groups, should expose visible helper text through component-specific description options:

```ts
Checkbox({
    label: "Email updates",
    description: "We send product updates no more than once a week."
});
```

This keeps the common mental model stable without adding unsupported global hint modes. If a future component needs a dedicated visible hint alias, it should document that component-specific option explicitly.

## Tooltip Rules

Tooltip should follow WCAG hover/focus expectations:

- dismissible without moving focus or pointer;
- hoverable when pointer-triggered;
- persistent until dismissed, focus/hover leaves, or information is no longer valid.

Tooltip content is short and passive. If the content needs focusable controls, use Popover or Dialog.

## Toast Rules

Toast is visible feedback and should be announced through hidden live regions.

Toast buttons are a limited convenience feature only. They must not be the only way to complete an important task because focus does not move to the toast when it appears, and the framework does not yet provide a reliable keyboard or screen reader route into the notification viewport.

Use `Dialog`, `AlertDialog`, inline page actions, or visible page content when the user must press a button.

Use persistent toast carefully when dismissal depends on a close button. Use timed toast only when the message is short and non-critical.

