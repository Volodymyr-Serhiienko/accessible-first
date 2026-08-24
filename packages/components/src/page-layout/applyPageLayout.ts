import { createAttributeSnapshot } from "../../../core/src/dom";
import type { Page } from "../page";

/**
 * Page layout mode applied to a createPage() instance.
 */
export type PageLayoutMode = "app" | "document";

/**
 * Page chrome positioning mode for page header, navigation, and outlet helper regions.
 */
export type PageLayoutChromeMode = "normal" | "sticky" | "fixed" | "reveal";

/**
 * Page chrome options for header, navigation, and before-outlet behavior.
 */
export interface PageLayoutChromeOptions {
    header?: PageLayoutChromeMode;
    navigation?: PageLayoutChromeMode;
    beforeOutlet?: PageLayoutChromeMode;
    topOffset?: string;
    zIndex?: string;
}

/**
 * Options for applyPageLayout().
 */
export interface PageLayoutOptions {
    mode?: PageLayoutMode;
    contained?: boolean;
    borders?: boolean;
    maxWidth?: string;
    gutter?: string;
    mainGap?: string;
    mainPaddingBlock?: string;
    chrome?: PageLayoutChromeOptions | PageLayoutChromeMode;
}

/**
 * Options accepted by PageLayoutController.update().
 */
export interface PageLayoutUpdateOptions extends Partial<PageLayoutOptions> {}

/**
 * Controller returned by applyPageLayout().
 */
export interface PageLayoutController {
    readonly page: Page;
    readonly element: HTMLElement;
    update(options: PageLayoutUpdateOptions): void;
    destroy(): void;
    isDestroyed(): boolean;
}

interface ResolvedPageLayoutChromeOptions {
    header: PageLayoutChromeMode;
    navigation: PageLayoutChromeMode;
    beforeOutlet: PageLayoutChromeMode;
    topOffset: string | null;
    zIndex: string | null;
}

interface StyleSnapshotValue {
    value: string;
    priority: string;
}

function createStyleSnapshot() {
    const values = new Map<HTMLElement, Map<string, StyleSnapshotValue>>();

    function remember(element: HTMLElement, property: string): void {
        let elementValues = values.get(element);

        if (!elementValues) {
            elementValues = new Map();
            values.set(element, elementValues);
        }

        if (!elementValues.has(property)) {
            elementValues.set(property, {
                value: element.style.getPropertyValue(property),
                priority: element.style.getPropertyPriority(property)
            });
        }
    }

    function restore(): void {
        for (const [element, elementValues] of values) {
            for (const [property, snapshot] of elementValues) {
                if (snapshot.value) {
                    element.style.setProperty(property, snapshot.value, snapshot.priority);
                } else {
                    element.style.removeProperty(property);
                }
            }
        }

        values.clear();
    }

    return {
        remember,
        restore
    };
}

function setStyleProperty(
    snapshot: ReturnType<typeof createStyleSnapshot>,
    element: HTMLElement,
    property: string,
    value: string | null
): void {
    snapshot.remember(element, property);

    if (value === null) {
        element.style.removeProperty(property);
        return;
    }

    element.style.setProperty(property, value);
}

function normalizeChromeOptions(
    chrome: PageLayoutOptions["chrome"]
): ResolvedPageLayoutChromeOptions {
    if (typeof chrome === "string") {
        return {
            header: chrome,
            navigation: chrome,
            beforeOutlet: chrome,
            topOffset: null,
            zIndex: null
        };
    }

    return {
        header: chrome?.header ?? "normal",
        navigation: chrome?.navigation ?? "normal",
        beforeOutlet: chrome?.beforeOutlet ?? "normal",
        topOffset: chrome?.topOffset ?? null,
        zIndex: chrome?.zIndex ?? null
    };
}

function isPinnedChrome(mode: PageLayoutChromeMode): boolean {
    return mode === "sticky" || mode === "fixed" || mode === "reveal";
}

function isVisiblePinnedChrome(mode: PageLayoutChromeMode, chromeVisible: boolean): boolean {
    if (mode === "reveal") return chromeVisible;

    return isPinnedChrome(mode);
}

function hasRevealChrome(chrome: ResolvedPageLayoutChromeOptions): boolean {
    return chrome.header === "reveal"
        || chrome.navigation === "reveal"
        || chrome.beforeOutlet === "reveal";
}

function getBlockSize(element: HTMLElement | null): number {
    if (!element || element.hidden) return 0;

    return Math.max(0, element.getBoundingClientRect().height);
}

function formatPixels(value: number): string {
    return `${Math.round(value * 100) / 100}px`;
}

/**
 * Applies reusable page layout behavior to a createPage() instance.
 */
export function applyPageLayout(
    page: Page,
    options: PageLayoutOptions = {}
): PageLayoutController {
    const attributes = createAttributeSnapshot();
    const styles = createStyleSnapshot();
    const ownerWindow = page.element.ownerDocument.defaultView ?? window;

    let resizeObserver: ResizeObserver | null = null;
    let mutationObserver: MutationObserver | null = null;
    let removeScrollListener: (() => void) | null = null;
    let removeRevealFocusListener: (() => void) | null = null;
    let scrollFrameId: number | null = null;
    let lastScrollY = ownerWindow.scrollY;
    let chromeVisible = true;
    let mode: PageLayoutMode = options.mode ?? "app";
    let contained = options.contained ?? true;
    let borders = options.borders ?? true;
    let maxWidth = options.maxWidth ?? null;
    let gutter = options.gutter ?? null;
    let mainGap = options.mainGap ?? null;
    let mainPaddingBlock = options.mainPaddingBlock ?? null;
    let chrome = normalizeChromeOptions(options.chrome);
    let destroyed = false;

    attributes.remember(page.element, "data-af-page-layout");
    attributes.remember(page.element, "data-af-page-contained");
    attributes.remember(page.element, "data-af-page-borders");
    attributes.remember(page.element, "data-af-page-header-mode");
    attributes.remember(page.element, "data-af-page-navigation-mode");
    attributes.remember(page.element, "data-af-page-before-outlet-mode");
    attributes.remember(page.element, "data-af-page-chrome-visible");

    function getHeaderElement(): HTMLElement | null {
        return page.element.querySelector<HTMLElement>("[data-af-page-header]");
    }

    function getNavigationElement(): HTMLElement | null {
        return page.element.querySelector<HTMLElement>("[data-af-page-navigation]");
    }

    function getBeforeOutletElement(): HTMLElement | null {
        return page.element.querySelector<HTMLElement>("[data-af-app-shell-before-outlet]");
    }

    function containsTarget(element: HTMLElement | null, target: EventTarget | null): boolean {
        return !!element && target instanceof Node && element.contains(target);
    }

    function isRevealChromeTarget(target: EventTarget | null): boolean {
        return (chrome.header === "reveal" && containsTarget(getHeaderElement(), target))
            || (chrome.navigation === "reveal" && containsTarget(getNavigationElement(), target))
            || (chrome.beforeOutlet === "reveal" && containsTarget(getBeforeOutletElement(), target));
    }

    function syncChromeVisibility(): void {
        page.element.setAttribute("data-af-page-chrome-visible", String(chromeVisible || !hasRevealChrome(chrome)));
    }

    function setChromeVisible(nextVisible: boolean): void {
        if (chromeVisible === nextVisible) return;

        chromeVisible = nextVisible;
        syncChromeVisibility();
        syncChromeMetrics();
    }

    function syncChromeMetrics(): void {
        if (destroyed) return;

        const headerSize = getBlockSize(getHeaderElement());
        const navigationSize = getBlockSize(getNavigationElement());
        const beforeOutletSize = getBlockSize(getBeforeOutletElement());

        const effectiveChromeVisible = chromeVisible || !hasRevealChrome(chrome);
        const pinnedHeaderSize = isVisiblePinnedChrome(chrome.header, effectiveChromeVisible) ? headerSize : 0;
        const pinnedNavigationSize = isVisiblePinnedChrome(chrome.navigation, effectiveChromeVisible) ? navigationSize : 0;
        const pinnedBeforeOutletSize = isVisiblePinnedChrome(chrome.beforeOutlet, effectiveChromeVisible) ? beforeOutletSize : 0;

        const navigationOffset = pinnedHeaderSize;
        const beforeOutletOffset = pinnedHeaderSize + pinnedNavigationSize;
        const scrollMargin = beforeOutletOffset + pinnedBeforeOutletSize;
        const fixedChromeSize =
            (chrome.header === "fixed" ? headerSize : 0)
            + (chrome.navigation === "fixed" ? navigationSize : 0)
            + (chrome.beforeOutlet === "fixed" ? beforeOutletSize : 0);

        setStyleProperty(styles, page.element, "--af-page-header-block-size", formatPixels(headerSize));
        setStyleProperty(styles, page.element, "--af-page-navigation-block-size", formatPixels(navigationSize));
        setStyleProperty(styles, page.element, "--af-page-before-outlet-block-size", formatPixels(beforeOutletSize));
        setStyleProperty(styles, page.element, "--af-page-navigation-offset-block-size", formatPixels(navigationOffset));
        setStyleProperty(styles, page.element, "--af-page-before-outlet-offset-block-size", formatPixels(beforeOutletOffset));
        setStyleProperty(styles, page.element, "--af-page-scroll-margin-block-size", formatPixels(scrollMargin));
        setStyleProperty(styles, page.element, "--af-page-fixed-chrome-block-size", formatPixels(fixedChromeSize));
    }

    function observeChromeElement(element: HTMLElement | null): void {
        if (!element || !resizeObserver) return;

        resizeObserver.observe(element);
    }

    function refreshChromeObservers(): void {
        if (destroyed) return;

        resizeObserver?.disconnect();
        resizeObserver = null;

        if (ownerWindow.ResizeObserver) {
            resizeObserver = new ownerWindow.ResizeObserver(() => {
                syncChromeMetrics();
            });

            observeChromeElement(getHeaderElement());
            observeChromeElement(getNavigationElement());
            observeChromeElement(getBeforeOutletElement());
        }

        syncChromeMetrics();
    }

    function setupMutationObserver(): void {
        if (!ownerWindow.MutationObserver) return;

        mutationObserver = new ownerWindow.MutationObserver(() => {
            refreshChromeObservers();
        });

        mutationObserver.observe(page.element, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ["hidden"]
        });
    }

    function getRevealHideThreshold(): number {
        return Math.max(24, getBlockSize(getHeaderElement()) / 2);
    }

    function handleRevealScroll(): void {
        scrollFrameId = null;

        if (destroyed || !hasRevealChrome(chrome)) return;

        const nextScrollY = Math.max(0, ownerWindow.scrollY);
        const delta = nextScrollY - lastScrollY;

        lastScrollY = nextScrollY;

        if (nextScrollY <= getRevealHideThreshold()) {
            setChromeVisible(true);
            return;
        }

        if (delta < 0) {
            setChromeVisible(true);
        } else if (delta > 4) {
            setChromeVisible(false);
        }
    }

    function setupRevealScroll(): void {
        removeScrollListener?.();
        removeRevealFocusListener?.();
        removeScrollListener = null;
        removeRevealFocusListener = null;

        if (scrollFrameId !== null) {
            ownerWindow.cancelAnimationFrame(scrollFrameId);
            scrollFrameId = null;
        }

        if (!hasRevealChrome(chrome)) {
            lastScrollY = Math.max(0, ownerWindow.scrollY);
            chromeVisible = true;
            syncChromeVisibility();
            syncChromeMetrics();
            return;
        }

        lastScrollY = Math.max(0, ownerWindow.scrollY);
        syncChromeVisibility();

        const onScroll = (): void => {
            if (scrollFrameId !== null) return;

            scrollFrameId = ownerWindow.requestAnimationFrame(handleRevealScroll);
        };

        const onFocusIn = (event: FocusEvent): void => {
            if (!isRevealChromeTarget(event.target)) return;

            lastScrollY = Math.max(0, ownerWindow.scrollY);
            setChromeVisible(true);
        };

        ownerWindow.addEventListener("scroll", onScroll, { passive: true });
        page.element.addEventListener("focusin", onFocusIn);

        removeScrollListener = () => {
            ownerWindow.removeEventListener("scroll", onScroll);
        };
        removeRevealFocusListener = () => {
            page.element.removeEventListener("focusin", onFocusIn);
        };
    }

    function sync(): void {
        page.element.setAttribute("data-af-page-layout", mode);
        page.element.setAttribute("data-af-page-contained", String(contained));
        page.element.setAttribute("data-af-page-borders", String(borders));
        page.element.setAttribute("data-af-page-header-mode", chrome.header);
        page.element.setAttribute("data-af-page-navigation-mode", chrome.navigation);
        page.element.setAttribute("data-af-page-before-outlet-mode", chrome.beforeOutlet);
        syncChromeVisibility();

        setStyleProperty(styles, page.element, "--af-page-layout-max-width", maxWidth);
        setStyleProperty(styles, page.element, "--af-page-layout-gutter", gutter);
        setStyleProperty(styles, page.element, "--af-page-main-gap", mainGap);
        setStyleProperty(styles, page.element, "--af-page-main-padding-block", mainPaddingBlock);
        setStyleProperty(styles, page.element, "--af-page-chrome-top-offset", chrome.topOffset);
        setStyleProperty(styles, page.element, "--af-page-chrome-z-index", chrome.zIndex);
        syncChromeMetrics();
    }

    sync();
    refreshChromeObservers();
    setupMutationObserver();
    setupRevealScroll();

    return {
        page,
        element: page.element,

        update(nextOptions) {
            if (nextOptions.mode !== undefined) mode = nextOptions.mode;
            if (nextOptions.contained !== undefined) contained = nextOptions.contained;
            if (nextOptions.borders !== undefined) borders = nextOptions.borders;
            if ("maxWidth" in nextOptions) maxWidth = nextOptions.maxWidth ?? null;
            if ("gutter" in nextOptions) gutter = nextOptions.gutter ?? null;
            if ("mainGap" in nextOptions) mainGap = nextOptions.mainGap ?? null;
            if ("mainPaddingBlock" in nextOptions) {
                mainPaddingBlock = nextOptions.mainPaddingBlock ?? null;
            }
            if ("chrome" in nextOptions) chrome = normalizeChromeOptions(nextOptions.chrome);

            sync();
            refreshChromeObservers();
            setupRevealScroll();
        },

        destroy() {
            if (destroyed) return;

            destroyed = true;

            if (scrollFrameId !== null) {
                ownerWindow.cancelAnimationFrame(scrollFrameId);
                scrollFrameId = null;
            }

            removeScrollListener?.();
            removeRevealFocusListener?.();
            resizeObserver?.disconnect();
            mutationObserver?.disconnect();
            attributes.restore();
            styles.restore();
        },

        isDestroyed() {
            return destroyed;
        }
    };
}
