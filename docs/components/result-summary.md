# ResultSummary

ResultSummary turns result counts, visible ranges, and filtered totals into concise human-readable text.

Use it near search results, paginated lists, tables, list/detail screens, lesson catalogs, or any place where users need to understand how much content is currently visible.

## Quick Start

Known total:

```ts
ResultSummary({ total: 42 });
```

Paginated range:

```ts
const summary = ResultSummary({
    page: 3,
    pageSize: 10,
    total: 87
});
```

Filtered result count with polite announcements when the count changes:

```ts
const summary = ResultSummary({
    count: filteredItems.length,
    total: allItems.length,
    live: "polite"
});

summary.update({ count: nextFilteredItems.length });
```

Custom phrasing:

```ts
ResultSummary({
    page: 1,
    pageSize: 5,
    total: 23,
    format(state) {
        return state.start && state.end && state.total
            ? `Lessons ${state.start}-${state.end} of ${state.total}`
            : "No lessons";
    }
});
```

## Behavior

- Renders a small text component with `[data-af-composition="result-summary"]`.
- Uses localized fallback text when `format` is not supplied.
- Can derive a visible range from `page`, `pageSize`, and `total`.
- Can describe filtered results with `count` and `total`.
- Hides itself when custom `format` returns no renderable content.
- Does not create a live region by default.
- Adds `aria-live` only when `live` is set to `"polite"` or `"assertive"`.
- Subscribes to locale changes when the provided locale supports subscriptions.

## Options

Result state:

- `total` - total number of known results. `0` renders the empty message.
- `count` - currently visible or filtered result count.
- `start` - first visible one-based result index. Overrides the derived page start.
- `end` - last visible one-based result index. Overrides the derived page end.
- `page` - current one-based page number used with `pageSize`.
- `pageSize` - number of items per page used with `page`.

Text and localization:

- `format` - custom formatter that receives `ResultSummaryState` and returns composition content.
- `locale` - localization provider for framework-owned fallback text.

Announcements:

- `live` - `"off"`, `"polite"`, or `"assertive"`. Defaults to `"off"`.
- `atomic` - whether live-region updates should be read as one complete message. Defaults to `true`.

Display:

- `variant` - `"default"`, `"muted"`, or `"strong"`.
- `size` - currently `"md"`.

Composition options:

- `className`, `id`, and `attributes` apply to the root element.
- `contentOptions` apply to the internal text slot.

## Runtime

The returned `ComposedResultSummary` exposes:

- `element` - root element.
- `content` - internal content slot element.
- `getState()`.
- `setTotal(total)`.
- `setCount(count)`.
- `setRange(start, end, total?)`.
- `update(options)`.
- `destroy()`.

`setRange(start, end, total?)` updates the explicit visible range. When `total` is omitted, the previous total is preserved.

## Accessibility

Keep ResultSummary quiet by default. Static result summaries should be normal visible text that screen readers encounter when focus or reading mode reaches them.

Use `live: "polite"` when filtering or pagination changes the visible result count without moving focus to a new heading or screen. Avoid announcing the same result update through both ResultSummary and a toast/status message.

Use `format` for application-specific wording, plural rules, or data labels. The built-in fallback text is intentionally small service text; full product copy belongs in the application locale file.

## Styling Hooks

Useful hooks include `[data-af-composition="result-summary"]` and `[data-af-result-summary-content]`.

The component also exposes root `data-af-variant`, `data-af-size`, and `data-af-live` attributes.

## Manual Checks

- Static summaries are visible and readable without requiring a live region.
- Dynamic filtering or pagination announces the updated summary only when `live` is enabled.
- Empty, total-only, filtered, explicit range, and page-derived range states all render sensible text.
- Custom `format` can replace built-in wording without losing the root styling hooks.
- Narrow screens wrap text cleanly without horizontal overflow.
