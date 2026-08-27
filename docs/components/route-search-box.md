# RouteSearchBox

RouteSearchBox creates a search box from application route metadata.

Use it when a route list already describes screen ids, titles, labels, descriptions, keywords, disabled state, and hrefs, and the UI should derive search results from the same source of truth as navigation and breadcrumbs.

## Quick Start

```ts
const search = RouteSearchBox({
    label: "Search screens",
    placeholder: "Search",
    width: "14rem",
    routes,
    notFoundText: "No matching screens found.",
    onRouteSelect(detail) {
        router.navigate(detail.route);
    }
});
```

## Purpose

Use `SearchBox` when you already have explicit search result items.

Use `RouteSearchBox` when search results should be derived from route metadata. This keeps labels, descriptions, keywords, disabled state, and route payloads consistent with `Navigation`, `ResponsiveNavigation`, `RouteBreadcrumbs`, and `HashRouter`.

## Layers

- Composition API: `RouteSearchBox(options)`
- Reuses: `SearchBox` and `createAppRouteSearchItems()`

## Behavior

- Converts routes into `SearchBox` items.
- Stores the original route on each result item as `item.data`.
- Calls `onRouteSelect` with the selected route.
- Supports custom route label, description, keyword, and disabled resolvers through `searchItemsOptions`.
- Keeps the underlying input, popup, keyboard behavior, filtering, not-found state, and mobile keyboard dismissal from `SearchBox`.
- Inherits `SearchBox` sizing options such as `width`, `minWidth`, and `maxWidth`, so route search can be tuned directly when composing a header.

## Options

- `routes` - Required route metadata list.
- `searchItemsOptions` - Options passed to `createAppRouteSearchItems()`.
- `onRouteSelect` - Called with the selected route when a result is selected.
- `onSelect` - Optional lower-level `SearchBox` selection callback.
- all `SearchBox` options except `items`, including `width`, `minWidth`, `maxWidth`, `searchLocale`, `searchMode`, `caseSensitive`, and `ignoreDiacritics`.

## Methods

- `getRoutes()` - returns the current route list.
- `setRoutes(routes)` - updates the route list and replaces search results.
- `getSelectedRoute()` - returns the selected route, or `null`.
- `update(options)` - updates route options and underlying `SearchBox` options.
- `destroy()` - destroys the underlying `SearchBox`.

## Styling

RouteSearchBox uses the normal SearchBox and Combobox DOM structure and styles.

It also adds:

```html
data-af-route-search-box
```

Useful hooks include `[data-af-route-search-box]`, `[data-af-search-box]`, `[data-af-composition="combobox"]`, `[data-af-combobox-input]`, `[data-af-combobox-listbox]`, `[data-af-search-box-result]`, and `[data-af-search-box-option]`.

```ts
RouteSearchBox({
    className: "app-search",
    routes,
    label: "Search app screens"
});
```

## Manual Checks

- Input label is announced.
- Typing filters route labels, descriptions, and keywords with the inherited SearchBox locale-aware matching rules.
- Search result descriptions explain what opens.
- Disabled routes are not selectable.
- Selecting a result calls `onRouteSelect` with the original route.
- Updating routes replaces the result list.
- Popup stays within the viewport on small screens.
