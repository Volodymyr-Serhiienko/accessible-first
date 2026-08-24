import { accessibleFirstEnglishMessages } from "../localization";

/**
 * Default email pattern for TextField when type="email" has no custom pattern.
 *
 * Native email validation accepts short local domains like name@host.
 * Accessible First additionally requires at least one dotted domain segment.
 */
export const textFieldEmailPattern = "[^\\s@]+@[^\\s@.]+(?:\\.[^\\s@.]+)+";

/**
 * Default message for the Accessible First email pattern.
 */
export const textFieldEmailPatternMismatchMessage =
    accessibleFirstEnglishMessages["textField.emailPatternMismatchMessage"];