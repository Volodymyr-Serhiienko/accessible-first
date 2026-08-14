# Badge

Badge provides a compact, accessible visual label for status, category, count, or metadata.

It is a small page-building component for cards, lists, search results, settings summaries, dashboards, and future application screens.

## When To Use

Use `Badge` when short text needs to stand out without becoming an action.

Common places:

- lesson status such as New, Ready, Completed, or Due;
- item category labels;
- counts such as 12 words or 3 errors;
- form or settings metadata;
- feature flags such as Beta;
- search result labels.

Use `Button` or `Link` when the item is interactive. Do not make a badge clickable by itself.

## Quick Start

Minimal badge:

```ts
Badge({ text: "New" });
```

Status badge:

```ts
Badge({
    text: "Ready",
    variant: "success"
});
```

Badge with an accessible label:

```ts
Badge({
    text: "12",
    accessibleLabel: "12 words",
    variant: "info"
});
```

Badge with an icon:

```ts
Badge({
    icon: Icon({
        path: "M5 13l4 4L19 7",
        decorative: true
    }),
    text: "Completed",
    variant: "success"
});
```

## Layers

- Composition API: `Badge(options)`
- Reuses: native inline elements, composition slots, optional visually hidden accessible label
- Does not add keyboard behavior because the badge is static content

## Behavior

- Renders a compact static label.
- Provides status/category color variants while keeping meaning in text.
- Supports optional decorative icon content.
- Supports `accessibleLabel` when the visible text is abbreviated.
- Does not rely on color alone to communicate meaning.
- Does not create live announcements. Use live regions, `Toast`, or `PageOutlet` announcements for dynamic status changes.
- Exposes stable data attributes for styling.

## Options

- `text` - Visible text content.
- `children` - Rich content alternative to `text`.
- `icon` - Optional icon or media content. Treat badge icons as decorative and include meaning in text.
- `iconPosition` - `"start"` or `"end"`. Defaults to `"start"`.
- `variant` - `"neutral"`, `"info"`, `"success"`, `"warning"`, or `"danger"`. Defaults to `"neutral"`.
- `size` - `"md"`.
- `accessibleLabel` - Optional screen-reader label used when the visible text is abbreviated.
- `iconOptions` - Common DOM options for the icon slot.
- `contentOptions` - Common DOM options for the content slot.
- common composition options from [foundation.md](./foundation.md#common-composition-options).

## Update Notes

```ts
const status = Badge({
    text: "Draft",
    variant: "neutral"
});

status.setText("Published");
status.update({
    variant: "success"
});
```

Use `setIcon(null)` to hide the icon slot.

## Styling

Useful hooks include `[data-af-composition="badge"]`, `[data-af-badge-icon]`, `[data-af-badge-content]`, `[data-af-badge-accessible-label]`, `[data-af-variant]`, `[data-af-size]`, and `[data-af-icon-position]`.

```ts
Badge({
    className: "lesson-status",
    text: "Due",
    variant: "warning"
});
```

The default styles provide readable light and dark theme colors for each variant.

## Manual Checks

- The visible text communicates the meaning without relying on color.
- Abbreviated visible text has an `accessibleLabel`.
- Decorative icons are not the only source of meaning.
- Badge text remains readable in light and dark themes.
- Badges wrap or shrink without breaking nearby card/list layout.
- Badges are not used as hidden buttons or links.
