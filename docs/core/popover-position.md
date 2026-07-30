# Popover Position Module

## Purpose

The Popover Position module positions a floating element relative to an anchor element.

It is used by popovers, dropdown menus, selects, comboboxes, tooltips, and command surfaces.

## Public API

### createPopoverPosition()

Creates positioning behavior for an anchor and popover element.

```ts
const position = createPopoverPosition(button, popover, {
    side: "bottom",
    alignment: "start",
    offset: 8
});

position.update();
position.destroy();
```

---

## Behavior

* Positions a popover relative to an anchor
* Supports top, right, bottom, and left sides
* Supports start, center, and end alignment
* Supports fixed and absolute positioning
* Supports offset and cross-axis offset
* Supports collision flipping
* Supports viewport shifting
* Supports matching the anchor width
* Updates on window resize and scroll by default
* Restores original inline styles on destroy
* `update()` is a no-op after destroy and returns the last known state

## Principles

* No framework dependency
* No visual styling assumptions
* Positioning is separate from dismissal and focus management
* Small foundation for overlay components
