import { getOwnerDocument, getOwnerWindow, isHTMLElement } from "../dom";
import { captureInlineStyles } from "../dom/captureInlineStyles";
import { addEventListener, type Cleanup } from "../events";
import type {
    PopoverPosition,
    PopoverPositionAlignment,
    PopoverPositionOptions,
    PopoverPositionSide,
    PopoverPositionState
} from "./types";

function getOppositeSide(side: PopoverPositionSide): PopoverPositionSide {
    if (side === "top") return "bottom";
    if (side === "bottom") return "top";
    if (side === "left") return "right";

    return "left";
}

function clamp(value: number, min: number, max: number): number {
    if (max < min) {
        return min;
    }

    return Math.min(Math.max(value, min), max);
}

function getAvailableSpace(
    anchorRect: DOMRect,
    side: PopoverPositionSide,
    viewportWidth: number,
    viewportHeight: number,
    padding: number
): number {
    if (side === "top") {
        return anchorRect.top - padding;
    }

    if (side === "bottom") {
        return viewportHeight - anchorRect.bottom - padding;
    }

    if (side === "left") {
        return anchorRect.left - padding;
    }

    return viewportWidth - anchorRect.right - padding;
}

function getMainSize(
    popoverRect: DOMRect,
    side: PopoverPositionSide
): number {
    return side === "top" || side === "bottom"
        ? popoverRect.height
        : popoverRect.width;
}

function resolveSide(
    anchorRect: DOMRect,
    popoverRect: DOMRect,
    preferredSide: PopoverPositionSide,
    viewportWidth: number,
    viewportHeight: number,
    offset: number,
    padding: number,
    flip: boolean
): PopoverPositionSide {
    if (!flip) {
        return preferredSide;
    }

    const oppositeSide = getOppositeSide(preferredSide);
    const preferredSpace = getAvailableSpace(
        anchorRect,
        preferredSide,
        viewportWidth,
        viewportHeight,
        padding
    );
    const oppositeSpace = getAvailableSpace(
        anchorRect,
        oppositeSide,
        viewportWidth,
        viewportHeight,
        padding
    );
    const requiredSpace = getMainSize(popoverRect, preferredSide) + offset;

    if (preferredSpace >= requiredSpace || preferredSpace >= oppositeSpace) {
        return preferredSide;
    }

    return oppositeSide;
}

function getAlignedX(
    anchorRect: DOMRect,
    popoverRect: DOMRect,
    side: PopoverPositionSide,
    alignment: PopoverPositionAlignment,
    crossAxisOffset: number
): number {
    if (side === "left") {
        return anchorRect.left - popoverRect.width;
    }

    if (side === "right") {
        return anchorRect.right;
    }

    if (alignment === "start") {
        return anchorRect.left + crossAxisOffset;
    }

    if (alignment === "end") {
        return anchorRect.right - popoverRect.width + crossAxisOffset;
    }

    return anchorRect.left + (anchorRect.width - popoverRect.width) / 2 + crossAxisOffset;
}

function getAlignedY(
    anchorRect: DOMRect,
    popoverRect: DOMRect,
    side: PopoverPositionSide,
    alignment: PopoverPositionAlignment,
    crossAxisOffset: number
): number {
    if (side === "top") {
        return anchorRect.top - popoverRect.height;
    }

    if (side === "bottom") {
        return anchorRect.bottom;
    }

    if (alignment === "start") {
        return anchorRect.top + crossAxisOffset;
    }

    if (alignment === "end") {
        return anchorRect.bottom - popoverRect.height + crossAxisOffset;
    }

    return anchorRect.top + (anchorRect.height - popoverRect.height) / 2 + crossAxisOffset;
}

function getPosition(
    anchorRect: DOMRect,
    popoverRect: DOMRect,
    side: PopoverPositionSide,
    alignment: PopoverPositionAlignment,
    offset: number,
    crossAxisOffset: number
): { x: number; y: number } {
    let x = getAlignedX(anchorRect, popoverRect, side, alignment, crossAxisOffset);
    let y = getAlignedY(anchorRect, popoverRect, side, alignment, crossAxisOffset);

    if (side === "top") y -= offset;
    if (side === "bottom") y += offset;
    if (side === "left") x -= offset;
    if (side === "right") x += offset;

    return { x, y };
}

/**
 * Creates positioning behavior for a floating element.
 *
 * The behavior places a popover relative to an anchor, supports collision flip
 * and shift, can match anchor width, and restores inline styles on destroy.
 */
export function createPopoverPosition(
    anchor: HTMLElement,
    popover: HTMLElement,
    options: PopoverPositionOptions = {}
): PopoverPosition {
    const ownerWindow = getOwnerWindow(anchor);
    const ownerDocument = getOwnerDocument(anchor);

    const side = options.side ?? "bottom";
    const alignment = options.alignment ?? "start";
    const strategy = options.strategy ?? "fixed";
    const offset = options.offset ?? 4;
    const crossAxisOffset = options.crossAxisOffset ?? 0;
    const collisionPadding = options.collisionPadding ?? 8;
    const flip = options.flip ?? true;
    const shift = options.shift ?? true;
    const autoUpdate = options.autoUpdate ?? true;

    const restoreStyles = captureInlineStyles(popover, ["position", "left", "top", "min-width"]);

    let state: PopoverPositionState | null = null;
    let destroyed = false;
    let pendingUpdateFrame: number | null = null;

    function update(): PopoverPositionState {
        if (destroyed) {
            return state ?? {
                side,
                alignment,
                x: 0,
                y: 0
            };
        }

        popover.style.position = strategy;
        const anchorRect = anchor.getBoundingClientRect();

        if (options.matchAnchorWidth) {
            popover.style.minWidth = `${anchorRect.width}px`;
        }

        const popoverRect = popover.getBoundingClientRect();
        const root = ownerDocument.documentElement;
        const viewportWidth = root?.clientWidth || ownerWindow.innerWidth;
        const viewportHeight = root?.clientHeight || ownerWindow.innerHeight;

        const resolvedSide = resolveSide(
            anchorRect,
            popoverRect,
            side,
            viewportWidth,
            viewportHeight,
            offset,
            collisionPadding,
            flip
        );

        const rtl = ownerWindow.getComputedStyle(anchor).direction === "rtl";
        const physicalAlignment = rtl && (resolvedSide === "top" || resolvedSide === "bottom")
            ? alignment === "start" ? "end" : alignment === "end" ? "start" : alignment
            : alignment;
        let { x, y } = getPosition(
            anchorRect,
            popoverRect,
            resolvedSide,
            physicalAlignment,
            offset,
            crossAxisOffset
        );

        if (shift) {
            x = clamp(
                x,
                collisionPadding,
                viewportWidth - popoverRect.width - collisionPadding
            );
            y = clamp(
                y,
                collisionPadding,
                viewportHeight - popoverRect.height - collisionPadding
            );
        }

        let localX = x;
        let localY = y;
        if (strategy === "absolute") {
            const parent = popover.offsetParent;
            const staticBody = parent === ownerDocument.body && ownerWindow.getComputedStyle(parent).position === "static";
            if (isHTMLElement(parent) && !staticBody) {
                const parentRect = parent.getBoundingClientRect();
                localX += parent.scrollLeft - parentRect.left - parent.clientLeft;
                localY += parent.scrollTop - parentRect.top - parent.clientTop;
            } else {
                localX += ownerWindow.scrollX;
                localY += ownerWindow.scrollY;
            }
        }
        popover.style.left = `${localX}px`;
        popover.style.top = `${localY}px`;

        state = {
            side: resolvedSide,
            alignment,
            x,
            y
        };

        return state;
    }

    function scheduleUpdate(): void {
        if (destroyed || pendingUpdateFrame !== null) {
            return;
        }

        pendingUpdateFrame = ownerWindow.requestAnimationFrame(() => {
            pendingUpdateFrame = null;
            update();
        });
    }

    const cleanups: Cleanup[] = [];

    if (autoUpdate) {
        const scrollOptions: AddEventListenerOptions = {
            capture: true,
            passive: true
        };

        cleanups.push(
            addEventListener<Event>(ownerWindow, "resize", scheduleUpdate),
            addEventListener<Event>(ownerWindow, "scroll", scheduleUpdate, true),
            addEventListener<Event>(ownerDocument, "scroll", scheduleUpdate, true),
            addEventListener<WheelEvent>(ownerWindow, "wheel", scheduleUpdate, scrollOptions),
            addEventListener<TouchEvent>(ownerWindow, "touchmove", scheduleUpdate, scrollOptions)
        );
    }

    update();

    return {
        update,

        getState(): PopoverPositionState | null {
            return state;
        },

        destroy(): void {
            if (destroyed) {
                return;
            }

            destroyed = true;

            if (pendingUpdateFrame !== null) {
                ownerWindow.cancelAnimationFrame(pendingUpdateFrame);
                pendingUpdateFrame = null;
            }

            for (const cleanup of cleanups) {
                cleanup();
            }

            restoreStyles();
        }
    };
}
