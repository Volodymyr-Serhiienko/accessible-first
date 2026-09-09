# Overlay Stack Module

## Purpose

The Overlay Stack module tracks active overlay layers in order.

It is used by dismissable layers, popovers, dropdown menus, dialogs, selects, comboboxes, and command surfaces.

## Public API

### createOverlayStack()

Creates an overlay stack instance.

```ts
const stack = createOverlayStack();

const entry = stack.add(popover);

stack.isTop(entry);
stack.remove(entry);
```

---

### Default behavior

Dismissable layers automatically use a stack owned by their DOM `Document`.
Independent documents, including iframes, therefore do not compete for the
same topmost overlay. Applications normally do not create or configure this
default stack.

Pass an explicit stack only when several custom layers in the same document
need application-owned coordination:

```ts
const stack = createOverlayStack();

createDismissableLayer(element, {
    overlayStack: stack
});
```

---

## Behavior

* Adds overlay entries in activation order
* Tracks the topmost active overlay
* Removes entries on deactivate or destroy
* Supports custom stack instances
* Keeps nested overlays from all dismissing at once

## Principles

* No framework dependency
* Overlay order is separate from positioning
* Overlay order is separate from focus management
* Small foundation for composed overlay components
