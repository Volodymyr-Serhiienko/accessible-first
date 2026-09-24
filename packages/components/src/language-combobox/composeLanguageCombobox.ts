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
    getLanguagePickerWidth,
    type LanguagePickerItem,
    type LanguagePickerItemLabelResolver,
    type LanguagePickerNameFormat
} from "../language-select/languageOptions";

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
    let persist = options.persist;
    let syncDocumentLanguage = options.syncDocumentLanguage;
    let width = options.width ?? null;
    let autoWidth = options.autoWidth ?? true;
    let onLocaleChange = options.onLocaleChange ?? null;
    let unsubscribeLocale: (() => void) | null = null;

    function getItems(): LanguageComboboxItem<TLocale>[] {
        return getLanguagePickerItems(
            currentOptions,
            currentOptions.locale.getLocale(),
            currentOptions.locale.supportedLocales
        );
    }

    function syncSizing(items: readonly LanguageComboboxItem<TLocale>[]): void {
        const nextWidth = getLanguagePickerWidth(
            width,
            autoWidth,
            items,
            getLabel(currentOptions)
        );

        if (nextWidth === null) {
            combobox.element.style.removeProperty("--af-language-combobox-width");
            return;
        }

        combobox.element.style.setProperty("--af-language-combobox-width", nextWidth);
    }

    function syncComboboxFromLocale(): void {
        const items = getItems();

        combobox.setItems(getComboboxItems(items));
        combobox.update({ label: getLabel(currentOptions) });
        combobox.setSelectedValue(currentOptions.locale.getLocale());
        syncSizing(items);
    }

    function setLocale(locale: string, setOptions: LocaleSetOptions = {}): TLocale {
        const nextSetOptions: LocaleSetOptions = {
            source: setOptions.source ?? "programmatic"
        };

        if (setOptions.persist !== undefined) {
            nextSetOptions.persist = setOptions.persist;
        } else if (persist !== undefined) {
            nextSetOptions.persist = persist;
        }

        if (setOptions.syncDocumentLanguage !== undefined) {
            nextSetOptions.syncDocumentLanguage = setOptions.syncDocumentLanguage;
        } else if (syncDocumentLanguage !== undefined) {
            nextSetOptions.syncDocumentLanguage = syncDocumentLanguage;
        }

        return currentOptions.locale.setLocale(locale, nextSetOptions);
    }

    const initialItems = getItems();
    const comboboxOptions: ComboboxCompositionOptions = {
        attributes: {
            ...options.attributes,
            "data-af-language-combobox": ""
        },
        label: getLabel(options),
        items: getComboboxItems(initialItems),
        value: options.locale.getLocale(),
        autocomplete: "none",
        filterOption: null,
        openOnFocus: true,
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
                detail.reason !== "selection"
                || detail.value === null
                || detail.event === null
            ) {
                return;
            }

            const previousLocale = currentOptions.locale.getLocale();
            const nextLocale = setLocale(detail.value, { source: "programmatic" });

            if (nextLocale === previousLocale) return;

            onLocaleChange?.(
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

    syncSizing(initialItems);

    function syncLocaleSubscription(): void {
        unsubscribeLocale?.();
        unsubscribeLocale = currentOptions.locale.subscribe(() => {
            syncComboboxFromLocale();
        });
    }

    syncLocaleSubscription();

    composed = {
        element: combobox.element,
        combobox,
        control: combobox.input,
        getLocale: () => currentOptions.locale.getLocale(),
        setLocale,

        update(nextOptions): void {
            currentOptions = {
                ...currentOptions,
                ...nextOptions
            };

            if ("persist" in nextOptions) persist = nextOptions.persist;
            if ("syncDocumentLanguage" in nextOptions) {
                syncDocumentLanguage = nextOptions.syncDocumentLanguage;
            }
            if ("width" in nextOptions) width = nextOptions.width ?? null;
            if (nextOptions.autoWidth !== undefined) autoWidth = nextOptions.autoWidth;
            if ("onLocaleChange" in nextOptions) {
                onLocaleChange = nextOptions.onLocaleChange ?? null;
            }

            combobox.update(getUpdateOptions(nextOptions));
            syncComboboxFromLocale();
        },

        destroy(): void {
            unsubscribeLocale?.();
            unsubscribeLocale = null;
            combobox.destroy();
        },

        isDestroyed: () => combobox.isDestroyed()
    };

    return composed;
}
