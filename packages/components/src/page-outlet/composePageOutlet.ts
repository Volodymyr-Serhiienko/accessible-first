import { isHTMLElement, restoreAttribute } from "../../../core/src/dom";
import { runCleanups } from "../../../core/src/events";
import { createPreparedContentOwner, type PreparedContentOwner } from "../composition/preparedContent";
import { focusProgrammatically, getFocusableElements } from "../../../core/src/focus";
import {
    createDocumentAnnouncementChannel,
    type DocumentAnnouncementChannel,
    type LiveRegionPoliteness
} from "../../../core/src/live-region";
import {
    applyCompositionElementOptions,
    createContentSlot,
    createElement,
    getCompositionElementOptions,
    toCompositionChildren,
    type BaseCompositionOptions,
    type ComposedNode,
    type CompositionChild,
    type CompositionContent
} from "../composition";

/**
 * Built-in focus target strategy for PageOutlet renders.
 */
export type PageOutletFocusStrategy =
    | "first-heading"
    | "first-focusable"
    | "outlet";

/**
 * Focus target accepted by PageOutlet.
 */
export type PageOutletFocusTarget =
    | PageOutletFocusStrategy
    | HTMLElement
    | ((outlet: ComposedPageOutlet) => HTMLElement | null)
    | null;

/**
 * Details passed to PageOutlet announcement callbacks.
 */
export interface PageOutletAnnouncementContext {
    title: string | null;
    documentTitle: string | null;
    element: HTMLElement;
}

/**
 * Announcement configuration for PageOutlet renders.
 */
export type PageOutletAnnouncement =
    | boolean
    | string
    | ((context: PageOutletAnnouncementContext) => string | null | undefined);

/**
 * Options for PageOutlet().
 */
export interface PageOutletOptions extends BaseCompositionOptions {
    children?: CompositionChild[];
    label?: string | null;
    title?: string | null;
    documentTitle?: string | null;
    focusTarget?: PageOutletFocusTarget;
    scrollOnRender?: boolean;
    announcement?: PageOutletAnnouncement;
    announcementPoliteness?: LiveRegionPoliteness;
}

/**
 * Options accepted by PageOutlet render operations.
 */
export interface PageOutletRenderOptions {
    title?: string | null;
    documentTitle?: string | null;
    focusTarget?: PageOutletFocusTarget;
    scroll?: boolean;
    announcement?: PageOutletAnnouncement;
}

/**
 * Options accepted by ComposedPageOutlet.update().
 */
export interface PageOutletUpdateOptions extends Partial<PageOutletOptions> {}

/**
 * Managed page content outlet created by the composition API.
 */
export interface ComposedPageOutlet extends ComposedNode<HTMLElement> {
    readonly element: HTMLElement;
    getTitle(): string | null;
    setTitle(title: string | null): void;
    setContent(children: CompositionChild[], options?: PageOutletRenderOptions): void;
    render(content: CompositionContent, options?: PageOutletRenderOptions): void;
    focus(target?: PageOutletFocusTarget): boolean;
    update(options: PageOutletUpdateOptions): void;
    destroy(): void;
}

function getFirstHeading(element: HTMLElement): HTMLElement | null {
    return element.querySelector<HTMLElement>("h1, h2, h3, h4, h5, h6");
}

function normalizeAnnouncementText(value: string | null | undefined): string | null {
    const text = value?.trim() ?? "";

    return text.length > 0 ? text : null;
}

function getDefaultAnnouncement(context: PageOutletAnnouncementContext): string | null {
    return normalizeAnnouncementText(context.title)
        ?? normalizeAnnouncementText(context.documentTitle);
}

function resolveAnnouncement(
    announcement: PageOutletAnnouncement,
    context: PageOutletAnnouncementContext
): string | null {
    if (announcement === false) return null;
    if (announcement === true) return getDefaultAnnouncement(context);
    if (typeof announcement === "function") {
        return normalizeAnnouncementText(announcement(context));
    }

    return normalizeAnnouncementText(announcement);
}

/**
 * Creates a managed region for rendering changing application screens.
 */
export function PageOutlet(options: PageOutletOptions = {}): ComposedPageOutlet {
    const element = createElement("div", getCompositionElementOptions(options, {
        "data-af-composition": "page-outlet",
        tabindex: "-1"
    }));

    const originalTabIndex = element.getAttribute("tabindex");
    const contentSlot = createContentSlot(element, toCompositionChildren(options.children));

    let composed!: ComposedPageOutlet;
    let preparedOwner!: PreparedContentOwner;
    let title = options.title ?? null;
    let documentTitle = options.documentTitle ?? null;
    let label = options.label ?? null;
    let focusTarget: PageOutletFocusTarget = options.focusTarget ?? "first-heading";
    let scrollOnRender = options.scrollOnRender ?? true;
    let announcement = options.announcement;
    let announcementPoliteness: LiveRegionPoliteness = options.announcementPoliteness ?? "polite";
    let announcer: DocumentAnnouncementChannel | null = null;
    let destroyed = false;
    let revision = 0;
    let scrollFrame: { window: Window; id: number } | null = null;

    function isCurrent(current: number): boolean {
        return !destroyed && current === revision;
    }

    function cancelScroll(): void {
        const frame = scrollFrame;
        scrollFrame = null;
        if (frame) frame.window.cancelAnimationFrame(frame.id);
    }

    function beginUpdate(): number {
        revision += 1;
        cancelScroll();
        announcer?.clear();
        return revision;
    }

    function syncAttributes(): void {
        element.setAttribute("data-af-composition", "page-outlet");

        if (!element.hasAttribute("tabindex")) {
            element.tabIndex = -1;
        }

        if (label && label.trim().length > 0) {
            element.setAttribute("role", "region");
            element.setAttribute("aria-label", label);
        } else {
            element.removeAttribute("role");
            element.removeAttribute("aria-label");
        }
    }

    function syncDocumentTitle(nextDocumentTitle: string | null): void {
        documentTitle = nextDocumentTitle;

        if (documentTitle !== null) {
            element.ownerDocument.title = documentTitle;
        }
    }

    function resolveFocusTarget(target: PageOutletFocusTarget): HTMLElement | null {
        if (target === null) return null;
        if (isHTMLElement(target)) return target;

        if (typeof target === "function") {
            return target(composed);
        }

        if (target === "first-heading") {
            return getFirstHeading(element) ?? element;
        }

        if (target === "first-focusable") {
            return getFocusableElements(element)[0] ?? element;
        }

        return element;
    }

    function scrollToStart(): void {
        element.scrollIntoView({
            block: "start",
            inline: "nearest",
            behavior: "auto"
        });
    }

    function scheduleScrollToStart(current: number): void {
        const ownerWindow = element.ownerDocument.defaultView;

        if (!ownerWindow || !isCurrent(current)) return;

        const id = ownerWindow.requestAnimationFrame(() => {
            if (!isCurrent(current)) return;
            scrollFrame = null;
            scrollToStart();
        });
        scrollFrame = { window: ownerWindow, id };
    }

    function focus(target: PageOutletFocusTarget = focusTarget, current = revision): boolean {
        if (!isCurrent(current)) return false;
        const targetElement = resolveFocusTarget(target);

        if (!isCurrent(current) || !targetElement) return false;

        const moved = focusProgrammatically(targetElement, {
            preventScroll: true
        });
        return isCurrent(current) && moved;
    }

    function announceRender(nextAnnouncement: PageOutletAnnouncement, current: number): void {
        const context: PageOutletAnnouncementContext = {
            title,
            documentTitle,
            element
        };

        const message = resolveAnnouncement(nextAnnouncement, context);

        if (!isCurrent(current) || !message) return;

        announcer ??= createDocumentAnnouncementChannel({
            document: element.ownerDocument
        });

        announcer.announce(message, {
            politeness: announcementPoliteness
        });
    }

    function runRenderEffects(options: PageOutletRenderOptions, current: number): void {
        if (!isCurrent(current)) return;
        if ("title" in options) title = options.title ?? null;
        if ("documentTitle" in options) syncDocumentTitle(options.documentTitle ?? null);
        if (!isCurrent(current)) return;

        const shouldScroll = options.scroll ?? scrollOnRender;
        const nextFocusTarget = "focusTarget" in options ? options.focusTarget ?? null : focusTarget;
        const nextAnnouncement = "announcement" in options
            ? options.announcement
            : announcement;

        if (shouldScroll) {
            scrollToStart();
        }
        if (!isCurrent(current)) return;

        const focusMoved = focus(nextFocusTarget, current);
        if (!isCurrent(current)) return;

        if (nextAnnouncement === undefined) {
            if (!focusMoved) {
                announceRender(true, current);
            }
        } else {
            announceRender(nextAnnouncement, current);
        }

        if (shouldScroll && isCurrent(current)) {
            scheduleScrollToStart(current);
        }
    }

    function setContent(
        children: CompositionChild[],
        renderOptions: PageOutletRenderOptions = {}
    ): void {
        if (destroyed) return;
        const current = beginUpdate();
        preparedOwner.accept(children);
        contentSlot.set(children);
        runRenderEffects(renderOptions, current);
    }

    if (documentTitle !== null) {
        element.ownerDocument.title = documentTitle;
    }

    syncAttributes();

    composed = {
        element,

        getTitle(): string | null {
            return title;
        },

        setTitle(nextTitle): void {
            if (destroyed) return;
            beginUpdate();
            title = nextTitle;
        },

        setContent,

        render(content, renderOptions = {}): void {
            setContent(toCompositionChildren(content), renderOptions);
        },

        focus,

        update(nextOptions): void {
            if (destroyed) return;
            const current = beginUpdate();
            applyCompositionElementOptions(element, nextOptions);

            if ("label" in nextOptions) label = nextOptions.label ?? null;
            if ("title" in nextOptions) title = nextOptions.title ?? null;
            if ("documentTitle" in nextOptions) syncDocumentTitle(nextOptions.documentTitle ?? null);
            if ("focusTarget" in nextOptions) focusTarget = nextOptions.focusTarget ?? null;
            if (nextOptions.scrollOnRender !== undefined) scrollOnRender = nextOptions.scrollOnRender;
            if ("announcement" in nextOptions) announcement = nextOptions.announcement;
            if (nextOptions.announcementPoliteness !== undefined) {
                announcementPoliteness = nextOptions.announcementPoliteness;
            }

            if (nextOptions.children !== undefined) {
                preparedOwner.accept(nextOptions.children);
                contentSlot.set(nextOptions.children);
            }

            if (isCurrent(current)) syncAttributes();
        },

        destroy(): void {
            if (destroyed) return;

            destroyed = true;
            revision += 1;
            try { runCleanups([cancelScroll, () => announcer?.destroy(), () => contentSlot.dispose()]); }
            finally {
                restoreAttribute(element, "tabindex", originalTabIndex);
                element.remove();
            }
        }
    };

    preparedOwner = createPreparedContentOwner(composed);
    preparedOwner.accept(options.children);
    return composed;
}
