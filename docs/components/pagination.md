# Pagination

Pagination creates accessible page navigation for long result sets, lists, tables, search results, lessons, or any flow split into numbered pages.

Use it when users need to move between known pages. For infinite loading or step-by-step tasks, use a more specific pattern instead.

## Quick Start

Stateful SPA-style pagination:

```ts
let page = 1;
const table = Table({
    caption: "Results",
    rows: getRows(page),
    columns: [{ id: "name", header: "Name" }],
    rowOptions: { attributes: { tabindex: "0" } }
});

const pagination = Pagination({
    page,
    pageCount: 12,
    focusTarget: () => table.bodyRows[0]?.element ?? table.table,
    onPageChange(detail, pagination) {
        page = detail.page;
        table.setRows(getRows(page));
        pagination.setPage(page);
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
- `focusTarget` - an element or resolver for the newly committed results, typically
  the first table row with the table itself as an empty-state fallback. Defaults to
  no automatic result focus. Resolved after a changed page is rendered, only while
  focus still belongs to this pagination. Semantic targets receive a temporary
  `tabindex="-1"` when needed; normal Tab order is preserved.

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

Chrome-only changes (`label`, `labelledBy`, variant/size, root/list options and
`onPageChange`) preserve controls and focus. Unchanged normalized page/count setters
also avoid a rebuild. Changes to the page range, control text/options, href resolver
or locale rebuild the item list. Only an actual page change can apply `focusTarget`;
initialization, unchanged pages, count-only/chrome/locale updates do not redirect focus.
Clamping the current page through a smaller page count is also a page change.

For asynchronous results, render the successful response first, then commit
`pagination.update({ page, pageCount })`. No promise/timer is required by Pagination.
Do not commit a failed/aborted request or temporarily disable/rebuild the pagination
controls while waiting; guard pending requests in the surrounding workflow instead.
If the user moves focus elsewhere during loading, a late response does not pull it
back. Hidden, inert, detached and obsolete targets are ignored. A resolver returning
`null` leaves focus to the surrounding workflow. Native links without a SPA handler
continue to use normal document navigation.

Resolvers should be deterministic. If one triggers a newer range replacement or
destroy, the obsolete candidate does not overwrite it. Partially created click
listeners and failed initial locale subscriptions are released. Cleanup completes
despite unsubscribe failures, then rethrows the first error. Destruction is
idempotent; late mutations and stale locale notifications are ignored.

Default English page labels interpolate their page number even without a locale
provider. Long translated control text wraps within its container.

## Accessibility

Use real links when each page has a URL. This is the best default for public MPA/static pages and helps browsers, assistive technology, sharing, and indexing.

Use buttons plus `onPageChange` when the current page changes local state without
navigation. For a paginated table, set `focusTarget` to its new first row so reading
continues from the new records instead of restarting at the pagination buttons.
For another layout, choose a result heading or deliberately leave the option unset.

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
- A configured table target receives focus on its first new row after Previous,
  Next or numeric-page activation, including a delayed successful response.
- No result focus moves on failed requests, background updates, or after the user
  has moved to another control. Empty results focus the explicit table fallback.
- Layout wraps cleanly on narrow mobile screens without horizontal overflow.
