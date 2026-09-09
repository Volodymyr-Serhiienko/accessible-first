import { Checkbox, FieldGroup, Grid, H3, P, Panel, Section, Stack, Switch, TextField, type ComposedNode } from "../af";
import { announce } from "../status";

export function FieldGroupDemo(): ComposedNode {
    const emailAlerts = Checkbox({
        label: "Email alerts",
        onCheckedChange(detail) {
            const valid = syncNotificationChannelValidity();

            announce(
                valid
                    ? detail.checked
                        ? "Email alerts selected."
                        : "Email alerts cleared."
                    : "Email alerts cleared. Choose at least one notification channel.",
                { variant: valid ? "info" : "warning" }
            );
        }
    });

    const smsAlerts = Checkbox({
        label: "SMS alerts",
        onCheckedChange(detail) {
            const valid = syncNotificationChannelValidity();

            announce(
                valid
                    ? detail.checked
                        ? "SMS alerts selected."
                        : "SMS alerts cleared."
                    : "SMS alerts cleared. Choose at least one notification channel.",
                { variant: valid ? "info" : "warning" }
            );
        }
    });

    const notificationChannels = FieldGroup({
        label: "Notification channels",
        description: "Choose at least one channel for urgent updates.",
        required: true,
        invalid: true,
        errorMessage: "Choose at least one notification channel.",
        children: [emailAlerts, smsAlerts]
    });

    function syncNotificationChannelValidity(): boolean {
        const valid = emailAlerts.getChecked() === true
            || smsAlerts.getChecked() === true;

        notificationChannels.setInvalid(!valid);
        notificationChannels.setErrorMessage(
            valid ? null : "Choose at least one notification channel."
        );

        return valid;
    }

    return Section({
        id: "field-group",
        title: "FieldGroup",
        children: [
            Grid(
                { minColumnWidth: "18rem" },
                Panel(
                    Stack(
                        H3("Contact details"),
                        P("A semantic group can collect related fields under one legend."),
                        FieldGroup({
                            label: "Account contact",
                            description: "Required fields validate when focus leaves them.",
                            children: [
                                TextField({
                                    label: "Email",
                                    type: "email",
                                    required: true,
                                    placeholder: "name@example.com",
                                    validationMessages: {
                                        valueMissing: "Enter your email address.",
                                        typeMismatch: "Enter a valid email address."
                                    }
                                }),
                                TextField({
                                    label: "Phone",
                                    type: "tel",
                                    inputMode: "tel",
                                    description: "Optional."
                                })
                            ]
                        })
                    )
                ),
                Panel(
                    Stack(
                        H3("Group state"),
                        P("The group exposes a shared required and error state, then clears it when a related control is selected."),
                        notificationChannels
                    )
                ),
                Panel(
                    Stack(
                        H3("Horizontal controls"),
                        P("Horizontal groups wrap naturally on smaller screens."),
                        FieldGroup({
                            label: "Display settings",
                            orientation: "horizontal",
                            children: [
                                Switch({
                                    label: "Compact rows",
                                    onCheckedChange(detail) {
                                        announce(`Compact rows ${detail.checked ? "enabled" : "disabled"}.`);
                                    }
                                }),
                                Switch({
                                    label: "High contrast hints",
                                    onCheckedChange(detail) {
                                        announce(`High contrast hints ${detail.checked ? "enabled" : "disabled"}.`);
                                    }
                                }),
                                Checkbox({
                                    label: "Show helper text",
                                    onCheckedChange(detail) {
                                        announce(`Helper text ${detail.checked ? "shown" : "hidden"}.`);
                                    }
                                })
                            ]
                        })
                    )
                )
            )
        ]
    });
}
