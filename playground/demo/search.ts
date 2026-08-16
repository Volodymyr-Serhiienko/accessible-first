import {
    createAppRouteSearchItems,
    SearchBox,
    type AppRouteSearchItem,
    type ComposedSearchBox,
    type HashRouter
} from "./af";
import type { PlaygroundRoute } from "./routes";

export type PlaygroundSearchItem = AppRouteSearchItem<PlaygroundRoute>;

export interface PlaygroundSearchOptions {
    router: HashRouter<PlaygroundRoute>;
    routes: PlaygroundRoute[];
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
        items: createAppRouteSearchItems(options.routes, {
            getDescription(route) {
                return `Open the ${route.title} section.`;
            },
            getKeywords() {
                return ["component", "demo"];
            }
        }),
        onSelect(detail) {
            options.router.navigate(detail.item.data, {
                updateHistory: true,
                scroll: true,
                focusTarget: "outlet"
            });
        }
    });
}
