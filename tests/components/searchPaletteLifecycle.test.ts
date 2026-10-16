import { describe, expect, it, vi } from "vitest";
import { Combobox, CommandPalette, RouteCommandPalette, RouteSearchBox, SearchBox } from "../../packages/components/src";

const records = () => [{ id: "apple", label: "Apple", description: "Red fruit", keywords: ["food"] }, { id: "bag", label: "Bag" }];
const routes = [{ id: "lessons", title: "Lessons", href: "#lessons" }, { id: "settings", title: "Settings", href: "#settings" }];
function key(target: EventTarget, value: string, options: KeyboardEventInit = {}): KeyboardEvent {
    const event = new KeyboardEvent("keydown", { key: value, bubbles: true, cancelable: true, ...options });
    target.dispatchEvent(event); return event;
}
function select(search: Pick<ReturnType<typeof SearchBox>, "combobox" | "input">, index = 0): void {
    search.combobox.open();
    search.combobox.setActiveOption(search.combobox.items[index]!.option);
    key(search.input, "Enter");
}
function localeSource(throws = false) {
    let language = "first";
    const listeners: Array<() => void> = [];
    const dispose = vi.fn(() => { if (throws) throw new Error("unsubscribe"); });
    return { listeners, dispose,
        provider: { t: (key: string) => `${language}:${key}`, subscribe(fn: () => void) { listeners.push(fn); return dispose; } },
        change() { language = "second"; for (const notify of [...listeners]) notify(); }
    };
}

describe("SearchBox lifecycle and filtering", () => {
    it("supports an empty stable id and refreshes indexed partial metadata", () => {
        const search = SearchBox({ items: [{ id: "", label: "Empty id" }, ...records()] });
        expect(search.getItem("")?.label).toBe("Empty id");
        search.update({ items: [{ label: "Renamed", keywords: ["special"] }] });
        expect(search.getItem("")?.label).toBe("Renamed");
        search.combobox.setInputValue("special");
        expect(search.combobox.getVisibleOptions()).toEqual([search.combobox.items[0]!.option]);
        search.setItems(records()); expect(search.getItem("")).toBeNull(); search.destroy();
    });

    it.each(["red", "food", "apple"])("matches %s in descriptions, keywords and labels", query => {
        const search = SearchBox({ items: records() }); search.combobox.setInputValue(query);
        expect(search.combobox.getVisibleOptions()).toEqual([search.combobox.items[0]!.option]); search.destroy();
    });

    it.each(["destroy", "replace"] as const)("does not select stale results after query callback %s", action => {
        const chosen = vi.fn();
        const search = SearchBox({ items: records(), onSelect: chosen, onQueryChange(detail, control) {
            if (detail.reason !== "selection") return;
            if (action === "destroy") control.destroy(); else control.setItems([{ id: "new", label: "New" }]);
        } });
        document.body.append(search.element); select(search);
        expect(chosen).not.toHaveBeenCalled(); search.destroy();
    });

    it("a reentrant filter replacement wins over the previous option snapshot", () => {
        const search = SearchBox({ items: records() }); let replace = true;
        search.update({ filterItem() {
            if (replace) { replace = false; search.setItems([{ id: "new", label: "New" }]); }
            return true;
        } });
        expect(search.combobox.getVisibleOptions()).toEqual([search.combobox.items[0]!.option]);
        expect(search.getItem("new")?.label).toBe("New"); expect(search.listbox.textContent).not.toContain("Apple"); search.destroy();
    });

    it("late setters and retained option handles cannot revive a destroyed search", () => {
        const search = SearchBox({ items: records() }); const old = search.combobox.items[0]!;
        search.destroy(); const before = search.element.outerHTML;
        old.setLabelContent("Late"); old.setDisabled(true); search.setItems([]);
        search.update({ label: "Late", width: "90rem" }); expect(search.setSelectedValue("apple")).toBe(false);
        search.destroy(); expect(search.element.outerHTML).toBe(before);
    });

    it.each([true, false])("selection preserves a newly focused field when dismissKeyboard=%s", dismissKeyboardOnSelection => {
        const destination = document.createElement("input");
        const search = SearchBox({ items: records(), dismissKeyboardOnSelection, onSelect: () => destination.focus() });
        document.body.append(search.element, destination); search.input.focus(); select(search);
        expect(document.activeElement).toBe(destination); search.destroy();
    });

    it("pointer selection does not refocus a result field after navigation", () => {
        const destination = document.createElement("input");
        const search = SearchBox({ items: records(), dismissKeyboardOnSelection: false, onSelect: () => destination.focus() });
        document.body.append(search.element, destination); search.input.focus(); search.combobox.open();
        search.combobox.items[0]!.option.click(); expect(document.activeElement).toBe(destination); search.destroy();
    });

    it.each([{ ctrlKey: true }, { metaKey: true }, { isComposing: true }, { keyCode: 229 }])("does not consume modified or composing selection %j", options => {
        const chosen = vi.fn(); const search = SearchBox({ items: records(), onSelect: chosen });
        search.combobox.open(); search.combobox.setActiveValue("apple"); key(search.input, "Enter", options);
        expect(chosen).not.toHaveBeenCalled(); search.destroy();
    });
});

describe("Combobox option ownership", () => {
    it("finishes partial metadata, sibling updates and filter refresh after a label cleanup throws", () => {
        const combo = Combobox({ items: [{ value: "old", textValue: "Old", label: { element: document.createElement("span"), destroy() { throw new Error("old label"); } } }, { value: "second", label: "Second" }] });
        expect(() => combo.update({ items: [{ label: "New", textValue: "New" }, { label: "Changed", textValue: "Changed" }], inputValue: "New" })).toThrow("old label");
        expect(combo.items[0]!.getText()).toBe("New"); expect(combo.items[1]!.getText()).toBe("Changed");
        expect(combo.getVisibleOptions()).toEqual([combo.items[0]!.option]); combo.destroy();
    });

    it("releases generated label content after initial filtering fails", () => {
        const dispose = vi.fn();
        expect(() => Combobox({ items: [{ label: { element: document.createElement("span"), destroy: dispose } }], filterOption() { throw new Error("filter"); } })).toThrow("filter");
        expect(dispose).toHaveBeenCalledOnce();
    });

    it("replaces all results after a retired label throws and ignores retired handles", () => {
        const dispose = vi.fn(() => { throw new Error("old label"); });
        const combo = Combobox({ items: [{ value: "old", label: { element: document.createElement("span"), destroy: dispose } }] });
        const previous = combo.items[0]!;
        expect(() => combo.setItems([{ value: "new", label: "New" }])).toThrow("old label");
        previous.setLabelContent("Stale"); previous.setDisabled(true);
        expect(combo.items.map(item => item.value)).toEqual(["new"]);
        expect(combo.getVisibleOptions()).toEqual([combo.items[0]!.option]);
        combo.destroy(); expect(dispose).toHaveBeenCalledOnce();
    });

    it("newer replacement inside retired cleanup wins and disposes unused candidates", () => {
        let replace = () => {}; const unused = vi.fn();
        const combo = Combobox({ items: [{ label: { element: document.createElement("span"), destroy: () => replace() } }] });
        replace = () => combo.setItems([{ value: "latest", label: "Latest" }]);
        combo.setItems([{ value: "older", label: { element: document.createElement("span"), destroy: unused } }]);
        expect(combo.items.map(item => item.value)).toEqual(["latest"]); expect(unused).toHaveBeenCalledOnce(); combo.destroy();
    });

    it("releases all labels and behavior even when one label cleanup fails", () => {
        const first = vi.fn(() => { throw new Error("label"); }); const second = vi.fn();
        const combo = Combobox({ items: [first, second].map(destroy => ({ label: { element: document.createElement("span"), destroy } })) });
        expect(() => combo.destroy()).toThrow("label"); expect(second).toHaveBeenCalledOnce(); expect(combo.isDestroyed()).toBe(true);
        const before = combo.element.outerHTML; combo.open(); combo.update({ disabled: true }); combo.destroy(); expect(combo.element.outerHTML).toBe(before);
    });
});

describe("CommandPalette callbacks, keyboard and cleanup", () => {
    it("closes before running and preserves a command's editable destination", () => {
        const destination = document.createElement("input"); const order: string[] = [];
        const palette = CommandPalette({ items: [{ id: "go", label: "Go", run() { order.push("run"); destination.focus(); } }],
            onOpenChange(open) { if (!open) order.push("close"); }, onSelect: () => order.push("select") });
        document.body.append(palette.element, destination); palette.open(); select(palette.searchBox);
        expect(order).toEqual(["close", "run", "select"]); expect(document.activeElement).toBe(destination); palette.destroy();
    });

    it.each(["close", "run"] as const)("stops stale callback chains after %s destroys the palette", phase => {
        const run = vi.fn(() => { if (phase === "run") palette.destroy(); }); const chosen = vi.fn();
        const palette = CommandPalette({ items: [{ id: "go", label: "Go", run }], onSelect: chosen,
            onOpenChange(open) { if (!open && phase === "close") palette.destroy(); } });
        document.body.append(palette.element); palette.open(); select(palette.searchBox);
        expect(run).toHaveBeenCalledTimes(phase === "run" ? 1 : 0); expect(chosen).not.toHaveBeenCalled(); palette.destroy();
    });

    it("does not run an old command if close callback replaces results", () => {
        const run = vi.fn(); const palette = CommandPalette({ items: [{ id: "go", label: "Go", run }],
            onOpenChange(open) { if (!open) palette.setItems([{ id: "new", label: "New", run: vi.fn() }]); } });
        document.body.append(palette.element); palette.open(); select(palette.searchBox); expect(run).not.toHaveBeenCalled(); palette.destroy();
    });

    it("honors explicit null service text initially and on updates", () => {
        const palette = CommandPalette({ items: [], searchLabel: null, placeholder: null, notFoundText: null, description: null });
        expect(palette.searchBox.combobox.getLabelElement()).toBeNull(); expect(palette.searchBox.input.hasAttribute("placeholder")).toBe(false);
        palette.update({ id: "renamed", className: "custom", attributes: { "data-owner": "test" }, title: "New title" });
        expect(palette.dialogElement.id).toBe("renamed"); expect(palette.dialogElement.classList.contains("custom")).toBe(true);
        expect(palette.dialogElement.getAttribute("data-owner")).toBe("test"); expect(palette.searchBox.combobox.getLabelElement()).toBeNull(); palette.destroy();
    });

    it.each([{ isComposing: true }, { keyCode: 229 }, { repeat: true }])("ignores composing or repeated global shortcuts %j", options => {
        const palette = CommandPalette({ items: [], shortcut: { key: "k", ctrlKey: true } }); document.body.append(palette.element);
        key(document.body, "k", { ctrlKey: true, ...options }); expect(palette.isOpen()).toBe(false); palette.destroy();
    });

    it("respects handled shortcuts and editable controls, but permits an explicit editable shortcut", () => {
        const palette = CommandPalette({ items: [], shortcut: { key: "k", ctrlKey: true } }); const input = document.createElement("input");
        document.body.append(palette.element, input); key(input, "k", { ctrlKey: true }); expect(palette.isOpen()).toBe(false);
        const handled = new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true, cancelable: true }); handled.preventDefault();
        document.dispatchEvent(handled); expect(palette.isOpen()).toBe(false);
        palette.update({ shortcut: { code: "KeyK", ctrlKey: true, allowInEditable: true } }); key(input, "k", { code: "KeyK", ctrlKey: true });
        expect(palette.isOpen()).toBe(true); palette.destroy();
    });

    it("Escape closes the search and palette together, but does not steal IME Escape", () => {
        const palette = CommandPalette({ items: records() }); document.body.append(palette.element); palette.open(); palette.searchBox.combobox.open();
        key(palette.searchBox.input, "Escape", { isComposing: true }); expect(palette.isOpen()).toBe(true);
        key(palette.searchBox.input, "Escape"); expect(palette.isOpen()).toBe(false); palette.destroy();
    });

    it("finishes teardown after locale unsubscribe failure and ignores stale notifications", () => {
        const source = localeSource(true); const palette = CommandPalette({ items: records(), locale: source.provider, shortcut: { key: "k", ctrlKey: true } });
        expect(() => palette.destroy()).toThrow("unsubscribe"); expect(palette.searchBox.combobox.isDestroyed()).toBe(true);
        const before = palette.element.outerHTML; source.change(); palette.update({ title: "Late" }); palette.setItems([]); key(document, "k", { ctrlKey: true });
        expect(palette.element.outerHTML).toBe(before); expect(palette.isOpen()).toBe(false); palette.destroy();
    });
});

describe.each(["search", "palette"] as const)("Route %s ownership", kind => {
    const create = kind === "search" ? RouteSearchBox : RouteCommandPalette;
    it("does not navigate after a lower-level selection replaces routes", () => {
        const navigate = vi.fn(); const control = create({ routes, onRouteSelect: navigate, onSelect() { control.setRoutes([routes[1]!]); } });
        document.body.append(control.element);
        if ("searchBox" in control) { control.open(); select(control.searchBox); } else select(control);
        expect(navigate).not.toHaveBeenCalled(); control.destroy();
    });
    it("does not commit a stale resolver after newer routes replace it", () => {
        const control = create({ routes }); let replace = true;
        control.update({ searchItemsOptions: { getLabel(route) {
            if (replace) { replace = false; control.setRoutes([routes[1]!]); }
            return route.title ?? route.id;
        } } });
        expect(control.getRoutes()).toEqual([routes[1]!]);
        const search = "searchBox" in control ? control.searchBox : control;
        expect(search.getItem("lessons")).toBeNull(); expect(search.getItem("settings")).not.toBeNull(); control.destroy();
    });
    it("locale notifications update labels without creating new subscriptions", () => {
        const source = localeSource(); const control = create({ routes, locale: source.provider });
        const count = source.listeners.length; source.change();
        expect(source.listeners).toHaveLength(count);
        const search = "searchBox" in control ? control.searchBox : control;
        expect(search.input.placeholder).toContain("second:"); control.destroy();
    });
    it("accepts synchronous locale notifications during subscription setup", () => {
        const dispose = vi.fn();
        const control = create({ routes, locale: { t: key => key, subscribe(notify) { notify(); return dispose; } } });
        expect(control.getRoutes()).toEqual(routes); control.destroy(); expect(dispose).toHaveBeenCalled();
    });
    it("style-only updates retain option identity, selection and focus", () => {
        const control = create({ routes }); const search = "searchBox" in control ? control.searchBox : control;
        document.body.append(control.element); if ("open" in control) control.open();
        search.setSelectedValue("lessons"); search.input.focus(); const option = search.combobox.items[0]!.option;
        control.update({ className: "new-class" }); expect(search.combobox.items[0]!.option).toBe(option);
        expect(search.getSelectedValue()).toBe("lessons"); expect(document.activeElement).toBe(search.input); control.destroy();
    });
    it("finishes underlying cleanup after locale errors and ignores late calls", () => {
        const source = localeSource(true); const control = create({ routes, locale: source.provider });
        const search = "searchBox" in control ? control.searchBox : control;
        expect(() => control.destroy()).toThrow("unsubscribe"); expect(search.combobox.isDestroyed()).toBe(true);
        const before = control.element.outerHTML; source.change(); control.setRoutes([]); control.update({ label: "Late" });
        expect(control.element.outerHTML).toBe(before); control.destroy();
    });
});
