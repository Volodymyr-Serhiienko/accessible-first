import { Badge, Button, Grid, InfoCard, P, Progress, Screen, Stack,
    type ComposedNode
} from "../af";
import { announce } from "../status";

export function ScreenDemo(): ComposedNode {
    return Screen({
        id: "screen",
        title: "Screen",
        description: "Screen is a top-level application view for AppShell and PageOutlet content. It keeps the title, description, actions, body, and footer in one predictable structure.",
        actionsLabel: "Screen actions",
        actions: [
            Button({
                text: "Create lesson",
                variant: "primary",
                onPress() {
                    announce("Create lesson pressed.");
                }
            }),
            Button({
                text: "Export",
                variant: "secondary",
                onPress() {
                    announce("Export pressed.");
                }
            })
        ],
        children: Stack(
            P("Use Screen for complete application views such as dashboards, settings pages, lesson lists, vocabulary screens, and profile pages."),
            Grid(
                { minColumnWidth: "16rem" },
                InfoCard({
                    title: "Vocabulary",
                    description: "Track words that are ready for review.",
                    meta: Badge({ text: "24 due", variant: "warning" }),
                    actions: Button({
                        text: "Review",
                        variant: "secondary",
                        onPress() {
                            announce("Vocabulary review pressed.");
                        }
                    })
                }),
                InfoCard({
                    title: "Daily progress",
                    description: "Show a compact summary of current learning activity.",
                    meta: Badge({ text: "Today", variant: "info" }),
                    children: Progress({
                        label: "Daily goal",
                        value: 70,
                        valueText: "70 percent complete"
                    })
                }),
                InfoCard({
                    title: "Next lesson",
                    description: "Promote the next useful action without creating a separate page pattern.",
                    meta: Badge({ text: "Recommended", variant: "success" }),
                    actions: Button({
                        text: "Start",
                        variant: "primary",
                        onPress() {
                            announce("Start next lesson pressed.");
                        }
                    })
                })
            )
        ),
        footer: P("Screen footer content can contain secondary notes, timestamps, or low-priority helper text.")
    });
}
