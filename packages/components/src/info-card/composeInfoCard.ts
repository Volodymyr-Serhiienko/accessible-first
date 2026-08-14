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
 * Content accepted by InfoCard slots.
 */
export type InfoCardCompositionContent = CompositionContent;

/**
 * Native element used as the card root.
 */
export type InfoCardTagName = "article" | "section" | "div";

/**
 * Heading level used for the InfoCard title.
 */
export type InfoCardHeadingLevel = 2 | 3 | 4 | 5 | 6;

/**
 * Visual orientation for InfoCard content.
 */
export type InfoCardOrientation = "vertical" | "horizontal";

/**
 * Visual variant for InfoCard.
*/
export type InfoCardVariant = "default" | "plain";

/**
 * InfoCard size token.
 */
export type InfoCardSize = "md";

/**
 * Alignment passed to the internal ActionsBar.
 */
export type InfoCardActionsAlign = ActionsBarAlign;

/**
 * Options for InfoCard().
 */
export interface InfoCardOptions extends BaseCompositionOptions {
    title: InfoCardCompositionContent;
    description?: InfoCardCompositionContent | null;
    media?: InfoCardCompositionContent | null;
    meta?: InfoCardCompositionContent | null;
    children?: InfoCardCompositionContent | null;
    actions?: InfoCardCompositionContent | null;
    tagName?: InfoCardTagName;
    headingLevel?: InfoCardHeadingLevel;
    orientation?: InfoCardOrientation;
    variant?: InfoCardVariant;
    size?: InfoCardSize;
    actionsLabel?: string | null;
    actionsAlign?: InfoCardActionsAlign;
    mediaOptions?: BaseCompositionOptions;
    metaOptions?: BaseCompositionOptions;
    titleOptions?: BaseCompositionOptions;
    descriptionOptions?: BaseCompositionOptions;
    bodyOptions?: BaseCompositionOptions;
    actionsOptions?: BaseCompositionOptions;
}

/**
 * Options accepted by ComposedInfoCard.update().
 */
export interface InfoCardUpdateOptions
    extends Partial<Omit<InfoCardOptions, "tagName" | "headingLevel">> {}

/**
 * Info card created by the composition API.
 */
export interface ComposedInfoCard extends ComposedNode<HTMLElement> {
    readonly element: HTMLElement;
    readonly media: HTMLElement;
    readonly content: HTMLElement;
    readonly meta: HTMLElement;
    readonly title: HTMLElement;
    readonly description: HTMLElement;
    readonly body: HTMLElement;
    readonly actions: HTMLElement;
    readonly actionsBar: ComposedActionsBar;
    getTitleText(): string;
    getDescriptionText(): string;
    setTitle(content: InfoCardCompositionContent): void;
    setMeta(content: InfoCardCompositionContent | null): void;
    setDescription(content: InfoCardCompositionContent | null): void;
    setMedia(content: InfoCardCompositionContent | null): void;
    setBody(content: InfoCardCompositionContent | null): void;
    setActions(content: InfoCardCompositionContent | null): void;
    update(options: InfoCardUpdateOptions): void;
    destroy(): void;
}

type HeadingTagName = "h2" | "h3" | "h4" | "h5" | "h6";
type InfoCardSlotContent = Exclude<InfoCardCompositionContent, undefined> | null;

function getHeadingTag(level: InfoCardHeadingLevel): HeadingTagName {
    return `h${level}` as HeadingTagName;
}

function normalizeSlotContent(content: InfoCardCompositionContent | null): InfoCardSlotContent {
    return content === undefined ? null : content;
}

function getActionsBarStateOptions(
    label: string | null,
    align: InfoCardActionsAlign
): ActionsBarOptions {
    return {
        label,
        align,
        variant: "plain"
    };
}

function getInitialActionsBarOptions(
    content: InfoCardSlotContent,
    label: string | null,
    align: InfoCardActionsAlign
): ActionsBarOptions {
    const actionsBarOptions = getActionsBarStateOptions(label, align);

    actionsBarOptions.primary = content;

    return actionsBarOptions;
}

/**
 * Creates a structured card for one meaningful item, summary, or app entry.
 */
export function InfoCard(options: InfoCardOptions): ComposedInfoCard {
    const element = createElement(options.tagName ?? "article", getCompositionElementOptions(options, {
        "data-af-composition": "info-card"
    }));

    const media = createElement("div", getCompositionElementOptions(options.mediaOptions, {
        "data-af-info-card-media": ""
    }));

    const content = createElement("div", {
        attributes: {
            "data-af-info-card-content": ""
        }
    });

    const meta = createElement("div", getCompositionElementOptions(options.metaOptions, {
        "data-af-info-card-meta": ""
    }));

    const title = createElement(getHeadingTag(options.headingLevel ?? 3), getCompositionElementOptions(options.titleOptions, {
        "data-af-info-card-title": ""
    }));

    const description = createElement("div", getCompositionElementOptions(options.descriptionOptions, {
        "data-af-info-card-description": ""
    }));

    const body = createElement("div", getCompositionElementOptions(options.bodyOptions, {
        "data-af-info-card-body": ""
    }));

    let orientation: InfoCardOrientation = options.orientation ?? "vertical";
    let variant: InfoCardVariant = options.variant ?? "default";
    let size: InfoCardSize = options.size ?? "md";
    let actionsLabel = options.actionsLabel ?? null;
    let actionsAlign: InfoCardActionsAlign = options.actionsAlign ?? "start";

    let mediaContent: InfoCardSlotContent = normalizeSlotContent(options.media);
    let metaContent: InfoCardSlotContent = normalizeSlotContent(options.meta);
    let descriptionContent: InfoCardSlotContent = normalizeSlotContent(options.description);
    let bodyContent: InfoCardSlotContent = normalizeSlotContent(options.children);
    let actionsContent: InfoCardSlotContent = normalizeSlotContent(options.actions);

    let hasMedia = hasCompositionContent(mediaContent);
    let hasMeta = hasCompositionContent(metaContent);
    let hasDescription = hasCompositionContent(descriptionContent);
    let hasBody = hasCompositionContent(bodyContent);
    let hasActions = hasCompositionContent(actionsContent);

    const mediaSlot = createContentSlot(media, toCompositionChildren(mediaContent));
    const metaSlot = createContentSlot(meta, toCompositionChildren(metaContent));
    const titleSlot = createContentSlot(title, toCompositionChildren(options.title));
    const descriptionSlot = createContentSlot(description, toCompositionChildren(descriptionContent));
    const bodySlot = createContentSlot(body, toCompositionChildren(bodyContent));
    const actionsBar = ActionsBar(getInitialActionsBarOptions(actionsContent, actionsLabel, actionsAlign));

    applyCompositionElementOptions(actionsBar.element, options.actionsOptions);
    actionsBar.element.setAttribute("data-af-info-card-actions", "");

    content.append(meta, title, description, body, actionsBar.element);
    element.append(media, content);

    function sync(): void {
        element.setAttribute("data-af-composition", "info-card");
        element.setAttribute("data-af-orientation", orientation);
        element.setAttribute("data-af-variant", variant);
        element.setAttribute("data-af-size", size);
        element.setAttribute("data-af-has-media", String(hasMedia));

        media.setAttribute("data-af-info-card-media", "");
        content.setAttribute("data-af-info-card-content", "");
        meta.setAttribute("data-af-info-card-meta", "");
        title.setAttribute("data-af-info-card-title", "");
        description.setAttribute("data-af-info-card-description", "");
        body.setAttribute("data-af-info-card-body", "");
        actionsBar.element.setAttribute("data-af-info-card-actions", "");

        media.hidden = !hasMedia;
        meta.hidden = !hasMeta;
        description.hidden = !hasDescription;
        body.hidden = !hasBody;
        actionsBar.element.hidden = !hasActions;

        actionsBar.update(getActionsBarStateOptions(actionsLabel, actionsAlign));
        actionsBar.element.setAttribute("data-af-info-card-actions", "");
    }

    function setTitle(nextContent: InfoCardCompositionContent): void {
        titleSlot.set(toCompositionChildren(nextContent));
        sync();
    }

    function setMeta(nextContent: InfoCardCompositionContent | null): void {
        metaContent = normalizeSlotContent(nextContent);
        hasMeta = hasCompositionContent(metaContent);
        metaSlot.set(toCompositionChildren(metaContent));
        sync();
    }

    function setDescription(nextContent: InfoCardCompositionContent | null): void {
        descriptionContent = normalizeSlotContent(nextContent);
        hasDescription = hasCompositionContent(descriptionContent);
        descriptionSlot.set(toCompositionChildren(descriptionContent));
        sync();
    }

    function setMedia(nextContent: InfoCardCompositionContent | null): void {
        mediaContent = normalizeSlotContent(nextContent);
        hasMedia = hasCompositionContent(mediaContent);
        mediaSlot.set(toCompositionChildren(mediaContent));
        sync();
    }

    function setBody(nextContent: InfoCardCompositionContent | null): void {
        bodyContent = normalizeSlotContent(nextContent);
        hasBody = hasCompositionContent(bodyContent);
        bodySlot.set(toCompositionChildren(bodyContent));
        sync();
    }

    function setActions(nextContent: InfoCardCompositionContent | null): void {
        actionsContent = normalizeSlotContent(nextContent);
        hasActions = hasCompositionContent(actionsContent);
        actionsBar.setPrimary(actionsContent);
        sync();
    }

    sync();

    return {
        element,
        media,
        content,
        meta,
        title,
        description,
        body,
        actions: actionsBar.element,
        actionsBar,

        getTitleText: () => getElementText(title),
        getDescriptionText: () => getElementText(description),

        setTitle,
        setMeta,
        setDescription,
        setMedia,
        setBody,
        setActions,

        update(nextOptions): void {
            applyCompositionElementOptions(element, nextOptions);

            if (nextOptions.mediaOptions !== undefined) applyCompositionElementOptions(media, nextOptions.mediaOptions);
            if (nextOptions.metaOptions !== undefined) applyCompositionElementOptions(meta, nextOptions.metaOptions);
            if (nextOptions.titleOptions !== undefined) applyCompositionElementOptions(title, nextOptions.titleOptions);
            if (nextOptions.descriptionOptions !== undefined) applyCompositionElementOptions(description, nextOptions.descriptionOptions);
            if (nextOptions.bodyOptions !== undefined) applyCompositionElementOptions(body, nextOptions.bodyOptions);
            if (nextOptions.actionsOptions !== undefined) applyCompositionElementOptions(actionsBar.element, nextOptions.actionsOptions);

            if ("title" in nextOptions) setTitle(nextOptions.title);
            if ("meta" in nextOptions) setMeta(nextOptions.meta ?? null);
            if ("description" in nextOptions) setDescription(nextOptions.description ?? null);
            if ("media" in nextOptions) setMedia(nextOptions.media ?? null);
            if ("children" in nextOptions) setBody(nextOptions.children ?? null);
            if ("actions" in nextOptions) setActions(nextOptions.actions ?? null);
            if ("actionsLabel" in nextOptions) actionsLabel = nextOptions.actionsLabel ?? null;
            if (nextOptions.actionsAlign !== undefined) actionsAlign = nextOptions.actionsAlign;
            if (nextOptions.orientation !== undefined) orientation = nextOptions.orientation;
            if (nextOptions.variant !== undefined) variant = nextOptions.variant;
            if (nextOptions.size !== undefined) size = nextOptions.size;

            sync();
        },

        destroy(): void {
            mediaSlot.dispose();
            metaSlot.dispose();
            titleSlot.dispose();
            descriptionSlot.dispose();
            bodySlot.dispose();
            actionsBar.destroy();
        }
    };
}
