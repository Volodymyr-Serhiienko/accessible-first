import {
    FormSection,
    type ComposedFormSection,
    type FormSectionDescriptionMode,
    type FormSectionHeadingLevel,
    type FormSectionOptions,
    type FormSectionSize,
    type FormSectionUpdateOptions
} from "../form-section";
import type {
    BaseCompositionOptions,
    ComposedNode,
    CompositionContent
} from "../composition";

/**
 * Content accepted by SettingsGroup slots.
 */
export type SettingsGroupCompositionContent = CompositionContent;

/**
 * Heading level used by SettingsGroup title.
 */
export type SettingsGroupHeadingLevel = FormSectionHeadingLevel;

/**
 * Controls whether the visible SettingsGroup description is connected with aria-describedby.
 */
export type SettingsGroupDescriptionMode = FormSectionDescriptionMode;

/**
 * Visual variant for SettingsGroup.
 */
export type SettingsGroupVariant = "default" | "plain";

/**
 * SettingsGroup size token.
 */
export type SettingsGroupSize = FormSectionSize;

/**
 * Options for SettingsGroup().
 */
export interface SettingsGroupOptions extends BaseCompositionOptions {
    title: SettingsGroupCompositionContent;
    description?: SettingsGroupCompositionContent | null;
    children?: SettingsGroupCompositionContent | null;
    actions?: SettingsGroupCompositionContent | null;
    descriptionMode?: SettingsGroupDescriptionMode;
    headingLevel?: SettingsGroupHeadingLevel;
    variant?: SettingsGroupVariant;
    size?: SettingsGroupSize;
    headingOptions?: BaseCompositionOptions;
    descriptionOptions?: BaseCompositionOptions;
    bodyOptions?: BaseCompositionOptions;
    actionsOptions?: BaseCompositionOptions;
}

/**
 * Options accepted by ComposedSettingsGroup.update().
 */
export interface SettingsGroupUpdateOptions
    extends Partial<Omit<SettingsGroupOptions, "headingLevel">> {}

/**
 * Settings group created by the composition API.
 */
export interface ComposedSettingsGroup extends ComposedNode<HTMLElement> {
    readonly element: HTMLElement;
    readonly formSection: ComposedFormSection;
    readonly header: HTMLElement;
    readonly heading: HTMLHeadingElement;
    readonly description: HTMLElement;
    readonly body: HTMLElement;
    readonly actions: HTMLElement;
    setTitleContent(content: SettingsGroupCompositionContent): void;
    setDescription(content: SettingsGroupCompositionContent | null): void;
    setChildren(content: SettingsGroupCompositionContent | null): void;
    setActions(content: SettingsGroupCompositionContent | null): void;
    update(options: SettingsGroupUpdateOptions): void;
    destroy(): void;
}

function applyBaseOptions(target: BaseCompositionOptions, source: BaseCompositionOptions): void {
    if (source.id !== undefined) target.id = source.id;
    if (source.className !== undefined) target.className = source.className;
    if (source.attributes !== undefined) target.attributes = source.attributes;
}

function getFormSectionOptions(options: SettingsGroupOptions): FormSectionOptions {
    const formSectionOptions: FormSectionOptions = {
        title: options.title,
        variant: "plain"
    };

    applyBaseOptions(formSectionOptions, options);

    if ("description" in options) formSectionOptions.description = options.description ?? null;
    if ("children" in options) formSectionOptions.children = options.children ?? null;
    if ("actions" in options) formSectionOptions.actions = options.actions ?? null;
    if (options.descriptionMode !== undefined) formSectionOptions.descriptionMode = options.descriptionMode;
    if (options.headingLevel !== undefined) formSectionOptions.headingLevel = options.headingLevel;
    if (options.headingOptions !== undefined) formSectionOptions.headingOptions = options.headingOptions;
    if (options.descriptionOptions !== undefined) formSectionOptions.descriptionOptions = options.descriptionOptions;
    if (options.bodyOptions !== undefined) formSectionOptions.bodyOptions = options.bodyOptions;
    if (options.actionsOptions !== undefined) formSectionOptions.actionsOptions = options.actionsOptions;

    return formSectionOptions;
}

function getFormSectionUpdateOptions(options: SettingsGroupUpdateOptions): FormSectionUpdateOptions {
    const formSectionOptions: FormSectionUpdateOptions = {};

    applyBaseOptions(formSectionOptions, options);

    if (options.title !== undefined) formSectionOptions.title = options.title;
    if ("description" in options) formSectionOptions.description = options.description ?? null;
    if ("children" in options) formSectionOptions.children = options.children ?? null;
    if ("actions" in options) formSectionOptions.actions = options.actions ?? null;
    if (options.descriptionMode !== undefined) formSectionOptions.descriptionMode = options.descriptionMode;
    if (options.headingOptions !== undefined) formSectionOptions.headingOptions = options.headingOptions;
    if (options.descriptionOptions !== undefined) formSectionOptions.descriptionOptions = options.descriptionOptions;
    if (options.bodyOptions !== undefined) formSectionOptions.bodyOptions = options.bodyOptions;
    if (options.actionsOptions !== undefined) formSectionOptions.actionsOptions = options.actionsOptions;

    return formSectionOptions;
}

/**
 * Creates a semantic group for related application settings and preferences.
 */
export function SettingsGroup(options: SettingsGroupOptions): ComposedSettingsGroup {
    const formSection = FormSection(getFormSectionOptions(options));
    const element = formSection.element;

    let variant: SettingsGroupVariant = options.variant ?? "default";
    let size: SettingsGroupSize = options.size ?? "md";

    function sync(): void {
        element.setAttribute("data-af-composition", "settings-group");
        element.setAttribute("data-af-variant", variant);
        element.setAttribute("data-af-size", size);

        formSection.header.setAttribute("data-af-settings-group-header", "");
        formSection.heading.setAttribute("data-af-settings-group-heading", "");
        formSection.description.setAttribute("data-af-settings-group-description", "");
        formSection.body.setAttribute("data-af-settings-group-body", "");
        formSection.actions.setAttribute("data-af-settings-group-actions", "");
    }

    function setTitleContent(content: SettingsGroupCompositionContent): void {
        formSection.setTitleContent(content);
        sync();
    }

    function setDescription(content: SettingsGroupCompositionContent | null): void {
        formSection.setDescription(content);
        sync();
    }

    function setChildren(content: SettingsGroupCompositionContent | null): void {
        formSection.setChildren(content);
        sync();
    }

    function setActions(content: SettingsGroupCompositionContent | null): void {
        formSection.setActions(content);
        sync();
    }

    sync();

    return {
        element,
        formSection,
        header: formSection.header,
        heading: formSection.heading,
        description: formSection.description,
        body: formSection.body,
        actions: formSection.actions,
        setTitleContent,
        setDescription,
        setChildren,
        setActions,

        update(nextOptions) {
            formSection.update(getFormSectionUpdateOptions(nextOptions));

            if (nextOptions.variant !== undefined) variant = nextOptions.variant;
            if (nextOptions.size !== undefined) size = nextOptions.size;

            sync();
        },

        destroy() {
            formSection.destroy();
        }
    };
}
