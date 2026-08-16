import { addAriaReferenceId, getAriaReferencedText } from "../../../core/src/aria";
import { getOwnerWindow, restoreAttribute } from "../../../core/src/dom";
import { addEventListener, type Cleanup } from "../../../core/src/events";
import { createId } from "../../../core/src/id";
import { isEscapeKey } from "../../../core/src/keyboard";
import { createAnnouncer, type Announcer } from "../../../core/src/live-region";

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
    let announcer: Announcer | null = null;
    let cleanups: Cleanup[] = [];
    let destroyed = false;
    let dismissed = false;
    let positionFrame = 0;

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
        if (!visualContent || !text) return;

        visualContent.style.setProperty("--af-tooltip-shift-x", "0px");

        const ownerWindow = getOwnerWindow(element);
        const viewportPadding = 8;
        const rect = visualContent.getBoundingClientRect();
        const minLeft = viewportPadding;
        const maxRight = ownerWindow.innerWidth - viewportPadding;

        let shift = 0;

        if (rect.left < minLeft) {
            shift = minLeft - rect.left;
        } else if (rect.right > maxRight) {
            shift = maxRight - rect.right;
        }

        visualContent.style.setProperty("--af-tooltip-shift-x", `${shift}px`);
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
            if (visualContent.parentElement !== element) {
                element.append(visualContent);
            }

            return visualContent;
        }

        visualContent = ownerDocument.createElement("span");
        visualContent.setAttribute("aria-hidden", "true");
        visualContent.setAttribute("data-af-tooltip-visual", "");
        visualContent.textContent = text ?? "";

        element.append(visualContent);

        return visualContent;
    }

    function removeDescriptionContent(): void {
        descriptionContent?.remove();
        descriptionContent = null;
    }

    function removeVisualContent(): void {
        cancelPositionUpdate();
        visualContent?.remove();
        visualContent = null;
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

    function getAnnouncer(): Announcer {
        if (!announcer) {
            announcer = createAnnouncer({
                container: getContainer()
            });
        }

        return announcer;
    }

    function resetDismissal(): void {
        if (!dismissed) return;

        dismissed = false;
        element.removeAttribute("data-af-tooltip-dismissed");
    }

    function dismiss(): void {
        if (!text) return;

        dismissed = true;
        element.setAttribute("data-af-tooltip-dismissed", "true");
        announcer?.clear();
    }

    function syncText(): void {
        if (text) {
            element.setAttribute("data-af-tooltip", "");

            const visual = ensureVisualContent();
            visual.textContent = text;
            scheduleVisualPositionUpdate();
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
        resetDismissal();
        scheduleVisualPositionUpdate();

        if (event.pointerType && event.pointerType !== "mouse") {
            return;
        }

        if (!announceOnHover) {
            return;
        }

        const message = getAnnouncementText();

        if (message) {
            getAnnouncer().announce(message);
        }
    }

    function handleKeyDown(event: KeyboardEvent): void {
        if (!isEscapeKey(event) || !text) return;

        event.preventDefault();
        event.stopPropagation();
        dismiss();
    }

    cleanups = [
        addEventListener<PointerEvent>(element, "pointerenter", handlePointerEnter),
        addEventListener<PointerEvent>(element, "pointerleave", () => {
            announcer?.clear();
            resetDismissal();
        }),
        addEventListener<FocusEvent>(element, "focusin", () => {
            resetDismissal();
            scheduleVisualPositionUpdate();
        }),
        addEventListener<FocusEvent>(element, "focusout", () => {
            announcer?.clear();
            resetDismissal();
        }),
        addEventListener<KeyboardEvent>(element, "keydown", handleKeyDown)
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
