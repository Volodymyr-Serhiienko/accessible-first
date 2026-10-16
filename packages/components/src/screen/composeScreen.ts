import { createAriaReferenceOwner } from "../../../core/src/aria/createAriaReferenceOwner";
import { runCleanups } from "../../../core/src/events";
import { focusProgrammatically } from "../../../core/src/focus";
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
 * Controls whether the visible Screen description is connected with aria-describedby.
 */
export type ScreenDescriptionMode = "content" | "aria";

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
 * Programmatic focus target inside a Screen.
 */
export type ScreenFocusTarget =
    | "screen"
    | "title"
    | "description"
    | "body"
    | "actions"
    | "footer";

/**
 * Options for Screen().
 */
export interface ScreenOptions extends BaseCompositionOptions {
    title: ScreenCompositionContent;
    description?: ScreenCompositionContent | null;
    children?: ScreenCompositionContent | null;
    actions?: ScreenCompositionContent | null;
    footer?: ScreenCompositionContent | null;
    descriptionMode?: ScreenDescriptionMode;
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
    defaultFocusTarget?: ScreenFocusTarget;
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
    getFocusTarget(target?: ScreenFocusTarget): HTMLElement;
    focus(target?: ScreenFocusTarget, options?: FocusOptions): boolean;
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
    let descriptionMode: ScreenDescriptionMode = options.descriptionMode ?? "content";
    let actionsLabel = options.actionsLabel ?? null;
    let actionsAlign: ScreenActionsAlign = options.actionsAlign ?? "end";
    let defaultFocusTarget: ScreenFocusTarget = options.defaultFocusTarget ?? "title";
    let destroyed = false;
    let revision = 0;
    const titleReference = createAriaReferenceOwner(element, "aria-labelledby");
    const descriptionReference = createAriaReferenceOwner(element, "aria-describedby");

    let descriptionContent = normalizeSlotContent(options.description);
    let bodyContent = normalizeSlotContent(options.children);
    let actionsContent = normalizeSlotContent(options.actions);
    let footerContent = normalizeSlotContent(options.footer);

    let hasBody = hasCompositionContent(bodyContent);
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

    function getFocusTarget(target: ScreenFocusTarget = defaultFocusTarget): HTMLElement {
        if (target === "screen") return element;
        if (target === "description") return description.hidden ? title : description;
        if (target === "body") return body.hidden ? title : body;
        if (target === "actions") return actionsBar.element.hidden ? title : actionsBar.element;
        if (target === "footer") return footer.hidden ? (body.hidden ? title : body) : footer;

        return title;
    }

    function focus(
        target: ScreenFocusTarget = defaultFocusTarget,
        focusOptions: FocusOptions = { preventScroll: true }
    ): boolean {
        if (destroyed) return false;
        return focusProgrammatically(getFocusTarget(target), focusOptions);
    }

    function sync(): void {
        if (destroyed) return;
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
        footer.hidden = !hasFooter;

        titleReference.set([title.id]);
        descriptionReference.set(descriptionMode === "aria" && !description.hidden
            ? [ensureId(description, "af-screen-description")] : []);

        actionsBar.update(getActionsBarStateOptions(actionsLabel, actionsAlign));
        actionsBar.element.hidden = Boolean(actionsBar.primarySlot.hidden && actionsBar.secondarySlot.hidden);
        actionsBar.element.setAttribute("data-af-screen-actions", "");
    }

    function setTitle(content: ScreenCompositionContent): void {
        update({ title: content });
    }

    function setDescription(content: ScreenCompositionContent | null): void {
        update({ description: content });
    }

    function setBody(content: ScreenCompositionContent | null): void {
        update({ children: content });
    }

    function setActions(content: ScreenCompositionContent | null): void {
        update({ actions: content });
    }

    function setFooter(content: ScreenCompositionContent | null): void {
        update({ footer: content });
    }

    function update(nextOptions: ScreenUpdateOptions): void {
        if (destroyed) return;
        const current = ++revision;
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

        if (nextOptions.defaultFocusTarget !== undefined) {
            defaultFocusTarget = nextOptions.defaultFocusTarget;
        }

        if ("actionsLabel" in nextOptions) actionsLabel = nextOptions.actionsLabel ?? null;
        if (nextOptions.descriptionMode !== undefined) descriptionMode = nextOptions.descriptionMode;
        if (nextOptions.actionsAlign !== undefined) actionsAlign = nextOptions.actionsAlign;
        if (nextOptions.variant !== undefined) variant = nextOptions.variant;
        if (nextOptions.size !== undefined) size = nextOptions.size;

        runCleanups([
            () => { if (!destroyed && current === revision && "title" in nextOptions) titleSlot.set(toCompositionChildren(nextOptions.title)); },
            () => {
                if (destroyed || current !== revision || !("description" in nextOptions)) return;
                descriptionContent = normalizeSlotContent(nextOptions.description);
                descriptionSlot.set(toCompositionChildren(descriptionContent));
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
            () => {
                if (destroyed || current !== revision || !("footer" in nextOptions)) return;
                footerContent = normalizeSlotContent(nextOptions.footer);
                hasFooter = hasCompositionContent(footerContent);
                footerSlot.set(toCompositionChildren(footerContent));
            },
            sync
        ]);
    }

    function destroy(): void {
        if (destroyed) return;
        destroyed = true;
        revision += 1;
        runCleanups([titleSlot.dispose, descriptionSlot.dispose, bodySlot.dispose, footerSlot.dispose,
            actionsBar.destroy, titleReference.destroy, descriptionReference.destroy]);
    }

    sync();
    return {
        element, header, title, description, body, actions: actionsBar.element, actionsBar, footer,
        getTitleText: () => getElementText(title),
        getDescriptionText: () => getElementText(description),
        setTitle, setDescription, setBody, setActions, setFooter, getFocusTarget, focus, update, destroy
    };
}
