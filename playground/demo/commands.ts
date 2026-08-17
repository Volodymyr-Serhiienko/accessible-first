import {
    CommandPalette,
    type CommandPaletteItem,
    type ComposedCommandPalette,
    type HashRouter
} from "./af";
import type { PlaygroundRoute } from "./routes";

type PlaygroundCommand = CommandPaletteItem<PlaygroundRoute>;

export interface PlaygroundCommandsOptions {
    router: HashRouter<PlaygroundRoute>;
    routes: PlaygroundRoute[];
}

export function PlaygroundCommands(
    options: PlaygroundCommandsOptions
): ComposedCommandPalette<PlaygroundCommand> {
    return CommandPalette<PlaygroundCommand>({
        trigger: "Commands",
        title: "Playground commands",
        description: "Search demo sections and press Enter to open the selected section.",
        searchLabel: "Search playground commands",
        placeholder: "Search commands",
        notFoundText: "No commands found.",
        shortcut: [
            { key: "k", ctrlKey: true, allowInEditable: true },
            { key: "k", metaKey: true, allowInEditable: true }
        ],
        items: options.routes.map((route) => ({
            id: `open-${route.id}`,
            label: `Open ${route.label}`,
            description: `Open the ${route.title} demo section.`,
            keywords: ["open", "go", "section", "demo", route.id, route.title, route.label],
            data: route,
            run() {
                options.router.navigate(route, {
                    updateHistory: true,
                    scroll: true,
                    focusTarget: "outlet"
                });
            }
        }))
    });
}
