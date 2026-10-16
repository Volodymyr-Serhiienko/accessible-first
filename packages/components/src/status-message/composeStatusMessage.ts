import {
    applyCompositionElementOptions,
    createContentSlot,
    createElement,
    getCompositionElementOptions,
    getElementText,
    hasCompositionContent,
    toCompositionChildren,
    type BaseCompositionOptions,
    type ComposedNode,
    type CompositionChild,
    type CompositionContent
} from "../composition";
import {
    createActionAnnouncer,
    type ActionAnnouncer,
    type ActionAnnouncementPoliteness
} from "../foundation";
import { runCleanups } from "../../../core/src/events";

/**
 * Content accepted by StatusMessage slots.
 */
export type StatusMessageCompositionContent = CompositionContent;

/**
 * Visual meaning of StatusMessage.
 */
export type StatusMessageVariant = "neutral" | "info" | "success" | "warning" | "danger";

/**
 * StatusMessage size token.
 */
export type StatusMessageSize = "md";

/**
 * Position of the optional status icon.
 */
export type StatusMessageIconPosition = "start" | "end";

/**
 * Spoken feedback for a status update.
 */
export type StatusMessageAnnouncement =
    | boolean
    | string
    | ((detail: StatusMessageAnnouncementDetail) => string | null | undefined);

/**
 * Detail passed to custom StatusMessage announcement resolvers.
 */
export interface StatusMessageAnnouncementDetail {
    readonly variant: StatusMessageVariant;
    readonly text: string;
    readonly element: HTMLDivElement;
}

/**
 * Options for StatusMessage setText() and setContent().
 */
export interface StatusMessageSetOptions {
    hidden?: boolean;
    announcement?: StatusMessageAnnouncement;
    announcementPoliteness?: ActionAnnouncementPoliteness;
}

/**
 * Options for StatusMessage().
 */
export interface StatusMessageOptions extends BaseCompositionOptions {
    text?: string | null;
    children?: CompositionChild[];
    icon?: StatusMessageCompositionContent | null;
    iconPosition?: StatusMessageIconPosition;
    variant?: StatusMessageVariant;
    size?: StatusMessageSize;
    hidden?: boolean;
    announcement?: StatusMessageAnnouncement;
    announcementPoliteness?: ActionAnnouncementPoliteness;
    announcer?: ActionAnnouncer | null;
    iconOptions?: BaseCompositionOptions;
    contentOptions?: BaseCompositionOptions;
}

/**
 * Options accepted by ComposedStatusMessage.update().
 */
export interface StatusMessageUpdateOptions extends Partial<StatusMessageOptions> {}

/**
 * StatusMessage created by the composition API.
 */
export interface ComposedStatusMessage extends ComposedNode<HTMLDivElement> {
    readonly element: HTMLDivElement;
    readonly icon: HTMLElement;
    readonly content: HTMLElement;
    getText(): string;
    setText(text: string | null, options?: StatusMessageSetOptions): void;
    setContent(content: StatusMessageCompositionContent | null, options?: StatusMessageSetOptions): void;
    setIcon(content: StatusMessageCompositionContent | null): void;
    show(): void;
    hide(): void;
    announce(message?: string | null, politeness?: ActionAnnouncementPoliteness): void;
    update(options: StatusMessageUpdateOptions): void;
    destroy(): void;
}

type StatusMessageSlotContent = Exclude<StatusMessageCompositionContent, undefined> | null;

function normalizeSlotContent(
    content: StatusMessageCompositionContent | null | undefined
): StatusMessageSlotContent {
    return content === undefined ? null : content;
}

function getInitialContent(options: StatusMessageOptions): CompositionChild[] {
    if (options.children !== undefined) return options.children;
    if (options.text !== undefined && options.text !== null) return [options.text];

    return [];
}

function getTrimmedMessage(message: string | null | undefined): string | null {
    const text = message?.trim() ?? "";

    return text ? text : null;
}

/**
 * Creates visible inline feedback with optional one-shot screen reader announcement.
 */
export function StatusMessage(options: StatusMessageOptions = {}): ComposedStatusMessage {
    const initialChildren = getInitialContent(options);

    const element = createElement("div", getCompositionElementOptions(options, {
        "data-af-composition": "status-message"
    }));

    const icon = createElement("span", getCompositionElementOptions(options.iconOptions, {
        "data-af-status-message-icon": "",
        "aria-hidden": "true"
    }));

    const content = createElement("span", getCompositionElementOptions(options.contentOptions, {
        "data-af-status-message-content": ""
    }));

    let variant: StatusMessageVariant = options.variant ?? "neutral";
    let size: StatusMessageSize = options.size ?? "md";
    let iconPosition: StatusMessageIconPosition = options.iconPosition ?? "start";
    let iconContent: StatusMessageSlotContent = normalizeSlotContent(options.icon);
    let hasIcon = hasCompositionContent(iconContent);
    let hasContent = hasCompositionContent(initialChildren);
    let hidden = options.hidden !== undefined ? options.hidden : !hasContent;
    let announcementPoliteness: ActionAnnouncementPoliteness = options.announcementPoliteness ?? "polite";
    let providedAnnouncer: ActionAnnouncer | null = options.announcer ?? null;
    let ownedAnnouncer: ActionAnnouncer | null = null;
    let destroyed = false;
    let revision = 0;
    let announcementRevision = 0;

    const iconSlot = createContentSlot(icon, toCompositionChildren(iconContent));
    const contentSlot = createContentSlot(content, initialChildren);

    element.append(icon, content);

    function getAnnouncer(): ActionAnnouncer {
        if (providedAnnouncer) return providedAnnouncer;

        ownedAnnouncer ??= createActionAnnouncer({ container: element.ownerDocument.body ?? element.ownerDocument.documentElement });

        return ownedAnnouncer;
    }

    function getAnnouncementDetail(): StatusMessageAnnouncementDetail {
        return {
            variant,
            text: getElementText(content),
            element
        };
    }

    function getAnnouncementMessage(announcement: StatusMessageAnnouncement | null | undefined): string | null {
        if (announcement === null || announcement === undefined || announcement === false) return null;

        const detail = getAnnouncementDetail();

        if (announcement === true) return getTrimmedMessage(detail.text);
        if (typeof announcement === "function") return getTrimmedMessage(announcement(detail));

        return getTrimmedMessage(announcement);
    }

    function announceWith(
        announcement: StatusMessageAnnouncement | null | undefined,
        politeness: ActionAnnouncementPoliteness | undefined = announcementPoliteness
    ): void {
        if (destroyed) return;
        const current = revision;
        const delivery = ++announcementRevision;
        const message = getAnnouncementMessage(announcement);

        if (!message || destroyed || current !== revision || delivery !== announcementRevision) return;

        getAnnouncer().announce(message, {
            politeness
        });
    }

    function sync(): void {
        if (destroyed) return;
        element.setAttribute("data-af-composition", "status-message");
        element.setAttribute("data-af-variant", variant);
        element.setAttribute("data-af-size", size);
        element.setAttribute("data-af-icon-position", iconPosition);

        icon.setAttribute("data-af-status-message-icon", "");
        icon.setAttribute("aria-hidden", "true");
        content.setAttribute("data-af-status-message-content", "");

        icon.hidden = !hasIcon;
        element.hidden = hidden;
    }

    function setIcon(nextContent: StatusMessageCompositionContent | null): void {
        update({ icon: nextContent });
    }

    function setContent(
        nextContent: StatusMessageCompositionContent | null,
        setOptions: StatusMessageSetOptions = {}
    ): void {
        update({ ...setOptions, children: toCompositionChildren(normalizeSlotContent(nextContent)) });
    }

    function setText(text: string | null, setOptions: StatusMessageSetOptions = {}): void {
        setContent(text, setOptions);
    }

    function update(nextOptions: StatusMessageUpdateOptions): void {
        if (destroyed) return;
        const current = ++revision;
        applyCompositionElementOptions(element, nextOptions);
        if (nextOptions.iconOptions !== undefined) applyCompositionElementOptions(icon, nextOptions.iconOptions);
        if (nextOptions.contentOptions !== undefined) applyCompositionElementOptions(content, nextOptions.contentOptions);
        if (nextOptions.variant !== undefined) variant = nextOptions.variant;
        if (nextOptions.size !== undefined) size = nextOptions.size;
        if (nextOptions.iconPosition !== undefined) iconPosition = nextOptions.iconPosition;
        if (nextOptions.announcementPoliteness !== undefined) announcementPoliteness = nextOptions.announcementPoliteness;
        if ("announcer" in nextOptions) providedAnnouncer = nextOptions.announcer ?? null;
        if ("hidden" in nextOptions) hidden = nextOptions.hidden ?? false;
        runCleanups([
            () => {
                if (destroyed || current !== revision || !("icon" in nextOptions)) return;
                iconContent = normalizeSlotContent(nextOptions.icon);
                hasIcon = hasCompositionContent(iconContent);
                iconSlot.set(toCompositionChildren(iconContent));
            },
            () => {
                if (destroyed || current !== revision) return;
                if (nextOptions.children === undefined && !("text" in nextOptions)) return;
                const children = getInitialContent(nextOptions);
                hasContent = hasCompositionContent(children);
                if (!("hidden" in nextOptions)) hidden = !hasContent;
                contentSlot.set(children);
            },
            sync,
            () => {
                if (!destroyed && current === revision && "announcement" in nextOptions) {
                    announceWith(nextOptions.announcement, nextOptions.announcementPoliteness);
                }
            }
        ]);
    }

    function destroy(): void {
        if (destroyed) return;
        destroyed = true;
        revision += 1;
        const announcer = ownedAnnouncer;
        ownedAnnouncer = null;
        runCleanups([iconSlot.dispose, contentSlot.dispose, () => announcer?.destroy()]);
    }

    try {
        sync();
        if ("announcement" in options) announceWith(options.announcement);
    } catch (error) {
        runCleanups([() => { throw error; }, destroy]);
    }

    return {
        element,
        icon,
        content,

        getText(): string {
            return getElementText(content);
        },

        setText,
        setContent,
        setIcon,

        show(): void {
            update({ hidden: false });
        },

        hide(): void {
            update({ hidden: true });
        },

        announce(message?: string | null, politeness?: ActionAnnouncementPoliteness): void {
            announceWith(message ?? true, politeness);
        },

        update,
        destroy
    };
}
