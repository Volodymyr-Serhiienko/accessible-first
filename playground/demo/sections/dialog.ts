import {
    Button,
    Dialog,
    P,
    Panel,
    Section,
    Stack,
    type ComposedDialog,
    type ComposedNode
} from "../af";
import { announce } from "../status";

export function DialogDemo(): ComposedNode {
    let dialog!: ComposedDialog;

    const confirm = Button({
        text: "Confirm action",
        variant: "primary",
        onPress() {
            announce("Dialog action confirmed.");
            dialog.close();
        }
    });

    dialog = Dialog({
        trigger: "Open dialog",
        title: "Dialog example",
        description: "Focus moves into the dialog, stays inside while it is open, and returns to the trigger when it closes.",
        children: [
            P("This component combines dialog semantics, focus trapping, Escape dismissal, outside click dismissal, and a visible close button."),
            P("Try Tab, Shift+Tab, Escape, and touch interaction on a mobile screen reader.")
        ],
        actions: confirm,
        closeText: "Close dialog"
    });

    return Section({
        id: "dialog",
        title: "Dialog",
        children: [
            Panel(
                Stack(
                    P("Dialog is the base overlay component for modal workflows."),
                    dialog
                )
            )
        ]
    });
}
