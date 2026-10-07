import { addEventListener } from "../../../core/src/events";
import { createContentSlot, createElement, Icon, toCompositionChildren,
    type CompositionContent, type ComposedNode } from "../composition";

/** Direction of a controlled table sort. */
export type TableSortDirection = "ascending" | "descending";

/** The one column currently sorted by the consumer. */
export interface TableSortState {
    columnId: string;
    direction: TableSortDirection;
}

/** Requests a sort; the consumer supplies ordered rows and confirms state via update(). */
export type TableOnSortChange = (sort: TableSortState, event: Event) => void;

/** @internal Creates a native sort button with managed header content. */
export function createTableSortButton(header: CompositionContent, onPress: (event: Event) => void): ComposedNode<HTMLButtonElement> {
    const icon = Icon({ path: "m18 15-6-6-6 6", variant: "outline", size: "1em" });
    const label = createElement("span");
    const content = createContentSlot(label, toCompositionChildren(header));
    const element = createElement("button", { attributes: { type: "button", "data-af-table-sort": "" },
        children: [label, icon] });
    const removeClick = addEventListener(element, "click", onPress);
    return { element, destroy() { removeClick(); content.dispose(); icon.destroy?.(); } };
}

/** @internal Updates sorting semantics without replacing the focused button. */
export function syncTableSortHeader(cell: HTMLTableCellElement, columnId: string, sort: TableSortState | null,
    disabled: boolean): void {
    const direction = sort?.columnId === columnId ? sort.direction : null;
    if (direction) cell.setAttribute("aria-sort", direction);
    else cell.removeAttribute("aria-sort");
    const button = cell.querySelector<HTMLButtonElement>("[data-af-table-sort]");
    button?.setAttribute("aria-disabled", String(disabled));
    button?.setAttribute("data-af-sort", direction ?? "none");
}
