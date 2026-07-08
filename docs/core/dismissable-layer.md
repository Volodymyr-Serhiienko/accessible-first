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
* Can be activated and deactivated
* Cleans up document listeners on destroy

## Principles

* No framework dependency
* Dismissal is separate from positioning
* Dismissal is separate from focus trapping
* Useful for overlay components and application surfaces
