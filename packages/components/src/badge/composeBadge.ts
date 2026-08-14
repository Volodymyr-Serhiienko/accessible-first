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
    type CompositionChild,
    type CompositionContent
} from "../composition";

/**
 * Content accepted by Badge slots.
 */
export type BadgeCompositionContent = CompositionContent;

/**
 * Visual color variant for Badge.
 */
export type BadgeVariant = "neutral" | "info" | "success" | "warning" | "danger";

/**
 * Badge size token.
 */
export type BadgeSize = "md";

/**
 * Position of the optional badge icon.
 */
export type BadgeIconPosition = "start" | "end";

/**
 * Options for Badge().
 */
export interface BadgeOptions extends BaseCompositionOptions {
    text?: string;
    children?: CompositionChild[];
    icon?: BadgeCompositionContent | null;
    iconPosition?: BadgeIconPosition;
    variant?: BadgeVariant;
    size?: BadgeSize;
    accessibleLabel?: string | null;
    iconOptions?: BaseCompositionOptions;
    contentOptions?: BaseCompositionOptions;
}

/**
 * Options accepted by ComposedBadge.update().
 */
export interface BadgeUpdateOptions extends Partial<BadgeOptions> {}

/**
 * Badge created by the composition API.
 */
export interface ComposedBadge extends ComposedNode<HTMLSpanElement> {
    readonly element: HTMLSpanElement;
    readonly icon: HTMLElement;
    readonly content: HTMLElement;
    readonly accessibleLabel: HTMLElement;
    getText(): string;
    setText(text: string): void;
    setContent(content: BadgeCompositionContent | null): void;
    setIcon(content: BadgeCompositionContent | null): void;
    setAccessibleLabel(label: string | null): void;
    update(options: BadgeUpdateOptions): void;
    destroy(): void;
}

type BadgeSlotContent = Exclude<BadgeCompositionContent, undefined> | null;

function normalizeSlotContent(content: BadgeCompositionContent | null): BadgeSlotContent {
    return content === undefined ? null : content;
}

function getInitialContent(options: BadgeOptions): CompositionChild[] {
    if (options.children !== undefined) return options.children;
    if (options.text !== undefined) return [options.text];

    return [];
}

function getTrimmedLabel(label: string | null): string | null {
    const value = label?.trim() ?? "";

    return value ? value : null;
}

/**
 * Creates a compact static label for status, category, count, or metadata.
 */
export function Badge(options: BadgeOptions = {}): ComposedBadge {
    const element = createElement("span", getCompositionElementOptions(options, {
        "data-af-composition": "badge"
    }));

    const icon = createElement("span", getCompositionElementOptions(options.iconOptions, {
        "data-af-badge-icon": "",
        "aria-hidden": "true"
    }));

    const content = createElement("span", getCompositionElementOptions(options.contentOptions, {
        "data-af-badge-content": ""
    }));

    const accessibleLabelElement = createElement("span", {
        attributes: {
            "data-af-badge-accessible-label": "",
            "data-af-composition": "visually-hidden"
        }
    });

    let variant: BadgeVariant = options.variant ?? "neutral";
    let size: BadgeSize = options.size ?? "md";
    let iconPosition: BadgeIconPosition = options.iconPosition ?? "start";
    let iconContent: BadgeSlotContent = normalizeSlotContent(options.icon);
    let accessibleLabel = getTrimmedLabel(options.accessibleLabel ?? null);
    let hasIcon = hasCompositionContent(iconContent);

    const iconSlot = createContentSlot(icon, toCompositionChildren(iconContent));
    const contentSlot = createContentSlot(content, getInitialContent(options));

    element.append(icon, content, accessibleLabelElement);

    function sync(): void {
        element.setAttribute("data-af-composition", "badge");
        element.setAttribute("data-af-variant", variant);
        element.setAttribute("data-af-size", size);
        element.setAttribute("data-af-icon-position", iconPosition);

        icon.setAttribute("data-af-badge-icon", "");
        icon.setAttribute("aria-hidden", "true");
        content.setAttribute("data-af-badge-content", "");
        accessibleLabelElement.setAttribute("data-af-badge-accessible-label", "");
        accessibleLabelElement.setAttribute("data-af-composition", "visually-hidden");

        icon.hidden = !hasIcon;

        if (accessibleLabel) {
            accessibleLabelElement.textContent = accessibleLabel;
            accessibleLabelElement.hidden = false;
            setElementAttributeValue(content, "aria-hidden", true);
        } else {
            accessibleLabelElement.textContent = "";
            accessibleLabelElement.hidden = true;
            setElementAttributeValue(content, "aria-hidden", null);
        }
    }

    function setText(text: string): void {
        contentSlot.set([text]);
        sync();
    }

    function setContent(nextContent: BadgeCompositionContent | null): void {
        contentSlot.set(toCompositionChildren(normalizeSlotContent(nextContent)));
        sync();
    }

    function setIcon(nextContent: BadgeCompositionContent | null): void {
        iconContent = normalizeSlotContent(nextContent);
        hasIcon = hasCompositionContent(iconContent);
        iconSlot.set(toCompositionChildren(iconContent));
        sync();
    }

    function setAccessibleLabel(label: string | null): void {
        accessibleLabel = getTrimmedLabel(label);
        sync();
    }

    sync();

    return {
        element,
        icon,
        content,
        accessibleLabel: accessibleLabelElement,

        getText(): string {
            return getElementText(content);
        },

        setText,
        setContent,
        setIcon,
        setAccessibleLabel,

        update(nextOptions): void {
            applyCompositionElementOptions(element, nextOptions);

            if (nextOptions.iconOptions !== undefined) {
                applyCompositionElementOptions(icon, nextOptions.iconOptions);
            }

            if (nextOptions.contentOptions !== undefined) {
                applyCompositionElementOptions(content, nextOptions.contentOptions);
            }

            if (nextOptions.children !== undefined) {
                setContent(nextOptions.children);
            } else if (nextOptions.text !== undefined) {
                setText(nextOptions.text);
            }

            if ("icon" in nextOptions) setIcon(nextOptions.icon ?? null);
            if ("accessibleLabel" in nextOptions) setAccessibleLabel(nextOptions.accessibleLabel ?? null);
            if (nextOptions.iconPosition !== undefined) iconPosition = nextOptions.iconPosition;
            if (nextOptions.variant !== undefined) variant = nextOptions.variant;
            if (nextOptions.size !== undefined) size = nextOptions.size;

            sync();
        },

        destroy(): void {
            iconSlot.dispose();
            contentSlot.dispose();
        }
    };
}
