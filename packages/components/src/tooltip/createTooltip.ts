import { addAriaReferenceId, getAriaReferencedText } from "../../../core/src/aria";
import { getOwnerWindow, restoreAttribute } from "../../../core/src/dom";
import { addEventListener, type Cleanup } from "../../../core/src/events";
import { createId } from "../../../core/src/id";
import { isEscapeKey } from "../../../core/src/keyboard";
import {
    createDocumentAnnouncementChannel,
    type DocumentAnnouncementChannel
} from "../../../core/src/live-region";

/**
 * Options for createTooltip(), the enhancement API for short helper text.
 */
export interface TooltipOptions {
    text?: string | null;
    id?: string;
    describe?: boolean;
    announceOnHover?: boolean;
}

/**
 * Tooltip enhancement instance attached to an existing element.
 */
export interface Tooltip {
    setText(text: string | null): void;
    getText(): string | null;
    setDescribe(describe: boolean): void;
    setAnnounceOnHover(announceOnHover: boolean): void;
    getContentElement(): HTMLElement | null;
    destroy(): void;
}

function normalizeText(text: string | null | undefined): string | null {
    const trimmed = text?.trim();

    return trimmed ? trimmed : null;
}

type TooltipPlacement = "top" | "bottom";

interface TooltipViewportPosition {
    left: number;
    top: number;
    placement: TooltipPlacement;
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

function getTooltipViewportPosition(
    triggerRect: DOMRect,
    tooltipRect: DOMRect,
    ownerWindow: Window,
    viewportPadding: number,
    gap: number
): TooltipViewportPosition {
    const viewportWidth = ownerWindow.visualViewport?.width
        ?? ownerWindow.innerWidth;
    const viewportHeight = ownerWindow.visualViewport?.height
        ?? ownerWindow.innerHeight;
    const maxLeft = Math.max(
        viewportPadding,
        viewportWidth - viewportPadding - tooltipRect.width
    );
    const left = clamp(
        triggerRect.left + (triggerRect.width - tooltipRect.width) / 2,
        viewportPadding,
        maxLeft
    );
    const spaceAbove = Math.max(0, triggerRect.top - viewportPadding);
    const spaceBelow = Math.max(
        0,
        viewportHeight - triggerRect.bottom - viewportPadding
    );
    const placement: TooltipPlacement = (
        spaceAbove < tooltipRect.height && spaceBelow > spaceAbove
    )
        ? "bottom"
        : "top";
    const preferredTop = placement === "bottom"
        ? triggerRect.bottom + gap
        : triggerRect.top - gap - tooltipRect.height;
    const maxTop = Math.max(
        viewportPadding,
        viewportHeight - viewportPadding - tooltipRect.height
    );

    return {
        left,
        top: clamp(preferredTop, viewportPadding, maxTop),
        placement
    };
}

/**
 * Adds a visual tooltip, optional aria-describedby text, Escape dismissal,
 * and optional polite mouse-hover announcement to an element.
 */
export function createTooltip(
    element: HTMLElement,
    options: TooltipOptions = {}
): Tooltip {
    const ownerDocument = element.ownerDocument;
    const originalTooltip = element.getAttribute("data-af-tooltip");
    const originalDismissed = element.getAttribute("data-af-tooltip-dismissed");
    const originalDescribedBy = element.getAttribute("aria-describedby");

    let text = normalizeText(options.text);
    let describe = options.describe ?? false;
    let announceOnHover = options.announceOnHover ?? false;
    let tooltipId = options.id ?? "";
    let descriptionContent: HTMLElement | null = null;
    let visualContent: HTMLElement | null = null;
    let announcer: DocumentAnnouncementChannel | null = null;
    let cleanups: Cleanup[] = [];
    let visualCleanups: Cleanup[] = [];
    let destroyed = false;
    let dismissed = false;
    let positionFrame = 0;
    let pointerOver = false;
    let pointerOverTooltip = false;
    let focusWithin = false;

    function getTooltipId(): string {
        if (!tooltipId) {
            tooltipId = createId("af-tooltip");
        }

        return tooltipId;
    }

    function getContainer(): HTMLElement {
        return ownerDocument.body ?? ownerDocument.documentElement;
    }

    function cancelPositionUpdate(): void {
        if (!positionFrame) return;

        getOwnerWindow(element).cancelAnimationFrame(positionFrame);
        positionFrame = 0;
    }

    function updateVisualPosition(): void {
        if (!visualContent || !text || dismissed || !isActive()) return;

        const ownerWindow = getOwnerWindow(element);
        const viewportPadding = 8;
        const triggerRect = element.getBoundingClientRect();
        const tooltipRect = visualContent.getBoundingClientRect();

        if (tooltipRect.width <= 0 || tooltipRect.height <= 0) return;

        const position = getTooltipViewportPosition(
            triggerRect,
            tooltipRect,
            ownerWindow,
            viewportPadding,
            8
        );

        visualContent.style.setProperty("--af-tooltip-left", `${position.left}px`);
        visualContent.style.setProperty("--af-tooltip-top", `${position.top}px`);
        visualContent.setAttribute("data-af-tooltip-placement", position.placement);
        visualContent.setAttribute("data-af-tooltip-positioned", "");
    }

    function scheduleVisualPositionUpdate(): void {
        if (!visualContent || !text) return;

        cancelPositionUpdate();

        positionFrame = getOwnerWindow(element).requestAnimationFrame(() => {
            positionFrame = 0;
            updateVisualPosition();
        });
    }

    function ensureDescriptionContent(): HTMLElement {
        if (descriptionContent) return descriptionContent;

        descriptionContent = ownerDocument.createElement("span");
        descriptionContent.id = getTooltipId();
        descriptionContent.setAttribute("role", "tooltip");
        descriptionContent.setAttribute("data-af-tooltip-content", "");
        descriptionContent.textContent = text ?? "";

        getContainer().append(descriptionContent);

        return descriptionContent;
    }

    function ensureVisualContent(): HTMLElement {
        if (visualContent) {
            if (visualContent.parentElement !== getContainer()) {
                getContainer().append(visualContent);
            }

            return visualContent;
        }

        visualContent = ownerDocument.createElement("span");
        visualContent.setAttribute("aria-hidden", "true");
        visualContent.setAttribute("data-af-tooltip-visual", "");
        visualContent.setAttribute("data-af-tooltip-placement", "top");
        visualContent.textContent = text ?? "";

        getContainer().append(visualContent);
        visualCleanups = [
            addEventListener<PointerEvent>(
                visualContent,
                "pointerenter",
                handleVisualPointerEnter
            ),
            addEventListener<PointerEvent>(
                visualContent,
                "pointerleave",
                handleVisualPointerLeave
            )
        ];

        return visualContent;
    }

    function removeDescriptionContent(): void {
        descriptionContent?.remove();
        descriptionContent = null;
    }

    function removeVisualContent(): void {
        cancelPositionUpdate();

        for (const cleanup of visualCleanups.splice(0)) {
            cleanup();
        }

        visualContent?.remove();
        visualContent = null;
        pointerOverTooltip = false;
    }

    function getAnnouncementText(): string {
        return (
            text
            || element.getAttribute("aria-label")?.trim()
            || getAriaReferencedText(element, "aria-labelledby")
            || element.textContent?.trim()
            || ""
        );
    }

    function getAnnouncer(): DocumentAnnouncementChannel {
        announcer ??= createDocumentAnnouncementChannel({
            document: ownerDocument
        });

        return announcer;
    }

    function resetDismissal(): void {
        if (!dismissed) return;

        dismissed = false;
        element.removeAttribute("data-af-tooltip-dismissed");
    }

    function isActive(): boolean {
        return pointerOver || pointerOverTooltip || focusWithin;
    }

    function isVisualTarget(target: EventTarget | null): boolean {
        return target instanceof Node && visualContent?.contains(target) === true;
    }

    function isTriggerTarget(target: EventTarget | null): boolean {
        return target instanceof Node && element.contains(target);
    }

    function syncVisualVisibility(): void {
        if (!visualContent) return;

        if (!text || dismissed || !isActive()) {
            cancelPositionUpdate();
            visualContent.removeAttribute("data-af-tooltip-visible");
            visualContent.removeAttribute("data-af-tooltip-positioned");

            return;
        }

        visualContent.setAttribute("data-af-tooltip-visible", "");
        visualContent.removeAttribute("data-af-tooltip-positioned");
        scheduleVisualPositionUpdate();
    }

    function resetDismissalWhenInactive(): void {
        if (!isActive()) resetDismissal();
    }

    function dismiss(): void {
        if (!text) return;

        dismissed = true;
        element.setAttribute("data-af-tooltip-dismissed", "true");
        announcer?.clear();
        syncVisualVisibility();
    }

    function syncText(): void {
        if (text) {
            element.setAttribute("data-af-tooltip", "");

            const visual = ensureVisualContent();
            visual.textContent = text;
            visual.removeAttribute("data-af-tooltip-positioned");
            syncVisualVisibility();
        } else {
            element.removeAttribute("data-af-tooltip");
            element.removeAttribute("data-af-tooltip-dismissed");
            removeVisualContent();
        }

        if (descriptionContent) {
            descriptionContent.textContent = text ?? "";
        }
    }

    function syncDescription(): void {
        if (describe && text) {
            const content = ensureDescriptionContent();

            content.textContent = text;
            element.setAttribute(
                "aria-describedby",
                addAriaReferenceId(originalDescribedBy, content.id)
            );

            return;
        }

        removeDescriptionContent();
        restoreAttribute(element, "aria-describedby", originalDescribedBy);
    }

    function disposeListeners(): void {
        for (const cleanup of cleanups.splice(0)) {
            cleanup();
        }
    }

    function handlePointerEnter(event: PointerEvent): void {
        const wasActive = isActive();

        pointerOver = event.pointerType !== "touch";

        if (!pointerOver) return;

        if (!wasActive) {
            resetDismissal();
        }

        syncVisualVisibility();

        if (event.pointerType && event.pointerType !== "mouse") return;
        if (!announceOnHover) return;

        const message = getAnnouncementText();

        if (message) {
            getAnnouncer().announce(message);
        }
    }

    function handlePointerLeave(event: PointerEvent): void {
        pointerOver = false;
        pointerOverTooltip = isVisualTarget(event.relatedTarget);
        announcer?.clear();
        syncVisualVisibility();
        resetDismissalWhenInactive();
    }

    function handleVisualPointerEnter(): void {
        pointerOverTooltip = true;
        syncVisualVisibility();
    }

    function handleVisualPointerLeave(event: PointerEvent): void {
        pointerOverTooltip = false;
        pointerOver = isTriggerTarget(event.relatedTarget);
        announcer?.clear();
        syncVisualVisibility();
        resetDismissalWhenInactive();
    }

    function handleFocusIn(): void {
        const wasActive = isActive();

        focusWithin = true;

        if (!wasActive) {
            resetDismissal();
        }

        syncVisualVisibility();
    }

    function handleFocusOut(event: FocusEvent): void {
        const nextTarget = event.relatedTarget;

        if (nextTarget instanceof Node && element.contains(nextTarget)) {
            return;
        }

        focusWithin = false;
        announcer?.clear();
        syncVisualVisibility();
        resetDismissalWhenInactive();
    }

    function handleDocumentKeyDown(event: KeyboardEvent): void {
        if (
            event.defaultPrevented
            || !isEscapeKey(event)
            || !text
            || !isActive()
        ) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        dismiss();
    }

    cleanups = [
        addEventListener<PointerEvent>(element, "pointerenter", handlePointerEnter),
        addEventListener<PointerEvent>(element, "pointerleave", handlePointerLeave),
        addEventListener<FocusEvent>(element, "focusin", handleFocusIn),
        addEventListener<FocusEvent>(element, "focusout", handleFocusOut),
        addEventListener<KeyboardEvent>(
            ownerDocument,
            "keydown",
            handleDocumentKeyDown
        )
    ];

    syncText();
    syncDescription();

    return {
        setText(nextText: string | null): void {
            if (destroyed) return;

            text = normalizeText(nextText);
            syncText();
            syncDescription();

            if (!text) {
                announcer?.clear();
            }
        },

        getText(): string | null {
            return text;
        },

        setDescribe(nextDescribe: boolean): void {
            if (destroyed) return;

            describe = nextDescribe;
            syncDescription();
        },

        setAnnounceOnHover(nextAnnounceOnHover: boolean): void {
            if (destroyed) return;

            announceOnHover = nextAnnounceOnHover;

            if (!announceOnHover) {
                announcer?.clear();
            }
        },

        getContentElement(): HTMLElement | null {
            return descriptionContent;
        },

        destroy(): void {
            if (destroyed) return;

            destroyed = true;
            cancelPositionUpdate();
            disposeListeners();
            announcer?.destroy();
            removeDescriptionContent();
            removeVisualContent();

            restoreAttribute(element, "data-af-tooltip", originalTooltip);
            restoreAttribute(element, "data-af-tooltip-dismissed", originalDismissed);
            restoreAttribute(element, "aria-describedby", originalDescribedBy);
        }
    };
}
