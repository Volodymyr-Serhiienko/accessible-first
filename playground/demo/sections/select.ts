import { Grid, H3, P, Panel, Section, Select, Stack, type ComposedNode } from "../af";
import { announce } from "../status";

export function SelectDemo(): ComposedNode {
    return Section({
        id: "select",
        title: "Select",
        children: [
            Grid(
                { minColumnWidth: "16rem" },
                Panel(
                    Stack(
                        H3("Native single select"),
                        P("Select uses the platform control for reliable forms, mobile behavior, and screen readers."),
                        Select({
                            label: "Documentation area",
                            placeholder: "Choose an area",
                            items: [
                                { value: "components", label: "Components" },
                                { value: "patterns", label: "Page patterns" },
                                { value: "testing", label: "Testing" },
                                { value: "disabled", label: "Unavailable option", disabled: true }
                            ],
                            onValueChange(detail) {
                                announce(`Selected ${detail.text}.`);
                            }
                        })
                    )
                ),
                Panel(
                    Stack(
                        H3("Native multiple select"),
                        P("Native multiple select uses platform shortcuts. For easier modifier-free multi-selection, use Listbox multiple selection."),
                        Select({
                            label: "Testing targets",
                            multiple: true,
                            defaultValue: ["keyboard", "mobile"],
                            items: [
                                { value: "keyboard", label: "Keyboard" },
                                { value: "screen-reader", label: "Screen reader" },
                                { value: "mobile", label: "Mobile" },
                                { value: "automation", label: "Automation later" }
                            ],
                            visibleRows: 3,
                            onValueChange(detail) {
                                announce(`Selected ${detail.texts.join(", ") || "none"}.`);
                            }
                        })
                    )
                )
            )
        ]
    });
}
