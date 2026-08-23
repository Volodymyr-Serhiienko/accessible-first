import { Grid, H3, Listbox, P, Panel, Section, Stack, type ComposedNode } from "../af";
import { announce } from "../status";

export function ListboxDemo(): ComposedNode {
    return Section({
        id: "listbox",
        title: "Listbox",
        children: [
            Grid(
                { minColumnWidth: "16rem" },
                Panel(
                    Stack(
                        H3("Single selection"),
                        P("Arrow keys move through options. Typeahead is enabled by default."),
                        Listbox({
                            label: "Single selection list",
                            defaultValue: "documentation",
                            items: [
                                { value: "components", label: "Components" },
                                { value: "documentation", label: "Documentation" },
                                { value: "patterns", label: "Page patterns" },
                                { value: "disabled", label: "Unavailable option", disabled: true }
                            ],
                            onSelectionChange(detail) {
                                announce(`Selected ${detail.selectedText || "none"}.`);
                            }
                        })
                    )
                ),
                Panel(
                    Stack(
                        H3("Multiple selection"),
                        P("Use Enter or Space to toggle focused options."),
                        Listbox({
                            label: "Multiple selection list",
                            selectionMode: "multiple",
                            defaultValue: ["keyboard", "screen-reader"],
                            items: [
                                { value: "keyboard", label: "Keyboard support" },
                                { value: "screen-reader", label: "Screen reader checks" },
                                { value: "mobile", label: "Mobile testing" },
                                { value: "automation", label: "Automation later" }
                            ],
                            onSelectionChange(detail) {
                                announce(`Selected ${detail.selectedText || "none"}.`);
                            }
                        })
                    )
                )
            )
        ]
    });
}
