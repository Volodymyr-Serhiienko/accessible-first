import { DescriptionList, Grid, H3, Link, P, Panel, Section, Stack, type ComposedNode } from "../af";

export function DescriptionListDemo(): ComposedNode {
    return Section({
        id: "description-list",
        title: "DescriptionList",
        children: [
            Grid(
                { minColumnWidth: "18rem" },
                Panel(
                    Stack(
                        H3("Project summary"),
                        P("DescriptionList is for semantic term and details content."),
                        DescriptionList({
                            items: [
                                { term: "Status", details: "Ready for manual review" },
                                { term: "Primary goal", details: "Accessible application development" },
                                { term: "Testing", details: "Keyboard, screen reader, mobile devices" }
                            ]
                        })
                    )
                ),
                Panel(
                    Stack(
                        H3("Inline layout"),
                        P("Inline layout works well for compact metadata."),
                        DescriptionList({
                            layout: "inline",
                            items: [
                                { term: "Theme", details: "System" },
                                { term: "Target size", details: "44px minimum" },
                                { term: "WCAG focus", details: "Keyboard and assistive technology first" }
                            ]
                        })
                    )
                ),
                Panel(
                    Stack(
                        H3("Rich details"),
                        P("Details can contain composed nodes, including links."),
                        DescriptionList({
                            items: [
                                {
                                    term: "Documentation",
                                    details: Link({
                                        text: "Open component docs",
                                        href: "#description-list",
                                        variant: "standalone"
                                    })
                                },
                                {
                                    term: "Use for",
                                    details: "Profiles, summaries, settings review, and read-only metadata."
                                }
                            ]
                        })
                    )
                )
            )
        ]
    });
}
