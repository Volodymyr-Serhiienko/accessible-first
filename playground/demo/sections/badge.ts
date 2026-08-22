import {
    Badge,
    Grid,
    H3,
    Icon,
    InfoCard,
    P,
    Panel,
    Row,
    Section,
    Stack,
    type ComposedNode
} from "../af";
import { demoIconPaths } from "../icons";

export function BadgeDemo(): ComposedNode {
    return Section({
        id: "badge",
        title: "Badge",
        children: [
            Grid(
                { minColumnWidth: "18rem" },
                Panel(
                    Stack(
                        H3("Variants"),
                        P("Badge communicates short metadata. Meaning must be present in text, not color alone."),
                        Row(
                            Badge({ text: "Neutral" }),
                            Badge({ text: "Info", variant: "info" }),
                            Badge({ text: "Ready", variant: "success" }),
                            Badge({ text: "Due soon", variant: "warning" }),
                            Badge({ text: "Error", variant: "danger" })
                        )
                    )
                ),
                Panel(
                    Stack(
                        H3("Accessible abbreviation"),
                        P("Use accessibleLabel when the visible label is shortened."),
                        Row(
                            Badge({
                                text: "12",
                                accessibleLabel: "12 words",
                                variant: "info"
                            }),
                            Badge({
                                text: "3",
                                accessibleLabel: "3 validation errors",
                                variant: "danger"
                            })
                        )
                    )
                ),
                InfoCard({
                    headingLevel: 3,
                    meta: Row(
                        Badge({ text: "Lesson", variant: "info" }),
                        Badge({ text: "Ready", variant: "success" }),
                        Badge({
                            icon: Icon({
                                path: demoIconPaths.check,
                                decorative: true,
                                size: "1em",
                                variant: "outline"
                            }),
                            text: "Completed",
                            variant: "success"
                        })
                    ),
                    title: "Badge inside InfoCard",
                    description: "Cards can use badges for category, status, and compact metadata without adding interaction."
                })
            )
        ]
    });
}
