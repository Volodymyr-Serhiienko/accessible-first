# OverflowScroller

OverflowScroller wraps wide inline content in a controlled scroll area with optional previous and next buttons.

It is intended for long navigation rows, tabs, toolbars, and similar horizontal patterns where native horizontal scrollbars are visually noisy or can clip focus indicators.

## When To Use

Use `OverflowScroller` when content should stay on one line and remain reachable with keyboard, mouse, touch, and small screens.

Do not use it to hide important page content. Prefer normal wrapping when wrapping keeps the layout clear.

## Quick Start

```ts
OverflowScroller({
    label: "Page sections",
    children: [
        Navigation({
            items: [
                { label: "Buttons", href: "#buttons" },
                { label: "Forms", href: "#forms" },
                { label: "Dialogs", href: "#dialogs" }
            ]
        })
    ]
});
```

## Layers

- Composition API: `OverflowScroller(options)`
- Reuses: native buttons, native scroll behavior, composition slots, and reduced-motion aware scrolling

## Behavior

- Keeps the inner content on one inline scroll track.
- Shows previous and next controls only when content overflows by default.
- Disables the previous control at the start and the next control at the end.
- Preserves keyboard access to focusable content inside the scroller.
- Gives focus indicators extra scroll padding so edge items are not clipped.
- Scrolls the still-focused descendant into the padded viewport; content wider than the viewport cannot fit completely.
- Updates control state on scroll, resize, and content changes.

## Options

- `children` - Content placed inside the scroll track.
- `label` - Optional accessible group label for the scroller.
- `previousLabel` - Accessible label for the previous button. Defaults to `"Scroll backward"`.
- `nextLabel` - Accessible label for the next button. Defaults to `"Scroll forward"`.
- `locale` - Optional provider for these service labels; explicit labels override it.
- `controls` - `"auto"`, `"always"`, or `"none"`. Defaults to `"auto"`.
- `scrollAmount` - `"page"` or a pixel number. Defaults to `"page"`.
- `viewportOptions` - Common composition options for the scroll viewport.
- `contentOptions` - Common composition options for the inner content track.
- `previousButtonOptions` - Common composition options for the previous button.
- `nextButtonOptions` - Common composition options for the next button.
- common composition options from [foundation.md](./foundation.md#common-composition-options).

## Styling

Previous/next follow logical inline order: RTL uses negative `scrollLeft`, reverses
movement and arrow glyphs, and retains logical labels. The obsolete positive RTL
scroll models of legacy engines are not supported. Call `refresh()` after changing
inherited direction without a resize, scroll or content update.

Arrow corners use physical borders, with direction applied once by rotation.
They point along the inline axis in both LTR and RTL rather than turning vertical.

`destroy()` is terminal, cancels timers/frames, disconnects the owner-window resize
observer and finishes all owned cleanup after an error. Late updates, scrolling
and refresh are inert; `isDestroyed()` reports the state. A queued focus scroll
does not follow an element after focus has moved elsewhere.

Useful hooks include `[data-af-composition="overflow-scroller"]`, `[data-af-overflow-scroller-viewport]`, `[data-af-overflow-scroller-content]`, `[data-af-overflow-scroller-button]`, and `[data-af-overflow-scroller-direction]`.

The default styles hide the browser scrollbar and expose arrow buttons when scrolling is possible. Projects can override the hooks when they need visible scrollbars or different button placement.

## Manual Checks

- Long content remains in one row on desktop.
- Previous and next buttons appear only when needed.
- Buttons are disabled at the correct edges.
- Tab reaches links, tabs, or toolbar controls inside the scroller.
- Focus indicators are not clipped on the first and last item.
- Focused edge items are fully visible and do not remain hidden near scroll controls.
- Touch scrolling still works on mobile and tablet devices.
