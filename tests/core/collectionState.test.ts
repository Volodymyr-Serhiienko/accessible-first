import { describe, expect, it, vi } from "vitest";
import { getNextItem, getPreviousItem } from "../../packages/core/src/collection";
import { createSelection } from "../../packages/core/src/selection";
import { createTypeahead } from "../../packages/core/src/typeahead";

describe("generic collection state", () => {
    it.each([0, false, ""])("selects the falsy item %j in single mode", (value) => {
        const changed = vi.fn();
        const selection = createSelection({ getItems: () => [value], onSelectionChange: changed });
        expect(selection.selectItem(value)).toBe(true);
        expect(selection.getSelectedItems()).toEqual([value]);
        expect(changed).toHaveBeenCalledWith([value]);
        selection.clearSelection();
        expect(selection.getSelectedItems()).toEqual([]);
    });

    it("normalizes multiple selection after items disappear or become disabled", () => {
        let items = [0, 1, 2, 3];
        const disabled = new Set<number>();
        const changed = vi.fn();
        const selection = createSelection({ getItems: () => items, mode: "multiple",
            isItemDisabled: (item) => disabled.has(item), onSelectionChange: changed });
        selection.setSelectedItems([3, 0, 3, 2], { notify: false });
        expect(selection.getSelectedItems()).toEqual([0, 2, 3]);
        expect(changed).not.toHaveBeenCalled();
        items = [3, 2, 1];
        disabled.add(2);
        selection.refresh();
        expect(selection.getSelectedItems()).toEqual([3]);
        expect(changed).toHaveBeenCalledOnce();
    });

    it("navigates falsy identities, skips disabled items and honors non-looping edges", () => {
        const items = [0, 1, 2];
        const options = { isItemDisabled: (item: number) => item === 1 };
        expect(getNextItem(items, 0, options)).toBe(2);
        expect(getPreviousItem(items, 2, options)).toBe(0);
        expect(getNextItem(items, 2, options)).toBe(0);
        expect(getPreviousItem(items, 0, options)).toBe(2);
        expect(getNextItem(items, 2, { ...options, loop: false })).toBeNull();
        expect(getPreviousItem(items, 0, { ...options, loop: false })).toBeNull();
    });
});

describe("typeahead contracts", () => {
    it.each([0, false, ""])("notifies and consumes a matching key for item %j", (value) => {
        const matched = vi.fn();
        const typeahead = createTypeahead({ getItems: () => [value], getItemText: () => "Alpha", onMatch: matched });
        try {
            const event = new KeyboardEvent("keydown", { key: "a", cancelable: true });
            expect(typeahead.handleKey(event)).toBe(true);
            expect(event.defaultPrevented).toBe(true);
            expect(matched).toHaveBeenCalledWith(value);
            expect(typeahead.handleKey(new KeyboardEvent("keydown", { key: "l", cancelable: true }), value)).toBe(true);
            expect(typeahead.getQuery()).toBe("al");
            expect(matched).toHaveBeenLastCalledWith(value);
        } finally { typeahead.destroy(); }
    });

    it("cycles from an identity of zero rather than treating it as no current item", () => {
        const typeahead = createTypeahead({ getItems: () => [0, 1], getItemText: () => "Alpha" });
        try { expect(typeahead.search("a", 0)).toBe(1); }
        finally { typeahead.destroy(); }
    });

    it("keeps a matching current item while a multi-character query grows, but cycles repeated keys", () => {
        const items = ["Apple", "Apricot", "Banana"];
        const typeahead = createTypeahead({ getItems: () => items, getItemText: (item) => item });
        try {
            expect(typeahead.search("a")).toBe("Apple");
            expect(typeahead.search("p", "Apple")).toBe("Apple");
            typeahead.reset();
            expect(typeahead.search("a", "Apple")).toBe("Apricot");
            expect(typeahead.search("a", "Apricot")).toBe("Apple");
        } finally { typeahead.destroy(); }
    });

    it.each(["handled", "composing"])("does not search or change the query for %s input", (state) => {
        const matched = vi.fn();
        const typeahead = createTypeahead({ getItems: () => ["Alpha"], getItemText: (item) => item, onMatch: matched });
        try {
            const event = new KeyboardEvent("keydown", { key: "a", cancelable: true, isComposing: state === "composing" });
            if (state === "handled") event.preventDefault();
            expect(typeahead.handleKey(event)).toBe(false);
            expect(typeahead.getQuery()).toBe("");
            expect(matched).not.toHaveBeenCalled();
        } finally { typeahead.destroy(); }
    });

    it("resets after the timeout and cancels the timer on destroy", () => {
        vi.useFakeTimers();
        const matched = vi.fn();
        const typeahead = createTypeahead({ getItems: () => ["Alpha"], getItemText: (item) => item, onMatch: matched, timeout: 50 });
        typeahead.search("a");
        vi.advanceTimersByTime(50);
        expect(typeahead.getQuery()).toBe("");
        typeahead.search("a");
        typeahead.destroy();
        expect(vi.getTimerCount()).toBe(0);
        expect(typeahead.search("a")).toBeNull();
        expect(matched).toHaveBeenCalledTimes(2);
    });
});
