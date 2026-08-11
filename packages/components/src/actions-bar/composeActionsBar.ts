import {
    applyCompositionElementOptions,
    createContentSlot,
    createElement,
    getCompositionElementOptions,
    toCompositionChildren,
    type BaseCompositionOptions,
    type ComposedNode,
    type CompositionContent
} from "../composition";

/**
 * Content accepted by ActionsBar slots.
 */
export type ActionsBarCompositionContent = CompositionContent;

/**
 * Alignment mode for action groups.
 */
export type ActionsBarAlign = "start" | "end" | "between" | "stretch";

/**
 * Visual variant for ActionsBar.
 */
export type ActionsBarVariant = "default" | "plain";

/**
 * ActionsBar size token.
 */
export type ActionsBarSize = "md";

/**
 * Options for ActionsBar().
 */
export interface ActionsBarOptions extends BaseCompositionOptions {
    label?: string | null;
    primary?: ActionsBarCompositionContent | null;
    secondary?: ActionsBarCompositionContent | null;
    children?: ActionsBarCompositionContent;
    align?: ActionsBarAlign;
    variant?: ActionsBarVariant;
    size?: ActionsBarSize;
    primaryOptions?: BaseCompositionOptions;
    secondaryOptions?: BaseCompositionOptions;
}

/**
 * Options accepted by ComposedActionsBar.update().
 */
export interface ActionsBarUpdateOptions extends Partial<ActionsBarOptions> {}

/**
 * Actions bar created by the composition API.
 */
export interface ComposedActionsBar extends ComposedNode<HTMLElement> {
    readonly element: HTMLElement;
    readonly primarySlot: HTMLElement;
    readonly secondarySlot: HTMLElement;
    setLabel(label: string | null): void;
    setPrimary(content: ActionsBarCompositionContent | null): void;
    setSecondary(content: ActionsBarCompositionContent | null): void;
    update(options: ActionsBarUpdateOptions): void;
    destroy(): void;
}

function getPrimaryContent(options: ActionsBarOptions): ActionsBarCompositionContent | null | undefined {
    if ("primary" in options) return options.primary;
    return options.children;
}

function hasSlotContent(content: ActionsBarCompositionContent | null | undefined): boolean {
    return toCompositionChildren(content).some((child) => (
        child !== null
        && child !== undefined
        && child !== false
    ));
}

/**
 * Creates a consistent layout container for related command actions.
 */
export function ActionsBar(options: ActionsBarOptions = {}): ComposedActionsBar {
    const element = createElement("div", getCompositionElementOptions(options, {
        "data-af-composition": "actions-bar"
    }));

    const secondarySlot = createElement("div", getCompositionElementOptions(options.secondaryOptions, {
        "data-af-actions-bar-secondary": ""
    }));

    const primarySlot = createElement("div", getCompositionElementOptions(options.primaryOptions, {
        "data-af-actions-bar-primary": ""
    }));

    let label = options.label ?? null;
    let align: ActionsBarAlign = options.align ?? "end";
    let variant: ActionsBarVariant = options.variant ?? "default";
    let size: ActionsBarSize = options.size ?? "md";
    let hasPrimary = hasSlotContent(getPrimaryContent(options));
    let hasSecondary = hasSlotContent(options.secondary);

    const secondaryContent = createContentSlot(secondarySlot, toCompositionChildren(options.secondary));
    const primaryContent = createContentSlot(primarySlot, toCompositionChildren(getPrimaryContent(options)));

    element.append(secondarySlot, primarySlot);

    function sync(): void {
        element.setAttribute("data-af-composition", "actions-bar");
        element.setAttribute("data-af-align", align);
        element.setAttribute("data-af-variant", variant);
        element.setAttribute("data-af-size", size);

        secondarySlot.setAttribute("data-af-actions-bar-secondary", "");
        primarySlot.setAttribute("data-af-actions-bar-primary", "");

        secondarySlot.hidden = !hasSecondary;
        primarySlot.hidden = !hasPrimary;

        if (label && label.trim()) {
            element.setAttribute("role", "group");
            element.setAttribute("aria-label", label);
        } else {
            element.removeAttribute("role");
            element.removeAttribute("aria-label");
        }
    }

    function setLabel(nextLabel: string | null): void {
        label = nextLabel;
        sync();
    }

    function setPrimary(content: ActionsBarCompositionContent | null): void {
        hasPrimary = hasSlotContent(content);
        primaryContent.set(toCompositionChildren(content));
        sync();
    }

    function setSecondary(content: ActionsBarCompositionContent | null): void {
        hasSecondary = hasSlotContent(content);
        secondaryContent.set(toCompositionChildren(content));
        sync();
    }

    sync();

    return {
        element,
        primarySlot,
        secondarySlot,
        setLabel,
        setPrimary,
        setSecondary,

        update(nextOptions): void {
            applyCompositionElementOptions(element, nextOptions);

            if (nextOptions.primaryOptions !== undefined) {
                applyCompositionElementOptions(primarySlot, nextOptions.primaryOptions);
                primarySlot.setAttribute("data-af-actions-bar-primary", "");
            }

            if (nextOptions.secondaryOptions !== undefined) {
                applyCompositionElementOptions(secondarySlot, nextOptions.secondaryOptions);
                secondarySlot.setAttribute("data-af-actions-bar-secondary", "");
            }

            if ("label" in nextOptions) setLabel(nextOptions.label ?? null);

            if ("primary" in nextOptions) {
                setPrimary(nextOptions.primary ?? null);
            } else if ("children" in nextOptions) {
                setPrimary(nextOptions.children ?? null);
            }

            if ("secondary" in nextOptions) setSecondary(nextOptions.secondary ?? null);

            if (nextOptions.align !== undefined) align = nextOptions.align;
            if (nextOptions.variant !== undefined) variant = nextOptions.variant;
            if (nextOptions.size !== undefined) size = nextOptions.size;

            sync();
        },

        destroy(): void {
            secondaryContent.dispose();
            primaryContent.dispose();
        }
    };
}
