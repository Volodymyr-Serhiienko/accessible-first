import { createAttributeSnapshot } from "../../../core/src/dom";
import type { Page } from "../page";

/**
 * Page layout mode applied to a createPage() instance.
 */
export type PageLayoutMode = "app" | "document";

/**
 * Options for applyPageLayout().
 */
export interface PageLayoutOptions {
    mode?: PageLayoutMode;
    contained?: boolean;
    borders?: boolean;
    maxWidth?: string;
    gutter?: string;
    mainGap?: string;
    mainPaddingBlock?: string;
}

/**
 * Options accepted by PageLayoutController.update().
 */
export interface PageLayoutUpdateOptions extends Partial<PageLayoutOptions> {}

/**
 * Controller returned by applyPageLayout().
 */
export interface PageLayoutController {
    readonly page: Page;
    readonly element: HTMLElement;
    update(options: PageLayoutUpdateOptions): void;
    destroy(): void;
    isDestroyed(): boolean;
}

interface StyleSnapshotValue {
    value: string;
    priority: string;
}

function createStyleSnapshot() {
    const values = new Map<HTMLElement, Map<string, StyleSnapshotValue>>();

    function remember(element: HTMLElement, property: string): void {
        let elementValues = values.get(element);

        if (!elementValues) {
            elementValues = new Map();
            values.set(element, elementValues);
        }

        if (!elementValues.has(property)) {
            elementValues.set(property, {
                value: element.style.getPropertyValue(property),
                priority: element.style.getPropertyPriority(property)
            });
        }
    }

    function restore(): void {
        for (const [element, elementValues] of values) {
            for (const [property, snapshot] of elementValues) {
                if (snapshot.value) {
                    element.style.setProperty(property, snapshot.value, snapshot.priority);
                } else {
                    element.style.removeProperty(property);
                }
            }
        }

        values.clear();
    }

    return {
        remember,
        restore
    };
}

function setStyleProperty(
    snapshot: ReturnType<typeof createStyleSnapshot>,
    element: HTMLElement,
    property: string,
    value: string | null
): void {
    snapshot.remember(element, property);

    if (value === null) {
        element.style.removeProperty(property);
        return;
    }

    element.style.setProperty(property, value);
}

/**
 * Applies reusable page layout behavior to a createPage() instance.
 */
export function applyPageLayout(
    page: Page,
    options: PageLayoutOptions = {}
): PageLayoutController {
    const attributes = createAttributeSnapshot();
    const styles = createStyleSnapshot();

    attributes.remember(page.element, "data-af-page-layout");
    attributes.remember(page.element, "data-af-page-contained");
    attributes.remember(page.element, "data-af-page-borders");

    let mode: PageLayoutMode = options.mode ?? "app";
    let contained = options.contained ?? true;
    let borders = options.borders ?? true;
    let maxWidth = options.maxWidth ?? null;
    let gutter = options.gutter ?? null;
    let mainGap = options.mainGap ?? null;
    let mainPaddingBlock = options.mainPaddingBlock ?? null;
    let destroyed = false;

    function sync(): void {
        page.element.setAttribute("data-af-page-layout", mode);
        page.element.setAttribute("data-af-page-contained", String(contained));
        page.element.setAttribute("data-af-page-borders", String(borders));

        setStyleProperty(styles, page.element, "--af-page-layout-max-width", maxWidth);
        setStyleProperty(styles, page.element, "--af-page-layout-gutter", gutter);
        setStyleProperty(styles, page.element, "--af-page-main-gap", mainGap);
        setStyleProperty(styles, page.element, "--af-page-main-padding-block", mainPaddingBlock);
    }

    sync();

    return {
        page,
        element: page.element,

        update(nextOptions) {
            if (nextOptions.mode !== undefined) mode = nextOptions.mode;
            if (nextOptions.contained !== undefined) contained = nextOptions.contained;
            if (nextOptions.borders !== undefined) borders = nextOptions.borders;
            if ("maxWidth" in nextOptions) maxWidth = nextOptions.maxWidth ?? null;
            if ("gutter" in nextOptions) gutter = nextOptions.gutter ?? null;
            if ("mainGap" in nextOptions) mainGap = nextOptions.mainGap ?? null;
            if ("mainPaddingBlock" in nextOptions) {
                mainPaddingBlock = nextOptions.mainPaddingBlock ?? null;
            }

            sync();
        },

        destroy() {
            if (destroyed) return;

            destroyed = true;
            attributes.restore();
            styles.restore();
        },

        isDestroyed() {
            return destroyed;
        }
    };
}
