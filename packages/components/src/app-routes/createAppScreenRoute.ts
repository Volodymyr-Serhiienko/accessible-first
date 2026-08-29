import type { CompositionContent } from "../composition";
import type { HashRouterRoute } from "../routing";
import {
    Screen,
    type ScreenOptions
} from "../screen";
import type { AppRouteDescriptor } from "./createAppRouteItems";

/**
 * Route slot content or a lazy resolver that receives the created route.
 */
export type AppScreenRouteSlot<
    TRoute extends AppRouteDescriptor = AppRouteDescriptor
> = CompositionContent | ((route: TRoute) => CompositionContent);

/**
 * Screen options owned by an app screen route.
 *
 * The route supplies the default title and description, while top-level route
 * slots supply Screen children, actions, and footer.
 */
export interface AppScreenRouteScreenOptions<
    TRoute extends AppRouteDescriptor = AppRouteDescriptor
> extends Omit<ScreenOptions, "title" | "description" | "children" | "actions" | "footer"> {
    /** Optional Screen title override. Defaults to route.title. */
    title?: AppScreenRouteSlot<TRoute>;
    /** Optional Screen description override. Defaults to route.description. */
    description?: AppScreenRouteSlot<TRoute> | null;
}

/**
 * Hash-routable app route produced by createAppScreenRoute().
 */
export type AppScreenRoute<
    TExtension extends object = object
> = AppRouteDescriptor & HashRouterRoute & TExtension;

/**
 * Declarative route options for creating a runnable Screen-backed route.
 */
export type AppScreenRouteOptions<
    TExtension extends object = object
> = AppRouteDescriptor & TExtension & {
    /** Accessible First components or native nodes rendered into the Screen body. */
    children?: AppScreenRouteSlot<AppScreenRoute<TExtension>> | null;
    /** Optional Screen action controls, passed to the internal ActionsBar. */
    actions?: AppScreenRouteSlot<AppScreenRoute<TExtension>> | null;
    /** Optional Screen footer content. */
    footer?: AppScreenRouteSlot<AppScreenRoute<TExtension>> | null;
    /** Screen configuration, or false to render children without wrapping them in Screen. */
    screen?: AppScreenRouteScreenOptions<AppScreenRoute<TExtension>> | false;
};

type AppScreenRouteRenderOptions<
    TExtension extends object
> = {
    actions: AppScreenRouteSlot<AppScreenRoute<TExtension>> | null | undefined;
    children: AppScreenRouteSlot<AppScreenRoute<TExtension>> | null | undefined;
    footer: AppScreenRouteSlot<AppScreenRoute<TExtension>> | null | undefined;
    screen: AppScreenRouteScreenOptions<AppScreenRoute<TExtension>> | false | undefined;
};

function resolveAppScreenRouteSlot<TRoute extends AppRouteDescriptor>(
    slot: AppScreenRouteSlot<TRoute> | null | undefined,
    route: TRoute
): CompositionContent | null {
    if (slot === null || slot === undefined) return null;

    return typeof slot === "function"
        ? (slot as (route: TRoute) => CompositionContent)(route)
        : slot;
}

function getRouteScreenTitle<TExtension extends object>(
    route: AppScreenRoute<TExtension>,
    screenOptions: AppScreenRouteScreenOptions<AppScreenRoute<TExtension>> | null
): CompositionContent {
    const title = screenOptions && "title" in screenOptions
        ? resolveAppScreenRouteSlot(screenOptions.title, route)
        : route.title;

    return title === null || title === undefined || title === false ? route.title : title;
}

function getRouteScreenDescription<TExtension extends object>(
    route: AppScreenRoute<TExtension>,
    screenOptions: AppScreenRouteScreenOptions<AppScreenRoute<TExtension>> | null
): CompositionContent | null {
    if (screenOptions && "description" in screenOptions) {
        return resolveAppScreenRouteSlot(screenOptions.description, route);
    }

    return route.description ?? null;
}

function renderAppScreenRoute<TExtension extends object>(
    route: AppScreenRoute<TExtension>,
    options: AppScreenRouteRenderOptions<TExtension>
): CompositionContent {
    const children = resolveAppScreenRouteSlot(options.children, route);

    if (options.screen === false) return children;

    const {
        title: _title,
        description: _description,
        ...screenOptions
    } = options.screen ?? {};
    const screen: ScreenOptions = {
        ...screenOptions,
        headingLevel: screenOptions.headingLevel ?? 1,
        title: getRouteScreenTitle(route, options.screen ?? null)
    };
    const description = getRouteScreenDescription(route, options.screen ?? null);
    const actions = resolveAppScreenRouteSlot(options.actions, route);
    const footer = resolveAppScreenRouteSlot(options.footer, route);

    if (description !== null) screen.description = description;
    if (children !== null) screen.children = children;
    if (actions !== null) screen.actions = actions;
    if (footer !== null) screen.footer = footer;

    return Screen(screen);
}

/**
 * Creates a Screen-backed hash route from declarative route and slot options.
 */
export function createAppScreenRoute<
    TExtension extends object = object
>(options: AppScreenRouteOptions<TExtension>): AppScreenRoute<TExtension> {
    const {
        actions,
        children,
        footer,
        screen,
        ...routeOptions
    } = options;
    let route!: AppScreenRoute<TExtension>;

    route = {
        ...routeOptions,
        render() {
            return renderAppScreenRoute(route, {
                actions,
                children,
                footer,
                screen
            });
        }
    } as AppScreenRoute<TExtension>;

    return route;
}

/**
 * Creates a list of Screen-backed hash routes from declarative route options.
 */
export function createAppScreenRoutes<
    TExtension extends object = object
>(routes: readonly AppScreenRouteOptions<TExtension>[]): Array<AppScreenRoute<TExtension>> {
    return routes.map((route) => createAppScreenRoute(route));
}
