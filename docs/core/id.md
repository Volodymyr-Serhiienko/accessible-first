# ID Module

## Purpose

The ID module provides utilities for generating unique identifiers.

## Why?

Many accessible components require IDs to connect related elements.

Examples:

- label -> input
- error message -> input
- dialog -> heading
- description -> control

Generating IDs manually is error-prone.

## Public API

### createId()

Creates a unique ID.

```ts
createId(): string
createId("dialog"): string
```
---

### ensureId()

Ensures that the given element has an `id`.
Returns the existing `id` or generates and assigns a new one if it's missing.

```ts
ensureId(element: HTMLElement, prefix = "af"): string
```
