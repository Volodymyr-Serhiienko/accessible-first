import type { NavigationItem } from "../navigation";
import type { SearchBoxItem } from "../search-box";

/**
 * Minimal route metadata accepted by app route helpers.
 */
export interface AppRouteDescriptor {
    id: string;
    title: string;
    label?: string;
    href?: string | null;
    description?: string | null;
    keywords?: string[];
    disabled?: boolean;
    hint?: string | null;
}

/**
 * SearchBox item generated from an application route.
 */
export interface AppRouteSearchItem<TRoute extends AppRouteDescriptor = AppRouteDescriptor>
    extends SearchBoxItem<TRoute> {
    data: TRoute;
}

/**
 * Resolves display text for a route.
 */
export type AppRouteLabelResolver<TRoute extends AppRouteDescriptor> = (
    route: TRoute
) => string;

/**
 * Resolves link href for a route.
 */
export type AppRouteHrefResolver<TRoute extends AppRouteDescriptor> = (
    route: TRoute
) => string | null;

/**
 * Resolves navigation hint text for a route.
 */
export type AppRouteHintResolver<TRoute extends AppRouteDescriptor> = (
    route: TRoute
) => string | null;

/**
 * Resolves search description text for a route.
 */
export type AppRouteDescriptionResolver<TRoute extends AppRouteDescriptor> = (
    route: TRoute
) => string | null;

/**
 * Resolves extra search keywords for a route.
 */
export type AppRouteKeywordsResolver<TRoute extends AppRouteDescriptor> = (
    route: TRoute
) => string[];

/**
 * Resolves disabled state for a route.
 */
export type AppRouteDisabledResolver<TRoute extends AppRouteDescriptor> = (
    route: TRoute
) => boolean;

/**
 * Options for createAppRouteNavigationItems().
 */
export interface AppRouteNavigationItemsOptions<TRoute extends AppRouteDescriptor> {
    getLabel?: AppRouteLabelResolver<TRoute>;
    getHref?: AppRouteHrefResolver<TRoute>;
    getHint?: AppRouteHintResolver<TRoute>;
    isDisabled?: AppRouteDisabledResolver<TRoute>;
}

/**
 * Options for createAppRouteSearchItems().
 */
export interface AppRouteSearchItemsOptions<TRoute extends AppRouteDescriptor> {
    getLabel?: AppRouteLabelResolver<TRoute>;
    getDescription?: AppRouteDescriptionResolver<TRoute>;
    getKeywords?: AppRouteKeywordsResolver<TRoute>;
    isDisabled?: AppRouteDisabledResolver<TRoute>;
}

/**
 * Normalizes route text for search keywords.
 */
export function normalizeAppRouteText(value: string): string {
    return value
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/[-_]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

/**
 * Returns the default visible label for a route.
 */
export function getAppRouteLabel(route: AppRouteDescriptor): string {
    return route.label ?? route.title;
}

/**
 * Returns the default href for a route.
 * If href is explicitly null, the route is treated as not linkable.
 */
export function getAppRouteHref(route: AppRouteDescriptor): string | null {
    if ("href" in route) {
        return route.href ?? null;
    }

    return `#${encodeURIComponent(route.id)}`;
}

/**
 * Returns default searchable keywords for a route.
 */
export function getAppRouteKeywords(
    route: AppRouteDescriptor,
    extraKeywords: string[] = []
): string[] {
    const label = getAppRouteLabel(route);

    return Array.from(new Set([
        route.id,
        route.title,
        label,
        normalizeAppRouteText(route.id),
        normalizeAppRouteText(route.title),
        normalizeAppRouteText(label),
        ...(route.keywords ?? []),
        ...extraKeywords
    ].filter(Boolean)));
}

/**
 * Returns the default search result description for a route.
 */
export function getAppRouteDescription(route: AppRouteDescriptor): string | null {
    if ("description" in route) {
        return route.description ?? null;
    }

    return `Open ${getAppRouteLabel(route)}.`;
}

/**
 * Creates Navigation items from one route list.
 */
export function createAppRouteNavigationItems<TRoute extends AppRouteDescriptor>(
    routes: readonly TRoute[],
    options: AppRouteNavigationItemsOptions<TRoute> = {}
): NavigationItem[] {
    return routes.map((route) => {
        const item: NavigationItem = {
            id: route.id,
            label: options.getLabel?.(route) ?? getAppRouteLabel(route)
        };

        const href = options.getHref?.(route) ?? getAppRouteHref(route);
        const hint = options.getHint?.(route) ?? route.hint ?? null;
        const disabled = options.isDisabled?.(route) ?? route.disabled;

        if (href !== null) item.href = href;
        if (hint !== null) item.hint = hint;
        if (disabled !== undefined) item.disabled = disabled;

        return item;
    });
}

/**
 * Creates SearchBox items from one route list.
 */
export function createAppRouteSearchItems<TRoute extends AppRouteDescriptor>(
    routes: readonly TRoute[],
    options: AppRouteSearchItemsOptions<TRoute> = {}
): AppRouteSearchItem<TRoute>[] {
    return routes.map((route) => {
        const label = options.getLabel?.(route) ?? getAppRouteLabel(route);
        const description = options.getDescription?.(route) ?? getAppRouteDescription(route);
        const extraKeywords = options.getKeywords?.(route) ?? [];
        const disabled = options.isDisabled?.(route) ?? route.disabled;

        const item: AppRouteSearchItem<TRoute> = {
            id: route.id,
            label,
            keywords: getAppRouteKeywords(route, extraKeywords),
            data: route
        };

        if (description !== null) item.description = description;
        if (disabled !== undefined) item.disabled = disabled;

        return item;
    });
}
