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
