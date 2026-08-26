import {
    Brand,
    type BrandOptions,
    type ComposedBrand
} from "../brand";
import {
    HeaderBar,
    type ComposedHeaderBar,
    type HeaderBarCompositionContent,
    type HeaderBarOptions
} from "../header-bar";
import {
    HeaderTools,
    type ComposedHeaderTools,
    type HeaderToolsOptions
} from "../header-tools";
import {
    LanguageSelect,
    type ComposedLanguageSelect,
    type LanguageSelectOptions
} from "../language-select";
import type {
    AccessibleFirstMessageKey,
    LocaleCode,
    LocaleController
} from "../localization";
import {
    ThemeToggle,
    type ComposedThemeToggle,
    type ThemeToggleOptions
} from "../theme";
import type { CompositionChild } from "../composition";

/**
 * Content accepted by AppHeader slots.
 */
export type AppHeaderCompositionContent = HeaderBarCompositionContent;

/**
 * Shared locale controller accepted by AppHeader-managed controls.
 */
export type AppHeaderLocale<
    TLocale extends LocaleCode = LocaleCode,
    TKey extends string = AccessibleFirstMessageKey
> = LocaleController<TLocale, TKey | AccessibleFirstMessageKey>;

/**
 * LanguageSelect options managed by AppHeader. The locale comes from AppHeader.locale.
 */
export type AppHeaderLanguageSelectOptions<
    TLocale extends LocaleCode = LocaleCode,
    TKey extends string = AccessibleFirstMessageKey
> = Omit<LanguageSelectOptions<TLocale, TKey>, "locale">;

/**
 * ThemeToggle options managed by AppHeader. The locale comes from AppHeader.locale.
 */
export type AppHeaderThemeToggleOptions = Omit<ThemeToggleOptions, "locale">;

/**
 * HeaderTools options managed by AppHeader. Controls and locale come from AppHeader.
 */
export type AppHeaderToolsOptions = Omit<HeaderToolsOptions, "controls" | "locale">;

/**
 * Options for AppHeader().
 */
export interface AppHeaderOptions<
    TLocale extends LocaleCode = LocaleCode,
    TKey extends string = AccessibleFirstMessageKey
> extends Omit<HeaderBarOptions, "brand" | "actions"> {
    /** Brand options used to create the standard Brand component. */
    brand?: BrandOptions | false | null;
    /** Already-composed brand content. Takes priority over brand when supplied. */
    brandContent?: AppHeaderCompositionContent | null;
    /** Shared locale controller for language, theme, and header tools service text. */
    locale?: AppHeaderLocale<TLocale, TKey> | null;
    /** App controls placed before the generated language and theme controls. */
    controls?: CompositionChild[];
    /** Language selector options. Use false to omit the generated language selector. */
    language?: AppHeaderLanguageSelectOptions<TLocale, TKey> | false;
    /** Theme toggle options. Use false to omit the generated theme toggle. */
    theme?: AppHeaderThemeToggleOptions | false;
    /** Header overflow behavior. Use false to render controls directly in the actions slot. */
    tools?: AppHeaderToolsOptions | false;
}

/**
 * App header created by the composition API.
 */
export interface ComposedAppHeader<TLocale extends LocaleCode = LocaleCode>
    extends ComposedHeaderBar {
    readonly header: ComposedHeaderBar;
    readonly brandControl: ComposedBrand | null;
    readonly languageControl: ComposedLanguageSelect<TLocale> | null;
    readonly themeControl: ComposedThemeToggle | null;
    readonly toolsControl: ComposedHeaderTools | null;
    readonly controls: readonly CompositionChild[];
}

function getBrandMaxWidth<TLocale extends LocaleCode, TKey extends string>(
    options: AppHeaderOptions<TLocale, TKey>
): string | null {
    if ("brandMaxWidth" in options) return options.brandMaxWidth ?? null;
    if (!options.brand) return null;

    return options.brand.maxWidth ?? null;
}

function createBrandControl(options: BrandOptions, brandMaxWidth: string | null): ComposedBrand {
    const brandOptions: BrandOptions = { ...options };

    if (brandMaxWidth !== null && !("maxWidth" in brandOptions)) {
        brandOptions.maxWidth = brandMaxWidth;
    }

    return Brand(brandOptions);
}

function createLanguageControl<
    TLocale extends LocaleCode,
    TKey extends string
>(
    locale: AppHeaderLocale<TLocale, TKey> | null,
    options: AppHeaderLanguageSelectOptions<TLocale, TKey> | false | undefined
): ComposedLanguageSelect<TLocale> | null {
    if (!locale || options === false) return null;

    return LanguageSelect({
        ...(options ?? {}),
        locale
    });
}

function createThemeControl<
    TLocale extends LocaleCode,
    TKey extends string
>(
    locale: AppHeaderLocale<TLocale, TKey> | null,
    options: AppHeaderThemeToggleOptions | false | undefined
): ComposedThemeToggle | null {
    if (options === false) return null;

    const themeOptions: ThemeToggleOptions = {
        ...(options ?? {})
    };

    if (locale) themeOptions.locale = locale;

    return ThemeToggle(themeOptions);
}

function createToolsControl<
    TLocale extends LocaleCode,
    TKey extends string
>(
    locale: AppHeaderLocale<TLocale, TKey> | null,
    controls: CompositionChild[],
    options: AppHeaderToolsOptions | false | undefined
): ComposedHeaderTools | null {
    if (controls.length === 0 || options === false) return null;

    const toolsOptions: HeaderToolsOptions = {
        ...(options ?? {}),
        controls
    };

    if (locale) toolsOptions.locale = locale;

    return HeaderTools(toolsOptions);
}

function getActionsContent(
    controls: CompositionChild[],
    toolsControl: ComposedHeaderTools | null,
    toolsOptions: AppHeaderToolsOptions | false | undefined
): AppHeaderCompositionContent | null {
    if (controls.length === 0) return null;
    if (toolsOptions === false) return controls;

    return toolsControl;
}

/**
 * Creates a standard application header from brand, route controls, language, theme, and overflow tools.
 */
export function AppHeader<
    TLocale extends LocaleCode = LocaleCode,
    TKey extends string = AccessibleFirstMessageKey
>(options: AppHeaderOptions<TLocale, TKey> = {}): ComposedAppHeader<TLocale> {
    const brandMaxWidth = getBrandMaxWidth(options);
    const locale = options.locale ?? null;
    const brandControl = "brandContent" in options
        ? null
        : options.brand
            ? createBrandControl(options.brand, brandMaxWidth)
            : null;
    const brandContent = "brandContent" in options
        ? options.brandContent ?? null
        : brandControl;
    const languageControl = createLanguageControl(locale, options.language);
    const themeControl = createThemeControl(locale, options.theme);
    const controls: CompositionChild[] = [
        ...(options.controls ?? [])
    ];

    if (languageControl) controls.push(languageControl);
    if (themeControl) controls.push(themeControl);

    const toolsControl = createToolsControl(locale, controls, options.tools);
    const actions = getActionsContent(controls, toolsControl, options.tools);
    const header = HeaderBar({
        ...options,
        brandMaxWidth,
        brand: brandContent,
        actions
    });

    return {
        ...header,
        header,
        brandControl,
        languageControl,
        themeControl,
        toolsControl,
        controls
    };
}