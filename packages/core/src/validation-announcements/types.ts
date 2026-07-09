import type { FormField } from "../form-field";
import type {
    Announcer,
    AnnouncerOptions,
    LiveRegionPoliteness
} from "../live-region";

/**
 * Represents an individual validation event message scheduled for screen reader transmission.
 */
export interface ValidationAnnouncement {
    field?: FormField;
    control?: HTMLElement;
    label?: string;
    message: string;
    politeness?: LiveRegionPoliteness;
}

/**
 * Dynamic configuration variations applied when emitting an active validation statement.
 */
export interface ValidationAnnounceOptions {
    politeness?: LiveRegionPoliteness;
}

/**
 * Configuration options for initializing an accessible validation notification dispatcher.
 */
export interface ValidationAnnouncerOptions extends AnnouncerOptions {
    announcer?: Announcer;
    politeness?: LiveRegionPoliteness;
    includeFieldLabel?: boolean;
    successMessage?: string;
    summaryMessage?: (errors: readonly ValidationAnnouncement[]) => string;
}

/**
 * Interface representing an accessible validation reporter.
 * Integrates directly with dynamic aria live regions to announce localized form field inputs,
 * batch structural mutation failures, and task success confirmations.
 */
export interface ValidationAnnouncer {
    announce(message: string, options?: ValidationAnnounceOptions): void;
    announceError(error: ValidationAnnouncement): void;
    announceErrors(errors: readonly ValidationAnnouncement[]): void;
    announceSuccess(message?: string, options?: ValidationAnnounceOptions): void;
    clear(): void;
    destroy(): void;
}
