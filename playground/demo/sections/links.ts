import { Link, Panel, Row, Section, type ComposedNode } from "../af";
import { announce } from "../status";

export function LinksDemo(): ComposedNode {
    return Section({
        id: "links",
        title: "Links",
        children: [
            Panel(
                Row(
                    Link({
                        text: "Documentation link",
                        href: "/docs",
                        onNavigate(event) {
                            event.preventDefault();
                            announce("Documentation navigation intercepted for playground.");
                        }
                    }),
                    Link({
                        text: "Current section",
                        href: "#links",
                        current: "page"
                    }),
                    Link({
                        text: "External link",
                        href: "https://example.com",
                        external: true,
                        onNavigate(event) {
                            event.preventDefault();
                            announce("External link prepared with safe target and rel attributes.");
                        }
                    }),
                    Link({
                        text: "Disabled link",
                        href: "/disabled",
                        disabled: true
                    })
                )
            )
        ]
    });
}
