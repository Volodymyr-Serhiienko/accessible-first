# Listbox Module

## Purpose

The Listbox module manages accessible option navigation and selection inside a listbox.

It is used for custom selects, combobox popups, multi-select controls, command palettes, and other option-based interfaces.

## Public API

### createListbox()

Creates listbox behavior for an existing listbox element.

```ts
const listbox = createListbox(element, {
    getOptions: () => Array.from(element.querySelectorAll("[role='option']")),
    selectionMode: "single"
});

listbox.selectOption(option);
listbox.clearSelection();
listbox.destroy();
```

---

## Behavior

* Sets role="listbox" on the container
* Sets role="option" on options
* Sets aria-selected on options
* Supports single and multiple selection
* Supports vertical and horizontal orientation
* Uses roving focus for Arrow, Home, and End navigation
* Supports click selection
* Supports Enter and Space selection
* Preserves and restores original attributes on destroy

## Principles

* No framework dependency
* Native focus through the Roving Focus module
* ARIA state through the ARIA module
* Selection state stays centralized
* Small foundation for Select and Combobox components
