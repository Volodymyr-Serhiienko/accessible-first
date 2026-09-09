import {
    describe,
    expect,
    it,
    vi
} from "vitest";
import {
    createCombobox
} from "../../../packages/core/src/combobox";

type TestWindow = Window & typeof globalThis;

function createOption(text: string): HTMLElement {
    const option = document.createElement("div");

    option.textContent = text;

    return option;
}

describe("createCombobox", () => {
    it("keeps focus on the input while keyboard navigation selects and closes options", () => {
        const input = document.createElement("input");
        const listbox = document.createElement("div");
        const firstOption = createOption("Alpha");
        const secondOption = createOption("Beta");

        listbox.append(firstOption, secondOption);
        document.body.append(input, listbox);

        const combobox = createCombobox(input, listbox, {
            getOptions: () => [firstOption, secondOption],
            autoUpdate: false
        });

        input.focus();

        input.dispatchEvent(new KeyboardEvent("keydown", {
            key: "ArrowDown",
            bubbles: true,
            cancelable: true
        }));

        expect(combobox.isOpen()).toBe(true);
        expect(document.activeElement).toBe(input);
        expect(input.getAttribute("aria-activedescendant"))
            .toBe(firstOption.id);

        input.dispatchEvent(new KeyboardEvent("keydown", {
            key: "Enter",
            bubbles: true,
            cancelable: true
        }));

        expect(combobox.isOpen()).toBe(false);
        expect(combobox.getSelectedOption()).toBe(firstOption);
        expect(input.value).toBe("Alpha");

        input.dispatchEvent(new KeyboardEvent("keydown", {
            key: "ArrowDown",
            bubbles: true,
            cancelable: true
        }));

        input.dispatchEvent(new KeyboardEvent("keydown", {
            key: "Escape",
            bubbles: true,
            cancelable: true
        }));

        expect(combobox.isOpen()).toBe(false);
        expect(document.activeElement).toBe(input);

        combobox.destroy();
    });

    it("uses the input owner window for blur and pointer scheduling", () => {
        const frame = document.createElement("iframe");

        document.body.append(frame);

        const ownerDocument = frame.contentDocument;
        const ownerWindow = frame.contentWindow as TestWindow | null;

        if (!ownerDocument || !ownerWindow) {
            throw new Error("Expected iframe document and window.");
        }

        const input = ownerDocument.createElement("input");
        const listbox = ownerDocument.createElement("div");
        const option = ownerDocument.createElement("div");

        option.textContent = "Alpha";
        listbox.append(option);
        ownerDocument.body.append(input, listbox);

        const combobox = createCombobox(input, listbox, {
            getOptions: () => [option],
            autoUpdate: false
        });

        combobox.open();

        const requestAnimationFrame = vi.spyOn(
            ownerWindow,
            "requestAnimationFrame"
        );
        const setTimeout = vi.spyOn(ownerWindow, "setTimeout");

        input.dispatchEvent(new ownerWindow.Event("blur"));
        listbox.dispatchEvent(new ownerWindow.Event("pointerdown"));

        expect(requestAnimationFrame).toHaveBeenCalledOnce();
        expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 0);

        combobox.destroy();
    });
});
