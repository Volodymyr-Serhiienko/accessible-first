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

Shell refresh re-reads the identity and metadata resolvers once and derives fresh
identity metadata. Explicit `shell.title` wins over the identity title;
`shell.metadata.title` wins over both. `shell.metadata: false` disables generated
metadata. Updates are partial: use explicit null metadata fields to clear old
managed values; removing a field/identity does not clear every previously written
field automatically. `refresh({ content: false })` retains the existing view.

`localeRefresh: false` disables that subscription. Synchronous scheduling with
`immediate: true` is supported: the runtime controller exists before the first refresh.

Refreshes are synchronous, but a nested refresh/destroy invalidates remaining older
work. Unaccepted factory results are released; already transferred trees, including
current outlet content, are never destroyed a second time. A later factory failure
cleans newly prepared slots without removing retained slots. This is not rollback:
regions already committed before the failure stay committed. Callbacks own side
effects they have already performed and resources they never return.

## Lifecycle

During initial preparation, the template owns content returned by slot/content
factories. If a later factory throws, earlier results are destroyed once in reverse
order and the original error is rethrown even if cleanup fails. Static supplied
nodes remain caller-owned until `AppShell` is called. A factory must release any
resources it allocates but never returns; do not return another live owner's tree.

Default cleanup preserves an app hidden into the back/forward cache and disposes
it on a real document exit. Explicit `destroy()` removes its listener and all
owned resources; remaining cleanup and DOM removal still run if one callback fails.
Failures during locale-refresh setup, mounting or initial diagnostic logging
release resources already accepted by the template and rethrow the startup error.
After destruction, app-level diagnostic methods return `null` without evaluating
sources. A caller holding the raw diagnostics runner owns any explicit use of it.
For extra app services, own complete teardown using
[addPageHideCleanup](../core/events.md#addpagehidecleanup) and `destroyOnPageHide: false`.

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
