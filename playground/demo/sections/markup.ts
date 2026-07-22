import { Em, Grid, H3, Html, Li, P, Panel,
    Section, Small, Stack, Strong, Ul,
    VisuallyHidden, type ComposedNode
} from "../af";

export function MarkupDemo(): ComposedNode {
    return Section({
        id: "markup",
        title: "Markup helpers and native HTML",
        children: [
            Grid(
                { minColumnWidth: "17rem", gap: "1rem" },
                Panel(
                    Stack(
                        H3("Tag helpers"),
                        P(
                            "This paragraph is assembled with ",
                            Strong("Strong"),
                            ", ",
                            Em("Em"),
                            ", and regular text nodes."
                        ),
                        Ul(
                            Li("Readable page modules."),
                            Li("Predictable semantic structure."),
                            Li("Small helpers instead of long nested object trees.")
                        )
                    )
                ),
                Panel(
                    Stack(
                        H3("Native HTML fragment"),
                        Html({
                            html: `
                                <div class="native-html-demo">
                                    <p>Native HTML can still be inserted when the project needs trusted static markup.</p>
                                    <ul>
                                        <li>Useful for documentation fragments.</li>
                                        <li>Useful for imported content blocks.</li>
                                    </ul>
                                </div>
                            `
                        })
                    )
                ),
                Panel(
                    Stack(
                        H3("Visually hidden content"),
                        P("Some helper text can stay available to assistive technologies without being visible on screen."),
                        VisuallyHidden("This sentence is visually hidden but remains available in the accessibility tree."),
                        P(Small("The hidden sentence is intentionally not visible."))
                    )
                )
            )
        ]
    });
}
