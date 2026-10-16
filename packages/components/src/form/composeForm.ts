import { addEventListener, runCleanups, type Cleanup } from "../../../core/src/events";
import { focusElement } from "../../../core/src/focus";
import { scrollIntoViewIfNeeded } from "../../../core/src/scroll";
import {
    createValidationAnnouncer,
    shouldAnnounceValidationFeedback,
    type ValidationAnnouncement,
    type ValidationAnnouncementStrategy,
    type ValidationAnnouncer
} from "../../../core/src/validation-announcements";
import { ActionsBar, type ActionsBarOptions } from "../actions-bar";
import {
    applyCompositionElementOptions,
    collectDestroyers,
    createContentSlot,
    createElement,
    getCompositionElementOptions,
    hasCompositionContent,
    toCompositionChildren,
    type BaseCompositionOptions,
    type ComposedNode,
    type CompositionContent
} from "../composition";

/**
 * Content accepted by Form body and actions slots.
 */
export type FormCompositionContent = CompositionContent;

/**
 * Visual variant for Form.
 */
export type FormVariant = "default" | "plain";

/**
 * Form size token.
 */
export type FormSize = "md";

/**
 * Current aggregate validation state for a composed form.
 */
export type FormValidationState = "idle" | "valid" | "invalid";

/**
 * Live-region strategy for aggregate form validation feedback.
 *
 * "auto" avoids duplicate speech when the form moves focus to the first
 * invalid field, unless a custom validation summary message is provided.
 * If focus cannot move or already belongs to that field, errors are announced.
 */
export type FormCompositionValidationAnnouncement = ValidationAnnouncementStrategy;

/**
 * Options passed from Form to a registered field validate() method.
 */
export interface FormFieldValidateOptions {
    trigger?: "programmatic";
    event?: Event | null;
    announce?: boolean;
}

/**
 * Minimal validation result expected from a registered field.
 */
export interface FormFieldValidationResult {
    valid: boolean;
    message: string;
}

/**
 * Field contract accepted by Form validation collection.
 */
export interface FormValidatableField extends ComposedNode<HTMLElement> {
    readonly control?: HTMLElement;
    validate(options?: FormFieldValidateOptions): FormFieldValidationResult;
    clearValidation?(): void;
}

/**
 * Validation result for one registered form field.
 */
export interface FormCompositionFieldValidationDetail {
    field: FormValidatableField;
    control: HTMLElement;
    valid: boolean;
    message: string;
}

/**
 * Aggregate validation result returned by form.validate().
 */
export interface FormCompositionValidationDetail {
    valid: boolean;
    state: FormValidationState;
    fields: FormValidatableField[];
    results: FormCompositionFieldValidationDetail[];
    invalidResults: FormCompositionFieldValidationDetail[];
    event: Event | null;
}

/**
 * Submit detail passed to form submit callbacks.
 */
export interface FormCompositionSubmitDetail extends FormCompositionValidationDetail {
    event: SubmitEvent;
    validated: boolean;
}

/**
 * Reset detail passed after native form reset effects finish.
 */
export interface FormCompositionResetDetail {
    event: Event;
}

/**
 * Called after native reset, validation cleanup, and optional focus restoration.
 */
export type FormCompositionOnReset = (
    detail: FormCompositionResetDetail,
    form: ComposedForm
) => void;

/**
 * Builds a localized validation summary announcement for invalid form submits.
 */
export type FormCompositionValidationSummaryMessage = (
    errors: readonly ValidationAnnouncement[]
) => string | null | undefined;

/**
 * Options accepted by ComposedForm.validate().
 */
export interface FormCompositionValidateOptions {
    event?: Event | null;
    announce?: boolean;
    focus?: boolean;
}

/**
 * Context passed to Form children factory for convenient field registration.
 */
export interface FormCompositionContext {
    field<TField extends FormValidatableField>(field: TField): TField;
    registerField(field: FormValidatableField): void;
    unregisterField(field: FormValidatableField): void;
    getFields(): FormValidatableField[];
    /** Returns an inactive, invalid result without side effects after destroy(). */
    validate(options?: FormCompositionValidateOptions): FormCompositionValidationDetail;
}

/**
 * Function form of Form children, useful for registering fields inline.
 */
export type FormCompositionChildrenFactory = (
    form: FormCompositionContext
) => FormCompositionContent;

/**
 * Body content accepted by Form().
 */
export type FormCompositionChildren =
    | FormCompositionContent
    | FormCompositionChildrenFactory;

/**
 * Called after form validation runs.
 */
export type FormCompositionOnValidate = (
    detail: FormCompositionValidationDetail,
    form: ComposedForm
) => void;

/**
 * Called during submit handling.
 */
export type FormCompositionOnSubmit = (
    detail: FormCompositionSubmitDetail,
    form: ComposedForm
) => void;

/**
 * Options for Form(), the composition API for submit-validation workflows.
 */
export interface FormCompositionOptions extends BaseCompositionOptions {
    children?: FormCompositionChildren;
    fields?: FormValidatableField[];
    actions?: FormCompositionContent | null;
    actionsOptions?: BaseCompositionOptions;
    name?: string | null;
    action?: string | null;
    method?: string | null;
    target?: string | null;
    autocomplete?: string | null;
    noValidate?: boolean;
    preventDefault?: boolean;
    validateOnSubmit?: boolean;
    focusFirstInvalid?: boolean;
    scrollFirstInvalid?: boolean;
    announceValidation?: FormCompositionValidationAnnouncement;
    announceSuccess?: boolean;
    successMessage?: string;
    validationSummaryMessage?: FormCompositionValidationSummaryMessage | null;
    clearValidationOnReset?: boolean;
    focusFirstOnReset?: boolean;
    variant?: FormVariant;
    size?: FormSize;
    onValidate?: FormCompositionOnValidate | null;
    onSubmit?: FormCompositionOnSubmit | null;
    onValidSubmit?: FormCompositionOnSubmit | null;
    onInvalidSubmit?: FormCompositionOnSubmit | null;
    onReset?: FormCompositionOnReset | null;
}

/**
 * Options accepted by ComposedForm.update().
 */
export interface FormCompositionUpdateOptions extends Partial<FormCompositionOptions> {}

/**
 * Form created by the composition API.
 */
export interface ComposedForm extends ComposedNode<HTMLFormElement> {
    readonly element: HTMLFormElement;
    readonly form: HTMLFormElement;
    readonly body: HTMLElement;
    readonly actions: HTMLElement;
    registerField(field: FormValidatableField): void;
    unregisterField(field: FormValidatableField): void;
    setFields(fields: FormValidatableField[]): void;
    getFields(): FormValidatableField[];
    /** Returns an inactive, invalid result without side effects after destroy(). */
    validate(options?: FormCompositionValidateOptions): FormCompositionValidationDetail;
    clearValidation(): void;
    submit(): void;
    reset(): void;
    setChildren(children: FormCompositionChildren | null): void;
    setActions(actions: FormCompositionContent | null): void;
    update(options: FormCompositionUpdateOptions): void;
    destroy(): void;
}

function isValidatableField(value: unknown): value is FormValidatableField {
    return Boolean(
        value
        && typeof value === "object"
        && "element" in value
        && (value as ComposedNode).element instanceof HTMLElement
        && typeof (value as { validate?: unknown }).validate === "function"
    );
}

function uniqueFields(fields: FormValidatableField[]): FormValidatableField[] {
    return Array.from(new Set(fields));
}

function collectValidatableFields(children: unknown[]): FormValidatableField[] {
    return children.filter(isValidatableField);
}

function getFieldControl(field: FormValidatableField): HTMLElement {
    return field.control ?? field.element;
}

function setOptionalAttribute(
    element: HTMLElement,
    name: string,
    value: string | null | undefined
): void {
    if (value === undefined) return;

    if (value === null) {
        element.removeAttribute(name);
        return;
    }

    element.setAttribute(name, value);
}

function getActionsBarBaseOptions(
    options: BaseCompositionOptions | undefined
): ActionsBarOptions {
    const actionsBarOptions: ActionsBarOptions = {
        align: "end",
        attributes: {
            ...options?.attributes,
            "data-af-form-actions": ""
        }
    };

    if (options?.id !== undefined) actionsBarOptions.id = options.id;
    if (options?.className !== undefined) actionsBarOptions.className = options.className;

    return actionsBarOptions;
}

function toValidationAnnouncement(
    result: FormCompositionFieldValidationDetail
): ValidationAnnouncement {
    return {
        control: result.control,
        message: result.message
    };
}

/**
 * Creates a native form wrapper that can validate registered fields on submit.
 */
export function Form(options: FormCompositionOptions = {}): ComposedForm {
    const element = createElement("form", getCompositionElementOptions(options, {
        "data-af-composition": "form"
    })) as HTMLFormElement;

    const ownerWindow = element.ownerDocument.defaultView ?? window;

    const body = createElement("div", {
        attributes: {
            "data-af-form-body": ""
        }
    });

    const actionsBar = ActionsBar({
        ...getActionsBarBaseOptions(options.actionsOptions),
        primary: options.actions ?? null
    });

    const bodySlot = createContentSlot(body);
    element.append(body, actionsBar.element);

    let composed!: ComposedForm;
    let destroyed = false;
    let optionFields = options.fields ?? [];
    let registeredFields: FormValidatableField[] = [];
    let contentFields: FormValidatableField[] = [];
    let hasActions = hasCompositionContent(options.actions);
    let validationState: FormValidationState = "idle";

    let name = options.name;
    let action = options.action;
    let method = options.method;
    let target = options.target;
    let autocomplete = options.autocomplete;
    let noValidate = options.noValidate ?? true;
    let preventDefault = options.preventDefault ?? true;
    let validateOnSubmit = options.validateOnSubmit ?? true;
    let focusFirstInvalid = options.focusFirstInvalid ?? true;
    let scrollFirstInvalid = options.scrollFirstInvalid ?? true;
    let announceValidation: FormCompositionValidationAnnouncement = options.announceValidation ?? "auto";
    let announceSuccess = options.announceSuccess ?? false;
    let successMessage = options.successMessage;
    let validationSummaryMessage = options.validationSummaryMessage ?? null;
    let clearValidationOnReset = options.clearValidationOnReset ?? true;
    let focusFirstOnReset = options.focusFirstOnReset ?? true;
    let variant: FormVariant = options.variant ?? "default";
    let size: FormSize = options.size ?? "md";

    let onValidate = options.onValidate ?? null;
    let onSubmit = options.onSubmit ?? null;
    let onValidSubmit = options.onValidSubmit ?? null;
    let onInvalidSubmit = options.onInvalidSubmit ?? null;
    let onReset = options.onReset ?? null;
    let validationAnnouncer: ValidationAnnouncer | null = null;
    const cleanups: Cleanup[] = [];
    let pendingResetFrame: number | null = null;
    let resetEventHandled = false;
    let pendingResetEvents: Event[] = [];

    function getAnnouncer(): ValidationAnnouncer {
        validationAnnouncer ??= createValidationAnnouncer({
            container: element,
            summaryMessage: (errors) => validationSummaryMessage?.(errors)
        });
        return validationAnnouncer;
    }

    function getValidationSummaryMessage(
        errors: readonly ValidationAnnouncement[]
    ): string | null {
        const message = validationSummaryMessage?.(errors)?.trim() ?? "";
        return message || null;
    }

    function isValidationAnnouncementDisabled(
        validateOptions: FormCompositionValidateOptions
    ): boolean {
        return announceValidation === false || validateOptions.announce === false;
    }

    function announceInvalidValidation(
        validateOptions: FormCompositionValidateOptions,
        invalidResults: readonly FormCompositionFieldValidationDetail[],
        movedFocus: boolean
    ): void {
        if (invalidResults.length === 0) {
            return;
        }

        const errors = invalidResults.map(toValidationAnnouncement);
        const needsFocusedSummary = announceValidation === "auto" && movedFocus;
        const focusedSummaryMessage = needsFocusedSummary
            ? getValidationSummaryMessage(errors)
            : null;

        if (destroyed) return;

        if (!shouldAnnounceValidationFeedback({
            strategy: announceValidation,
            announce: validateOptions.announce,
            willMoveFocus: movedFocus,
            hasSummary: focusedSummaryMessage !== null
        })) {
            validationAnnouncer?.clear();
            return;
        }

        if (needsFocusedSummary) {
            if (focusedSummaryMessage) {
                getAnnouncer().announce(focusedSummaryMessage);
            }

            return;
        }

        getAnnouncer().announceErrors(errors);
    }

    function announceValidValidation(
        validateOptions: FormCompositionValidateOptions
    ): void {
        if (!announceSuccess || isValidationAnnouncementDisabled(validateOptions)) {
            validationAnnouncer?.clear();
            return;
        }

        getAnnouncer().announceSuccess(successMessage);
    }

    function getFields(): FormValidatableField[] {
        return uniqueFields([
            ...optionFields,
            ...registeredFields,
            ...contentFields
        ]);
    }

    function registerField(field: FormValidatableField): void {
        if (destroyed) return;
        registeredFields = uniqueFields([...registeredFields, field]);
    }

    function unregisterField(field: FormValidatableField): void {
        if (destroyed) return;
        optionFields = optionFields.filter((candidate) => candidate !== field);
        registeredFields = registeredFields.filter((candidate) => candidate !== field);
        contentFields = contentFields.filter((candidate) => candidate !== field);
    }

    function createContext(nextContentFields: FormValidatableField[]): FormCompositionContext {
        return {
            field<TField extends FormValidatableField>(field: TField): TField {
                if (!destroyed) nextContentFields.push(field);
                return field;
            },
            registerField,
            unregisterField,
            getFields,
            validate
        };
    }

    function resolveChildren(
        children: FormCompositionChildren | null | undefined
    ) {
        if (typeof children === "function") {
            const nextContentFields: FormValidatableField[] = [];
            const content = children(createContext(nextContentFields));

            if (!destroyed) contentFields = uniqueFields(nextContentFields);
            return toCompositionChildren(content);
        }

        const nextChildren = toCompositionChildren(children);
        contentFields = collectValidatableFields(nextChildren);

        return nextChildren;
    }

    function syncNativeAttributes(): void {
        element.noValidate = noValidate;

        setOptionalAttribute(element, "name", name);
        setOptionalAttribute(element, "action", action);
        setOptionalAttribute(element, "method", method);
        setOptionalAttribute(element, "target", target);
        setOptionalAttribute(element, "autocomplete", autocomplete);
    }

    function sync(): void {
        if (destroyed) return;
        element.setAttribute("data-af-composition", "form");
        element.setAttribute("data-af-variant", variant);
        element.setAttribute("data-af-size", size);

        if (validationState === "idle") {
            element.removeAttribute("data-af-validation-state");
        } else {
            element.setAttribute("data-af-validation-state", validationState);
        }

        actionsBar.element.hidden = !hasActions;
        actionsBar.element.setAttribute("data-af-form-actions", "");

        syncNativeAttributes();
    }

    function focusFirstControl(controls: readonly HTMLElement[], scroll: boolean): boolean {
        const previous = element.ownerDocument.activeElement;
        for (const control of controls) {
            if (destroyed) return false;
            if (!focusElement(control, { preventScroll: true })) continue;
            if (destroyed) return false;
            if (scroll) scrollIntoViewIfNeeded(control);
            return previous !== control;
        }
        return false;
    }

    function runResetEffects(): void {
        pendingResetFrame = null;

        // A later listener may cancel reset after our listener has run.
        const event = [...pendingResetEvents].reverse().find((candidate) => !candidate.defaultPrevented);
        pendingResetEvents = [];
        if (destroyed || !event) return;

        if (clearValidationOnReset) {
            clearValidation();
        }

        if (!destroyed && focusFirstOnReset) {
            focusFirstControl(getFields().map(getFieldControl), true);
        }

        if (!destroyed) {
            onReset?.({ event }, composed);
        }
    }

    function scheduleResetEffects(): void {
        if (pendingResetFrame !== null) {
            ownerWindow.cancelAnimationFrame(pendingResetFrame);
        }

        pendingResetFrame = ownerWindow.requestAnimationFrame(runResetEffects);
    }

    function validate(
        validateOptions: FormCompositionValidateOptions = {}
    ): FormCompositionValidationDetail {
        const event = validateOptions.event ?? null;
        if (destroyed) return inactiveValidation(event);
        const fields = getFields();

        const results: FormCompositionFieldValidationDetail[] = [];
        for (const field of fields) {
            const result = field.validate({
                trigger: "programmatic",
                event,
                announce: false
            });

            if (destroyed) return inactiveValidation(event);
            results.push({
                field,
                control: getFieldControl(field),
                valid: result.valid,
                message: result.message
            });
        }

        const invalidResults = results.filter((result) => !result.valid);

        validationState = fields.length === 0
            ? "idle"
            : invalidResults.length === 0 ? "valid" : "invalid";

        const detail: FormCompositionValidationDetail = {
            valid: invalidResults.length === 0,
            state: validationState,
            fields,
            results,
            invalidResults,
            event
        };

        sync();

        if (invalidResults.length > 0) {
            const movedFocus = (validateOptions.focus ?? focusFirstInvalid)
                ? focusFirstControl(invalidResults.map((result) => result.control), scrollFirstInvalid)
                : false;
            if (destroyed) return inactiveValidation(event);
            announceInvalidValidation(validateOptions, invalidResults, movedFocus);
        } else {
            announceValidValidation(validateOptions);
        }

        if (destroyed) return inactiveValidation(event);
        onValidate?.(detail, composed);

        return destroyed ? inactiveValidation(event) : detail;
    }

    function inactiveValidation(event: Event | null): FormCompositionValidationDetail {
        return { valid: false, state: "idle", fields: [], results: [], invalidResults: [], event };
    }

    function clearValidation(): void {
        if (destroyed) return;
        validationState = "idle";

        for (const field of getFields()) {
            field.clearValidation?.();
            if (destroyed) return;
        }

        validationAnnouncer?.clear();
        sync();
    }

    function createUnvalidatedSubmitDetail(event: SubmitEvent): FormCompositionSubmitDetail {
        return {
            valid: true,
            state: validationState,
            fields: getFields(),
            results: [],
            invalidResults: [],
            event,
            validated: false
        };
    }

    function toSubmitDetail(
        detail: FormCompositionValidationDetail,
        event: SubmitEvent
    ): FormCompositionSubmitDetail {
        return {
            ...detail,
            event,
            validated: true
        };
    }

    function handleSubmit(event: SubmitEvent): void {
        if (destroyed || event.defaultPrevented || event.target !== element) return;
        if (preventDefault) {
            event.preventDefault();
        }

        if (!validateOnSubmit) {
            onSubmit?.(createUnvalidatedSubmitDetail(event), composed);
            if (destroyed) event.preventDefault();
            return;
        }

        const detail = toSubmitDetail(
            validate({
                event,
                announce: true,
                focus: focusFirstInvalid
            }),
            event
        );

        if (destroyed) {
            event.preventDefault();
            return;
        }
        onSubmit?.(detail, composed);
        if (destroyed) {
            event.preventDefault();
            return;
        }

        if (detail.valid) {
            onValidSubmit?.(detail, composed);
            return;
        }

        event.preventDefault();
        onInvalidSubmit?.(detail, composed);
    }

    function handleReset(event: Event): void {
        if (destroyed || event.target !== element) return;
        resetEventHandled = true;
        pendingResetEvents.push(event);
        scheduleResetEffects();
    }

    function setFields(fields: FormValidatableField[]): void {
        if (destroyed) return;
        optionFields = fields;
    }

    function setChildren(children: FormCompositionChildren | null): void {
        if (destroyed) return;
        const nextChildren = resolveChildren(children);
        if (destroyed) {
            runCleanups(collectDestroyers([...new Set(nextChildren)]).reverse());
            return;
        }
        bodySlot.set(nextChildren);
        if (destroyed) bodySlot.dispose();
    }

    function setActions(actions: FormCompositionContent | null): void {
        if (destroyed) return;
        hasActions = hasCompositionContent(actions);
        actionsBar.setPrimary(actions);
        sync();
    }

    setChildren(options.children);
    sync();

    cleanups.push(addEventListener<SubmitEvent>(element, "submit", handleSubmit));
    cleanups.push(addEventListener<Event>(element, "reset", handleReset));

    composed = {
        element,
        form: element,
        body,
        actions: actionsBar.element,
        registerField,
        unregisterField,
        setFields,
        getFields,
        validate,
        clearValidation,

        submit(): void {
            if (destroyed) return;
            element.requestSubmit();
        },

        reset(): void {
            if (destroyed) return;
            resetEventHandled = false;
            element.reset();

            if (!destroyed && !resetEventHandled) {
                pendingResetEvents.push(new Event("reset"));
                scheduleResetEffects();
            }
        },

        setChildren,
        setActions,

        update(nextOptions: FormCompositionUpdateOptions): void {
            if (destroyed) return;
            applyCompositionElementOptions(element, nextOptions);

            if (nextOptions.fields !== undefined) setFields(nextOptions.fields);
            if ("children" in nextOptions) setChildren(nextOptions.children ?? null);
            if ("actions" in nextOptions) setActions(nextOptions.actions ?? null);
            if (destroyed) return;

            if (nextOptions.actionsOptions !== undefined) {
                actionsBar.update(getActionsBarBaseOptions(nextOptions.actionsOptions));
            }

            if ("name" in nextOptions) name = nextOptions.name ?? null;
            if ("action" in nextOptions) action = nextOptions.action ?? null;
            if ("method" in nextOptions) method = nextOptions.method ?? null;
            if ("target" in nextOptions) target = nextOptions.target ?? null;
            if ("autocomplete" in nextOptions) autocomplete = nextOptions.autocomplete ?? null;

            if (nextOptions.noValidate !== undefined) noValidate = nextOptions.noValidate;
            if (nextOptions.preventDefault !== undefined) preventDefault = nextOptions.preventDefault;
            if (nextOptions.validateOnSubmit !== undefined) validateOnSubmit = nextOptions.validateOnSubmit;
            if (nextOptions.focusFirstInvalid !== undefined) focusFirstInvalid = nextOptions.focusFirstInvalid;
            if (nextOptions.scrollFirstInvalid !== undefined) scrollFirstInvalid = nextOptions.scrollFirstInvalid;
            if (nextOptions.announceValidation !== undefined) announceValidation = nextOptions.announceValidation;
            if (nextOptions.announceSuccess !== undefined) announceSuccess = nextOptions.announceSuccess;
            if (nextOptions.successMessage !== undefined) successMessage = nextOptions.successMessage;
            if ("validationSummaryMessage" in nextOptions) {
                validationSummaryMessage = nextOptions.validationSummaryMessage ?? null;
            }
            if (nextOptions.clearValidationOnReset !== undefined) {
                clearValidationOnReset = nextOptions.clearValidationOnReset;
            }
            if (nextOptions.focusFirstOnReset !== undefined) {
                focusFirstOnReset = nextOptions.focusFirstOnReset;
            }

            if (nextOptions.variant !== undefined) variant = nextOptions.variant;
            if (nextOptions.size !== undefined) size = nextOptions.size;

            if ("onValidate" in nextOptions) onValidate = nextOptions.onValidate ?? null;
            if ("onSubmit" in nextOptions) onSubmit = nextOptions.onSubmit ?? null;
            if ("onValidSubmit" in nextOptions) onValidSubmit = nextOptions.onValidSubmit ?? null;
            if ("onInvalidSubmit" in nextOptions) onInvalidSubmit = nextOptions.onInvalidSubmit ?? null;
            if ("onReset" in nextOptions) {
                onReset = nextOptions.onReset ?? null;
            }

            sync();
        },

        destroy(): void {
            if (destroyed) return;
            destroyed = true;
            if (pendingResetFrame !== null) {
                ownerWindow.cancelAnimationFrame(pendingResetFrame);
                pendingResetFrame = null;
            }
            pendingResetEvents = [];
            optionFields = [];
            registeredFields = [];
            contentFields = [];
            const announcer = validationAnnouncer;
            validationAnnouncer = null;
            runCleanups([
                ...cleanups.splice(0),
                () => bodySlot.dispose(),
                () => actionsBar.destroy(),
                () => announcer?.destroy()
            ]);
        }
    };

    return composed;
}
