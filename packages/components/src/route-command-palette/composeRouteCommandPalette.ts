import {
    createAppRouteSearchItems,
    type AppRouteDescriptor,
    type AppRouteSearchItemsOptions
} from "../app-routes";
import {
    CommandPalette,
    type CommandPaletteItem,
    type CommandPaletteOnSelect,
    type CommandPaletteOptions,
    type CommandPaletteSelectDetail,
    type CommandPaletteUpdateOptions,
    type ComposedCommandPalette
} from "../command-palette";

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
> extends Omit<CommandPaletteOptions<RouteCommandPaletteItem<TRoute>>, "items" | "onSelect"> {
    routes: readonly TRoute[];
    searchItemsOptions?: AppRouteSearchItemsOptions<TRoute>;
    commandLabelPrefix?: string | null;
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

function getInitialCommandLabelPrefix<TRoute extends AppRouteDescriptor>(
    options: RouteCommandPaletteOptions<TRoute>
): string | null {
    return "commandLabelPrefix" in options
        ? options.commandLabelPrefix ?? null
        : "Open ";
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
        onSelect: _onSelect,
        onRouteSelect: _onRouteSelect,
        ...commandPaletteOptions
    } = options;

    let composed!: ComposedRouteCommandPalette<TRoute>;
    let routes = options.routes;
    let searchItemsOptions = options.searchItemsOptions;
    let commandLabelPrefix = getInitialCommandLabelPrefix(options);
    let onSelect = options.onSelect ?? null;
    let onRouteSelect = options.onRouteSelect ?? null;

    function getItems(): RouteCommandPaletteItem<TRoute>[] {
        const prefix = commandLabelPrefix ?? "";

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
        onSelect?.(detail, palette);

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
            onSelect: _nextOnSelect,
            onRouteSelect: _nextOnRouteSelect,
            ...nextCommandPaletteOptions
        } = nextOptions;

        return {
            ...nextCommandPaletteOptions,
            onSelect: handleSelect
        };
    }

    const palette = CommandPalette<RouteCommandPaletteItem<TRoute>>({
        ...commandPaletteOptions,
        items: getItems(),
        onSelect: handleSelect
    });

    setRouteCommandPaletteAttribute(palette.element);

    composed = Object.assign(palette, {
        getRoutes(): readonly TRoute[] {
            return routes;
        },

        setRoutes(nextRoutes: readonly TRoute[]): void {
            routes = nextRoutes;
            palette.setItems(getItems());
            setRouteCommandPaletteAttribute(palette.element);
        },

        update(nextOptions: RouteCommandPaletteUpdateOptions<TRoute>): void {
            if (nextOptions.routes !== undefined) routes = nextOptions.routes;
            if ("searchItemsOptions" in nextOptions) searchItemsOptions = nextOptions.searchItemsOptions;
            if ("commandLabelPrefix" in nextOptions) {
                commandLabelPrefix = nextOptions.commandLabelPrefix ?? null;
            }
            if ("onSelect" in nextOptions) onSelect = nextOptions.onSelect ?? null;
            if ("onRouteSelect" in nextOptions) onRouteSelect = nextOptions.onRouteSelect ?? null;

            if (
                nextOptions.routes !== undefined
                || "searchItemsOptions" in nextOptions
                || "commandLabelPrefix" in nextOptions
            ) {
                palette.setItems(getItems());
            }

            palette.update(getCommandPaletteUpdateOptions(nextOptions));
            setRouteCommandPaletteAttribute(palette.element);
        }
    }) as ComposedRouteCommandPalette<TRoute>;

    return composed;
}
