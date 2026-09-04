# PublicStaticAppTemplate

PublicStaticAppTemplate is the route-free public app starter for Accessible First.

Use it for static public pages, landing pages, small information sites, documentation pages, portfolios, and other sites that need accessible app structure without route navigation.

## Quick Start

```ts
const app = createPublicStaticAppTemplate({
    mount: "#app",
    identity: getAppIdentity,
    locale: appLocalization,
    shell: getShellOptions,
    content: HomePage,
    diagnostics: {
        pageOptions: {
            landmarks: {
                requireNavigation: false
            }
        },
        log: true
    }
});
```

## Purpose

`createPublicStaticAppTemplate()` creates an AppShell, renders one route-free content tree, mounts it when a target is provided, connects locale refresh, and creates public app diagnostics.

It exists so static pages can use the same Accessible First foundations as routed apps:

- AppShell and PageOutlet;
- localized shell, header, footer, content, and metadata resolvers;
- app identity;
- public document metadata;
- web app manifest diagnostics;
- locale diagnostics;
- predictable cleanup.

## Options

- `mount` - optional mount target. Pass `false` or omit it to mount manually.
- `mountOptions` - mount behavior passed to `mount()`.
- `identity` - app identity or lazy identity resolver.
- `locale` - locale controller used by shell text, content refresh, and diagnostics.
- `shell` - AppShell settings with resolver support for localized title, skip link, metadata, header, footer, outlet options, and layout.
- `content` - static page content or lazy content resolver.
- `refreshRenderOptions` - PageOutlet render behavior used during refresh. Defaults avoid focus movement, scroll movement, and announcements on locale refresh.
- `diagnostics` - public app diagnostics options, or `false` to disable diagnostics.
- `localeRefresh` - locale refresh scheduling options, or `false` to disable locale-driven refresh.
- `destroyOnPageHide` - pagehide cleanup behavior. Defaults to enabled.

## Runtime Controller

The returned controller exposes:

- `shell` - the created AppShell;
- `locale` - the attached locale controller or `null`;
- `diagnostics` - the diagnostics runner or `null`;
- `mounted` - the mounted tree or `null`;
- `mount(target, options)` - mounts the shell manually;
- `refresh(options)` - refreshes shell/content/diagnostics;
- `inspectDiagnostics()` - returns a fresh diagnostics report without logging;
- `logDiagnostics()` - logs and returns diagnostics;
- `destroy()` - cleans up locale refresh, mount, and shell;
- `isDestroyed()` - reports lifecycle state.

## Localization

Use resolver functions for locale-dependent values:

```ts
export function getShellOptions(): PublicStaticAppTemplateShellOptions {
    return {
        title: () => t("app.name"),
        skipLink: () => t("shell.skipLink"),
        metadata: getAppMetadata,
        header: Header,
        footer: Footer,
        outletOptions: () => ({
            label: t("shell.contentLabel"),
            announcement: false,
            scrollOnRender: false
        })
    };
}
```

When `locale` is provided, locale changes refresh the resolver-backed shell values and content without a full page reload.

## Diagnostics

Diagnostics include page checks when `page` is not `false`, identity/manifest checks when identity is available, and locale checks when a locale controller is provided.

For route-free pages, configure the intentional lack of navigation explicitly:

```ts
diagnostics: {
    pageOptions: {
        landmarks: {
            requireNavigation: false
        }
    }
}
```

## When To Use Routed Templates Instead

Use `createPublicAppTemplate()` when the app needs route changes, active route navigation, breadcrumbs, route search, command palette entries, route announcements, or route metadata automation.

## Manual Checks

- The app mounts into the expected target.
- The page has one correct `h1`.
- Header, footer, and content text refresh after locale changes.
- Metadata refreshes after locale changes when metadata uses locale-dependent identity.
- Diagnostics are healthy, with intentional omissions configured explicitly.
- The page has no horizontal overflow on mobile.
