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
 * Content accepted by HeaderBar slots.
 */
export type HeaderBarCompositionContent = CompositionContent;

/**
 * Visual variant for HeaderBar.
 */
export type HeaderBarVariant = "default" | "plain";

/**
 * HeaderBar size token.
 */
export type HeaderBarSize = "md";

/**
 * HeaderBar layout behavior.
 * "auto" adapts slots to available space, "inline" prefers one row, and "stacked" makes slots full-width.
 */
export type HeaderBarLayout = "auto" | "inline" | "stacked";

/**
 * Options for HeaderBar().
 */
export interface HeaderBarOptions extends BaseCompositionOptions {
    brand?: HeaderBarCompositionContent | null;
    content?: HeaderBarCompositionContent | null;
    actions?: HeaderBarCompositionContent | null;
    variant?: HeaderBarVariant;
    size?: HeaderBarSize;
    layout?: HeaderBarLayout;
    brandMaxWidth?: string | null;
    brandOptions?: BaseCompositionOptions;
    contentOptions?: BaseCompositionOptions;
    actionsOptions?: BaseCompositionOptions;
}

/**
 * Options accepted by ComposedHeaderBar.update().
 */
export interface HeaderBarUpdateOptions extends Partial<HeaderBarOptions> {}

/**
 * Header bar created by the composition API.
 */
export interface ComposedHeaderBar extends ComposedNode<HTMLElement> {
    readonly element: HTMLElement;
    readonly brandSlot: HTMLElement;
    readonly contentSlot: HTMLElement;
    readonly actionsSlot: HTMLElement;
    setBrand(content: HeaderBarCompositionContent | null): void;
    setContent(content: HeaderBarCompositionContent | null): void;
    setActions(content: HeaderBarCompositionContent | null): void;
    update(options: HeaderBarUpdateOptions): void;
    destroy(): void;
}

type HeaderBarSlotContent = Exclude<HeaderBarCompositionContent, undefined> | null;

function normalizeSlotContent(content: HeaderBarCompositionContent | null): HeaderBarSlotContent {
    return content === undefined ? null : content;
}

/**
 * Creates a responsive header layout for brand, flexible content, and actions.
 */
export function HeaderBar(options: HeaderBarOptions = {}): ComposedHeaderBar {
    const element = createElement("div", getCompositionElementOptions(options, {
        "data-af-composition": "header-bar"
    }));

    const brandSlot = createElement("div", getCompositionElementOptions(options.brandOptions, {
        "data-af-header-bar-brand": ""
    }));

    const contentSlot = createElement("div", getCompositionElementOptions(options.contentOptions, {
        "data-af-header-bar-content": ""
    }));

    const actionsSlot = createElement("div", getCompositionElementOptions(options.actionsOptions, {
        "data-af-header-bar-actions": ""
    }));

    let brandContent: HeaderBarSlotContent = normalizeSlotContent(options.brand);
    let mainContent: HeaderBarSlotContent = normalizeSlotContent(options.content);
    let actionsContent: HeaderBarSlotContent = normalizeSlotContent(options.actions);
    let variant: HeaderBarVariant = options.variant ?? "default";
    let size: HeaderBarSize = options.size ?? "md";
    let layout: HeaderBarLayout = options.layout ?? "auto";
    let brandMaxWidth = options.brandMaxWidth ?? null;

    let hasBrand = hasCompositionContent(brandContent);
    let hasContent = hasCompositionContent(mainContent);
    let hasActions = hasCompositionContent(actionsContent);

    const brandContentSlot = createContentSlot(brandSlot, toCompositionChildren(brandContent));
    const mainContentSlot = createContentSlot(contentSlot, toCompositionChildren(mainContent));
    const actionsContentSlot = createContentSlot(actionsSlot, toCompositionChildren(actionsContent));

    element.append(brandSlot, contentSlot, actionsSlot);

    function syncHeaderBarCssVariable(name: string, value: string | null): void {
        if (value === null || !value.trim()) {
            element.style.removeProperty(name);
            return;
        }

        element.style.setProperty(name, value);
    }

    function sync(): void {
        element.setAttribute("data-af-composition", "header-bar");
        element.setAttribute("data-af-variant", variant);
        element.setAttribute("data-af-size", size);
        element.setAttribute("data-af-header-bar-layout", layout);
        syncHeaderBarCssVariable("--af-header-bar-brand-width", brandMaxWidth);

        brandSlot.setAttribute("data-af-header-bar-brand", "");
        contentSlot.setAttribute("data-af-header-bar-content", "");
        actionsSlot.setAttribute("data-af-header-bar-actions", "");

        brandSlot.hidden = !hasBrand;
        contentSlot.hidden = !hasContent;
        actionsSlot.hidden = !hasActions;
    }

    function setBrand(content: HeaderBarCompositionContent | null): void {
        brandContent = normalizeSlotContent(content);
        hasBrand = hasCompositionContent(brandContent);
        brandContentSlot.set(toCompositionChildren(brandContent));
        sync();
    }

    function setContent(content: HeaderBarCompositionContent | null): void {
        mainContent = normalizeSlotContent(content);
        hasContent = hasCompositionContent(mainContent);
        mainContentSlot.set(toCompositionChildren(mainContent));
        sync();
    }

    function setActions(content: HeaderBarCompositionContent | null): void {
        actionsContent = normalizeSlotContent(content);
        hasActions = hasCompositionContent(actionsContent);
        actionsContentSlot.set(toCompositionChildren(actionsContent));
        sync();
    }

    sync();

    return {
        element,
        brandSlot,
        contentSlot,
        actionsSlot,
        setBrand,
        setContent,
        setActions,

        update(nextOptions) {
            applyCompositionElementOptions(element, nextOptions);

            if (nextOptions.brandOptions !== undefined) {
                applyCompositionElementOptions(brandSlot, nextOptions.brandOptions);
                brandSlot.setAttribute("data-af-header-bar-brand", "");
            }

            if (nextOptions.contentOptions !== undefined) {
                applyCompositionElementOptions(contentSlot, nextOptions.contentOptions);
                contentSlot.setAttribute("data-af-header-bar-content", "");
            }

            if (nextOptions.actionsOptions !== undefined) {
                applyCompositionElementOptions(actionsSlot, nextOptions.actionsOptions);
                actionsSlot.setAttribute("data-af-header-bar-actions", "");
            }

            if ("brand" in nextOptions) setBrand(nextOptions.brand ?? null);
            if ("content" in nextOptions) setContent(nextOptions.content ?? null);
            if ("actions" in nextOptions) setActions(nextOptions.actions ?? null);
            if (nextOptions.variant !== undefined) variant = nextOptions.variant;
            if (nextOptions.size !== undefined) size = nextOptions.size;
            if (nextOptions.layout !== undefined) layout = nextOptions.layout;
            if ("brandMaxWidth" in nextOptions) brandMaxWidth = nextOptions.brandMaxWidth ?? null;

            sync();
        },

        destroy() {
            brandContentSlot.dispose();
            mainContentSlot.dispose();
            actionsContentSlot.dispose();
        }
    };
}
