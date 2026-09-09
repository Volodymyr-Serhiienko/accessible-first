import {
    describe,
    expect,
    it,
    vi
} from "vitest";
import { Checkbox } from "../../../packages/components/src/checkbox";
import { RadioGroup } from "../../../packages/components/src/radio-group";
import { Select } from "../../../packages/components/src/select";
import { Switch } from "../../../packages/components/src/switch";
import { TextField } from "../../../packages/components/src/text-field";

describe("Native control contracts", () => {
    it("keeps TextField and Select native, labelled, and event-driven", () => {
        const onTextFieldChange = vi.fn();
        const onSelectChange = vi.fn();

        const textField = TextField({
            label: "Email address",
            description: "Used only for account recovery.",
            type: "email",
            onValueChange: onTextFieldChange
        });
        const select = Select({
            label: "Learning language",
            placeholder: "Choose a language",
            defaultValue: "uk",
            items: [
                { value: "en", label: "English" },
                { value: "uk", label: "Ukrainian" },
                { value: "no", label: "Norwegian" }
            ],
            onValueChange: onSelectChange
        });

        document.body.append(textField.element, select.element);

        expect(textField.control.localName).toBe("input");
        expect(textField.control.type).toBe("email");
        expect(textField.control.getAttribute("role")).toBeNull();
        expect(textField.label.htmlFor).toBe(textField.control.id);
        expect(textField.control.getAttribute("aria-describedby"))
            .toBe(textField.description.id);

        textField.control.value = "learner@example.com";
        textField.control.dispatchEvent(new Event("change", { bubbles: true }));

        expect(onTextFieldChange).toHaveBeenCalledWith(
            expect.objectContaining({
                value: "learner@example.com"
            }),
            textField
        );

        const selectLabel = select.getLabelElement();

        expect(select.select.localName).toBe("select");
        expect(select.select.getAttribute("role")).toBeNull();
        expect(selectLabel?.htmlFor).toBe(select.select.id);
        expect(select.getValue()).toBe("uk");
        expect(select.getSelectedItems().map((item) => item.value))
            .toEqual(["uk"]);

        select.select.value = "no";
        select.select.dispatchEvent(new Event("change", { bubbles: true }));

        expect(onSelectChange).toHaveBeenCalledWith(
            expect.objectContaining({
                value: "no",
                text: "Norwegian",
                selectedItems: [
                    expect.objectContaining({ value: "no" })
                ]
            }),
            select
        );

        textField.destroy();
        select.destroy();
    });

    it("uses a native checkbox and an explicit switch role only where needed", () => {
        const onCheckboxChange = vi.fn();
        const onSwitchChange = vi.fn();

        const checkbox = Checkbox({
            label: "Include review exercises",
            description: "Adds previous words to this lesson.",
            defaultChecked: "mixed",
            onCheckedChange: onCheckboxChange
        });
        const switchControl = Switch({
            label: "Reduce motion",
            description: "Use fewer interface animations.",
            defaultChecked: true,
            onCheckedChange: onSwitchChange
        });

        document.body.append(checkbox.element, switchControl.element);

        expect(checkbox.input.type).toBe("checkbox");
        expect(checkbox.input.getAttribute("role")).toBeNull();
        expect(checkbox.label.htmlFor).toBe(checkbox.input.id);
        expect(checkbox.input.indeterminate).toBe(true);
        expect(checkbox.input.getAttribute("aria-checked")).toBe("mixed");
        expect(checkbox.input.getAttribute("aria-describedby"))
            .toBe(checkbox.description.id);

        checkbox.input.indeterminate = false;
        checkbox.input.checked = true;
        checkbox.input.dispatchEvent(new Event("change", { bubbles: true }));

        expect(onCheckboxChange).toHaveBeenCalledWith(
            expect.objectContaining({
                checked: true,
                checkedState: true
            }),
            checkbox
        );

        expect(switchControl.input.type).toBe("checkbox");
        expect(switchControl.input.getAttribute("role")).toBe("switch");
        expect(switchControl.label.htmlFor).toBe(switchControl.input.id);
        expect(switchControl.input.getAttribute("aria-checked")).toBe("true");
        expect(switchControl.input.getAttribute("aria-describedby"))
            .toBe(switchControl.description.id);

        switchControl.input.checked = false;
        switchControl.input.dispatchEvent(new Event("change", { bubbles: true }));

        expect(onSwitchChange).toHaveBeenCalledWith(
            expect.objectContaining({
                checked: false
            }),
            switchControl
        );

        checkbox.destroy();
        switchControl.destroy();
    });

    it("keeps RadioGroup as a native fieldset with labelled radio inputs", () => {
        const onValueChange = vi.fn();
        const group = RadioGroup({
            label: "Practice pace",
            description: "Choose how many new words each lesson introduces.",
            defaultValue: "standard",
            items: [
                {
                    value: "light",
                    label: "Light pace",
                    description: "Five new words."
                },
                {
                    value: "standard",
                    label: "Standard pace",
                    description: "Ten new words."
                }
            ],
            onValueChange
        });

        const [light, standard] = group.items;

        if (!light || !standard) {
            throw new Error("Expected composed radio group items.");
        }

        document.body.append(group.element);

        expect(group.element.localName).toBe("fieldset");
        expect(group.element.getAttribute("role")).toBeNull();
        expect(group.legend.localName).toBe("legend");
        expect(group.element.getAttribute("aria-describedby"))
            .toBe(group.description.id);
        expect(light.input.type).toBe("radio");
        expect(light.label.htmlFor).toBe(light.input.id);
        expect(light.input.name).toBe(standard.input.name);
        expect(group.getValue()).toBe("standard");
        expect(standard.input.checked).toBe(true);

        light.input.checked = true;
        light.input.dispatchEvent(new Event("change", { bubbles: true }));

        expect(group.getValue()).toBe("light");
        expect(onValueChange).toHaveBeenCalledWith(
            expect.objectContaining({
                value: "light",
                selectedItem: light,
                selectedText: "Light pace"
            }),
            group
        );

        group.destroy();
    });
});
