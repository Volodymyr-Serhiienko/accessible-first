# Tabs Module

## Purpose

The Tabs module manages accessible tab navigation between a tablist, tabs, and tab panels.

It combines roving focus, ARIA relationships, keyboard navigation, and panel visibility into a small framework-independent behavior.

## Public API

### createTabs()

Creates tabs behavior for an existing tablist.

```ts
const tabs = createTabs(tablist, {
    getTabs: () => Array.from(tablist.querySelectorAll("[role='tab']")),
    getPanel: (tab) => document.getElementById(tab.dataset.panelId ?? "")
});

tabs.setCurrentTab(firstTab);
tabs.refresh();
tabs.destroy();
```

---

## Behavior

* Sets role="tablist" on the tablist
* Sets role="tab" on tabs
* Sets role="tabpanel" on panels
* Sets aria-selected on tabs
* Sets aria-controls from tabs to panels
* Sets aria-labelledby from panels to tabs
* Hides inactive panels with the hidden attribute
* Uses roving focus for Arrow, Home, and End navigation
* Supports automatic and manual activation modes

## Principles

* No framework dependency
* Native focus through the Roving Focus module
* ARIA relationships through the ARIA module
* Hidden panels use native DOM state
* Small foundation for higher-level tab components
