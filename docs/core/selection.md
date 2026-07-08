# Selection Module

## Purpose

The Selection module provides reusable single and multiple selection state management for collections.

It is used by listboxes, menus, selects, comboboxes, checkbox groups, radio groups, and other selectable interfaces.

## Public API

### createSelection()

Creates a selection controller for a collection.

```ts
const selection = createSelection({
    getItems: () => options,
    mode: "multiple",
    onSelectionChange: (selectedItems) => {
        console.log(selectedItems);
    }
});

selection.selectItem(option);
selection.toggleItem(option);
selection.clearSelection();
```

---

## Behavior

* Supports single selection
* Supports multiple selection
* Skips disabled items
* Normalizes selection against the current collection
* Preserves collection order for multiple selection
* Notifies when selection changes
* Allows silent updates with notify: false

## Principles

* No framework dependency
* No DOM assumptions
* Selection state is separate from focus
* Reusable across option-based components
