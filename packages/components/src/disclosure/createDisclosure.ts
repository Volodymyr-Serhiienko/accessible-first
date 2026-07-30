import {
    createDisclosure as createDisclosureBehavior,
    type Disclosure as CoreDisclosure,
    type DisclosureOptions as CoreDisclosureOptions
} from "../../../core/src/disclosure";
import {
    createAnnouncer,
    type Announcer,
    type LiveRegionPoliteness
} from "../../../core/src/live-region";
import { createComponentLifecycle } from "../foundation";
import { restoreAttribute } from "../../../core/src/dom";

import type {
    Disclosure,
    DisclosureAnnouncement,
    DisclosureAnnouncementContext,
    DisclosureAnnouncementMessage,
    DisclosureOptions
} from "./types";

function normalizeAnnouncementText(value: string): string {
    return value.replace(/\s+/g, " ").trim();
}

function isAnnouncementOptions(
    value: DisclosureAnnouncement
): value is Exclude<DisclosureAnnouncement, boolean | string | DisclosureAnnouncementMessage> {
    return Boolean(value && typeof value === "object");
}

function getPanelText(panel: HTMLElement): string {
    return normalizeAnnouncementText(panel.textContent ?? "");
}

function resolveAnnouncementMessage(
    announcement: DisclosureAnnouncement,
    context: DisclosureAnnouncementContext
): string {
    if (announcement === true) {
        return context.getPanelText();
    }

    if (typeof announcement === "string") {
        return normalizeAnnouncementText(announcement);
    }

    if (typeof announcement === "function") {
        return normalizeAnnouncementText(announcement(context) ?? "");
    }

    if (announcement === false) {
        return "";
    }

    const message = announcement.message;

    if (message === undefined) {
        return context.getPanelText();
    }

    if (typeof message === "function") {
        return normalizeAnnouncementText(message(context) ?? "");
    }

    return normalizeAnnouncementText(message);
}

function getAnnouncementPoliteness(
    announcement: DisclosureAnnouncement
): LiveRegionPoliteness {
    if (isAnnouncementOptions(announcement) && announcement.politeness !== undefined) {
        return announcement.politeness;
    }

    return "polite";
}

function isAnnouncementEnabled(announcement: DisclosureAnnouncement): boolean {
    if (announcement === false) {
        return false;
    }

    if (isAnnouncementOptions(announcement) && announcement.enabled === false) {
        return false;
    }

    return true;
}

/**
 * Creates an accessible disclosure component.
 *
 * It composes core disclosure behavior with component state attributes,
 * optional open announcements, styling hooks, and cleanup.
 */
export function createDisclosure(
    element: HTMLElement,
    options: DisclosureOptions
): Disclosure {
    const lifecycle = createComponentLifecycle(element, {
        name: "disclosure",
        initialState: options.disabled ? "disabled" : "ready"
    });

    const { trigger, panel } = options;

    const originalRootOpen = element.getAttribute("data-af-open");
    const originalVariant = element.getAttribute("data-af-variant");
    const originalSize = element.getAttribute("data-af-size");
    const originalTriggerMarker = trigger.getAttribute("data-af-disclosure-trigger");
    const originalTriggerOpen = trigger.getAttribute("data-af-open");
    const originalPanelMarker = panel.getAttribute("data-af-disclosure-panel");
    const originalPanelOpen = panel.getAttribute("data-af-open");

    let behavior!: CoreDisclosure;
    let onOpenChange = options.onOpenChange ?? null;

    let announcement = options.announcement;
    let announcer: Announcer | null = null;

    function syncOpenAttributes(): void {
        const open = behavior.isOpen() ? "true" : "false";

        element.setAttribute("data-af-open", open);
        trigger.setAttribute("data-af-open", open);
        panel.setAttribute("data-af-open", open);
    }

    function syncDisabledState(): void {
        lifecycle.setState(behavior.isDisabled() ? "disabled" : "ready");
    }

    function announceOpenPanel(open: boolean): void {
        if (!open || announcement === undefined || !isAnnouncementEnabled(announcement)) {
            return;
        }

        const context: DisclosureAnnouncementContext = {
            element,
            trigger,
            panel,
            open,
            getPanelText: () => getPanelText(panel)
        };

        const message = resolveAnnouncementMessage(announcement, context);

        if (!message) {
            return;
        }

        announcer ??= createAnnouncer();
        announcer.announce(message, {
            politeness: getAnnouncementPoliteness(announcement)
        });
    }

    const behaviorOptions: CoreDisclosureOptions = {
        onOpenChange(open) {
            syncOpenAttributes();
            announceOpenPanel(open);
            onOpenChange?.(open);
        }
    };

    const initialOpen = options.open ?? options.defaultOpen;

    if (initialOpen !== undefined) {
        behaviorOptions.defaultOpen = initialOpen;
    }

    if (options.disabled !== undefined) {
        behaviorOptions.disabled = options.disabled;
    }

    element.setAttribute("data-af-variant", options.variant ?? "default");
    element.setAttribute("data-af-size", options.size ?? "md");
    trigger.setAttribute("data-af-disclosure-trigger", "");
    panel.setAttribute("data-af-disclosure-panel", "");

    behavior = createDisclosureBehavior(trigger, panel, behaviorOptions);

    lifecycle.addCleanup(() => {
        behavior.destroy();
        announcer?.destroy();
        announcer = null;
    });

    lifecycle.addCleanup(() => {
        restoreAttribute(element, "data-af-open", originalRootOpen);
        restoreAttribute(element, "data-af-variant", originalVariant);
        restoreAttribute(element, "data-af-size", originalSize);
        restoreAttribute(trigger, "data-af-disclosure-trigger", originalTriggerMarker);
        restoreAttribute(trigger, "data-af-open", originalTriggerOpen);
        restoreAttribute(panel, "data-af-disclosure-panel", originalPanelMarker);
        restoreAttribute(panel, "data-af-open", originalPanelOpen);
    });

    syncOpenAttributes();
    syncDisabledState();

    function setOpen(nextOpen: boolean): void {
        if (lifecycle.isDestroyed()) return;

        behavior.setOpen(nextOpen);
        syncOpenAttributes();
    }

    function setDisabled(nextDisabled: boolean): void {
        if (lifecycle.isDestroyed()) return;

        behavior.setDisabled(nextDisabled);
        syncDisabledState();
    }

    return {
        element,
        trigger,
        panel,

        open(): void {
            setOpen(true);
        },

        close(): void {
            setOpen(false);
        },

        toggle(): void {
            if (lifecycle.isDestroyed()) return;

            behavior.toggle();
            syncOpenAttributes();
        },

        setOpen,

        isOpen(): boolean {
            return behavior.isOpen();
        },

        setDisabled,

        isDisabled(): boolean {
            return behavior.isDisabled();
        },

        update(nextOptions: Partial<DisclosureOptions>): void {
            if (nextOptions.open !== undefined) {
                setOpen(nextOptions.open);
            }

            if (nextOptions.disabled !== undefined) {
                setDisabled(nextOptions.disabled);
            }

            if ("onOpenChange" in nextOptions) {
                onOpenChange = nextOptions.onOpenChange ?? null;
            }

            if (nextOptions.variant !== undefined) {
                element.setAttribute("data-af-variant", nextOptions.variant);
            }

            if (nextOptions.size !== undefined) {
                element.setAttribute("data-af-size", nextOptions.size);
            }

            if (nextOptions.announcement !== undefined) {
                announcement = nextOptions.announcement;
            }
        },

        destroy(): void {
            lifecycle.destroy();
        },

        isDestroyed(): boolean {
            return lifecycle.isDestroyed();
        }
    };
}
