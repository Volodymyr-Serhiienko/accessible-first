import { Button, Grid, H3, P, Panel, Popover, Row, Section, Stack, type ComposedNode, type ComposedPopover } from "../af";
import { announce } from "../status";

export function PopoverDemo(): ComposedNode {
    let guidancePopover!: ComposedPopover;
    let actionsPopover!: ComposedPopover;

    const closeGuidance = Button({
        text: "Close",
        variant: "secondary",
        onPress() {
            guidancePopover.close();
        }
    });

    guidancePopover = Popover({
        trigger: "Open guidance",
        description: "Use Tab to move into the panel, or Escape to close it.",
        side: "bottom",
        alignment: "start",
        offset: 8,
        children: [
            Stack(
                H3("Popover guidance"),
                P("Popover is a lightweight floating panel anchored to a trigger."),
                P("Focus stays on the trigger when the panel opens. Press Tab to move into interactive content inside the panel."),
                Row(closeGuidance)
            )
        ]
    });

    const previewAction = Button({
        text: "Preview",
        variant: "secondary",
        onPress() {
            announce("Preview action selected.");
            actionsPopover.close();
        }
    });

    const publishAction = Button({
        text: "Publish",
        variant: "primary",
        onPress() {
            announce("Publish action selected.");
            actionsPopover.close();
        }
    });

    actionsPopover = Popover({
        trigger: "Quick actions",
        description: "Use Tab to move between actions.",
        side: "bottom",
        alignment: "start",
        offset: 8,
        matchAnchorWidth: true,
        children: [
            Stack(
                H3("Quick actions"),
                P("This panel matches the trigger width and contains ordinary composed buttons."),
                Row(previewAction, publishAction)
            )
        ]
    });

    return Section({
        id: "popover",
        title: "Popover",
        children: [
            Grid(
                { minColumnWidth: "16rem" },
                Panel(
                    Stack(
                        H3("Anchored panel"),
                        P("Use Popover for lightweight non-modal content that appears near a trigger."),
                        guidancePopover
                    )
                ),
                Panel(
                    Stack(
                        H3("Interactive content"),
                        P("Popover can contain controls. Use Dialog when the workflow must be modal."),
                        actionsPopover
                    )
                )
            )
        ]
    });
}
