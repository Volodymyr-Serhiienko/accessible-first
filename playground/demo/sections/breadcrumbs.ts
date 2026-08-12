import { Breadcrumbs, Button, Grid, H3, P, Panel, Section, Stack, type ComposedNode } from "../af";
import { announce } from "../status";

export function BreadcrumbsDemo(): ComposedNode {
    let compactSeparator = false;
    const liveBreadcrumbs = Breadcrumbs({
        items: [
            { label: "Settings", href: "#" },
            { label: "Account", href: "#" },
            { label: "Security" }
        ]
    });
    const separatorButton = Button({
        text: "Use arrow separator",
        variant: "secondary",
        onPress() {
            compactSeparator = !compactSeparator;
            const separator = compactSeparator ? ">" : "/";

            liveBreadcrumbs.update({ separator });
            separatorButton.setText(compactSeparator ? "Use slash separator" : "Use arrow separator");
            announce(`Breadcrumb separator changed to ${separator}.`);
        }
    });

    return Section({
        id: "breadcrumbs",
        title: "Breadcrumbs",
        children: [
            Grid(
                { minColumnWidth: "18rem" },
                Panel(
                    Stack(
                        H3("Page path"),
                        P("Breadcrumbs show the current page location inside a hierarchy."),
                        Breadcrumbs({
                            items: [
                                { label: "Home", href: "#" },
                                { label: "Components", href: "#components" },
                                { label: "Breadcrumbs" }
                            ]
                        })
                    )
                ),
                Panel(
                    Stack(
                        H3("Documentation path"),
                        P("The current item is marked with aria-current by default."),
                        Breadcrumbs({
                            label: "Documentation path",
                            items: [
                                { label: "Docs", href: "#" },
                                { label: "Components", href: "#components" },
                                { label: "Navigation", href: "#navigation" },
                                { label: "Breadcrumbs" }
                            ]
                        })
                    )
                ),
                Panel(
                    Stack(
                        H3("Custom separator"),
                        P("Separators are visible but hidden from assistive technologies. This example updates separators without rebuilding breadcrumb items."),
                        liveBreadcrumbs,
                        separatorButton
                    )
                )
            )
        ]
    });
}
