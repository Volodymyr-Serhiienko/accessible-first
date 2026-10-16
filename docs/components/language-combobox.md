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
- Focus alone leaves the list closed. Click, tap or Space toggles it intentionally; Arrow keys open it for keyboard navigation and then change only the active listbox option. This behavior comes from the shared read-only Combobox.
- Applies the locale only after `Enter` or pointer selection, then persists and synchronizes `document.lang` through the locale controller.
- Uses the same `nameFormat`, exceptional-label resolver, item language metadata, and automatic width calculation as LanguageSelect.
- Reacts to external locale changes and refreshes the selected value and localized labels.
- Retains option nodes and input focus during label refresh. Chrome-only updates
  also preserve an open, uncommitted keyboard choice and do not rerun label resolvers.

## Options

- `locale` - required `LocaleController` instance.
- `items`, `nameFormat`, `getItemLabel` - language item configuration shared with LanguageSelect.
- `label`, `labelOptions` - accessible input label; the label defaults to localized `languageSelect.label`.
- `listboxOptions` - composition options for the popup listbox.
- `persist`, `syncDocumentLanguage` - locale-controller overrides.
- `width`, `autoWidth` - control width settings.
- `onLocaleChange` - runs after a committed user selection.
- `disabled`, `id`, `className`, `attributes` - standard component options.

## Updates And Ownership

Locale and item values are creation-time options. Labels, naming format, resolver,
width and control chrome can be updated. Explicit label/null persists across other
updates. Native automatic names have their own item language; localized/combined
and resolver-produced names use the UI language. Custom missing labels resolve to
localized names, as in LanguageSelect; set option `lang` for foreign explicit labels.

Resolvers should normally be pure. A newer update/destruction during a resolver
supersedes its older results. External locale changes are authoritative and reset
an uncommitted choice; ordinary style/width/label updates do not.

`setLocale()` is silent and forwards `LocaleSetOptions`, including per-call
direction/persistence overrides. Only an actual user change invokes
`onLocaleChange`; stale feedback after destruction or a newer locale change is
discarded. Keep application refresh scheduled with `createLocaleRefresh()` when
it replaces the triggering control and also needs its user-action callback.

The wrapper owns its Combobox; the exposed part is borrowed. The LocaleController
remains caller-owned. `destroy()` is terminal/idempotent and completes cleanup after
unsubscribe errors. Late callbacks/updates are inert; late `setLocale()` only reads
the controller's current value. Automatic sizing is approximate and stays bounded
by responsive CSS. Verify actual speech and mobile interaction separately.

## Styling

Useful hooks: `[data-af-language-combobox]`, `[data-af-composition="combobox"]`, `[data-af-combobox-label]`, `[data-af-combobox-listbox]`, and `[data-af-combobox-option]`.

`--af-language-combobox-width` is set automatically from the longest current language label unless `autoWidth: false` or an explicit `width` is supplied.

## Manual Checks

- Focusing the control leaves the list closed and does not change the active locale.
- Click, tap and Space toggle the available list; Arrow keys open it and update the active option. `Enter` applies it once, not during IME composition.
- Escape and focus loss close the list without applying a pending option.
- Pointer selection applies one locale and returns focus predictably.
- Localized-and-native labels remain intelligible for both sighted users and screen readers.
