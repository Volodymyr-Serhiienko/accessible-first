import {
    applyCompositionElementOptions,
    createContentSlot,
    createElement,
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
    DisclosureOptions
} from "./types";

export type DisclosureCompositionContent = CompositionContent;

export type DisclosureDescriptionMode = "content" | "aria";

export type DisclosureCompositionOnOpenChange = (
    open: boolean,
    disclosure: ComposedDisclosure
) => void;

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
    update(options: Partial<DisclosureCompositionOptions>): void;
    destroy(): void;
}

function hasDescription(value: string | null | undefined): value is string {
    return Boolean(value?.trim());
}

function getDescriptionText(description: HTMLElement): string {
    return description.textContent?.replace(/\s+/g, " ").trim() ?? "";
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
    options: Partial<DisclosureCompositionOptions>,
    onOpenChange: (open: boolean) => void,
    descriptionAnnouncement: DisclosureAnnouncement | undefined,
    shouldSyncDescriptionAnnouncement: boolean
): Partial<DisclosureOptions> {
    const disclosureOptions: Partial<DisclosureOptions> = {};

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

    let descriptionMode = options.descriptionMode ?? "aria";
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
