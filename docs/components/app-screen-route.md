# AppScreenRoute

AppScreenRoute is a small app-route helper for runnable hash-routed screens. It turns route metadata plus declarative Screen slots into a normal route with `render()`.

Use it for minimal starter apps, small pages, examples, and generated code where a full custom screen function would be unnecessary noise. Use a manual `render()` function when a screen owns state, data loading, subscriptions, or complex domain behavior.

## Quick Start

```ts
import {
    Button,
    P,
    createAppScreenRoutes,
    createPublicAppTemplate,
    type AppScreenRoute
} from "@accessible-first/components";

export type AppRoute = AppScreenRoute;

export const routes = createAppScreenRoutes([
    {
        id: "home",
        title: "Home",
        description: "Welcome to the app.",
        children: [
            P("Replace this starter content with your first real screen."),
            Button({ text: "Start" })
        ]
    },
    {
        id: "about",
        title: "About",
        description: "A short page about this app.",
        parentId: "home",
        children: [
            P("Add product, team, or help content here.")
        ]
    }
]);
```

Then pass the routes to the public app template:

```ts
createPublicAppTemplate({
    routes,
    mount: "#app",
    identity,
    locale,
    routeText,
    routeChrome: true
});
```

## Purpose

A starter route often needs both metadata and content:

- route id, title, label, description, parent route, keywords, and metadata;
- a runnable `render()` function for hash routing;
- a top-level `Screen` with body, actions, and footer slots;
- a page-level `h1` by default, because route screens usually represent the current page content;
- a place to connect Accessible First components declaratively.

`createAppScreenRoute()` and `createAppScreenRoutes()` keep that first app shape compact without hiding the lower-level route model.

## Options

AppScreenRoute accepts all `AppRouteDescriptor` fields, plus these route screen slots:

- `children` - Accessible First components, native nodes, text, or a resolver receiving the created route. Rendered into the Screen body.
- `actions` - optional controls passed to the Screen's internal ActionsBar.
- `footer` - optional Screen footer content.
- `screen` - optional Screen configuration. Pass `false` to render `children` directly without a Screen wrapper.

`screen` accepts normal `Screen` options except `children`, `actions`, and `footer`, which stay as top-level route slots. It can override:

- `title` - defaults to `route.title`.
- `description` - defaults to `route.description`.
- `headingLevel`, `descriptionMode`, `variant`, `actionsAlign`, `defaultFocusTarget`, and slot element options. `headingLevel` defaults to `1` for AppScreenRoute, while lower-level `Screen()` keeps its own default.

Slot resolvers are useful when content needs route metadata:

```ts
createAppScreenRoute({
    id: "settings",
    title: "Settings",
    children: (route) => P(`This is the ${route.title} screen.`)
});
```

## Accessibility

By default, the helper wraps route content in `Screen`, so the route title and description follow the same focus and screen reader behavior as manual screens. The generated route title is an `h1` unless `screen.headingLevel` overrides it.

Keep route `title` and `description` meaningful. They can feed visible Screen text, navigation, search, command palette, metadata, diagnostics, and route-loaded announcements through `routeText`.

Use `screen: false` only when another component already owns the page-level landmark/heading structure.

## Styling

Use the regular Screen and composition styling options:

```ts
createAppScreenRoute({
    id: "home",
    title: "Home",
    screen: {
        className: "home-screen",
        bodyOptions: {
            className: "home-screen__body"
        }
    },
    children: [HomeHero(), HomeCards()]
});
```

## Manual Checks

- The route renders in `HashRouter` and `PublicAppTemplate`.
- Route title and description are useful when focused after navigation.
- Route metadata still feeds navigation, search, breadcrumbs, commands, diagnostics, and document metadata.
- `screen: false` is used only when another wrapper provides the needed structure.
