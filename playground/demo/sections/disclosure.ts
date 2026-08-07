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
                    description: "Project details opened. The panel explains disclosure state and expected keyboard behavior.",
                    panel: Stack(
                        P("The trigger controls aria-expanded, aria-controls, and the panel hidden state."),
                        P("This component is already useful as a base for future accordion and details patterns.")
                    ),
                    onOpenChange(open) {
                        if (!open) {
                            announce("Disclosure is closed.");
                        }
                    }
                })
            )
        ]
    });
}
