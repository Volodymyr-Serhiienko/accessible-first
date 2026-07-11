import {
    Button,
    Disclosure,
    IconButton,
    Link,
    createElement,
    createPage,
    mount,
    type CompositionChild
} from "../packages/components/src";

import "../packages/components/src/styles/index.css";

function createIcon(path: string): SVGSVGElement {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const iconPath = document.createElementNS("http://www.w3.org/2000/svg", "path");

    svg.classList.add("icon");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");

    iconPath.setAttribute("fill", "currentColor");
    iconPath.setAttribute("d", path);

    svg.append(iconPath);

    return svg;
}

const status = createElement("p", {
    id: "status",
    className: "status",
    text: "Ready for component checks.",
    attributes: {
        role: "status",
        "aria-live": "polite"
    }
});

function announce(message: string): void {
    status.textContent = message;
}

function DemoPanel(title: string, id: string, children: CompositionChild[]): CompositionChild[] {
    return [
        createElement("div", {
            className: "demo-panel",
            children: [
                createElement("h2", {
                    id,
                    text: title
                }),
                ...children
            ]
        })
    ];
}

function HeaderDemo(): CompositionChild[] {
    let themeToggle!: ReturnType<typeof Button>;

    themeToggle = Button({
        text: "Dark theme",
        variant: "secondary",
        pressed: false,
        onPress() {
            const isDark = document.documentElement.dataset.afTheme !== "dark";

            if (isDark) {
                document.documentElement.dataset.afTheme = "dark";
            } else {
                delete document.documentElement.dataset.afTheme;
            }

            themeToggle.setPressed(isDark);
            themeToggle.setText(isDark ? "Light theme" : "Dark theme");
            announce(`${isDark ? "Dark" : "Light"} theme enabled.`);
        }
    });

    return [
        createElement("div", {
            className: "playground-header",
            children: [
                createElement("div", {
                    children: [
                        createElement("h1", {
                            className: "playground-title",
                            text: "Accessible First Playground"
                        }),
                        status
                    ]
                }),
                themeToggle
            ]
        })
    ];
}

function NavigationDemo(): CompositionChild[] {
    return [
        createElement("div", {
            className: "playground-nav",
            children: [
                Link({ text: "Buttons", href: "#buttons" }),
                Link({ text: "Icon Buttons", href: "#icon-buttons" }),
                Link({ text: "Links", href: "#links" }),
                Link({ text: "Disclosures", href: "#disclosures" }),
                Link({ text: "Checks", href: "#checks" })
            ]
        })
    ];
}

function ButtonsDemo(): CompositionChild[] {
    let toggleButton!: ReturnType<typeof Button>;

    toggleButton = Button({
        text: "Toggle option",
        variant: "secondary",
        pressed: false,
        attributes: {
            title: "Toggle option"
        },
        onPress() {
            const pressed = toggleButton.getPressed() !== true;

            toggleButton.setPressed(pressed);
            announce(`Toggle button is ${pressed ? "pressed" : "not pressed"}.`);
        }
    });

    return DemoPanel("Buttons", "buttons", [
        createElement("div", {
            className: "demo-row",
            children: [
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
                toggleButton,
                Button({
                    text: "Disabled action",
                    variant: "secondary",
                    disabled: true
                })
            ]
        })
    ]);
}

function IconButtonsDemo(): CompositionChild[] {
    let favoriteButton!: ReturnType<typeof IconButton>;

    const favoriteIcon = createIcon(
        "m12 21-1.4-1.3C5.4 15 2 11.9 2 8a5 5 0 0 1 8.6-3.5L12 5.9l1.4-1.4A5 5 0 0 1 22 8c0 3.9-3.4 7-8.6 11.7L12 21Z"
    );

    favoriteButton = IconButton({
        label: "Add to favorites",
        icon: favoriteIcon,
        variant: "secondary",
        pressed: false,
        onPress() {
            const pressed = favoriteButton.getPressed() !== true;
            const label = pressed ? "Remove from favorites" : "Add to favorites";

            favoriteButton.setPressed(pressed);
            favoriteButton.setLabel(label);
            favoriteButton.setTitle(label);
            announce(`Favorite is ${pressed ? "selected" : "not selected"}.`);
        }
    });

    return DemoPanel("Icon Buttons", "icon-buttons", [
        createElement("div", {
            className: "demo-row",
            children: [
                IconButton({
                    label: "Save",
                    icon: createIcon("M5 3h12l2 2v16H5V3Zm2 2v14h10V7.8L16.2 5H15v5H8V5H7Zm3 0v3h3V5h-3Zm-1 9h6v2H9v-2Z"),
                    variant: "secondary",
                    onPress: () => announce("Save icon button pressed.")
                }),
                favoriteButton,
                IconButton({
                    label: "Unavailable action",
                    icon: createIcon("M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 3a7 7 0 0 1 5.3 11.6L7.4 6.7A7 7 0 0 1 12 5Zm0 14a7 7 0 0 1-5.3-11.6l9.9 9.9A7 7 0 0 1 12 19Z"),
                    variant: "secondary",
                    disabled: true
                })
            ]
        })
    ]);
}

function LinksDemo(): CompositionChild[] {
    return DemoPanel("Links", "links", [
        createElement("div", {
            className: "demo-row",
            children: [
                Link({
                    text: "Documentation link",
                    href: "/docs",
                    onNavigate(event) {
                        event.preventDefault();
                        announce("Documentation link navigation intercepted for playground.");
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
            ]
        })
    ]);
}

function DisclosuresDemo(): CompositionChild[] {
    return DemoPanel("Disclosures", "disclosures", [
        Disclosure({
            trigger: "Project details",
            panel: createElement("p", {
                text: "This panel is controlled by the disclosure trigger. It should toggle aria-expanded, aria-controls, and the hidden state."
            }),
            defaultOpen: false,
            onOpenChange(open) {
                announce(`Disclosure is ${open ? "open" : "closed"}.`);
            }
        })
    ]);
}

function ChecksDemo(): CompositionChild[] {
    return DemoPanel("Manual checks later", "checks", [
        createElement("ul", {
            className: "check-list",
            children: [
                createElement("li", { text: "Keyboard focus order is predictable." }),
                createElement("li", { text: "Focus indicator is visible in light and dark themes." }),
                createElement("li", { text: "Disabled controls cannot be activated." }),
                createElement("li", { text: "Touch targets feel usable on mobile." }),
                createElement("li", { text: "Screen readers announce names, roles, and states." })
            ]
        })
    ]);
}

const page = createPage({
    title: "Accessible First Playground",
    mainId: "main",
    navigationLabel: "Playground sections"
});

page.element.classList.add("playground-shell");
page.main.classList.add("playground-main");

page.header(...HeaderDemo());
page.navigation(...NavigationDemo());
page.section(...ButtonsDemo());
page.section(...IconButtonsDemo());
page.section(...LinksDemo());
page.section(...DisclosuresDemo());
page.section(...ChecksDemo());

mount(page, "#app");
page.inspect();
