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

- Shows short visual text on mouse hover and keyboard focus.
- Can connect the text to the trigger through `aria-describedby`.
- Keeps tooltip content non-interactive.
- Supports `Escape` dismissal while the trigger remains hovered or focused.
- Can politely announce the text on mouse hover when needed.
- Touch and mobile screen reader users should not depend on the visual hover layer.
- Restores original attributes on `destroy()`.

## Options

Enhancement options:

- `text` - Tooltip text. Empty text disables the tooltip.
- `id` - Optional id for the hidden described-by text node.
- `describe` - Adds tooltip text to `aria-describedby`. Defaults to `false` for enhancement.
- `announceOnHover` - Announces tooltip text when a mouse pointer enters the trigger.

Composition options:

- `trigger` - Required trigger content.
- `text` - Tooltip text.
- `describe` - Adds tooltip text to `aria-describedby`. Defaults to `true` for `Tooltip()`.
- `announceOnHover` - Announces tooltip text when a mouse pointer enters the trigger.
- common composition options from [foundation.md](./foundation.md#common-composition-options).

## Tooltip Versus Popover

Tooltip is for short, passive helper text.

Popover is for richer floating content, including paragraphs, actions, or focusable controls.

## Styling

Useful hooks include `[data-af-composition="tooltip"]`, `[data-af-tooltip]`, `[data-af-tooltip-content]`, and `[data-af-tooltip-dismissed]`.

```ts
Tooltip({
    className: "save-tooltip",
    trigger: Button({ text: "Save" }),
    text: "Saves the current draft."
});
```

## Manual Checks

- Tooltip appears on mouse hover.
- Tooltip appears on keyboard focus.
- `Escape` hides the tooltip without moving focus.
- Trigger keeps its accessible name.
- `aria-describedby` is added only when description is useful.
- Text is readable in light and dark themes.
- Tooltip does not contain interactive content.
- Mobile/touch flows remain understandable without relying on a visible hover tooltip.
