# LanguageCombobox

LanguageCombobox is a select-only combobox synchronized with an Accessible First `LocaleController`.

Use it when choosing a language must not apply immediately while a keyboard user moves through options. Arrow keys move the active option; `Enter` or a pointer selection applies the locale. For ordinary forms and settings, prefer [LanguageSelect](./language-select.md), which keeps native select behavior.

## Quick Start

```ts
LanguageCombobox({
    locale,
    nameFormat: "localized-and-native"
});
```

For an AppHeader, opt in explicitly:

```ts
AppHeader({
    locale,
    language: {
        control: "combobox",
        nameFormat: "localized-and-native"
    }
});
```

## Behavior

- Uses the current locale and `locale.supportedLocales` to generate items unless `items` is supplied.
- Keeps the input read-only: it is a language chooser, not a text-search field.
- Opens on focus. Arrow keys only change the active listbox option.
- Applies the locale only after `Enter` or pointer selection, then persists and synchronizes `document.lang` through the locale controller.
- Uses the same `nameFormat`, exceptional-label resolver, item language metadata, and automatic width calculation as LanguageSelect.
- Reacts to external locale changes and refreshes the selected value and localized labels.

## Options

- `locale` - required `LocaleController` instance.
- `items`, `nameFormat`, `getItemLabel` - language item configuration shared with LanguageSelect.
- `label`, `labelOptions` - accessible input label; the label defaults to localized `languageSelect.label`.
- `listboxOptions` - composition options for the popup listbox.
- `persist`, `syncDocumentLanguage` - locale-controller overrides.
- `width`, `autoWidth` - control width settings.
- `onLocaleChange` - runs after a committed user selection.
- `disabled`, `id`, `className`, `attributes` - standard component options.

## Styling

Useful hooks: `[data-af-language-combobox]`, `[data-af-composition="combobox"]`, `[data-af-combobox-label]`, `[data-af-combobox-listbox]`, and `[data-af-combobox-option]`.

`--af-language-combobox-width` is set automatically from the longest current language label unless `autoWidth: false` or an explicit `width` is supplied.

## Manual Checks

- Focusing the control opens the available language list without changing the active locale.
- Arrow keys update the active option; `Enter` applies it once.
- Escape and focus loss close the list without applying a pending option.
- Pointer selection applies one locale and returns focus predictably.
- Localized-and-native labels remain intelligible for both sighted users and screen readers.
