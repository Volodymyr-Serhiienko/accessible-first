import { restoreAttribute } from "../../../core/src/dom";
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

function getReferencedText(element: HTMLElement, attribute: string): string {
    const value = element.getAttribute(attribute);
    if (!value) return "";

    return value
        .split(/\s+/)
        .map((id) => element.ownerDocument.getElementById(id)?.textContent?.trim() ?? "")
        .filter(Boolean)
        .join(" ")
        .trim();
}

function joinIdReferences(current: string | null, id: string): string {
    const ids = new Set((current ?? "").split(/\s+/).filter(Boolean));
    ids.add(id);

    return Array.from(ids).join(" ");
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

    function getTooltipId(): string {
        if (!tooltipId) {
            tooltipId = createId("af-tooltip");
        }

        return tooltipId;
    }

    function getContainer(): HTMLElement {
        return ownerDocument.body ?? ownerDocument.documentElement;
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
        if (visualContent) return visualContent;

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
        visualContent?.remove();
        visualContent = null;
    }

    function getAnnouncementText(): string {
        return (
            text
            || element.getAttribute("aria-label")?.trim()
            || getReferencedText(element, "aria-labelledby")
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
            ensureVisualContent().textContent = text;
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
                joinIdReferences(originalDescribedBy, content.id)
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
        addEventListener<FocusEvent>(element, "focusin", () => resetDismissal()),
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
