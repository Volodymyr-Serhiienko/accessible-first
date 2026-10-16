# Menu Module

## Purpose

The Menu module manages accessible menu navigation.

It is used for application menus, dropdown menus, command menus, and action lists.

## Public API

### createMenu()

Creates menu behavior for an existing menu element.

```ts
const menu = createMenu(element, {
    getItems: () => Array.from(element.querySelectorAll("[role='menuitem']")),
    onSelect: (item) => {
        console.log(item);
    },
    onClose: () => {
        element.hidden = true;
    }
});

menu.refresh();
menu.destroy();
```

---

## Behavior

* Sets role="menu" on the container
* Sets role="menuitem" on items
* Reflects a supplied logical-disabled callback through aria-disabled, without
  turning temporary hiding or pre-mount layout into a permanent disabled flag
* Uses roving focus for Arrow, Home, and End navigation
* Supports optional typeahead navigation
* Supports Enter and Space activation
* Supports Escape close callback
* Preserves and restores original attributes on destroy

Runtime availability, live RTL arrows, pre-mount defaults and keyboard ownership
follow [Roving Focus](roving-focus.md). `refresh()` immediately restores/releases
removed items' borrowed attributes; focus repair after removing the focused item
remains application-owned.

## Principles

* No framework dependency
* Native focus through the Roving Focus module
* Typeahead through the Typeahead module
* Menu navigation is separate from popover positioning
* Small foundation for dropdown and application menus
