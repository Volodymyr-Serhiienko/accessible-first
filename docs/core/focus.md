# Focus Module

## Purpose

The Focus module provides utilities for managing keyboard focus.

Keyboard accessibility is one of the foundations of accessible user interfaces. Many components depend on reliable focus management, including dialogs, menus, comboboxes, tabs, and tree views.

The goal of this module is to provide simple, framework-independent primitives for working with focus.

---

## Principles

* Accessibility first.
* Native browser behavior first.
* Framework independent.
* Predictable and reliable APIs.
* No external dependencies.
* Progressive enhancement.

---

## Public API

### getFocusableElements()

Returns all focusable elements inside a container.

```ts
getFocusableElements(container: HTMLElement): HTMLElement[]
```

---

### hasFocusableElements()

Returns true if the container contains focusable elements.

```ts
hasFocusableElements(container: HTMLElement): boolean
```

---

### containsFocus()

Returns true if the current focus is inside the container.

```ts
containsFocus(container: HTMLElement): boolean
```

---

### focusElement()

Moves focus to a specific element.

```ts
focusElement(element: HTMLElement | null): boolean
```

Returns false if the element is null.

---

### focusFirst()

Moves focus to the first focusable element inside a container.

```ts
focusFirst(container: HTMLElement): boolean
```

---

### focusLast()

Moves focus to the last focusable element inside a container.

```ts
focusLast(container: HTMLElement): boolean
```

---

### restoreFocus()

Restores focus to a previously focused element.

```ts
restoreFocus(element: HTMLElement | null): boolean
```

---

### isFocusable()

Checks whether an element can receive focus.

```ts
isFocusable(element: HTMLElement): boolean
```

---

### createFocusTrap()

Creates a focus trap inside a container.

```ts
const trap = createFocusTrap(container);

trap.activate();
trap.deactivate();

trap.pause();
trap.resume();

trap.isActive();
```

---

## Typical use cases

The Focus module is used internally by:

* Dialog
* Menu
* Popover
* Combobox
* Tabs
* TreeView
* Command Palette

---

## Future improvements

Planned enhancements include:

* nested focus traps
* focus stack management
* support for inert elements
* support for hidden elements based on computed styles
* focus-visible utilities
* autofocus strategies
* advanced focus restoration
* shadow DOM support

---

## Philosophy

Components are built from primitives.

The Focus module provides the foundation for higher-level accessible components and aims to make keyboard accessibility predictable and easy to implement.
