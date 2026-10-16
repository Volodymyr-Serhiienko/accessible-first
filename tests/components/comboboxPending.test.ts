import { describe, expect, it } from "vitest";
import { Combobox, createCombobox } from "../../packages/components/src/combobox";

describe("focus-preserving combobox pending", () => {
    it("blocks pointer/keyboard selection without disabling or dropping focus", () => {
        let selections = 0;
        const filter = Combobox({ label: "Role", value: "all", items: [{ value: "all", label: "All" }, { value: "editor", label: "Editor" }],
            inputOptions: { attributes: { readonly: true } }, autocomplete: "none", openOnFocus: false, pendingMessage: false,
            onValueChange(detail) { if (detail.reason === "selection") selections++; } });
        document.body.append(filter.element);
        filter.input.focus();
        filter.setPending(true);
        filter.input.click();
        filter.input.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", cancelable: true }));
        filter.input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", cancelable: true }));
        filter.getItem("editor")!.option.click();
        expect(filter.getSelectedValue()).toBe("all");
        expect(filter.isOpen()).toBe(false);
        expect(filter.input.disabled).toBe(false);
        expect(filter.input.hasAttribute("aria-disabled")).toBe(false);
        expect(filter.input.getAttribute("aria-busy")).toBe("true");
        expect(document.activeElement).toBe(filter.input);
        for (const key of ["Tab", "Escape", "Home", "c"]) {
            const event = new KeyboardEvent("keydown", { key, ctrlKey: key === "c", cancelable: true });
            filter.input.dispatchEvent(event);
            expect(event.defaultPrevented).toBe(false);
        }
        filter.update({ pending: false });
        filter.input.click();
        filter.input.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", cancelable: true }));
        filter.input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", cancelable: true }));
        expect(filter.getSelectedValue()).toBe("editor");
        expect(selections).toBe(1);
        filter.destroy();
    });

    it("forwards creation/update pending and restores original enhanced attributes", () => {
        const input = document.createElement("input");
        input.setAttribute("aria-busy", "false");
        const listbox = document.createElement("div");
        const option = document.createElement("div");
        option.textContent = "Alpha";
        listbox.append(option);
        const filter = createCombobox(input, listbox, { getOptions: () => [option], pending: true, defaultOpen: true, autoUpdate: false });
        document.body.append(input, listbox);
        input.focus();
        expect(filter.isPending()).toBe(true);
        expect(filter.isOpen()).toBe(false);
        expect(document.activeElement).toBe(input);
        const edit = new InputEvent("beforeinput", { inputType: "insertText", data: "x", cancelable: true });
        input.dispatchEvent(edit);
        expect(edit.defaultPrevented).toBe(true);
        filter.update({ pending: false, disabled: true });
        expect(filter.isPending()).toBe(false);
        expect(input.disabled).toBe(true);
        filter.destroy();
        expect(input.disabled).toBe(false);
        expect(input.getAttribute("aria-busy")).toBe("false");
        input.remove();
        listbox.remove();
    });
});
