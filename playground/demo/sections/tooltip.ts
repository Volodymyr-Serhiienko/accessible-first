import { Button, Grid, H3, Link, P, Panel, Row, Section, Stack, Tooltip, type ComposedNode, type ComposedTooltip } from "../af";
import { announce } from "../status";

export function TooltipDemo(): ComposedNode {
    let draftTooltip!: ComposedTooltip;
    let longHint = false;

    const updateHintButton = Button({
        text: "Change hint",
        variant: "secondary",
        onPress() {
            longHint = !longHint;

            draftTooltip.setText(
                longHint
                    ? "Creates a draft and keeps it private until you publish it."
                    : "Creates a private draft."
            );

            announce("Tooltip text updated.");
        }
    });

    draftTooltip = Tooltip({
        trigger: Button({
            text: "Create draft",
            variant: "primary",
            onPress() {
                announce("Create draft action pressed.");
            }
        }),
        text: "Creates a private draft.",
        describe: true
    });

    const linkTooltip = Tooltip({
        trigger: Link({
            text: "Tooltip documentation",
            href: "#tooltip",
            variant: "standalone",
            onNavigate(event) {
                event.preventDefault();
                announce("Tooltip documentation link activated in playground.");
            }
        }),
        text: "Tooltips can describe links and other focusable triggers.",
        describe: true
    });

    const hoverAnnouncementTooltip = Tooltip({
        trigger: Button({
            text: "Hover announcement",
            variant: "secondary",
            onPress() {
                announce("Hover announcement example pressed.");
            }
        }),
        text: "This example also announces the hint when a mouse pointer enters.",
        describe: true,
        announceOnHover: true
    });

    return Section({
        id: "tooltip",
        title: "Tooltip",
        children: [
            Grid(
                { minColumnWidth: "16rem" },
                Panel(
                    Stack(
                        H3("Described trigger"),
                        P("Focus or hover the button. Press Escape while focused to hide the visual tooltip."),
                        Row(draftTooltip, updateHintButton)
                    )
                ),
                Panel(
                    Stack(
                        H3("Links and hover"),
                        P("Tooltip is for short passive helper text. Use Popover for richer content."),
                        Row(linkTooltip, hoverAnnouncementTooltip)
                    )
                )
            )
        ]
    });
}
