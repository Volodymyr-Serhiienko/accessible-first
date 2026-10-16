import { createId } from "../../../core/src/id";
import { runCleanups } from "../../../core/src/events";
import { createAriaReferenceOwner } from "../../../core/src/aria/createAriaReferenceOwner";
import { createPendingState } from "../foundation";
import { createTableSortButton, syncTableSortHeader,
    type TableOnSortChange, type TableSortState } from "./tableSorting";
import {
    applyCompositionElementOptions,
    createContentSlot,
    createElement,
    getCompositionElementOptions,
    getElementText,
    hasCompositionContent,
    setElementAttributeValue,
    toCompositionChildren,
    type BaseCompositionOptions,
    type ComposedNode,
    type CompositionContent,
    type ContentSlot,
    type ElementAttributes
} from "../composition";

/**
 * Content accepted by Table caption, description, header, cell, and empty-state slots.
 */
export type TableCompositionContent = CompositionContent;

/**
 * Stable string identifier for a table column.
 */
export type TableColumnId = string;

/**
 * Visual alignment for a header or body cell.
 */
export type TableCellAlign = "start" | "center" | "end";

/**
 * Visual variant for Table.
 */
export type TableVariant = "default" | "plain" | "striped";

/**
 * Table size token.
 */
export type TableSize = "md";

/**
 * Responsive behavior for wide tables.
 */
export type TableResponsive = "scroll" | "none";

/**
 * Caption display mode. Use visually-hidden when the page already has a visible heading.
 */
export type TableCaptionDisplay = "visible" | "visually-hidden";

/**
 * Description display mode for supporting table guidance.
 */
export type TableDescriptionDisplay = "visible" | "visually-hidden";

/**
 * Context passed to table cell renderers and cell option resolvers.
 */
export interface TableCellRenderContext<TItem = Record<string, unknown>> {
    readonly item: TItem;
    readonly rowIndex: number;
    readonly column: TableColumn<TItem>;
    readonly columnIndex: number;
}

/**
 * Function that renders body cell content for one row and column.
 */
export type TableCellRenderer<TItem = Record<string, unknown>> = (
    item: TItem,
    context: TableCellRenderContext<TItem>
) => TableCompositionContent;

/**
 * Function that returns common composition options for one table row.
 */
export type TableRowOptionsResolver<TItem = Record<string, unknown>> = (
    item: TItem,
    rowIndex: number
) => BaseCompositionOptions | undefined;

/**
 * Row options accepted by Table().
 */
export type TableRowOptions<TItem = Record<string, unknown>> =
    | BaseCompositionOptions
    | TableRowOptionsResolver<TItem>;

/**
 * Function that returns common composition options for one table body cell.
 */
export type TableCellOptionsResolver<TItem = Record<string, unknown>> = (
    item: TItem,
    context: TableCellRenderContext<TItem>
) => BaseCompositionOptions | undefined;

/**
 * Body cell options accepted by a table column.
 */
export type TableCellOptions<TItem = Record<string, unknown>> =
    | BaseCompositionOptions
    | TableCellOptionsResolver<TItem>;

/**
 * Function that returns a stable row key used as a data attribute for diagnostics/styling.
 */
export type TableRowKeyResolver<TItem = Record<string, unknown>> = (
    item: TItem,
    rowIndex: number
) => string | number | null | undefined;

/**
 * One column accepted by Table().
 */
export interface TableColumn<TItem = Record<string, unknown>> {
    /** Stable column id. When cell is omitted, object rows use this id as a property name. */
    id: TableColumnId;
    /** Native table header content. */
    header: TableCompositionContent;
    /** Renders a native sort-request button. Sorting is controlled by the consumer. */
    sortable?: boolean;
    /** Optional renderer for body cells. Omit for simple object rows keyed by column id. */
    cell?: TableCellRenderer<TItem>;
    /** Renders body cells in this column as row headers with scope="row". */
    rowHeader?: boolean;
    /** Visual alignment for this column. */
    align?: TableCellAlign;
    /** Common composition options for the header cell. */
    headerOptions?: BaseCompositionOptions;
    /** Common composition options, or a resolver, for body cells in this column. */
    cellOptions?: TableCellOptions<TItem>;
}

/**
 * Options for Table().
 */
export interface TableOptions<TItem = Record<string, unknown>> extends BaseCompositionOptions {
    /** Accessible table caption. Prefer visually-hidden over omitting meaningful captions. */
    caption: TableCompositionContent;
    /** Column definitions used to render the table header and body cells. */
    columns: readonly TableColumn<TItem>[];
    /** Row data rendered through column cell renderers or object property fallback. */
    rows: readonly TItem[];
    /** Confirmed sorting state. Table never sorts or mutates the supplied rows. */
    sort?: TableSortState | null;
    /** Requests ascending/descending order for a sortable column. */
    onSortChange?: TableOnSortChange | null;
    /** Prevents sort activation while keeping header buttons focusable. */
    sortDisabled?: boolean;
    /** Guards sort requests while loading without marking headers disabled. */
    pending?: boolean;
    /** Optional supporting text associated with the table through aria-describedby. */
    description?: TableCompositionContent | null;
    /** Optional empty-state row shown when rows is empty. No default text is generated. */
    emptyState?: TableCompositionContent | null;
    /** Caption display mode. Defaults to visible. */
    captionDisplay?: TableCaptionDisplay;
    /** Description display mode. Defaults to visible. */
    descriptionDisplay?: TableDescriptionDisplay;
    /** Visual variant. Defaults to default. */
    variant?: TableVariant;
    /** Size token. Defaults to md. */
    size?: TableSize;
    /** Wide-table behavior. Defaults to scroll. */
    responsive?: TableResponsive;
    /** Optional row key resolver used for data-af-row-key. */
    getRowKey?: TableRowKeyResolver<TItem>;
    /** Common options for the native table element. */
    tableOptions?: BaseCompositionOptions;
    /** Common options for the caption element. */
    captionOptions?: BaseCompositionOptions;
    /** Common options for the description element. */
    descriptionOptions?: BaseCompositionOptions;
    /** Common options for the thead element. */
    headOptions?: BaseCompositionOptions;
    /** Common options for the tbody element. */
    bodyOptions?: BaseCompositionOptions;
    /** Common options, or a resolver, for body rows. */
    rowOptions?: TableRowOptions<TItem>;
    /** Common options for the empty-state cell. */
    emptyCellOptions?: BaseCompositionOptions;
}

/**
 * Options accepted by ComposedTable.update().
 */
export interface TableUpdateOptions<TItem = Record<string, unknown>> extends Partial<TableOptions<TItem>> {}

/**
 * One composed table header cell.
 */
export interface ComposedTableHeaderCell extends ComposedNode<HTMLTableCellElement> {
    readonly element: HTMLTableCellElement;
    getText(): string;
}

/**
 * One composed table body cell.
 */
export interface ComposedTableBodyCell extends ComposedNode<HTMLTableCellElement> {
    readonly element: HTMLTableCellElement;
    getText(): string;
}

/**
 * One composed table body row.
 */
export interface ComposedTableRow<TItem = Record<string, unknown>> extends ComposedNode<HTMLTableRowElement> {
    readonly element: HTMLTableRowElement;
    readonly item: TItem;
    readonly cells: readonly ComposedTableBodyCell[];
}

/**
 * Table created by the composition API.
 */
export interface ComposedTable<TItem = Record<string, unknown>> extends ComposedNode<HTMLElement> {
    readonly element: HTMLElement;
    readonly viewport: HTMLElement;
    readonly table: HTMLTableElement;
    readonly caption: HTMLTableCaptionElement;
    readonly description: HTMLElement;
    readonly head: HTMLTableSectionElement;
    readonly body: HTMLTableSectionElement;
    readonly headerCells: readonly ComposedTableHeaderCell[];
    readonly bodyRows: readonly ComposedTableRow<TItem>[];
    getCaptionText(): string;
    getDescriptionText(): string;
    setCaption(content: TableCompositionContent): void;
    setDescription(content: TableCompositionContent | null): void;
    setEmptyState(content: TableCompositionContent | null): void;
    setColumns(columns: readonly TableColumn<TItem>[]): void;
    setRows(rows: readonly TItem[]): void;
    update(options: TableUpdateOptions<TItem>): void;
    destroy(): void;
}

type TableSlotContent = Exclude<TableCompositionContent, undefined> | null;

interface TableHeaderCellNode {
    element: HTMLTableCellElement;
    slot: ContentSlot;
}

interface TableBodyCellNode {
    element: HTMLTableCellElement;
    slot: ContentSlot;
}

interface TableBodyRowNode<TItem> {
    element: HTMLTableRowElement;
    item: TItem;
    cells: TableBodyCellNode[];
}

interface TableEmptyRowNode {
    element: HTMLTableRowElement;
    cell: HTMLTableCellElement;
    slot: ContentSlot;
}

function normalizeSlotContent(content: TableCompositionContent | null): TableSlotContent {
    return content === undefined ? null : content;
}

function getRowOptions<TItem>(
    rowOptions: TableRowOptions<TItem> | undefined,
    item: TItem,
    rowIndex: number
): BaseCompositionOptions | undefined {
    return typeof rowOptions === "function"
        ? rowOptions(item, rowIndex)
        : rowOptions;
}

function getCellOptions<TItem>(
    cellOptions: TableCellOptions<TItem> | undefined,
    item: TItem,
    context: TableCellRenderContext<TItem>
): BaseCompositionOptions | undefined {
    return typeof cellOptions === "function"
        ? cellOptions(item, context)
        : cellOptions;
}

function getObjectCellContent<TItem>(item: TItem, columnId: TableColumnId): TableCompositionContent | null {
    if (!item || typeof item !== "object") return null;

    const value = (item as Record<string, TableCompositionContent | undefined>)[columnId];

    return value ?? null;
}

function getCellContent<TItem>(
    item: TItem,
    context: TableCellRenderContext<TItem>
): TableCompositionContent | null {
    return context.column.cell
        ? context.column.cell(item, context)
        : getObjectCellContent(item, context.column.id);
}

function setCellAlignment(cell: HTMLTableCellElement, align: TableCellAlign | undefined): void {
    setElementAttributeValue(cell, "data-af-align", align ?? null);
}

function getHeaderCellAttributes<TItem>(column: TableColumn<TItem>): ElementAttributes {
    return {
        "data-af-table-header-cell": "",
        "data-af-column-id": column.id,
        scope: "col"
    };
}

function getBodyCellAttributes<TItem>(column: TableColumn<TItem>): ElementAttributes {
    const attributes: ElementAttributes = {
        "data-af-table-cell": "",
        "data-af-column-id": column.id
    };

    if (column.rowHeader) {
        attributes.scope = "row";
    }

    return attributes;
}

function createHeaderCellNode<TItem>(column: TableColumn<TItem>, onSort: (columnId: string, event: Event) => void): TableHeaderCellNode {
    const cell = createElement("th", getCompositionElementOptions(
        column.headerOptions,
        getHeaderCellAttributes(column)
    ));
    const slot = createContentSlot(cell, column.sortable
        ? [createTableSortButton(column.header, event => onSort(column.id, event))]
        : toCompositionChildren(column.header));

    setCellAlignment(cell, column.align);

    return { element: cell, slot };
}

function createComposedHeaderCell(node: TableHeaderCellNode): ComposedTableHeaderCell {
    return {
        element: node.element,

        getText(): string {
            return getElementText(node.element);
        }
    };
}

function createBodyCellNode<TItem>(
    item: TItem,
    context: TableCellRenderContext<TItem>
): TableBodyCellNode {
    const tagName = context.column.rowHeader ? "th" : "td";
    const cell = createElement(tagName, getCompositionElementOptions(
        getCellOptions(context.column.cellOptions, item, context),
        getBodyCellAttributes(context.column)
    ));
    const slot = createContentSlot(cell, toCompositionChildren(getCellContent(item, context)));

    setCellAlignment(cell, context.column.align);

    return { element: cell, slot };
}

function createComposedBodyCell(node: TableBodyCellNode): ComposedTableBodyCell {
    return {
        element: node.element,

        getText(): string {
            return getElementText(node.element);
        }
    };
}

function createComposedBodyRow<TItem>(node: TableBodyRowNode<TItem>): ComposedTableRow<TItem> {
    return {
        element: node.element,
        item: node.item,
        cells: node.cells.map(createComposedBodyCell)
    };
}

function disposeHeaderCells(cells: TableHeaderCellNode[]): void {
    runCleanups([...cells].reverse().map(cell => cell.slot.dispose));
}

function disposeBodyRows<TItem>(rows: TableBodyRowNode<TItem>[]): void {
    runCleanups([...rows].reverse().map(row => () =>
        runCleanups([...row.cells].reverse().map(cell => cell.slot.dispose))));
}

/**
 * Creates a native, responsive table for structured row/column data.
 */
export function Table<TItem = Record<string, unknown>>(options: TableOptions<TItem>): ComposedTable<TItem> {
    const element = createElement("div", getCompositionElementOptions(options, {
        "data-af-composition": "table"
    }));
    const pendingState = createPendingState(element, { pending: options.pending ?? false });

    const description = createElement("div", getCompositionElementOptions(options.descriptionOptions, {
        "data-af-table-description": ""
    }));

    const viewport = createElement("div", {
        attributes: {
            "data-af-table-viewport": ""
        }
    });

    const table = createElement("table", getCompositionElementOptions(options.tableOptions, {
        "data-af-table": ""
    }));

    const caption = createElement("caption", getCompositionElementOptions(options.captionOptions, {
        "data-af-table-caption": ""
    }));

    const head = createElement("thead", getCompositionElementOptions(options.headOptions, {
        "data-af-table-head": ""
    }));

    const body = createElement("tbody", getCompositionElementOptions(options.bodyOptions, {
        "data-af-table-body": ""
    }));

    if (!description.id) {
        description.id = createId("af-table-description");
    }

    let columns = [...options.columns];
    let rows = [...options.rows];
    let sort = options.sort ?? null;
    let onSortChange = options.onSortChange;
    let sortDisabled = options.sortDisabled ?? false;
    let variant: TableVariant = options.variant ?? "default";
    let size: TableSize = options.size ?? "md";
    let responsive: TableResponsive = options.responsive ?? "scroll";
    let captionDisplay: TableCaptionDisplay = options.captionDisplay ?? "visible";
    let descriptionDisplay: TableDescriptionDisplay = options.descriptionDisplay ?? "visible";
    let rowOptions = options.rowOptions;
    let getRowKey = options.getRowKey;
    let emptyCellOptions = options.emptyCellOptions;
    let descriptionContent: TableSlotContent = normalizeSlotContent(options.description);
    let emptyStateContent: TableSlotContent = normalizeSlotContent(options.emptyState);
    let hasDescription = hasCompositionContent(descriptionContent);
    let hasEmptyState = hasCompositionContent(emptyStateContent);

    const headerCells: ComposedTableHeaderCell[] = [];
    const bodyRows: ComposedTableRow<TItem>[] = [];
    const captionSlot = createContentSlot(caption, toCompositionChildren(normalizeSlotContent(options.caption)));
    const descriptionSlot = createContentSlot(description, toCompositionChildren(descriptionContent));

    let headerCellNodes: TableHeaderCellNode[] = [];
    const headerSlot = createContentSlot(head);
    const bodySlot = createContentSlot(body);
    const descriptionReference = createAriaReferenceOwner(table, "aria-describedby");
    let destroyed = false;
    let revision = 0;

    table.append(caption, head, body);
    viewport.append(table);
    element.append(description, viewport);

    function sync(): void {
        if (destroyed) return;
        element.setAttribute("data-af-composition", "table");
        element.setAttribute("data-af-variant", variant);
        element.setAttribute("data-af-size", size);
        element.setAttribute("data-af-responsive", responsive);
        element.setAttribute("data-af-has-description", String(hasDescription));
        element.setAttribute("data-af-has-rows", String(rows.length > 0));

        viewport.setAttribute("data-af-table-viewport", "");
        table.setAttribute("data-af-table", "");
        caption.setAttribute("data-af-table-caption", "");
        caption.setAttribute("data-af-display", captionDisplay);
        description.setAttribute("data-af-table-description", "");
        description.setAttribute("data-af-display", descriptionDisplay);
        head.setAttribute("data-af-table-head", "");
        body.setAttribute("data-af-table-body", "");

        description.hidden = !hasDescription;
        descriptionReference.set(hasDescription ? [description.id] : []);
        headerCellNodes.forEach((cell, index) => {
            const column = columns[index];
            if (column?.sortable) syncTableSortHeader(cell.element, column.id, sort, sortDisabled || !onSortChange);
        });
    }

    function renderHeader(current: number): void {
        if (destroyed || current !== revision) return;
        const row = createElement("tr", {
            attributes: {
                "data-af-table-header-row": ""
            }
        });

        const cells: TableHeaderCellNode[] = [];
        let committed = false;
        const discard = (): void => {
            if (committed) return;
            committed = true;
            disposeHeaderCells(cells);
        };
        try {
            for (const column of columns) {
                const cell = createHeaderCellNode(column, (columnId, event) => {
                    if (destroyed || !headerCellNodes.includes(cell)
                        || sortDisabled || !onSortChange || pendingState.guard(event)) return;
                    onSortChange({ columnId, direction: sort?.columnId === columnId && sort.direction === "ascending"
                        ? "descending" : "ascending" }, event);
                });
                cells.push(cell);
            }
            if (destroyed || current !== revision) return;
            row.append(...cells.map(cell => cell.element));
            headerCellNodes = cells;
            headerCells.splice(0, headerCells.length, ...cells.map(createComposedHeaderCell));
            committed = true;
            headerSlot.set([{ element: row, destroy: () => disposeHeaderCells(cells) }]);
        } catch (error) {
            runCleanups([() => { throw error; }, discard]);
        } finally { discard(); }
    }

    function createEmptyRow(): TableEmptyRowNode {
        const row = createElement("tr", {
            attributes: {
                "data-af-table-empty-row": ""
            }
        });
        const cell = createElement("td", getCompositionElementOptions(emptyCellOptions, {
            "data-af-table-empty-cell": ""
        }));
        const slot = createContentSlot(cell, toCompositionChildren(emptyStateContent));

        cell.colSpan = Math.max(columns.length, 1);
        row.append(cell);
        return { element: row, cell, slot };
    }

    function renderBody(current: number): void {
        if (destroyed || current !== revision) return;
        const nextRows = rows;
        const nextColumns = columns;
        const nodes: TableBodyRowNode<TItem>[] = [];
        let empty: TableEmptyRowNode | null = null;
        let committed = false;
        const discard = (): void => {
            if (committed) return;
            committed = true;
            runCleanups([() => disposeBodyRows(nodes), () => empty?.slot.dispose()]);
        };
        try {
            for (const [rowIndex, item] of nextRows.entries()) {
                if (destroyed || current !== revision) return;
                const attributes: ElementAttributes = { "data-af-table-row": "" };
                const rowKey = getRowKey?.(item, rowIndex);
                if (rowKey !== null && rowKey !== undefined) attributes["data-af-row-key"] = rowKey;
                const row = createElement("tr", getCompositionElementOptions(
                    getRowOptions(rowOptions, item, rowIndex), attributes
                ));
                const node: TableBodyRowNode<TItem> = { element: row, item, cells: [] };
                nodes.push(node);
                for (const [columnIndex, column] of nextColumns.entries()) {
                    if (destroyed || current !== revision) return;
                    node.cells.push(createBodyCellNode(item, { item, rowIndex, column, columnIndex }));
                }
                row.append(...node.cells.map(cell => cell.element));
            }
            if (nextRows.length === 0 && hasEmptyState) empty = createEmptyRow();
            if (destroyed || current !== revision) return;
            bodyRows.splice(0, bodyRows.length, ...nodes.map(createComposedBodyRow));
            const children: ComposedNode[] = nodes.map(node => ({
                element: node.element, destroy: () => disposeBodyRows([node])
            }));
            if (empty) children.push({ element: empty.element, destroy: empty.slot.dispose });
            committed = true;
            bodySlot.set(children);
        } catch (error) {
            runCleanups([() => { throw error; }, discard]);
        } finally { discard(); }
    }

    function setCaption(content: TableCompositionContent): void {
        if (destroyed) return;
        runCleanups([() => captionSlot.set(toCompositionChildren(normalizeSlotContent(content))), sync]);
    }

    function setDescription(content: TableCompositionContent | null): void {
        if (destroyed) return;
        descriptionContent = normalizeSlotContent(content);
        hasDescription = hasCompositionContent(descriptionContent);
        runCleanups([() => descriptionSlot.set(toCompositionChildren(descriptionContent)), sync]);
    }

    function setEmptyState(content: TableCompositionContent | null): void {
        if (destroyed) return;
        emptyStateContent = normalizeSlotContent(content);
        hasEmptyState = hasCompositionContent(emptyStateContent);
        if (rows.length === 0) runCleanups([() => renderBody(++revision), sync]);
    }

    function setColumns(nextColumns: readonly TableColumn<TItem>[]): void {
        update({ columns: nextColumns });
    }

    function setRows(nextRows: readonly TItem[]): void {
        update({ rows: nextRows });
    }

    function update(nextOptions: TableUpdateOptions<TItem>): void {
        if (destroyed) return;
        let shouldRenderBody = false;

        applyCompositionElementOptions(element, nextOptions);
        if (nextOptions.pending !== undefined) pendingState.setPending(nextOptions.pending);
        if (nextOptions.tableOptions !== undefined) applyCompositionElementOptions(table, nextOptions.tableOptions);
        if (nextOptions.captionOptions !== undefined) applyCompositionElementOptions(caption, nextOptions.captionOptions);
        if (nextOptions.descriptionOptions !== undefined) applyCompositionElementOptions(description, nextOptions.descriptionOptions);
        if (nextOptions.headOptions !== undefined) applyCompositionElementOptions(head, nextOptions.headOptions);
        if (nextOptions.bodyOptions !== undefined) applyCompositionElementOptions(body, nextOptions.bodyOptions);

        if ("emptyState" in nextOptions) {
            emptyStateContent = normalizeSlotContent(nextOptions.emptyState);
            hasEmptyState = hasCompositionContent(emptyStateContent);
            shouldRenderBody = rows.length === 0;
        }
        if (nextOptions.variant !== undefined) variant = nextOptions.variant;
        if (nextOptions.size !== undefined) size = nextOptions.size;
        if (nextOptions.responsive !== undefined) responsive = nextOptions.responsive;
        if (nextOptions.captionDisplay !== undefined) captionDisplay = nextOptions.captionDisplay;
        if (nextOptions.descriptionDisplay !== undefined) descriptionDisplay = nextOptions.descriptionDisplay;
        if ("sort" in nextOptions) sort = nextOptions.sort ?? null;
        if ("onSortChange" in nextOptions) onSortChange = nextOptions.onSortChange;
        if (nextOptions.sortDisabled !== undefined) sortDisabled = nextOptions.sortDisabled;

        if ("rowOptions" in nextOptions) {
            rowOptions = nextOptions.rowOptions;
            shouldRenderBody = true;
        }
        if ("getRowKey" in nextOptions) {
            getRowKey = nextOptions.getRowKey;
            shouldRenderBody = true;
        }
        if ("emptyCellOptions" in nextOptions) {
            emptyCellOptions = nextOptions.emptyCellOptions;
            shouldRenderBody ||= rows.length === 0;
        }
        if (nextOptions.columns !== undefined) {
            columns = [...nextOptions.columns];
            shouldRenderBody = true;
        }
        if (nextOptions.rows !== undefined) {
            rows = [...nextOptions.rows];
            shouldRenderBody = true;
        }

        const current = shouldRenderBody ? ++revision : revision;
        runCleanups([
            () => { if (nextOptions.caption !== undefined) setCaption(nextOptions.caption); },
            () => { if (!destroyed && current === revision && "description" in nextOptions) setDescription(nextOptions.description ?? null); },
            () => { if (nextOptions.columns !== undefined) renderHeader(current); },
            () => { if (shouldRenderBody) renderBody(current); },
            sync
        ]);
    }

    try {
        renderHeader(revision);
        renderBody(revision);
        sync();
    } catch (error) {
        runCleanups([() => { throw error; }, destroy]);
    }

    function destroy(): void {
        if (destroyed) return;
        destroyed = true;
        revision += 1;
        headerCellNodes = [];
        headerCells.splice(0, headerCells.length);
        bodyRows.splice(0, bodyRows.length);
        runCleanups([pendingState.destroy, captionSlot.dispose, descriptionSlot.dispose, descriptionReference.destroy,
            headerSlot.dispose, bodySlot.dispose, () => head.replaceChildren(), () => body.replaceChildren()]);
    }

    return {
        element, viewport, table, caption, description, head, body, headerCells, bodyRows,
        getCaptionText(): string {
            return getElementText(caption);
        },
        getDescriptionText(): string {
            return getElementText(description);
        },
        setCaption, setDescription, setEmptyState, setColumns, setRows, update, destroy
    };
}
