import {
    createAppRouteBreadcrumbItems,
    createAppRouteTrail,
    type AppRouteBreadcrumbItemsOptions,
    type AppRouteDescriptor,
    type AppRouteTrailOptions
} from "../app-routes";
import {
    Breadcrumbs,
    type BreadcrumbsItem,
    type BreadcrumbsOptions,
    type BreadcrumbsUpdateOptions,
    type ComposedBreadcrumbs
} from "../breadcrumbs";

/**
 * Current route accepted by RouteBreadcrumbs().
 */
export type RouteBreadcrumbsCurrent<
    TRoute extends AppRouteDescriptor = AppRouteDescriptor
> = TRoute | string | null | undefined;

/** Resolves the route trail displayed for the current route. */
export type RouteBreadcrumbsTrailResolver<
    TRoute extends AppRouteDescriptor = AppRouteDescriptor
> = (current: RouteBreadcrumbsCurrent<TRoute>) => readonly TRoute[];

/**
 * Options for RouteBreadcrumbs().
 */
export interface RouteBreadcrumbsOptions<
    TRoute extends AppRouteDescriptor = AppRouteDescriptor
> extends Omit<BreadcrumbsOptions, "items"> {
    routes: readonly TRoute[];
    current: RouteBreadcrumbsCurrent<TRoute>;
    /** Optional resolved trail for dynamic route instances. */
    getTrail?: RouteBreadcrumbsTrailResolver<TRoute>;
    trailOptions?: AppRouteTrailOptions<TRoute>;
    breadcrumbItemsOptions?: AppRouteBreadcrumbItemsOptions<TRoute>;
}

/**
 * Options accepted by ComposedRouteBreadcrumbs.update().
 */
export interface RouteBreadcrumbsUpdateOptions<
    TRoute extends AppRouteDescriptor = AppRouteDescriptor
> extends Partial<RouteBreadcrumbsOptions<TRoute>> {}

/**
 * Breadcrumb component derived from application route metadata.
 */
export interface ComposedRouteBreadcrumbs<
    TRoute extends AppRouteDescriptor = AppRouteDescriptor
> extends Omit<ComposedBreadcrumbs, "update"> {
    getCurrent(): RouteBreadcrumbsCurrent<TRoute>;
    setRoutes(routes: readonly TRoute[]): void;
    setCurrent(current: RouteBreadcrumbsCurrent<TRoute>): void;
    update(options: RouteBreadcrumbsUpdateOptions<TRoute>): void;
}

function setRouteBreadcrumbsAttribute(breadcrumbs: ComposedBreadcrumbs): void {
    breadcrumbs.element.setAttribute("data-af-route-breadcrumbs", "");
}

/**
 * Creates breadcrumb navigation from route metadata and the current route.
 */
export function RouteBreadcrumbs<
    TRoute extends AppRouteDescriptor = AppRouteDescriptor
>(options: RouteBreadcrumbsOptions<TRoute>): ComposedRouteBreadcrumbs<TRoute> {
    const {
        routes: _routes,
        current: _current,
        getTrail: _getTrail,
        trailOptions: _trailOptions,
        breadcrumbItemsOptions: _breadcrumbItemsOptions,
        ...breadcrumbsOptions
    } = options;

    let routes = options.routes;
    let current = options.current;
    let getTrail = options.getTrail;
    let trailOptions = options.trailOptions;
    let breadcrumbItemsOptions = options.breadcrumbItemsOptions;

    function getItems(): BreadcrumbsItem[] {
        return createAppRouteBreadcrumbItems(
            getTrail
                ? [...getTrail(current)]
                : createAppRouteTrail(routes, current, trailOptions),
            breadcrumbItemsOptions
        );
    }

    const breadcrumbs = Breadcrumbs({
        ...breadcrumbsOptions,
        items: getItems()
    });

    const updateBreadcrumbs = breadcrumbs.update.bind(breadcrumbs);

    setRouteBreadcrumbsAttribute(breadcrumbs);

    return Object.assign(breadcrumbs, {
        getCurrent(): RouteBreadcrumbsCurrent<TRoute> {
            return current;
        },

        setRoutes(nextRoutes: readonly TRoute[]): void {
            routes = nextRoutes;
            updateBreadcrumbs({ items: getItems() });
            setRouteBreadcrumbsAttribute(breadcrumbs);
        },

        setCurrent(nextCurrent: RouteBreadcrumbsCurrent<TRoute>): void {
            current = nextCurrent;
            updateBreadcrumbs({ items: getItems() });
            setRouteBreadcrumbsAttribute(breadcrumbs);
        },

        update(nextOptions: RouteBreadcrumbsUpdateOptions<TRoute>): void {
            const {
                routes: nextRoutes,
                current: nextCurrent,
                getTrail: nextGetTrail,
                trailOptions: nextTrailOptions,
                breadcrumbItemsOptions: nextBreadcrumbItemsOptions,
                ...breadcrumbsUpdateOptions
            } = nextOptions;

            if (nextRoutes !== undefined) routes = nextRoutes;
            if ("current" in nextOptions) current = nextCurrent;
            if ("getTrail" in nextOptions) getTrail = nextGetTrail;
            if ("trailOptions" in nextOptions) trailOptions = nextTrailOptions;
            if ("breadcrumbItemsOptions" in nextOptions) {
                breadcrumbItemsOptions = nextBreadcrumbItemsOptions;
            }

            updateBreadcrumbs({
                ...breadcrumbsUpdateOptions,
                items: getItems()
            } as BreadcrumbsUpdateOptions);

            setRouteBreadcrumbsAttribute(breadcrumbs);
        }
    }) as ComposedRouteBreadcrumbs<TRoute>;
}
