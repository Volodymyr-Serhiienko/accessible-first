/**
 * Strategy for validation live-region feedback.
 *
 * `"auto"` keeps detailed field semantics available while avoiding duplicate
 * speech when validation also moves focus to the invalid control.
 */
export type ValidationAnnouncementStrategy = boolean | "auto";

/**
 * Context used to decide whether validation feedback should be announced now.
 */
export interface ValidationAnnouncementDecisionOptions {
    strategy?: ValidationAnnouncementStrategy | undefined;
    announce?: boolean | undefined;
    willMoveFocus?: boolean | undefined;
    hasSummary?: boolean | undefined;
}

/**
 * Decides whether a validation event should use a live-region announcement.
 */
export function shouldAnnounceValidationFeedback(
    options: ValidationAnnouncementDecisionOptions = {}
): boolean {
    const strategy = options.strategy ?? "auto";

    if (strategy === false || options.announce === false) {
        return false;
    }

    if (strategy === true) {
        return true;
    }

    return !(options.willMoveFocus ?? false) || options.hasSummary === true;
}
