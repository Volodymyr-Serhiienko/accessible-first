import {
    SearchBox,
    type ComposedSearchBox,
    type HashRouter,
    type SearchBoxItem
} from "./af";
import type { PlaygroundRoute } from "./routes";

interface PlaygroundSearchItem extends SearchBoxItem<PlaygroundRoute> {
    data: PlaygroundRoute;
}

export interface PlaygroundSearchOptions {
    router: HashRouter<PlaygroundRoute>;
    routes: PlaygroundRoute[];
}

function normalizeRouteText(value: string): string {
    return value
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/[-_]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function getRouteKeywords(route: PlaygroundRoute): string[] {
    return Array.from(new Set([
        route.id,
        route.label,
        route.title,
        normalizeRouteText(route.id),
        normalizeRouteText(route.label),
        normalizeRouteText(route.title),
        "component",
        "demo"
    ].filter(Boolean)));
}

function toSearchItem(route: PlaygroundRoute): PlaygroundSearchItem {
    return {
        id: route.id,
        label: route.label,
        description: `Open the ${route.title} section.`,
        keywords: getRouteKeywords(route),
        data: route
    };
}

export function PlaygroundSearch(
    options: PlaygroundSearchOptions
): ComposedSearchBox<PlaygroundSearchItem> {
    return SearchBox<PlaygroundSearchItem>({
        className: "playground-search",
        label: "Search demo sections",
        labelOptions: {
            attributes: {
                "data-af-composition": "visually-hidden"
            }
        },
        placeholder: "Search sections",
        openOnFocus: false,
        notFoundText: "No matching sections found.",
        items: options.routes.map(toSearchItem),
        onSelect(detail) {
            options.router.navigate(detail.item.data, {
                updateHistory: true
            });
        }
    });
}
