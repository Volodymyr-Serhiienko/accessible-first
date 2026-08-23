# Disclosure

Disclosure reveals or hides one panel from one trigger.

## When To Use

Use `Disclosure` when a user needs to expand optional information in place.

Use `Accordion` when several related disclosure items should be grouped together.

## Quick Start

```ts
Disclosure({
    trigger: "Project details",
    panel: "This panel starts closed and opens from the trigger."
});
```

With short open context:

```ts
Disclosure({
    trigger: "Details",
    description: "Use Tab to reach interactive content inside.",
    panel: "More information."
});
```

Read the full panel on open:

```ts
Disclosure({
    trigger: "Details",
    panel: "More information.",
    announcement: true
});
```

Custom announcement:

```ts
Disclosure({
    trigger: "Details",
    panel: "More information.",
    announcement: "Details opened."
});
```

Enhance existing HTML:

```ts
const disclosure = createDisclosure(root, {
    trigger,
    panel,
    defaultOpen: false
});
```

## Layers

- Enhancement API: `createDisclosure(element, options)`
- Composition API: `Disclosure(options)`
- Reuses: core disclosure behavior, optional live announcements, and component lifecycle

## Behavior

- Connects trigger and panel with `aria-controls`.
- Updates `aria-expanded`.
- Hides and shows the panel with `hidden`.
- Preserves native button behavior when the trigger is a `<button>`.
- Adds fallback button semantics for non-native triggers.
- Supports disabled state.
- Composition API can create a visible `description` inside the panel.
- `descriptionMode` defaults to `"content"`, so the description is not read from the trigger before the panel opens.
- Enhancement API stays quiet unless `announcement` is provided.
- Composition API uses a visible `description` as a concise open announcement when no explicit `announcement` is provided.
- Can optionally announce full panel text or a custom message when opened.
- Exposes stable data attributes for styling.
- Restores original attributes on `destroy()`.

## Options

- `trigger` - Required trigger content or element.
- `panel` - Required panel content or element.
- `description` - Optional short visible explanation shown before the panel body.
- `descriptionId` - Custom id for the composed description.
- `descriptionMode` - `"content"` or `"aria"`. Defaults to `"content"`.
- `defaultOpen` - Opens the panel initially.
- `open` - Controlled open state.
- `disabled` - Disables the trigger.
- `variant` - `"default"` or `"plain"`.
- `size` - `"md"`.
- `announcement` - Announces text when the panel opens. `true` reads the full panel text.
- `onOpenChange` - Called when open state changes.
- common composition options from [foundation.md](./foundation.md#common-composition-options).

## Description And Announcement

`description` is the preferred way to give a short visible hint for composed disclosures. By default it is shown inside the opened panel and announced only when the panel opens.

`createDisclosure` does not invent announcement text by itself. Use `announcement` when enhancing existing HTML and the open event should be spoken.

Use `announcement` for explicit event wording such as "Details opened." Prefer a short string for large panels. Use `announcement: true` only when reading the full panel text is desirable.

```ts
Disclosure({
    trigger: "Payment details",
    description: "Saved cards and invoice settings are shown below.",
    panel: [
        P("Saved cards and invoice settings.")
    ]
});
```

Disable automatic description announcement:

```ts
Disclosure({
    trigger: "Quiet details",
    description: "Visible helper text.",
    announcement: false,
    panel: "Quiet panel content."
});
```

## Update Notes

`disclosure.update()` accepts runtime content, state, visual, and announcement options such as `trigger`, `panel`, `description`, `open`, `disabled`, `variant`, `size`, `announcement`, and `onOpenChange`.

`defaultOpen` is creation-time only. Use `open`, `setOpen()`, `open()`, `close()`, or `toggle()` to change state after creation.

## Styling

Useful hooks include `[data-af-component="disclosure"]`, `[data-af-disclosure-trigger]`, `[data-af-disclosure-panel]`, and `[data-af-open]`.

```ts
Disclosure({
    trigger: "Details",
    panel: "More information.",
    className: "details-box"
});
```

## Manual Checks

- Tab reaches the disclosure trigger.
- Focus indicator is visible.
- `Enter` toggles the disclosure.
- `Space` toggles the disclosure.
- Expanded or collapsed state is announced.
- Opening does not repeat the same description unexpectedly.
- Panel visibility updates correctly.
- Disabled disclosure cannot be toggled.
- Focusable content inside an open panel is reachable in normal tab order.
