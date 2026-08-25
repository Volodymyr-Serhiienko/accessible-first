import {
    type AccessibleFirstMessageKey,
    accessibleFirstEnglishMessages,
    getLocaleText,
    type LocaleCode,
    type LocaleController,
    type LocaleMessageParams,
    type LocaleSetOptions
} from "../localization";
import {
    Select,
    type ComposedSelect,
    type SelectCompositionChangeDetail,
    type SelectCompositionItem,
    type SelectCompositionOptions,
    type SelectCompositionUpdateOptions
} from "../select";
import type {
    BaseCompositionOptions,
    ComposedNode
} from "../composition";

/**
 * Localized message keys used by LanguageSelect fallback text.
 */
export type LanguageSelectMessageKey = "languageSelect.label";

/**
 * One locale option accepted by LanguageSelect().
 */
export interface LanguageSelectItem<TLocale extends LocaleCode = LocaleCode> {
    locale: TLocale;
    label?: string;
    disabled?: boolean;
    optionOptions?: BaseCompositionOptions;
}

/**
 * Details emitted when LanguageSelect changes the active locale.
 */
export interface LanguageSelectChangeDetail<TLocale extends LocaleCode = LocaleCode> {
    locale: TLocale;
    previousLocale: TLocale;
    event: Event;
    target: HTMLSelectElement;
    selectDetail: SelectCompositionChangeDetail;
}

/**
 * Called after LanguageSelect changes the locale controller value.
 */
export type LanguageSelectOnLocaleChange<TLocale extends LocaleCode = LocaleCode> = (
    detail: LanguageSelectChangeDetail<TLocale>,
    select: ComposedLanguageSelect<TLocale>
) => void;

/**
 * Options for LanguageSelect().
 */
export interface LanguageSelectOptions<
    TLocale extends LocaleCode = LocaleCode,
    TKey extends string = AccessibleFirstMessageKey
> extends Omit<
        SelectCompositionOptions,
        "items" | "value" | "defaultValue" | "multiple" | "onValueChange"
    > {
    locale: LocaleController<TLocale, TKey | AccessibleFirstMessageKey>;
    items?: readonly LanguageSelectItem<TLocale>[];
    persist?: LocaleSetOptions["persist"];
    syncDocumentLanguage?: LocaleSetOptions["syncDocumentLanguage"];
    width?: string | null;
    autoWidth?: boolean;
    onLocaleChange?: LanguageSelectOnLocaleChange<TLocale> | null;
}

/**
 * Options accepted by ComposedLanguageSelect.update().
 * Locale item values are creation-time; recreate the component to change supported locales.
 */
export interface LanguageSelectUpdateOptions<
    TLocale extends LocaleCode = LocaleCode,
    TKey extends string = AccessibleFirstMessageKey
> extends Partial<Omit<LanguageSelectOptions<TLocale, TKey>, "locale" | "items">> {}

/**
 * Language select created by the composition API.
 */
export interface ComposedLanguageSelect<TLocale extends LocaleCode = LocaleCode>
    extends ComposedNode<HTMLElement> {
    readonly element: HTMLElement;
    readonly select: ComposedSelect;
    readonly control: HTMLSelectElement;
    getLocale(): TLocale;
    setLocale(locale: string, options?: LocaleSetOptions): TLocale;
    update(options: LanguageSelectUpdateOptions<TLocale>): void;
    destroy(): void;
    isDestroyed(): boolean;
}

interface DisplayNamesConstructor {
    new(locales: string | readonly string[], options: { type: "language" }): {
        of(code: string): string | undefined;
    };
}

function getDisplayNamesConstructor(): DisplayNamesConstructor | null {
    const intl = Intl as typeof Intl & { DisplayNames?: DisplayNamesConstructor };

    return intl.DisplayNames ?? null;
}

function getLocaleDisplayName(locale: string, displayLocale: string): string {
    const DisplayNames = getDisplayNamesConstructor();

    if (!DisplayNames) return locale.toUpperCase();

    try {
        return new DisplayNames([displayLocale, locale, "en"], {
            type: "language"
        }).of(locale) ?? locale.toUpperCase();
    } catch {
        return locale.toUpperCase();
    }
}

function getLanguageItems<TLocale extends LocaleCode>(
    options: LanguageSelectOptions<TLocale>,
    currentLocale: TLocale
): LanguageSelectItem<TLocale>[] {
    if (options.items !== undefined) return [...options.items];

    return options.locale.supportedLocales.map((locale) => ({
        locale,
        label: getLocaleDisplayName(locale, currentLocale)
    }));
}

function toSelectItems<TLocale extends LocaleCode>(
    items: readonly LanguageSelectItem<TLocale>[],
    currentLocale: TLocale
): SelectCompositionItem[] {
    return items.map((item) => {
        const selectItem: SelectCompositionItem = {
            value: item.locale,
            label: item.label ?? getLocaleDisplayName(item.locale, currentLocale)
        };

        if (item.disabled !== undefined) selectItem.disabled = item.disabled;
        if (item.optionOptions !== undefined) selectItem.optionOptions = item.optionOptions;

        return selectItem;
    });
}

function getTextLength(value: string | null | undefined): number {
    return [...(value?.trim() ?? "")].length;
}

function getAutoLanguageSelectWidth(
    items: readonly SelectCompositionItem[],
    label: string | null
): string {
    const longestTextLength = Math.max(
        4,
        getTextLength(label),
        ...items.map((item) => getTextLength(item.label))
    );

    return `calc(${longestTextLength}ch + 3.25rem)`;
}

function getLanguageSelectWidth(
    width: string | null,
    autoWidth: boolean,
    items: readonly SelectCompositionItem[],
    label: string | null
): string | null {
    const explicitWidth = width?.trim();

    if (explicitWidth) return explicitWidth;
    if (!autoWidth) return null;

    return getAutoLanguageSelectWidth(items, label);
}

function getSelectLabel<TLocale extends LocaleCode>(
    options: LanguageSelectOptions<TLocale> | LanguageSelectUpdateOptions<TLocale>,
    locale: LanguageSelectOptions<TLocale>["locale"]
): string | null {
    if ("label" in options) return options.label ?? null;

    return getLocaleText(
        locale,
        "languageSelect.label",
        accessibleFirstEnglishMessages["languageSelect.label"]
    );
}

function getSelectOptions<TLocale extends LocaleCode>(
    options: LanguageSelectOptions<TLocale>,
    items: SelectCompositionItem[],
    onValueChange: NonNullable<SelectCompositionOptions["onValueChange"]>
): SelectCompositionOptions {
    const selectOptions: SelectCompositionOptions = {
        items,
        value: options.locale.getLocale(),
        label: getSelectLabel(options, options.locale),
        onValueChange
    };

    if (options.id !== undefined) selectOptions.id = options.id;
    if (options.className !== undefined) selectOptions.className = options.className;
    if (options.attributes !== undefined) selectOptions.attributes = options.attributes;
    if (options.labelOptions !== undefined) selectOptions.labelOptions = options.labelOptions;
    if (options.selectOptions !== undefined) selectOptions.selectOptions = options.selectOptions;
    if ("placeholder" in options) selectOptions.placeholder = options.placeholder ?? null;
    if (options.disabled !== undefined) selectOptions.disabled = options.disabled;
    if (options.required !== undefined) selectOptions.required = options.required;
    if ("name" in options) selectOptions.name = options.name ?? null;
    if (options.variant !== undefined) selectOptions.variant = options.variant;
    if (options.size !== undefined) selectOptions.size = options.size;
    if ("visibleRows" in options) selectOptions.visibleRows = options.visibleRows ?? null;

    return selectOptions;
}

function getSelectUpdateOptions<TLocale extends LocaleCode>(
    options: LanguageSelectOptions<TLocale>,
    nextOptions: LanguageSelectUpdateOptions<TLocale>,
    items: readonly LanguageSelectItem<TLocale>[]
): SelectCompositionUpdateOptions {
    const updateOptions: SelectCompositionUpdateOptions = {
        value: options.locale.getLocale(),
        label: getSelectLabel(nextOptions, options.locale),
        items: toSelectItems(items, options.locale.getLocale())
    };

    if (nextOptions.id !== undefined) updateOptions.id = nextOptions.id;
    if (nextOptions.className !== undefined) updateOptions.className = nextOptions.className;
    if (nextOptions.attributes !== undefined) updateOptions.attributes = nextOptions.attributes;
    if (nextOptions.labelOptions !== undefined) updateOptions.labelOptions = nextOptions.labelOptions;
    if (nextOptions.selectOptions !== undefined) updateOptions.selectOptions = nextOptions.selectOptions;
    if (nextOptions.disabled !== undefined) updateOptions.disabled = nextOptions.disabled;
    if (nextOptions.required !== undefined) updateOptions.required = nextOptions.required;
    if ("name" in nextOptions) updateOptions.name = nextOptions.name ?? null;
    if (nextOptions.variant !== undefined) updateOptions.variant = nextOptions.variant;
    if (nextOptions.size !== undefined) updateOptions.size = nextOptions.size;
    if ("visibleRows" in nextOptions) updateOptions.visibleRows = nextOptions.visibleRows ?? null;

    return updateOptions;
}

/**
 * Creates a native language picker synchronized with a LocaleController.
 */
export function LanguageSelect<
    TLocale extends LocaleCode = LocaleCode,
    TKey extends string = AccessibleFirstMessageKey
>(options: LanguageSelectOptions<TLocale, TKey>): ComposedLanguageSelect<TLocale> {
    let composed!: ComposedLanguageSelect<TLocale>;
    let currentOptions: LanguageSelectOptions<TLocale> = options;
    let persist = options.persist;
    let syncDocumentLanguage = options.syncDocumentLanguage;
    let width = options.width ?? null;
    let autoWidth = options.autoWidth ?? true;
    let onLocaleChange = options.onLocaleChange ?? null;
    let unsubscribeLocale: (() => void) | null = null;

    const initialItems = getLanguageItems(currentOptions, currentOptions.locale.getLocale());
    const initialSelectItems = toSelectItems(initialItems, currentOptions.locale.getLocale());

    function syncLanguageSelectSizing(
        selectItems: readonly SelectCompositionItem[],
        label: string | null
    ): void {
        const nextWidth = getLanguageSelectWidth(width, autoWidth, selectItems, label);

        if (nextWidth === null) {
            select.element.style.removeProperty("--af-language-select-width");
            return;
        }

        select.element.style.setProperty("--af-language-select-width", nextWidth);
    }

    function syncSelectFromLocale(): void {
        const items = getLanguageItems(currentOptions, currentOptions.locale.getLocale());
        const label = getSelectLabel(currentOptions, currentOptions.locale);
        const selectItems = toSelectItems(items, currentOptions.locale.getLocale());

        select.update({
            value: currentOptions.locale.getLocale(),
            label,
            items: selectItems
        });
        syncLanguageSelectSizing(selectItems, label);
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

        const nextLocale = currentOptions.locale.setLocale(locale, nextSetOptions);

        select.setValue(nextLocale);

        return nextLocale;
    }

    const handleValueChange = (detail: SelectCompositionChangeDetail): void => {
        const previousLocale = currentOptions.locale.getLocale();
        const nextLocale = setLocale(detail.value, {
            source: "programmatic"
        });

        if (nextLocale === previousLocale) return;

        onLocaleChange?.(
            {
                locale: nextLocale,
                previousLocale,
                event: detail.event,
                target: select.select,
                selectDetail: detail
            },
            composed
        );
    };

    const select = Select(getSelectOptions(
        currentOptions,
        initialSelectItems,
        handleValueChange
    ));

    select.element.setAttribute("data-af-language-select", "");
    syncLanguageSelectSizing(initialSelectItems, getSelectLabel(currentOptions, currentOptions.locale));

    function syncLocaleSubscription(): void {
        unsubscribeLocale?.();
        unsubscribeLocale = null;

        unsubscribeLocale = currentOptions.locale.subscribe(() => {
            syncSelectFromLocale();
        });
    }

    syncLocaleSubscription();

    composed = {
        element: select.element,
        select,
        control: select.select,
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
            if ("onLocaleChange" in nextOptions) {
                onLocaleChange = nextOptions.onLocaleChange ?? null;
            }
            if ("width" in nextOptions) width = nextOptions.width ?? null;
            if ("autoWidth" in nextOptions) autoWidth = nextOptions.autoWidth ?? true;

            const items = getLanguageItems(currentOptions, currentOptions.locale.getLocale());
            const selectItems = toSelectItems(items, currentOptions.locale.getLocale());
            const label = getSelectLabel(currentOptions, currentOptions.locale);

            select.update(getSelectUpdateOptions(currentOptions, nextOptions, items));
            select.element.setAttribute("data-af-language-select", "");
            syncLanguageSelectSizing(selectItems, label);
        },

        destroy(): void {
            unsubscribeLocale?.();
            unsubscribeLocale = null;
            select.destroy();
        },

        isDestroyed(): boolean {
            return select.isDestroyed();
        }
    };

    return composed;
}
