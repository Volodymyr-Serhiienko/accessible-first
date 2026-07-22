import { Disclosure, P, Panel, Section, Stack, type ComposedNode } from "../af";
import { announce } from "../status";

export function DisclosureDemo(): ComposedNode {
    return Section({
        id: "disclosure",
        title: "Disclosure",
        children: [
            Panel(
                Disclosure({
                    trigger: "Project details",
                    panel: Stack(
                        P("The trigger controls aria-expanded, aria-controls, and the panel hidden state."),
                        P("This component is already useful as a base for future accordion and details patterns.")
                    ),
                    defaultOpen: false,
                    onOpenChange(open) {
                        announce(`Disclosure is ${open ? "open" : "closed"}.`);
                    }
                })
            )
        ]
    });
}
