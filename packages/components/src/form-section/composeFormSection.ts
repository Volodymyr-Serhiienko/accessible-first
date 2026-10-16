import { ActionsBar, type ActionsBarOptions } from "../actions-bar";
import { createAriaReferenceOwner } from "../../../core/src/aria/createAriaReferenceOwner";
import { runCleanups } from "../../../core/src/events";
import { ensureId } from "../../../core/src/id";
import {
    applyCompositionElementOptions,
    createContentSlot,
    createElement,
    getCompositionElementOptions,
    hasVisibleContent,
    toCompositionChildren,
    type BaseCompositionOptions,
    type ComposedNode,
    type CompositionContent
} from "../composition";

/**
 * Content accepted by form section title, description, body, and actions slots.
 */
export type FormSectionCompositionContent = CompositionContent;

/**
 * Heading level used by FormSection title.
 */
export type FormSectionHeadingLevel = 2 | 3 | 4 | 5 | 6;

/**
 * Controls whether the visible FormSection description is connected with aria-describedby.
 */
export type FormSectionDescriptionMode = "content" | "aria";

/**
 * Visual variant for FormSection.
 */
export type FormSectionVariant = "default" | "plain";

/**
 * FormSection size token.
 */
export type FormSectionSize = "md";

/**
 * Options for FormSection().
 */
export interface FormSectionOptions extends BaseCompositionOptions {
    title: FormSectionCompositionContent;
    description?: FormSectionCompositionContent | null;
    children?: FormSectionCompositionContent;
    actions?: FormSectionCompositionContent | null;
    headingLevel?: FormSectionHeadingLevel;
    variant?: FormSectionVariant;
    size?: FormSectionSize;
    headingOptions?: BaseCompositionOptions;
    descriptionOptions?: BaseCompositionOptions;
    bodyOptions?: BaseCompositionOptions;
    actionsOptions?: BaseCompositionOptions;
    descriptionMode?: FormSectionDescriptionMode;
}

/**
 * Options accepted by ComposedFormSection.update().
 *
 * headingLevel is creation-time only.
 */
export interface FormSectionUpdateOptions extends Partial<Omit<FormSectionOptions, "headingLevel">> {}

/**
 * Form section created by the composition API.
 */
export interface ComposedFormSection extends ComposedNode<HTMLElement> {
    readonly element: HTMLElement;
    readonly header: HTMLElement;
    readonly heading: HTMLHeadingElement;
    readonly description: HTMLElement;
    readonly body: HTMLElement;
    readonly actions: HTMLElement;
    setTitleContent(content: FormSectionCompositionContent): void;
    setDescription(content: FormSectionCompositionContent | null): void;
    setChildren(content: FormSectionCompositionContent | null): void;
    setActions(content: FormSectionCompositionContent | null): void;
    update(options: FormSectionUpdateOptions): void;
    destroy(): void;
}

function getHeadingTag(level: FormSectionHeadingLevel): keyof HTMLElementTagNameMap {
    return `h${level}` as keyof HTMLElementTagNameMap;
}

function getActionsBarBaseOptions(
    options: BaseCompositionOptions | undefined
): ActionsBarOptions {
    const actionsBarOptions: ActionsBarOptions = {
        attributes: {
            ...options?.attributes,
            "data-af-form-section-actions": ""
        }
    };

    if (options?.id !== undefined) {
        actionsBarOptions.id = options.id;
    }

    if (options?.className !== undefined) {
        actionsBarOptions.className = options.className;
    }

    return actionsBarOptions;
}

function getActionsBarOptions(options: FormSectionOptions): ActionsBarOptions {
    return {
        ...getActionsBarBaseOptions(options.actionsOptions),
        align: "end",
        primary: options.actions ?? null
    };
}

/**
 * Creates a labelled form section with optional description, body, and actions.
 */
export function FormSection(options: FormSectionOptions): ComposedFormSection {
    const element = createElement("section", getCompositionElementOptions(options, {
        "data-af-composition": "form-section"
    }));

    const header = createElement("div", {
        attributes: {
            "data-af-form-section-header": ""
        }
    });

    const heading = createElement(
        getHeadingTag(options.headingLevel ?? 3),
        getCompositionElementOptions(options.headingOptions, {
            "data-af-form-section-heading": ""
        })
    ) as HTMLHeadingElement;

    const description = createElement("div", getCompositionElementOptions(options.descriptionOptions, {
        "data-af-form-section-description": ""
    }));

    const body = createElement("div", getCompositionElementOptions(options.bodyOptions, {
        "data-af-form-section-body": ""
    }));

    const actionsBar = ActionsBar(getActionsBarOptions(options));

    const titleSlot = createContentSlot(heading, toCompositionChildren(options.title));
    const descriptionSlot = createContentSlot(description, toCompositionChildren(options.description));
    const bodySlot = createContentSlot(body, toCompositionChildren(options.children));

    let destroyed = false;
    let revision = 0;
    const titleReference = createAriaReferenceOwner(element, "aria-labelledby");
    const descriptionReference = createAriaReferenceOwner(element, "aria-describedby");
    let variant: FormSectionVariant = options.variant ?? "default";
    let size: FormSectionSize = options.size ?? "md";
    let descriptionMode: FormSectionDescriptionMode = options.descriptionMode ?? "content";

    header.append(heading, description);
    element.append(header, body, actionsBar.element);

    function sync(): void {
        if (destroyed) return;
        ensureId(heading, "af-form-section-title");

        description.hidden = !hasVisibleContent(description);
        actionsBar.element.hidden = actionsBar.primarySlot.hidden && actionsBar.secondarySlot.hidden;
        actionsBar.element.setAttribute("data-af-form-section-actions", "");

        element.setAttribute("data-af-composition", "form-section");
        element.setAttribute("data-af-variant", variant);
        element.setAttribute("data-af-size", size);

        titleReference.set([heading.id]);
        if (descriptionMode === "aria" && !description.hidden) ensureId(description, "af-form-section-description");
        descriptionReference.set(descriptionMode === "aria" && !description.hidden ? [description.id] : []);
    }

    function setTitleContent(content: FormSectionCompositionContent): void {
        update({ title: content });
    }

    function setDescription(content: FormSectionCompositionContent | null): void {
        update({ description: content });
    }

    function setChildren(content: FormSectionCompositionContent | null): void {
        update({ children: content });
    }

    function setActions(content: FormSectionCompositionContent | null): void {
        update({ actions: content });
    }

    function update(nextOptions: FormSectionUpdateOptions): void {
        if (destroyed) return;
        const current = ++revision;
        applyCompositionElementOptions(element, nextOptions);
        if (nextOptions.headingOptions !== undefined) applyCompositionElementOptions(heading, nextOptions.headingOptions);
        if (nextOptions.descriptionOptions !== undefined) applyCompositionElementOptions(description, nextOptions.descriptionOptions);
        if (nextOptions.bodyOptions !== undefined) applyCompositionElementOptions(body, nextOptions.bodyOptions);
        if (nextOptions.actionsOptions !== undefined) actionsBar.update(getActionsBarBaseOptions(nextOptions.actionsOptions));
        heading.setAttribute("data-af-form-section-heading", "");
        description.setAttribute("data-af-form-section-description", "");
        body.setAttribute("data-af-form-section-body", "");
        if (nextOptions.variant !== undefined) variant = nextOptions.variant;
        if (nextOptions.size !== undefined) size = nextOptions.size;
        if (nextOptions.descriptionMode !== undefined) descriptionMode = nextOptions.descriptionMode;
        runCleanups([
            () => { if (!destroyed && current === revision && "title" in nextOptions) titleSlot.set(toCompositionChildren(nextOptions.title)); },
            () => { if (!destroyed && current === revision && "description" in nextOptions) descriptionSlot.set(toCompositionChildren(nextOptions.description)); },
            () => { if (!destroyed && current === revision && "children" in nextOptions) bodySlot.set(toCompositionChildren(nextOptions.children)); },
            () => { if (!destroyed && current === revision && "actions" in nextOptions) actionsBar.setPrimary(nextOptions.actions ?? null); },
            sync
        ]);
    }

    function destroy(): void {
        if (destroyed) return;
        destroyed = true;
        revision += 1;
        runCleanups([titleSlot.dispose, descriptionSlot.dispose, bodySlot.dispose, actionsBar.destroy,
            titleReference.destroy, descriptionReference.destroy]);
    }

    sync();

    return {
        element,
        header,
        heading,
        description,
        body,
        actions: actionsBar.element,
        setTitleContent,
        setDescription,
        setChildren,
        setActions,

        update,
        destroy
    };
}
