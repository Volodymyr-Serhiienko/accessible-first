import { addEventListener, type Cleanup } from "../../../core/src/events";
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

/**
 * Controls visibility mode for OverflowScroller.
 */
export type OverflowScrollerControls = "auto" | "always" | "none";

/**
 * Scroll distance used by OverflowScroller arrow buttons.
 */
export type OverflowScrollerScrollAmount = "page" | number;

/**
 * Options for OverflowScroller().
 */
export interface OverflowScrollerOptions extends BaseCompositionOptions {
    children?: CompositionChild[];
    label?: string | null;
    previousLabel?: string;
    nextLabel?: string;
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
    let previousLabel = options.previousLabel ?? "Scroll left";
    let nextLabel = options.nextLabel ?? "Scroll right";
    let controls: OverflowScrollerControls = options.controls ?? "auto";
    let scrollAmount: OverflowScrollerScrollAmount = options.scrollAmount ?? "page";
    let updateTimer: number | null = null;
    let destroyed = false;

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

        applyButtonOptions(previousButton, options.previousButtonOptions, "previous", previousLabel);
        applyButtonOptions(nextButton, options.nextButtonOptions, "next", nextLabel);
    }

    function getScrollDistance(): number {
        if (typeof scrollAmount === "number") {
            return Math.max(0, scrollAmount);
        }

        return Math.max(1, Math.floor(viewport.clientWidth * 0.85));
    }

    function updateState(): void {
        const maxScroll = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
        const currentScroll = Math.max(0, Math.min(viewport.scrollLeft, maxScroll));
        const hasOverflow = maxScroll > 1;
        const atStart = currentScroll <= 1;
        const atEnd = currentScroll >= maxScroll - 1;
        const hideControls = controls === "none" || (controls === "auto" && !hasOverflow);

        element.setAttribute("data-af-overflow-scroller-overflowing", hasOverflow ? "true" : "false");

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

    function scrollPrevious(): void {
        viewport.scrollBy({
            left: -getScrollDistance(),
            behavior: getScrollBehavior(ownerWindow)
        });
        scheduleStateUpdate();
    }

    function scrollNext(): void {
        viewport.scrollBy({
            left: getScrollDistance(),
            behavior: getScrollBehavior(ownerWindow)
        });
        scheduleStateUpdate();
    }

    function setContent(children: CompositionChild[]): void {
        contentSlot.set(children);
        scheduleStateUpdate();
    }

    previousButton.addEventListener("click", scrollPrevious);
    nextButton.addEventListener("click", scrollNext);

    cleanups.push(
        () => previousButton.removeEventListener("click", scrollPrevious),
        () => nextButton.removeEventListener("click", scrollNext),
        addEventListener<Event>(viewport, "scroll", scheduleStateUpdate, { passive: true }),
        addEventListener<Event>(ownerWindow, "resize", scheduleStateUpdate)
    );

    const resizeObserver = typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(scheduleStateUpdate);

    resizeObserver?.observe(viewport);
    resizeObserver?.observe(content);

    viewport.append(content);
    element.append(previousButton, viewport, nextButton);
    syncStructure();
    scheduleStateUpdate();

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
            applyCompositionElementOptions(element, nextOptions);

            if ("label" in nextOptions) label = nextOptions.label ?? null;
            if (nextOptions.previousLabel !== undefined) previousLabel = nextOptions.previousLabel;
            if (nextOptions.nextLabel !== undefined) nextLabel = nextOptions.nextLabel;
            if (nextOptions.controls !== undefined) controls = nextOptions.controls;
            if (nextOptions.scrollAmount !== undefined) scrollAmount = nextOptions.scrollAmount;

            if (nextOptions.viewportOptions !== undefined) {
                applyCompositionElementOptions(viewport, nextOptions.viewportOptions);
            }

            if (nextOptions.contentOptions !== undefined) {
                applyCompositionElementOptions(content, nextOptions.contentOptions);
            }

            if (nextOptions.previousButtonOptions !== undefined) {
                applyCompositionElementOptions(previousButton, nextOptions.previousButtonOptions);
            }

            if (nextOptions.nextButtonOptions !== undefined) {
                applyCompositionElementOptions(nextButton, nextOptions.nextButtonOptions);
            }

            if (nextOptions.children !== undefined) {
                setContent(nextOptions.children);
            }

            syncStructure();
            scheduleStateUpdate();
        },

        destroy(): void {
            if (destroyed) return;

            destroyed = true;

            if (updateTimer !== null) {
                ownerWindow.clearTimeout(updateTimer);
                updateTimer = null;
            }

            resizeObserver?.disconnect();

            for (const cleanup of [...cleanups].reverse()) {
                cleanup();
            }

            contentSlot.dispose();
            element.remove();
        }
    };
}
