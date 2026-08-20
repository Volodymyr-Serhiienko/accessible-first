# ListDetail

ListDetail creates a responsive list/detail application pattern.

Use it inside `Screen`, `PageOutlet`, or `AppShell` when a user selects an item from one area and reads or edits the selected item in another area.

## Quick Start

```ts
const view = ListDetail({
    listLabel: "Lessons",
    detailLabel: "Lesson details",
    list: LessonList(),
    detail: LessonSummary()
});
```

With an empty detail state:

```ts
ListDetail({
    listLabel: "Vocabulary sets",
    detailLabel: "Vocabulary set details",
    list: VocabularySetList(),
    empty: EmptyState({
        title: "Choose a set",
        description: "Select a vocabulary set to see its words and progress."
    })
});
```

## Purpose

List/detail screens are common in real applications:

- lesson lists and lesson details;
- vocabulary sets and selected words;
- inbox or notification lists;
- settings categories;
- admin dashboards;
- search results and selected result details.

The pattern is domain-neutral: the same structure can support learning apps, CRM records, admin resources, product catalogs, document libraries, inboxes, and dashboards.

`ListDetail` intentionally does not own selection state. Use `Listbox`, `Navigation`, `SearchBox`, `RouteSearchBox`, or application state for selection. `ListDetail` owns the stable responsive structure and semantic areas.

## Accessibility

The component creates two named `section` areas:

- list area, labelled by `listLabel`;
- detail area, labelled by `detailLabel`.

This helps screen-reader users understand where they are when focus moves between the selector and the selected content.

`focus("list")` and `focus("detail")` use programmatic focus. The areas are not added to the normal Tab order.

When `detail` is empty and `empty` is provided, the detail area shows the empty state. This is useful for first-load screens where no item has been selected yet.

## Options

- `list` - required list/sidebar content.
- `detail` - selected item details.
- `empty` - fallback content shown when `detail` is empty.
- `listLabel` - accessible name for the list area. Defaults to `"Items"`.
- `detailLabel` - accessible name for the detail area. Defaults to `"Details"`.
- `orientation` - `"auto"`, `"horizontal"`, or `"vertical"`. Defaults to `"auto"`.
- `variant` - `"default"` or `"plain"`.
- `size` - currently `"md"`.
- `listWidth` - CSS length for the list column, such as `"18rem"`.
- `defaultFocusTarget` - `"list"` or `"detail"`.
- `listOptions` - DOM options for the list area.
- `detailOptions` - DOM options for the detail area.
- `emptyOptions` - DOM options for the empty slot.

## Methods

- `setList(content)` - replaces the list area content.
- `setDetail(content)` - replaces selected detail content.
- `setEmpty(content)` - replaces fallback empty content.
- `getFocusTarget(target)` - returns the resolved focus target element.
- `focus(target, options)` - focuses the list or detail area programmatically.
- `update(options)` - updates runtime-safe options.
- `destroy()` - disposes internal slots.

## Styling

Useful hooks include:

- `[data-af-composition="list-detail"]`
- `[data-af-list-detail-list]`
- `[data-af-list-detail-detail]`
- `[data-af-list-detail-content]`
- `[data-af-list-detail-empty]`
- `[data-af-orientation]`
- `[data-af-variant]`
- `[data-af-size]`

The component uses CSS custom properties:

- `--af-list-detail-gap`
- `--af-list-detail-list-width`
- `--af-list-detail-panel-padding`

## Manual Checks

- The list and detail areas have meaningful accessible names.
- Keyboard focus can move through controls inside the list and detail areas in a logical order.
- Programmatic focus after selection lands on the intended area.
- Empty state is understandable before an item is selected.
- On small screens, the list and detail areas stack without horizontal overflow.
- Existing selection components keep their own keyboard behavior and visible focus state.