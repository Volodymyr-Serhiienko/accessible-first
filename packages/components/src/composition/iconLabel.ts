import { append, collectDestroyers } from "./append";
import { toCompositionChildren } from "./content";
import { createElement } from "./createElement";
import { getCompositionElementOptions } from "./options";
import type {
    BaseCompositionOptions,
    ComposedNode,
    CompositionChild,
    CompositionContent
} from "./types";

/**
 * Position of an icon relative to its visible label.
 */
export type IconLabelIconPosition = "start" | "end" | "top" | "bottom";

/**
 * Options for IconLabel().
 *
 * Use IconLabel inside Button, Link, or Navigation labels. It controls only
 * visual composition; the parent control remains responsible for semantics
 * and interaction.
 */
export interface IconLabelOptions extends BaseCompositionOptions {
    icon: CompositionChild;
    label: CompositionContent;
    iconPosition?: IconLabelIconPosition;
}

/**
 * Creates an icon with a visible label.
 *
 * The icon is normally decorative because the adjacent label names the parent
 * button or link. Use an informative icon only when it adds distinct meaning.
 */
export function IconLabel(options: IconLabelOptions): ComposedNode<HTMLSpanElement> {
    const iconPosition = options.iconPosition ?? "start";
    const labelChildren = toCompositionChildren(options.label);
    const destroyers = collectDestroyers([
        options.icon,
        ...labelChildren
    ]);

    const element = createElement("span", getCompositionElementOptions(options, {
        "data-af-composition": "icon-label",
        "data-af-icon-label-position": iconPosition
    }));

    const icon = createElement("span", {
        attributes: {
            "data-af-icon-label-icon": ""
        }
    });

    const label = createElement("span", {
        attributes: {
            "data-af-icon-label-text": ""
        }
    });

    append(icon, options.icon);
    append(label, ...labelChildren);
    element.append(icon, label);

    return {
        element,

        destroy(): void {
            for (const destroy of [...destroyers].reverse()) {
                destroy();
            }
        }
    };
}
