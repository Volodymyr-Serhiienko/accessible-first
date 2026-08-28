# Application Blueprint

The application blueprint is the bridge between Accessible First as a framework and the first real applications built with it.

It is not a generator yet. It is the agreed shape of a small accessible app so we can build one real product, learn from it, and then automate only the parts that prove stable.

## Goal

A new Accessible First application should start with the same reliable foundations:

- app identity shared by metadata, manifest, diagnostics, and header brand;
- locale controller and app-owned translations;
- route descriptors and route registry used by navigation, breadcrumbs, search, commands, metadata, diagnostics, and safe route lookup;
- public app template selected as hash-SPA or native-link/MPA;
- app shell with header, navigation, main outlet, optional before/after outlet content, and footer;
- route focus behavior that works for desktop keyboard and mobile screen reader users;
- diagnostics that report page, routes, metadata, localization, manifest, and app-owned health issues.

The blueprint should keep application text and product logic in the app, while the framework owns repeated wiring, behavior, and accessibility defaults.

## Recommended Files

A first app can use this structure:

```text
src/
  main.ts
  app/
    app.ts
    identity.ts
    localization.ts
    metadata.ts
    routes.ts
    routeText.ts
    routeChrome.ts
    shell.ts
    diagnostics.ts
  screens/
    home.ts
    settings.ts
    notFound.ts
  features/
    ...domain modules...
  styles.css
```

`main.ts` should stay deliberately small: import global styles, call the app factory, and avoid owning route, shell, metadata, or diagnostics wiring. For a small app, `shell.ts`, `routeChrome.ts`, and `diagnostics.ts` can remain in `app.ts`. Split them only when the app factory stops being easy to scan.

## App-Owned Declarations

`identity.ts` should create one `AppIdentity`:

```ts
export const appIdentity = createAppIdentity({
    name: "Example App",
    shortName: "Example",
    description: "Accessible app description.",
    lang: "en",
    themeColor: "#111827",
    manifestHref: "site.webmanifest",
    icons: {
        svg: "assets/logo.svg",
        png192: "assets/logo-192.png",
        png512: "assets/logo-512.png"
    }
});
```

`localization.ts` should define:

- supported locale tuple;
- app message-key union combined with `AccessibleFirstMessageKey`;
- locale messages for framework service text and app copy;
- one shared `createAppLocalization()` result;
- exported controller-compatible `locale`, `format`, and `t(key, params?)`; public diagnostics can read required message keys from the localization bundle.

`routes.ts` should define one route list and, for routed apps, one `createAppRouteRegistry()` result. The same route descriptors and route text bundle should feed navigation, breadcrumbs, search, command palette, document metadata, sitemap, safe route lookup, and diagnostics. Localized apps can add `localeKeys` to routes or keep the pure route list in `routes.ts` and put localized route resolvers in `routeText.ts`. Use `createLocalizedAppRouteText()` so route copy is translated once and reused everywhere. Shell text and outlet labels should use resolver functions when they depend on the active locale.

## Runtime Entry

The runtime entry should keep `main.ts` thin:

```ts
import "./styles.css";
import { createApp } from "./app/app";

createApp();
```

The app factory should use `createPublicAppTemplate()` and declare the route list once:

```ts
export function createApp() {
    return createPublicAppTemplate({
        routes,
        mount: "#app",
        locale,
        identity: appIdentity,
        routeMetadata,
        routeText,
        shell: getShellOptions(),
        routeChrome: getRouteChromeOptions,
        diagnostics: getDiagnosticsOptions()
    });
}
```

Use the default hash mode for a client-rendered SPA. Use `mode: "link"` when a static, server-rendered, or multi-page app should keep normal browser navigation. Public app templates pass the declared route list and `routeText` defaults into route chrome automatically and can consume `routeText` for metadata and route announcements; lower-level `createRouteChrome()` and manual renderers still accept explicit `routes` and `routeText`.

## Shell And Chrome

The shell should handle page structure, not product logic:

- `AppShell` owns header, navigation, before-outlet, outlet, after-outlet, and footer regions.
- `PageLayout` owns max width, gutters, main spacing, and chrome behavior.
- `AppHeader` owns brand, app controls, language, theme, and header tools.
- `RouteChrome` owns route-derived navigation, breadcrumbs, route search, command palette, and navigation return links.

App chrome should be responsive by default. Custom CSS is allowed, but repeated layout behavior should move back into the framework.

## Screens

Each screen should be a small composition function:

```ts
export function HomeScreen(): ComposedNode {
    return Screen({
        title: t("home.title"),
        description: t("home.description"),
        children: [HomeContent()]
    });
}
```

Prefer existing Accessible First primitives before adding custom wrappers:

- `Screen` for route-level content;
- `Section`, `Panel`, `Stack`, `Row`, `Grid`, and `Container` for layout;
- `ResultSummary`, `Pagination`, `Table`, `ListDetail`, and form components for data workflows;
- `ToastViewport`, `Dialog`, and `AlertDialog` for feedback and decisions.

## Diagnostics

Every public app should run diagnostics during development and before deployment:

- page structure and metadata;
- route labels, hrefs, descriptions, titles, parent relationships, and structured data;
- localization dictionaries and missing keys;
- manifest identity and icon readiness;
- app-owned custom health checks when a feature has required data or configuration.

Diagnostics should be useful, not noisy. They should identify issues early without requiring a large external runtime.

## First Reference App

The first reference application will be an accessible foreign-language learning app. It should validate the framework against real screens:

- lesson list and lesson detail;
- vocabulary list and detail;
- practice flow;
- settings and preferences;
- progress feedback and result summaries;
- field-first form validation;
- localized UI text and data formatting;
- desktop keyboard and mobile screen reader routes.

The app should stay small enough to reason about, but real enough to expose framework gaps.

The legacy version of the language-learning app should be brought in after the app template and starter scaffold are stable. That keeps migration grounded in real product behavior while avoiding early rewrites around an unfinished app shape.

## Promotion Rule

Do not move code from an application into the framework just because it exists once.

Promote code when it is:

- repeated across app screens or demos;
- clearly accessibility-related;
- independent of product copy and data;
- stable enough to document;
- useful for both beginners and experienced developers.

This keeps Accessible First lightweight while still growing toward a practical app-building framework.

## Future Generator Contract

A future starter generator should create the blueprint structure with sensible defaults:

- `identity.ts` from app name, description, colors, and icons;
- `localization.ts` with framework service keys and app keys;
- `routes.ts` with starter route metadata;
- thin `main.ts` plus `app.ts` using `createPublicAppTemplate()`;
- starter screens using `Screen` and semantic composition;
- manifest, metadata, diagnostics, and public-page helpers wired by default.

Generation should come after the blueprint proves itself in the playground and the first reference app.
