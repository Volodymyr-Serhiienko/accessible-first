import { describe, expect, it, vi } from "vitest";
import { Menu } from "../../../packages/components/src/menu";
import { Listbox } from "../../../packages/components/src/listbox";
import { Tabs } from "../../../packages/components/src/tabs";
import { createMenu } from "../../../packages/core/src/menu";
import { createTabs } from "../../../packages/core/src/tabs";
import { createListbox } from "../../../packages/core/src/listbox";

const items = ["Alpha", "Beta", "Gamma"].map((label) => ({ value: label, label }));
function layout(root: HTMLElement): void {
    document.body.append(root);
    // Only geometry is mocked. Native Tab/CSS/inherited direction use browser fixtures.
    for (const element of [root, ...root.querySelectorAll<HTMLElement>("*")]) {
        vi.spyOn(element, "getClientRects").mockReturnValue([{}] as unknown as DOMRectList);
    }
}
function key(target: HTMLElement, value: string): KeyboardEvent {
    const event = new KeyboardEvent("keydown", { key: value, bubbles: true, cancelable: true });
    target.dispatchEvent(event);
    return event;
}

describe("collection logical state and runtime availability", () => {
    it("keeps a detached composed menu's requested current item", () => {
        const menu = Menu({ announceOnHover: false, defaultValue: "Gamma", items });
        try { expect(menu.getCurrentValue()).toBe("Gamma"); expect(menu.items[2]!.item.tabIndex).toBe(0); }
        finally { menu.destroy(); }
    });
    it("keeps a detached listbox's selection and tab stop", () => {
        const list = Listbox({ announceOnHover: false, defaultValue: "Gamma", items });
        try { expect(list.getSelectedValues()).toEqual(["Gamma"]); expect(list.items[2]!.option.tabIndex).toBe(0); }
        finally { list.destroy(); }
    });
    it("keeps detached tabs' selection and tab stop", () => {
        const tabs = Tabs({ announceOnHover: false, defaultValue: "Gamma", items: items.map(item => ({ value: item.value, tab: item.label, panel: item.label })) });
        try { expect(tabs.getCurrentValue()).toBe("Gamma"); expect(tabs.items[2]!.tab.tabIndex).toBe(0); }
        finally { tabs.destroy(); }
    });

    it.each(["hidden", "inert"])("menu arrows and typeahead skip runtime %s items", (state) => {
        const menu = Menu({ announceOnHover: false, items });
        layout(menu.element);
        const [first, middle, last] = menu.items;
        middle!.item.setAttribute(state, "");
        try {
            first!.item.focus();
            key(first!.item, "ArrowDown");
            expect(document.activeElement).toBe(last!.item);
            expect(menu.getCurrentValue()).toBe("Gamma");
            first!.item.focus();
            key(first!.item, "b");
            expect(document.activeElement).toBe(first!.item);
            expect(menu.setCurrentValue("Beta", { focus: true })).toBe(false);
        } finally { menu.destroy(); }
    });

    it.each(["hidden", "inert"])("listbox arrows skip runtime %s options", (state) => {
        const list = Listbox({ announceOnHover: false, items });
        layout(list.element);
        list.items[1]!.option.setAttribute(state, "");
        try {
            list.items[0]!.option.focus();
            key(list.items[0]!.option, "ArrowDown");
            expect(document.activeElement).toBe(list.items[2]!.option);
            expect(list.getSelectedValues()).toEqual(["Gamma"]);
        } finally { list.destroy(); }
    });

    it.each(["hidden", "inert"])("tab arrows skip runtime %s tabs", (state) => {
        const tabs = Tabs({ announceOnHover: false, items: items.map(item => ({ value: item.value, tab: item.label, panel: item.label })) });
        layout(tabs.element);
        tabs.items[1]!.tab.setAttribute(state, "");
        try {
            tabs.items[0]!.tab.focus();
            key(tabs.items[0]!.tab, "ArrowRight");
            expect(document.activeElement).toBe(tabs.items[2]!.tab);
            expect(tabs.getCurrentValue()).toBe("Gamma");
        } finally { tabs.destroy(); }
    });

    it("does not erase selected listbox values merely because their options were hidden", () => {
        const list = Listbox({ announceOnHover: false, defaultValue: "Beta", items });
        layout(list.element);
        try {
            list.items[1]!.option.hidden = true;
            list.refresh();
            expect(list.getSelectedValues()).toEqual(["Beta"]);
            expect(list.items.map(item => item.option.tabIndex)).toEqual([0, -1, -1]);
            list.items[1]!.option.hidden = false;
            list.refresh();
            expect(list.getSelectedValues()).toEqual(["Beta"]);
        } finally { list.destroy(); }
    });

    it("does not turn detached or temporarily hidden core menu items into permanently disabled commands", () => {
        const root = document.createElement("div");
        const buttons = items.map(item => { const element = document.createElement("button"); element.textContent = item.label; return element; });
        root.append(...buttons);
        const menu = createMenu(root, { getItems: () => buttons });
        layout(root);
        try {
            buttons[1]!.hidden = true;
            menu.refresh();
            buttons[1]!.hidden = false;
            menu.refresh();
            expect(buttons.map(item => item.getAttribute("aria-disabled"))).toEqual([null, null, null]);
            expect(menu.setCurrentItem(buttons[1]!, { focus: true })).toBe(true);
        } finally { menu.destroy(); }
    });

    it("can re-enable a composed menu command after updating its disabled flag", () => {
        const menu = Menu({ announceOnHover: false, items });
        layout(menu.element);
        try {
            menu.getItem("Beta")!.setDisabled(true);
            expect(menu.setCurrentValue("Beta", { focus: true })).toBe(false);
            menu.getItem("Beta")!.setDisabled(false);
            expect(menu.setCurrentValue("Beta", { focus: true })).toBe(true);
        } finally { menu.destroy(); }
    });

    it("skips tabs without a panel instead of focusing a tab that cannot activate", () => {
        const root = document.createElement("div");
        root.innerHTML = "<button>First</button><button>Missing panel</button><button>Last</button>";
        const buttons = Array.from(root.querySelectorAll("button"));
        const firstPanel = document.createElement("div");
        const lastPanel = document.createElement("div");
        document.body.append(firstPanel, lastPanel);
        layout(root);
        const tabs = createTabs(root, { getTabs: () => buttons, getPanel: (tab) => tab === buttons[0] ? firstPanel : tab === buttons[2] ? lastPanel : null });
        try {
            buttons[0]!.focus(); key(buttons[0]!, "ArrowRight");
            expect(document.activeElement).toBe(buttons[2]);
            expect(tabs.getCurrentTab()).toBe(buttons[2]);
        } finally { tabs.destroy(); }
    });

    it.each(["menu", "list", "tabs"])("does not activate %s when focus/typing belong to an editable descendant", (kind) => {
        const input = document.createElement("input");
        const widget = kind === "menu" ? Menu({ announceOnHover: false, items })
            : kind === "list" ? Listbox({ announceOnHover: false, items })
            : Tabs({ announceOnHover: false, activationMode: "manual", items: items.map(item => ({ value: item.value, tab: item.label, panel: item.label })) });
        const target = kind === "menu" ? (widget as ReturnType<typeof Menu>).items[1]!.item
            : kind === "list" ? (widget as ReturnType<typeof Listbox>).items[1]!.option
            : (widget as ReturnType<typeof Tabs>).items[1]!.tab;
        target.append(input);
        layout(widget.element);
        try {
            input.focus();
            expect(key(input, "Enter").defaultPrevented).toBe(false);
            expect(key(input, "g").defaultPrevented).toBe(false);
            expect(document.activeElement).toBe(input);
            if (kind === "menu") expect((widget as ReturnType<typeof Menu>).getCurrentValue()).toBe("Alpha");
            if (kind === "list") expect((widget as ReturnType<typeof Listbox>).getSelectedValues()).toEqual([]);
            if (kind === "tabs") expect((widget as ReturnType<typeof Tabs>).getCurrentValue()).toBe("Alpha");
        } finally { widget.destroy(); }
    });

    it.each(["menu", "list", "tabs"])("releases removed %s elements' ARIA ownership on refresh", (kind) => {
        const root = document.createElement("div");
        const first = document.createElement("button");
        const removed = document.createElement("button");
        removed.setAttribute("role", "note");
        root.append(first, removed); layout(root);
        let elements = [first, removed];
        const panel = document.createElement("section");
        panel.setAttribute("role", "region");
        document.body.append(panel);
        const widget = kind === "menu" ? createMenu(root, { getItems: () => elements })
            : kind === "list" ? createListbox(root, { getOptions: () => elements })
            : createTabs(root, { getTabs: () => elements, getPanel: (item) => item === removed ? panel : null });
        try {
            elements = [first]; widget.refresh();
            expect(removed.getAttribute("role")).toBe("note");
            expect(removed.hasAttribute("tabindex")).toBe(false);
            if (kind === "tabs") { expect(panel.getAttribute("role")).toBe("region"); expect(panel.hasAttribute("aria-labelledby")).toBe(false); }
            removed.setAttribute("role", "article");
        } finally { widget.destroy(); }
        expect(removed.getAttribute("role")).toBe("article");
    });

    it.each(["menu", "list", "tabs"])("does not report a successful focus request into a wholly hidden %s", (kind) => {
        const widget = kind === "menu" ? Menu({ announceOnHover: false, items })
            : kind === "list" ? Listbox({ announceOnHover: false, items })
            : Tabs({ announceOnHover: false, items: items.map(item => ({ value: item.value, tab: item.label, panel: item.label })) });
        // Unlike layout(), leave the hidden collection without artificial rects.
        widget.element.hidden = true; document.body.append(widget.element);
        try {
            const success = kind === "menu" ? (widget as ReturnType<typeof Menu>).setCurrentValue("Beta", { focus: true })
                : kind === "list" ? (widget as ReturnType<typeof Listbox>).setCurrentOption((widget as ReturnType<typeof Listbox>).items[1]!.option, { focus: true })
                : (widget as ReturnType<typeof Tabs>).setCurrentValue("Beta", { focus: true });
            expect(success).toBe(false);
            const stops = Array.from(widget.element.querySelectorAll<HTMLElement>('[tabindex="0"]'));
            expect(stops[0]?.textContent).toBe("Alpha");
        } finally { widget.destroy(); }
    });

    it("does not let a logical callback override native disabled fieldset state during navigation", () => {
        const root = document.createElement("div");
        root.innerHTML = '<button>First</button><fieldset disabled><button>Disabled</button></fieldset><button>Last</button>';
        const buttons = Array.from(root.querySelectorAll("button")); layout(root);
        const menu = createMenu(root, { getItems: () => buttons, isItemDisabled: () => false });
        try { buttons[0]!.focus(); key(buttons[0]!, "ArrowDown"); expect(document.activeElement).toBe(buttons[2]); }
        finally { menu.destroy(); }
    });

    it.each(["set", "clear"])("does not %s listbox selection or emit callbacks after destroy", (action) => {
        const root = document.createElement("div");
        root.innerHTML = '<div tabindex="0">First</div><div tabindex="-1">Last</div>';
        const options = Array.from(root.children) as HTMLElement[];
        const changed = vi.fn();
        const list = createListbox(root, { getOptions: () => options, defaultSelectedOptions: [options[0]!], onSelectionChange: changed });
        list.destroy();
        if (action === "set") list.setSelectedOptions([options[1]!]);
        else list.clearSelection();
        expect(list.getSelectedOptions()).toEqual([options[0]]);
        expect(changed).not.toHaveBeenCalled();
        expect(options.map(item => item.hasAttribute("aria-selected"))).toEqual([false, false]);
    });
});
