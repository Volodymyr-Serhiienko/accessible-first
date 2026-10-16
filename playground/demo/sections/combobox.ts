import { Checkbox, Combobox, Grid, H3, P, Panel, Section, Stack, type ComposedNode } from "../af";
import { announce } from "../status";

export function ComboboxDemo(): ComposedNode {
    const choice = Combobox({
        label: "Role", value: "user", autocomplete: "none", filterOption: null,
        openOnFocus: false, openOnInput: false, inputOptions: { attributes: { readonly: true } },
        pendingMessage: "Please wait.", items: [
            { value: "user", label: "User" }, { value: "editor", label: "Editor" }
        ],
        onValueChange(detail) {
            if (detail.reason === "selection") announce(`Selected ${detail.selectedText}.`);
        }
    });
    return Section({
        id: "combobox",
        title: "Combobox",
        children: [
            Grid(
                { minColumnWidth: "16rem" },
                Panel(
                    Stack(H3("Read-only choice"), choice,
                        Checkbox({ label: "Pending request", onCheckedChange(detail) { choice.setPending(detail.checked); } }))
                ),
                Panel(
                    Stack(
                        H3("Editable search"),
                        P("Combobox keeps focus on the input and exposes the active option through aria-activedescendant."),
                        Combobox({
                            label: "Documentation topic",
                            placeholder: "Type to filter topics",
                            notFoundText: "No matching documentation topics found.",
                            items: [
                                { value: "accordion", label: "Accordion" },
                                { value: "button", label: "Button" },
                                { value: "combobox", label: "Combobox" },
                                { value: "dialog", label: "Dialog" },
                                { value: "disclosure", label: "Disclosure" },
                                { value: "listbox", label: "Listbox" },
                                { value: "menu", label: "Menu" },
                                { value: "popover", label: "Popover" },
                                { value: "select", label: "Select" },
                                { value: "tabs", label: "Tabs" }
                            ],
                            onValueChange(detail) {
                                if (detail.reason === "selection" && detail.selectedText) {
                                    announce(`Selected ${detail.selectedText}.`);
                                }
                            }
                        })
                    )
                ),
                Panel(
                    Stack(
                        H3("Default value"),
                        P("Use Combobox when users should be able to type and choose from matching options."),
                        Combobox({
                            label: "Testing device",
                            defaultValue: "tablet",
                            notFoundText: "No matching testing devices found.",
                            items: [
                                { value: "desktop", label: "Desktop keyboard" },
                                { value: "tablet", label: "Tablet screen reader" },
                                { value: "phone", label: "Phone touch screen" },
                                { value: "automation", label: "Automation later", disabled: true }
                            ],
                            onValueChange(detail) {
                                if (detail.reason === "selection" && detail.selectedText) {
                                    announce(`Testing device ${detail.selectedText} selected.`);
                                }
                            }
                        })
                    )
                )
            )
        ]
    });
}
