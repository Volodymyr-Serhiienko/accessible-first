# Collection Module

## Purpose

The Collection module provides small utilities for navigating ordered item lists.

It is used by higher-level behavior such as roving focus, tabs, menus, listboxes, and tree views.

## Public API

### getFirstItem()

Retrieves the first available item from a collection.

```ts
getFirstItem<TItem>(
    items: readonly TItem[],
    options: CollectionNavigationOptions<TItem> = {}
): TItem | null
```

---

### getLastItem()

Retrieves the last available item from a collection by searching backwards.

```ts
getLastItem<TItem>(
    items: readonly TItem[],
    options: CollectionNavigationOptions<TItem> = {}
): TItem | null
```

---

### getNextItem()

Retrieves the next available item in a collection relative to the current item.
Supports wrapping around to the beginning if the `loop` option is enabled.

```ts
getNextItem<TItem>(
    items: readonly TItem[],
    currentItem: TItem | null | undefined,
    options: CollectionNavigationOptions<TItem> = {}
): TItem | null
```

---

### getPreviousItem()

Retrieves the previous available item in a collection relative to the current item.
Supports wrapping around to the end if the `loop` option is enabled.

```ts
getPreviousItem<TItem>(
    items: readonly TItem[],
    currentItem: TItem | null | undefined,
    options: CollectionNavigationOptions<TItem> = {}
): TItem | null
```

---

### getItemIndex()

Finds the index of a specific item within an array.

```ts
getItemIndex<TItem>(
    items: readonly TItem[],
    item: TItem | null | undefined
): number
```

---

### isItemAvailable()

Checks if a specific item is available for navigation based on the provided options.

```ts
isItemAvailable<TItem>(
    item: TItem,
    options: CollectionNavigationOptions<TItem> = {}
): boolean
```

---

## Principles

- Framework independent
- No DOM assumptions
- Works with any item type
- Supports disabled item filtering
- Supports optional loop navigation
