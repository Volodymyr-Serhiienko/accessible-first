# Localization

Localization is the planned shared layer for user-facing service text in Accessible First.

The goal is not to translate application content for developers. Application copy, product names, lesson text, marketing text, and domain-specific labels remain owned by the app. The framework should localize only the small service text it creates or defaults, such as close labels, dismiss labels, command search placeholders, generic region labels, and route action prefixes.

## Locale Resolution

Accessible First should resolve locale in this order:

1. Explicit application locale.
2. Saved user preference.
3. URL, route, or app context when the application owns that rule.
4. Browser/system language through `navigator.languages` or `navigator.language`.
5. Configured fallback locale.

Do not use geographic location as the default way to choose UI language. It is privacy-sensitive, often requires permission, and often does not match the user's preferred interface language.

## Message Layers

User-facing component service text should move behind localization first. Current examples include:

- dialog close and alert-dialog cancel labels;
- toast region, close, and dismiss labels;
- command palette search label, placeholder, and description;
- route command prefixes such as `Open`;
- generic list/detail region labels;
- future header actions such as language selection.

Application-facing copy should stay explicit in application code. Examples include button text, form labels, validation messages, route labels, screen titles, and demo content.

Developer-facing diagnostics text is a separate layer. Console diagnostics can remain English until a later diagnostics localization pass.

## Planned API Shape

The first implementation should stay small:

```ts
const locale = createLocaleController({
    supportedLocales: ["en", "uk", "ru"],
    fallbackLocale: "en",
    messages: {
        en: accessibleFirstEnglishMessages,
        uk: accessibleFirstUkrainianMessages,
        ru: accessibleFirstRussianMessages
    }
});

locale.getLocale();
locale.setLocale("uk");
locale.t("toast.closeLabel");
```

A future header control should use the same controller:

```ts
HeaderBar({
    actions: LanguageSelect({
        locale,
        languages: [
            { value: "en", label: "English" },
            { value: "uk", label: "Українська" },
            { value: "ru", label: "Русский" }
        ]
    })
});
```

The selector should be optional. Applications can still choose locale from server settings, account settings, route prefixes, or any other integration.

## Component Rules

- Components must accept explicit text options for labels they expose.
- If a component has a framework-provided fallback label, that fallback should come from localization.
- Components should not infer application-specific labels from geography.
- Missing translation keys should fall back predictably and remain diagnosable in development.
- Locale changes should update future composed components without requiring the whole page architecture to change.

## First Migration Targets

1. Inventory all remaining user-facing fallback strings.
2. Add a small locale controller and default message registry.
3. Migrate the safest fallback strings first: Toast, Dialog, AlertDialog, ListDetail, CommandPalette, and route command prefixes.
4. Add a language selector component for HeaderBar/AppShell use.
5. Add a playground locale demo after the API shape is stable.