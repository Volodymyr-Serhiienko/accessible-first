import {
    createHashRouterRoutePattern,
    type HashRouterRoutePattern,
    type HashRouterRoutePatternRawParams
} from "../routing";
import {
    createAppScreenRoute,
    type AppScreenRoute,
    type AppScreenRouteOptions
} from "./createAppScreenRoute";

/** Options for creating one parameterized Screen-backed app route definition. */
export interface AppScreenRoutePatternOptions<
    TParams extends object,
    TExtension extends object = object
> {
    /** Stable pattern definition identifier. */
    id: string;
    /** Slash-separated route pattern with literal and :parameter segments. */
    pattern: string;
    /** Validates and converts decoded parameter strings. */
    parse(params: HashRouterRoutePatternRawParams): TParams | null;
    /**
     * Resolves concrete Screen route options from validated params.
     * The framework assigns the canonical concrete route id.
     */
    create(
        params: TParams,
        routeId: string
    ): Omit<AppScreenRouteOptions<TExtension>, "id"> | null;
}

/**
 * Creates a parameterized route definition that resolves to normal
 * Screen-backed app routes.
 */
export function createAppScreenRoutePattern<
    TParams extends object,
    TExtension extends object = object
>(
    options: AppScreenRoutePatternOptions<TParams, TExtension>
): HashRouterRoutePattern<AppScreenRoute<TExtension>, TParams> {
    return createHashRouterRoutePattern<AppScreenRoute<TExtension>, TParams>({
        id: options.id,
        pattern: options.pattern,
        parse: options.parse,
        create(params, routeId) {
            const routeOptions = options.create(params, routeId);

            return routeOptions === null
                ? null
                : createAppScreenRoute<TExtension>({
                    ...routeOptions,
                    id: routeId
                } as AppScreenRouteOptions<TExtension>);
        }
    });
}
