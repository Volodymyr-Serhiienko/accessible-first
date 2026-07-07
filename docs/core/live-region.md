# Live Region Module

## Purpose

The Live Region module provides small utilities for announcing dynamic changes to assistive technologies.

It is used by higher-level behavior such as dialogs, menus, listboxes, comboboxes, forms, validation, async loading states, and application notifications.

## Public API

### createLiveRegion()

Creates a visually hidden live region element.

```ts
const liveRegion = createLiveRegion({
    politeness: "polite"
});

liveRegion.announce("Saved");
liveRegion.clear();
liveRegion.destroy();
```

---

### createAnnouncer()

Creates an announcer with both polite and assertive live regions.

```ts
const announcer = createAnnouncer();

announcer.announce("Saved");
announcer.announce("Connection lost", {
    politeness: "assertive"
});

announcer.destroy();
```

---

## Principles

* No framework dependency
* Uses native ARIA live regions
* Supports polite and assertive announcements
* Keeps announcement logic centralized
* Useful for dynamic accessible interfaces
