import { Grid, H3, Link, P, Panel, Row, Section, Stack, type ComposedNode } from "../af";
import { announce } from "../status";

export function LinksDemo(): ComposedNode {
    return Section({
        id: "links",
        title: "Links",
        children: [
            Grid(
                { minColumnWidth: "16rem" },
                Panel(
                    Stack(
                        H3("Navigation links"),
                        P("Links use the same hint API as buttons."),
                        Row(
                            Link({
                                text: "Documentation link",
                                href: "/docs",
                                hint: "Opens the documentation area. Navigation is intercepted in this playground.",
                                hintDisplay: "both",
                                onNavigate(event) {
                                    event.preventDefault();
                                    announce("Documentation navigation intercepted for playground.");
                                }
                            }),
                            Link({
                                text: "Current section",
                                href: "#links",
                                current: "page",
                                hint: "This link points to the current playground section.",
                                hintDisplay: "description"
                            })
                        )
                    )
                ),
                Panel(
                    Stack(
                        H3("External and disabled"),
                        P("Hints can explain destination or unavailable state without changing the link label."),
                        Row(
                            Link({
                                text: "External link",
                                href: "https://example.com",
                                external: true,
                                hint: "Opens an external example page in a new browser context.",
                                hintDisplay: "both",
                                onNavigate(event) {
                                    event.preventDefault();
                                    announce("External link prepared with safe target and rel attributes.");
                                }
                            }),
                            Link({
                                text: "Disabled link",
                                href: "/disabled",
                                disabled: true,
                                hint: "This link is unavailable in the playground demo.",
                                hintDisplay: "tooltip"
                            })
                        )
                    )
                )
            )
        ]
    });
}
