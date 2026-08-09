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
import { createTooltip, type Tooltip as TooltipInstance } from "./createTooltip";

/**
 * Content accepted by Tooltip trigger slot.
 */
export type TooltipCompositionContent = CompositionContent;

/**
 * Options for Tooltip(), the composition API for short helper text.
 */
export interface TooltipCompositionOptions extends BaseCompositionOptions {
    trigger: TooltipCompositionContent;
    text: string | null;
    describe?: boolean;
    announceOnHover?: boolean;
}

/**
 * Options accepted by ComposedTooltip.update().
 */
export interface TooltipCompositionUpdateOptions extends Partial<TooltipCompositionOptions> {}

/**
 * Tooltip created by the composition API.
 */
export interface ComposedTooltip extends ComposedNode<HTMLElement> {
    readonly target: HTMLElement;
    setText(text: string | null): void;
    getText(): string | null;
    setDescribe(describe: boolean): void;
    setAnnounceOnHover(announceOnHover: boolean): void;
    update(options: TooltipCompositionUpdateOptions): void;
    destroy(): void;
}

function getTooltipTarget(container: HTMLElement): HTMLElement {
    const firstElement = container.firstElementChild;

    return firstElement instanceof HTMLElement ? firstElement : container;
}

/**
 * Creates a tooltip around composed trigger content.
 */
export function Tooltip(options: TooltipCompositionOptions): ComposedTooltip {
    const element = createElement("span", getCompositionElementOptions(options, {
        "data-af-composition": "tooltip"
    }));

    const triggerSlot = createContentSlot(element, toCompositionChildren(options.trigger));

    let text = options.text;
    let describe = options.describe ?? true;
    let announceOnHover = options.announceOnHover ?? false;
    let target = getTooltipTarget(element);
    let tooltip: TooltipInstance = createTooltip(target, {
        text,
        describe,
        announceOnHover
    });

    function recreateTooltip(): void {
        tooltip.destroy();
        target = getTooltipTarget(element);
        tooltip = createTooltip(target, {
            text,
            describe,
            announceOnHover
        });
    }

    function setText(nextText: string | null): void {
        text = nextText;
        tooltip.setText(nextText);
    }

    function setDescribe(nextDescribe: boolean): void {
        describe = nextDescribe;
        tooltip.setDescribe(nextDescribe);
    }

    function setAnnounceOnHover(nextAnnounceOnHover: boolean): void {
        announceOnHover = nextAnnounceOnHover;
        tooltip.setAnnounceOnHover(nextAnnounceOnHover);
    }

    return {
        element,

        get target(): HTMLElement {
            return target;
        },

        setText,
        getText: () => tooltip.getText(),
        setDescribe,
        setAnnounceOnHover,

        update(nextOptions: TooltipCompositionUpdateOptions): void {
            applyCompositionElementOptions(element, nextOptions);

            if ("text" in nextOptions) {
                text = nextOptions.text ?? null;
            }

            if (nextOptions.describe !== undefined) {
                describe = nextOptions.describe;
            }

            if (nextOptions.announceOnHover !== undefined) {
                announceOnHover = nextOptions.announceOnHover;
            }

            if (nextOptions.trigger !== undefined) {
                triggerSlot.set(toCompositionChildren(nextOptions.trigger));
                recreateTooltip();
                return;
            }

            tooltip.setText(text);
            tooltip.setDescribe(describe);
            tooltip.setAnnounceOnHover(announceOnHover);
        },

        destroy(): void {
            tooltip.destroy();
            triggerSlot.dispose();
        }
    };
}
