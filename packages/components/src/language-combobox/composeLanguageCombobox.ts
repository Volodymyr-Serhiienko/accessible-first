import {
    Combobox,
    type ComboboxCompositionItem,
    type ComboboxCompositionOptions,
    type ComboboxCompositionUpdateOptions,
    type ComboboxCompositionValueChangeDetail,
    type ComposedCombobox
} from "../combobox";
import type {
    BaseCompositionOptions,
    ComposedNode
} from "../composition";
import {
    type AccessibleFirstMessageKey,
    accessibleFirstEnglishMessages,
    getLocaleText,
    type LocaleCode,
    type LocaleController,
    type LocaleSetOptions
} from "../localization";
import {
    getLanguagePickerItems,
    getLanguagePickerSetOptions,
    getLanguagePickerWidth,
    type LanguagePickerItem,
    type LanguagePickerItemLabelResolver,
    type LanguagePickerNameFormat
} from "../language-select/languageOptions";
import { createLocaleSubscription } from "../localization/createLocaleSubscription";
import { runCleanups } from "../../../core/src/events";

/** Localized message keys used by LanguageCombobox fallback text. */
export type LanguageComboboxMessageKey = "languageSelect.label";

/** One locale option accepted by LanguageCombobox(). */
export type LanguageComboboxItem<TLocale extends LocaleCode = LocaleCode> = LanguagePickerItem<TLocale>;

/** Display format used for automatic locale option names. */
export type LanguageComboboxNameFormat = LanguagePickerNameFormat;

/** Optionally overrides one automatic locale label for the current UI locale. */
export type LanguageComboboxItemLabelResolver<TLocale extends LocaleCode = LocaleCode> = LanguagePickerItemLabelResolver<TLocale>;

/** Details emitted after a combobox selection changes the active locale. */
export interface LanguageComboboxChangeDetail<TLocale extends LocaleCode = LocaleCode> {
    locale: TLocale;
    previousLocale: TLocale;
    event: Event;
    target: HTMLInputElement;
    comboboxDetail: ComboboxCompositionValueChangeDetail;
}

/** Called after LanguageCombobox applies a selected locale. */
export type LanguageComboboxOnLocaleChange<TLocale extends LocaleCode = LocaleCode> = (
    detail: LanguageComboboxChangeDetail<TLocale>,
    combobox: ComposedLanguageCombobox<TLocale>
) => void;

/**
 * Options for LanguageCombobox(). It is deliberately a select-only combobox:
 * the input is read-only and a locale changes only after an option is chosen.
 */
export interface LanguageComboboxOptions<
    TLocale extends LocaleCode = LocaleCode,
    TKey extends string = AccessibleFirstMessageKey
> extends BaseCompositionOptions {
    locale: LocaleController<TLocale, TKey | AccessibleFirstMessageKey>;
    items?: readonly LanguageComboboxItem<TLocale>[];
    label?: string | null;
    labelOptions?: BaseCompositionOptions;
    listboxOptions?: BaseCompositionOptions;
    disabled?: boolean;
    nameFormat?: LanguageComboboxNameFormat;
    getItemLabel?: LanguageComboboxItemLabelResolver<TLocale> | null;
    persist?: LocaleSetOptions["persist"];
    syncDocumentLanguage?: LocaleSetOptions["syncDocumentLanguage"];
    width?: string | null;
    autoWidth?: boolean;
    onLocaleChange?: LanguageComboboxOnLocaleChange<TLocale> | null;
}

/** Options accepted by ComposedLanguageCombobox.update(). */
export interface LanguageComboboxUpdateOptions<
    TLocale extends LocaleCode = LocaleCode,
    TKey extends string = AccessibleFirstMessageKey
> extends Partial<Omit<LanguageComboboxOptions<TLocale, TKey>, "locale" | "items">> {}

/** A select-only language combobox synchronized with a LocaleController. */
export interface ComposedLanguageCombobox<TLocale extends LocaleCode = LocaleCode>
    extends ComposedNode<HTMLElement> {
    readonly element: HTMLElement;
    readonly combobox: ComposedCombobox;
    readonly control: HTMLInputElement;
    getLocale(): TLocale;
    setLocale(locale: string, options?: LocaleSetOptions): TLocale;
    update(options: LanguageComboboxUpdateOptions<TLocale>): void;
    destroy(): void;
    isDestroyed(): boolean;
}

function getLabel<TLocale extends LocaleCode, TKey extends string>(
    options: LanguageComboboxOptions<TLocale, TKey>
): string | null {
    if (options.label !== undefined) return options.label;

    return getLocaleText(
        options.locale,
        "languageSelect.label",
        accessibleFirstEnglishMessages["languageSelect.label"]
    );
}

function getComboboxItems<TLocale extends LocaleCode>(
    items: readonly LanguageComboboxItem<TLocale>[]
): ComboboxCompositionItem[] {
    return items.map((item) => {
        const comboboxItem: ComboboxCompositionItem = {
            value: item.locale,
            label: item.label ?? item.locale
        };

        if (item.disabled !== undefined) comboboxItem.disabled = item.disabled;
        if (item.optionOptions !== undefined) comboboxItem.optionOptions = item.optionOptions;

        return comboboxItem;
    });
}

function getUpdateOptions<TLocale extends LocaleCode, TKey extends string>(
    options: LanguageComboboxUpdateOptions<TLocale, TKey>
): ComboboxCompositionUpdateOptions {
    const updateOptions: ComboboxCompositionUpdateOptions = {};

    if (options.id !== undefined) updateOptions.id = options.id;
    if (options.className !== undefined) updateOptions.className = options.className;
    if (options.attributes !== undefined) {
        updateOptions.attributes = {
            ...options.attributes,
            "data-af-language-combobox": ""
        };
    }
    if (options.labelOptions !== undefined) updateOptions.labelOptions = options.labelOptions;
    if (options.listboxOptions !== undefined) updateOptions.listboxOptions = options.listboxOptions;
    if (options.disabled !== undefined) updateOptions.disabled = options.disabled;

    return updateOptions;
}

/** Creates a select-only language picker that applies locale changes on selection. */
export function LanguageCombobox<
    TLocale extends LocaleCode = LocaleCode,
    TKey extends string = AccessibleFirstMessageKey
>(options: LanguageComboboxOptions<TLocale, TKey>): ComposedLanguageCombobox<TLocale> {
    let composed!: ComposedLanguageCombobox<TLocale>;
    let currentOptions = options;
    let destroyed = false;
    let revision = 0;
    let changeRevision = 0;
    let renderedLocale = options.locale.getLocale();
    let renderedItems = getLanguagePickerItems(options, renderedLocale, options.locale.supportedLocales);
    const initialLabel = getLabel(options);

    function syncSizing(items: readonly LanguageComboboxItem<TLocale>[], label: string | null): void {
        const nextWidth = getLanguagePickerWidth(currentOptions.width ?? null, currentOptions.autoWidth ?? true, items, label);

        if (nextWidth === null) {
            combobox.element.style.removeProperty("--af-language-combobox-width");
            return;
        }

        combobox.element.style.setProperty("--af-language-combobox-width", nextWidth);
    }

    function syncFromLocale(nextOptions: LanguageComboboxUpdateOptions<TLocale, TKey>, refreshItems = false): void {
        if (destroyed) return;
        const current = ++revision;
        const locale = currentOptions.locale.getLocale();
        const replaceLabels = refreshItems || locale !== renderedLocale || "nameFormat" in nextOptions || "getItemLabel" in nextOptions;
        const items = replaceLabels ? getLanguagePickerItems(currentOptions, locale, currentOptions.locale.supportedLocales) : renderedItems;
        const label = getLabel(currentOptions);
        if (destroyed || current !== revision) return;
        const updateOptions: ComboboxCompositionUpdateOptions = { ...getUpdateOptions(nextOptions), label };
        if (replaceLabels) updateOptions.items = getComboboxItems(items);
        if (refreshItems || locale !== renderedLocale) updateOptions.value = locale;
        renderedItems = items;
        renderedLocale = locale;
        combobox.update(updateOptions);
        if (!destroyed && current === revision) syncSizing(items, label);
    }

    function setLocale(locale: string, setOptions: LocaleSetOptions = {}): TLocale {
        if (destroyed) return currentOptions.locale.getLocale();
        const current = ++changeRevision;
        const nextLocale = currentOptions.locale.setLocale(locale, getLanguagePickerSetOptions(currentOptions, setOptions));
        if (!destroyed && current === changeRevision) combobox.setSelectedValue(nextLocale);
        return nextLocale;
    }

    const comboboxOptions: ComboboxCompositionOptions = {
        attributes: {
            ...options.attributes,
            "data-af-language-combobox": ""
        },
        label: initialLabel,
        items: getComboboxItems(renderedItems),
        value: renderedLocale,
        autocomplete: "none",
        filterOption: null,
        openOnFocus: false,
        openOnInput: false,
        closeOnBlur: true,
        dismissKeyboardOnSelection: true,
        inputOptions: {
            attributes: {
                readonly: true,
                inputmode: "none"
            }
        },
        onValueChange: (detail) => {
            if (
                destroyed || detail.reason !== "selection"
                || detail.value === null
                || detail.event === null
            ) {
                return;
            }

            const previousLocale = currentOptions.locale.getLocale();
            const expectedLocale = currentOptions.locale.resolve(detail.value);
            const current = changeRevision + 1;
            const nextLocale = setLocale(detail.value);
            if (destroyed || current !== changeRevision || nextLocale !== expectedLocale || nextLocale === previousLocale) return;
            currentOptions.onLocaleChange?.(
                {
                    locale: nextLocale,
                    previousLocale,
                    event: detail.event,
                    target: combobox.input,
                    comboboxDetail: detail
                },
                composed
            );
        }
    };

    if (options.id !== undefined) comboboxOptions.id = options.id;
    if (options.className !== undefined) comboboxOptions.className = options.className;
    if (options.labelOptions !== undefined) comboboxOptions.labelOptions = options.labelOptions;
    if (options.listboxOptions !== undefined) comboboxOptions.listboxOptions = options.listboxOptions;
    if (options.disabled !== undefined) comboboxOptions.disabled = options.disabled;

    const combobox = Combobox(comboboxOptions);

    syncSizing(renderedItems, initialLabel);
    const localeSubscription = createLocaleSubscription(() => syncFromLocale({}, true));

    composed = {
        element: combobox.element,
        combobox,
        control: combobox.input,
        getLocale: () => currentOptions.locale.getLocale(),
        setLocale,

        update(nextOptions): void {
            if (destroyed) return;
            currentOptions = {
                ...currentOptions,
                ...nextOptions
            };

            syncFromLocale(nextOptions);
        },

        destroy(): void {
            if (destroyed) return;
            destroyed = true;
            revision += 1;
            changeRevision += 1;
            runCleanups([localeSubscription.destroy, combobox.destroy]);
        },

        isDestroyed: () => destroyed || combobox.isDestroyed()
    };

    try { localeSubscription.replace(options.locale); }
    catch (error) {
        try { composed.destroy(); } catch { /* Preserve the construction failure. */ }
        throw error;
    }

    return composed;
}
