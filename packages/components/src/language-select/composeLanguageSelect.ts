import {
    type AccessibleFirstMessageKey,
    accessibleFirstEnglishMessages,
    getLocaleText,
    type LocaleCode,
    type LocaleController,
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
    ComposedNode
} from "../composition";
import {
    getLanguagePickerItems,
    getLanguagePickerSetOptions,
    getLanguagePickerWidth,
    getLocaleDisplayName,
    type LanguagePickerItem,
    type LanguagePickerItemLabelResolver,
    type LanguagePickerNameFormat
} from "./languageOptions";
import { createLocaleSubscription } from "../localization/createLocaleSubscription";
import { runCleanups } from "../../../core/src/events";

/**
 * Localized message keys used by LanguageSelect fallback text.
 */
export type LanguageSelectMessageKey = "languageSelect.label";

/**
 * One locale option accepted by LanguageSelect().
 */
export type LanguageSelectItem<TLocale extends LocaleCode = LocaleCode> = LanguagePickerItem<TLocale>;

/**
 * Display format used for automatic language option names.
 */
export type LanguageSelectNameFormat = LanguagePickerNameFormat;

/**
 * Optionally overrides one automatic locale label for the current UI locale.
 * Return null or undefined to retain the standard name-format behavior.
 */
export type LanguageSelectItemLabelResolver<TLocale extends LocaleCode = LocaleCode> = LanguagePickerItemLabelResolver<TLocale>;

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
    /**
     * Display format for automatic items. Ignored when explicit `items` are supplied.
     * Defaults to the localized UI-language name.
     */
    nameFormat?: LanguageSelectNameFormat;
    /**
     * Optional resolver for exceptional automatic item labels. Ignored when
     * explicit `items` are supplied.
     */
    getItemLabel?: LanguageSelectItemLabelResolver<TLocale> | null;
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
> extends Partial<Omit<LanguageSelectOptions<TLocale, TKey>, "locale" | "items" | "placeholder">> {}

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

function getSelectLabel<TLocale extends LocaleCode>(
    options: LanguageSelectOptions<TLocale> | LanguageSelectUpdateOptions<TLocale>,
    locale: LanguageSelectOptions<TLocale>["locale"]
): string | null {
    if (options.label !== undefined) return options.label;

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
    nextOptions: LanguageSelectUpdateOptions<TLocale>
): SelectCompositionUpdateOptions {
    const updateOptions: SelectCompositionUpdateOptions = {};

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
    let destroyed = false;
    let revision = 0;
    let changeRevision = 0;
    let renderedLocale = options.locale.getLocale();
    let renderedItems = getLanguagePickerItems(options, renderedLocale, options.locale.supportedLocales);
    const initialLabel = getSelectLabel(options, options.locale);

    function setLocale(locale: string, setOptions: LocaleSetOptions = {}): TLocale {
        if (destroyed) return currentOptions.locale.getLocale();
        const current = ++changeRevision;
        const nextLocale = currentOptions.locale.setLocale(locale, getLanguagePickerSetOptions(currentOptions, setOptions));
        if (!destroyed && current === changeRevision) select.setValue(nextLocale);
        return nextLocale;
    }

    const handleValueChange = (detail: SelectCompositionChangeDetail): void => {
        if (destroyed) return;
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
                target: select.select,
                selectDetail: detail
            },
            composed
        );
    };

    const select = Select(getSelectOptions(
        currentOptions,
        toSelectItems(renderedItems, renderedLocale),
        handleValueChange
    ));

    select.element.setAttribute("data-af-language-select", "");
    syncSizing(renderedItems, initialLabel);
    const localeSubscription = createLocaleSubscription(() => syncFromLocale({}, true));

    function syncSizing(items: readonly LanguageSelectItem<TLocale>[], label: string | null): void {
        const width = getLanguagePickerWidth(currentOptions.width ?? null, currentOptions.autoWidth ?? true, items, label);
        if (width === null) select.element.style.removeProperty("--af-language-select-width");
        else select.element.style.setProperty("--af-language-select-width", width);
    }

    function syncFromLocale(nextOptions: LanguageSelectUpdateOptions<TLocale>, refreshItems = false): void {
        if (destroyed) return;
        const current = ++revision;
        const locale = currentOptions.locale.getLocale();
        const replaceLabels = refreshItems || locale !== renderedLocale || "nameFormat" in nextOptions || "getItemLabel" in nextOptions;
        const items = replaceLabels ? getLanguagePickerItems(currentOptions, locale, currentOptions.locale.supportedLocales) : renderedItems;
        const label = getSelectLabel(currentOptions, currentOptions.locale);
        if (destroyed || current !== revision) return;
        const updateOptions = { ...getSelectUpdateOptions(nextOptions), label };
        if (replaceLabels) updateOptions.items = toSelectItems(items, locale);
        if (refreshItems || locale !== renderedLocale) updateOptions.value = locale;
        renderedItems = items;
        renderedLocale = locale;
        select.update(updateOptions);
        if (!destroyed && current === revision) {
            select.element.setAttribute("data-af-language-select", "");
            syncSizing(items, label);
        }
    }

    composed = {
        element: select.element,
        select,
        control: select.select,
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
            runCleanups([localeSubscription.destroy, select.destroy]);
        },

        isDestroyed(): boolean {
            return destroyed || select.isDestroyed();
        }
    };

    try { localeSubscription.replace(options.locale); }
    catch (error) {
        try { composed.destroy(); } catch { /* Preserve the construction failure. */ }
        throw error;
    }

    return composed;
}
