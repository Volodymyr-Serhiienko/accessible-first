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
import { runCleanups } from "../../../core/src/events";

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
    /**
     * Accessible group label for related actions.
     */
    label?: string | null;
    /**
     * Id of visible text that labels the related action group.
     */
    labelledBy?: string | null;
    primary?: ActionsBarCompositionContent | null;
    secondary?: ActionsBarCompositionContent | null;
    children?: ActionsBarCompositionContent;
    align?: ActionsBarAlign;
    /**
     * Lets wrapped action rows fill the available inline space while keeping
     * naturally sized actions when the whole group fits on one line.
     */
    fillOnWrap?: boolean;
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
    setLabelledBy(labelledBy: string | null): void;
    setPrimary(content: ActionsBarCompositionContent | null): void;
    setSecondary(content: ActionsBarCompositionContent | null): void;
    update(options: ActionsBarUpdateOptions): void;
    destroy(): void;
}

function getPrimaryContent(options: ActionsBarOptions): ActionsBarCompositionContent | null | undefined {
    if ("primary" in options) return options.primary;
    return options.children;
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
    let labelledBy = options.labelledBy ?? null;
    let align: ActionsBarAlign = options.align ?? "end";
    let fillOnWrap = options.fillOnWrap ?? false;
    let variant: ActionsBarVariant = options.variant ?? "default";
    let size: ActionsBarSize = options.size ?? "md";
    let hasPrimary = hasCompositionContent(getPrimaryContent(options));
    let hasSecondary = hasCompositionContent(options.secondary);
    let destroyed = false;
    let revision = 0;

    const secondaryContent = createContentSlot(secondarySlot, toCompositionChildren(options.secondary));
    const primaryContent = createContentSlot(primarySlot, toCompositionChildren(getPrimaryContent(options)));

    element.append(secondarySlot, primarySlot);

    function sync(): void {
        if (destroyed) return;
        element.setAttribute("data-af-composition", "actions-bar");
        element.setAttribute("data-af-align", align);
        if (fillOnWrap) {
            element.setAttribute("data-af-fill-on-wrap", "true");
        } else {
            element.removeAttribute("data-af-fill-on-wrap");
        }
        element.setAttribute("data-af-variant", variant);
        element.setAttribute("data-af-size", size);

        secondarySlot.setAttribute("data-af-actions-bar-secondary", "");
        primarySlot.setAttribute("data-af-actions-bar-primary", "");

        secondarySlot.hidden = !hasSecondary;
        primarySlot.hidden = !hasPrimary;

        const trimmedLabel = label?.trim() ?? "";
        const trimmedLabelledBy = labelledBy?.trim() ?? "";

        if (trimmedLabelledBy) {
            element.setAttribute("role", "group");
            element.removeAttribute("aria-label");
            element.setAttribute("aria-labelledby", trimmedLabelledBy);
        } else if (trimmedLabel) {
            element.setAttribute("role", "group");
            element.setAttribute("aria-label", trimmedLabel);
            element.removeAttribute("aria-labelledby");
        } else {
            element.removeAttribute("role");
            element.removeAttribute("aria-label");
            element.removeAttribute("aria-labelledby");
        }
    }

    function setLabel(nextLabel: string | null): void {
        update({ label: nextLabel });
    }

    function setLabelledBy(nextLabelledBy: string | null): void {
        update({ labelledBy: nextLabelledBy });
    }

    function setPrimary(content: ActionsBarCompositionContent | null): void {
        update({ primary: content });
    }

    function setSecondary(content: ActionsBarCompositionContent | null): void {
        update({ secondary: content });
    }

    function update(nextOptions: ActionsBarUpdateOptions): void {
        if (destroyed) return;
        const current = ++revision;
        applyCompositionElementOptions(element, nextOptions);

        if (nextOptions.primaryOptions !== undefined) {
            applyCompositionElementOptions(primarySlot, nextOptions.primaryOptions);
            primarySlot.setAttribute("data-af-actions-bar-primary", "");
        }

        if (nextOptions.secondaryOptions !== undefined) {
            applyCompositionElementOptions(secondarySlot, nextOptions.secondaryOptions);
            secondarySlot.setAttribute("data-af-actions-bar-secondary", "");
        }

        if ("label" in nextOptions) label = nextOptions.label ?? null;
        if ("labelledBy" in nextOptions) labelledBy = nextOptions.labelledBy ?? null;

        if (nextOptions.align !== undefined) align = nextOptions.align;
        if ("fillOnWrap" in nextOptions) {
            fillOnWrap = nextOptions.fillOnWrap ?? false;
        }
        if (nextOptions.variant !== undefined) variant = nextOptions.variant;
        if (nextOptions.size !== undefined) size = nextOptions.size;

        runCleanups([
            () => {
                if (destroyed || current !== revision || (!("primary" in nextOptions) && !("children" in nextOptions))) return;
                const content = getPrimaryContent(nextOptions);
                hasPrimary = hasCompositionContent(content);
                primaryContent.set(toCompositionChildren(content));
            },
            () => {
                if (destroyed || current !== revision || !("secondary" in nextOptions)) return;
                hasSecondary = hasCompositionContent(nextOptions.secondary);
                secondaryContent.set(toCompositionChildren(nextOptions.secondary));
            },
            sync
        ]);
    }

    function destroy(): void {
        if (destroyed) return;
        destroyed = true;
        revision += 1;
        runCleanups([secondaryContent.dispose, primaryContent.dispose]);
    }

    sync();
    return {
        element, primarySlot, secondarySlot,
        setLabel, setLabelledBy, setPrimary, setSecondary, update, destroy
    };
}
