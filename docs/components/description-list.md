# DescriptionList

DescriptionList provides a semantic native description list for key-value information, summaries, metadata, and read-only review screens.

## When To Use

Use `DescriptionList` when content is naturally a list of terms and related descriptions: account facts, settings summaries, contact details, component metadata, or form review pages.

Use tables for tabular data with multiple comparable columns. Use `FieldGroup` and form controls when the user edits the values.

## Quick Start

Minimal description list:

```ts
DescriptionList({
    items: [
        { term: "Status", details: "Ready" },
        { term: "Owner", details: "Accessibility team" }
    ]
});
```

Inline layout:

```ts
DescriptionList({
    layout: "inline",
    items: [
        { term: "Theme", details: "System" },
        { term: "Contrast", details: "High" }
    ]
});
```

Rich content:

```ts
DescriptionList({
    items: [
        {
            term: "Documentation",
            details: Link({ text: "Open component docs", href: "/docs" })
        },
        {
            term: "Checks",
            details: [
                "Keyboard, screen reader, mobile"
            ]
        }
    ]
});
```

## Layers

- Composition API: `DescriptionList(options)`
- Reuses: native `<dl>`, `<dt>`, and `<dd>` semantics

## Behavior

- Renders a native description list.
- Keeps each item as a term and details pair.
- Supports stacked and inline visual layouts.
- Does not add keyboard behavior because the list is static semantic content.
- Exposes stable data attributes for styling.

## Options

- `items` - Required list of term/details items.
- `layout` - `"stacked"` or `"inline"`. Defaults to `"stacked"`.
- `variant` - `"default"` or `"plain"`.
- `size` - `"md"`.
- `itemOptions` - Common DOM options for the item wrapper.
- `termOptions` - Common DOM options for a term.
- `detailsOptions` - Common DOM options for details.
- common composition options from [foundation.md](./foundation.md#common-composition-options).

Item options:

- `term` - Required term content.
- `details` - Required details content.
- `itemOptions` - Common DOM options for one item wrapper.
- `termOptions` - Common DOM options for one item term.
- `detailsOptions` - Common DOM options for one item details.

## Update Notes

```ts
const summary = DescriptionList({
    items: [
        { term: "Status", details: "Draft" }
    ]
});

summary.setItems([
    { term: "Status", details: "Ready" },
    { term: "Updated", details: "Today" }
]);

summary.update({
    layout: "inline"
});
```

## Styling

Useful hooks include `[data-af-composition="description-list"]`, `[data-af-description-list-item]`, `[data-af-description-list-term]`, `[data-af-description-list-details]`, `[data-af-layout]`, `[data-af-variant]`, and `[data-af-size]`.

```ts
DescriptionList({
    className: "account-summary",
    items: [...]
});
```

## Manual Checks

- Screen readers expose the content as a description list or understandable term/details content.
- Term and details order is logical.
- Inline layout wraps cleanly on small screens.
- Links or other interactive content inside details remain reachable and named.
- Text contrast is readable in light and dark themes.
