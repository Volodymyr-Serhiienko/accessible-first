import { describe, expect, it } from "vitest";
import { Table, type TableSortState } from "../../../packages/components/src/table";

describe("controlled table sorting", () => {
    it("requests sorting without reordering rows, confirms aria-sort without losing focus, and cleans up", () => {
        const requests: TableSortState[] = [];
        const table = Table({ caption: "Users", rows: [{ email: "z" }, { email: "a" }],
            columns: [{ id: "email", header: "Email", sortable: true }, { id: "role", header: "Role" }],
            rowOptions: row => ({ attributes: { tabindex: "0", "aria-label": row.email } }),
            onSortChange: sort => requests.push(sort) });
        document.body.append(table.element);
        const button = table.head.querySelector<HTMLButtonElement>("button")!;
        expect(button.type).toBe("button");
        expect(table.head.querySelectorAll("button")).toHaveLength(1);
        button.focus();
        button.click();
        expect(requests).toEqual([{ columnId: "email", direction: "ascending" }]);
        expect(table.bodyRows.map(row => row.item.email)).toEqual(["z", "a"]);
        expect(table.headerCells[0]!.element.hasAttribute("aria-sort")).toBe(false);
        table.update({ sort: requests[0]!, rows: [{ email: "a" }, { email: "z" }] });
        expect(document.activeElement).toBe(button);
        expect(table.headerCells[0]!.element.getAttribute("aria-sort")).toBe("ascending");
        button.click();
        expect(requests[1]).toEqual({ columnId: "email", direction: "descending" });
        table.update({ pending: true });
        expect(table.element.getAttribute("aria-busy")).toBe("true");
        expect(button.getAttribute("aria-disabled")).not.toBe("true");
        button.click();
        expect(requests).toHaveLength(2);
        expect(document.activeElement).toBe(button);
        table.update({ pending: false });
        table.update({ sortDisabled: true });
        expect(button.getAttribute("aria-disabled")).toBe("true");
        expect(document.activeElement).toBe(button);
        button.click();
        expect(requests).toHaveLength(2);
        table.update({ sort: null, sortDisabled: false });
        expect(table.headerCells[0]!.element.hasAttribute("aria-sort")).toBe(false);
        table.bodyRows[0]!.element.focus();
        expect(document.activeElement).toBe(table.bodyRows[0]!.element);
        expect(table.bodyRows[0]!.element.getAttribute("aria-label")).toBe("a");
        table.destroy();
        button.click();
        expect(requests).toHaveLength(2);
    });

    it("sorts only when a callback is present and marks only the active header", () => {
        const table = Table({ caption: "Users", rows: [], columns: [
            { id: "email", header: "Email", sortable: true }, { id: "role", header: "Role", sortable: true }],
            sort: { columnId: "role", direction: "descending" } });
        expect(table.headerCells[0]!.element.hasAttribute("aria-sort")).toBe(false);
        expect(table.headerCells[1]!.element.getAttribute("aria-sort")).toBe("descending");
        expect(table.head.querySelector("button")!.getAttribute("aria-disabled")).toBe("true");
        table.destroy();
    });
});
