# Application Starter

Application Starter is the practical recipe for creating the first real Accessible First apps.

It is not a file generator yet. It is the smallest repeatable app shape we want every starter, playground, and reference application to follow until real use proves a better abstraction.

For the architectural contract behind this recipe, see [Application Blueprint](./app-blueprint.md).

## Goal

A new app should begin with accessible app infrastructure already in place:

- one app identity for brand, metadata, manifest, and diagnostics;
- one locale controller for framework service text and app text;
- one route list and route registry;
- one localized route text layer;
- one public app template entry point;
- one app shell with header, navigation, route outlet, optional feedback, and footer;
- route-aware navigation, breadcrumbs, search, command palette, metadata, and diagnostics;
- predictable focus movement for keyboard and mobile screen reader users.

The app should own product text, screens, data, and domain behavior. The framework should own repeated wiring, accessibility defaults, metadata plumbing, diagnostics, and responsive shell behavior.

## Recommended File Shape

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
  features/
    ...domain modules...
  styles.css
```

Small apps can merge some `app/` files at first, but the starter shape is useful once routes, localization, metadata, and chrome begin to grow.

## Step 1: Keep main.ts Thin

```ts
import "./styles.css";
import { createApp } from "./app/app";

createApp();
```

`main.ts` should not own route lists, screen rendering, metadata, locale messages, or app chrome. That keeps app startup easy to scan and easy to generate later.

## Step 2: Define Identity

```ts
import { createAppIdentity } from "@accessible-first/components";

export const appIdentity = createAppIdentity({
    name: "Language Lab",
    shortName: "Language Lab",
    description: "Accessible language learning for everyday practice.",
    lang: "en",
    themeColor: "#111827",
    manifestHref: "site.webmanifest",
    icons: {
        svg: "assets/logo.svg",
        png192: "assets/logo-192.png",
        png512: "assets/logo-512.png",
        maskablePng512: "assets/logo-maskable-512.png"
    }
});
```

Identity should be stable and app-owned. Use it for header brand defaults, document metadata, manifest generation, diagnostics, and future public-page helpers.

## Step 3: Create Localization

```ts
import {
    createAppLocalization,
    type AccessibleFirstMessageKey,
    type LocaleMessageParams,
    type LocaleMessagesByLocale
} from "@accessible-first/components";

export const supportedLocales = ["en", "uk", "ru"] as const;

export type AppLocale = typeof supportedLocales[number];

export type AppMessageKey =
    | AccessibleFirstMessageKey
    | "app.brand.name"
    | "app.brand.tagline"
    | "app.navigation.skipLink"
    | "app.route.loaded"
    | "routes.home.title"
    | "routes.home.description"
    | "routes.settings.title"
    | "routes.settings.description";

const messages = {
    en: {
        "app.brand.name": "Language Lab",
        "app.brand.tagline": "Practice words, lessons, and progress accessibly.",
        "app.navigation.skipLink": "Skip to navigation",
        "app.route.loaded": "{title} loaded.",
        "routes.home.title": "Home",
        "routes.home.description": "Start lessons, practice sessions, and progress review.",
        "routes.settings.title": "Settings",
        "routes.settings.description": "Adjust language, accessibility, and practice preferences."
    }
} satisfies LocaleMessagesByLocale<AppMessageKey>;

export const appLocalization = createAppLocalization<AppLocale, AppMessageKey>({
    supportedLocales,
    fallbackLocale: "en",
    storageKey: "language-lab.locale",
    messages
});

export const locale = appLocalization;

export const format = appLocalization.format;

export function t(key: AppMessageKey, params?: LocaleMessageParams): string {
    return appLocalization.t(key, params);
}
```

The first version can use simple string messages. `format` is available immediately for dates, numbers, lists, sorting, and plural categories when a screen needs localized data formatting.

## Step 4: Define Routes And Registry

```ts
import {
    createAppRouteRegistry,
    type AppRouteDescriptor,
    type AppRouteLocaleTextRoute,
    type ComposedNode
} from "@accessible-first/components";
import { HomeScreen } from "../screens/home";
import { SettingsScreen } from "../screens/settings";
import type { AppMessageKey } from "./localization";

export type AppRoute = AppRouteDescriptor & AppRouteLocaleTextRoute<AppMessageKey> & {
    render(): ComposedNode;
};

export const routes: AppRoute[] = [
    {
        id: "home",
        title: "Home",
        localeKeys: {
            title: "routes.home.title",
            label: "routes.home.title",
            description: "routes.home.description",
            documentTitle: "routes.home.title"
        },
        render: HomeScreen
    },
    {
        id: "settings",
        title: "Settings",
        parentId: "home",
        localeKeys: {
            title: "routes.settings.title",
            label: "routes.settings.title",
            description: "routes.settings.description",
            documentTitle: "routes.settings.title"
        },
        render: SettingsScreen
    }
];

export const routeRegistry = createAppRouteRegistry({
    routes,
    defaultRoute: "home"
});
```

Keep fallback titles readable. They help diagnostics, unsupported locales, and development before all translations are written.

## Step 5: Create Route Text

```ts
import {
    createLocalizedAppRouteText,
    type AppIdentityRouteDiagnosticsOptions
} from "@accessible-first/components";
import { locale, type AppMessageKey } from "./localization";
import type { AppRoute } from "./routes";

export const routeText = createLocalizedAppRouteText<AppRoute, AppMessageKey>({
    locale,
    routeLoadedAnnouncementKey: "app.route.loaded"
});

export const routeMetadata: AppIdentityRouteDiagnosticsOptions<AppRoute> = {
    baseUrl: new URL(".", window.location.href)
};
```

Route text should feed navigation, breadcrumbs, search, command palette, route announcements, metadata, sitemap, and diagnostics from one place. Public app templates can merge `routeText.routeOptions` into `routeMetadata`, inject route chrome item defaults, and use `routeText.getLoadedAnnouncement` for SPA route speech, so the app only adds deployment-specific metadata such as `baseUrl`. Use the shared `routeLoadedAnnouncementKey` first; add per-route `localeKeys.loadedAnnouncement` only when a screen needs a custom spoken phrase.

## Step 6: Create Shell

```ts
import { type PublicHashAppTemplateShellOptions } from "@accessible-first/components";
import { t } from "./localization";
import { getAppMetadata } from "./metadata";

export function getShellOptions(): PublicHashAppTemplateShellOptions {
    return {
        title: () => t("app.brand.name"),
        skipLink: () => t("app.navigation.skipLink"),
        skipLinkTargetId: "app-navigation",
        metadata: getAppMetadata,
        outletOptions: () => ({
            label: "Application content",
            announcement: false,
            scrollOnRender: true
        }),
        layout: {
            chrome: {
                header: "normal",
                navigation: "reveal",
                beforeOutlet: "sticky"
            }
        }
    };
}
```

Use resolver functions for locale-dependent shell text. Public app templates re-read those values during locale refresh.

## Step 7: Create Route Chrome

```ts
import { type PublicHashAppTemplateRouteChromeBaseOptions } from "@accessible-first/components";
import { locale, t, type AppLocale, type AppMessageKey } from "./localization";
import { type AppRoute } from "./routes";
import { appIdentity } from "./identity";

export function getRouteChromeOptions(): PublicHashAppTemplateRouteChromeBaseOptions<AppRoute, AppLocale, AppMessageKey> {
    return {
        header: {
            identity: appIdentity,
            locale,
            brand: {
                href: "#main",
                name: t("app.brand.name"),
                tagline: t("app.brand.tagline")
            }
        },
        navigation: {
            id: "app-navigation"
        },
        breadcrumbs: {
            label: "Current location"
        },
        search: {
            label: "Search screens"
        },
        commands: {
            trigger: "Commands",
            title: "Commands",
            searchLabel: "Search commands"
        }
    };
}
```

Start with the default chrome. Public app templates inject the app route list and shared `routeText` defaults into route chrome automatically, and `header.locale` becomes the default locale for route chrome controls. `routeChrome.ts` only needs route-specific options when it wants an override. Add custom search descriptions, command labels, header controls, or navigation return links only when the app needs them.

## Step 8: Create Diagnostics

```ts
import { type PublicHashRoutedAppDiagnosticsOptions } from "@accessible-first/components";
import type { AppLocale, AppMessageKey } from "./localization";
import type { AppRoute } from "./routes";

export function getDiagnosticsOptions(): PublicHashRoutedAppDiagnosticsOptions<AppLocale, AppMessageKey, AppRoute> {
    return {
        logOnRouteChange: true
    };
}
```

Diagnostics should be part of the starter, not an afterthought. When `locale` is the `createAppLocalization()` result, public app diagnostics read `requiredMessageKeys` automatically. They keep route, localization, metadata, manifest, and page structure problems visible during development.

## Step 9: Create App Factory

```ts
import { createPublicAppTemplate } from "@accessible-first/components";
import { appIdentity } from "./identity";
import { locale, type AppLocale, type AppMessageKey } from "./localization";
import { getRouteChromeOptions } from "./routeChrome";
import { routeMetadata, routeText } from "./routeText";
import { routes, type AppRoute } from "./routes";
import { getShellOptions } from "./shell";
import { getDiagnosticsOptions } from "./diagnostics";

export function createApp() {
    return createPublicAppTemplate<AppRoute, AppLocale, AppMessageKey>({
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

This is the starter's main integration point. It should stay small enough that a developer can understand the app lifecycle in one glance.

## Step 10: Write Screens

```ts
import { Screen, p } from "@accessible-first/components";

export function HomeScreen() {
    return Screen({
        title: "Home",
        description: "Start practicing.",
        children: [
            p("Choose a lesson or continue your latest practice session.")
        ]
    });
}
```

Use the framework's semantic primitives first. Promote app helper code into the framework only after it repeats across real screens and stays independent of product copy.

## Starter Rules

- Keep app copy in localization files or route text files.
- Keep route descriptors readable without translations.
- Keep route lookup in `createAppRouteRegistry()` instead of local hash parsing.
- Keep metadata and diagnostics connected to the same route text resolvers.
- Keep shell and route chrome options resolver-backed when they depend on locale.
- Keep `main.ts` thin.
- Keep custom CSS small; move repeated responsive shell behavior back into the framework.
- Keep important controls reachable without keyboard shortcuts.
- Keep toast actions non-critical until the app provides a reliable focus route to them.

## First Reference App Readiness

Before migrating the legacy language-learning app, the framework should have:

- the starter recipe proven in the playground;
- stable app identity, route registry, localized route text, public app template, shell, route chrome, metadata, diagnostics, and locale refresh;
- enough layout primitives and screen patterns for lesson lists, vocabulary details, practice flows, settings, progress, and forms;
- a small list of framework gaps found by reading the legacy app, not guessed in advance.

After that, the old app can be brought in and migrated screen by screen.
