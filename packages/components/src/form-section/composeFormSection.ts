import { setAriaDescribedBy, setAriaLabelledBy } from "../../../core/src/aria";
import { ensureId } from "../../../core/src/id";
import {
    applyCompositionElementOptions,
    createContentSlot,
    createElement,
    getCompositionElementOptions,
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

function getElementText(element: HTMLElement): string {
    return element.textContent?.replace(/\s+/g, " ").trim() ?? "";
}

function hasVisibleContent(element: HTMLElement): boolean {
    return getElementText(element).length > 0;
}

function getHeadingTag(level: FormSectionHeadingLevel): keyof HTMLElementTagNameMap {
    return `h${level}` as keyof HTMLElementTagNameMap;
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

    const actions = createElement("div", getCompositionElementOptions(options.actionsOptions, {
        "data-af-form-section-actions": ""
    }));

    const titleSlot = createContentSlot(heading, toCompositionChildren(options.title));
    const descriptionSlot = createContentSlot(description, toCompositionChildren(options.description));
    const bodySlot = createContentSlot(body, toCompositionChildren(options.children));
    const actionsSlot = createContentSlot(actions, toCompositionChildren(options.actions));

    let hasActions = toCompositionChildren(options.actions).length > 0;
    let variant: FormSectionVariant = options.variant ?? "default";
    let size: FormSectionSize = options.size ?? "md";

    header.append(heading, description);
    element.append(header, body, actions);

    function sync(): void {
        ensureId(heading, "af-form-section-title");

        description.hidden = !hasVisibleContent(description);
        actions.hidden = !hasActions;

        element.setAttribute("data-af-composition", "form-section");
        element.setAttribute("data-af-variant", variant);
        element.setAttribute("data-af-size", size);

        setAriaLabelledBy(element, heading);
        setAriaDescribedBy(element, description.hidden ? null : description);
    }

    function setTitleContent(content: FormSectionCompositionContent): void {
        titleSlot.set(toCompositionChildren(content));
        sync();
    }

    function setDescription(content: FormSectionCompositionContent | null): void {
        descriptionSlot.set(toCompositionChildren(content));
        sync();
    }

    function setChildren(content: FormSectionCompositionContent | null): void {
        bodySlot.set(toCompositionChildren(content));
    }

    function setActions(content: FormSectionCompositionContent | null): void {
        const children = toCompositionChildren(content);

        hasActions = children.length > 0;
        actionsSlot.set(children);
        sync();
    }

    sync();

    return {
        element,
        header,
        heading,
        description,
        body,
        actions,
        setTitleContent,
        setDescription,
        setChildren,
        setActions,

        update(nextOptions): void {
            applyCompositionElementOptions(element, nextOptions);

            if (nextOptions.headingOptions !== undefined) {
                applyCompositionElementOptions(heading, nextOptions.headingOptions);
                heading.setAttribute("data-af-form-section-heading", "");
            }

            if (nextOptions.descriptionOptions !== undefined) {
                applyCompositionElementOptions(description, nextOptions.descriptionOptions);
                description.setAttribute("data-af-form-section-description", "");
            }

            if (nextOptions.bodyOptions !== undefined) {
                applyCompositionElementOptions(body, nextOptions.bodyOptions);
                body.setAttribute("data-af-form-section-body", "");
            }

            if (nextOptions.actionsOptions !== undefined) {
                applyCompositionElementOptions(actions, nextOptions.actionsOptions);
                actions.setAttribute("data-af-form-section-actions", "");
            }

            if (nextOptions.title !== undefined) setTitleContent(nextOptions.title);
            if ("description" in nextOptions) setDescription(nextOptions.description ?? null);
            if ("children" in nextOptions) setChildren(nextOptions.children ?? null);
            if ("actions" in nextOptions) setActions(nextOptions.actions ?? null);

            if (nextOptions.variant !== undefined) variant = nextOptions.variant;
            if (nextOptions.size !== undefined) size = nextOptions.size;

            sync();
        },

        destroy(): void {
            titleSlot.dispose();
            descriptionSlot.dispose();
            bodySlot.dispose();
            actionsSlot.dispose();
        }
    };
}
