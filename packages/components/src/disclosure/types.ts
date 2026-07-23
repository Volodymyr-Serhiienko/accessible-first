import type { Component } from "../foundation";
import type { LiveRegionPoliteness } from "../../../core/src/live-region";

/**
 * Defines the presentation or layout rendering mode variations for a disclosure container.
 */
export type DisclosureVariant = "default" | "plain";

/**
 * Defines the spacing, layout padding, or dimensional size constraint of a disclosure block.
 */
export type DisclosureSize = "md";

/**
 * Contextual state and element payload supplied to dynamic screen reader announcement generators
 * when a disclosure component changes its visibility state.
 */
export interface DisclosureAnnouncementContext {
    readonly element: HTMLElement;
    readonly trigger: HTMLElement;
    readonly panel: HTMLElement;
    readonly open: boolean;
    getPanelText(): string;
}

/**
 * Announcement payload defining either a static string message or a dynamic factory function
 * computing a custom announcement message based on disclosure context.
 */
export type DisclosureAnnouncementMessage =
    | string
    | ((context: DisclosureAnnouncementContext) => string | null | undefined);

/**
 * Detailed configuration options governing live region announcements during disclosure state updates.
 */
export interface DisclosureAnnouncementOptions {
    enabled?: boolean;
    message?: DisclosureAnnouncementMessage;
    politeness?: LiveRegionPoliteness;
}

/**
 * Flexible configuration input permitting a simple toggle boolean, a direct message payload,
 * or a fully explicit options object for managing disclosure accessibility announcements.
 */
export type DisclosureAnnouncement =
    | boolean
    | DisclosureAnnouncementMessage
    | DisclosureAnnouncementOptions;

/**
 * Configuration options utilized to instantiate an accessible structural disclosure component.
 */
export interface DisclosureOptions {
    trigger: HTMLElement;
    panel: HTMLElement;
    defaultOpen?: boolean;
    open?: boolean;
    disabled?: boolean;
    variant?: DisclosureVariant;
    size?: DisclosureSize;
    announcement?: DisclosureAnnouncement;
    onOpenChange?: ((open: boolean) => void) | null;
}

/**
 * Interface representing an accessible interactive disclosure accordion component.
 * Synchronizes visibility states (`aria-expanded`) and structural relationships (`aria-controls`) 
 * seamlessly across custom trigger elements and text panel nodes.
 */
export interface Disclosure extends Component {
    readonly trigger: HTMLElement;
    readonly panel: HTMLElement;
    open(): void;
    close(): void;
    toggle(): void;
    setOpen(open: boolean): void;
    isOpen(): boolean;
    setDisabled(disabled: boolean): void;
    isDisabled(): boolean;
    update(options: Partial<DisclosureOptions>): void;
}
