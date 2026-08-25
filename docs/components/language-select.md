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
- Persists changes through `locale.setLocale()` using the controller storage rules.
- Updates `document.documentElement.lang` through the locale controller unless disabled.
- Subscribes to locale changes and keeps the native select value synchronized.
- Uses native select behavior on desktop and mobile.
- Auto-sizes the native select from the longest current language name or label, with an explicit `width` override when needed.

## Options

- `locale` - Required `LocaleController` instance.
- `items` - Optional custom language items. Defaults to `locale.supportedLocales`.
- `label` - Optional select label. Defaults to localized `languageSelect.label`.
- `persist` - Optional override for whether user changes are saved.
- `syncDocumentLanguage` - Optional override for `document.lang` synchronization.
- `width` - Optional explicit CSS width for the language control. When omitted, the control auto-sizes.
- `autoWidth` - Set to `false` to disable automatic width calculation.
- `onLocaleChange` - Called after a user selection changes the active locale.
- Select options inherited from `Select`: `disabled`, `required`,
ame`, `variant`, `size`, `labelOptions`, `selectOptions`, `visibleRows`.
- Base options: `id`, `className`, `attributes`.

## Custom Items

```ts
LanguageSelect({
    locale,
    items: [
        { locale: "en", label: "English" },
        { locale: "uk", label: "Українська" },
        { locale: "ru", label: "Русский" }
    ]
});
```

When labels are omitted, LanguageSelect uses `Intl.DisplayNames` where available and falls back to the locale code.

## Runtime App Text

LanguageSelect changes the locale controller. Components that subscribe to the controller update themselves. Application-owned text produced with `t(...)` should refresh through the application layer, usually with `createLocaleRefresh()` near `AppShell`.

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
