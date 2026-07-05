# Events Module

## Purpose

The Events module provides small utilities for working with browser events.

Its first responsibility is predictable listener cleanup. Higher-level modules should not duplicate `addEventListener` / `removeEventListener` pairs manually.

## Public API

### addEventListener()

Adds an event listener and returns a cleanup function.

```ts
const cleanup = addEventListener(element, "keydown", handler);

cleanup();
```

## Used by
Focus
Dialog
Menu
Popover
Future behavior modules
