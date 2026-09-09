# Core API Reference

Core contains framework-independent behavior primitives. Most applications start
with components or a public app template; import from Core only when enhancing
existing DOM or building a reusable behavior layer.

## DOM And Semantics

- [ARIA](./aria.md)
- [DOM](./dom.md)
- [Events](./events.md)
- [ID](./id.md)
- [Keyboard](./keyboard.md)

## Focus, Scrolling, And Feedback

- [Focus](./focus.md)
- [Scroll](./scroll.md)
- [Live Region](./live-region.md)
- [Validation Announcements](./validation-announcements.md)

## Collections And Keyboard Models

- [Collection](./collection.md)
- [Selection](./selection.md)
- [Roving Focus](./roving-focus.md)
- [Typeahead](./typeahead.md)
- [Listbox](./listbox.md)
- [Menu](./menu.md)
- [Tabs](./tabs.md)
- [Combobox](./combobox.md)

## Overlay Behavior

- [Dialog](./dialog.md)
- [Disclosure](./disclosure.md)
- [Dismissable Layer](./dismissable-layer.md)
- [Overlay Stack](./overlay-stack.md)
- [Popover Position](./popover-position.md)

## Data And Forms

- [Form Field](./form-field.md)
- [Storage](./storage.md)

## Choosing A Layer

Use a composed component when it already provides the desired semantic HTML,
accessible default behavior, styles, and lifecycle. Use an enhancement API such
as `createCombobox()` or `createDialog()` when the application owns existing
DOM. Use an individual core primitive only when a reusable component or
integration truly needs to compose behavior from scratch.