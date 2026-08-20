import { restoreAttribute } from "../../../core/src/dom";
import { focusProgrammatically } from "../../../core/src/focus";
import {
    applyCompositionElementOptions,
    createContentSlot,
    createElement,
    getCompositionElementOptions,
    hasCompositionContent,
    toCompositionChildren,
    type BaseCompositionOptions,
    type ComposedNode,
    type CompositionContent
} from "../composition";

/**
 * Content accepted by ListDetail slots.
 */
export type ListDetailCompositionContent = CompositionContent;

/**
 * Responsive layout mode for ListDetail.
 */
export type ListDetailOrientation = "auto" | "horizontal" | "vertical";

/**
 * Visual variant for ListDetail.
 */
export type ListDetailVariant = "default" | "plain";

/**
 * ListDetail size token.
 */
export type ListDetailSize = "md";

/**
 * Programmatic focus target inside ListDetail.
 */
export type ListDetailFocusTarget = "list" | "detail";

/**
 * Options for ListDetail().
 */
export interface ListDetailOptions extends BaseCompositionOptions {
    list: ListDetailCompositionContent;
    detail?: ListDetailCompositionContent | null;
    empty?: ListDetailCompositionContent | null;
    listLabel?: string | null;
    detailLabel?: string | null;
    orientation?: ListDetailOrientation;
    variant?: ListDetailVariant;
    size?: ListDetailSize;
    listWidth?: string;
    defaultFocusTarget?: ListDetailFocusTarget;
    listOptions?: BaseCompositionOptions;
    detailOptions?: BaseCompositionOptions;
    emptyOptions?: BaseCompositionOptions;
}

/**
 * Options accepted by ComposedListDetail.update().
 */
export interface ListDetailUpdateOptions extends Partial<ListDetailOptions> {}

/**
 * List/detail application pattern created by the composition API.
 */
export interface ComposedListDetail extends ComposedNode<HTMLElement> {
    readonly element: HTMLElement;
    readonly list: HTMLElement;
    readonly detail: HTMLElement;
    readonly detailContent: HTMLElement;
    readonly empty: HTMLElement;
    setList(content: ListDetailCompositionContent): void;
    setDetail(content: ListDetailCompositionContent | null): void;
    setEmpty(content: ListDetailCompositionContent | null): void;
    getFocusTarget(target?: ListDetailFocusTarget): HTMLElement;
    focus(target?: ListDetailFocusTarget, options?: FocusOptions): boolean;
    update(options: ListDetailUpdateOptions): void;
    destroy(): void;
}

type ListDetailSlotContent = Exclude<ListDetailCompositionContent, undefined> | null;

function normalizeSlotContent(content: ListDetailCompositionContent | null): ListDetailSlotContent {
    return content === undefined ? null : content;
}

function setOptionalAriaLabel(element: HTMLElement, label: string | null): void {
    if (label && label.trim()) {
        element.setAttribute("aria-label", label);
    } else {
        element.removeAttribute("aria-label");
    }
}

function ensureProgrammaticFocusTarget(element: HTMLElement): void {
    if (!element.hasAttribute("tabindex")) {
        element.tabIndex = -1;
    }
}

/**
 * Creates a responsive list/detail screen pattern.
 */
export function ListDetail(options: ListDetailOptions): ComposedListDetail {
    const element = createElement("div", getCompositionElementOptions(options, {
        "data-af-composition": "list-detail"
    }));

    const list = createElement("section", getCompositionElementOptions(options.listOptions, {
        "data-af-list-detail-list": ""
    }));

    const detail = createElement("section", getCompositionElementOptions(options.detailOptions, {
        "data-af-list-detail-detail": ""
    }));

    const detailContent = createElement("div", {
        attributes: {
            "data-af-list-detail-content": ""
        }
    });

    const empty = createElement("div", getCompositionElementOptions(options.emptyOptions, {
        "data-af-list-detail-empty": ""
    }));

    const originalListTabIndex = list.getAttribute("tabindex");
    const originalDetailTabIndex = detail.getAttribute("tabindex");

    let listLabel: string | null = options.listLabel ?? "Items";
    let detailLabel: string | null = options.detailLabel ?? "Details";
    let orientation: ListDetailOrientation = options.orientation ?? "auto";
    let variant: ListDetailVariant = options.variant ?? "default";
    let size: ListDetailSize = options.size ?? "md";
    let listWidth = options.listWidth ?? null;
    let defaultFocusTarget: ListDetailFocusTarget = options.defaultFocusTarget ?? "list";

    let listContent = normalizeSlotContent(options.list);
    let detailSlotContent = normalizeSlotContent(options.detail);
    let emptyContent = normalizeSlotContent(options.empty);

    let hasDetail = hasCompositionContent(detailSlotContent);
    let hasEmpty = hasCompositionContent(emptyContent);

    const listSlot = createContentSlot(list, toCompositionChildren(listContent));
    const detailSlot = createContentSlot(detailContent, toCompositionChildren(detailSlotContent));
    const emptySlot = createContentSlot(empty, toCompositionChildren(emptyContent));

    detail.append(detailContent, empty);
    element.append(list, detail);

    function getFocusTarget(target: ListDetailFocusTarget = defaultFocusTarget): HTMLElement {
        if (target === "detail") return detail.hidden ? list : detail;

        return list;
    }

    function focus(
        target: ListDetailFocusTarget = defaultFocusTarget,
        focusOptions: FocusOptions = { preventScroll: true }
    ): boolean {
        return focusProgrammatically(getFocusTarget(target), focusOptions);
    }

    function sync(): void {
        element.setAttribute("data-af-composition", "list-detail");
        element.setAttribute("data-af-orientation", orientation);
        element.setAttribute("data-af-variant", variant);
        element.setAttribute("data-af-size", size);
        element.setAttribute("data-af-has-detail", String(hasDetail));

        list.setAttribute("data-af-list-detail-list", "");
        detail.setAttribute("data-af-list-detail-detail", "");
        detailContent.setAttribute("data-af-list-detail-content", "");
        empty.setAttribute("data-af-list-detail-empty", "");

        ensureProgrammaticFocusTarget(list);
        ensureProgrammaticFocusTarget(detail);

        setOptionalAriaLabel(list, listLabel);
        setOptionalAriaLabel(detail, detailLabel);

        detailContent.hidden = !hasDetail;
        empty.hidden = hasDetail || !hasEmpty;
        detail.hidden = !hasDetail && !hasEmpty;

        if (listWidth !== null) {
            element.style.setProperty("--af-list-detail-list-width", listWidth);
        } else {
            element.style.removeProperty("--af-list-detail-list-width");
        }
    }

    function setList(content: ListDetailCompositionContent): void {
        listContent = normalizeSlotContent(content);
        listSlot.set(toCompositionChildren(listContent));
        sync();
    }

    function setDetail(content: ListDetailCompositionContent | null): void {
        detailSlotContent = normalizeSlotContent(content);
        hasDetail = hasCompositionContent(detailSlotContent);
        detailSlot.set(toCompositionChildren(detailSlotContent));
        sync();
    }

    function setEmpty(content: ListDetailCompositionContent | null): void {
        emptyContent = normalizeSlotContent(content);
        hasEmpty = hasCompositionContent(emptyContent);
        emptySlot.set(toCompositionChildren(emptyContent));
        sync();
    }

    sync();

    return {
        element,
        list,
        detail,
        detailContent,
        empty,
        setList,
        setDetail,
        setEmpty,
        getFocusTarget,
        focus,

        update(nextOptions): void {
            applyCompositionElementOptions(element, nextOptions);

            if (nextOptions.listOptions !== undefined) {
                applyCompositionElementOptions(list, nextOptions.listOptions);
            }

            if (nextOptions.detailOptions !== undefined) {
                applyCompositionElementOptions(detail, nextOptions.detailOptions);
            }

            if (nextOptions.emptyOptions !== undefined) {
                applyCompositionElementOptions(empty, nextOptions.emptyOptions);
            }

            if ("list" in nextOptions) setList(nextOptions.list);
            if ("detail" in nextOptions) setDetail(nextOptions.detail ?? null);
            if ("empty" in nextOptions) setEmpty(nextOptions.empty ?? null);
            if ("listLabel" in nextOptions) listLabel = nextOptions.listLabel ?? null;
            if ("detailLabel" in nextOptions) detailLabel = nextOptions.detailLabel ?? null;
            if ("listWidth" in nextOptions) listWidth = nextOptions.listWidth ?? null;
            if (nextOptions.defaultFocusTarget !== undefined) defaultFocusTarget = nextOptions.defaultFocusTarget;
            if (nextOptions.orientation !== undefined) orientation = nextOptions.orientation;
            if (nextOptions.variant !== undefined) variant = nextOptions.variant;
            if (nextOptions.size !== undefined) size = nextOptions.size;

            sync();
        },

        destroy(): void {
            listSlot.dispose();
            detailSlot.dispose();
            emptySlot.dispose();
            restoreAttribute(list, "tabindex", originalListTabIndex);
            restoreAttribute(detail, "tabindex", originalDetailTabIndex);
        }
    };
}
