import { addEventListener, runCleanups, type Cleanup } from "../../../core/src/events";
import { createLocaleSubscription } from "../localization/createLocaleSubscription";
import {
    applyCompositionElementOptions,
    createContentSlot,
    createElement,
    getCompositionElementOptions,
    toCompositionChildren,
    type BaseCompositionOptions,
    type ComposedNode,
    type CompositionChild
} from "../composition";
import {
    accessibleFirstEnglishMessages,
    getLocaleText,
    type LocaleTextProvider
} from "../localization";

/**
 * Controls visibility mode for OverflowScroller.
 */
export type OverflowScrollerControls = "auto" | "always" | "none";

/**
 * Scroll distance used by OverflowScroller arrow buttons.
 */
export type OverflowScrollerScrollAmount = "page" | number;

/**
 * Localized message keys used by OverflowScroller control buttons.
 */
export type OverflowScrollerMessageKey =
    | "overflowScroller.previousLabel"
    | "overflowScroller.nextLabel";

/**
 * Localization provider accepted by OverflowScroller.
 */
export type OverflowScrollerLocalization = LocaleTextProvider<OverflowScrollerMessageKey>;

/**
 * Options for OverflowScroller().
 */
export interface OverflowScrollerOptions extends BaseCompositionOptions {
    children?: CompositionChild[];
    label?: string | null;
    previousLabel?: string;
    nextLabel?: string;
    locale?: OverflowScrollerLocalization | null;
    controls?: OverflowScrollerControls;
    scrollAmount?: OverflowScrollerScrollAmount;
    viewportOptions?: BaseCompositionOptions;
    contentOptions?: BaseCompositionOptions;
    previousButtonOptions?: BaseCompositionOptions;
    nextButtonOptions?: BaseCompositionOptions;
}

/**
 * Options accepted by ComposedOverflowScroller.update().
 */
export interface OverflowScrollerUpdateOptions extends Partial<OverflowScrollerOptions> {}

/**
 * Horizontal overflow scroller created by the composition API.
 */
export interface ComposedOverflowScroller extends ComposedNode<HTMLElement> {
    readonly element: HTMLElement;
    readonly viewport: HTMLElement;
    readonly content: HTMLElement;
    readonly previousButton: HTMLButtonElement;
    readonly nextButton: HTMLButtonElement;
    setContent(children: CompositionChild[]): void;
    scrollPrevious(): void;
    scrollNext(): void;
    refresh(): void;
    update(options: OverflowScrollerUpdateOptions): void;
    destroy(): void;
    isDestroyed(): boolean;
}

function getScrollBehavior(ownerWindow: Window): ScrollBehavior {
    if (
        typeof ownerWindow.matchMedia === "function"
        && ownerWindow.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
        return "auto";
    }

    return "smooth";
}

function parseCssPixelValue(value: string): number {
    const parsed = Number.parseFloat(value);

    return Number.isFinite(parsed) ? parsed : 0;
}

function getControlLabel(
    value: string | undefined,
    locale: OverflowScrollerLocalization | null,
    key: OverflowScrollerMessageKey
): string {
    return value ?? getLocaleText(locale, key, accessibleFirstEnglishMessages[key]);
}

function getViewportFocusInset(viewport: HTMLElement, ownerWindow: Window): number {
    const style = ownerWindow.getComputedStyle(viewport);

    return Math.max(
        parseCssPixelValue(style.getPropertyValue("padding-inline-start")),
        parseCssPixelValue(style.getPropertyValue("padding-inline-end")),
        parseCssPixelValue(style.paddingLeft),
        parseCssPixelValue(style.paddingRight)
    );
}

/**
 * Creates a controlled horizontal scroller for long inline content.
 */
export function OverflowScroller(options: OverflowScrollerOptions = {}): ComposedOverflowScroller {
    const element = createElement("div", getCompositionElementOptions(options, {
        "data-af-composition": "overflow-scroller"
    }));

    const viewport = createElement("div", getCompositionElementOptions(options.viewportOptions, {
        "data-af-overflow-scroller-viewport": ""
    }));

    const content = createElement("div", getCompositionElementOptions(options.contentOptions, {
        "data-af-overflow-scroller-content": ""
    }));

    const previousButton = createElement("button");
    const nextButton = createElement("button");

    const ownerWindow = element.ownerDocument.defaultView ?? window;
    const cleanups: Cleanup[] = [];
    const contentSlot = createContentSlot(content, toCompositionChildren(options.children));

    let label = options.label ?? null;
    let previousLabel = options.previousLabel;
    let nextLabel = options.nextLabel;
    let locale: OverflowScrollerLocalization | null = options.locale ?? null;
    let previousButtonOptions = options.previousButtonOptions;
    let nextButtonOptions = options.nextButtonOptions;
    let controls: OverflowScrollerControls = options.controls ?? "auto";
    let scrollAmount: OverflowScrollerScrollAmount = options.scrollAmount ?? "page";
    let updateTimer: number | null = null;
    let focusScrollFrame: number | null = null;
    let destroyed = false;
    let revision = 0;
    let resizeObserver: ResizeObserver | null = null;

    function applyButtonOptions(
        button: HTMLButtonElement,
        buttonOptions: BaseCompositionOptions | undefined,
        direction: "previous" | "next",
        accessibleLabel: string
    ): void {
        applyCompositionElementOptions(button, buttonOptions);
        button.type = "button";
        button.setAttribute("aria-label", accessibleLabel);
        button.setAttribute("data-af-overflow-scroller-button", direction);
    }

    function syncStructure(): void {
        if (destroyed) return;
        const current = revision;
        const previousText = getControlLabel(previousLabel, locale, "overflowScroller.previousLabel");
        const nextText = getControlLabel(nextLabel, locale, "overflowScroller.nextLabel");
        if (destroyed || current !== revision) return;
        element.setAttribute("data-af-composition", "overflow-scroller");
        element.setAttribute("data-af-overflow-scroller-controls", controls);
        viewport.setAttribute("data-af-overflow-scroller-viewport", "");
        content.setAttribute("data-af-overflow-scroller-content", "");

        if (label && label.trim().length > 0) {
            element.setAttribute("role", "group");
            element.setAttribute("aria-label", label);
        } else {
            element.removeAttribute("role");
            element.removeAttribute("aria-label");
        }

        applyButtonOptions(
            previousButton,
            previousButtonOptions,
            "previous",
            previousText
        );
        applyButtonOptions(
            nextButton,
            nextButtonOptions,
            "next",
            nextText
        );
    }

    function getScrollDistance(): number {
        if (typeof scrollAmount === "number") {
            return Math.max(0, scrollAmount);
        }

        return Math.max(1, Math.floor(viewport.clientWidth * 0.85));
    }

    function updateState(): void {
        if (destroyed) return;
        const rtl = ownerWindow.getComputedStyle(viewport).direction === "rtl";
        const maxScroll = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
        const currentScroll = Math.max(0, Math.min(rtl ? -viewport.scrollLeft : viewport.scrollLeft, maxScroll));
        const hasOverflow = maxScroll > 1;
        const atStart = currentScroll <= 1;
        const atEnd = currentScroll >= maxScroll - 1;
        const hideControls = controls === "none" || (controls === "auto" && !hasOverflow);

        element.setAttribute("data-af-overflow-scroller-overflowing", hasOverflow ? "true" : "false");
        element.setAttribute("data-af-overflow-scroller-direction", rtl ? "rtl" : "ltr");

        previousButton.hidden = hideControls;
        nextButton.hidden = hideControls;
        previousButton.disabled = hideControls || !hasOverflow || atStart;
        nextButton.disabled = hideControls || !hasOverflow || atEnd;
    }

    function scheduleStateUpdate(): void {
        if (destroyed || updateTimer !== null) return;

        updateTimer = ownerWindow.setTimeout(() => {
            updateTimer = null;
            updateState();
        }, 0);
    }

    function scrollElementIntoView(target: HTMLElement): void {
        if (destroyed || !content.contains(target) || target.ownerDocument.activeElement !== target) return;

        const targetRect = target.getBoundingClientRect();
        const viewportRect = viewport.getBoundingClientRect();
        const focusInset = getViewportFocusInset(viewport, ownerWindow);
        const safeLeft = viewportRect.left + focusInset;
        const safeRight = viewportRect.right - focusInset;

        let scrollDelta = 0;

        if (targetRect.left < safeLeft) {
            scrollDelta = targetRect.left - safeLeft;
        } else if (targetRect.right > safeRight) {
            scrollDelta = targetRect.right - safeRight;
        }

        if (scrollDelta === 0) return;

        viewport.scrollBy({
            left: scrollDelta,
            behavior: "auto"
        });

        updateState();
    }

    function scheduleFocusedElementScroll(target: HTMLElement): void {
        if (destroyed) return;
        if (focusScrollFrame !== null) {
            ownerWindow.cancelAnimationFrame(focusScrollFrame);
        }

        focusScrollFrame = ownerWindow.requestAnimationFrame(() => {
            focusScrollFrame = null;
            scrollElementIntoView(target);
        });
    }

    function handleFocusIn(event: FocusEvent): void {
        const target = event.target;

        if (!(target instanceof ownerWindow.HTMLElement)) return;

        scheduleFocusedElementScroll(target);
    }

    const localeSubscription = createLocaleSubscription(syncStructure);

    function scrollPrevious(): void {
        if (destroyed) return;
        viewport.scrollBy({
            left: (ownerWindow.getComputedStyle(viewport).direction === "rtl" ? 1 : -1) * getScrollDistance(),
            behavior: getScrollBehavior(ownerWindow)
        });
        scheduleStateUpdate();
    }

    function scrollNext(): void {
        if (destroyed) return;
        viewport.scrollBy({
            left: (ownerWindow.getComputedStyle(viewport).direction === "rtl" ? -1 : 1) * getScrollDistance(),
            behavior: getScrollBehavior(ownerWindow)
        });
        scheduleStateUpdate();
    }

    function setContent(children: CompositionChild[]): void {
        if (destroyed) return;
        revision += 1;
        runCleanups([() => contentSlot.set(children), scheduleStateUpdate]);
    }

    previousButton.addEventListener("click", scrollPrevious);
    nextButton.addEventListener("click", scrollNext);

    cleanups.push(
        () => previousButton.removeEventListener("click", scrollPrevious),
        () => nextButton.removeEventListener("click", scrollNext),
        addEventListener<FocusEvent>(content, "focusin", handleFocusIn),
        addEventListener<Event>(viewport, "scroll", scheduleStateUpdate, { passive: true }),
        addEventListener<Event>(ownerWindow, "resize", scheduleStateUpdate)
    );

    try {
        resizeObserver = typeof ownerWindow.ResizeObserver === "undefined" ? null : new ownerWindow.ResizeObserver(scheduleStateUpdate);
        resizeObserver?.observe(viewport);
        resizeObserver?.observe(content);
        viewport.append(content);
        element.append(previousButton, viewport, nextButton);
        localeSubscription.replace(locale);
        syncStructure();
        scheduleStateUpdate();
    } catch (error) {
        try { destroy(); } catch { /* Preserve the construction failure. */ }
        throw error;
    }

    function destroy(): void {
        if (destroyed) return;
        destroyed = true;
        revision += 1;
        if (updateTimer !== null) { ownerWindow.clearTimeout(updateTimer); updateTimer = null; }
        if (focusScrollFrame !== null) { ownerWindow.cancelAnimationFrame(focusScrollFrame); focusScrollFrame = null; }
        runCleanups([() => resizeObserver?.disconnect(), localeSubscription.destroy,
            ...[...cleanups].reverse(), contentSlot.dispose, () => element.remove()]);
    }

    return {
        element,
        viewport,
        content,
        previousButton,
        nextButton,
        setContent,
        scrollPrevious,
        scrollNext,
        refresh: scheduleStateUpdate,

        update(nextOptions): void {
            if (destroyed) return;
            const current = ++revision;
            const localeChanged = "locale" in nextOptions && (nextOptions.locale ?? null) !== locale;
            applyCompositionElementOptions(element, nextOptions);

            if ("label" in nextOptions) label = nextOptions.label ?? null;
            if ("previousLabel" in nextOptions) previousLabel = nextOptions.previousLabel;
            if ("nextLabel" in nextOptions) nextLabel = nextOptions.nextLabel;
            if ("locale" in nextOptions) {
                locale = nextOptions.locale ?? null;
            }
            if (nextOptions.controls !== undefined) controls = nextOptions.controls;
            if (nextOptions.scrollAmount !== undefined) scrollAmount = nextOptions.scrollAmount;

            if (nextOptions.viewportOptions !== undefined) {
                applyCompositionElementOptions(viewport, nextOptions.viewportOptions);
            }

            if (nextOptions.contentOptions !== undefined) {
                applyCompositionElementOptions(content, nextOptions.contentOptions);
            }

            if (nextOptions.previousButtonOptions !== undefined) {
                previousButtonOptions = nextOptions.previousButtonOptions;
                applyCompositionElementOptions(previousButton, previousButtonOptions);
            }

            if (nextOptions.nextButtonOptions !== undefined) {
                nextButtonOptions = nextOptions.nextButtonOptions;
                applyCompositionElementOptions(nextButton, nextButtonOptions);
            }

            runCleanups([
                () => { if (localeChanged) localeSubscription.replace(locale); },
                () => { if (!destroyed && current === revision && nextOptions.children !== undefined) contentSlot.set(nextOptions.children); },
                () => { if (!destroyed && current === revision) syncStructure(); },
                scheduleStateUpdate
            ]);
        },

        destroy,
        isDestroyed: () => destroyed
    };
}
