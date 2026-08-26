# RouteChrome

RouteChrome is a small factory for creating the common route-aware controls used by application shells: responsive navigation, breadcrumbs, route search, and route command palette.

Use it when a routed app should keep route activation, current route state, search, commands, and breadcrumbs wired the same way without repeating callback glue in every app file.

## Quick Start

```ts
const activateRoute = createHashRouterRouteActivationHandler(router, {
    updateHistory: true,
    scroll: true,
    focusTarget: "outlet"
});

const routeChrome = createRouteChrome({
    routes,
    current: router.getCurrentRoute(),
    onRouteActivate: activateRoute,
    navigation: {
        id: "app-navigation",
        variant: "pills",
        trigger: "Sections"
    },
    breadcrumbs: {
        label: "Current location"
    },
    search: {
        label: "Search sections",
        placeholder: "Search...",
        notFoundText: "No matching sections."
    },
    commands: {
        trigger: "Commands",
        title: "Commands",
        searchLabel: "Search commands",
        placeholder: "Type a command..."
    }
});

shell.setNavigation(routeChrome.navigation);
shell.setBeforeOutlet(routeChrome.breadcrumbs);
shell.setHeader(AppHeader({ controls: routeChrome.headerControls }));
```

With `HashRoutedApp`, return the controls from `renderChrome(...)`:

```ts
return {
    header: AppHeader({ controls: routeChrome.headerControls }),
    navigation: routeChrome.navigation,
    beforeOutlet: routeChrome.breadcrumbs,
    navigationControl: routeChrome.navigationControl,
    currentRouteControls: routeChrome.currentRouteControls
};
```

## Purpose

RouteChrome sits above individual route-aware components and below full app templates.

It creates:

- `RouteResponsiveNavigation` when `navigation` is not `false`;
- `RouteBreadcrumbs` when `breadcrumbs` is not `false`;
- `RouteSearchBox` when `search` options are provided;
- `RouteCommandPalette` when `commands` options are provided;
- shared `headerControls` containing search and commands;
- `navigationControl` and `currentRouteControls` for `HashRoutedApp` or `LinkRoutedApp`.

It does not create a header, footer, shell, router, route list, or application copy. The app still owns those decisions.

## Options

- `routes` - required route descriptors used by route-aware controls.
- `current` - current route object, route id, `null`, or `undefined`.
- `navigation` - options passed to `RouteResponsiveNavigation`, or `false` to disable navigation.
- `breadcrumbs` - options passed to `RouteBreadcrumbs`, or `false` to disable breadcrumbs. Pass `breadcrumbs.routes` when breadcrumbs need a synthetic root route.
- `search` - options passed to `RouteSearchBox`, or `false`/omitted to disable route search.
- `commands` - options passed to `RouteCommandPalette`, or `false`/omitted to disable route commands.
- `onRouteActivate` - shared activation callback used by navigation, search, and commands.

## Returned Controller

- `navigation` - composed route responsive navigation, or `null`.
- `breadcrumbs` - composed route breadcrumbs, or `null`.
- `search` - composed route search box, or `null`.
- `commands` - composed route command palette, or `null`.
- `headerControls` - search and command controls ready for a header action area.
- `navigationControl` - control suitable for routed app `navigationControl`.
- `currentRouteControls` - controls suitable for routed app `currentRouteControls`.

## SPA And MPA Use

For hash-routed SPAs, pass `createHashRouterRouteActivationHandler(router, options)` as `onRouteActivate`.

For native-link or MPA pages, leave `onRouteActivate` empty when links should navigate normally. `LinkRoutedApp` can still use `navigationControl` and `currentRouteControls` to mark the current page from location matching.

## Accessibility

RouteChrome does not change the accessibility behavior of the underlying controls. Navigation remains real links, breadcrumbs remain a navigation landmark, search remains a combobox-based search control, and commands remain a dialog-based command palette.

Use application-owned text for labels, placeholders, and empty states. Pass the shared locale provider to the underlying controls when their service text should update with the application locale.

## Manual Checks

- Navigation, search, and command palette activate routes with the same scroll and focus behavior.
- Navigation and breadcrumbs update current state after route changes.
- Search and commands remain usable with keyboard and screen reader navigation.
- Native-link apps still allow normal browser navigation when `onRouteActivate` is omitted.
- Locale refresh recreates route chrome without duplicating route activation handlers.
