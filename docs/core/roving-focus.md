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
* Skips disabled, hidden, inert and unavailable items when the collection is rendered
* `refresh()` is a no-op while the roving focus instance is inactive

## Ownership And Dynamic Items

Native focus on a registered item updates the current item and the single Tab
stop. `setCurrentItem()` rejects elements not returned by `getItems()`.
On `refresh()`, items removed from that collection regain their captured
tabindex immediately; the controller no longer owns later changes to them.
Deactivation restores the remaining items' original attributes.

Keyboard navigation belongs only to events originating on a registered item.
Editable descendants, nested widgets and the container itself keep their own
keys. Already-handled events, IME composition and Ctrl/Alt/Meta chords are
ignored; Shift does not disable ordinary navigation.

Horizontal arrows follow the container's computed `direction`, read on each
key: Left/Right are mirrored for RTL, including inherited direction and locale
changes. Up/Down, Home/End and imperative `moveNext`/`movePrevious` retain logical
collection order. This assumes ordinary DOM order along the inline axis; custom
CSS `order`, row-reverse, vertical writing modes and spatial grids need their own
navigation contract. Orientation `both` is still a linear list, not a grid engine.

`isItemDisabled` supplies logical disabled state, replacing the default native/
ARIA-disabled flag. It no longer bypasses native focus availability in a rendered
collection. Hidden, inert, detached and native-disabled targets cannot be focused
even when a custom predicate returns false. Before mounting, or while the whole
collection is hidden, logical defaults and the future Tab stop are retained;
an explicit focus request still fails without changing current state.

`refresh()` recalculates the rendered Tab stop but does not intentionally move
focus. Applications removing the focused item must choose a meaningful next focus
target; the helper does not watch every external DOM mutation. Filtering is not
logical deselection: Listbox keeps hidden selected values until a user action or
explicit logical-disabled/selection update changes them.
