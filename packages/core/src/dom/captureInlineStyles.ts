import type { Cleanup } from "../events";

/** Captures only borrowed inline properties and restores their values/priorities once. */
export function captureInlineStyles(element: HTMLElement, properties: readonly string[]): Cleanup {
    const style = element.style;
    const snapshot = properties.map((name) => ({
        name, value: style.getPropertyValue(name), priority: style.getPropertyPriority(name)
    }));
    let restored = false;
    return () => {
        if (restored) return;
        restored = true;
        for (const { name, value, priority } of snapshot) style.setProperty(name, value, priority);
    };
}
