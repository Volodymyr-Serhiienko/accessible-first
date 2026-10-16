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

For top/bottom placement, `start`/`end` follow the anchor's live computed text
direction. Left/right sides retain top/bottom cross-axis alignment. Side names
and numeric offsets remain physical; this is not a vertical-writing layout engine.

Collision bounds use the anchor document's client viewport, excluding scrollbar
space. Window dimensions are the fallback when client dimensions are unavailable.

`state.x/y` are viewport coordinates. For `absolute`, inline `left/top` are
converted to the unscaled offset parent's padding origin, including its border
and scroll offsets; the initial containing block uses document scroll offsets.
The borrowed position/left/top/min-width declarations restore both value and
priority, without erasing unrelated inline edits.

Use an untransformed same-document overlay host. Scaled/rotated/zoomed containing
blocks, transformed fixed ancestors, cross-document anchors and visual-viewport/
virtual-keyboard adjustments are not modeled. Call `update()` after content or
anchor layout changes; auto-update listens to window resize and scrolling, not
arbitrary element resize. CSS owns maximum popup dimensions; shift cannot make
an oversized popup fit. Real-CSS fixtures: `npm run test:styles`, `/geometry.html`.

## Principles

* No framework dependency
* No visual styling assumptions
* Positioning is separate from dismissal and focus management
* Small foundation for overlay components
