# RouteCommandPalette

RouteCommandPalette creates a searchable command palette from application route metadata.

Use it when routes should be available both through visible navigation and a command-search interface without manually duplicating labels, descriptions, keywords, and route payloads.

## Quick Start

```ts
const palette = RouteCommandPalette({
    routes,
    shortcut: [
        { key: "k", code: "KeyK", ctrlKey: true, allowInEditable: true },
        { key: "k", code: "KeyK", metaKey: true, allowInEditable: true }
    ],
    onRouteSelect(detail) {
        activateHashRouterRoute(router, detail, {
            updateHistory: true,
            scroll: true,
            focusTarget: "outlet"
        });
    }
});
```

## When To Use

Use RouteCommandPalette when an application already has route descriptors and should expose those routes as searchable commands.

Good uses include:

- documentation playgrounds;
- admin panels;
- settings-heavy applications;
- dashboard apps with many screens;
- keyboard-friendly navigation accelerators.

Keep direct navigation available. On mobile screen readers, route search can be harder to explore than simple visible navigation.

## Layers

- Composition API: `RouteCommandPalette(options)`
- Reuses: `CommandPalette`, `SearchBox`, `Dialog`, and app route search helpers
- Related helpers: `createAppRouteSearchItems(...)`, `activateHashRouterRoute(...)`, `bindHashRouterRouteControls(...)`
- Styling hooks: `[data-af-route-command-palette]` plus the normal CommandPalette hooks

## Behavior

- Converts routes into CommandPalette items.
- Uses the route label/title as command text.
- Adds route descriptions and keywords through app route search helpers.
- Prefixes command labels with a localized action prefix (`Open ` in English) by default.
- Calls `onRouteSelect(...)` with the selected route.
- Keeps the route object available as `detail.route` and `detail.command.data`.
- Inherits closing, Escape behavior, shortcuts, focus behavior, and search behavior from CommandPalette.

## Options

- `routes` - route metadata list.
- `trigger` - content for the trigger button. Defaults to localized `commandPalette.trigger`.
- `searchItemsOptions` - resolvers for generated labels, descriptions, keywords, and disabled state.
- `commandLabelPrefix` - prefix for generated command labels. Defaults to the localized route-command prefix. Use `null` for no prefix.
- `locale` - optional locale provider for command-palette service text and the route-command prefix.
- `onRouteSelect` - called when a route command is selected.
- `onSelect` - lower-level CommandPalette selection callback.

All other non-owned options pass through to CommandPalette, including `title`, `description`, `shortcut`, `searchLabel`, `placeholder`, `notFoundText`, `searchBoxOptions`, and `dialogOptions`.

## Label Prefix

```ts
RouteCommandPalette({
    routes,
    commandLabelPrefix: null
});
```

Use the default localized prefix when search results should read as actions. Use `null` when route labels are already action-oriented or when shorter results are better.

## Search Metadata

```ts
RouteCommandPalette({
    routes,
    searchItemsOptions: {
        getDescription(route) {
            return `Open the ${route.title} screen.`;
        },
        getKeywords(route) {
            return ["screen", "page", route.id];
        }
    }
});
```

The same metadata can feed RouteSearchBox and RouteCommandPalette, keeping visible search and command search consistent.

## Accessibility

RouteCommandPalette inherits modal, search, and keyboard behavior from CommandPalette.

Provide clear route labels and descriptions. The command palette should help users move faster, but it should not replace visible navigation, especially for touch and mobile screen reader workflows.

## Manual Checks

- Trigger opens the palette.
- Configured shortcuts open the palette from page focus.
- Search results match route labels, titles, descriptions, ids, and keywords.
- Enter opens the selected route.
- Escape closes the palette.
- Focus lands on the rendered route content after navigation when used with `activateHashRouterRoute(...)` and `focusTarget: "outlet"`.
- Breadcrumbs and navigation current state still update after command navigation.
- Mobile screen reader users can still use visible navigation without relying on command search.

