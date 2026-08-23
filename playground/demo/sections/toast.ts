import { Button, Grid, H3, P, Panel, Row, Section, Stack, type ComposedNode, type Toast } from "../af";
import { notifications } from "../status";

export function ToastDemo(): ComposedNode {
    let persistentToast: Toast | null = null;

    const showSuccess = Button({
        text: "Show success",
        variant: "secondary",
        onPress() {
            notifications.show({
                title: "Saved",
                description: "The demo settings were saved.",
                variant: "success",
                duration: 5000
            });
        }
    });

    const showWarning = Button({
        text: "Show warning",
        variant: "secondary",
        onPress() {
            notifications.show({
                title: "Unsaved changes",
                description: "This warning toast is a status message only. Required actions should use a dialog.",
                variant: "warning",
                duration: 7000
            });
        }
    });

    const showDanger = Button({
        text: "Show assertive",
        variant: "danger",
        onPress() {
            notifications.show({
                title: "Connection lost",
                description: "This assertive toast is announced with higher priority.",
                variant: "danger",
                politeness: "assertive",
                duration: null
            });
        }
    });

    const showPersistent = Button({
        text: "Show persistent",
        variant: "secondary",
        onPress() {
            if (persistentToast && !persistentToast.isClosed()) {
                persistentToast.update({
                    title: "Persistent reminder",
                    description: "This persistent toast is already visible.",
                    variant: "info",
                    duration: null
                });

                return;
            }

            persistentToast = notifications.show({
                title: "Persistent reminder",
                description: "This toast stays visible until dismissed.",
                variant: "info",
                duration: null,
                onClose() {
                    persistentToast = null;
                }
            });
        }
    });

    const clearAll = Button({
        text: "Clear all",
        variant: "secondary",
        onPress() {
            notifications.closeAll();
        }
    });

    return Section({
        id: "toast",
        title: "Toast",
        children: [
            Grid(
                { minColumnWidth: "16rem" },
                Panel(
                    Stack(
                        H3("Timed status toasts"),
                        P("Toast messages appear without moving focus. Timed dismissal is opt-in."),
                        Row(showSuccess, showWarning)
                    )
                ),
                Panel(
                    Stack(
                        H3("Persistent notifications"),
                        P("Important messages can stay visible until the user dismisses them."),
                        Row(showPersistent, showDanger, clearAll)
                    )
                )
            )
        ]
    });
}
