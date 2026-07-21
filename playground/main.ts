import { Accordion, Button, Disclosure, Div, Em, Grid,
    H1, H3, Html, Icon, IconButton, Li, Link, P,
    Panel, Row, Section, Small, Stack, Strong, VisuallyHidden,
    Ul, createPage, mount, type ComposedNode
} from "../packages/components/src";

import "../packages/components/src/styles/index.css";

const status = P({
    id: "status",
    className: "status",
    text: "Ready for component checks.",
    attributes: {
        role: "status",
        "aria-live": "polite"
    }
});

function announce(message: string): void {
    status.element.textContent = message;
}

function HeaderDemo(): ComposedNode {
    return Row(
        { className: "playground-header__inner" },
        Stack(
            H1({ className: "playground-title" }, "Accessible First Playground"),
            status
        ),
        Button({
            text: "Dark theme",
            variant: "secondary",
            pressed: false,
            onPress(_event, button) {
                const isDark = document.documentElement.dataset.afTheme !== "dark";

                if (isDark) {
                    document.documentElement.dataset.afTheme = "dark";
                } else {
                    delete document.documentElement.dataset.afTheme;
                }

                button.setPressed(isDark);
                button.setText(isDark ? "Light theme" : "Dark theme");
                announce(`${isDark ? "Dark" : "Light"} theme enabled.`);
            }
        })
    );
}

function NavigationDemo(): ComposedNode {
    return Row(
        { className: "playground-nav__inner" },
        Link({ text: "Buttons", href: "#buttons", variant: "standalone" }),
        Link({ text: "Icon buttons", href: "#icon-buttons", variant: "standalone" }),
        Link({ text: "Links", href: "#links", variant: "standalone" }),
        Link({ text: "Disclosure", href: "#disclosure", variant: "standalone" }),
        Link({ text: "Accordion", href: "#accordion", variant: "standalone" }),
        Link({ text: "Layout", href: "#layout", variant: "standalone" }),
        Link({ text: "Markup", href: "#markup", variant: "standalone" })
    );
}

function ButtonsDemo(): ComposedNode {
    return Section({
        id: "buttons",
        title: "Buttons",
        children: [
            Panel(
                Row(
                    Button({
                        text: "Primary action",
                        variant: "primary",
                        onPress: () => announce("Primary button pressed.")
                    }),
                    Button({
                        text: "Secondary action",
                        variant: "secondary",
                        onPress: () => announce("Secondary button pressed.")
                    }),
                    Button({
                        text: "Toggle option",
                        variant: "secondary",
                        pressed: false,
                        attributes: {
                            title: "Toggle option"
                        },
                        onPress(_event, button) {
                            const pressed = button.getPressed() !== true;

                            button.setPressed(pressed);
                            announce(`Toggle button is ${pressed ? "pressed" : "not pressed"}.`);
                        }
                    }),
                    Button({
                        text: "Disabled action",
                        variant: "secondary",
                        disabled: true
                    })
                )
            )
        ]
    });
}

function IconButtonsDemo(): ComposedNode {
    return Section({
        id: "icon-buttons",
        title: "Icon buttons",
        children: [
            Panel(
                Row(
                    IconButton({
                        label: "Save",
                        icon: Icon({path: "M5 3h12l2 2v16H5V3Zm2 2v14h10V7.8L16.2 5H15v5H8V5H7Zm3 0v3h3V5h-3Zm-1 9h6v2H9v-2Z"}),
                        variant: "secondary",
                        onPress: () => announce("Save icon button pressed.")
                    }),
                    IconButton({
                        label: "Add to favorites",
                        icon: Icon({path: "m12 21-1.4-1.3C5.4 15 2 11.9 2 8a5 5 0 0 1 8.6-3.5L12 5.9l1.4-1.4A5 5 0 0 1 22 8c0 3.9-3.4 7-8.6 11.7L12 21Z"}),
                        variant: "secondary",
                        pressed: false,
                        onPress(_event, button) {
                            const pressed = button.getPressed() !== true;
                            const label = pressed ? "Remove from favorites" : "Add to favorites";

                            button.setPressed(pressed);
                            button.setLabel(label);
                            button.setTitle(label);
                            announce(`Favorite is ${pressed ? "selected" : "not selected"}.`);
                        }
                    }),
                    IconButton({
                        label: "Unavailable action",
                        icon: Icon({path: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 3a7 7 0 0 1 5.3 11.6L7.4 6.7A7 7 0 0 1 12 5Zm0 14a7 7 0 0 1-5.3-11.6l9.9 9.9A7 7 0 0 1 12 19Z"}),
                        variant: "secondary",
                        disabled: true
                    })
                )
            )
        ]
    });
}

function LinksDemo(): ComposedNode {
    return Section({
        id: "links",
        title: "Links",
        children: [
            Panel(
                Row(
                    Link({
                        text: "Documentation link",
                        href: "/docs",
                        onNavigate(event) {
                            event.preventDefault();
                            announce("Documentation navigation intercepted for playground.");
                        }
                    }),
                    Link({
                        text: "Current section",
                        href: "#links",
                        current: "page"
                    }),
                    Link({
                        text: "External link",
                        href: "https://example.com",
                        external: true,
                        onNavigate(event) {
                            event.preventDefault();
                            announce("External link prepared with safe target and rel attributes.");
                        }
                    }),
                    Link({
                        text: "Disabled link",
                        href: "/disabled",
                        disabled: true
                    })
                )
            )
        ]
    });
}

function DisclosureDemo(): ComposedNode {
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

function AccordionDemo(): ComposedNode {
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

function LayoutDemo(): ComposedNode {
    return Section({
        id: "layout",
        title: "Layout primitives",
        children: [
            Grid(
                { minColumnWidth: "15rem", gap: "1rem" },
                Panel(
                    Stack(
                        H3("Stack"),
                        P("Vertical composition for text, controls, and compact content blocks."),
                        Button({
                            text: "Stack action",
                            variant: "secondary",
                            onPress: () => announce("Stack action pressed.")
                        })
                    )
                ),
                Panel(
                    Stack(
                        H3("Row"),
                        P("Horizontal composition that wraps naturally and becomes comfortable on small screens."),
                        Row(
                            Button({
                                text: "One",
                                variant: "secondary",
                                onPress: () => announce("First row button pressed.")
                            }),
                            Button({
                                text: "Two",
                                variant: "secondary",
                                onPress: () => announce("Second row button pressed.")
                            })
                        )
                    )
                ),
                Div({
                    className: "grid-empty-cell",
                    attributes: {
                        "aria-hidden": true
                    }
                }),
                Panel(
                    Stack(
                        H3("Grid cell"),
                        P("A regular panel placed into a responsive grid.")
                    )
                ),
                Div({
                    className: "grid-empty-cell",
                    attributes: {
                        "aria-hidden": true
                    }
                }),
                Panel(
                    Stack(
                        H3("Another cell"),
                        P("Empty cells make the grid shape visible without adding semantic noise.")
                    )
                )
            )
        ]
    });
}

function MarkupDemo(): ComposedNode {
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

function ChecksDemo(): ComposedNode {
    return Section({
        id: "checks",
        title: "Manual checks",
        children: [
            Panel(
                Ul(
                    { className: "check-list" },
                    Li("Keyboard focus order is predictable."),
                    Li("Focus indicator is visible in light and dark themes."),
                    Li("Disabled controls cannot be activated."),
                    Li("Touch targets feel usable on mobile."),
                    Li("Screen readers announce names, roles, and states.")
                )
            )
        ]
    });
}

function FooterDemo(): ComposedNode {
    return Stack(
        { className: "playground-footer__inner" },
        P(Small("Accessible First playground. Living documentation for the component and page-building API."))
    );
}

const page = createPage({
    title: "Accessible First Playground",
    mainId: "main",
    navigationLabel: "Playground sections",
    theme: "system"
});

page.element.classList.add("playground-shell");
page.main.classList.add("playground-main");

page.header(HeaderDemo());
page.navigation(NavigationDemo());
page.section(ButtonsDemo());
page.section(IconButtonsDemo());
page.section(LinksDemo());
page.section(DisclosureDemo());
page.section(AccordionDemo());
page.section(LayoutDemo());
page.section(MarkupDemo());
page.section(ChecksDemo());
page.footer(FooterDemo());

mount(page, "#app");
page.inspect();
