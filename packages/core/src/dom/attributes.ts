export interface AttributeSnapshot {
    remember(element: Element, name: string): void;
    restore(): void;
    clear(): void;
}

/**
 * Restores an attribute value previously captured with getAttribute().
 * A null value means the attribute did not exist and should be removed.
 */
export function restoreAttribute(
    element: Element,
    name: string,
    value: string | null
): void {
    if (value === null) {
        element.removeAttribute(name);
        return;
    }

    element.setAttribute(name, value);
}

/**
 * Remembers original attribute values once and restores them together.
 * Useful for behaviors that temporarily write ARIA roles, states, or ids.
 */
export function createAttributeSnapshot(): AttributeSnapshot {
    const values = new Map<Element, Map<string, string | null>>();

    function remember(element: Element, name: string): void {
        let attributes = values.get(element);

        if (!attributes) {
            attributes = new Map<string, string | null>();
            values.set(element, attributes);
        }

        if (!attributes.has(name)) {
            attributes.set(name, element.getAttribute(name));
        }
    }

    function clear(): void {
        values.clear();
    }

    function restore(): void {
        for (const [element, attributes] of values) {
            for (const [name, value] of attributes) {
                restoreAttribute(element, name, value);
            }
        }

        clear();
    }

    return {
        remember,
        restore,
        clear
    };
}
