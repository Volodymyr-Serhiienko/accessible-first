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

With open announcement:

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
- Can optionally announce panel text or a custom message when opened.
- Exposes stable data attributes for styling.
- Restores original attributes on `destroy()`.

## Options

- `trigger` - Required trigger content or element.
- `panel` - Required panel content or element.
- `defaultOpen` - Opens the panel initially.
- `open` - Controlled open state.
- `disabled` - Disables the trigger.
- `variant` - `"default"` or `"plain"`.
- `size` - `"md"`.
- `announcement` - Announces opened panel content when enabled.
- `onOpenChange` - Called when open state changes.
- common composition options from [foundation.md](./foundation.md#common-composition-options).

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
- Panel visibility updates correctly.
- Disabled disclosure cannot be toggled.
- Focusable content inside an open panel is reachable in normal tab order.
