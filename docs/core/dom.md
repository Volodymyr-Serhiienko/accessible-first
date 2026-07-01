# DOM Module

## Purpose

The DOM module provides small, reusable utilities for working with the browser's Document Object Model.

Instead of directly accessing browser APIs throughout the codebase, higher-level modules use these primitives. This keeps the implementation consistent, readable, and easier to maintain.

---

## Principles

* Framework independent.
* Native browser APIs.
* Small, composable utilities.
* No external dependencies.
* Reusable building blocks.

---

## Public API

### isHTMLElement()

Checks whether a value is an HTMLElement.

```ts
isHTMLElement(value: unknown): value is HTMLElement
```

---

### contains()

Returns `true` if a container contains a given element.

```ts
contains(
    container: HTMLElement,
    element: HTMLElement | null
): boolean
```

---

### isDisabled()

Returns `true` if an element is disabled.

```ts
isDisabled(element: HTMLElement): boolean
```

---

### isHidden()

Returns `true` if an element has the `hidden` attribute.

```ts
isHidden(element: HTMLElement): boolean
```

---

### isVisible()

Returns `true` if an element is considered visible.

```ts
isVisible(element: HTMLElement): boolean
```

---

### getOwnerDocument()

Returns the owner document of a node.

```ts
getOwnerDocument(node: Node): Document
```

---

### getOwnerWindow()

Returns the window associated with a node.

```ts
getOwnerWindow(node: Node): Window
```

---

## Typical use cases

The DOM module is used internally by:

* Focus
* Keyboard
* Future ARIA utilities
* Future UI components

---

## Future improvements

Planned enhancements include:

* Shadow DOM support
* Computed visibility checks
* Inert detection
* Scroll container utilities
* DOM traversal helpers

---

## Philosophy

Higher-level modules should depend on stable DOM primitives instead of directly interacting with browser APIs.
