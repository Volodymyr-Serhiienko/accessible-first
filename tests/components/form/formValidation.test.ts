import {
    afterEach,
    describe,
    expect,
    it,
    vi
} from "vitest";
import {
    Form,
    type FormValidatableField
} from "../../../packages/components/src/form";

type TestField = FormValidatableField & {
    readonly control: HTMLInputElement;
    readonly clearValidationSpy: ReturnType<typeof vi.fn>;
};

function createInvalidField(): TestField {
    const element = document.createElement("div");
    const label = document.createElement("label");
    const control = document.createElement("input");
    const clearValidationSpy = vi.fn();

    control.id = "lesson-name";
    label.htmlFor = control.id;
    label.textContent = "Lesson name";

    element.append(label, control);

    return {
        element,
        control,
        clearValidation: clearValidationSpy,
        clearValidationSpy,

        validate() {
            return {
                valid: false,
                message: "Enter a lesson name."
            };
        }
    };
}

function getLiveRegionText(): string[] {
    return [
        ...document.querySelectorAll<HTMLElement>("[aria-live]")
    ].map((region) => region.textContent ?? "");
}

afterEach(() => {
    vi.useRealTimers();
});

describe("Form validation announcements", () => {
    it("focuses the first invalid field without duplicating its feedback by default", () => {
        const field = createInvalidField();
        const form = Form({
            fields: [field],
            scrollFirstInvalid: false
        });

        document.body.append(form.element);
        form.body.append(field.element);

        const result = form.validate();

        expect(result.valid).toBe(false);
        expect(result.invalidResults).toHaveLength(1);
        expect(document.activeElement).toBe(field.control);
        expect(document.querySelectorAll("[data-af-live-region]"))
            .toHaveLength(0);

        form.destroy();
    });

    it("announces an explicit summary when focused validation needs extra context", () => {
        vi.useFakeTimers();

        const field = createInvalidField();
        const form = Form({
            fields: [field],
            scrollFirstInvalid: false,
            validationSummaryMessage: () => "Review the highlighted fields."
        });

        document.body.append(form.element);
        form.body.append(field.element);

        form.validate();
        vi.advanceTimersByTime(50);

        expect(document.activeElement).toBe(field.control);
        expect(getLiveRegionText())
            .toContain("Review the highlighted fields.");

        form.destroy();

        expect(document.querySelectorAll("[data-af-live-region]"))
            .toHaveLength(0);
    });

    it("calls onReset after native reset, validation cleanup, and focus restoration", () => {
        vi.useFakeTimers();

        const field = createInvalidField();
        const onReset = vi.fn();
        const form = Form({
            fields: [field],
            onReset,
            scrollFirstInvalid: false
        });

        document.body.append(form.element);
        form.body.append(field.element);

        field.control.defaultValue = "Original value";
        field.control.value = "Draft value";

        form.reset();

        expect(onReset).not.toHaveBeenCalled();

        vi.advanceTimersByTime(20);

        expect(field.control.value).toBe("Original value");
        expect(field.clearValidationSpy).toHaveBeenCalledOnce();
        expect(document.activeElement).toBe(field.control);
        expect(onReset).toHaveBeenCalledWith(
            expect.objectContaining({
                event: expect.objectContaining({ type: "reset" })
            }),
            form
        );

        form.destroy();
    });
});
