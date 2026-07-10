import {
    createButton,
    createDisclosure,
    createIconButton,
    createLink
} from "../packages/components/src";

import "../packages/components/src/styles/index.css";

function queryRequired<T extends HTMLElement>(selector: string): T {
    const element = document.querySelector<T>(selector);

    if (!element) {
        throw new Error(`Missing playground element: ${selector}`);
    }

    return element;
}

const app = queryRequired<HTMLDivElement>("#app");

app.innerHTML = `
<div class="playground-shell">
    <header class="playground-header">
        <div>
            <h1 class="playground-title">Accessible First Playground</h1>
            <p class="status" id="status" role="status" aria-live="polite">
                Ready for component checks.
            </p>
        </div>

        <button id="theme-toggle" type="button">Dark theme</button>
    </header>

    <nav class="playground-nav" aria-label="Playground sections">
        <a href="#buttons" data-playground-link>Buttons</a>
        <a href="#icon-buttons" data-playground-link>Icon Buttons</a>
        <a href="#links" data-playground-link>Links</a>
        <a href="#disclosures" data-playground-link>Disclosures</a>
        <a href="#checks" data-playground-link>Checks</a>
    </nav>

    <main class="playground-main" id="main">
        <section class="demo-panel" id="buttons" aria-labelledby="buttons-title">
            <h2 id="buttons-title">Buttons</h2>
            <div class="demo-row">
                <button id="primary-action" type="button">Primary action</button>
                <button id="secondary-action" type="button">Secondary action</button>
                <button id="toggle-action" type="button">Toggle option</button>
                <button id="disabled-action" type="button">Disabled action</button>
            </div>
        </section>

        <section class="demo-panel" id="icon-buttons" aria-labelledby="icon-buttons-title">
            <h2 id="icon-buttons-title">Icon Buttons</h2>
            <div class="demo-row">
                <button id="save-icon" type="button">
                    <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                        <path fill="currentColor" d="M5 3h12l2 2v16H5V3Zm2 2v14h10V7.8L16.2 5H15v5H8V5H7Zm3 0v3h3V5h-3Zm-1 9h6v2H9v-2Z"/>
                    </svg>
                </button>

                <button id="favorite-icon" type="button">
                    <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                        <path fill="currentColor" d="m12 21-1.4-1.3C5.4 15 2 11.9 2 8a5 5 0 0 1 8.6-3.5L12 5.9l1.4-1.4A5 5 0 0 1 22 8c0 3.9-3.4 7-8.6 11.7L12 21Z"/>
                    </svg>
                </button>

                <button id="disabled-icon" type="button">
                    <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                        <path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 3a7 7 0 0 1 5.3 11.6L7.4 6.7A7 7 0 0 1 12 5Zm0 14a7 7 0 0 1-5.3-11.6l9.9 9.9A7 7 0 0 1 12 19Z"/>
                    </svg>
                </button>
            </div>
        </section>

        <section class="demo-panel" id="links" aria-labelledby="links-title">
            <h2 id="links-title">Links</h2>
            <div class="demo-row">
                <a id="docs-link" href="/docs">Documentation link</a>
                <a id="current-link" href="#links">Current section</a>
                <a id="external-link" href="https://example.com">External link</a>
                <a id="disabled-link" href="/disabled">Disabled link</a>
            </div>
        </section>

        <section class="demo-panel" id="disclosures" aria-labelledby="disclosures-title">
            <h2 id="disclosures-title">Disclosures</h2>

            <div id="project-disclosure">
                <button id="project-disclosure-trigger" type="button">
                    Project details
                </button>

                <div id="project-disclosure-panel">
                    <p>
                        This panel is controlled by the disclosure trigger. It should toggle
                        aria-expanded, aria-controls, and the hidden state.
                    </p>
                </div>
            </div>
        </section>

        <section class="demo-panel" id="checks" aria-labelledby="checks-title">
            <h2 id="checks-title">Manual checks later</h2>
            <ul class="check-list">
                <li>Keyboard focus order is predictable.</li>
                <li>Focus indicator is visible in light and dark themes.</li>
                <li>Disabled controls cannot be activated.</li>
                <li>Touch targets feel usable on mobile.</li>
                <li>Screen readers announce names, roles, and states.</li>
            </ul>
        </section>
    </main>
</div>
`;

const status = queryRequired<HTMLElement>("#status");

function announce(message: string): void {
    status.textContent = message;
}

const themeToggleElement = queryRequired<HTMLButtonElement>("#theme-toggle");

const themeToggle = createButton(themeToggleElement, {
    variant: "secondary",
    pressed: false,
    onPress() {
        const nextTheme = document.documentElement.dataset.afTheme === "dark" ? "light" : "dark";
        const isDark = nextTheme === "dark";

        if (isDark) {
            document.documentElement.dataset.afTheme = "dark";
        } else {
            delete document.documentElement.dataset.afTheme;
        }

        themeToggle.setPressed(isDark);
        themeToggleElement.textContent = isDark ? "Light theme" : "Dark theme";
        announce(`${isDark ? "Dark" : "Light"} theme enabled.`);
    }
});

createButton(queryRequired<HTMLButtonElement>("#primary-action"), {
    variant: "primary",
    onPress: () => announce("Primary button pressed.")
});

createButton(queryRequired<HTMLButtonElement>("#secondary-action"), {
    variant: "secondary",
    onPress: () => announce("Secondary button pressed.")
});

const toggleButton = createButton(queryRequired<HTMLButtonElement>("#toggle-action"), {
    variant: "secondary",
    pressed: false,
    onPress() {
        const pressed = toggleButton.getPressed() !== true;

        toggleButton.setPressed(pressed);
        announce(`Toggle button is ${pressed ? "pressed" : "not pressed"}.`);
    }
});

createButton(queryRequired<HTMLButtonElement>("#disabled-action"), {
    variant: "secondary",
    disabled: true
});

createIconButton(queryRequired<HTMLButtonElement>("#save-icon"), {
    label: "Save",
    variant: "secondary",
    onPress: () => announce("Save icon button pressed.")
});

const favoriteButton = createIconButton(queryRequired<HTMLButtonElement>("#favorite-icon"), {
    label: "Add to favorites",
    variant: "secondary",
    pressed: false,
    onPress() {
        const pressed = favoriteButton.getPressed() !== true;

        favoriteButton.setPressed(pressed);
        favoriteButton.setLabel(pressed ? "Remove from favorites" : "Add to favorites");
        announce(`Favorite is ${pressed ? "selected" : "not selected"}.`);
    }
});

createIconButton(queryRequired<HTMLButtonElement>("#disabled-icon"), {
    label: "Unavailable action",
    variant: "secondary",
    disabled: true
});

document.querySelectorAll<HTMLElement>("[data-playground-link]").forEach((element) => {
    createLink(element);
});

createLink(queryRequired<HTMLAnchorElement>("#docs-link"), {
    onNavigate(event) {
        event.preventDefault();
        announce("Documentation link navigation intercepted for playground.");
    }
});

createLink(queryRequired<HTMLAnchorElement>("#current-link"), {
    current: "page"
});

createLink(queryRequired<HTMLAnchorElement>("#external-link"), {
    external: true,
    onNavigate(event) {
        event.preventDefault();
        announce("External link prepared with safe target and rel attributes.");
    }
});

createLink(queryRequired<HTMLAnchorElement>("#disabled-link"), {
    disabled: true
});

createDisclosure(queryRequired<HTMLElement>("#project-disclosure"), {
    trigger: queryRequired<HTMLButtonElement>("#project-disclosure-trigger"),
    panel: queryRequired<HTMLElement>("#project-disclosure-panel"),
    defaultOpen: false,
    onOpenChange(open) {
        announce(`Disclosure is ${open ? "open" : "closed"}.`);
    }
});
