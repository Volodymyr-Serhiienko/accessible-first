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
};

function createInvalidField(): TestField {
    const element = document.createElement("div");
    const label = document.createElement("label");
    const control = document.createElement("input");

    control.id = "lesson-name";
    label.htmlFor = control.id;
    label.textContent = "Lesson name";

    element.append(label, control);

    return {
        element,
        control,

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
});
