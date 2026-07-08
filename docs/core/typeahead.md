# Typeahead Module

## Purpose

The Typeahead module provides reusable character-based navigation for collections.

It is used by listboxes, menus, selects, comboboxes, command menus, and other option-based interfaces.

## Public API

### createTypeahead()

Creates a typeahead controller for a collection.

```ts
const typeahead = createTypeahead({
    getItems: () => options,
    getItemText: (option) => option.textContent ?? "",
    onMatch: (option) => {
        option.focus();
    }
});

typeahead.handleKey(event, currentOption);
typeahead.destroy();
```

---

## Behavior

* Collects printable character input into a temporary search query
* Resets the query after a timeout
* Skips disabled items
* Searches from the current item forward
* Supports repeated-character cycling
* Calls onMatch when an item matches

## Principles

* No framework dependency
* No DOM assumptions about item structure
* Reusable across listbox, menu, select, and combobox
* Keeps text navigation separate from selection logic
