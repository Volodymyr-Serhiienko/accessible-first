import { restoreAttribute } from "../../../core/src/dom";
import { focusElement, getFocusableElements } from "../../../core/src/focus";
import { createAnnouncer, type Announcer, type LiveRegionPoliteness } from "../../../core/src/live-region";
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

function getDefaultAnnouncement(context: PageOutletAnnouncementContext): string {
    return context.title ?? context.documentTitle ?? "Content updated.";
}

function resolveAnnouncement(
    announcement: PageOutletAnnouncement,
    context: PageOutletAnnouncementContext
): string | null {
    if (announcement === false) return null;
    if (announcement === true) return getDefaultAnnouncement(context);
    if (typeof announcement === "function") return announcement(context) ?? null;
    return announcement;
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
    let title = options.title ?? null;
    let documentTitle = options.documentTitle ?? null;
    let label = options.label ?? null;
    let focusTarget: PageOutletFocusTarget = options.focusTarget ?? "first-heading";
    let scrollOnRender = options.scrollOnRender ?? true;
    let announcement: PageOutletAnnouncement = options.announcement ?? true;
    let announcementPoliteness: LiveRegionPoliteness = options.announcementPoliteness ?? "polite";
    let announcer: Announcer | null = null;
    let destroyed = false;

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
            document.title = documentTitle;
        }
    }

    function resolveFocusTarget(target: PageOutletFocusTarget): HTMLElement | null {
        if (target === null) return null;
        if (target instanceof HTMLElement) return target;

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

    function focus(target: PageOutletFocusTarget = focusTarget): boolean {
        const targetElement = resolveFocusTarget(target);

        if (!targetElement) return false;

        const previousTabIndex = targetElement.getAttribute("tabindex");

        if (targetElement.tabIndex < 0) {
            targetElement.tabIndex = -1;
        }

        const focused = focusElement(targetElement, {
            preventScroll: true
        });

        restoreAttribute(targetElement, "tabindex", previousTabIndex);

        return focused;
    }

    function announceRender(nextAnnouncement: PageOutletAnnouncement): void {
        const context: PageOutletAnnouncementContext = {
            title,
            documentTitle,
            element
        };

        const message = resolveAnnouncement(nextAnnouncement, context);

        if (!message) return;

        announcer ??= createAnnouncer();
        announcer.announce(message, {
            politeness: announcementPoliteness
        });
    }

    function runRenderEffects(options: PageOutletRenderOptions = {}): void {
        if ("title" in options) title = options.title ?? null;
        if ("documentTitle" in options) syncDocumentTitle(options.documentTitle ?? null);

        const shouldScroll = options.scroll ?? scrollOnRender;
        const nextFocusTarget = "focusTarget" in options ? options.focusTarget ?? null : focusTarget;
        const nextAnnouncement = "announcement" in options
            ? options.announcement ?? false
            : announcement;

        if (shouldScroll) {
            element.scrollIntoView({
                block: "start",
                inline: "nearest",
                behavior: "auto"
            });
        }

        focus(nextFocusTarget);
        announceRender(nextAnnouncement);
    }

    function setContent(children: CompositionChild[], renderOptions: PageOutletRenderOptions = {}): void {
        contentSlot.set(children);
        runRenderEffects(renderOptions);
    }

    if (documentTitle !== null) {
        document.title = documentTitle;
    }

    syncAttributes();

    composed = {
        element,

        getTitle(): string | null {
            return title;
        },

        setTitle(nextTitle): void {
            title = nextTitle;
        },

        setContent,

        render(content, renderOptions = {}): void {
            setContent(toCompositionChildren(content), renderOptions);
        },

        focus,

        update(nextOptions): void {
            applyCompositionElementOptions(element, nextOptions);

            if ("label" in nextOptions) label = nextOptions.label ?? null;
            if ("title" in nextOptions) title = nextOptions.title ?? null;
            if ("documentTitle" in nextOptions) syncDocumentTitle(nextOptions.documentTitle ?? null);
            if ("focusTarget" in nextOptions) focusTarget = nextOptions.focusTarget ?? null;
            if (nextOptions.scrollOnRender !== undefined) scrollOnRender = nextOptions.scrollOnRender;
            if ("announcement" in nextOptions) announcement = nextOptions.announcement ?? true;
            if (nextOptions.announcementPoliteness !== undefined) {
                announcementPoliteness = nextOptions.announcementPoliteness;
            }

            if (nextOptions.children !== undefined) {
                contentSlot.set(nextOptions.children);
            }

            syncAttributes();
        },

        destroy(): void {
            if (destroyed) return;

            destroyed = true;
            announcer?.destroy();
            contentSlot.dispose();
            restoreAttribute(element, "tabindex", originalTabIndex);
            element.remove();
        }
    };

    return composed;
}
