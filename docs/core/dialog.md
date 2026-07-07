# Dialog Module

## Purpose

The Dialog module manages accessible dialog behavior.

It is used for modal dialogs, alert dialogs, confirmations, command panels, and other focused overlay experiences.

## Public API

### createDialog()

Creates dialog behavior for an existing dialog element.

```ts
const dialog = createDialog(dialogElement, {
    labelledBy: titleElement,
    describedBy: descriptionElement
});

dialog.open();
dialog.close();
dialog.destroy();
```

---

## Behavior

* Sets role="dialog" by default
* Supports role="alertdialog"
* Sets aria-modal for modal dialogs
* Supports aria-labelledby and aria-describedby
* Hides and shows the dialog with the hidden attribute
* Traps focus by default for modal dialogs
* Restores focus on close by default
* Closes on Escape by default
* Preserves and restores original attributes on destroy

## Principles

* No framework dependency
* Native DOM state over custom state where possible
* Focus management is handled by the Focus module
* ARIA relationships are handled by the ARIA module
* Small foundation for higher-level overlay components
