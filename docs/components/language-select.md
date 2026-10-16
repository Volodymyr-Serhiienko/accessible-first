# LanguageSelect

LanguageSelect creates a native language picker synchronized with an Accessible First `LocaleController`.

Use it in app headers, settings screens, onboarding, or account preferences when users should be able to override automatic browser-language detection.

## Quick Start

```ts
const locale = createLocaleController({
    supportedLocales: ["en", "uk", "ru"],
    fallbackLocale: "en",
    storageKey: "app.locale",
    messages
});

HeaderBar({
    brand: Brand({ name: "My App" }),
    actions: LanguageSelect({ locale })
});
```

Compact header control with a visually hidden label:

```ts
LanguageSelect({
    locale,
    labelOptions: {
        attributes: {
            "data-af-composition": "visually-hidden"
        }
    }
});
```

## Layers

- Composition API: `LanguageSelect(options)`
- Reuses: `Select`, native `select`, `LocaleController`, browser `Intl.DisplayNames` when available

## Behavior

- Reads the current locale from `locale.getLocale()`.
- Uses `locale.supportedLocales` to create options when custom `items` are not provided.
- Can show automatic option names in the interface language, their native
  language, or both. The combined format leads with the interface-language
  name, so a screen reader can pronounce the option coherently.
- Persists changes through `locale.setLocale()` using the controller storage rules.
- Updates `document.documentElement.lang` through the locale controller unless disabled.
- Subscribes to locale changes and keeps the native select value synchronized.
- Uses native select behavior on desktop and mobile.
- Auto-sizes the native select from the longest current language name or label, with an explicit `width` override when needed.

## Options

- `locale` - Required `LocaleController` instance.
- `items` - Optional custom language items. Defaults to `locale.supportedLocales`.
- `nameFormat` - Format for automatic names: `"localized"` (default),
  `"native"`, or `"localized-and-native"`. Ignored when `items` is provided.
- `getItemLabel` - Optional resolver for exceptional automatic names. It receives
  the item locale and current UI locale; return `null` to use `nameFormat`.
- `label` - Optional select label. Defaults to localized `languageSelect.label`.
- `persist` - Optional override for whether user changes are saved.
- `syncDocumentLanguage` - Optional override for `document.lang` synchronization.
- `width` - Optional explicit CSS width for the language control. When omitted, the control auto-sizes.
- `autoWidth` - Set to `false` to disable automatic width calculation.
- `onLocaleChange` - Called after a user selection changes the active locale.
- Select options inherited from `Select`: `disabled`, `required`, `name`,
  `variant`, `size`, `labelOptions`, `selectOptions`, `visibleRows`.
- Base options: `id`, `className`, `attributes`.

## Custom Items

```ts
LanguageSelect({
    locale,
    items: [
        { locale: "en", label: "English", optionOptions: { attributes: { lang: "en" } } },
        { locale: "uk", label: "Українська", optionOptions: { attributes: { lang: "uk" } } },
        { locale: "ru", label: "Русский", optionOptions: { attributes: { lang: "ru" } } }
    ]
});
```

When labels are omitted, LanguageSelect uses `Intl.DisplayNames` where available and falls back to the locale code.

Automatic `native` names carry the item's language. Localized, combined and
resolver-produced names carry the UI language. Explicit labels remain unchanged;
set `optionOptions.attributes.lang` for foreign custom labels. Native option text
cannot mark the parenthesized part of a combined name as a separate language.

To retain a native name for sighted users while making the leading text match
the active interface language, omit `items` and use:

```ts
LanguageSelect({
    locale,
    nameFormat: "localized-and-native"
});
```

## Runtime App Text

LanguageSelect changes the locale controller. Components that subscribe to the controller update themselves. Application-owned text produced with `t(...)` should refresh through the application layer, usually with `createLocaleRefresh()` near `AppShell`.

## Updates And Ownership

Locale/items/placeholder are creation-time options. Other `update()` calls retain
the native control and option nodes; chrome-only updates do not rerun label
resolvers or reset the current choice. Explicit labels, including `null`, persist.
Resolvers should normally be pure; a newer update or destruction during a resolver
supersedes its older result. Automatic width is a preferred size, not a pixel-perfect
text measurement; responsive CSS still constrains the control.

Use the wrapper's `setLocale()` for programmatic changes. It is silent and honors
`LocaleSetOptions`, including per-call persistence, language/direction and source
overrides. Only an actual user locale change invokes `onLocaleChange`; a newer
locale change or destruction during controller notification cancels stale feedback.
Native form reset alone does not change the shared locale controller; app-level
locale reset must call `setLocale()`.

The exposed `select` is borrowed, while the LocaleController remains caller-owned.
Destroy the wrapper, not its parts. Destruction is terminal/idempotent, completes
underlying cleanup after unsubscribe failure and ignores stale notifications/late
updates. A late `setLocale()` returns the controller's current value without changing it.

## Styling

Useful hooks include `[data-af-language-select]`, `[data-af-composition="select"]`, `[data-af-select-label]`, and `[data-af-component="select"]`.

Useful variables:

- `--af-language-select-width` - preferred control width. Set automatically by default from the longest localized option label.
- `--af-select-width` - inherited select width token.

## Manual Checks

- The select has an accessible label, visible or visually hidden.
- Keyboard and mobile screen reader users can open and change the native select.
- Changing language updates `document.documentElement.lang`.
- The selected language persists after reload when storage is enabled.
- Header layout remains usable with longer localized language names.
- With `localized-and-native`, each option leads with a name that matches the
  interface language and retains the native name in parentheses.
