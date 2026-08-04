import {
    AlertDialog,
    P,
    Panel,
    Section,
    Stack,
    type ComposedNode
} from "../af";
import { announce } from "../status";

export function AlertDialogDemo(): ComposedNode {
    const alertDialog = AlertDialog({
        trigger: "Open alert dialog",
        title: "Delete project?",
        description: "This action cannot be undone.",
        children: [
            P("Alert dialogs are for important decisions that need immediate attention.")
        ],
        confirmText: "Delete project",
        cancelText: "Cancel",
        onConfirm() {
            announce("Delete action confirmed.");
        },
        onCancel() {
            announce("Delete action cancelled.");
        }
    });

    return Section({
        id: "alert-dialog",
        title: "Alert dialog",
        children: [
            Panel(
                Stack(
                    P("AlertDialog is a stricter dialog preset for confirmations and destructive actions."),
                    alertDialog
                )
            )
        ]
    });
}
