import { Button, Em, Grid, H3, Icon, IconLabel, Image, Li, P, Panel, Row, Section, Small, Stack, StatusMessage, Strong, TrustedHtml, Ul, VisuallyHidden, type ComposedNode } from "../af";
import { demoIconPaths } from "../icons";
import { announce } from "../status";

export function MarkupDemo(): ComposedNode {
    const savedStatus = StatusMessage({
        hidden: true
    });

    const showSavedStatus = Button({
        text: "Show saved status",
        variant: "secondary",
        onPress() {
            savedStatus.update({
                icon: Icon({
                    path: demoIconPaths.check,
                    decorative: true,
                    variant: "outline"
                }),
                text: "Draft saved.",
                variant: "success",
                hidden: false,
                announcement: true
            });
        }
    });

    return Section({
        id: "markup",
        title: "Markup helpers and trusted HTML",
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
                        H3("Trusted HTML fragment"),
                        TrustedHtml({
                            html: `
                                <div class="native-html-demo">
                                    <p>Trusted static markup can be inserted when the project needs a native HTML fragment.</p>
                                    <ul>
                                        <li>Useful for documentation fragments.</li>
                                        <li>Useful for already sanitized imported content.</li>
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
                ),
                Panel(
                    Stack(
                        H3("Accessible images"),
                        P("Informative images need alt text. Decorative images remain visible but are hidden from assistive technologies."),
                        Row(
                            Image({
                                src: "./assets/logo.svg",
                                alt: "Accessible First AF logo",
                                variant: "thumbnail",
                                inlineSize: "6rem",
                                aspectRatio: "1 / 1"
                            }),
                            Image({
                                src: "./assets/logo.svg",
                                decorative: true,
                                variant: "rounded",
                                inlineSize: "3rem",
                                aspectRatio: "1 / 1"
                            })
                        )
                    )
                ),
                Panel(
                    Stack(
                        H3("Icon labels"),
                        P("IconLabel keeps a decorative icon and its visible caption together while the surrounding native button owns interaction."),
                        Row(
                            Button({
                                variant: "secondary",
                                children: [
                                    IconLabel({
                                        icon: Icon({
                                            path: demoIconPaths.save,
                                            decorative: true,
                                            size: "1.1em",
                                            variant: "outline"
                                        }),
                                        label: "Save draft"
                                    })
                                ],
                                onPress() {
                                    announce("Save draft button pressed.");
                                }
                            }),
                            Button({
                                variant: "secondary",
                                children: [
                                    IconLabel({
                                        icon: Icon({
                                            path: demoIconPaths.lesson,
                                            decorative: true,
                                            size: "1.35em",
                                            variant: "outline"
                                        }),
                                        label: "Lessons",
                                        iconPosition: "top"
                                    })
                                ],
                                onPress() {
                                    announce("Lessons button pressed.");
                                }
                            })
                        )
                    )
                ),
                Panel(
                    Stack(
                        H3("Inline status"),
                        P("A status remains visible near its workflow and can announce one concise completed action without moving focus."),
                        showSavedStatus,
                        savedStatus
                    )
                )
            )
        ]
    });
}
