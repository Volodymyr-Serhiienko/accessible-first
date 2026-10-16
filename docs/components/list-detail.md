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

For list/detail workflows, application code should provide a clear focus route after selection. A common pattern is:

- select an item in the list;
- update the detail area;
- move focus to `listDetail.focus("detail")` or a specific heading inside the detail area;
- provide a visible action in the detail area that returns focus to the selected list item.

Use `FocusRoute` when the target appears after rendering or when the flow needs scrolling and fallback focus.

When `detail` is empty and `empty` is provided, the detail area shows the empty state. This is useful for first-load screens where no item has been selected yet.

## Speech And Localization

`ListDetail` does not use a live region and does not announce selection changes by itself. Selection components, route helpers, toast/status feedback, or application code should decide when a selection needs a spoken confirmation.

The list and detail areas are programmatic focus targets, not regular Tab stops. When application code moves focus to one of those areas, the area name should orient the user without forcing repeated descriptions while they continue through the controls inside the area.

Prefer specific localized `listLabel` and `detailLabel` values in real applications.
Generic fallback names use the shared `locale` provider.

## Options

- `list` - required list/sidebar content.
- `detail` - selected item details.
- `empty` - fallback content shown when `detail` is empty.
- `listLabel` - accessible name for the list area. Prefer a specific localized label such as `"Projects"` or `"Lessons"`.
- `detailLabel` - accessible name for the detail area. Prefer a specific localized label such as `"Project details"` or `"Lesson details"`.
- `locale` - shared provider for generic list/detail fallback labels.
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

Slots own composed children and keep those retained by object identity. Do not
share one controller across multiple slots. A newer update/destroy from child
cleanup cancels the remaining steps of an older combined update; untouched,
unprocessed slot content is not transferred into ownership. There is no transactional
rollback. Cleanup failures still allow the other requested slots and final visibility
synchronization to finish when no newer update intervenes, then the first error is
rethrown.

Destroy attempts all slots, the locale unsubscribe and focus-attribute restoration,
even after a failure. Repeated destroy and late mutations are inert; `focus()` returns
`false` after destruction. Getters still expose the retained DOM. Content replacement
does not automatically move focus; selection and fallback destinations stay app-owned.
Long text wraps inside both areas without widening the auto layout.

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

The list width is capped at half the available inline space, leaving room for
details even inside a narrow panel on a wide desktop viewport. Both columns and
the detail content grid can shrink. `orientation: "auto"` stacks below the `48rem`
viewport breakpoint; `"horizontal"` deliberately retains two columns. Choose
`"vertical"` for a narrow embedded workflow that should always stack. Fixed-width
children still require their own responsive sizing or scrolling.

## Manual Checks

- The list and detail areas have meaningful accessible names.
- Keyboard focus can move through controls inside the list and detail areas in a logical order.
- Programmatic focus after selection lands on the intended area.
- Empty state is understandable before an item is selected.
- On small screens, the list and detail areas stack without horizontal overflow.
- Existing selection components keep their own keyboard behavior and visible focus state.

