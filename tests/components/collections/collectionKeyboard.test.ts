import { describe, expect, it, vi } from "vitest";
import { Listbox } from "../../../packages/components/src/listbox";
import { Menu } from "../../../packages/components/src/menu";
import { Tabs } from "../../../packages/components/src/tabs";

function key(target: HTMLElement, flag: string): void {
    const event = new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true,
        ...(flag === "handled" ? {} : { [flag]: true }) });
    if (flag === "handled") event.preventDefault();
    target.dispatchEvent(event);
}

describe("collection keyboard ownership", () => {
    it.each(["handled", "isComposing", "ctrlKey"])("does not activate a menu command for %s input", (flag) => {
        const selected = vi.fn();
        const menu = Menu({ announceOnHover: false, items: [{ label: "One" }], onSelect: selected });
        document.body.append(menu.element);
        try { key(menu.items[0]!.item, flag); expect(selected).not.toHaveBeenCalled(); }
        finally { menu.destroy(); }
    });

    it.each(["handled", "isComposing", "ctrlKey"])("does not select a listbox option for %s input", (flag) => {
        const selected = vi.fn();
        const list = Listbox({ label: "Choices", announceOnHover: false, selectionMode: "multiple",
            items: [{ value: "one", label: "One" }], onSelectionChange: selected });
        document.body.append(list.element);
        try {
            key(list.items[0]!.option, flag);
            expect(list.getSelectedValues()).toEqual([]);
            expect(selected).not.toHaveBeenCalled();
        } finally { list.destroy(); }
    });

    it.each(["handled", "isComposing", "ctrlKey"])("does not activate a manual tab for %s input", (flag) => {
        const changed = vi.fn();
        const tabs = Tabs({ announceOnHover: false, activationMode: "manual", defaultValue: "one",
            items: [{ value: "one", tab: "One", panel: "First" }, { value: "two", tab: "Two", panel: "Second" }], onTabChange: changed });
        document.body.append(tabs.element);
        try {
            tabs.items[1]!.tab.focus();
            key(tabs.items[1]!.tab, flag);
            expect(tabs.getCurrentValue()).toBe("one");
            expect(changed).not.toHaveBeenCalled();
        } finally { tabs.destroy(); }
    });

    it("keeps the menu's current item synchronized after arrow-key focus movement", () => {
        const menu = Menu({ announceOnHover: false, items: [{ value: "one", label: "One" }, { value: "two", label: "Two" }] });
        document.body.append(menu.element);
        for (const element of [menu.element, ...menu.items.map(item => item.item)]) {
            vi.spyOn(element, "getClientRects").mockReturnValue([{}] as unknown as DOMRectList);
        }
        try {
            menu.items[0]!.item.focus();
            menu.items[0]!.item.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true }));
            expect(document.activeElement).toBe(menu.items[1]!.item);
            expect(menu.getCurrentValue()).toBe("two");
        } finally { menu.destroy(); }
    });
});
