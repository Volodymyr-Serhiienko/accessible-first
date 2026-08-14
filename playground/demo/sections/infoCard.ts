import {
    Button,
    Grid,
    Icon,
    InfoCard,
    P,
    Section,
    type ComposedNode
} from "../af";
import { announce } from "../status";

const outlineIconAttributes = {
    fill: "none",
    stroke: "currentColor",
    "stroke-width": 2,
    "stroke-linecap": "round",
    "stroke-linejoin": "round"
};

function DemoIcon(path: string): ComposedNode {
    return Icon({
        path,
        decorative: true,
        size: "3rem",
        pathAttributes: outlineIconAttributes
    });
}

export function InfoCardDemo(): ComposedNode {
    return Section({
        id: "info-card",
        title: "InfoCard",
        children: [
            Grid(
                { minColumnWidth: "18rem" },
                InfoCard({
                    headingLevel: 3,
                    media: DemoIcon("M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5Zm0 0v-15"),
                    meta: "Lesson - 12 words",
                    title: "Beginner vocabulary",
                    description: "A compact card for a lesson, module, or learning item.",
                    children: P("Use the body slot for short supporting details that do not belong in the description."),
                    actionsLabel: "Beginner vocabulary actions",
                    actions: Button({
                        text: "Open lesson",
                        variant: "primary",
                        onPress() {
                            announce("Open lesson pressed.");
                        }
                    })
                }),
                InfoCard({
                    headingLevel: 3,
                    orientation: "horizontal",
                    media: DemoIcon("M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"),
                    meta: "Practice - ready",
                    title: "Daily practice",
                    description: "Horizontal cards work well for compact summaries with a visual marker.",
                    actionsLabel: "Daily practice actions",
                    actions: [
                        Button({
                            text: "Start",
                            variant: "primary",
                            onPress() {
                                announce("Start practice pressed.");
                            }
                        }),
                        Button({
                            text: "Details",
                            variant: "secondary",
                            onPress() {
                                announce("Details pressed.");
                            }
                        })
                    ]
                }),
                InfoCard({
                    headingLevel: 3,
                    meta: "Review queue",
                    title: "Spaced repetition",
                    description: "Use InfoCard for dashboard summaries, search results, settings groups, or future app screens.",
                    actionsLabel: "Review queue actions",
                    actionsAlign: "stretch",
                    actions: [
                        Button({
                            text: "Review now",
                            variant: "primary",
                            onPress() {
                                announce("Review now pressed.");
                            }
                        }),
                        Button({
                            text: "Later",
                            variant: "secondary",
                            onPress() {
                                announce("Later pressed.");
                            }
                        })
                    ]
                })
            )
        ]
    });
}
