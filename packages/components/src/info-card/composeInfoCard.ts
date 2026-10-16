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
import { runCleanups } from "../../../core/src/events";

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
    /**
     * Whether the media slot is decorative and hidden from assistive technologies.
     * Defaults to false because card media is often meaningful.
     */
    mediaHidden?: boolean;
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

function getMediaAttributes(mediaHidden: boolean): Record<string, string> {
    const attributes: Record<string, string> = {
        "data-af-info-card-media": ""
    };

    if (mediaHidden) {
        attributes["aria-hidden"] = "true";
    }

    return attributes;
}

/**
 * Creates a structured card for one meaningful item, summary, or app entry.
 */
export function InfoCard(options: InfoCardOptions): ComposedInfoCard {
    const element = createElement(options.tagName ?? "article", getCompositionElementOptions(options, {
        "data-af-composition": "info-card"
    }));

    const media = createElement("div", getCompositionElementOptions(
        options.mediaOptions,
        getMediaAttributes(options.mediaHidden ?? false)
    ));

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
    let mediaHidden = options.mediaHidden ?? false;
    let actionsLabel = options.actionsLabel ?? null;
    let actionsAlign: InfoCardActionsAlign = options.actionsAlign ?? "start";
    let destroyed = false;
    let revision = 0;

    let mediaContent: InfoCardSlotContent = normalizeSlotContent(options.media);
    let metaContent: InfoCardSlotContent = normalizeSlotContent(options.meta);
    let descriptionContent: InfoCardSlotContent = normalizeSlotContent(options.description);
    let bodyContent: InfoCardSlotContent = normalizeSlotContent(options.children);
    let actionsContent: InfoCardSlotContent = normalizeSlotContent(options.actions);

    let hasMedia = hasCompositionContent(mediaContent);
    let hasMeta = hasCompositionContent(metaContent);
    let hasDescription = hasCompositionContent(descriptionContent);
    let hasBody = hasCompositionContent(bodyContent);

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
        if (destroyed) return;
        element.setAttribute("data-af-composition", "info-card");
        element.setAttribute("data-af-orientation", orientation);
        element.setAttribute("data-af-variant", variant);
        element.setAttribute("data-af-size", size);
        element.setAttribute("data-af-has-media", String(hasMedia));

        media.setAttribute("data-af-info-card-media", "");
        if (mediaHidden) {
            media.setAttribute("aria-hidden", "true");
        } else {
            media.removeAttribute("aria-hidden");
        }

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

        actionsBar.update(getActionsBarStateOptions(actionsLabel, actionsAlign));
        actionsBar.element.hidden = Boolean(actionsBar.primarySlot.hidden && actionsBar.secondarySlot.hidden);
        actionsBar.element.setAttribute("data-af-info-card-actions", "");
    }

    function setTitle(nextContent: InfoCardCompositionContent): void {
        update({ title: nextContent });
    }

    function setMeta(nextContent: InfoCardCompositionContent | null): void {
        update({ meta: nextContent });
    }

    function setDescription(nextContent: InfoCardCompositionContent | null): void {
        update({ description: nextContent });
    }

    function setMedia(nextContent: InfoCardCompositionContent | null): void {
        update({ media: nextContent });
    }

    function setBody(nextContent: InfoCardCompositionContent | null): void {
        update({ children: nextContent });
    }

    function setActions(nextContent: InfoCardCompositionContent | null): void {
        update({ actions: nextContent });
    }

    function update(nextOptions: InfoCardUpdateOptions): void {
        if (destroyed) return;
        const current = ++revision;
        applyCompositionElementOptions(element, nextOptions);

        if (nextOptions.mediaOptions !== undefined) applyCompositionElementOptions(media, nextOptions.mediaOptions);
        if (nextOptions.metaOptions !== undefined) applyCompositionElementOptions(meta, nextOptions.metaOptions);
        if (nextOptions.titleOptions !== undefined) applyCompositionElementOptions(title, nextOptions.titleOptions);
        if (nextOptions.descriptionOptions !== undefined) applyCompositionElementOptions(description, nextOptions.descriptionOptions);
        if (nextOptions.bodyOptions !== undefined) applyCompositionElementOptions(body, nextOptions.bodyOptions);
        if (nextOptions.actionsOptions !== undefined) applyCompositionElementOptions(actionsBar.element, nextOptions.actionsOptions);

        if ("mediaHidden" in nextOptions) mediaHidden = nextOptions.mediaHidden ?? false;
        if ("actionsLabel" in nextOptions) actionsLabel = nextOptions.actionsLabel ?? null;
        if (nextOptions.actionsAlign !== undefined) actionsAlign = nextOptions.actionsAlign;
        if (nextOptions.orientation !== undefined) orientation = nextOptions.orientation;
        if (nextOptions.variant !== undefined) variant = nextOptions.variant;
        if (nextOptions.size !== undefined) size = nextOptions.size;

        runCleanups([
            () => { if (!destroyed && current === revision && "title" in nextOptions) titleSlot.set(toCompositionChildren(nextOptions.title)); },
            () => {
                if (destroyed || current !== revision || !("meta" in nextOptions)) return;
                metaContent = normalizeSlotContent(nextOptions.meta);
                hasMeta = hasCompositionContent(metaContent);
                metaSlot.set(toCompositionChildren(metaContent));
            },
            () => {
                if (destroyed || current !== revision || !("description" in nextOptions)) return;
                descriptionContent = normalizeSlotContent(nextOptions.description);
                hasDescription = hasCompositionContent(descriptionContent);
                descriptionSlot.set(toCompositionChildren(descriptionContent));
            },
            () => {
                if (destroyed || current !== revision || !("media" in nextOptions)) return;
                mediaContent = normalizeSlotContent(nextOptions.media);
                hasMedia = hasCompositionContent(mediaContent);
                mediaSlot.set(toCompositionChildren(mediaContent));
            },
            () => {
                if (destroyed || current !== revision || !("children" in nextOptions)) return;
                bodyContent = normalizeSlotContent(nextOptions.children);
                hasBody = hasCompositionContent(bodyContent);
                bodySlot.set(toCompositionChildren(bodyContent));
            },
            () => {
                if (destroyed || current !== revision || !("actions" in nextOptions)) return;
                actionsContent = normalizeSlotContent(nextOptions.actions);
                actionsBar.setPrimary(actionsContent);
            },
            sync
        ]);
    }

    function destroy(): void {
        if (destroyed) return;
        destroyed = true;
        revision += 1;
        runCleanups([mediaSlot.dispose, metaSlot.dispose, titleSlot.dispose, descriptionSlot.dispose,
            bodySlot.dispose, actionsBar.destroy]);
    }

    sync();
    return {
        element, media, content, meta, title, description, body, actions: actionsBar.element, actionsBar,
        getTitleText: () => getElementText(title),
        getDescriptionText: () => getElementText(description),
        setTitle, setMeta, setDescription, setMedia, setBody, setActions, update, destroy
    };
}
