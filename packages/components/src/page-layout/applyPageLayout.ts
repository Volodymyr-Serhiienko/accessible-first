import { createAttributeSnapshot } from "../../../core/src/dom";
import { captureInlineStyles } from "../../../core/src/dom/captureInlineStyles";
import { runCleanups } from "../../../core/src/events";
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

function setStyleProperty(
    element: HTMLElement,
    property: string,
    value: string | null
): void {
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
    const restoreStyles = captureInlineStyles(page.element, [
        "--af-page-layout-max-width", "--af-page-layout-gutter", "--af-page-main-gap",
        "--af-page-main-padding-block", "--af-page-chrome-top-offset", "--af-page-chrome-z-index",
        "--af-page-header-block-size", "--af-page-navigation-block-size", "--af-page-before-outlet-block-size",
        "--af-page-navigation-offset-block-size", "--af-page-before-outlet-offset-block-size",
        "--af-page-scroll-margin-block-size", "--af-page-fixed-chrome-block-size"
    ]);
    const ownerWindow = page.element.ownerDocument.defaultView ?? window;

    let resizeObserver: ResizeObserver | null = null;
    let mutationObserver: MutationObserver | null = null;
    let removeScrollListener: (() => void) | null = null;
    let removeRevealFocusListener: (() => void) | null = null;
    let removeResizeListener: (() => void) | null = null;
    let scrollFrameId: number | null = null;
    let revealRevision = 0;
    const observed = new Set<HTMLElement>();
    const placeholders = new Map<HTMLElement, HTMLElement>();
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
        return !!element && target instanceof ownerWindow.Node && element.contains(target);
    }

    function hasExpandedControl(element: HTMLElement | null): boolean {
        return !!element?.querySelector('[aria-expanded="true"]');
    }

    function isRevealChromeTarget(target: EventTarget | null): boolean {
        return (chrome.header === "reveal" && containsTarget(getHeaderElement(), target))
            || (chrome.navigation === "reveal" && containsTarget(getNavigationElement(), target))
            || (chrome.beforeOutlet === "reveal" && containsTarget(getBeforeOutletElement(), target));
    }

    function hasActiveRevealChrome(): boolean {
        const activeElement = page.element.ownerDocument.activeElement;

        return isRevealChromeTarget(activeElement)
            || (chrome.header === "reveal" && hasExpandedControl(getHeaderElement()))
            || (chrome.navigation === "reveal" && hasExpandedControl(getNavigationElement()))
            || (chrome.beforeOutlet === "reveal" && hasExpandedControl(getBeforeOutletElement()));
    }

    function syncChromeVisibility(): void {
        page.element.setAttribute("data-af-page-chrome-visible", String(chromeVisible || !hasRevealChrome(chrome)));
    }

    function setChromeVisible(nextVisible: boolean): void {
        if (destroyed || chromeVisible === nextVisible) return;

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

        setStyleProperty(page.element, "--af-page-header-block-size", formatPixels(headerSize));
        setStyleProperty(page.element, "--af-page-navigation-block-size", formatPixels(navigationSize));
        setStyleProperty(page.element, "--af-page-before-outlet-block-size", formatPixels(beforeOutletSize));
        setStyleProperty(page.element, "--af-page-navigation-offset-block-size", formatPixels(navigationOffset));
        setStyleProperty(page.element, "--af-page-before-outlet-offset-block-size", formatPixels(beforeOutletOffset));
        setStyleProperty(page.element, "--af-page-scroll-margin-block-size", formatPixels(scrollMargin));
        setStyleProperty(page.element, "--af-page-fixed-chrome-block-size", formatPixels(fixedChromeSize));
        syncFixedPlaceholders();
    }

    function syncFixedPlaceholders(): void {
        // Reserve fixed regions beside their original flow position, including mixed stacks.
        const fixed = new Map<HTMLElement, string>();
        for (const [element, position, name] of [
            [getHeaderElement(), chrome.header, "header"],
            [getNavigationElement(), chrome.navigation, "navigation"],
            [getBeforeOutletElement(), chrome.beforeOutlet, "before-outlet"]
        ] as const) {
            if (element && position === "fixed" && !element.hidden) fixed.set(element, name);
        }
        for (const [element, placeholder] of placeholders) {
            if (fixed.has(element)) continue;
            placeholder.remove(); placeholders.delete(element);
        }
        for (const [element, name] of fixed) {
            let placeholder = placeholders.get(element);
            if (!placeholder) {
                placeholder = page.element.ownerDocument.createElement("div");
                placeholder.setAttribute("data-af-page-chrome-placeholder", name);
                placeholder.setAttribute("aria-hidden", "true");
                placeholders.set(element, placeholder);
            }
            if (element.nextSibling !== placeholder) element.after(placeholder);
        }
    }

    function refreshChromeObservers(): void {
        if (destroyed) return;

        if (!resizeObserver && ownerWindow.ResizeObserver) {
            resizeObserver = new ownerWindow.ResizeObserver(() => {
                syncChromeMetrics();
            });

        }
        const next = new Set([getHeaderElement(), getNavigationElement(), getBeforeOutletElement()]
            .filter((element): element is HTMLElement => element !== null));
        for (const element of observed) {
            if (next.has(element)) continue;
            resizeObserver?.unobserve(element); observed.delete(element);
        }
        for (const element of next) {
            if (observed.has(element)) continue;
            resizeObserver?.observe(element); observed.add(element);
        }

        syncChromeMetrics();
    }

    function setupMutationObserver(): void {
        if (!ownerWindow.MutationObserver) return;

        mutationObserver = new ownerWindow.MutationObserver(records => {
            if (destroyed) return;
            const regions = [getHeaderElement(), getNavigationElement(), getBeforeOutletElement()];
            const relevant = records.some(record => {
                const target = record.target;
                if (target === page.element) return true;
                if (regions.some(region => region && (region.contains(target) || target.contains(region)))) return true;
                return [...record.addedNodes, ...record.removedNodes].some(node =>
                    node instanceof ownerWindow.Element && (node.matches("[data-af-page-header], [data-af-page-navigation], [data-af-app-shell-before-outlet]")
                        || node.querySelector("[data-af-page-header], [data-af-page-navigation], [data-af-app-shell-before-outlet]")));
            });
            if (!relevant) return;
            if (hasActiveRevealChrome()) setChromeVisible(true);
            refreshChromeObservers();
        });

        mutationObserver.observe(page.element, {
            childList: true,
            subtree: true,
            characterData: true,
            attributes: true,
            attributeFilter: ["hidden", "aria-expanded"]
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

        if (nextScrollY <= getRevealHideThreshold() || hasActiveRevealChrome()) {
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
        const previousScroll = removeScrollListener;
        const previousFocus = removeRevealFocusListener;
        const previousFrame = scrollFrameId;
        removeScrollListener = null;
        removeRevealFocusListener = null;
        scrollFrameId = null;
        const current = ++revealRevision;
        runCleanups([() => previousScroll?.(), () => previousFocus?.(), () => {
            if (previousFrame !== null) ownerWindow.cancelAnimationFrame(previousFrame);
        }]);

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
            if (destroyed || current !== revealRevision || scrollFrameId !== null) return;

            scrollFrameId = ownerWindow.requestAnimationFrame(() => {
                if (!destroyed && current === revealRevision) handleRevealScroll();
            });
        };

        const onFocusIn = (event: FocusEvent): void => {
            if (destroyed || current !== revealRevision || !isRevealChromeTarget(event.target)) return;

            lastScrollY = Math.max(0, ownerWindow.scrollY);
            setChromeVisible(true);
        };

        ownerWindow.addEventListener("scroll", onScroll, { passive: true });
        removeScrollListener = () => {
            ownerWindow.removeEventListener("scroll", onScroll);
        };
        page.element.addEventListener("focusin", onFocusIn);
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

        setStyleProperty(page.element, "--af-page-layout-max-width", maxWidth);
        setStyleProperty(page.element, "--af-page-layout-gutter", gutter);
        setStyleProperty(page.element, "--af-page-main-gap", mainGap);
        setStyleProperty(page.element, "--af-page-main-padding-block", mainPaddingBlock);
        setStyleProperty(page.element, "--af-page-chrome-top-offset", chrome.topOffset);
        setStyleProperty(page.element, "--af-page-chrome-z-index", chrome.zIndex);
        syncChromeMetrics();
    }

    const controller: PageLayoutController = {
        page,
        element: page.element,

        update(nextOptions) {
            if (destroyed) return;
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
            revealRevision += 1;
            const frame = scrollFrameId;
            scrollFrameId = null;
            const removeScroll = removeScrollListener;
            const removeFocus = removeRevealFocusListener;
            const removeResize = removeResizeListener;
            removeScrollListener = null; removeRevealFocusListener = null;
            removeResizeListener = null;
            runCleanups([
                () => { if (frame !== null) ownerWindow.cancelAnimationFrame(frame); },
                () => removeScroll?.(), () => removeFocus?.(), () => removeResize?.(),
                () => resizeObserver?.disconnect(), () => mutationObserver?.disconnect(),
                () => { for (const placeholder of placeholders.values()) placeholder.remove(); placeholders.clear(); observed.clear(); },
                attributes.restore, restoreStyles
            ]);
        },

        isDestroyed() {
            return destroyed;
        }
    };

    try {
        sync();
        refreshChromeObservers();
        setupMutationObserver();
        setupRevealScroll();
        ownerWindow.addEventListener("resize", refreshChromeObservers);
        removeResizeListener = () => ownerWindow.removeEventListener("resize", refreshChromeObservers);
        return controller;
    } catch (error) {
        try { controller.destroy(); } catch { /* Preserve the construction failure. */ }
        throw error;
    }
}
