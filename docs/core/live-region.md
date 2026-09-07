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

Creates an isolated announcer with both polite and assertive live regions.

```ts
const announcer = createAnnouncer();

announcer.announce("Saved");
announcer.announce("Connection lost", {
    politeness: "assertive"
});

announcer.destroy();
```

Use this low-level API when a caller deliberately needs isolated delivery.
Ordinary application and component feedback should normally use an
announcement channel or the higher-level helpers below.

---

### createDocumentAnnouncementChannel()

Creates a source-owned channel that coordinates delivery with other Accessible
First channels in the same browser document.

```ts
const feedback = createDocumentAnnouncementChannel();

feedback.announce("Draft saved.");
feedback.announce("Connection lost.", {
    politeness: "assertive"
});

feedback.destroy();
```

The framework shares one polite/assertive live-region pair per document. A
channel can clear only its own active message, so a component cleanup cannot
remove a newer announcement emitted by another framework source. Repeated
messages remain supported by the underlying live-region engine.

For application-level action feedback, prefer `createActionAnnouncer()`. Form
and field validation already use coordinated delivery by default.

---

## Principles

* No framework dependency
* Uses native ARIA live regions
* Supports polite and assertive announcements
* Coordinates ordinary framework feedback at document scope
* Keeps low-level isolated delivery available when it is genuinely needed
* Useful for dynamic accessible interfaces
