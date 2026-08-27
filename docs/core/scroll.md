# Scroll Module

## Purpose

The Scroll module provides small utilities for working with scroll containers.

It is used by higher-level behavior such as roving focus, menus, listboxes, comboboxes, and tree views.

## Public API

### createScrollLock()

Creates a controller that locks page scrolling for the document that owns an element.

```ts
const scrollLock = createScrollLock(element);

scrollLock.activate();
scrollLock.deactivate();
scrollLock.destroy();
```

Multiple locks on the same document are reference-counted. This allows nested overlays to close independently without unlocking the page too early.

---

### resetInitialScrollPosition()

Resets the page scroll position during application startup.

```ts
resetInitialScrollPosition();
```

The helper performs one immediate scroll reset and repeats it for a few animation frames. This is useful for SPAs, playgrounds, restored browser tabs, and mobile browsers that may restore the old scroll position after the first render.

```ts
resetInitialScrollPosition({
    top: 0,
    left: 0,
    frameCount: 2,
    manualRestoration: true
});
```

It returns a controller when pending animation-frame resets need to be canceled.

```ts
const reset = resetInitialScrollPosition();

reset.cancel();
```

---
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
- Safe for nested overlays
