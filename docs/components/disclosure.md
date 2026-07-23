# Disclosure Component

## Purpose

The Disclosure component provides an accessible expandable section pattern.

It wraps the core disclosure behavior and adds stable component styling hooks.

## Public API

`announcement` enables optional live-region output when the disclosure opens.

```ts
const disclosure = createDisclosure(root, {
    trigger,
    panel,
    defaultOpen: false,
    announcement: true,
    onOpenChange(open) {
        console.log(open);
    }
});

disclosure.open();
disclosure.close();
disclosure.toggle();
disclosure.destroy();

Disclosure({
    trigger: "Details",
    panel: "Extra information.",
    announcement: {
        message: "Details opened. Extra information is now available.",
        politeness: "polite"
    }
});
```

---

## Behavior

* Connects trigger and panel with aria-controls
* Updates aria-expanded
* Hides and shows the panel with hidden
* Preserves native button behavior when the trigger is a <button>
* Adds fallback button semantics for non-native triggers
* Supports disabled state
* Exposes stable data attributes for styling
* Restores original attributes on destroy
* Can optionally announce panel text when the disclosure opens.

## Manual Testing

### Desktop:

* Tab reaches the disclosure trigger
* Focus indicator is clearly visible
* Enter toggles the disclosure
* Space toggles the disclosure
* aria-expanded updates correctly
* Panel visibility updates correctly
* Disabled disclosure cannot be toggled

### Mobile:

* Tap toggles the disclosure
* Trigger target size is comfortable
* Screen reader announces the trigger as a button
* Screen reader announces expanded or collapsed state
