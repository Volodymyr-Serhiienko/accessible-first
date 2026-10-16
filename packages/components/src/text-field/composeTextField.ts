import { createFormField, type FormFieldInvalidState } from "../../../core/src/form-field";
import { createId } from "../../../core/src/id";
import {
    applyCompositionElementOptions,
    createContentSlot,
    createElement,
    getCompositionElementOptions,
    hasVisibleContent,
    toCompositionChildren,
    type BaseCompositionOptions,
    type CompositionContent,
    type ElementAttributes
} from "../composition";
import { createTextField as createTextFieldComponent } from "./createTextField";
import { addEventListener, runCleanups } from "../../../core/src/events";
import { observeNativeFormReset } from "../foundation/observeNativeFormReset";
import {
    accessibleFirstEnglishMessages,
    getLocaleText,
    type LocaleTextProvider
} from "../localization";
import {
    createValidationAnnouncer,
    type ValidationAnnouncer
} from "../../../core/src/validation-announcements";
import {
    textFieldEmailPattern,
    textFieldEmailPatternMismatchMessage
} from "./emailValidation";
import type {
    TextField as TextFieldInstance,
    TextFieldElement,
    TextFieldInputType,
    TextFieldOptions,
    TextFieldSize,
    TextFieldValueChangeDetail,
    TextFieldVariant
} from "./types";

/**
 * Content accepted by text field label, description, and error slots.
 */
export type TextFieldCompositionContent = CompositionContent;

/**
 * Details passed when a composed text field value changes.
 */
export type TextFieldCompositionValueChangeDetail = TextFieldValueChangeDetail;

/**
 * Called on native input events while the user types in a composed text field.
 */
export type TextFieldCompositionOnValueInput = (
    detail: TextFieldCompositionValueChangeDetail,
    textField: ComposedTextField
) => void;

/**
 * Called on native change events from a composed text field.
 */
export type TextFieldCompositionOnValueChange = (
    detail: TextFieldCompositionValueChangeDetail,
    textField: ComposedTextField
) => void;

/**
 * Visual and semantic validation state for a composed text field.
 */
export type TextFieldCompositionValidationState = "idle" | "valid" | "invalid";

/**
 * Reason that triggered text field validation.
 */
export type TextFieldCompositionValidationTrigger = "blur" | "input" | "programmatic";

/**
 * Localized message keys used by TextField fallback validation text.
 */
export type TextFieldMessageKey = "textField.emailPatternMismatchMessage";

/**
 * Localization provider accepted by TextField.
 */
export type TextFieldLocalization = LocaleTextProvider<TextFieldMessageKey>;

/**
 * Custom validation messages for native constraint validation.
 */
export interface TextFieldCompositionValidationMessages {
    valueMissing?: string;
    typeMismatch?: string;
    patternMismatch?: string;
    tooShort?: string;
    tooLong?: string;
    customError?: string;
    default?: string;
    valid?: string;
}

/**
 * Custom validator for composed text fields.
 *
 * Return a message for invalid input, or null/undefined for valid input.
 */
export type TextFieldCompositionValidator = (
    value: string,
    control: TextFieldElement,
    textField: ComposedTextField
) => string | null | undefined;

/**
 * Details passed when composed text field validation state changes.
 */
export interface TextFieldCompositionValidationDetail {
    value: string;
    valid: boolean;
    state: TextFieldCompositionValidationState;
    message: string;
    validity: ValidityState;
    trigger: TextFieldCompositionValidationTrigger;
    event: Event | null;
}

/**
 * Options accepted by ComposedTextField.validate().
 */
export interface TextFieldCompositionValidateOptions {
    trigger?: TextFieldCompositionValidationTrigger;
    event?: Event | null;
    announce?: boolean;
}

/**
 * Called when composed text field validation state changes.
 */
export type TextFieldCompositionOnValidationChange = (
    detail: TextFieldCompositionValidationDetail,
    textField: ComposedTextField
) => void;

/**
 * Options for TextField().
 */
export interface TextFieldCompositionOptions
    extends Omit<TextFieldOptions, "onValueInput" | "onValueChange">,
        BaseCompositionOptions {
    label: TextFieldCompositionContent;
    description?: TextFieldCompositionContent | null;
    errorMessage?: TextFieldCompositionContent | null;
    multiline?: boolean;
    rows?: number | null;
    controlOptions?: BaseCompositionOptions;
    labelOptions?: BaseCompositionOptions;
    descriptionOptions?: BaseCompositionOptions;
    errorOptions?: BaseCompositionOptions;
    type?: TextFieldInputType;
    variant?: TextFieldVariant;
    size?: TextFieldSize;
    validateOnBlur?: boolean;
    validateOnInput?: boolean;
    showValidState?: boolean;
    announceValidation?: boolean;
    validationMessages?: TextFieldCompositionValidationMessages;
    locale?: TextFieldLocalization | null;
    validator?: TextFieldCompositionValidator | null;
    onValidationChange?: TextFieldCompositionOnValidationChange | null;
    onValueInput?: TextFieldCompositionOnValueInput | null;
    onValueChange?: TextFieldCompositionOnValueChange | null;
}

/**
 * Options accepted by ComposedTextField.update().
 *
 * defaultValue and multiline are creation-time only.
 */
export interface TextFieldCompositionUpdateOptions
    extends Partial<Omit<TextFieldCompositionOptions, "defaultValue" | "multiline">> {}

/**
 * Text field created by the composition API.
 */
export interface ComposedTextField
    extends Omit<TextFieldInstance, "element" | "control" | "update" | "destroy"> {
    readonly element: HTMLElement;
    readonly control: TextFieldElement;
    readonly label: HTMLLabelElement;
    readonly description: HTMLElement;
    readonly errorMessage: HTMLElement;
    readonly controlWrapper: HTMLElement;
    readonly validationIcon: HTMLElement;
    /** Obsolete/destroyed checks return an inactive, invalid result without late effects. */
    validate(options?: TextFieldCompositionValidateOptions): TextFieldCompositionValidationDetail;
    getValidationState(): TextFieldCompositionValidationState;
    clearValidation(): void;
    setLabelContent(content: TextFieldCompositionContent): void;
    setDescription(content: TextFieldCompositionContent | null): void;
    setErrorMessage(content: TextFieldCompositionContent | null): void;
    update(options: TextFieldCompositionUpdateOptions): void;
    destroy(): void;
}

function isTextAreaElement(element: TextFieldElement): element is HTMLTextAreaElement {
    return element.localName === "textarea";
}

function hasDefaultEmailPattern(control: TextFieldElement): control is HTMLInputElement {
    return !isTextAreaElement(control)
        && control.type === "email"
        && control.getAttribute("pattern") === textFieldEmailPattern;
}

function isResetControl(target: EventTarget | null): target is HTMLButtonElement | HTMLInputElement {
    if (!target) return false;
    const element = target as HTMLElement;
    return (
        (element.localName === "button" || element.localName === "input")
        && (target as HTMLButtonElement | HTMLInputElement).type === "reset"
    );
}

function shouldSkipBlurValidation(event: FocusEvent, control: TextFieldElement): boolean {
    const nextTarget = event.relatedTarget;

    const nextElement = nextTarget as HTMLElement | null;
    if (nextElement?.localName && nextElement.hasAttribute("data-af-password-visibility")
        && nextElement.parentElement === control.parentElement) return true;

    if (!isResetControl(nextTarget)) return false;

    return control.form !== null && nextTarget.form === control.form;
}

function getControlAttributes(options: TextFieldCompositionOptions): ElementAttributes {
    const attributes: ElementAttributes = {
        "data-af-text-field-control": ""
    };

    if (!options.multiline) attributes.type = options.type ?? "text";
    if ("placeholder" in options) attributes.placeholder = options.placeholder ?? null;
    if ("name" in options) attributes.name = options.name ?? null;
    if ("autocomplete" in options) attributes.autocomplete = options.autocomplete ?? null;
    if ("inputMode" in options) attributes.inputmode = options.inputMode ?? null;
    if ("minLength" in options) attributes.minlength = options.minLength ?? null;
    if ("maxLength" in options) attributes.maxlength = options.maxLength ?? null;
    if (!options.multiline && "pattern" in options) attributes.pattern = options.pattern ?? null;
    if (options.disabled !== undefined) attributes.disabled = options.disabled;
    if (options.required !== undefined) attributes.required = options.required;
    if (options.readOnly !== undefined) attributes.readonly = options.readOnly;

    return attributes;
}

function getTextFieldOptions(
    options: Partial<TextFieldCompositionOptions>,
    onValueInput: NonNullable<TextFieldOptions["onValueInput"]>,
    onValueChange: NonNullable<TextFieldOptions["onValueChange"]>
): TextFieldOptions {
    const textFieldOptions: TextFieldOptions = {
        onValueInput,
        onValueChange
    };

    if ("value" in options) textFieldOptions.value = options.value ?? "";
    if (options.defaultValue !== undefined) textFieldOptions.defaultValue = options.defaultValue;
    if (options.type !== undefined) textFieldOptions.type = options.type;
    if (options.disabled !== undefined) textFieldOptions.disabled = options.disabled;
    if (options.required !== undefined) textFieldOptions.required = options.required;
    if (options.readOnly !== undefined) textFieldOptions.readOnly = options.readOnly;
    if (options.invalid !== undefined) textFieldOptions.invalid = options.invalid;
    if ("name" in options) textFieldOptions.name = options.name ?? null;
    if ("placeholder" in options) textFieldOptions.placeholder = options.placeholder ?? null;
    if ("autocomplete" in options) textFieldOptions.autocomplete = options.autocomplete ?? null;
    if ("inputMode" in options) textFieldOptions.inputMode = options.inputMode ?? null;
    if ("minLength" in options) textFieldOptions.minLength = options.minLength ?? null;
    if ("maxLength" in options) textFieldOptions.maxLength = options.maxLength ?? null;
    if ("pattern" in options) textFieldOptions.pattern = options.pattern ?? null;
    if (options.variant !== undefined) textFieldOptions.variant = options.variant;
    if (options.size !== undefined) textFieldOptions.size = options.size;

    return textFieldOptions;
}

/**
 * Creates an accessible text input or textarea with label, description,
 * error message, form-field semantics, and default styling hooks.
 */
export function TextField(options: TextFieldCompositionOptions): ComposedTextField {
    const element = createElement("div", getCompositionElementOptions(options, {
        "data-af-composition": "text-field"
    }));

    const control = createElement(
        options.multiline ? "textarea" : "input",
        getCompositionElementOptions(options.controlOptions, getControlAttributes(options))
    ) as TextFieldElement;

    if (!control.id) {
        control.id = createId("af-text-field");
    }

    const label = createElement("label", getCompositionElementOptions(options.labelOptions, {
        "data-af-text-field-label": "",
        for: control.id
    }));

    const description = createElement("div", getCompositionElementOptions(options.descriptionOptions, {
        "data-af-text-field-description": ""
    }));

    const errorMessage = createElement("div", getCompositionElementOptions(options.errorOptions, {
        "data-af-text-field-error": ""
    }));

    const labelSlot = createContentSlot(label, toCompositionChildren(options.label));
    const descriptionSlot = createContentSlot(description, toCompositionChildren(options.description));
    const errorSlot = createContentSlot(errorMessage, toCompositionChildren(options.errorMessage));

    const controlWrapper = createElement("div", {
        attributes: {
            "data-af-text-field-control-wrap": ""
        }
    });

    const validationIcon = createElement("span", {
        attributes: {
            "data-af-text-field-validation-icon": "",
            "aria-hidden": "true"
        }
    });

    validationIcon.hidden = true;
    controlWrapper.append(control, validationIcon);
    element.append(label, controlWrapper, description, errorMessage);

    let destroyed = false;
    let validationRevision = 0;
    let composed!: ComposedTextField;
    let onValueInput = options.onValueInput ?? null;
    let onValueChange = options.onValueChange ?? null;
    let invalid: FormFieldInvalidState = options.invalid ?? false;
    let rows = options.rows ?? null;
    let validateOnBlur = options.validateOnBlur ?? true;
    let validateOnInput = options.validateOnInput ?? false;
    let showValidState = options.showValidState ?? true;
    let announceValidation = options.announceValidation ?? true;
    let validationMessages = options.validationMessages ?? {};
    let locale: TextFieldLocalization | null = options.locale ?? null;
    let unsubscribeLocale: (() => void) | null = null;
    let validator = options.validator ?? null;
    let onValidationChange = options.onValidationChange ?? null;
    let validationState: TextFieldCompositionValidationState = "idle";
    let validationAnnouncer: ValidationAnnouncer | null = null;

    const formField = createFormField(control);

    function syncControlId(): void {
        if (!control.id) {
            control.id = createId("af-text-field");
        }

        label.htmlFor = control.id;
    }

    function syncRows(): void {
        if (!isTextAreaElement(control)) return;

        if (rows === null) {
            control.removeAttribute("rows");
            return;
        }

        control.rows = rows;
    }

    function syncDescriptionVisibility(): void {
        description.hidden = !hasVisibleContent(description);
    }

    function syncErrorVisibility(): void {
        errorMessage.hidden = !hasVisibleContent(errorMessage);
    }

    function syncRequiredMarker(): void {
        label.toggleAttribute("data-af-required", textField.isRequired());
    }

    function getDefaultEmailPatternMessage(): string {
        return getLocaleText(
            locale,
            "textField.emailPatternMismatchMessage",
            accessibleFirstEnglishMessages["textField.emailPatternMismatchMessage"]
        );
    }

    function getNativeValidationMessage(): string {
        const validity = control.validity;

        if (validity.valueMissing) return validationMessages.valueMissing ?? control.validationMessage;
        if (validity.typeMismatch) return validationMessages.typeMismatch ?? control.validationMessage;
        if (validity.patternMismatch) {
            return validationMessages.patternMismatch
                ?? (hasDefaultEmailPattern(control)
                    ? getDefaultEmailPatternMessage()
                    : control.validationMessage);
        }
        if (validity.tooShort) return validationMessages.tooShort ?? control.validationMessage;
        if (validity.tooLong) return validationMessages.tooLong ?? control.validationMessage;
        if (validity.customError) return validationMessages.customError ?? control.validationMessage;

        return validationMessages.default ?? control.validationMessage;
    }

    function setValidationVisualState(state: TextFieldCompositionValidationState): void {
        const visualState = state === "valid" && !showValidState ? "idle" : state;

        validationIcon.hidden = visualState === "idle";

        for (const target of [element, controlWrapper, validationIcon]) {
            if (visualState === "idle") {
                target.removeAttribute("data-af-validation-state");
            } else {
                target.setAttribute("data-af-validation-state", visualState);
            }
        }
    }

    function announceInvalidValidation(detail: TextFieldCompositionValidationDetail): void {
        if (!announceValidation || detail.state !== "invalid" || !detail.message.trim()) return;

        validationAnnouncer ??= createValidationAnnouncer({ container: element });
        validationAnnouncer.announceError({
            control,
            message: detail.message
        });
    }

    function syncFormFieldReferences(): void {
        if (destroyed) return;
        syncControlId();
        syncRows();
        syncDescriptionVisibility();
        syncErrorVisibility();
        syncRequiredMarker();

        formField.setLabel(label);
        formField.setDescription(description.hidden ? null : description);
        formField.setErrorMessage(!invalid || errorMessage.hidden ? null : errorMessage);
    }

    function setDescription(content: TextFieldCompositionContent | null): void {
        if (destroyed) return;
        descriptionSlot.set(toCompositionChildren(content));
        syncFormFieldReferences();
    }

    function setErrorMessage(content: TextFieldCompositionContent | null): void {
        if (destroyed) return;
        errorSlot.set(toCompositionChildren(content));
        syncFormFieldReferences();
    }

    function setLabelContent(content: TextFieldCompositionContent): void {
        if (destroyed) return;
        labelSlot.set(toCompositionChildren(content));
        syncFormFieldReferences();
    }

    function syncLocaleSubscription(): void {
        unsubscribeLocale?.();
        unsubscribeLocale = null;

        if (destroyed || !locale?.subscribe) return;

        unsubscribeLocale = locale.subscribe(() => {
            if (validationState === "invalid") {
                composed.validate({ trigger: "programmatic", announce: false });
            }
        });
    }

    const textField = createTextFieldComponent(
        control,
        getTextFieldOptions(
            options,
            (detail) => onValueInput?.(detail, composed),
            (detail) => onValueChange?.(detail, composed)
        )
    );

    control.defaultValue = control.value;

    syncFormFieldReferences();
    syncLocaleSubscription();

    function inactiveValidation(validateOptions: TextFieldCompositionValidateOptions): TextFieldCompositionValidationDetail {
        return { value: control.value, valid: false, state: "idle", message: "",
            validity: control.validity, trigger: validateOptions.trigger ?? "programmatic",
            event: validateOptions.event ?? null };
    }

    composed = {
        ...textField,
        element,
        control,
        label,
        description,
        errorMessage,
        controlWrapper,
        validationIcon,

        validate(validateOptions = {}): TextFieldCompositionValidationDetail {
            if (destroyed) return inactiveValidation(validateOptions);
            if (!control.willValidate) {
                composed.clearValidation();
                return { ...inactiveValidation(validateOptions), valid: true };
            }

            const revision = ++validationRevision;
            const value = control.value;
            const obsolete = () => destroyed || validationRevision !== revision || control.value !== value;
            const trigger = validateOptions.trigger ?? "programmatic";
            const event = validateOptions.event ?? null;
            const customMessage = validator?.(value, control, composed) ?? "";
            if (obsolete()) return inactiveValidation(validateOptions);

            control.setCustomValidity(customMessage);

            const optionalEmpty = !control.required && control.value.trim() === "" && !validator;
            const valid = optionalEmpty || control.checkValidity();
            if (obsolete() || !control.willValidate || valid !== control.validity.valid) return inactiveValidation(validateOptions);
            const state: TextFieldCompositionValidationState = optionalEmpty
                ? "idle"
                : valid ? "valid" : "invalid";
            const message = valid ? validationMessages.valid ?? "" : getNativeValidationMessage();

            validationState = state;
            setValidationVisualState(state);

            if (state === "invalid") {
                invalid = true;
                textField.setInvalid(true);
                setErrorMessage(message);
            } else {
                invalid = false;
                textField.setInvalid(false);
                setErrorMessage(null);
            }
            if (obsolete()) return inactiveValidation(validateOptions);

            const detail: TextFieldCompositionValidationDetail = {
                value: control.value,
                valid,
                state,
                message,
                validity: control.validity,
                trigger,
                event
            };

            if (validateOptions.announce ?? trigger !== "input") {
                announceInvalidValidation(detail);
            }

            onValidationChange?.(detail, composed);
            if (obsolete()) return inactiveValidation(validateOptions);
            syncFormFieldReferences();

            return detail;
        },

        getValidationState(): TextFieldCompositionValidationState {
            return validationState;
        },

        clearValidation(): void {
            if (destroyed) return;
            validationRevision += 1;
            validationAnnouncer?.clear();
            validationState = "idle";
            control.setCustomValidity("");
            setValidationVisualState("idle");
            invalid = false;
            textField.setInvalid(false);
            setErrorMessage(null);
            syncFormFieldReferences();
        },
        setLabelContent,
        setDescription,
        setErrorMessage,

        setInvalid(nextInvalid): void {
            if (destroyed) return;
            validationRevision += 1;
            invalid = nextInvalid;
            textField.setInvalid(nextInvalid);
            syncFormFieldReferences();
        },

        update(nextOptions): void {
            if (destroyed) return;
            validationRevision += 1;
            applyCompositionElementOptions(element, nextOptions);

            if (nextOptions.controlOptions !== undefined) {
                applyCompositionElementOptions(control, nextOptions.controlOptions);
                control.setAttribute("data-af-text-field-control", "");
                syncControlId();
            }

            if (nextOptions.labelOptions !== undefined) {
                applyCompositionElementOptions(label, nextOptions.labelOptions);
                label.setAttribute("data-af-text-field-label", "");
                syncControlId();
            }

            if (nextOptions.descriptionOptions !== undefined) {
                applyCompositionElementOptions(description, nextOptions.descriptionOptions);
                description.setAttribute("data-af-text-field-description", "");
            }

            if (nextOptions.errorOptions !== undefined) {
                applyCompositionElementOptions(errorMessage, nextOptions.errorOptions);
                errorMessage.setAttribute("data-af-text-field-error", "");
            }

            if (nextOptions.label !== undefined) setLabelContent(nextOptions.label);
            if ("description" in nextOptions) setDescription(nextOptions.description ?? null);
            if ("errorMessage" in nextOptions) setErrorMessage(nextOptions.errorMessage ?? null);
            if (destroyed) return;
            if (nextOptions.rows !== undefined) rows = nextOptions.rows;

            if ("onValueInput" in nextOptions) {
                onValueInput = nextOptions.onValueInput ?? null;
            }

            if ("onValueChange" in nextOptions) {
                onValueChange = nextOptions.onValueChange ?? null;
            }

            if (nextOptions.invalid !== undefined) {
                invalid = nextOptions.invalid;
            }

            if (nextOptions.validateOnBlur !== undefined) validateOnBlur = nextOptions.validateOnBlur;
            if (nextOptions.validateOnInput !== undefined) validateOnInput = nextOptions.validateOnInput;
            if (nextOptions.showValidState !== undefined) showValidState = nextOptions.showValidState;
            if (nextOptions.announceValidation !== undefined) announceValidation = nextOptions.announceValidation;
            if (nextOptions.validationMessages !== undefined) validationMessages = nextOptions.validationMessages;
            if ("locale" in nextOptions) {
                locale = nextOptions.locale ?? null;
                syncLocaleSubscription();
            }
            if ("validator" in nextOptions) validator = nextOptions.validator ?? null;
            if ("onValidationChange" in nextOptions) onValidationChange = nextOptions.onValidationChange ?? null;

            textField.update(getTextFieldOptions(
                nextOptions,
                (detail) => onValueInput?.(detail, composed),
                (detail) => onValueChange?.(detail, composed)
            ));

            syncFormFieldReferences();
        },

        destroy(): void {
            if (destroyed) return;
            destroyed = true;
            validationRevision += 1;
            const announcer = validationAnnouncer;
            validationAnnouncer = null;
            const unsubscribe = unsubscribeLocale;
            unsubscribeLocale = null;
            runCleanups([labelSlot.dispose, descriptionSlot.dispose, errorSlot.dispose,
                () => formField.destroy(), () => textField.destroy(),
                () => control.setCustomValidity(""), () => unsubscribe?.(),
                ...validationCleanups, () => announcer?.destroy()]);
        },

        isDestroyed(): boolean {
            return destroyed;
        },

        setValue(value): void {
            if (destroyed) return;
            validationRevision += 1;
            textField.setValue(value);
        },

        setDisabled(disabled): void {
            if (destroyed) return;
            validationRevision += 1;
            textField.setDisabled(disabled);
        },

        setRequired(required): void {
            if (destroyed) return;
            validationRevision += 1;
            textField.setRequired(required);
            syncRequiredMarker();
        },

        setReadOnly(readOnly): void {
            if (destroyed) return;
            validationRevision += 1;
            textField.setReadOnly(readOnly);
        }
    };

    const validationCleanups = [
        observeNativeFormReset(control, () => [control], () => composed.clearValidation()),
        addEventListener<FocusEvent>(control, "blur", (event) => {
            if (validateOnBlur && !shouldSkipBlurValidation(event, control)) {
                composed.validate({ trigger: "blur", event });
            }
        }),
        addEventListener<Event>(control, "input", (event) => {
            if (validateOnInput) {
                composed.validate({ trigger: "input", event, announce: false });
            } else if (composed.getValidationState() !== "idle") {
                composed.clearValidation();
            }
        })
    ];

    return composed;
}
