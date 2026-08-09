# Accordion

Accordion groups related disclosure items and provides keyboard navigation between item triggers.

## When To Use

Use `Accordion` for a set of related expandable sections.

Use `Disclosure` for one standalone expandable panel.

## Quick Start

```ts
Accordion({
    items: [
        {
            trigger: "Account",
            panel: "Account settings and preferences."
        },
        {
            trigger: "Security",
            panel: "Password and sign-in options."
        }
    ]
});
```

With short item descriptions:

```ts
Accordion({
    items: [
        {
            value: "keyboard",
            trigger: "Keyboard support",
            description: "This panel explains arrow-key shortcuts.",
            panel: "Arrow keys, Home, and End are supported."
        }
    ]
});
```

## Layers

- Enhancement API: `createAccordion(element, options)`
- Composition API: `Accordion(options)`
- Reuses: `createDisclosure`, `Disclosure`

## Behavior

- Each trigger controls one panel.
- Triggers expose `aria-expanded`.
- Triggers reference panels through `aria-controls`.
- Panels are hidden when closed.
- Every trigger remains in the normal page `Tab` sequence.
- Composition API wraps each trigger in a native heading element.
- Default composition heading level is `h3`.
- `panelRole: "auto"` uses `role="region"` only when the accordion is small enough to avoid landmark noise.
- Composition items can create a visible `description` inside the panel.
- `descriptionMode` defaults to `"content"`, so item descriptions are not read from triggers before their panels open.
- When an item description exists and no explicit item `announcement` is provided, the description is announced when that item opens.
- Can announce root-level or per-item open messages when a custom live-region message is needed.

Keyboard behavior:

- `Tab` moves through accordion triggers and other focusable page controls.
- `Enter` or `Space` toggles the focused trigger.
- `ArrowDown` and `ArrowUp` may move focus between triggers.
- `Home` and `End` may move focus to the first or last trigger.

Arrow keys are an enhancement, not the only navigation path. Screen readers may use arrow keys for their own reading cursor.

## Options

Root options:

- `items` - Required list of accordion items.
- `headingLevel` - Default heading level for item headings: `2 | 3 | 4 | 5 | 6`.
- `panelRole` - `"auto"`, `"region"`, or `"none"`.
- `descriptionMode` - Default description mode for items: `"content"` or `"aria"`. Defaults to `"content"`.
- `multiple` - Allows more than one item to be open.
- `collapsible` - Allows the last open item to close.
- `disabled` - Disables the entire accordion.
- `loop` - Arrow navigation wraps.
- `variant` - `"default"` or `"plain"`.
- `size` - `"md"`.
- `announcement` - Root fallback announcement for opened items. `true` reads each opened panel text.
- `onOpenChange` - Called when an item opens or closes.
- common composition options from [foundation.md](./foundation.md#common-composition-options).

Item options:

- `value` - Stable item id used by controller methods.
- `trigger` - Required trigger content.
- `panel` - Required panel content.
- `description` - Optional short visible explanation shown before the item body.
- `descriptionId` - Custom id for the item description.
- `descriptionMode` - Per-item override for root `descriptionMode`.
- `headingLevel` - Overrides heading level for one item.
- `disabled` - Disables one item.
- `defaultOpen` - Opens one item initially.
- `open` - Controlled open state.
- `announcement` - Per-item announcement override. Prefer a short string for verbose panels.

## Description And Announcement

Accordion items use the same description and open-announcement model as `Disclosure`.

Use item `description` as the default way to provide short visible context. It appears at the top of the opened panel and is announced on open when no explicit `announcement` is provided.

```ts
Accordion({
    items: [
        {
            trigger: "Project details",
            description: "Use Tab to reach actions inside.",
            panel: [
                P("Project summary."),
                Button({ text: "Confirm" })
            ]
        }
    ]
});
```

Use per-item `announcement` when the spoken message should be different from the visible description, or when it should explicitly say that an item opened. Use root-level `announcement` only as a fallback strategy for items without their own description or announcement. Use `announcement: true` sparingly because it reads the full opened panel text.

```ts
Accordion({
    announcement: "Accordion item opened.",
    items: [
        {
            trigger: "Quiet details",
            description: "Visible helper text.",
            announcement: false,
            panel: "Quiet panel content."
        }
    ]
});
```

## Update Notes

`headingLevel` is creation-time only because it creates native heading elements.

Item updates are partial and matched by index:

```ts
accordion.update({
    items: [
        { open: true },
        { disabled: true }
    ]
});
```

## Styling

Useful hooks include `[data-af-component="accordion"]`, `[data-af-accordion-item]`, `[data-af-disclosure-description]`, `[data-af-disclosure-body]`, `[data-af-open]`, and `[data-af-disabled]`.

```ts
Accordion({
    className: "settings-accordion",
    items: [...]
});
```

## Manual Checks

- Trigger names are announced.
- Expanded or collapsed state is announced.
- Arrow keys move between triggers when available to the browser.
- Disabled items cannot be activated.
- Focus indicator is visible.
- Touch targets are comfortable on mobile.
- Opening an item announces useful context without repeating long panel content.
- Item descriptions are not announced before opening unless `descriptionMode: "aria"` is intentionally used.
