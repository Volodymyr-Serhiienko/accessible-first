import {
    append,
    collectDestroyers,
    createElement,
    type CompositionChild
} from "../composition";
import { inspectPage } from "./diagnostics";
import {
    createDocumentMetadata,
    DEFAULT_DOCUMENT_VIEWPORT,
    type DocumentMetadataController,
    type DocumentMetadataOptions,
    type DocumentMetadataUpdateOptions
} from "../document-metadata";
import { restoreAttribute } from "../../../core/src/dom";
import { focusProgrammatically } from "../../../core/src/focus";
import {
    accessibleFirstEnglishMessages,
    getLocaleText
} from "../localization";
import {
    applyResolvedTheme,
    getSystemTheme,
    type ResolvedTheme
} from "../theme/theme";
import type {
    Page,
    PageDiagnosticsOptions,
    PageDiagnosticsReport,
    PageOptions
} from "./types";

function applyTheme(theme: ResolvedTheme): void {
    applyResolvedTheme(theme);
}

function setupPageTheme(options: PageOptions): () => void {
    const theme = options.theme ?? "system";
    const originalTheme = document.documentElement.getAttribute("data-af-theme");

    function restorePageTheme(): void {
        restoreAttribute(document.documentElement, "data-af-theme", originalTheme);
    }

    if (theme === "light" || theme === "dark") {
        applyTheme(theme);
        return restorePageTheme;
    }

    const media = window.matchMedia("(prefers-color-scheme: dark)");

    function syncSystemTheme(): void {
        applyTheme(getSystemTheme());
    }

    syncSystemTheme();
    media.addEventListener("change", syncSystemTheme);

    return () => {
        media.removeEventListener("change", syncSystemTheme);
        restorePageTheme();
    };
}

function getPageMetadataOptions(options: PageOptions): DocumentMetadataOptions | null {
    if (options.metadata === false) return null;
    if (options.title === undefined && options.metadata === undefined) return null;

    const metadataOptions: DocumentMetadataOptions = {
        ...(options.metadata ?? {})
    };

    if (options.title !== undefined && metadataOptions.title === undefined) {
        metadataOptions.title = options.title;
    }

    if (metadataOptions.viewport === undefined) {
        metadataOptions.viewport = DEFAULT_DOCUMENT_VIEWPORT;
    }

    return metadataOptions;
}

/**
 * Creates a semantic page controller.
 *
 * Page owns the root container, main landmark, optional skip link, document title,
 * theme synchronization, landmark slots, lifecycle cleanup, and diagnostics.
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
    let skipLinkElement: HTMLAnchorElement | null = null;
    let metadataController: DocumentMetadataController | null = null;
    let locale = options.locale ?? null;

    const pageDestroyers: Array<() => void> = [setupPageTheme(options)];
    const headerDestroyers: Array<() => void> = [];
    const navigationDestroyers: Array<() => void> = [];
    const mainDestroyers: Array<() => void> = [];
    const footerDestroyers: Array<() => void> = [];

    function registerMetadataController(controller: DocumentMetadataController): void {
        metadataController = controller;

        pageDestroyers.push(() => {
            controller.destroy();

            if (metadataController === controller) {
                metadataController = null;
            }
        });
    }

    function ensureMetadataController(): DocumentMetadataController {
        if (metadataController) {
            return metadataController;
        }

        const controller = createDocumentMetadata();

        registerMetadataController(controller);

        return controller;
    }

    const metadataOptions = getPageMetadataOptions(options);

    if (metadataOptions) {
        registerMetadataController(createDocumentMetadata(metadataOptions));
    } else if (options.title !== undefined) {
        const originalTitle = document.title;

        document.title = options.title;
        pageDestroyers.push(() => {
            document.title = originalTitle;
        });
    }

    function getSkipLinkText(): string {
        return typeof options.skipLink === "string"
            ? options.skipLink
            : getLocaleText(
                locale,
                "page.skipLinkText",
                accessibleFirstEnglishMessages["page.skipLinkText"]
            );
    }

    function getNavigationLabel(): string {
        return options.navigationLabel ?? getLocaleText(
            locale,
            "page.navigationLabel",
            accessibleFirstEnglishMessages["page.navigationLabel"]
        );
    }

    function syncLocalizedText(): void {
        if (skipLinkElement) {
            skipLinkElement.textContent = getSkipLinkText();
        }

        if (navigationElement) {
            navigationElement.setAttribute("aria-label", getNavigationLabel());
        }
    }

    if (locale?.subscribe) {
        pageDestroyers.push(locale.subscribe(syncLocalizedText));
    }

    if (options.skipLink !== false) {
        skipLinkElement = createElement("a", {
            className: "skip-link",
            text: getSkipLinkText(),
            attributes: {
                href: `#${options.skipLinkTargetId ?? main.id}`,
                "data-af-skip-link": ""
            }
        });

        root.append(skipLinkElement);
    }

    root.append(main);

    function disposeDestroyers(destroyers: Array<() => void>): void {
        for (const destroy of [...destroyers].reverse()) {
            destroy();
        }

        destroyers.length = 0;
    }

    function appendTracked(
        parent: HTMLElement,
        children: CompositionChild[],
        destroyers: Array<() => void>
    ): void {
        destroyers.push(...collectDestroyers(children));
        append(parent, ...children);
    }

    function moveFocusToMain(options: FocusOptions = {}): void {
        focusProgrammatically(main, options);
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
                    "aria-label": getNavigationLabel()
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

            disposeDestroyers(headerDestroyers);
            region.replaceChildren();
            appendTracked(region, children, headerDestroyers);

            return page;
        },

        navigation(...children: CompositionChild[]): Page {
            const region = ensureNavigation();

            disposeDestroyers(navigationDestroyers);
            region.replaceChildren();
            appendTracked(region, children, navigationDestroyers);

            return page;
        },

        section(section: CompositionChild): Page {
            appendTracked(main, [section], mainDestroyers);
            return page;
        },

        setMainContent(...children: CompositionChild[]): Page {
            disposeDestroyers(mainDestroyers);
            main.replaceChildren();
            appendTracked(main, children, mainDestroyers);

            return page;
        },

        focusMain(options: FocusOptions = {}): Page {
            moveFocusToMain(options);

            return page;
        },

        updateMetadata(metadataOptions: DocumentMetadataUpdateOptions): Page {
            ensureMetadataController().update(metadataOptions);

            return page;
        },

        footer(...children: CompositionChild[]): Page {
            const region = ensureFooter();

            disposeDestroyers(footerDestroyers);
            region.replaceChildren();
            appendTracked(region, children, footerDestroyers);

            return page;
        },

        appendToMain(...children: CompositionChild[]): Page {
            appendTracked(main, children, mainDestroyers);
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

            disposeDestroyers(footerDestroyers);
            disposeDestroyers(mainDestroyers);
            disposeDestroyers(navigationDestroyers);
            disposeDestroyers(headerDestroyers);
            disposeDestroyers(pageDestroyers);
            root.remove();
        },

        isDestroyed(): boolean {
            return destroyed;
        }
    };

    return page;
}
