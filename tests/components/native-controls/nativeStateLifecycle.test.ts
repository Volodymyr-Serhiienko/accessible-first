import { describe, expect, it, vi } from "vitest";
import { Checkbox, createCheckbox } from "../../../packages/components/src/checkbox";
import { Switch, createSwitch } from "../../../packages/components/src/switch";
import { Select, createSelect } from "../../../packages/components/src/select";
import { RadioGroup, createRadioGroup } from "../../../packages/components/src/radio-group";
import { TextField, createTextField } from "../../../packages/components/src/text-field";

describe("Native field state and lifecycle", () => {
    it.each(["checkbox", "switch", "select", "text", "radio"] as const)("resets a composed %s to its initial configured value", async kind => {
        const form = document.createElement("form");
        const control = kind === "checkbox" ? Checkbox({ label: "Check", defaultChecked: true })
            : kind === "switch" ? Switch({ label: "Switch", checked: true })
            : kind === "select" ? Select({ label: "Select", defaultValue: "b", items: [{ value: "a", label: "A" }, { value: "b", label: "B" }] })
            : kind === "radio" ? RadioGroup({ label: "Radio", defaultValue: "b", items: [{ value: "a", label: "A" }, { value: "b", label: "B" }] })
            : TextField({ label: "Text", defaultValue: "b" });
        form.append(control.element);
        document.body.append(form);
        if ("setChecked" in control) control.setChecked(false);
        else control.setValue("a");
        form.reset();
        await Promise.resolve();
        if ("getChecked" in control) expect(control.getChecked()).toBe(true);
        else expect(control.getValue()).toBe("b");
        control.destroy();
    });
    it.each([createCheckbox, createSwitch])("preserves an existing checked input: %s", create => {
        const input = document.createElement("input");
        input.type = "checkbox";
        input.checked = true;
        const control = create(input);
        expect(control.getChecked()).toBe(true);
        control.destroy();
    });

    it("preserves an existing mixed checkbox but normalizes a switch", () => {
        const input = document.createElement("input");
        input.checked = true;
        input.indeterminate = true;
        const checkbox = createCheckbox(input);
        expect(checkbox.getChecked()).toBe("mixed");
        expect(input.checked).toBe(true);
        checkbox.destroy();
        const toggle = createSwitch(input);
        expect(input.indeterminate).toBe(false);
        toggle.destroy();
        expect(input.indeterminate).toBe(true);
    });

    it.each([createCheckbox, createSwitch])("follows native reset without emitting a user change: %s", async create => {
        const form = document.createElement("form");
        const input = document.createElement("input");
        input.type = "checkbox";
        input.defaultChecked = true;
        form.append(input);
        document.body.append(form);
        const onCheckedChange = vi.fn();
        const control = create(input, { onCheckedChange });
        control.setChecked(false);
        form.reset();
        expect(control.getChecked()).toBe(true);
        await Promise.resolve();
        expect(input.getAttribute("aria-checked")).toBe("true");
        expect(input.getAttribute("data-af-checked")).toBe("true");
        expect(onCheckedChange).not.toHaveBeenCalled();
        expect(control.toggleChecked()).toBe(false);
        control.destroy();
    });

    it("ignores canceled, unrelated and post-destroy resets, including reassociation", async () => {
        const first = document.createElement("form");
        const second = document.createElement("form");
        second.id = "other-native-form";
        const input = document.createElement("input");
        input.type = "checkbox";
        input.defaultChecked = true;
        first.append(input);
        document.body.append(first, second);
        const control = createCheckbox(input);
        control.setChecked(false);
        first.addEventListener("reset", event => event.preventDefault(), { once: true });
        first.reset();
        second.reset();
        await Promise.resolve();
        expect(input.getAttribute("aria-checked")).toBe("false");
        input.setAttribute("form", second.id);
        second.reset();
        await Promise.resolve();
        expect(input.getAttribute("aria-checked")).toBe("true");
        second.reset();
        control.destroy();
        input.setAttribute("aria-checked", "author-owned");
        await Promise.resolve();
        expect(input.getAttribute("aria-checked")).toBe("author-owned");
    });

    it("reads text values from the native control after reset, autofill and number sanitization", () => {
        const form = document.createElement("form");
        const input = document.createElement("input");
        input.defaultValue = "original";
        form.append(input);
        const field = createTextField(input);
        field.setValue("changed");
        form.reset();
        expect(field.getValue()).toBe("original");
        input.value = "autofilled";
        expect(field.getValue()).toBe("autofilled");
        field.update({ type: "number", value: "not-a-number" });
        expect(field.getValue()).toBe("");
        field.destroy();
        expect(input.value).toBe("original");
    });

    it.each(["checkbox", "switch", "select", "text", "radio"] as const)("makes late %s updates inert", kind => {
        const input = document.createElement("input");
        const select = document.createElement("select");
        const group = document.createElement("fieldset");
        const control = kind === "checkbox" ? createCheckbox(input)
            : kind === "switch" ? createSwitch(input)
            : kind === "select" ? createSelect(select)
            : kind === "radio" ? createRadioGroup(group)
            : createTextField(input);
        control.destroy();
        const before = control.element.outerHTML;
        control.update({ disabled: true, required: true, name: "late", variant: "plain" });
        expect(control.element.outerHTML).toBe(before);
    });

    it("restores exactly the original select option, even with duplicate values", () => {
        const select = document.createElement("select");
        select.multiple = true;
        select.innerHTML = '<option value="same">First</option><option value="same" selected>Second</option>';
        const control = createSelect(select);
        control.setValue("same");
        control.destroy();
        expect(Array.from(select.options, option => option.selected)).toEqual([false, true]);
    });

    it("restores an explicitly empty single-select selection after changing modes", () => {
        const select = document.createElement("select");
        select.innerHTML = '<option value="a">First</option><option value="b">Second</option>';
        select.selectedIndex = -1;
        const control = createSelect(select, { multiple: true, value: ["a", "b"] });
        control.destroy();
        expect(select.multiple).toBe(false);
        expect(select.selectedIndex).toBe(-1);
    });

    it("inherits fieldset disabled and native required state", () => {
        const group = document.createElement("fieldset");
        group.disabled = true;
        group.innerHTML = '<input type="radio" name="inherited" value="a" required>';
        const control = createRadioGroup(group);
        expect(control.isDisabled()).toBe(true);
        expect(control.isRequired()).toBe(true);
        control.destroy();
    });

    it("reads radio reset state and synchronizes markers silently", async () => {
        const form = document.createElement("form");
        const group = document.createElement("fieldset");
        group.innerHTML = '<input type="radio" name="reset-radio" value="a" checked><input type="radio" name="reset-radio" value="b">';
        form.append(group);
        document.body.append(form);
        const onValueChange = vi.fn();
        const control = createRadioGroup(group, { onValueChange });
        control.setValue("b");
        form.reset();
        expect(control.getValue()).toBe("a");
        await Promise.resolve();
        expect(control.radios.map(radio => radio.getAttribute("data-af-checked"))).toEqual(["true", "false"]);
        expect(onValueChange).not.toHaveBeenCalled();
        control.destroy();
    });

    it("releases removed radios on refresh and takes a fresh snapshot when they return", () => {
        const group = document.createElement("fieldset");
        group.innerHTML = '<input type="radio" name="author" value="a">';
        const input = group.querySelector("input")!;
        const control = createRadioGroup(group, { disabled: true, name: "managed" });
        input.remove();
        control.refresh();
        expect(input.name).toBe("author");
        expect(input.disabled).toBe(false);
        expect(input.hasAttribute("data-af-radio-input")).toBe(false);
        input.name = "new-author";
        group.append(input);
        control.refresh();
        control.destroy();
        expect(input.name).toBe("new-author");
    });

    it("handles radio changes in the element's owning realm", () => {
        const frame = document.createElement("iframe");
        document.body.append(frame);
        const doc = frame.contentDocument!;
        const group = doc.createElement("fieldset");
        group.innerHTML = '<input type="radio" value="a"><input type="radio" value="b">';
        doc.body.append(group);
        const onValueChange = vi.fn();
        const control = createRadioGroup(group, { onValueChange });
        const input = control.radios[1]!;
        input.checked = true;
        const event = doc.createEvent("Event");
        event.initEvent("change", true, false);
        input.dispatchEvent(event);
        expect(onValueChange).toHaveBeenCalledOnce();
        expect(control.getValue()).toBe("b");
        control.destroy();
    });

    it("does not revert a native radio change when updating only field semantics", () => {
        const group = document.createElement("fieldset");
        group.innerHTML = '<input type="radio" name="native-current" value="a" checked><input type="radio" name="native-current" value="b">';
        const control = createRadioGroup(group);
        control.radios[1]!.checked = true;
        control.setInvalid(true);
        expect(control.getValue()).toBe("b");
        control.setRequired(true);
        expect(control.getValue()).toBe("b");
        control.setDisabled(true);
        expect(control.getValue()).toBe("b");
        control.destroy();
    });
});
