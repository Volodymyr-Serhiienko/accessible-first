import { Badge, Grid, H3, InfoCard, P, Panel, Progress, Section, Stack, type ComposedNode } from "../af";

export function ProgressDemo(): ComposedNode {
    return Section({
        id: "progress",
        title: "Progress",
        children: [
            P("Progress communicates completion, loading, and task status with native accessible semantics."),
            Grid(
                { minColumnWidth: "18rem" },
                Panel(
                    Stack(
                        H3("Determinate progress"),
                        Progress({
                            label: "Lesson completion",
                            value: 68,
                            description: "Shows how much of the current lesson is complete."
                        }),
                        Progress({
                            label: "Vocabulary mastery",
                            value: 42,
                            variant: "success",
                            description: "A successful learning state can use the success variant."
                        })
                    )
                ),
                InfoCard({
                    headingLevel: 3,
                    meta: Badge({
                        text: "Live",
                        variant: "info"
                    }),
                    title: "Sync status",
                    description: "Use indeterminate progress when the task is active but the exact value is unknown.",
                    children: Progress({
                        label: "Syncing study history",
                        value: null,
                        showValue: false,
                        description: "The app is syncing recent progress."
                    })
                }),
                Panel(
                    Stack(
                        H3("Attention states"),
                        Progress({
                            label: "Storage usage",
                            value: 86,
                            variant: "warning",
                            description: "Warning progress can help signal that attention may be needed."
                        }),
                        Progress({
                            label: "Failed import",
                            value: 100,
                            valueText: "Needs review",
                            variant: "danger",
                            description: "Danger progress is useful for failed or blocked workflows."
                        })
                    )
                )
            )
        ]
    });
}
