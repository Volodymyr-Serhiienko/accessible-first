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
