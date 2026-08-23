import type { FormField } from "../form-field";
import type {
    Announcer,
    AnnouncerOptions,
    LiveRegionPoliteness
} from "../live-region";

/**
 * Validation message to announce.
 */
export interface ValidationAnnouncement {
    field?: FormField;
    control?: HTMLElement;
    label?: string;
    message: string;
    politeness?: LiveRegionPoliteness;
}

/**
 * Options for one validation announcement.
 */
export interface ValidationAnnounceOptions {
    politeness?: LiveRegionPoliteness;
}

/**
 * Options for createValidationAnnouncer().
 */
export interface ValidationAnnouncerOptions extends AnnouncerOptions {
    announcer?: Announcer;
    politeness?: LiveRegionPoliteness;
    includeFieldLabel?: boolean;
    successMessage?: string;
    summaryMessage?: (errors: readonly ValidationAnnouncement[]) => string | null | undefined;
}

/**
 * Controller returned by createValidationAnnouncer().
 */
export interface ValidationAnnouncer {
    announce(message: string, options?: ValidationAnnounceOptions): void;
    announceError(error: ValidationAnnouncement): void;
    announceErrors(errors: readonly ValidationAnnouncement[]): void;
    announceSuccess(message?: string, options?: ValidationAnnounceOptions): void;
    clear(): void;
    destroy(): void;
}
