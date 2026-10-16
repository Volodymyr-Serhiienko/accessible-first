# Tooltip

Tooltip provides short, non-interactive helper text for a trigger element.

## When To Use

Use `Tooltip` for brief supporting text that helps identify or clarify a control.

For keyboard users, attach the tooltip to a focusable trigger such as `Button`, `Link`, or `IconButton`. A tooltip on plain text can still appear on mouse hover, but it will not be reached by Tab unless the trigger itself is focusable.

Do not put interactive content, long instructions, or required information only inside a tooltip. If users must read or interact with the content, use visible text, `Disclosure`, `Popover`, or `Dialog` instead. On touch devices a visual tooltip may not appear, so essential information must also exist in visible text or programmatic descriptions.

## Quick Start

```ts
Tooltip({
    trigger: Button({ text: "Save" }),
    text: "Saves the current draft."
});
```

Enhance an existing element:

```ts
const tooltip = createTooltip(button, {
    text: "Saves the current draft.",
    describe: true
});
```

## Layers

- Enhancement API: `createTooltip(element, options)`
- Composition API: `Tooltip(options)`
- Reuses: CSS tooltip styling, optional `aria-describedby`, optional polite hover announcement, and Escape dismissal

## Behavior

- Shows short visual text on mouse hover; keyboard/touch focus does not open it by default.
- Connects text to the trigger through `aria-describedby` by default, independently of visibility.
- Keeps tooltip content non-interactive.
- Keeps the visual tooltip open while the pointer moves from the trigger onto it.
- Supports `Escape` dismissal while the trigger remains hovered or focused, including mouse-hover use without first clicking the trigger.
- Once dismissed, does not consume later `Escape` keys until a new hover/focus
  session. A containing popover can then handle the next `Escape` normally.
- Renders its fixed visual layer in the document overlay, so container queries and trigger layout cannot expand page scroll area.
- Positions that layer inside the viewport on both axes, moving below the trigger when there is not enough space above it.
- Wraps long text without horizontal scrolling. Only text taller than the available
  viewport scrolls vertically; the pointer bridge never creates scrollbars.
- Can politely announce the text on mouse hover when needed.
- Uses the document-coordinated announcement channel, so leaving the trigger cannot clear newer framework feedback.
- Touch and mobile screen reader users should not depend on the visual hover layer.
- Restores borrowed styling markers on `destroy()` and releases only its own description reference.

Tooltip, ControlHint and FormField coordinate `aria-describedby` contributions.
Updates/disable/destroy preserve authored help and other active owners rather than
replacing the attribute with a creation-time snapshot. Visual-only tooltips never
claim a programmatic description. `ControlHint.update({ hintId })` updates its owned
description ID and releases the old reference without losing field help.

## Options

Enhancement options:

- `text` - Tooltip text. Empty text disables the tooltip.
- `id` - Optional id for the hidden described-by text node.
- `describe` - Adds tooltip text to `aria-describedby`. Defaults to `true`; set `false` for deliberately visual-only text already exposed by the control's name.
- `announceOnHover` - Announces tooltip text when a mouse pointer enters the trigger.
- `showOnFocus` - Shows the visual layer on keyboard focus (default `false`).
  Set `true` only for an explicit focus-reveal interaction; descriptions remain independent.

Composition options:

- `trigger` - Required trigger content.
- `text` - Tooltip text.
- `describe` - Adds tooltip text to `aria-describedby`. Defaults to `true` for `Tooltip()`.
- `announceOnHover` - Announces tooltip text when a mouse pointer enters the trigger.
- `showOnFocus` - Same visual-focus option as the enhancement API; also available
  through `setShowOnFocus()` and `update()`.
- common composition options from [foundation.md](./foundation.md#common-composition-options).

## Tooltip Versus Popover

Tooltip is for short, passive helper text.

Popover is for richer floating content, including paragraphs, actions, or focusable controls.

## Styling

Useful hooks include `[data-af-composition="tooltip"]`, `[data-af-tooltip]`, `[data-af-tooltip-visual]`, `[data-af-tooltip-content]`, `[data-af-tooltip-dismissed]`, and `[data-af-tooltip-placement]`.

```ts
Tooltip({
    className: "save-tooltip",
    trigger: Button({ text: "Save" }),
    text: "Saves the current draft."
});
```

## Manual Checks

- Tooltip appears on mouse hover.
- Focus exposes the description without opening the visual layer; `showOnFocus: true` opts into visual focus reveal.
- Pointer can move from the trigger onto the visible tooltip without closing it.
- `Escape` hides the tooltip without moving focus, including after mouse hover without a click.
- After tooltip dismissal, another `Escape` can close an open popover instead
  of being swallowed by the already-hidden tooltip.
- A tooltip near the top edge moves below its trigger.
- A tooltip near either horizontal edge remains fully visible.
- Tooltip remains above following page content when it opens below a trigger.
- Opening a tooltip near any viewport edge does not add horizontal or vertical page scrolling.
- Short and multiline tooltips have no internal scrollbars; long unbroken text wraps.
- Check fractional line heights as well: glyph rounding must not create a one-pixel
  vertical scrollbar in otherwise fitting text.
- Trigger keeps its accessible name.
- `aria-describedby` is added only when description is useful.
- Text is readable in light and dark themes.
- Tooltip does not contain interactive content.
- Mobile/touch flows remain understandable without relying on a visible hover tooltip.
