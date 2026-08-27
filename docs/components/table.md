# Table

Table creates a native, responsive table for structured row and column data.

Use it for real tabular information: vocabulary lists, lesson progress, settings summaries, reports, and admin-style data. Do not use it for page layout.

## Quick Start

```ts
Table({
    caption: "Vocabulary review queue",
    description: "Use row headers for the primary item in each row.",
    columns: [
        { id: "word", header: "Word", rowHeader: true },
        { id: "translation", header: "Translation" },
        { id: "due", header: "Due" }
    ],
    rows: [
        { word: "hello", translation: "привіт", due: "Today" },
        { word: "window", translation: "вікно", due: "Tomorrow" }
    ]
});
```

With custom cells:

```ts
Table({
    caption: "Practice queue",
    columns: [
        { id: "word", header: "Word", rowHeader: true },
        {
            id: "status",
            header: "Status",
            cell(row) {
                return Badge({ text: row.status, variant: row.variant });
            }
        },
        {
            id: "action",
            header: "Action",
            cell(row) {
                return Button({ text: `Practice ${row.word}` });
            }
        }
    ],
    rows
});
```

When the page already has a visible heading, keep the table caption available to assistive technologies:

```ts
Table({
    caption: "Account facts",
    captionDisplay: "visually-hidden",
    columns,
    rows
});
```

## Layers

- Composition API: `Table(options)`
- Uses: native `<table>`, `<caption>`, `<thead>`, `<tbody>`, `<th>`, `<td>`
- Styling: framework table tokens and optional horizontal scroll wrapper

## Behavior

- Keeps native table semantics instead of replacing rows with generic grids.
- Requires application-owned `caption` content so tables have a meaningful accessible name.
- Associates optional `description` with the table through `aria-describedby`.
- Uses native column headers with `scope="col"`.
- Uses `rowHeader: true` columns as native row headers with `scope="row"`.
- Renders object row values by matching `column.id` when a column does not provide `cell(...)`.
- Allows custom cell renderers for badges, buttons, progress, links, and composed content.
- Shows an application-owned `emptyState` row when rows are empty. No default text is generated.
- Wraps wide tables in a responsive horizontal scroller by default so the page itself does not overflow on small screens.

## Options

- `caption` - required accessible caption content.
- `columns` - required column definitions.
- `rows` - required row data.
- `description` - optional supporting content connected with `aria-describedby`.
- `emptyState` - optional content shown as a single full-width row when `rows` is empty.
- `captionDisplay` - `"visible"` or `"visually-hidden"`. Defaults to `"visible"`.
- `descriptionDisplay` - `"visible"` or `"visually-hidden"`. Defaults to `"visible"`.
- `variant` - `"default"`, `"plain"`, or `"striped"`. Defaults to `"default"`.
- `size` - `"md"`.
- `responsive` - `"scroll"` or `"none"`. Defaults to `"scroll"`.
- `getRowKey` - optional resolver used to set `data-af-row-key` for diagnostics or styling.
- `tableOptions`, `captionOptions`, `descriptionOptions`, `headOptions`, `bodyOptions`, `rowOptions`, `emptyCellOptions` - common composition options for internal elements.
- common composition options from [foundation.md](./foundation.md#common-composition-options).

Column options:

- `id` - stable column id. Also used as the object property name when `cell` is omitted.
- `header` - column header content.
- `cell` - optional renderer called with `(item, context)`.
- `rowHeader` - renders body cells in this column as `<th scope="row">`.
- `align` - `"start"`, `"center"`, or `"end"`.
- `headerOptions` - common composition options for the header cell.
- `cellOptions` - common composition options or a resolver for body cells.

## Methods

```ts
const table = Table({ caption, columns, rows });

table.setRows(nextRows);
table.setColumns(nextColumns);
table.setDescription("Updated guidance");
table.setEmptyState("No results");
table.update({ variant: "striped" });
table.destroy();
```

## Styling

Useful hooks include `[data-af-composition="table"]`, `[data-af-table-viewport]`, `[data-af-table]`, `[data-af-table-caption]`, `[data-af-table-description]`, `[data-af-table-head]`, `[data-af-table-body]`, `[data-af-table-header-cell]`, `[data-af-table-row]`, `[data-af-table-cell]`, and `[data-af-table-empty-cell]`.

Use `--af-table-min-inline-size` on the table root to tune when horizontal scrolling begins:

```css
.my-table {
    --af-table-min-inline-size: 48rem;
}
```

## Accessibility

Use real tables only for real tabular relationships. If the content is a set of cards or actions without row/column meaning, use `InfoCard`, `ListDetail`, `DescriptionList`, or layout primitives instead.

Prefer one row-header column when each row has a primary item. This makes screen-reader table navigation much clearer.

Focusable controls inside cells remain in normal Tab order. Keep their labels row-specific, for example `Practice hello`, not only `Practice`.

Descriptions should explain how to interpret the table, not repeat the caption or every visible column header. Use `descriptionDisplay: "visually-hidden"` when the guidance is useful for screen-reader users but visually redundant.

## Manual Checks

- The table is announced with its caption.
- Optional description is announced when entering table navigation, without repeating visible page text too aggressively.
- Column headers and row headers are announced correctly by the screen reader.
- Focusable controls inside cells have clear labels.
- Empty state is visible and spans all columns.
- On small screens, the table scrolls inside its own viewport and does not create page-level horizontal overflow.
