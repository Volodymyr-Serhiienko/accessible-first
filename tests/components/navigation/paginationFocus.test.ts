import { describe, expect, it, vi } from "vitest";
import { Pagination } from "../../../packages/components/src/pagination";
import { Table } from "../../../packages/components/src/table";

function visible(element: HTMLElement): HTMLElement {
    vi.spyOn(element, "getClientRects").mockReturnValue([new DOMRect(0, 0, 120, 30)] as unknown as DOMRectList);
    return element;
}

describe("Pagination result focus", () => {
    it("focuses the new first row after a synchronous page commit", () => {
        const table = Table({ caption: "Results", rows: ["First"], columns: [{ id: "text", header: "Text", cell: text => text }],
            rowOptions: { attributes: { tabindex: "0" } } });
        const view = Pagination({ page: 1, pageCount: 3, focusTarget: () => visible(table.bodyRows[0]!.element),
            onPageChange(detail, owner) { table.setRows([`Page ${detail.page}`]); owner.setPage(detail.page); } });
        document.body.append(table.element, view.element);
        const next = view.items.find(item => item.kind === "next")!.control;
        next.focus(); next.click();
        expect(document.activeElement).toBe(table.bodyRows[0]!.element);
        expect(document.activeElement?.textContent).toBe("Page 2");
        view.destroy(); table.destroy();
    });

    it("waits for a server page commit and respects focus moved during loading", () => {
        const target = visible(document.createElement("h2"));
        const other = document.createElement("button");
        const requested = vi.fn();
        const view = Pagination({ page: 1, pageCount: 3, focusTarget: () => target, onPageChange: requested });
        document.body.append(target, other, view.element);
        const next = view.items.find(item => item.kind === "next")!.control;
        next.focus(); next.click();
        expect(requested).toHaveBeenCalledOnce();
        expect(document.activeElement).toBe(next);
        other.focus();
        view.update({ page: 2 });
        expect(document.activeElement).toBe(other);
        view.items.find(item => item.kind === "next")!.control.focus();
        view.update({ page: 3 });
        expect(document.activeElement).toBe(target);
        expect(target.tabIndex).toBe(-1);
        other.focus();
        expect(target.hasAttribute("tabindex")).toBe(false);
        view.destroy();
    });

    it("does not redirect focus on initial, unchanged, chrome, count or locale updates", () => {
        const resolve = vi.fn(() => visible(document.createElement("h2")));
        const view = Pagination({ page: 2, pageCount: 4, focusTarget: resolve });
        document.body.append(view.element);
        view.items.find(item => item.kind === "next")!.control.focus();
        view.setPage(2);
        view.setPageCount(5);
        view.update({ page: 2, label: "Pages", locale: { t: key => key } });
        expect(resolve).not.toHaveBeenCalled();
        view.destroy();
    });

    it("uses an explicit empty-table fallback when the page count clamps the page", () => {
        const table = Table({ caption: "Empty results", rows: [], columns: [{ id: "text", header: "Text" }], emptyState: "No records" });
        visible(table.table);
        const view = Pagination({ page: 3, pageCount: 3, focusTarget: () => table.bodyRows[0]?.element ?? table.table });
        document.body.append(table.element, view.element);
        view.items.find(item => item.kind === "previous")!.control.focus();
        view.setPageCount(1);
        expect(document.activeElement).toBe(table.table);
        view.destroy(); table.destroy();
    });

    it("ignores missing, detached, hidden and inert targets", () => {
        const target = visible(document.createElement("h2"));
        const container = document.createElement("div");
        container.append(target); document.body.append(container);
        const view = Pagination({ page: 1, pageCount: 8, focusTarget: () => target });
        document.body.append(view.element);
        for (const state of ["hidden", "inert", "detached", "missing"]) {
            if (state === "detached") container.remove();
            else if (state === "missing") view.update({ focusTarget: null });
            else container.setAttribute(state, "");
            view.items.find(item => item.kind === "next")!.control.focus();
            view.setPage(view.getPage() + 1);
            expect(document.activeElement).not.toBe(target);
            container.removeAttribute(state);
        }
        view.destroy();
    });

    it("does not focus a stale target if its resolver commits newer content or destroys the pager", () => {
        const target = visible(document.createElement("h2"));
        const other = document.createElement("button");
        const view = Pagination({ page: 1, pageCount: 5 });
        document.body.append(target, other, view.element);
        view.update({ focusTarget() { other.focus(); return target; } });
        view.items.find(item => item.kind === "next")!.control.focus();
        view.setPage(2);
        expect(document.activeElement).toBe(other);
        view.update({ focusTarget() { view.setPage(4); return target; } });
        view.items.find(item => item.kind === "next")!.control.focus();
        view.setPage(3);
        expect(view.getPage()).toBe(4);
        expect(document.activeElement).not.toBe(target);
        view.update({ focusTarget() { view.destroy(); return target; } });
        view.items.find(item => item.kind === "previous")!.control.focus();
        view.setPage(2);
        expect(document.activeElement).not.toBe(target);
    });
});
