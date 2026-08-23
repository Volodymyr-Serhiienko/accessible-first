import { addEventListener, type Cleanup } from "../../../core/src/events";
import { focusElement } from "../../../core/src/focus";
import { scrollIntoViewIfNeeded } from "../../../core/src/scroll";
import {
    createValidationAnnouncer,
    type ValidationAnnouncement,
    type ValidationAnnouncer
} from "../../../core/src/validation-announcements";
import { ActionsBar, type ActionsBarOptions } from "../actions-bar";
import {
    applyCompositionElementOptions,
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
    announceValidation?: boolean;
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
    let announceValidation = options.announceValidation ?? true;
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
    let validationAnnouncer: ValidationAnnouncer | null = null;
    const cleanups: Cleanup[] = [];
    let pendingResetFrame: number | null = null;
    let resetEventHandled = false;

    function getAnnouncer(): ValidationAnnouncer {
        validationAnnouncer ??= createValidationAnnouncer({
            summaryMessage: (errors) => validationSummaryMessage?.(errors)
        });
        return validationAnnouncer;
    }

    function getFields(): FormValidatableField[] {
        return uniqueFields([
            ...optionFields,
            ...registeredFields,
            ...contentFields
        ]);
    }

    function registerField(field: FormValidatableField): void {
        registeredFields = uniqueFields([...registeredFields, field]);
    }

    function unregisterField(field: FormValidatableField): void {
        optionFields = optionFields.filter((candidate) => candidate !== field);
        registeredFields = registeredFields.filter((candidate) => candidate !== field);
        contentFields = contentFields.filter((candidate) => candidate !== field);
    }

    function createContext(nextContentFields: FormValidatableField[]): FormCompositionContext {
        return {
            field<TField extends FormValidatableField>(field: TField): TField {
                nextContentFields.push(field);
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

            contentFields = uniqueFields(nextContentFields);
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

    function focusInvalidResult(result: FormCompositionFieldValidationDetail): void {
        if (scrollFirstInvalid) {
            scrollIntoViewIfNeeded(result.control);
        }

        focusElement(result.control);
    }

    function focusFirstField(): void {
        const firstField = getFields()[0];

        if (!firstField) return;

        const control = getFieldControl(firstField);

        scrollIntoViewIfNeeded(control);
        focusElement(control);
    }

    function runResetEffects(): void {
        pendingResetFrame = null;

        if (clearValidationOnReset) {
            clearValidation();
        }

        if (focusFirstOnReset) {
            focusFirstField();
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
        const fields = getFields();
        const event = validateOptions.event ?? null;

        const results = fields.map((field): FormCompositionFieldValidationDetail => {
            const result = field.validate({
                trigger: "programmatic",
                event,
                announce: false
            });

            return {
                field,
                control: getFieldControl(field),
                valid: result.valid,
                message: result.message
            };
        });

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

        if (announceValidation && (validateOptions.announce ?? true)) {
            if (invalidResults.length > 0) {
                getAnnouncer().announceErrors(invalidResults.map(toValidationAnnouncement));
            } else if (announceSuccess) {
                getAnnouncer().announceSuccess(successMessage);
            }
        }

        if (
            invalidResults.length > 0
            && (validateOptions.focus ?? focusFirstInvalid)
        ) {
            const firstInvalid = invalidResults[0];

            if (firstInvalid) {
                focusInvalidResult(firstInvalid);
            }
        }

        onValidate?.(detail, composed);

        return detail;
    }

    function clearValidation(): void {
        validationState = "idle";

        for (const field of getFields()) {
            field.clearValidation?.();
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
        if (preventDefault) {
            event.preventDefault();
        }

        if (!validateOnSubmit) {
            onSubmit?.(createUnvalidatedSubmitDetail(event), composed);
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

        onSubmit?.(detail, composed);

        if (detail.valid) {
            onValidSubmit?.(detail, composed);
            return;
        }

        event.preventDefault();
        onInvalidSubmit?.(detail, composed);
    }

    function handleReset(): void {
        resetEventHandled = true;
        scheduleResetEffects();
    }

    function setFields(fields: FormValidatableField[]): void {
        optionFields = fields;
    }

    function setChildren(children: FormCompositionChildren | null): void {
        bodySlot.set(resolveChildren(children));
    }

    function setActions(actions: FormCompositionContent | null): void {
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
            element.requestSubmit();
        },

        reset(): void {
            resetEventHandled = false;
            element.reset();

            if (!resetEventHandled) {
                scheduleResetEffects();
            }
        },

        setChildren,
        setActions,

        update(nextOptions: FormCompositionUpdateOptions): void {
            applyCompositionElementOptions(element, nextOptions);

            if (nextOptions.fields !== undefined) setFields(nextOptions.fields);
            if ("children" in nextOptions) setChildren(nextOptions.children ?? null);
            if ("actions" in nextOptions) setActions(nextOptions.actions ?? null);

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

            sync();
        },

        destroy(): void {
            if (pendingResetFrame !== null) {
                ownerWindow.cancelAnimationFrame(pendingResetFrame);
                pendingResetFrame = null;
            }
            
            for (const cleanup of cleanups.splice(0)) {
                cleanup();
            }

            bodySlot.dispose();
            actionsBar.destroy();
            validationAnnouncer?.destroy();
            validationAnnouncer = null;
        }
    };

    return composed;
}
