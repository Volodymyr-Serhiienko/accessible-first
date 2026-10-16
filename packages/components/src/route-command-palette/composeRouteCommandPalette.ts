import {
    createAppRouteSearchItems,
    type AppRouteDescriptor,
    type AppRouteSearchItemsOptions
} from "../app-routes";
import {
    CommandPalette,
    type CommandPaletteItem,
    type CommandPaletteOnSelect,
    type CommandPaletteLocalization,
    type CommandPaletteMessageKey,
    type CommandPaletteOptions,
    type CommandPaletteSelectDetail,
    type CommandPaletteUpdateOptions,
    type ComposedCommandPalette
} from "../command-palette";
import {
    accessibleFirstEnglishMessages,
    getLocaleText,
    type LocaleTextProvider
} from "../localization";
import { createLocaleSubscription } from "../localization/createLocaleSubscription";
import { runCleanups } from "../../../core/src/events";

/**
 * Localized message keys used by RouteCommandPalette fallback text.
 */
export type RouteCommandPaletteMessageKey =
    | CommandPaletteMessageKey
    | "routeCommandPalette.commandLabelPrefix";

/**
 * Localization provider accepted by RouteCommandPalette.
 */
export type RouteCommandPaletteLocalization = LocaleTextProvider<RouteCommandPaletteMessageKey>;

/**
 * CommandPalette item generated for one route.
 */
export interface RouteCommandPaletteItem<
    TRoute extends AppRouteDescriptor = AppRouteDescriptor
> extends CommandPaletteItem<TRoute> {
    data: TRoute;
}

/**
 * Details passed when RouteCommandPalette selects a route command.
 */
export interface RouteCommandPaletteSelectDetail<
    TRoute extends AppRouteDescriptor = AppRouteDescriptor
> extends CommandPaletteSelectDetail<RouteCommandPaletteItem<TRoute>> {
    route: TRoute;
}

/**
 * Called when a route command is selected.
 */
export type RouteCommandPaletteOnRouteSelect<
    TRoute extends AppRouteDescriptor = AppRouteDescriptor
> = (
    detail: RouteCommandPaletteSelectDetail<TRoute>,
    palette: ComposedRouteCommandPalette<TRoute>
) => void;

/**
 * Options for RouteCommandPalette().
 */
export interface RouteCommandPaletteOptions<
    TRoute extends AppRouteDescriptor = AppRouteDescriptor
> extends Omit<CommandPaletteOptions<RouteCommandPaletteItem<TRoute>>, "items" | "locale" | "onSelect"> {
    routes: readonly TRoute[];
    searchItemsOptions?: AppRouteSearchItemsOptions<TRoute>;
    commandLabelPrefix?: string | null;
    locale?: RouteCommandPaletteLocalization | null;
    onSelect?: CommandPaletteOnSelect<RouteCommandPaletteItem<TRoute>> | null;
    onRouteSelect?: RouteCommandPaletteOnRouteSelect<TRoute> | null;
}

/**
 * Options accepted by ComposedRouteCommandPalette.update().
 */
export interface RouteCommandPaletteUpdateOptions<
    TRoute extends AppRouteDescriptor = AppRouteDescriptor
> extends Partial<
        Omit<
            RouteCommandPaletteOptions<TRoute>,
            "routes" | "searchItemsOptions" | "commandLabelPrefix"
        >
    > {
    routes?: readonly TRoute[];
    searchItemsOptions?: AppRouteSearchItemsOptions<TRoute>;
    commandLabelPrefix?: string | null;
}

/**
 * Route command palette derived from application route metadata.
 */
export interface ComposedRouteCommandPalette<
    TRoute extends AppRouteDescriptor = AppRouteDescriptor
> extends Omit<ComposedCommandPalette<RouteCommandPaletteItem<TRoute>>, "setItems" | "update"> {
    getRoutes(): readonly TRoute[];
    setRoutes(routes: readonly TRoute[]): void;
    update(options: RouteCommandPaletteUpdateOptions<TRoute>): void;
}

function getCommandLabelPrefix(
    prefix: string | null | undefined,
    locale: RouteCommandPaletteLocalization | null
): string | null {
    if (prefix === null) return null;

    return prefix ?? getLocaleText(
        locale,
        "routeCommandPalette.commandLabelPrefix",
        accessibleFirstEnglishMessages["routeCommandPalette.commandLabelPrefix"]
    );
}

function getCommandPaletteLocale(
    locale: RouteCommandPaletteLocalization | null
): CommandPaletteLocalization | null {
    return locale;
}

function setRouteCommandPaletteAttribute(element: HTMLElement): void {
    element.setAttribute("data-af-route-command-palette", "");
}
/**
 * Creates a command palette from route metadata.
 */
export function RouteCommandPalette<
    TRoute extends AppRouteDescriptor = AppRouteDescriptor
>(
    options: RouteCommandPaletteOptions<TRoute>
): ComposedRouteCommandPalette<TRoute> {
    const {
        routes: _routes,
        searchItemsOptions: _searchItemsOptions,
        commandLabelPrefix: _commandLabelPrefix,
        locale: _locale,
        onSelect: _onSelect,
        onRouteSelect: _onRouteSelect,
        ...commandPaletteOptions
    } = options;

    let composed!: ComposedRouteCommandPalette<TRoute>;
    let routes = options.routes;
    let searchItemsOptions = options.searchItemsOptions;
    let commandLabelPrefix = options.commandLabelPrefix;
    let locale: RouteCommandPaletteLocalization | null = options.locale ?? null;
    let destroyed = false;
    let revision = 0;
    let onSelect = options.onSelect ?? null;
    let onRouteSelect = options.onRouteSelect ?? null;

    function getItems(): RouteCommandPaletteItem<TRoute>[] {
        const prefix = getCommandLabelPrefix(commandLabelPrefix, locale) ?? "";

        return createAppRouteSearchItems(routes, searchItemsOptions).map((item) => ({
            ...item,
            label: `${prefix}${item.label}`,
            data: item.data
        }));
    }

    const handleSelect: CommandPaletteOnSelect<RouteCommandPaletteItem<TRoute>> = (
        detail,
        palette
    ): void => {
        if (destroyed) return;
        const current = revision;
        onSelect?.(detail, palette);
        if (destroyed || current !== revision) return;
        onRouteSelect?.(
            {
                ...detail,
                route: detail.command.data
            },
            composed
        );
    };

    function getCommandPaletteUpdateOptions(
        nextOptions: RouteCommandPaletteUpdateOptions<TRoute>
    ): CommandPaletteUpdateOptions<RouteCommandPaletteItem<TRoute>> {
        const {
            routes: _nextRoutes,
            searchItemsOptions: _nextSearchItemsOptions,
            commandLabelPrefix: _nextCommandLabelPrefix,
            locale: _nextLocale,
            onSelect: _nextOnSelect,
            onRouteSelect: _nextOnRouteSelect,
            ...nextCommandPaletteOptions
        } = nextOptions;

        return {
            ...nextCommandPaletteOptions,
            ...("locale" in nextOptions ? { locale: getCommandPaletteLocale(locale) } : {}),
            onSelect: handleSelect
        };
    }

    const palette = CommandPalette<RouteCommandPaletteItem<TRoute>>({
        ...commandPaletteOptions,
        locale: getCommandPaletteLocale(locale),
        items: getItems(),
        onSelect: handleSelect
    });
    const setPaletteItems = palette.setItems.bind(palette);
    const updatePalette = palette.update.bind(palette);
    const destroyPalette = palette.destroy.bind(palette);

    const localeSubscription = createLocaleSubscription(() => update({}, true));

    function update(nextOptions: RouteCommandPaletteUpdateOptions<TRoute>, refreshItems = false): void {
        if (destroyed) return;
        const current = ++revision;
        if (nextOptions.routes !== undefined) routes = nextOptions.routes;
        if ("searchItemsOptions" in nextOptions) searchItemsOptions = nextOptions.searchItemsOptions;
        if ("commandLabelPrefix" in nextOptions) {
            commandLabelPrefix = nextOptions.commandLabelPrefix;
        }
        if ("locale" in nextOptions) {
            locale = nextOptions.locale ?? null;
        }
        if ("onSelect" in nextOptions) onSelect = nextOptions.onSelect ?? null;
        if ("onRouteSelect" in nextOptions) onRouteSelect = nextOptions.onRouteSelect ?? null;

        const items = (
            refreshItems || nextOptions.routes !== undefined
            || "searchItemsOptions" in nextOptions
            || "commandLabelPrefix" in nextOptions
            || "locale" in nextOptions
        ) ? getItems() : null;
        if (destroyed || current !== revision) return;
        runCleanups([
            () => { if ("locale" in nextOptions) localeSubscription.replace(locale); },
            () => { if (!destroyed && current === revision && items) setPaletteItems(items); },
            () => { if (!destroyed && current === revision) updatePalette(getCommandPaletteUpdateOptions(nextOptions)); }
        ]);
    }

    function destroy(): void {
        if (destroyed) return;
        destroyed = true;
        revision += 1;
        runCleanups([localeSubscription.destroy, destroyPalette]);
    }

    composed = Object.assign(palette, {
        getRoutes: () => routes,
        setRoutes: (nextRoutes: readonly TRoute[]) => update({ routes: nextRoutes }),
        update,
        destroy
    }) as ComposedRouteCommandPalette<TRoute>;

    setRouteCommandPaletteAttribute(palette.element);
    try { localeSubscription.replace(locale); }
    catch (error) {
        try { destroy(); } catch { /* Preserve the construction failure. */ }
        throw error;
    }

    return composed;
}
