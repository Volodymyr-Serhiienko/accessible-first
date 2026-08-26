# Localization

Localization is the shared layer for user-facing service text in Accessible First.

The framework localizes only the small pieces of text it creates or defaults: close labels, dismiss labels, command search placeholders, generic region labels, route action prefixes, and similar UI service text. Application copy remains owned by the application.

## Locale Resolution

Accessible First resolves locale in this order:

1. Explicit application locale.
2. Saved user preference.
3. URL, route, account, or app context when the application owns that rule.
4. Browser/system language through `navigator.languages` or `navigator.language`.
5. Configured fallback locale.

Do not use geographic location as the default way to choose UI language. It is privacy-sensitive, often requires permission, and often does not match the user's preferred interface language.

## Message Layers

Framework service text belongs in the Accessible First message registry. Examples:

- dialog close labels and dialog fallback accessible names;
- alert-dialog cancel and confirm labels;
- toast region, close, dismiss, and fallback notification labels;
- command palette title, description, search label, placeholder, and empty result text;
- route command prefixes such as `Open`;
- generic list/detail, breadcrumbs, page navigation, overflow scroller, responsive navigation, header tools, theme toggle, icon-button, and text-field fallback labels.

Application copy stays explicit in application code or in the application's own locale files. Examples include product names, route labels, screen titles, lesson text, form labels, button text, validation copy chosen by the app, marketing text, and demo content.

Developer diagnostics are a separate layer. Console diagnostics can remain English until a later diagnostics localization pass.

## API

Create one locale controller near the app shell:

```ts
const locale = createLocaleController({
    supportedLocales: ["en", "uk", "ru"],
    fallbackLocale: "en",
    messages: {
        uk: {
            "dialog.closeText": "Закрити",
            "alertDialog.cancelText": "Скасувати"
        },
        ru: {
            "dialog.closeText": "Закрыть",
            "alertDialog.cancelText": "Отмена"
        }
    }
});
```

Pass the same controller to components that create framework-owned service text:

```ts
const page = createPage({ locale });

const dialog = Dialog({
    trigger: "Open settings",
    title: "Settings",
    description: "Change application preferences.",
    locale,
    children: [settingsContent]
});

const toasts = ToastViewport({ locale });
```

The same controller can hold app-specific keys when the app defines its own message union:

```ts
type AppMessageKey =
    | AccessibleFirstMessageKey
    | "app.header.title"
    | "lessons.startButton";

const locale = createLocaleController<"en" | "uk" | "ru", AppMessageKey>({
    supportedLocales: ["en", "uk", "ru"],
    fallbackLocale: "en",
    messages: {
        uk: {
            "app.header.title": "Мій застосунок",
            "lessons.startButton": "Почати урок"
        }
    }
});
```

## Application Template

Applications should keep one locale file near the app shell. The playground uses `playground/demo/localization.ts` as the reference template:

- define the supported locale tuple;
- define an app-specific message-key union;
- combine it with `AccessibleFirstMessageKey`;
- create one shared `createLocaleController()` instance;
- export a small `t(key, params?)` helper for application-owned strings;
- use `createLocaleRefresh()` near the app shell when composed app copy should update without reload;
- pass the same controller to `AppShell`, `ThemeToggle`, `ToastViewport`, route navigation, command palette, dialogs, and other localized components.

English framework fallback text is built into Accessible First. Non-English applications should provide translated `AccessibleFirstMessageKey` values in their locale file, next to application copy. Missing keys fall back to English.

For application-owned text created during composition, use `createLocaleRefresh()` near the app shell. It subscribes to the shared locale controller and lets the app refresh header text, route search, command palettes, breadcrumbs, metadata, and the current screen without a full page reload.

## Reactive App Refresh

Framework-owned component service text updates inside components that receive the shared locale controller. Application-owned text produced with `t(...)` belongs to the app, so the app should refresh the affected shell regions deliberately:

```ts
const localeRefresh = createLocaleRefresh({
    locale,
    refresh() {
        shell.update({
            title: t("app.title"),
            skipLink: t("app.skipLink"),
            navigationLabel: t("app.navigationLabel"),
            metadata: getAppMetadata()
        });
        shell.setHeader(AppHeader());
        shell.setNavigation(AppNavigation());
        shell.setBeforeOutlet(AppBreadcrumbs(router.getCurrentRoute()));
        router.refresh({
            scroll: false,
            focusTarget: null,
            announcement: false
        });
    }
});
```

Use this layer for app chrome and currently visible route content. It is intentionally small: no virtual DOM is required, and the app decides which regions need to be recreated.

For hash-routed SPAs, `createHashRoutedApp()` can own this wiring: pass `locale` and `renderChrome(...)`, and it will refresh chrome plus the current route on locale changes. For native-link or MPA pages, `createLinkRoutedApp()` can refresh app-owned chrome and route metadata without intercepting links.

## Component Contract

- Components accept explicit text options for labels they expose.
- Explicit component text always wins over localization fallback text.
- `undefined` means: use the localized framework fallback when the component owns a fallback.
- `null` keeps its existing semantic meaning for that option, usually disabling a label, description, or prefix when the option already supported `null`.
- Components with a `locale` option should subscribe to locale changes when the provider supports `subscribe()`.
- Components must not infer application-specific labels from geography.
- Missing translation keys fall back predictably to English built-ins.

## Current Service-Text Migration

The first migration covers these framework-owned fallbacks:

- `AlertDialog`: cancel and confirm labels.
- `Breadcrumbs`: default navigation label.
- `CommandPalette`: title, description, search label, placeholder, empty result text, and internal dialog close fallback.
- `Dialog`: close button text in composition and behavior fallback accessible names.
- `IconButton`: missing accessible-name fallback.
- `LanguageSelect`: default language picker label.
- `LocaleRefresh`: app-owned refresh callbacks for composed shell and route text.
- `ListDetail`: list/detail region labels.
- `OverflowScroller`: previous/next control labels.
- `Page`: skip-link text and default navigation label.
- `ResponsiveNavigation`: mobile trigger text and internal overflow scroller labels.
- `RouteCommandPalette`: route command prefix.
- `TextField`: strict email-pattern fallback validation text.
- `ThemeToggle`: toggle labels and default change announcements.
- `ToastViewport`: region label, close/dismiss labels, and fallback notification text.

LanguageSelect is the current simple header control for user-selected locale changes. A richer `LanguageMenu` or action-overflow pattern should be added only if native select is not enough for a specific app header.

## Future I18n Gates

Before many real applications depend on localization, plan these extensions deliberately:

- higher-level app text binding helpers when repeated real-app patterns prove useful;
- date, time, number, and relative-time formatting helpers;
- pluralization and parameter formatting conventions;
- locale-aware search, filtering, and sorting options;
- document `dir` / RTL support;
- diagnostics for missing app translations and unsupported locales.

Keep geography out of default locale detection. Browser language, saved preference, URL/app context, or account preference should remain the preferred signals.
