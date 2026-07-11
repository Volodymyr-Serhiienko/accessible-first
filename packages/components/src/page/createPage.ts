import {
    append,
    collectDestroyers,
    createElement,
    type CompositionChild
} from "../composition";
import { inspectPage } from "./diagnostics";
import type { Page, PageDiagnosticsOptions, PageDiagnosticsReport, PageOptions } from "./types";

/**
 * Instantiates and manages a top-level structured semantic Page component.
 * Automatically configures basic document metadata titles, initializes an accessible 
 * bypass mechanism ("Skip to content link"), establishes the main landscape segment, and 
 * exposes fluent layout manipulation utilities that collect and coordinate sub-component 
 * lifecycles for clean runtime destruction sequence routing.
 *
 * @param options - Configuration behavior adjusting landmark configurations, bypass values, or views titles.
 * @returns A fluent Page controller interface detailing structured landmark insertion and validation methods.
 */
export function createPage(options: PageOptions = {}): Page {
    const root = createElement("div", {
        attributes: {
            "data-af-page": ""
        }
    });

    const main = createElement("main", {
        id: options.mainId ?? "main",
        attributes: {
            "data-af-page-main": ""
        }
    });

    let destroyed = false;
    let headerElement: HTMLElement | null = null;
    let navigationElement: HTMLElement | null = null;
    let footerElement: HTMLElement | null = null;

    const destroyers: Array<() => void> = [];

    if (options.title !== undefined) {
        document.title = options.title;
    }

    if (options.skipLink !== false) {
        const skipText = typeof options.skipLink === "string"
            ? options.skipLink
            : "Skip to content";

        root.append(createElement("a", {
            className: "skip-link",
            text: skipText,
            attributes: {
                href: `#${main.id}`
            }
        }));
    }

    root.append(main);

    function appendTracked(parent: HTMLElement, children: CompositionChild[]): void {
        destroyers.push(...collectDestroyers(children));
        append(parent, ...children);
    }

    function ensureHeader(): HTMLElement {
        if (!headerElement) {
            headerElement = createElement("header", {
                attributes: {
                    "data-af-page-header": ""
                }
            });

            root.insertBefore(headerElement, main);
        }

        return headerElement;
    }

    function ensureNavigation(): HTMLElement {
        if (!navigationElement) {
            navigationElement = createElement("nav", {
                attributes: {
                    "data-af-page-navigation": "",
                    "aria-label": options.navigationLabel ?? "Primary"
                }
            });

            root.insertBefore(navigationElement, main);
        }

        return navigationElement;
    }

    function ensureFooter(): HTMLElement {
        if (!footerElement) {
            footerElement = createElement("footer", {
                attributes: {
                    "data-af-page-footer": ""
                }
            });

            root.append(footerElement);
        }

        return footerElement;
    }

    const page: Page = {
        element: root,
        main,

        header(...children: CompositionChild[]): Page {
            const region = ensureHeader();
            region.replaceChildren();
            appendTracked(region, children);
            return page;
        },

        navigation(...children: CompositionChild[]): Page {
            const region = ensureNavigation();
            region.replaceChildren();
            appendTracked(region, children);
            return page;
        },

        section(section: CompositionChild): Page {
            appendTracked(main, [section]);
            return page;
        },

        footer(...children: CompositionChild[]): Page {
            const region = ensureFooter();
            region.replaceChildren();
            appendTracked(region, children);
            return page;
        },

        appendToMain(...children: CompositionChild[]): Page {
            appendTracked(main, children);
            return page;
        },

        inspect(inspectOptions: PageDiagnosticsOptions = {}): PageDiagnosticsReport {
            return inspectPage(root, inspectOptions);
        },

        destroy(): void {
            if (destroyed) {
                return;
            }

            destroyed = true;

            for (const destroy of [...destroyers].reverse()) {
                destroy();
            }

            destroyers.length = 0;
            root.remove();
        },

        isDestroyed(): boolean {
            return destroyed;
        }
    };

    return page;
}
