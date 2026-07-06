# Roving Focus Module

## Purpose

The Roving Focus module manages keyboard focus inside a group of related items.

It keeps one item in the tab order with `tabIndex="0"` and makes the other items programmatically focusable with `tabIndex="-1"`.

This is useful for higher-level components such as tabs, menus, listboxes, toolbars, radio groups, and tree views.

## Public API

### createRovingFocus()

Creates roving focus behavior for a container.

```ts
const rovingFocus = createRovingFocus(container, {
    getItems: () => Array.from(container.querySelectorAll("button")),
    orientation: "horizontal",
    loop: true
});

rovingFocus.activate();
rovingFocus.deactivate();
```

---

## Principles

* Keeps the focused item visible inside scrollable containers
* Uses native focus
* Keeps Tab navigation predictable
* Supports Arrow keys, Home, and End
* Supports horizontal, vertical, and two-axis navigation
* Skips disabled, hidden, inert, and aria-disabled="true" items by default
