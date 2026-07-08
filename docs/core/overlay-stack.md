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

### defaultOverlayStack

A shared overlay stack used by default overlay behavior.

```ts
import { defaultOverlayStack } from "@accessible-first/core";
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
