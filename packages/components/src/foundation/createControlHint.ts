import { addAriaReferenceId, removeAriaReferenceId } from "../../../core/src/aria";
import { restoreAttribute } from "../../../core/src/dom";
import { createId } from "../../../core/src/id";
import { createTooltip, type Tooltip } from "../tooltip/createTooltip";

/**
 * Controls how a hint is exposed to users.
 */
export type ControlHintDisplay = "description" | "tooltip" | "both" | "none";

/**
 * Options for createControlHint().
 */
export interface ControlHintOptions {
    hint?: string | null;
    hintId?: string;
    hintDisplay?: ControlHintDisplay;
    hintAnnounceOnHover?: boolean;
}

/**
 * Options accepted by ControlHint.update().
 */
export interface ControlHintUpdateOptions extends Partial<ControlHintOptions> {}

/**
 * Shared hint controller for simple interactive controls.
 */
export interface ControlHint {
    setHint(hint: string | null): void;
    getHint(): string | null;
    setHintDisplay(display: ControlHintDisplay): void;
    setAnnounceOnHover(announceOnHover: boolean): void;
    update(options: ControlHintUpdateOptions): void;
    refresh(): void;
    destroy(): void;
}

function normalizeText(value: string | null | undefined): string | null {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
}

function visuallyHide(element: HTMLElement): void {
    element.style.position = "absolute";
    element.style.width = "1px";
    element.style.height = "1px";
    element.style.margin = "-1px";
    element.style.padding = "0";
    element.style.border = "0";
    element.style.overflow = "hidden";
    element.style.clip = "rect(0 0 0 0)";
    element.style.clipPath = "inset(50%)";
    element.style.whiteSpace = "nowrap";
}

/**
 * Adds a shared hint to a control.
 *
 * The hint can be exposed as aria-describedby, as a visual tooltip, or both.
 */
export function createControlHint(
    element: HTMLElement,
    options: ControlHintOptions = {}
): ControlHint {
    const ownerDocument = element.ownerDocument;
    const originalDescribedBy = element.getAttribute("aria-describedby");

    let hint = normalizeText(options.hint);
    let hintId = options.hintId ?? "";
    let hintDisplay: ControlHintDisplay = options.hintDisplay ?? "description";
    let hintAnnounceOnHover = options.hintAnnounceOnHover ?? false;
    let descriptionElement: HTMLElement | null = null;
    let destroyed = false;

    const tooltip: Tooltip = createTooltip(element, {
        text: null,
        describe: false,
        announceOnHover: hintAnnounceOnHover
    });

    function shouldUseDescription(): boolean {
        return hintDisplay === "description" || hintDisplay === "both";
    }

    function shouldUseTooltip(): boolean {
        return hintDisplay === "tooltip" || hintDisplay === "both";
    }

    function getHintId(): string {
        if (!hintId) {
            hintId = createId("af-control-hint");
        }

        return hintId;
    }

    function getContainer(): HTMLElement {
        return ownerDocument.body ?? ownerDocument.documentElement;
    }

    function ensureDescriptionElement(): HTMLElement {
        if (descriptionElement) return descriptionElement;

        descriptionElement = ownerDocument.createElement("span");
        descriptionElement.id = getHintId();
        descriptionElement.setAttribute("data-af-control-hint", "");
        visuallyHide(descriptionElement);
        getContainer().append(descriptionElement);

        return descriptionElement;
    }

    function removeDescriptionElement(): void {
        descriptionElement?.remove();
        descriptionElement = null;
    }

    function syncTooltip(): void {
        tooltip.setAnnounceOnHover(hintAnnounceOnHover);
        tooltip.setText(shouldUseTooltip() ? hint : null);
    }

    function syncDescription(): void {
        if (shouldUseDescription() && hint) {
            const description = ensureDescriptionElement();
            const current = removeAriaReferenceId(
                element.getAttribute("aria-describedby"),
                description.id
            );

            description.textContent = hint;
            element.setAttribute("aria-describedby", addAriaReferenceId(current, description.id));
            return;
        }

        if (descriptionElement) {
            const current = removeAriaReferenceId(
                element.getAttribute("aria-describedby"),
                descriptionElement.id
            );

            if (current) {
                element.setAttribute("aria-describedby", current);
            } else {
                restoreAttribute(element, "aria-describedby", originalDescribedBy);
            }
        }

        removeDescriptionElement();
    }

    function sync(): void {
        syncTooltip();
        syncDescription();
    }

    sync();

    return {
        setHint(nextHint): void {
            if (destroyed) return;

            hint = normalizeText(nextHint);
            sync();
        },

        getHint(): string | null {
            return hint;
        },

        setHintDisplay(display): void {
            if (destroyed) return;

            hintDisplay = display;
            sync();
        },

        setAnnounceOnHover(announceOnHover): void {
            if (destroyed) return;

            hintAnnounceOnHover = announceOnHover;
            sync();
        },

        update(nextOptions): void {
            if (destroyed) return;

            if ("hint" in nextOptions) hint = normalizeText(nextOptions.hint);
            if (nextOptions.hintId !== undefined) hintId = nextOptions.hintId;
            if (nextOptions.hintDisplay !== undefined) hintDisplay = nextOptions.hintDisplay;
            if (nextOptions.hintAnnounceOnHover !== undefined) {
                hintAnnounceOnHover = nextOptions.hintAnnounceOnHover;
            }

            sync();
        },

        refresh(): void {
            if (destroyed) return;
            sync();
        },

        destroy(): void {
            if (destroyed) return;

            destroyed = true;
            tooltip.destroy();
            removeDescriptionElement();
            restoreAttribute(element, "aria-describedby", originalDescribedBy);
        }
    };
}
