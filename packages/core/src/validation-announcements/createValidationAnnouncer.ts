import { getOwnerDocument } from "../dom";
import {
    createAnnouncer,
    type AnnouncerOptions,
    type LiveRegionPoliteness
} from "../live-region";
import type {
    ValidationAnnouncement,
    ValidationAnnouncer,
    ValidationAnnouncerOptions,
    ValidationAnnounceOptions
} from "./types";

function getAnnouncerOptions(
    options: ValidationAnnouncerOptions
): AnnouncerOptions {
    const announcerOptions: AnnouncerOptions = {};

    if (options.container) {
        announcerOptions.container = options.container;
    }

    if (options.atomic !== undefined) {
        announcerOptions.atomic = options.atomic;
    }

    return announcerOptions;
}

function getText(element: HTMLElement | null): string {
    return element?.textContent?.trim() ?? "";
}

function getLabelFromIds(control: HTMLElement): string {
    const ids = control.getAttribute("aria-labelledby")?.split(/\s+/) ?? [];
    const ownerDocument = getOwnerDocument(control);

    return ids
        .map((id) => getText(ownerDocument.getElementById(id)))
        .filter(Boolean)
        .join(" ");
}

function getNativeLabel(control: HTMLElement): string {
    if (!control.id) {
        return "";
    }

    const labels = Array.from(
        getOwnerDocument(control).querySelectorAll("label")
    );

    const label = labels.find((candidate) => candidate.htmlFor === control.id);

    return getText(label ?? null);
}

function getControlLabel(control: HTMLElement | null): string {
    if (!control) {
        return "";
    }

    return (
        control.getAttribute("aria-label")?.trim() ||
        getLabelFromIds(control) ||
        getNativeLabel(control)
    );
}

function getAnnouncementControl(
    announcement: ValidationAnnouncement
): HTMLElement | null {
    return announcement.control ?? announcement.field?.control ?? null;
}

/**
 * Creates a validation announcer for form feedback.
 *
 * It formats field errors, summaries, and success messages, then sends them
 * through a shared or internally created live-region announcer.
 */
export function createValidationAnnouncer(
    options: ValidationAnnouncerOptions = {}
): ValidationAnnouncer {
    const defaultPoliteness: LiveRegionPoliteness =
        options.politeness ?? "assertive";
    const includeFieldLabel = options.includeFieldLabel ?? true;
    const ownsAnnouncer = !options.announcer;
    const announcer =
        options.announcer ?? createAnnouncer(getAnnouncerOptions(options));

    let destroyed = false;

    function formatError(error: ValidationAnnouncement): string {
        const message = error.message.trim();

        if (!includeFieldLabel) {
            return message;
        }

        const label =
            error.label?.trim() ||
            getControlLabel(getAnnouncementControl(error));

        return label ? `${label}: ${message}` : message;
    }

    function announce(
        message: string,
        announceOptions: ValidationAnnounceOptions = {}
    ): void {
        if (destroyed || !message.trim()) {
            return;
        }

        announcer.announce(message, {
            politeness: announceOptions.politeness ?? defaultPoliteness
        });
    }

    return {
        announce,

        announceError(error: ValidationAnnouncement): void {
            announce(formatError(error), {
                politeness: error.politeness ?? defaultPoliteness
            });
        },

        announceErrors(errors: readonly ValidationAnnouncement[]): void {
            const validErrors = errors.filter((error) => error.message.trim());

            if (validErrors.length === 0) {
                announcer.clear();
                return;
            }

            if (validErrors.length === 1) {
                const firstError = validErrors[0];

                if (firstError) {
                    this.announceError(firstError);
                }

                return;
            }

            const message =
                options.summaryMessage?.(validErrors) ??
                `There are ${validErrors.length} validation errors. ${validErrors
                    .map(formatError)
                    .join(" ")}`;

            announce(message);
        },

        announceSuccess(
            message = options.successMessage ?? "All fields are valid.",
            announceOptions: ValidationAnnounceOptions = {}
        ): void {
            announce(message, {
                politeness: announceOptions.politeness ?? "polite"
            });
        },

        clear(): void {
            announcer.clear();
        },

        destroy(): void {
            if (destroyed) {
                return;
            }

            destroyed = true;
            announcer.clear();

            if (ownsAnnouncer) {
                announcer.destroy();
            }
        }
    };
}
