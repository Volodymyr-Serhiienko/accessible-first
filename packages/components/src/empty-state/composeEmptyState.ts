import {
    ActionsBar,
    type ActionsBarAlign,
    type ActionsBarOptions,
    type ComposedActionsBar
} from "../actions-bar";
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
    type CompositionContent
} from "../composition";

/**
 * Content accepted by EmptyState slots.
 */
export type EmptyStateCompositionContent = CompositionContent;

/**
 * Heading level used for the EmptyState title.
 */
export type EmptyStateHeadingLevel = 2 | 3 | 4 | 5 | 6;

/**
 * Visual alignment for EmptyState content.
 */
export type EmptyStateAlign = "center" | "start";

/**
 * Visual variant for EmptyState.
 */
export type EmptyStateVariant = "default" | "plain";

/**
 * EmptyState size token.
 */
export type EmptyStateSize = "md";

/**
 * Alignment passed to the internal ActionsBar.
 */
export type EmptyStateActionsAlign = ActionsBarAlign;

/**
 * Options for EmptyState().
 */
export interface EmptyStateOptions extends BaseCompositionOptions {
    title: EmptyStateCompositionContent;
    description?: EmptyStateCompositionContent | null;
    media?: EmptyStateCompositionContent | null;
    /**
     * Whether the media slot is decorative and hidden from assistive technologies.
     * Defaults to true. Set to false for meaningful images or media.
     */
    mediaHidden?: boolean;
    actions?: EmptyStateCompositionContent | null;
    headingLevel?: EmptyStateHeadingLevel;
    align?: EmptyStateAlign;
    variant?: EmptyStateVariant;
    size?: EmptyStateSize;
    actionsLabel?: string | null;
    actionsAlign?: EmptyStateActionsAlign;
    mediaOptions?: BaseCompositionOptions;
    titleOptions?: BaseCompositionOptions;
    descriptionOptions?: BaseCompositionOptions;
    actionsOptions?: BaseCompositionOptions;
}

/**
 * Options accepted by ComposedEmptyState.update().
 *
 * headingLevel is intentionally initial-only because changing heading rank
 * should usually be a deliberate structural decision.
 */
export interface EmptyStateUpdateOptions
    extends Partial<Omit<EmptyStateOptions, "headingLevel">> {}

/**
 * Empty state block created by the composition API.
 */
export interface ComposedEmptyState extends ComposedNode<HTMLElement> {
    readonly element: HTMLElement;
    readonly media: HTMLElement;
    readonly title: HTMLElement;
    readonly description: HTMLElement;
    readonly actions: HTMLElement;
    readonly actionsBar: ComposedActionsBar;
    getTitleText(): string;
    getDescriptionText(): string;
    setTitle(content: EmptyStateCompositionContent): void;
    setDescription(content: EmptyStateCompositionContent | null): void;
    setMedia(content: EmptyStateCompositionContent | null): void;
    setActions(content: EmptyStateCompositionContent | null): void;
    update(options: EmptyStateUpdateOptions): void;
    destroy(): void;
}

type HeadingTagName = "h2" | "h3" | "h4" | "h5" | "h6";

function getHeadingTag(level: EmptyStateHeadingLevel): HeadingTagName {
    return `h${level}` as HeadingTagName;
}

type EmptyStateSlotContent = Exclude<EmptyStateCompositionContent, undefined> | null;

function normalizeSlotContent(
    content: EmptyStateCompositionContent | null
): EmptyStateSlotContent {
    return content === undefined ? null : content;
}

function getActionsBarStateOptions(
    label: string | null,
    align: EmptyStateActionsAlign
): ActionsBarOptions {
    return {
        label,
        align,
        variant: "plain"
    };
}

function getInitialActionsBarOptions(
    content: EmptyStateSlotContent,
    label: string | null,
    align: EmptyStateActionsAlign
): ActionsBarOptions {
    const actionsBarOptions = getActionsBarStateOptions(label, align);

    actionsBarOptions.primary = content;

    return actionsBarOptions;
}

function getMediaAttributes(mediaHidden: boolean): Record<string, string> {
    const attributes: Record<string, string> = {
        "data-af-empty-state-media": ""
    };

    if (mediaHidden) {
        attributes["aria-hidden"] = "true";
    }

    return attributes;
}

/**
 * Creates an accessible empty/no-results/error state block.
 */
export function EmptyState(options: EmptyStateOptions): ComposedEmptyState {
    const headingLevel = options.headingLevel ?? 2;

    const element = createElement("div", getCompositionElementOptions(options, {
        "data-af-composition": "empty-state"
    }));

    const media = createElement("div", getCompositionElementOptions(
        options.mediaOptions,
        getMediaAttributes(options.mediaHidden ?? true)
    ));

    const title = createElement(getHeadingTag(headingLevel), getCompositionElementOptions(options.titleOptions, {
        "data-af-empty-state-title": ""
    }));

    const description = createElement("div", getCompositionElementOptions(options.descriptionOptions, {
        "data-af-empty-state-description": ""
    }));

    let align: EmptyStateAlign = options.align ?? "center";
    let variant: EmptyStateVariant = options.variant ?? "default";
    let size: EmptyStateSize = options.size ?? "md";
    let mediaHidden = options.mediaHidden ?? true;
    let actionsLabel = options.actionsLabel ?? null;
    let actionsAlign: EmptyStateActionsAlign = options.actionsAlign ?? "start";
    let mediaContent: EmptyStateSlotContent = normalizeSlotContent(options.media);
    let descriptionContent: EmptyStateSlotContent = normalizeSlotContent(options.description);
    let actionsContent: EmptyStateSlotContent = normalizeSlotContent(options.actions);

    let hasMedia = hasCompositionContent(mediaContent);
    let hasDescription = hasCompositionContent(descriptionContent);
    let hasActions = hasCompositionContent(actionsContent);

    const mediaSlot = createContentSlot(media, toCompositionChildren(mediaContent));
    const titleSlot = createContentSlot(title, toCompositionChildren(options.title));
    const descriptionSlot = createContentSlot(description, toCompositionChildren(descriptionContent));
    const actionsBar = ActionsBar(getInitialActionsBarOptions(actionsContent, actionsLabel, actionsAlign));

    applyCompositionElementOptions(actionsBar.element, options.actionsOptions);
    actionsBar.element.setAttribute("data-af-empty-state-actions", "");

    element.append(media, title, description, actionsBar.element);

    function sync(): void {
        element.setAttribute("data-af-composition", "empty-state");
        element.setAttribute("data-af-align", align);
        element.setAttribute("data-af-variant", variant);
        element.setAttribute("data-af-size", size);

        media.setAttribute("data-af-empty-state-media", "");
        if (mediaHidden) {
            media.setAttribute("aria-hidden", "true");
        } else {
            media.removeAttribute("aria-hidden");
        }

        title.setAttribute("data-af-empty-state-title", "");
        description.setAttribute("data-af-empty-state-description", "");
        actionsBar.element.setAttribute("data-af-empty-state-actions", "");

        media.hidden = !hasMedia;
        description.hidden = !hasDescription;
        actionsBar.element.hidden = !hasActions;

        actionsBar.update(getActionsBarStateOptions(actionsLabel, actionsAlign));
        actionsBar.element.setAttribute("data-af-empty-state-actions", "");
    }

    function setTitle(content: EmptyStateCompositionContent): void {
        titleSlot.set(toCompositionChildren(content));
        sync();
    }

    function setDescription(content: EmptyStateCompositionContent | null): void {
        const nextContent = normalizeSlotContent(content);

        descriptionContent = nextContent;
        hasDescription = hasCompositionContent(descriptionContent);
        descriptionSlot.set(toCompositionChildren(descriptionContent));
        sync();
    }

    function setMedia(content: EmptyStateCompositionContent | null): void {
        const nextContent = normalizeSlotContent(content);

        mediaContent = nextContent;
        hasMedia = hasCompositionContent(mediaContent);
        mediaSlot.set(toCompositionChildren(mediaContent));
        sync();
    }

    function setActions(content: EmptyStateCompositionContent | null): void {
        const nextContent = normalizeSlotContent(content);

        actionsContent = nextContent;
        hasActions = hasCompositionContent(actionsContent);
        actionsBar.setPrimary(actionsContent);
        sync();
    }

    sync();

    return {
        element,
        media,
        title,
        description,
        actions: actionsBar.element,
        actionsBar,

        getTitleText(): string {
            return getElementText(title);
        },

        getDescriptionText(): string {
            return getElementText(description);
        },

        setTitle,
        setDescription,
        setMedia,
        setActions,

        update(nextOptions): void {
            applyCompositionElementOptions(element, nextOptions);

            if (nextOptions.mediaOptions !== undefined) {
                applyCompositionElementOptions(media, nextOptions.mediaOptions);
            }

            if (nextOptions.titleOptions !== undefined) {
                applyCompositionElementOptions(title, nextOptions.titleOptions);
            }

            if (nextOptions.descriptionOptions !== undefined) {
                applyCompositionElementOptions(description, nextOptions.descriptionOptions);
            }

            if (nextOptions.actionsOptions !== undefined) {
                applyCompositionElementOptions(actionsBar.element, nextOptions.actionsOptions);
            }

            if ("title" in nextOptions) setTitle(nextOptions.title);
            if ("description" in nextOptions) setDescription(nextOptions.description ?? null);
            if ("media" in nextOptions) setMedia(nextOptions.media ?? null);
            if ("mediaHidden" in nextOptions) mediaHidden = nextOptions.mediaHidden ?? true;
            if ("actions" in nextOptions) setActions(nextOptions.actions ?? null);
            if ("actionsLabel" in nextOptions) actionsLabel = nextOptions.actionsLabel ?? null;
            if (nextOptions.actionsAlign !== undefined) actionsAlign = nextOptions.actionsAlign;
            if (nextOptions.align !== undefined) align = nextOptions.align;
            if (nextOptions.variant !== undefined) variant = nextOptions.variant;
            if (nextOptions.size !== undefined) size = nextOptions.size;

            sync();
        },

        destroy(): void {
            mediaSlot.dispose();
            titleSlot.dispose();
            descriptionSlot.dispose();
            actionsBar.destroy();
        }
    };
}
