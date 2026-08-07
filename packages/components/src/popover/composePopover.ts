import {
    Button,
    type ButtonCompositionOptions,
    type ButtonSize,
    type ButtonVariant,
    type ComposedButton
} from "../button";
import {
    applyCompositionElementOptions,
    createContentSlot,
    createElement,
    getCompositionElementOptions,
    toCompositionChildren,
    type BaseCompositionOptions,
    type CompositionChild,
    type CompositionContent
} from "../composition";
import { createId } from "../../../core/src/id";
import { createPopover } from "./createPopover";
import type {
    Popover as PopoverInstance,
    PopoverOpenChangeDetail,
    PopoverOptions as PopoverInstanceOptions,
    PopoverUpdateOptions as PopoverInstanceUpdateOptions
} from "./types";

/**
 * Content accepted by Popover trigger and content slots.
 */
export type PopoverCompositionContent = CompositionContent;

/**
 * Controls how the composed description participates in popover semantics.
 */
export type PopoverDescriptionMode = "content" | "aria";

/**
 * Details passed when a composed popover opens or closes.
 */
export interface PopoverCompositionOpenChangeDetail extends PopoverOpenChangeDetail {
    triggerButton: ComposedButton;
}

/**
 * Called when a composed popover opens or closes.
 */
export type PopoverCompositionOnOpenChange = (
    detail: PopoverCompositionOpenChangeDetail,
    popover: ComposedPopover
) => void;

/**
 * Options for Popover(), the composition API for anchored floating content.
 */
export interface PopoverCompositionOptions
    extends Omit<PopoverInstanceOptions, "trigger" | "contentId" | "onOpenChange">,
        BaseCompositionOptions {
    trigger: PopoverCompositionContent;
    contentId?: string;
    contentOptions?: BaseCompositionOptions;
    children?: CompositionChild[];
    triggerVariant?: ButtonVariant;
    triggerSize?: ButtonSize;
    description?: string | null;
    descriptionId?: string;
    descriptionMode?: PopoverDescriptionMode;
    onOpenChange?: PopoverCompositionOnOpenChange | null;
}

/**
 * Options accepted by ComposedPopover.update().
 *
 * defaultOpen, useOverlayStack, and overlayStack are creation-time options.
 */
export interface PopoverCompositionUpdateOptions
    extends Partial<
        Omit<PopoverCompositionOptions, "defaultOpen" | "useOverlayStack" | "overlayStack">
    > {}

/**
 * Popover created by the composition API.
 */
export interface ComposedPopover
    extends Omit<PopoverInstance, "element" | "content" | "trigger" | "update" | "destroy"> {
    readonly element: HTMLElement;
    readonly trigger: HTMLButtonElement;
    readonly triggerButton: ComposedButton;
    readonly content: HTMLElement;
    readonly description: HTMLElement;
    readonly body: HTMLElement;
    setDescription(description: string | null): void;
    setTriggerContent(content: PopoverCompositionContent): void;
    setContent(content: PopoverCompositionContent): void;
    update(options: PopoverCompositionUpdateOptions): void;
    destroy(): void;
}

function syncContentId(content: HTMLElement, options: Pick<PopoverCompositionOptions, "contentId">): void {
    if (options.contentId !== undefined) {
        content.id = options.contentId;
        return;
    }

    if (!content.id) {
        content.id = createId("af-popover");
    }
}

function hasDescription(value: string | null | undefined): value is string {
    return Boolean(value?.trim());
}

function getDescriptionText(description: HTMLElement): string {
    return description.textContent?.replace(/\s+/g, " ").trim() ?? "";
}

function shouldUseAriaDescription(
    mode: PopoverDescriptionMode,
    description: HTMLElement
): boolean {
    return mode === "aria" && Boolean(getDescriptionText(description));
}

function applyDescriptionPopoverOptions(
    target: PopoverInstanceOptions | PopoverInstanceUpdateOptions,
    description: HTMLElement,
    mode: PopoverDescriptionMode,
    hasExplicitDescribedBy: boolean,
    hasExplicitAnnouncement: boolean
): void {
    if (!hasExplicitDescribedBy) {
        target.describedBy = shouldUseAriaDescription(mode, description) ? description.id : null;
    }

    if (!hasExplicitAnnouncement) {
        target.announcement = getDescriptionText(description) || false;
    }
}

function getTriggerButtonOptions(options: PopoverCompositionOptions): ButtonCompositionOptions {
    const buttonOptions: ButtonCompositionOptions = {
        children: toCompositionChildren(options.trigger),
        variant: options.triggerVariant ?? "secondary"
    };

    if (options.triggerSize !== undefined) {
        buttonOptions.size = options.triggerSize;
    }

    return buttonOptions;
}

function getTriggerButtonUpdateOptions(
    options: PopoverCompositionUpdateOptions
): Partial<ButtonCompositionOptions> {
    const buttonOptions: Partial<ButtonCompositionOptions> = {};

    if (options.trigger !== undefined) {
        buttonOptions.children = toCompositionChildren(options.trigger);
    }

    if (options.triggerVariant !== undefined) {
        buttonOptions.variant = options.triggerVariant;
    }

    if (options.triggerSize !== undefined) {
        buttonOptions.size = options.triggerSize;
    }

    return buttonOptions;
}

function applyPopoverOptions(
    target: PopoverInstanceOptions | PopoverInstanceUpdateOptions,
    options: PopoverCompositionOptions | PopoverCompositionUpdateOptions
): void {
    if (options.open !== undefined) target.open = options.open;
    if (options.disabled !== undefined) target.disabled = options.disabled;
    if (options.role !== undefined) target.role = options.role;
    if ("hasPopup" in options) target.hasPopup = options.hasPopup ?? null;
    if ("labelledBy" in options) target.labelledBy = options.labelledBy ?? null;
    if ("describedBy" in options) target.describedBy = options.describedBy ?? null;
    if (options.dismissOnEscape !== undefined) target.dismissOnEscape = options.dismissOnEscape;
    if (options.dismissOnPointerDownOutside !== undefined) {
        target.dismissOnPointerDownOutside = options.dismissOnPointerDownOutside;
    }
    if (options.dismissOnFocusOutside !== undefined) {
        target.dismissOnFocusOutside = options.dismissOnFocusOutside;
    }
    if (options.variant !== undefined) target.variant = options.variant;
    if (options.size !== undefined) target.size = options.size;
    if ("onEscapeKeyDown" in options) target.onEscapeKeyDown = options.onEscapeKeyDown ?? null;
    if ("onPointerDownOutside" in options) {
        target.onPointerDownOutside = options.onPointerDownOutside ?? null;
    }
    if ("onFocusOutside" in options) target.onFocusOutside = options.onFocusOutside ?? null;

    if (options.side !== undefined) target.side = options.side;
    if (options.alignment !== undefined) target.alignment = options.alignment;
    if (options.strategy !== undefined) target.strategy = options.strategy;
    if (options.offset !== undefined) target.offset = options.offset;
    if (options.crossAxisOffset !== undefined) target.crossAxisOffset = options.crossAxisOffset;
    if (options.collisionPadding !== undefined) target.collisionPadding = options.collisionPadding;
    if (options.flip !== undefined) target.flip = options.flip;
    if (options.shift !== undefined) target.shift = options.shift;
    if (options.matchAnchorWidth !== undefined) target.matchAnchorWidth = options.matchAnchorWidth;
    if (options.autoUpdate !== undefined) target.autoUpdate = options.autoUpdate;
    if (options.restoreFocus !== undefined) target.restoreFocus = options.restoreFocus;
    if (options.announcement !== undefined) target.announcement = options.announcement;
}

function getPopoverOptions(
    options: PopoverCompositionOptions,
    trigger: HTMLElement,
    content: HTMLElement,
    description: HTMLElement,
    onOpenChange: NonNullable<PopoverInstanceOptions["onOpenChange"]>
): PopoverInstanceOptions {
    const popoverOptions: PopoverInstanceOptions = {
        trigger,
        contentId: content.id,
        onOpenChange
    };

    if (options.defaultOpen !== undefined) {
        popoverOptions.defaultOpen = options.defaultOpen;
    }

    if (options.useOverlayStack !== undefined) {
        popoverOptions.useOverlayStack = options.useOverlayStack;
    }

    if (options.overlayStack !== undefined) {
        popoverOptions.overlayStack = options.overlayStack;
    }

    applyPopoverOptions(popoverOptions, options);

    applyDescriptionPopoverOptions(
        popoverOptions,
        description,
        options.descriptionMode ?? "aria",
        options.describedBy !== undefined,
        options.announcement !== undefined
    );

    return popoverOptions;
}

function getPopoverUpdateOptions(
    options: PopoverCompositionUpdateOptions,
    contentId: string | null
): PopoverInstanceUpdateOptions {
    const popoverOptions: PopoverInstanceUpdateOptions = {};

    if (contentId !== null) {
        popoverOptions.contentId = contentId;
    }

    applyPopoverOptions(popoverOptions, options);

    return popoverOptions;
}

/**
 * Creates an anchored popover with a trigger button and floating content.
 */
export function Popover(options: PopoverCompositionOptions): ComposedPopover {
    const element = createElement("div", getCompositionElementOptions(options, {
        "data-af-composition": "popover"
    }));

    const triggerButton = Button(getTriggerButtonOptions(options));

    const content = createElement("div", getCompositionElementOptions(options.contentOptions, {
        "data-af-popover-content": ""
    }));

    const description = createElement("p", {
        id: options.descriptionId ?? createId("af-popover-description"),
        text: options.description ?? "",
        attributes: {
            "data-af-popover-description": ""
        }
    });

    const body = createElement("div", {
        attributes: {
            "data-af-popover-body": ""
        }
    });

    description.hidden = !hasDescription(options.description);
    content.append(description, body);

    syncContentId(content, options);

    const contentSlot = createContentSlot(body, toCompositionChildren(options.children));

    element.append(triggerButton.element, content);

    let composed!: ComposedPopover;
    let onOpenChange = options.onOpenChange ?? null;

    let descriptionMode = options.descriptionMode ?? "aria";
    let hasExplicitDescribedBy = options.describedBy !== undefined;
    let hasExplicitAnnouncement = options.announcement !== undefined;

    const handleOpenChange: NonNullable<PopoverInstanceOptions["onOpenChange"]> = (detail): void => {
        onOpenChange?.(
            {
                ...detail,
                triggerButton
            },
            composed
        );
    };

    const popover = createPopover(
        content,
        getPopoverOptions(options, triggerButton.element, content, description, handleOpenChange)
    );

    function setTriggerContent(nextContent: PopoverCompositionContent): void {
        triggerButton.update({
            children: toCompositionChildren(nextContent)
        });
    }

    function setContent(nextContent: PopoverCompositionContent): void {
        contentSlot.set(toCompositionChildren(nextContent));
    }

    function setDescription(nextDescription: string | null): void {
        const text = nextDescription?.trim() ?? "";

        description.textContent = text;
        description.hidden = !text;
    }

    composed = {
        ...popover,
        element,
        trigger: triggerButton.element,
        triggerButton,
        content,
        description,
        body,
        setDescription,
        setTriggerContent,
        setContent,

        update(nextOptions): void {
            applyCompositionElementOptions(element, nextOptions);

            if (nextOptions.contentOptions !== undefined) {
                applyCompositionElementOptions(content, nextOptions.contentOptions);
                content.setAttribute("data-af-popover-content", "");
            }

            if (nextOptions.contentId !== undefined) {
                content.id = nextOptions.contentId;
            } else if (nextOptions.contentOptions?.id !== undefined) {
                content.id = nextOptions.contentOptions.id;
            }

            if ("onOpenChange" in nextOptions) {
                onOpenChange = nextOptions.onOpenChange ?? null;
            }

            if (
                nextOptions.trigger !== undefined
                || nextOptions.triggerVariant !== undefined
                || nextOptions.triggerSize !== undefined
            ) {
                triggerButton.update(getTriggerButtonUpdateOptions(nextOptions));
            }

            if (nextOptions.children !== undefined) {
                setContent(nextOptions.children);
            }

            const contentIdChanged = (
                nextOptions.contentId !== undefined
                || nextOptions.contentOptions?.id !== undefined
            );

            if (nextOptions.descriptionId !== undefined) {
                description.id = nextOptions.descriptionId;
            }

            if ("description" in nextOptions) {
                setDescription(nextOptions.description ?? null);
            }

            if (nextOptions.descriptionMode !== undefined) {
                descriptionMode = nextOptions.descriptionMode;
            }

            if ("describedBy" in nextOptions) {
                hasExplicitDescribedBy = true;
            }

            if ("announcement" in nextOptions) {
                hasExplicitAnnouncement = true;
            }

            const popoverOptions = getPopoverUpdateOptions(
                nextOptions,
                contentIdChanged ? content.id : null
            );

            if (
                "description" in nextOptions
                || nextOptions.descriptionMode !== undefined
                || nextOptions.descriptionId !== undefined
            ) {
                applyDescriptionPopoverOptions(
                    popoverOptions,
                    description,
                    descriptionMode,
                    hasExplicitDescribedBy,
                    hasExplicitAnnouncement
                );
            }

            popover.update(popoverOptions);
        },

        destroy(): void {
            popover.destroy();
            contentSlot.dispose();
            triggerButton.destroy();
        }
    };

    return composed;
}
