# Component Foundation

## Purpose

Component Foundation defines shared lifecycle rules for Accessible First components.

Components should compose core behavior modules instead of duplicating accessibility logic.

## Component Defaults

Accessible First components should be accessible by default.

Defaults should include:

- Native HTML first
- Keyboard support by default
- Visible focus support
- Correct ARIA relationships
- Correct disabled and invalid semantics
- Cleanup on destroy
- Stable data attributes for styling and debugging
- No framework dependency

## Lifecycle

Every component should expose:

```ts
destroy(): void;
isDestroyed(): boolean;
```

Components may expose additional methods such as update(), open(), close(), or setDisabled() depending on their behavior.

## Shared Helpers

Component Foundation also contains small helpers that keep repeated accessibility behavior out of individual components.

`createHoverAnnouncement(element, options)` announces an element label through a polite live region when a mouse pointer enters the element. It does not create a visual tooltip.

Use it for controls that already have visible text but may not be announced reliably by some screen reader and pointer-hover combinations, such as tabs or future complex menu items.

## Data Attributes

Components use stable data attributes:

```html
data-af-component="button"
data-af-state="ready"
```

These attributes are styling and debugging hooks, not accessibility replacements.

## Principles

* Components compose primitives
* Components should not bypass core modules
* Components should preserve user-authored markup
* Components should restore mutations on destroy
* Components should be configurable without losing accessible defaults
* Shared helpers should be extracted when the same accessibility workaround appears in more than one component
