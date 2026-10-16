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
* Without a Tab trap, captures a fresh opener on each opening and restores it
  only while focus is still inside; external workflows retain their focus
* Closes on Escape by default
* Leaves handled, IME-composition and Ctrl/Alt/Meta Escape events to their owner;
  a nested dialog's handled Escape does not also close its parent
* Preserves and restores original attributes on destroy
* A newer transition triggered by focus wins over an older open/close operation;
  stale callbacks do not hide a reopened dialog or notify a destroyed one
* Destruction finishes attribute restoration even if focus restoration throws,
  then rethrows the first cleanup failure

If the opener has been removed, hidden or disabled, restoring focus may fail.
The application owns the next workflow destination; this module does not guess
another control or observe arbitrary DOM removal. `restoreFocus: false` opts out.

## Principles

* No framework dependency
* Native DOM state over custom state where possible
* Focus management is handled by the Focus module
* ARIA relationships are handled by the ARIA module
* Small foundation for higher-level overlay components
