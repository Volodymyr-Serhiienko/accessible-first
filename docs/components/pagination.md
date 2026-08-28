# Pagination

Pagination creates accessible page navigation for long result sets, lists, tables, search results, lessons, or any flow split into numbered pages.

Use it when users need to move between known pages. For infinite loading or step-by-step tasks, use a more specific pattern instead.

## Quick Start

Stateful SPA-style pagination:

```ts
let page = 1;

const pagination = Pagination({
    page,
    pageCount: 12,
    onPageChange(detail, pagination) {
        page = detail.page;
        pagination.setPage(page);
        renderResults(page);
    }
});
```

Native-link pagination:

```ts
Pagination({
    page: 3,
    pageCount: 18,
    getHref({ page }) {
        return `/lessons?page=${page}`;
    }
});
```

## Behavior

- Renders a `nav` landmark with a localized pagination label by default.
- Renders Previous and Next controls.
- Renders page numbers with configurable sibling and boundary counts.
- Uses ellipsis items when the full page range is too long.
- Marks the current page with `aria-current="page"`.
- Keeps the current page and ellipsis items out of the tab order.
- Disables Previous on the first page and Next on the last page.
- Uses links when `getHref` returns an href, otherwise uses buttons for actionable controls.

## Options

Required options:

- `page` - current one-based page number.
- `pageCount` - total number of pages. Values below 1 are normalized to 1.

Text and localization:

- `label` - accessible navigation label. Defaults to localized `pagination.label`. Pass `null` to omit it when `labelledBy` is used.
- `labelledBy` - id of visible text that labels the pagination navigation.
- `previousText` - visible and accessible Previous text. Defaults to localized `pagination.previous`.
- `nextText` - visible and accessible Next text. Defaults to localized `pagination.next`.
- `ellipsisText` - accessible ellipsis text. Defaults to localized `pagination.ellipsis`.
- `getPageLabel` - custom accessible label for non-current page numbers.
- `getCurrentPageLabel` - custom accessible label for the current page.
- `locale` - localization provider for framework-owned fallback text.

Navigation:

- `getHref` - returns an href for a page. Use this for MPA, static, and server-rendered pages.
- `onPageChange` - called when an enabled target is activated. Use this for SPA state changes.

Display:

- `siblingCount` - number of pages shown on each side of the current page. Defaults to `1`.
- `boundaryCount` - number of pages shown at the start and end. Defaults to `1`.
- `disabled` - disables actionable controls.
- `variant` - `"default"` or `"plain"`.
- `size` - currently `"md"`.

Composition options:

- `className`, `id`, and `attributes` apply to the root `nav`.
- `listOptions` apply to the internal `ul`.
- `itemOptions` apply to each `li`.
- `controlOptions` apply to each generated link, button, or span control.

## Runtime

The returned `ComposedPagination` exposes:

- `element` - root `nav`.
- `list` - internal `ul`.
- `items` - composed rendered items.
- `getPage()` and `getPageCount()`.
- `setPage(page)`.
- `setPageCount(pageCount)`.
- `update(options)`.
- `destroy()`.

`onPageChange` does not mutate the current page automatically. The application should update the component after changing its own state. This keeps the component predictable for data loading, routing, optimistic updates, and validation.

## Accessibility

Use real links when each page has a URL. This is the best default for public MPA/static pages and helps browsers, assistive technology, sharing, and indexing.

Use buttons plus `onPageChange` when the current page changes local state without navigation. After changing a page, move focus only when the surrounding workflow needs it. A paginated table may keep focus on the activated control; a full screen change may move focus to the result heading.

Avoid announcing both a toast and a focused result heading with the same message. Let focus own the detailed context, and use toast/status feedback only for short workflow confirmations.

## Styling Hooks

Useful hooks include `[data-af-composition="pagination"]`, `[data-af-pagination-list]`, `[data-af-pagination-item]`, `[data-af-pagination-control]`, `[data-af-pagination-kind]`, and `[aria-current="page"]`.

The component also exposes root `data-af-variant` and `data-af-size` attributes.

## Manual Checks

- Tab reaches only enabled Previous/Next and non-current page targets.
- Current page is announced as the current page.
- Previous is disabled on page 1; Next is disabled on the last page.
- Long page ranges show ellipsis without losing first, nearby, and last pages.
- Link mode uses real hrefs.
- Button mode calls `onPageChange` and lets the app update visible results.
- Layout wraps cleanly on narrow mobile screens without horizontal overflow.
