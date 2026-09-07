import { getOwnerDocument } from "../dom";
import {
    createDocumentAnnouncementChannel,
    type Announcer,
    type DocumentAnnouncementChannelOptions,
    type LiveRegionPoliteness
} from "../live-region";
import type {
    ValidationAnnouncement,
    ValidationAnnouncer,
    ValidationAnnouncerOptions,
    ValidationAnnounceOptions
} from "./types";

function getChannelOptions(
    options: ValidationAnnouncerOptions
): DocumentAnnouncementChannelOptions {
    const channelOptions: DocumentAnnouncementChannelOptions = {};

    if (options.container !== undefined) {
        channelOptions.document = getOwnerDocument(options.container);
    }

    if (options.atomic !== undefined) {
        channelOptions.atomic = options.atomic;
    }

    return channelOptions;
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
 * through an explicit announcer or the document-level coordinated channel.
 */
export function createValidationAnnouncer(
    options: ValidationAnnouncerOptions = {}
): ValidationAnnouncer {
    const defaultPoliteness: LiveRegionPoliteness =
        options.politeness ?? "assertive";

    const includeFieldLabel = options.includeFieldLabel ?? true;
    const ownsAnnouncer = !options.announcer;

    const announcer: Announcer =
        options.announcer ??
        createDocumentAnnouncementChannel(getChannelOptions(options));

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

    function formatSummary(errors: readonly ValidationAnnouncement[]): string {
        return errors
            .map(formatError)
            .filter(Boolean)
            .join(" ");
    }

    function getSummaryMessage(
        errors: readonly ValidationAnnouncement[]
    ): string | null {
        const message = options.summaryMessage?.(errors)?.trim() ?? "";

        return message || null;
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

            const summaryMessage = getSummaryMessage(validErrors);

            if (summaryMessage) {
                announce(summaryMessage);
                return;
            }

            if (validErrors.length === 1) {
                const firstError = validErrors[0];

                if (firstError) {
                    this.announceError(firstError);
                }

                return;
            }

            announce(formatSummary(validErrors));
        },

        announceSuccess(
            message?: string,
            announceOptions: ValidationAnnounceOptions = {}
        ): void {
            const nextMessage = message ?? options.successMessage ?? "";

            announce(nextMessage, {
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
