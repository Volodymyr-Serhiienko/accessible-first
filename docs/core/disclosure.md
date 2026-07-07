# Disclosure Module

## Purpose

The Disclosure module manages the accessible relationship between a trigger and a panel.

It is used for expandable sections, accordion items, simple popovers, and as a foundation for higher-level behavior such as menus, listboxes, and comboboxes.

## Public API

### createDisclosure()

Creates disclosure behavior for a trigger and panel.

```ts
const disclosure = createDisclosure(button, panel, {
    defaultOpen: false
});

disclosure.open();
disclosure.close();
disclosure.toggle();
disclosure.destroy();
```

---

## Behavior

* Sets aria-controls on the trigger
* Sets aria-expanded on the trigger
* Uses the hidden attribute on the panel
* Supports click activation
* Supports Enter and Space for non-native triggers
* Preserves and restores original attributes on destroy

## Principles

* Prefer native button elements as triggers
* No framework dependency
* Native DOM state over custom state where possible
* Small foundation for larger accessible components
