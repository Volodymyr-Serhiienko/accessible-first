# SearchBox

SearchBox is a search-oriented combobox for finding and selecting one result from a known list.

It is built on `Combobox`, so it reuses the same accessible input, listbox popup, keyboard behavior, filtering, not-found state, and screen reader semantics.

## When To Use

Use `SearchBox` for page/demo search, site section search, settings search, command-like navigation search, and small application search where results are already available in memory.

Use `Combobox` directly when the field is a normal form input with suggestions. Use a future async search pattern when results need to be loaded from a server.

## Quick Start

```ts
SearchBox({
    label: "Search components",
    placeholder: "Type a component name",
    notFoundText: "No matching components found.",
    items: [
        { id: "button", label: "Button", keywords: ["action", "press"] },
        { id: "dialog", label: "Dialog", keywords: ["modal", "overlay"] },
        { id: "tabs", label: "Tabs", keywords: ["tabpanel", "sections"] }
    ],
    onSelect(detail) {
        console.log(detail.item.id);
    }
});
```

Header-sized search:

```ts
SearchBox({
    label: "Search app",
    placeholder: "Search",
    width: "14rem",
    items: searchItems
});
```

With descriptions:

```ts
SearchBox({
    label: "Search demos",
    items: [
        {
            id: "forms",
            label: "Forms",
            description: "Validation, reset, field registration, and submit behavior.",
            keywords: ["text field", "required", "email"]
        }
    ]
});
```

## Layers

- Composition API: `SearchBox(options)`
- Reuses: `Combobox`, search text normalization, and composition content for result rows

## Behavior

- Opens and filters results using the underlying `Combobox`.
- Searches result label, description, and keywords.
- Shows a not-found result when configured.
- Keeps the input value readable by using each result label as the selected text.
- Calls `onQueryChange` when the input text changes.
- Calls `onSelect` when a result is selected.

## Options

- `items` - Required search result definitions.
- `label` - Visible input label.
- `placeholder` - Native input placeholder.
- `notFoundText` - Message shown when no result matches.
- `filterItem` - Optional custom filter for result matching.
- `width` - Optional preferred CSS length for normal component assembly, such as `"14rem"`. Use this first for headers.
- `minWidth` - Optional advanced CSS length for the compact width floor. Defaults to the component stylesheet.
- `maxWidth` - Optional advanced CSS length for the width ceiling. Defaults to the component stylesheet.
- `onQueryChange` - Called when the query or selected result changes.
- `onSelect` - Called when a result is selected.
- most combobox options from [combobox.md](./combobox.md).
- common composition options from [foundation.md](./foundation.md#common-composition-options).

Item options:

- `id` - Stable result id and selected value.
- `label` - Main result label and selected input text.
- `description` - Optional secondary text shown in the popup.
- `keywords` - Extra searchable words.
- `disabled` - Disables one result.
- `data` - Optional application data carried with the result.
- `optionOptions` - Common DOM options for the result option.

## Styling

SearchBox owns a responsive width by default. Prefer `width` for normal component assembly, especially in headers. Use `minWidth` and `maxWidth` only when a field should flex inside a range. Use CSS variables only for lower-level styling overrides:

- `--af-search-box-min-width` - default compact width floor.
- `--af-search-box-max-width` - default width ceiling.
- `--af-search-box-preferred-width` - internal responsive fallback width, defaulting to a `clamp(...)` between the min and max values.
- `--af-search-box-width` - preferred width set by the `width` option.

## Update Notes

Use `setItems()` when the whole result list changes:

```ts
const search = SearchBox({
    label: "Search",
    items: initialItems
});

search.setItems(nextItems);
```

Use `update({ items })` only for partial item updates matched by index.

## Manual Checks

- Input label is announced.
- Focus opens the result popup.
- Typing filters by label, description, and keywords.
- Not-found text appears and is announced when no result matches.
- Arrow keys move through results.
- Enter selects the active result.
- Selecting a result calls `onSelect`.
- Popup stays within the viewport on small screens.
