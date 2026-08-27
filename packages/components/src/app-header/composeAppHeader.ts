import type { AppIdentity } from "../app-identity";
import {
    Brand,
    type BrandCompositionContent,
    type BrandOptions,
    type ComposedBrand
} from "../brand";
import {
    Image,
    type CompositionChild
} from "../composition";
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
 * Brand options managed by AppHeader.
 * When identity is supplied, name and logo can be omitted and derived from it.
 */
export interface AppHeaderBrandOptions extends Partial<Omit<BrandOptions, "name">> {
    /** Visible brand name. Defaults to identity.name when AppHeader.identity is supplied. */
    name?: BrandOptions["name"];
}

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
    /** Stable app identity used for default brand name and logo. */
    identity?: AppIdentity | null;
    /** Brand options used to create the standard Brand component. Use false or null to omit it. */
    brand?: AppHeaderBrandOptions | false | null;
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

function createIdentityLogo(identity: AppIdentity): BrandCompositionContent | null {
    if (!identity.icons.svg) return null;

    return Image({
        src: identity.icons.svg.toString(),
        alt: "",
        decorative: true
    });
}

function getBrandName(
    options: AppHeaderBrandOptions,
    identity: AppIdentity | null
): BrandOptions["name"] | null {
    return options.name ?? identity?.name ?? null;
}

function createBrandControl(
    options: AppHeaderBrandOptions | false | null | undefined,
    identity: AppIdentity | null,
    brandMaxWidth: string | null
): ComposedBrand | null {
    if (options === false || options === null) return null;

    const brandOptions: AppHeaderBrandOptions = { ...(options ?? {}) };
    const name = getBrandName(brandOptions, identity);

    if (name === null) return null;

    const resolvedOptions: BrandOptions = {
        ...brandOptions,
        name
    };

    if (brandMaxWidth !== null && !("maxWidth" in brandOptions)) {
        resolvedOptions.maxWidth = brandMaxWidth;
    }

    if (!("logo" in brandOptions) && identity) {
        const logo = createIdentityLogo(identity);

        if (logo !== null) resolvedOptions.logo = logo;
    }

    return Brand(resolvedOptions);
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
    const {
        brand: _brandOptions,
        brandContent: _brandContentOptions,
        controls: _controlsOptions,
        identity: _identityOptions,
        language: _languageOptions,
        locale: _localeOptions,
        theme: _themeOptions,
        tools: _toolsOptions,
        ...headerBarOptions
    } = options;
    const brandMaxWidth = getBrandMaxWidth(options);
    const identity = options.identity ?? null;
    const locale = options.locale ?? null;
    const brandControl = "brandContent" in options
        ? null
        : createBrandControl(options.brand, identity, brandMaxWidth);
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
        ...headerBarOptions,
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
