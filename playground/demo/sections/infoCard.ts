import {
    Button,
    Grid,
    Icon,
    InfoCard,
    P,
    Section,
    type ComposedNode
} from "../af";
import { demoIconPaths } from "../icons";
import { announce } from "../status";

export function InfoCardDemo(): ComposedNode {
    return Section({
        id: "info-card",
        title: "InfoCard",
        children: [
            Grid(
                { minColumnWidth: "18rem" },
                InfoCard({
                    headingLevel: 3,
                    media: Icon({
                        path: demoIconPaths.lesson,
                        decorative: true,
                        size: "3rem",
                        variant: "outline"
                    }),
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
                    media: Icon({
                        path: demoIconPaths.checkCircle,
                        decorative: true,
                        size: "3rem",
                        variant: "outline"
                    }),
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
