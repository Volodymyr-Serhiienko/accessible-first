import type { DismissableLayerEvent } from "../../../core/src/dismissable-layer";
import type { OverlayStack } from "../../../core/src/overlay-stack";
import type {
    PopoverPositionAlignment,
    PopoverPositionOptions,
    PopoverPositionSide,
    PopoverPositionState,
    PopoverPositionStrategy
} from "../../../core/src/popover-position";
import type { Component } from "../foundation";
import type { LiveRegionPoliteness } from "../../../core/src/live-region";

/**
 * Visual variant for popover content.
 */
export type PopoverVariant = "default" | "plain";

/**
 * Popover size token.
 */
export type PopoverSize = "md";

/**
 * ARIA role optionally applied to popover content.
 */
export type PopoverRole = "dialog" | "menu" | "listbox" | "tree" | "grid" | null;

/**
 * aria-haspopup value optionally applied to the trigger.
 */
export type PopoverHasPopup = true | "dialog" | "menu" | "listbox" | "tree" | "grid" | null;

/**
 * Context passed to popover announcement message functions.
 */
export interface PopoverAnnouncementContext {
    readonly content: HTMLElement;
    readonly trigger: HTMLElement | null;
    readonly open: boolean;
    getContentText(): string;
}

/**
 * Static or dynamic message announced when a popover opens.
 */
export type PopoverAnnouncementMessage =
    | string
    | ((context: PopoverAnnouncementContext) => string | null | undefined);

/**
 * Live-region announcement options for popover open events.
 */
export interface PopoverAnnouncementOptions {
    enabled?: boolean;
    message?: PopoverAnnouncementMessage;
    politeness?: LiveRegionPoliteness;
}

/**
 * Announcement configuration for popover open events.
 */
export type PopoverAnnouncement =
    | boolean
    | PopoverAnnouncementMessage
    | PopoverAnnouncementOptions;

/**
 * Placement side for popover positioning.
 */
export type PopoverSide = PopoverPositionSide;

/**
 * Cross-axis alignment for popover positioning.
 */
export type PopoverAlignment = PopoverPositionAlignment;

/**
 * CSS positioning strategy used by popover positioning.
 */
export type PopoverStrategy = PopoverPositionStrategy;

/**
 * Details passed when popover open state changes.
 */
export interface PopoverOpenChangeDetail {
    open: boolean;
    trigger: HTMLElement | null;
    content: HTMLElement;
}

/**
 * Called when popover opens or closes.
 */
export type PopoverOnOpenChange = (
    detail: PopoverOpenChangeDetail,
    popover: Popover
) => void;

/**
 * Options for createPopover().
 */
export interface PopoverOptions extends PopoverPositionOptions {
    trigger?: HTMLElement | null;
    contentId?: string | null;
    open?: boolean;
    defaultOpen?: boolean;
    disabled?: boolean;
    restoreFocus?: boolean;
    closeOnAnchorHidden?: boolean;
    role?: PopoverRole;
    hasPopup?: PopoverHasPopup;
    labelledBy?: string | null;
    describedBy?: string | null;
    dismissOnEscape?: boolean;
    dismissOnPointerDownOutside?: boolean;
    dismissOnFocusOutside?: boolean;
    useOverlayStack?: boolean;
    overlayStack?: OverlayStack;
    variant?: PopoverVariant;
    size?: PopoverSize;
    announcement?: PopoverAnnouncement;
    onEscapeKeyDown?: ((event: DismissableLayerEvent<KeyboardEvent>) => void) | null;
    onPointerDownOutside?: ((event: DismissableLayerEvent<PointerEvent>) => void) | null;
    onFocusOutside?: ((event: DismissableLayerEvent<FocusEvent>) => void) | null;
    onOpenChange?: PopoverOnOpenChange | null;
}

/**
 * Options accepted by popover.update().
 *
 * defaultOpen is creation-time only.
 */
export interface PopoverUpdateOptions
    extends Partial<Omit<PopoverOptions, "defaultOpen" | "useOverlayStack" | "overlayStack">> {}

/**
 * Popover component controller returned by createPopover().
 */
export interface Popover extends Component {
    readonly content: HTMLElement;
    readonly trigger: HTMLElement | null;
    open(): void;
    close(): void;
    toggle(): void;
    setOpen(open: boolean): void;
    isOpen(): boolean;
    setDisabled(disabled: boolean): void;
    isDisabled(): boolean;
    updatePosition(): PopoverPositionState | null;
    getPositionState(): PopoverPositionState | null;
    update(options: PopoverUpdateOptions): void;
}
