import { createId } from "../../../core/src/id";
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

function createHeaderCellNode<TItem>(column: TableColumn<TItem>): TableHeaderCellNode {
    const cell = createElement("th", getCompositionElementOptions(
        column.headerOptions,
        getHeaderCellAttributes(column)
    ));
    const slot = createContentSlot(cell, toCompositionChildren(column.header));

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
    cells.forEach((cell) => cell.slot.dispose());
}

function disposeBodyRows<TItem>(rows: TableBodyRowNode<TItem>[]): void {
    rows.forEach((row) => {
        row.cells.forEach((cell) => cell.slot.dispose());
    });
}

function disposeEmptyRow(row: TableEmptyRowNode | null): void {
    row?.slot.dispose();
}

/**
 * Creates a native, responsive table for structured row/column data.
 */
export function Table<TItem = Record<string, unknown>>(options: TableOptions<TItem>): ComposedTable<TItem> {
    const element = createElement("div", getCompositionElementOptions(options, {
        "data-af-composition": "table"
    }));

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
    let bodyRowNodes: TableBodyRowNode<TItem>[] = [];
    let emptyRowNode: TableEmptyRowNode | null = null;

    table.append(caption, head, body);
    viewport.append(table);
    element.append(description, viewport);

    function sync(): void {
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
        setElementAttributeValue(table, "aria-describedby", hasDescription ? description.id : null);
    }

    function disposeHeader(): void {
        disposeHeaderCells(headerCellNodes);
        headerCellNodes = [];
        headerCells.splice(0, headerCells.length);
        head.replaceChildren();
    }

    function disposeBody(): void {
        disposeBodyRows(bodyRowNodes);
        disposeEmptyRow(emptyRowNode);
        bodyRowNodes = [];
        emptyRowNode = null;
        bodyRows.splice(0, bodyRows.length);
        body.replaceChildren();
    }

    function renderHeader(): void {
        disposeHeader();

        const row = createElement("tr", {
            attributes: {
                "data-af-table-header-row": ""
            }
        });

        headerCellNodes = columns.map(createHeaderCellNode);
        headerCellNodes.forEach((cell) => {
            row.append(cell.element);
            headerCells.push(createComposedHeaderCell(cell));
        });

        head.append(row);
    }

    function renderEmptyRow(): void {
        if (!hasEmptyState) return;

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
        body.append(row);
        emptyRowNode = { element: row, cell, slot };
    }

    function renderBody(): void {
        disposeBody();

        if (rows.length === 0) {
            renderEmptyRow();
            return;
        }

        rows.forEach((item, rowIndex) => {
            const attributes: ElementAttributes = {
                "data-af-table-row": ""
            };
            const rowKey = getRowKey?.(item, rowIndex);

            if (rowKey !== null && rowKey !== undefined) {
                attributes["data-af-row-key"] = rowKey;
            }

            const row = createElement("tr", getCompositionElementOptions(
                getRowOptions(rowOptions, item, rowIndex),
                attributes
            ));
            const cells = columns.map((column, columnIndex) => createBodyCellNode(item, {
                item,
                rowIndex,
                column,
                columnIndex
            }));
            const node: TableBodyRowNode<TItem> = {
                element: row,
                item,
                cells
            };

            cells.forEach((cell) => row.append(cell.element));
            body.append(row);
            bodyRowNodes.push(node);
            bodyRows.push(createComposedBodyRow(node));
        });
    }

    function setCaption(content: TableCompositionContent): void {
        captionSlot.set(toCompositionChildren(normalizeSlotContent(content)));
        sync();
    }

    function setDescription(content: TableCompositionContent | null): void {
        descriptionContent = normalizeSlotContent(content);
        hasDescription = hasCompositionContent(descriptionContent);
        descriptionSlot.set(toCompositionChildren(descriptionContent));
        sync();
    }

    function setEmptyState(content: TableCompositionContent | null): void {
        emptyStateContent = normalizeSlotContent(content);
        hasEmptyState = hasCompositionContent(emptyStateContent);
        renderBody();
        sync();
    }

    function setColumns(nextColumns: readonly TableColumn<TItem>[]): void {
        columns = [...nextColumns];
        renderHeader();
        renderBody();
        sync();
    }

    function setRows(nextRows: readonly TItem[]): void {
        rows = [...nextRows];
        renderBody();
        sync();
    }

    renderHeader();
    renderBody();
    sync();

    return {
        element,
        viewport,
        table,
        caption,
        description,
        head,
        body,
        headerCells,
        bodyRows,

        getCaptionText(): string {
            return getElementText(caption);
        },

        getDescriptionText(): string {
            return getElementText(description);
        },

        setCaption,
        setDescription,
        setEmptyState,
        setColumns,
        setRows,

        update(nextOptions): void {
            let shouldRenderBody = false;

            applyCompositionElementOptions(element, nextOptions);

            if (nextOptions.tableOptions !== undefined) applyCompositionElementOptions(table, nextOptions.tableOptions);
            if (nextOptions.captionOptions !== undefined) applyCompositionElementOptions(caption, nextOptions.captionOptions);
            if (nextOptions.descriptionOptions !== undefined) applyCompositionElementOptions(description, nextOptions.descriptionOptions);
            if (nextOptions.headOptions !== undefined) applyCompositionElementOptions(head, nextOptions.headOptions);
            if (nextOptions.bodyOptions !== undefined) applyCompositionElementOptions(body, nextOptions.bodyOptions);

            if (nextOptions.caption !== undefined) setCaption(nextOptions.caption);
            if ("description" in nextOptions) setDescription(nextOptions.description ?? null);
            if ("emptyState" in nextOptions) setEmptyState(nextOptions.emptyState ?? null);

            if (nextOptions.variant !== undefined) variant = nextOptions.variant;
            if (nextOptions.size !== undefined) size = nextOptions.size;
            if (nextOptions.responsive !== undefined) responsive = nextOptions.responsive;
            if (nextOptions.captionDisplay !== undefined) captionDisplay = nextOptions.captionDisplay;
            if (nextOptions.descriptionDisplay !== undefined) descriptionDisplay = nextOptions.descriptionDisplay;

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
                shouldRenderBody = true;
            }

            if (nextOptions.columns !== undefined) {
                setColumns(nextOptions.columns);
                return;
            }

            if (nextOptions.rows !== undefined) {
                setRows(nextOptions.rows);
                return;
            }

            if (shouldRenderBody) {
                renderBody();
            }

            sync();
        },

        destroy(): void {
            captionSlot.dispose();
            descriptionSlot.dispose();
            disposeHeader();
            disposeBody();
        }
    };
}
