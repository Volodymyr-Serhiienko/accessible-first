import { Accordion, P, Panel, Section, Stack, type ComposedNode } from "../af";
import { announce } from "../status";

export function AccordionDemo(): ComposedNode {
    return Section({
        id: "accordion",
        title: "Accordion",
        children: [
            Panel(
                Stack(
                    P("Accordion combines disclosure behavior with grouped keyboard navigation."),
                    Accordion({
                        collapsible: true,
                        items: [
                            {
                                value: "semantics",
                                defaultOpen: true,
                                trigger: "Accessible semantics",
                                panel: Stack(
                                    P("Each item uses a button trigger connected to a controlled panel."),
                                    P("The component keeps aria-expanded, aria-controls, and hidden state synchronized.")
                                )
                            },
                            {
                                value: "keyboard",
                                trigger: "Keyboard support",
                                panel: Stack(
                                    P("Tab enters the active accordion trigger."),
                                    P("Arrow keys, Home, and End move through accordion triggers with roving focus.")
                                )
                            },
                            {
                                value: "composition",
                                trigger: "Composition API",
                                panel: Stack(
                                    P("Accordion is built from existing Disclosure behavior and can be used directly inside semantic page sections.")
                                )
                            }
                        ],
                        onOpenChange(detail) {
                            announce(`Accordion item ${detail.value} is ${detail.open ? "open" : "closed"}.`);
                        }
                    })
                )
            )
        ]
    });
}
