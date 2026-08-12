import {
    applyCompositionElementOptions,
    createContentSlot,
    createElement,
    getElementText,
    getCompositionElementOptions,
    toCompositionChildren,
    type BaseCompositionOptions,
    type CompositionContent
} from "../composition";
import { createId } from "../../../core/src/id";
import { createDisclosure } from "./createDisclosure";
import type {
    Disclosure as DisclosureInstance,
    DisclosureAnnouncement,
    DisclosureOptions,
    DisclosureUpdateOptions
} from "./types";

/**
 * Content accepted by Disclosure trigger, description, and panel slots.
 */
export type DisclosureCompositionContent = CompositionContent;

/**
 * Controls whether the visible description is only panel content or also linked to the trigger.
 */
export type DisclosureDescriptionMode = "content" | "aria";

/**
 * Called when a composed disclosure opens or closes.
 */
export type DisclosureCompositionOnOpenChange = (
    open: boolean,
    disclosure: ComposedDisclosure
) => void;

/**
 * Options for Disclosure(), the composition API that creates a trigger and expandable panel.
 */
export interface DisclosureCompositionOptions
    extends Omit<DisclosureOptions, "trigger" | "panel" | "onOpenChange">,
        BaseCompositionOptions {
    trigger: DisclosureCompositionContent;
    panel: DisclosureCompositionContent;
    description?: string | null;
    descriptionId?: string;
    descriptionMode?: DisclosureDescriptionMode;
    onOpenChange?: DisclosureCompositionOnOpenChange | null;
}

/**
 * Options accepted by ComposedDisclosure.update().
 *
 * defaultOpen is creation-time only. Use open, setOpen(), open(), close(), or
 * toggle() to change current state.
 */
export interface DisclosureCompositionUpdateOptions
    extends Partial<Omit<DisclosureCompositionOptions, "defaultOpen">> {}

/**
 * Disclosure created by the composition API.
 */
export interface ComposedDisclosure
    extends Omit<DisclosureInstance, "element" | "trigger" | "panel" | "update" | "destroy"> {
    readonly element: HTMLElement;
    readonly trigger: HTMLButtonElement;
    readonly panel: HTMLElement;
    readonly description: HTMLElement;
    readonly body: HTMLElement;
    setDescription(description: string | null): void;
    setTriggerContent(children: DisclosureCompositionContent): void;
    setPanelContent(children: DisclosureCompositionContent): void;
    update(options: DisclosureCompositionUpdateOptions): void;
    destroy(): void;
}

function hasDescription(value: string | null | undefined): value is string {
    return Boolean(value?.trim());
}

function getDescriptionText(description: HTMLElement): string {
    return getElementText(description);
}

function shouldUseAriaDescription(
    mode: DisclosureDescriptionMode,
    description: HTMLElement
): boolean {
    return mode === "aria" && Boolean(getDescriptionText(description));
}

function syncTriggerDescription(
    trigger: HTMLElement,
    description: HTMLElement,
    mode: DisclosureDescriptionMode
): void {
    if (shouldUseAriaDescription(mode, description)) {
        trigger.setAttribute("aria-describedby", description.id);
        return;
    }

    trigger.removeAttribute("aria-describedby");
}

function getDescriptionAnnouncement(description: HTMLElement): DisclosureAnnouncement | undefined {
    const text = getDescriptionText(description);

    return text || undefined;
}

function getInitialAnnouncement(
    options: DisclosureCompositionOptions,
    description: HTMLElement
): DisclosureAnnouncement | undefined {
    if (options.announcement !== undefined) {
        return options.announcement;
    }

    return getDescriptionAnnouncement(description);
}

function getDisclosureOptions(
    trigger: HTMLElement,
    panel: HTMLElement,
    description: HTMLElement,
    options: DisclosureCompositionOptions,
    onOpenChange: (open: boolean) => void
): DisclosureOptions {
    const disclosureOptions: DisclosureOptions = {
        trigger,
        panel,
        onOpenChange
    };

    const announcement = getInitialAnnouncement(options, description);

    if (options.open !== undefined) {
        disclosureOptions.open = options.open;
    } else {
        disclosureOptions.defaultOpen = options.defaultOpen ?? false;
    }

    if (options.disabled !== undefined) disclosureOptions.disabled = options.disabled;
    if (options.variant !== undefined) disclosureOptions.variant = options.variant;
    if (options.size !== undefined) disclosureOptions.size = options.size;
    if (announcement !== undefined) disclosureOptions.announcement = announcement;

    return disclosureOptions;
}

function getDisclosureUpdateOptions(
    options: DisclosureCompositionUpdateOptions,
    onOpenChange: (open: boolean) => void,
    descriptionAnnouncement: DisclosureAnnouncement | undefined,
    shouldSyncDescriptionAnnouncement: boolean
): DisclosureUpdateOptions {
    const disclosureOptions: DisclosureUpdateOptions = {};

    if (options.open !== undefined) disclosureOptions.open = options.open;
    if (options.disabled !== undefined) disclosureOptions.disabled = options.disabled;
    if (options.variant !== undefined) disclosureOptions.variant = options.variant;
    if (options.size !== undefined) disclosureOptions.size = options.size;

    if ("onOpenChange" in options) {
        disclosureOptions.onOpenChange = onOpenChange;
    }

    if (options.announcement !== undefined) {
        disclosureOptions.announcement = options.announcement;
    } else if (shouldSyncDescriptionAnnouncement) {
        disclosureOptions.announcement = descriptionAnnouncement ?? false;
    }

    return disclosureOptions;
}

/**
 * Creates an accessible disclosure with a button trigger, optional short description, and controlled panel.
 */
export function Disclosure(options: DisclosureCompositionOptions): ComposedDisclosure {
    const element = createElement("div", getCompositionElementOptions(options));
    const trigger = createElement("button", {
        attributes: {
            type: "button"
        }
    });
    const panel = createElement("div");

    const description = createElement("p", {
        id: options.descriptionId ?? createId("af-disclosure-description"),
        text: options.description ?? "",
        attributes: {
            "data-af-disclosure-description": ""
        }
    });

    const body = createElement("div", {
        attributes: {
            "data-af-disclosure-body": ""
        }
    });

    description.hidden = !hasDescription(options.description);
    panel.append(description, body);

    let descriptionMode = options.descriptionMode ?? "content";
    let hasExplicitAnnouncement = options.announcement !== undefined;

    const triggerContent = createContentSlot(trigger, toCompositionChildren(options.trigger));
    const panelContent = createContentSlot(body, toCompositionChildren(options.panel));

    let composed!: ComposedDisclosure;
    let onOpenChange = options.onOpenChange ?? null;

    const handleOpenChange = (open: boolean): void => {
        onOpenChange?.(open, composed);
    };

    syncTriggerDescription(trigger, description, descriptionMode);
    element.append(trigger, panel);

    const disclosure = createDisclosure(
        element,
        getDisclosureOptions(trigger, panel, description, options, handleOpenChange)
    );

    function setDescription(nextDescription: string | null): void {
        const text = nextDescription?.trim() ?? "";

        description.textContent = text;
        description.hidden = !text;
        syncTriggerDescription(trigger, description, descriptionMode);
    }

    function setTriggerContent(children: DisclosureCompositionContent): void {
        triggerContent.set(toCompositionChildren(children));
    }

    function setPanelContent(children: DisclosureCompositionContent): void {
        panelContent.set(toCompositionChildren(children));
    }

    composed = {
        ...disclosure,
        element,
        trigger,
        panel,
        description,
        body,
        setDescription,
        setTriggerContent,
        setPanelContent,

        update(nextOptions): void {
            applyCompositionElementOptions(element, nextOptions);

            if ("onOpenChange" in nextOptions) {
                onOpenChange = nextOptions.onOpenChange ?? null;
            }

            if (nextOptions.descriptionId !== undefined) {
                description.id = nextOptions.descriptionId;
            }

            if ("description" in nextOptions) {
                setDescription(nextOptions.description ?? null);
            }

            if (nextOptions.descriptionMode !== undefined) {
                descriptionMode = nextOptions.descriptionMode;
                syncTriggerDescription(trigger, description, descriptionMode);
            }

            if (nextOptions.announcement !== undefined) {
                hasExplicitAnnouncement = true;
            }

            disclosure.update(getDisclosureUpdateOptions(
                nextOptions,
                handleOpenChange,
                getDescriptionAnnouncement(description),
                !hasExplicitAnnouncement && "description" in nextOptions
            ));

            if (nextOptions.trigger !== undefined) {
                setTriggerContent(nextOptions.trigger);
            }

            if (nextOptions.panel !== undefined) {
                setPanelContent(nextOptions.panel);
            }
        },

        destroy(): void {
            triggerContent.dispose();
            panelContent.dispose();
            disclosure.destroy();
        }
    };

    return composed;
}
