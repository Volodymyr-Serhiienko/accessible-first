import { describe, expect, it, vi } from "vitest";
import { Table, type ComposedTable } from "../../../packages/components/src/table";
import { Navigation, type ComposedNavigation } from "../../../packages/components/src/navigation";
import { Link, createLink } from "../../../packages/components/src/link";

function child(text: string, destroy = vi.fn()) {
    const element = document.createElement("span");
    element.textContent = text;
    return { element, destroy };
}

describe("Dynamic table ownership", () => {
    it("applies columns and rows together and renders the new cells once", () => {
        const cell = vi.fn((row: { value: string }) => row.value);
        const table = Table({ caption: "Records", columns: [{ id: "old", header: "Old" }], rows: [{ value: "old" }] });
        table.update({ columns: [{ id: "value", header: "New", cell }], rows: [{ value: "new" }] });
        expect(table.headerCells[0]!.getText()).toBe("New");
        expect(table.bodyRows[0]!.item.value).toBe("new");
        expect(table.body.textContent).toBe("new");
        expect(cell).toHaveBeenCalledOnce();
        table.destroy();
    });

    it("does not rebuild populated rows when only empty-state content changes", () => {
        const content = child("value");
        const table = Table({ caption: "Records", columns: [{ id: "value", header: "Value" }], rows: [{ value: content }] });
        const row = table.bodyRows[0]!.element;
        table.setEmptyState("Nothing found");
        expect(table.bodyRows[0]!.element).toBe(row);
        expect(content.destroy).not.toHaveBeenCalled();
        table.destroy();
    });

    it("releases every cell, description and sort listener despite a cleanup failure", () => {
        const failure = new Error("cell cleanup");
        const first = child("first", vi.fn(() => { throw failure; }));
        const second = child("second");
        const description = child("help");
        const onSortChange = vi.fn();
        const table = Table({ caption: "Records", description, onSortChange,
            columns: [{ id: "a", header: "A", sortable: true }, { id: "b", header: "B" }], rows: [{ a: first, b: second }] });
        const button = table.head.querySelector("button")!;
        expect(() => table.destroy()).toThrow(failure);
        button.click();
        expect(onSortChange).not.toHaveBeenCalled();
        expect(second.destroy).toHaveBeenCalledOnce();
        expect(description.destroy).toHaveBeenCalledOnce();
        expect(table.bodyRows).toHaveLength(0);
        expect(() => table.destroy()).not.toThrow();
        expect(first.destroy).toHaveBeenCalledOnce();
    });

    it("commits replacement rows even if an old cell cleanup fails", () => {
        const first = child("first", vi.fn(() => { throw new Error("cleanup"); }));
        const second = child("second");
        const table = Table({ caption: "Records", columns: [{ id: "value", header: "Value" }], rows: [{ value: first }, { value: second }] });
        expect(() => table.setRows([{ value: child("new") }])).toThrow("cleanup");
        expect(second.destroy).toHaveBeenCalledOnce();
        expect(table.body.textContent).toBe("new");
        table.destroy();
    });

    it("keeps a newer row replacement started by old cell cleanup", () => {
        let table: ComposedTable<{ value: ReturnType<typeof child> }>;
        const newer = child("newer");
        const abandoned = child("abandoned");
        const old = child("old", vi.fn(() => table.setRows([{ value: newer }])));
        table = Table({ caption: "Records", columns: [{ id: "value", header: "Value" }], rows: [{ value: old }] });
        table.setRows([{ value: abandoned }]);
        expect(table.body.textContent).toBe("newer");
        expect(table.bodyRows[0]!.item.value).toBe(newer);
        expect(abandoned.destroy).toHaveBeenCalledOnce();
        table.destroy();
    });

    it("cleans partially built cells when a later renderer throws", () => {
        const created = child("created");
        const table = Table({ caption: "Records", columns: [{ id: "value", header: "Value" }], rows: [{ value: "old" }] });
        expect(() => table.update({ columns: [
            { id: "first", header: "First", cell: () => created },
            { id: "second", header: "Second", cell: () => { throw new Error("renderer"); } }
        ] })).toThrow("renderer");
        expect(created.destroy).toHaveBeenCalledOnce();
        table.destroy();
    });

    it("does not resurrect a destroyed table through any public mutation", () => {
        const table = Table({ caption: "Records", columns: [{ id: "value", header: "Value" }], rows: [{ value: "old" }] });
        table.destroy();
        const before = table.element.outerHTML;
        table.setCaption("late");
        table.setDescription("late");
        table.setEmptyState("late");
        table.setColumns([{ id: "late", header: "Late" }]);
        table.setRows([{ value: "late" }]);
        table.update({ attributes: { "data-late": "true" }, pending: true });
        expect(table.element.outerHTML).toBe(before);
    });

    it("releases cells constructed by a renderer that destroys its owner", () => {
        const created = child("canceled");
        const table = Table({ caption: "Records", columns: [{ id: "value", header: "Value" }], rows: [{ value: "old" }] });
        table.setColumns([{ id: "value", header: "Value", cell: () => { table.destroy(); return created; } }]);
        expect(created.destroy).toHaveBeenCalledOnce();
        expect(table.bodyRows).toHaveLength(0);
        expect(table.body.textContent).toBe("");
    });

    it("does not cancel a row rebuild when a renderer changes only pending state", () => {
        const table = Table({ caption: "Records", columns: [{ id: "value", header: "Value" }], rows: [{ value: "old" }] });
        table.update({ columns: [{ id: "value", header: "Value", cell: row => {
            table.update({ pending: true });
            return row.value;
        } }], rows: [{ value: "new" }] });
        expect(table.body.textContent).toBe("new");
        expect(table.element.getAttribute("aria-busy")).toBe("true");
        table.destroy();
    });

    it("keeps the renderer error when discarding partial content also fails", () => {
        const original = new Error("renderer");
        const created = child("canceled", vi.fn(() => { throw new Error("cleanup"); }));
        const table = Table({ caption: "Records", columns: [], rows: [1] });
        expect(() => table.setColumns([
            { id: "first", header: "First", cell: () => created },
            { id: "second", header: "Second", cell: () => { throw original; } }
        ])).toThrow(original);
        expect(created.destroy).toHaveBeenCalledOnce();
        table.destroy();
    });

    it("releases initial header and caption content when construction fails", () => {
        const caption = child("Records");
        const header = child("Value");
        expect(() => Table({ caption, columns: [{ id: "value", header, cell: () => { throw new Error("renderer"); } }], rows: [1] }))
            .toThrow("renderer");
        expect(caption.destroy).toHaveBeenCalledOnce();
        expect(header.destroy).toHaveBeenCalledOnce();
    });

    it("preserves authored descriptions through updates and teardown", () => {
        const table = Table({ caption: "Records", description: "Help", columns: [], rows: [],
            tableOptions: { attributes: { "aria-describedby": "author" } } });
        expect(table.table.getAttribute("aria-describedby")).toBe(`author ${table.description.id}`);
        table.update({ descriptionOptions: { id: "new-help" } });
        expect(table.table.getAttribute("aria-describedby")).toBe("author new-help");
        table.setDescription(null);
        expect(table.table.getAttribute("aria-describedby")).toBe("author");
        table.setDescription("Again");
        table.destroy();
        expect(table.table.getAttribute("aria-describedby")).toBe("author");
    });
});

describe("Dynamic navigation ownership", () => {
    it("runs all item cleanups even if leading content fails", () => {
        const leading = child("leading", vi.fn(() => { throw new Error("leading cleanup"); }));
        const label = child("label");
        const onNavigate = vi.fn();
        const navigation = Navigation({ leadingContent: () => leading, items: [{ label, href: "#one" }], onNavigate });
        const link = navigation.items[0]!.link;
        expect(() => navigation.destroy()).toThrow("leading cleanup");
        link.element.click();
        expect(label.destroy).toHaveBeenCalledOnce();
        expect(onNavigate).not.toHaveBeenCalled();
        expect(navigation.items).toHaveLength(0);
        expect(() => navigation.destroy()).not.toThrow();
    });

    it("keeps a newer list created during removed label cleanup", () => {
        let navigation: ComposedNavigation;
        const newest = child("newest");
        const abandoned = child("abandoned");
        const old = child("old", vi.fn(() => navigation.setItems([{ label: newest, href: "#newest" }])));
        navigation = Navigation({ items: [{ label: old, href: "#old" }] });
        navigation.setItems([{ label: abandoned, href: "#abandoned" }]);
        expect(navigation.element.textContent).toBe("newest");
        expect(navigation.items[0]!.item.label).toBe(newest);
        expect(abandoned.destroy).toHaveBeenCalledOnce();
        navigation.destroy();
    });

    it("does not call the parent callback after an item callback destroys the navigation", () => {
        const onNavigate = vi.fn();
        const navigation = Navigation({ items: [{ label: "One", href: "#one", onNavigate: (_detail, owner) => owner.destroy() }], onNavigate });
        navigation.items[0]!.link.element.click();
        expect(onNavigate).not.toHaveBeenCalled();
    });

    it("keeps replaced item handles inert and ignores all mutations after destruction", () => {
        const navigation = Navigation({ items: [{ label: "One", href: "#one" }] });
        const old = navigation.items[0]!;
        navigation.setItems([{ label: "Two", href: "#two" }]);
        const oldMarkup = old.element.outerHTML;
        old.setLabelContent("stale");
        expect(old.element.outerHTML).toBe(oldMarkup);
        navigation.destroy();
        const markup = navigation.element.outerHTML;
        navigation.setItems([{ label: "Late", href: "#late" }]);
        navigation.setCurrent("#late");
        navigation.update({ attributes: { "data-late": "true" } });
        expect(navigation.element.outerHTML).toBe(markup);
    });

    it("discards a leading control when its factory replaces the list", () => {
        const navigation = Navigation({ items: [{ label: "Old", href: "#old" }] });
        const abandoned = child("abandoned");
        navigation.update({ leadingContent: () => {
            navigation.update({ leadingContent: null, items: [{ label: "New", href: "#new" }] });
            return abandoned;
        } });
        expect(navigation.element.textContent).toBe("New");
        expect(abandoned.destroy).toHaveBeenCalledOnce();
        navigation.destroy();
    });

    it("keeps the old list and releases partial leading content after a build failure", () => {
        const navigation = Navigation({ items: [{ label: "Old", href: "#old" }] });
        const leading = child("leading");
        expect(() => navigation.update({ leadingContent: () => leading, items: [{
            get label(): string { throw new Error("label"); }, href: "#new"
        }] })).toThrow("label");
        expect(navigation.element.textContent).toBe("Old");
        expect(leading.destroy).toHaveBeenCalledOnce();
        navigation.destroy();
    });
});

describe("Owned navigation links", () => {
    it("removes link listeners and hints even when owned label cleanup throws", () => {
        const label = child("label", vi.fn(() => { throw new Error("label cleanup"); }));
        const onNavigate = vi.fn();
        const link = Link({ children: [label], hint: "Hint", onNavigate });
        expect(() => link.destroy()).toThrow("label cleanup");
        link.element.click();
        expect(onNavigate).not.toHaveBeenCalled();
        expect(link.isDestroyed()).toBe(true);
        expect(link.element.hasAttribute("aria-describedby")).toBe(false);
        expect(() => link.destroy()).not.toThrow();
    });

    it("ignores late composed and enhancement updates", () => {
        const link = Link({ text: "One", href: "#one" });
        link.destroy();
        const before = link.element.outerHTML;
        link.setText("late");
        link.setHint("late");
        link.update({ target: "_blank", rel: "help", variant: "muted", children: ["late"] });
        expect(link.element.outerHTML).toBe(before);
        const element = document.createElement("a");
        const enhanced = createLink(element);
        enhanced.destroy();
        enhanced.update({ target: "_blank", rel: "help", variant: "muted", size: "md" });
        expect(element.outerHTML).toBe("<a></a>");
    });
});
