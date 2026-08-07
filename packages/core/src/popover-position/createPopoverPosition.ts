import { getOwnerWindow } from "../dom";
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

    const side = options.side ?? "bottom";
    const alignment = options.alignment ?? "start";
    const strategy = options.strategy ?? "fixed";
    const offset = options.offset ?? 4;
    const crossAxisOffset = options.crossAxisOffset ?? 0;
    const collisionPadding = options.collisionPadding ?? 8;
    const flip = options.flip ?? true;
    const shift = options.shift ?? true;
    const autoUpdate = options.autoUpdate ?? true;

    const originalPosition = popover.style.position;
    const originalLeft = popover.style.left;
    const originalTop = popover.style.top;
    const originalMinWidth = popover.style.minWidth;

    let state: PopoverPositionState | null = null;
    let destroyed = false;

    function update(): PopoverPositionState {
        if (destroyed) {
            return state ?? {
                side,
                alignment,
                x: 0,
                y: 0
            };
        }

        const anchorRect = anchor.getBoundingClientRect();

        if (options.matchAnchorWidth) {
            popover.style.minWidth = `${anchorRect.width}px`;
        }

        const popoverRect = popover.getBoundingClientRect();
        const viewportWidth = ownerWindow.innerWidth;
        const viewportHeight = ownerWindow.innerHeight;

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

        let { x, y } = getPosition(
            anchorRect,
            popoverRect,
            resolvedSide,
            alignment,
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

        const scrollX = strategy === "absolute" ? ownerWindow.scrollX : 0;
        const scrollY = strategy === "absolute" ? ownerWindow.scrollY : 0;

        popover.style.position = strategy;
        popover.style.left = `${x + scrollX}px`;
        popover.style.top = `${y + scrollY}px`;

        state = {
            side: resolvedSide,
            alignment,
            x,
            y
        };

        return state;
    }

    const cleanups: Cleanup[] = [];

    if (autoUpdate) {
        cleanups.push(
            addEventListener(ownerWindow, "resize", update),
            addEventListener(ownerWindow, "scroll", update, true)
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

            for (const cleanup of cleanups) {
                cleanup();
            }

            popover.style.position = originalPosition;
            popover.style.left = originalLeft;
            popover.style.top = originalTop;
            popover.style.minWidth = originalMinWidth;
        }
    };
}
