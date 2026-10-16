# Dismissable Layer Module

## Purpose

The Dismissable Layer module manages dismissal behavior for temporary UI layers.

It is used by popovers, dropdown menus, selects, comboboxes, command menus, tooltips, and other overlay surfaces.

## Public API

### createDismissableLayer()

Creates dismissal behavior for an overlay element.

```ts
const layer = createDismissableLayer(popover, {
    branches: [button],
    onDismiss: () => {
        popover.hidden = true;
    }
});

layer.deactivate();
layer.activate();
layer.destroy();
```

---

## Behavior

* Dismisses on Escape by default
* Dismisses on pointer down outside by default
* Supports optional focus-outside dismissal
* Supports branches that count as inside the layer
* Allows outside events to prevent dismissal
* Uses the overlay stack by default
* Dismisses only the topmost active layer by default
* Ignores already-handled, IME-composition and Ctrl/Alt/Meta Escape events before
  invoking Escape callbacks or dismissing a layer
* Can be activated and deactivated
* Cleans up document listeners on destroy

Within one stack, only the top layer claims a given outside event, even if stack
order differs from listener registration order or its callback closes that layer.
Coordination itself does not cancel native pointer/focus behavior. Separate
explicit stacks remain independent; `useOverlayStack: false` deliberately opts
out. Do not use separate stacks for overlays that must dismiss as one hierarchy.

Closing/destroying, reactivating or opening a newer layer during an outside/Escape
callback prevents stale fallback dismissal. Dynamic branch resolution also checks
that its original activation still owns the event. These lifecycle guards do not
replace application-owned confirmation or next-focus destinations.

## Principles

* No framework dependency
* Dismissal is separate from positioning
* Dismissal is separate from focus trapping
* Useful for overlay components and application surfaces
