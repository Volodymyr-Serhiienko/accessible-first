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
* Routes Enter and Space activation for non-native triggers through the normal click path
* Preserves and restores original attributes on destroy

Without an explicit disabled option, authored native disabled/ARIA-disabled state
is retained. Teardown restores the exact authored `hidden` token (including
`until-found`) and ignores subsequent setters. Fallback keyboard activation belongs
only to the trigger itself: nested, already handled, modified and composing keys
are not consumed.

Closing with focus inside the panel attempts to focus its trigger before the
change callback; external focus is not moved. If focus handlers destroy the
controller or change state again, the obsolete callback is suppressed. Applications
must select a fallback when the trigger is removed or cannot receive focus.

## Principles

* Prefer native button elements as triggers
* No framework dependency
* Native DOM state over custom state where possible
* Small foundation for larger accessible components
