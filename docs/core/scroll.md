# Scroll Module

## Purpose

The Scroll module provides small utilities for working with scroll containers.

It is used by higher-level behavior such as roving focus, menus, listboxes, comboboxes, and tree views.

## Public API

### isScrollable()

Determines whether a specified HTML element is scrollable.
Checks both the computed overflow style properties and the actual scroll boundaries to ensure content exceeds the visible layout dimensions.

```ts
isScrollable(element: HTMLElement): boolean
```

---

### getScrollParent()

Traverses up the DOM tree to find the nearest scrollable ancestor of an element.
Falls back to the document root element if no scrollable container is found.

```ts
getScrollParent(element: HTMLElement): HTMLElement
```

---

### scrollIntoViewIfNeeded()

Scrolls the container to bring the specified element into view only if it is currently clipped or hidden outside the container's visible boundaries.

```ts
scrollIntoViewIfNeeded(element: HTMLElement): void
```

---

## Principles

- No framework dependency
- Native browser scrolling
- Small utilities
- Useful for keyboard navigation
