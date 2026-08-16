import { setAriaDescribedBy, setAriaLabelledBy } from "../../../core/src/aria";
import { ensureId } from "../../../core/src/id";
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
    hasVisibleContent,
    toCompositionChildren,
    type BaseCompositionOptions,
    type ComposedNode,
    type CompositionContent
} from "../composition";

/**
 * Content accepted by Screen slots.
 */
export type ScreenCompositionContent = CompositionContent;

/**
 * Heading level used for the Screen title.
 */
export type ScreenHeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Visual variant for Screen.
 */
export type ScreenVariant = "default" | "plain";

/**
 * Screen size token.
 */
export type ScreenSize = "md";

/**
 * Alignment passed to the internal ActionsBar.
 */
export type ScreenActionsAlign = ActionsBarAlign;

/**
 * Options for Screen().
 */
export interface ScreenOptions extends BaseCompositionOptions {
    title: ScreenCompositionContent;
    description?: ScreenCompositionContent | null;
    children?: ScreenCompositionContent | null;
    actions?: ScreenCompositionContent | null;
    footer?: ScreenCompositionContent | null;
    headingLevel?: ScreenHeadingLevel;
    variant?: ScreenVariant;
    size?: ScreenSize;
    actionsLabel?: string | null;
    actionsAlign?: ScreenActionsAlign;
    headerOptions?: BaseCompositionOptions;
    titleOptions?: BaseCompositionOptions;
    descriptionOptions?: BaseCompositionOptions;
    bodyOptions?: BaseCompositionOptions;
    actionsOptions?: BaseCompositionOptions;
    footerOptions?: BaseCompositionOptions;
}

/**
 * Options accepted by ComposedScreen.update().
 *
 * headingLevel is initial-only because heading rank is structural.
 */
export interface ScreenUpdateOptions
    extends Partial<Omit<ScreenOptions, "headingLevel">> {}

/**
 * Application screen created by the composition API.
 */
export interface ComposedScreen extends ComposedNode<HTMLElement> {
    readonly element: HTMLElement;
    readonly header: HTMLElement;
    readonly title: HTMLHeadingElement;
    readonly description: HTMLElement;
    readonly body: HTMLElement;
    readonly actions: HTMLElement;
    readonly actionsBar: ComposedActionsBar;
    readonly footer: HTMLElement;
    getTitleText(): string;
    getDescriptionText(): string;
    setTitle(content: ScreenCompositionContent): void;
    setDescription(content: ScreenCompositionContent | null): void;
    setBody(content: ScreenCompositionContent | null): void;
    setActions(content: ScreenCompositionContent | null): void;
    setFooter(content: ScreenCompositionContent | null): void;
    update(options: ScreenUpdateOptions): void;
    destroy(): void;
}

type HeadingTagName = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
type ScreenSlotContent = Exclude<ScreenCompositionContent, undefined> | null;

function getHeadingTag(level: ScreenHeadingLevel): HeadingTagName {
    return `h${level}` as HeadingTagName;
}

function normalizeSlotContent(content: ScreenCompositionContent | null): ScreenSlotContent {
    return content === undefined ? null : content;
}

function getActionsBarStateOptions(
    label: string | null,
    align: ScreenActionsAlign
): ActionsBarOptions {
    return {
        label,
        align,
        variant: "plain"
    };
}

function getInitialActionsBarOptions(
    content: ScreenSlotContent,
    label: string | null,
    align: ScreenActionsAlign
): ActionsBarOptions {
    const options = getActionsBarStateOptions(label, align);

    options.primary = content;

    return options;
}

/**
 * Creates a top-level application screen for PageOutlet/AppShell content.
 */
export function Screen(options: ScreenOptions): ComposedScreen {
    const element = createElement("section", getCompositionElementOptions(options, {
        "data-af-composition": "screen"
    }));

    const header = createElement("header", getCompositionElementOptions(options.headerOptions, {
        "data-af-screen-header": ""
    }));

    const headingGroup = createElement("div", {
        attributes: {
            "data-af-screen-heading-group": ""
        }
    });

    const title = createElement(
        getHeadingTag(options.headingLevel ?? 2),
        getCompositionElementOptions(options.titleOptions, {
            "data-af-screen-title": ""
        })
    ) as HTMLHeadingElement;

    const description = createElement("div", getCompositionElementOptions(options.descriptionOptions, {
        "data-af-screen-description": ""
    }));

    const body = createElement("div", getCompositionElementOptions(options.bodyOptions, {
        "data-af-screen-body": ""
    }));

    const footer = createElement("footer", getCompositionElementOptions(options.footerOptions, {
        "data-af-screen-footer": ""
    }));

    let variant: ScreenVariant = options.variant ?? "default";
    let size: ScreenSize = options.size ?? "md";
    let actionsLabel = options.actionsLabel ?? null;
    let actionsAlign: ScreenActionsAlign = options.actionsAlign ?? "end";

    let descriptionContent = normalizeSlotContent(options.description);
    let bodyContent = normalizeSlotContent(options.children);
    let actionsContent = normalizeSlotContent(options.actions);
    let footerContent = normalizeSlotContent(options.footer);

    let hasBody = hasCompositionContent(bodyContent);
    let hasActions = hasCompositionContent(actionsContent);
    let hasFooter = hasCompositionContent(footerContent);

    const titleSlot = createContentSlot(title, toCompositionChildren(options.title));
    const descriptionSlot = createContentSlot(description, toCompositionChildren(descriptionContent));
    const bodySlot = createContentSlot(body, toCompositionChildren(bodyContent));
    const footerSlot = createContentSlot(footer, toCompositionChildren(footerContent));
    const actionsBar = ActionsBar(getInitialActionsBarOptions(actionsContent, actionsLabel, actionsAlign));

    applyCompositionElementOptions(actionsBar.element, options.actionsOptions);
    actionsBar.element.setAttribute("data-af-screen-actions", "");

    headingGroup.append(title, description);
    header.append(headingGroup, actionsBar.element);
    element.append(header, body, footer);

    function sync(): void {
        ensureId(title, "af-screen-title");

        element.setAttribute("data-af-composition", "screen");
        element.setAttribute("data-af-variant", variant);
        element.setAttribute("data-af-size", size);

        header.setAttribute("data-af-screen-header", "");
        headingGroup.setAttribute("data-af-screen-heading-group", "");
        title.setAttribute("data-af-screen-title", "");
        description.setAttribute("data-af-screen-description", "");
        body.setAttribute("data-af-screen-body", "");
        footer.setAttribute("data-af-screen-footer", "");
        actionsBar.element.setAttribute("data-af-screen-actions", "");

        description.hidden = !hasVisibleContent(description);
        body.hidden = !hasBody;
        actionsBar.element.hidden = !hasActions;
        footer.hidden = !hasFooter;

        setAriaLabelledBy(element, title);
        setAriaDescribedBy(element, description.hidden ? null : description);

        actionsBar.update(getActionsBarStateOptions(actionsLabel, actionsAlign));
        actionsBar.element.setAttribute("data-af-screen-actions", "");
    }

    function setTitle(content: ScreenCompositionContent): void {
        titleSlot.set(toCompositionChildren(content));
        sync();
    }

    function setDescription(content: ScreenCompositionContent | null): void {
        descriptionContent = normalizeSlotContent(content);
        descriptionSlot.set(toCompositionChildren(descriptionContent));
        sync();
    }

    function setBody(content: ScreenCompositionContent | null): void {
        bodyContent = normalizeSlotContent(content);
        hasBody = hasCompositionContent(bodyContent);
        bodySlot.set(toCompositionChildren(bodyContent));
        sync();
    }

    function setActions(content: ScreenCompositionContent | null): void {
        actionsContent = normalizeSlotContent(content);
        hasActions = hasCompositionContent(actionsContent);
        actionsBar.setPrimary(actionsContent);
        sync();
    }

    function setFooter(content: ScreenCompositionContent | null): void {
        footerContent = normalizeSlotContent(content);
        hasFooter = hasCompositionContent(footerContent);
        footerSlot.set(toCompositionChildren(footerContent));
        sync();
    }

    sync();

    return {
        element,
        header,
        title,
        description,
        body,
        actions: actionsBar.element,
        actionsBar,
        footer,

        getTitleText: () => getElementText(title),
        getDescriptionText: () => getElementText(description),

        setTitle,
        setDescription,
        setBody,
        setActions,
        setFooter,

        update(nextOptions): void {
            applyCompositionElementOptions(element, nextOptions);

            if (nextOptions.headerOptions !== undefined) {
                applyCompositionElementOptions(header, nextOptions.headerOptions);
            }

            if (nextOptions.titleOptions !== undefined) {
                applyCompositionElementOptions(title, nextOptions.titleOptions);
            }

            if (nextOptions.descriptionOptions !== undefined) {
                applyCompositionElementOptions(description, nextOptions.descriptionOptions);
            }

            if (nextOptions.bodyOptions !== undefined) {
                applyCompositionElementOptions(body, nextOptions.bodyOptions);
            }

            if (nextOptions.actionsOptions !== undefined) {
                applyCompositionElementOptions(actionsBar.element, nextOptions.actionsOptions);
            }

            if (nextOptions.footerOptions !== undefined) {
                applyCompositionElementOptions(footer, nextOptions.footerOptions);
            }

            if ("title" in nextOptions) setTitle(nextOptions.title);
            if ("description" in nextOptions) setDescription(nextOptions.description ?? null);
            if ("children" in nextOptions) setBody(nextOptions.children ?? null);
            if ("actions" in nextOptions) setActions(nextOptions.actions ?? null);
            if ("footer" in nextOptions) setFooter(nextOptions.footer ?? null);
            if ("actionsLabel" in nextOptions) actionsLabel = nextOptions.actionsLabel ?? null;
            if (nextOptions.actionsAlign !== undefined) actionsAlign = nextOptions.actionsAlign;
            if (nextOptions.variant !== undefined) variant = nextOptions.variant;
            if (nextOptions.size !== undefined) size = nextOptions.size;

            sync();
        },

        destroy(): void {
            titleSlot.dispose();
            descriptionSlot.dispose();
            bodySlot.dispose();
            footerSlot.dispose();
            actionsBar.destroy();
        }
    };
}
