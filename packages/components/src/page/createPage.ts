import {
    createContentSlot,
    createElement,
    type ContentSlot,
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
import { runCleanups } from "../../../core/src/events";
import { focusProgrammatically } from "../../../core/src/focus";
import {
    accessibleFirstEnglishMessages,
    getLocaleText
} from "../localization";
import { createLocaleSubscription } from "../localization/createLocaleSubscription";
import {
    applyResolvedTheme,
    getSystemTheme,
    type ResolvedTheme
} from "../theme/theme";
import type {
    Page,
    PageDiagnosticsOptions,
    PageDiagnosticsReport,
    PageOptions,
    PageUpdateOptions
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

    if (typeof window.matchMedia !== "function") {
        applyTheme("light");
        return restorePageTheme;
    }
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    let active = true;

    function syncSystemTheme(): void {
        if (active) applyTheme(getSystemTheme());
    }

    syncSystemTheme();
    try {
        if (typeof media.addEventListener === "function") media.addEventListener("change", syncSystemTheme);
        else media.addListener(syncSystemTheme);
    } catch (error) { restorePageTheme(); throw error; }

    return () => {
        active = false;
        runCleanups([() => {
            if (typeof media.removeEventListener === "function") media.removeEventListener("change", syncSystemTheme);
            else media.removeListener(syncSystemTheme);
        }, restorePageTheme]);
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
            "data-af-page-main": "",
            tabindex: "-1"
        }
    });

    let destroyed = false;
    let revision = 0;
    let headerElement: HTMLElement | null = null;
    let navigationElement: HTMLElement | null = null;
    let footerElement: HTMLElement | null = null;
    let skipLinkElement: HTMLAnchorElement | null = null;
    let metadataController: DocumentMetadataController | null = null;
    let currentTitle = options.title;
    let currentSkipLink = options.skipLink;
    let currentSkipLinkTargetId = options.skipLinkTargetId;
    let currentNavigationLabel = options.navigationLabel;
    let locale = options.locale ?? null;
    const localeSubscription = createLocaleSubscription(syncLocalizedText);
    const pageDestroyers: Array<() => void> = [localeSubscription.destroy];
    let headerSlot: ContentSlot | null = null;
    let navigationSlot: ContentSlot | null = null;
    const mainSlot = createContentSlot(main);
    let footerSlot: ContentSlot | null = null;
    const originalTitle = document.title;
    let ownsTitle = false;

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

    function getSkipLinkText(): string {
        return typeof currentSkipLink === "string"
            ? currentSkipLink
            : getLocaleText(
                locale,
                "page.skipLinkText",
                accessibleFirstEnglishMessages["page.skipLinkText"]
            );
    }

    function getNavigationLabel(): string {
        return currentNavigationLabel ?? getLocaleText(
            locale,
            "page.navigationLabel",
            accessibleFirstEnglishMessages["page.navigationLabel"]
        );
    }

    function ensureSkipLinkElement(): HTMLAnchorElement {
        if (skipLinkElement) return skipLinkElement;

        skipLinkElement = createElement("a", {
            className: "skip-link",
            attributes: {
                "data-af-skip-link": ""
            }
        });
        root.insertBefore(skipLinkElement, root.firstChild);

        return skipLinkElement;
    }

    function syncSkipLink(): void {
        if (destroyed) return;
        const current = revision;
        const text = currentSkipLink === false ? null : getSkipLinkText();
        if (destroyed || current !== revision) return;
        if (currentSkipLink === false) {
            skipLinkElement?.remove();
            skipLinkElement = null;
            return;
        }

        const link = ensureSkipLinkElement();

        link.textContent = text;
        link.setAttribute("href", `#${currentSkipLinkTargetId ?? main.id}`);
    }

    function syncLocalizedText(): void {
        if (destroyed) return;
        const current = revision;
        syncSkipLink();
        if (destroyed || current !== revision) return;
        if (navigationElement) {
            const label = getNavigationLabel();
            if (!destroyed && current === revision) navigationElement.setAttribute("aria-label", label);
        }
    }

    function disposeDestroyers(destroyers: Array<() => void>): void {
        runCleanups(destroyers.splice(0).reverse());
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
            headerSlot = createContentSlot(headerElement);
        }

        return headerElement;
    }

    function ensureNavigation(): HTMLElement {
        if (!navigationElement) {
            navigationElement = createElement("nav", {
                attributes: {
                    "data-af-page-navigation": ""
                }
            });

            root.insertBefore(navigationElement, main);
            navigationSlot = createContentSlot(navigationElement);
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
            footerSlot = createContentSlot(footerElement);
        }

        return footerElement;
    }

    const page: Page = {
        element: root,
        main,

        header(...children: CompositionChild[]): Page {
            if (destroyed) return page;
            ensureHeader();
            headerSlot!.set(children);
            return page;
        },

        navigation(...children: CompositionChild[]): Page {
            if (destroyed) return page;
            ensureNavigation();
            runCleanups([() => navigationSlot!.set(children), syncLocalizedText]);
            return page;
        },

        section(section: CompositionChild): Page {
            if (!destroyed) mainSlot.append([section]);
            return page;
        },

        setMainContent(...children: CompositionChild[]): Page {
            if (!destroyed) mainSlot.set(children);
            return page;
        },

        focusMain(options: FocusOptions = {}): Page {
            if (!destroyed) moveFocusToMain(options);

            return page;
        },

        update(nextOptions: PageUpdateOptions): Page {
            if (destroyed) return page;
            const current = ++revision;
            if (nextOptions.title !== undefined) {
                currentTitle = nextOptions.title;

                if (metadataController) {
                    ensureMetadataController().update({ title: currentTitle });
                } else {
                    ownsTitle = true;
                    document.title = currentTitle;
                }
            }

            if (nextOptions.skipLink !== undefined) currentSkipLink = nextOptions.skipLink;
            if (nextOptions.skipLinkTargetId !== undefined) currentSkipLinkTargetId = nextOptions.skipLinkTargetId;
            if (nextOptions.navigationLabel !== undefined) currentNavigationLabel = nextOptions.navigationLabel;

            if ("locale" in nextOptions) {
                locale = nextOptions.locale ?? null;
            }
            runCleanups([
                () => { if ("locale" in nextOptions) localeSubscription.replace(locale); },
                () => { if (!destroyed && current === revision && nextOptions.metadata !== undefined) ensureMetadataController().update(nextOptions.metadata); },
                () => { if (!destroyed && current === revision) syncLocalizedText(); }
            ]);

            return page;
        },

        updateMetadata(metadataOptions: DocumentMetadataUpdateOptions): Page {
            if (!destroyed) { revision += 1; ensureMetadataController().update(metadataOptions); }

            return page;
        },

        footer(...children: CompositionChild[]): Page {
            if (destroyed) return page;
            ensureFooter();
            footerSlot!.set(children);
            return page;
        },

        appendToMain(...children: CompositionChild[]): Page {
            if (!destroyed) mainSlot.append(children);
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
            revision += 1;

            try {
                runCleanups([() => footerSlot?.dispose(), mainSlot.dispose,
                    () => navigationSlot?.dispose(), () => headerSlot?.dispose(), () => disposeDestroyers(pageDestroyers)]);
            } finally { root.remove(); }
        },

        isDestroyed(): boolean {
            return destroyed;
        }
    };

    try {
        pageDestroyers.push(setupPageTheme(options), () => { if (ownsTitle) document.title = originalTitle; });
        const metadataOptions = getPageMetadataOptions(options);
        if (metadataOptions) registerMetadataController(createDocumentMetadata(metadataOptions));
        else if (options.title !== undefined) { ownsTitle = true; document.title = options.title; }
        root.append(main);
        localeSubscription.replace(locale);
        syncLocalizedText();
        return page;
    } catch (error) {
        try { page.destroy(); } catch { /* Preserve the construction failure. */ }
        throw error;
    }
}
