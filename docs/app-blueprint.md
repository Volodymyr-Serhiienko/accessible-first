# Application Blueprint

The application blueprint is the bridge between Accessible First as a framework and the first real applications built with it.

It is not a generator yet. It is the agreed shape of a small accessible app so we can build one real product, learn from it, and then automate only the parts that prove stable.

## Goal

A new Accessible First application should start with the same reliable foundations:

- app identity shared by metadata, manifest, diagnostics, and header brand;
- locale controller and app-owned translations;
- route descriptors used by navigation, breadcrumbs, search, commands, metadata, and diagnostics;
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
    identity.ts
    localization.ts
    metadata.ts
    routes.ts
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

For a small app, `shell.ts`, `routeChrome.ts`, and `diagnostics.ts` can remain in `main.ts`. Split them only when the file stops being easy to scan.

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
- one shared `createLocaleController()`;
- optional `createLocaleFormatter()`;
- small `t(key, params?)` helper.

`routes.ts` should define one route list. The same route descriptors should feed navigation, breadcrumbs, search, command palette, document metadata, sitemap, and diagnostics.

## Runtime Entry

The standard entry point should use `createPublicAppTemplate()`:

```ts
const app = createPublicAppTemplate({
    routes,
    mount: "#app",
    locale,
    identity: appIdentity,
    routeMetadata,
    shell: getShellOptions(),
    routeChrome: getRouteChromeOptions,
    diagnostics: getDiagnosticsOptions()
});
```

Use the default hash mode for a client-rendered SPA. Use `mode: "link"` when a static, server-rendered, or multi-page app should keep normal browser navigation.

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
- `main.ts` using `createPublicAppTemplate()`;
- starter screens using `Screen` and semantic composition;
- manifest, metadata, diagnostics, and public-page helpers wired by default.

Generation should come after the blueprint proves itself in the playground and the first reference app.
