import type { Component } from "../foundation";
import type { LiveRegionPoliteness } from "../../../core/src/live-region";

/**
 * Visual variant for a disclosure.
 */
export type DisclosureVariant = "default" | "plain";

/**
 * Disclosure size token.
 */
export type DisclosureSize = "md";

/**
 * Context passed to disclosure announcement message functions.
 */
export interface DisclosureAnnouncementContext {
    readonly element: HTMLElement;
    readonly trigger: HTMLElement;
    readonly panel: HTMLElement;
    readonly open: boolean;
    getPanelText(): string;
}

/**
 * Static or dynamic message announced when a disclosure opens.
 */
export type DisclosureAnnouncementMessage =
    | string
    | ((context: DisclosureAnnouncementContext) => string | null | undefined);

/**
 * Live-region announcement options for disclosure open events.
 */
export interface DisclosureAnnouncementOptions {
    enabled?: boolean;
    message?: DisclosureAnnouncementMessage;
    politeness?: LiveRegionPoliteness;
}

/**
 * Announcement configuration for disclosure open events.
 */
export type DisclosureAnnouncement =
    | boolean
    | DisclosureAnnouncementMessage
    | DisclosureAnnouncementOptions;

/**
 * Options for createDisclosure().
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
 * Options accepted by disclosure.update().
 *
 * trigger, panel, and defaultOpen are creation-time options.
 */
export interface DisclosureUpdateOptions
    extends Partial<Omit<DisclosureOptions, "trigger" | "panel" | "defaultOpen">> {}

/**
 * Disclosure behavior controller returned by createDisclosure().
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
    update(options: DisclosureUpdateOptions): void;
}
