import { setAriaAttribute, setAriaDisabled, setRole } from "../../../core/src/aria";
import { getOwnerWindow } from "../../../core/src/dom";
import { addEventListener } from "../../../core/src/events";
import { isEnterKey } from "../../../core/src/keyboard";
import { createComponentLifecycle } from "../foundation";
import { restoreAttribute } from "../../../core/src/dom";

import type { Link, LinkCurrent, LinkOptions, LinkTarget, LinkUpdateOptions } from "./types";

function isAnchorElement(element: HTMLElement): element is HTMLAnchorElement {
    return element.localName === "a";
}

function mergeRel(value: string | null, tokens: string[]): string {
    const currentTokens = value?.split(/\s+/).filter(Boolean) ?? [];
    return [...new Set([...currentTokens, ...tokens])].join(" ");
}

function toAriaCurrentValue(current: LinkCurrent): string | null {
    if (current === true) {
        return "page";
    }

    if (current === false || current === null) {
        return null;
    }

    return current;
}

/**
 * Enhances a native anchor or custom element with accessible link behavior.
 *
 * Native anchors keep browser navigation. Non-native elements receive link role,
 * focusability, Enter activation, and normalized navigation handling.
 */
export function createLink(
    element: HTMLElement,
    options: LinkOptions = {}
): Link {
    const lifecycle = createComponentLifecycle(element, {
        name: "link",
        initialState: options.disabled ? "disabled" : "ready"
    });

    const anchor = isAnchorElement(element) ? element : null;

    const originalRole = element.getAttribute("role");
    const originalTabIndex = element.getAttribute("tabindex");
    const originalHref = element.getAttribute("href");
    const originalTarget = element.getAttribute("target");
    const originalRel = element.getAttribute("rel");
    const originalAriaDisabled = element.getAttribute("aria-disabled");
    const originalAriaCurrent = element.getAttribute("aria-current");
    const originalVariant = element.getAttribute("data-af-variant");
    const originalSize = element.getAttribute("data-af-size");
    const originalExternal = element.getAttribute("data-af-external");
    const originalDataHref = element.getAttribute("data-af-href");

    let href = options.href !== undefined ? options.href : originalHref;
    let disabled = options.disabled ?? false;
    let external = options.external ?? false;
    let target: LinkTarget | null = options.target !== undefined ? options.target : originalTarget;
    let rel = options.rel !== undefined ? options.rel : originalRel;
    let current: LinkCurrent = options.current ?? null;
    let onNavigate = options.onNavigate ?? null;

    function getEffectiveTarget(): LinkTarget | null {
        if (target !== null) {
            return target;
        }

        return external ? "_blank" : null;
    }

    function getEffectiveRel(): string | null {
        const effectiveTarget = getEffectiveTarget();

        if (effectiveTarget === "_blank") {
            return mergeRel(rel, ["noopener", "noreferrer"]);
        }

        return rel;
    }

    function syncHref(): void {
        if (disabled || !href) {
            element.removeAttribute("href");
            element.removeAttribute("data-af-href");
            return;
        }

        if (anchor) {
            anchor.href = href;
            return;
        }

        element.setAttribute("data-af-href", href);
    }

    function syncTargetAndRel(): void {
        const effectiveTarget = getEffectiveTarget();
        const effectiveRel = getEffectiveRel();

        restoreAttribute(element, "target", effectiveTarget);
        restoreAttribute(element, "rel", effectiveRel);
    }

    function syncExternal(): void {
        if (external) {
            element.setAttribute("data-af-external", "true");
            return;
        }

        element.removeAttribute("data-af-external");
    }

    function syncCurrent(): void {
        setAriaAttribute(element, "aria-current", toAriaCurrentValue(current));
    }

    function syncTabIndex(): void {
        if (disabled) {
            element.tabIndex = -1;
            return;
        }

        if (originalTabIndex !== null) {
            element.setAttribute("tabindex", originalTabIndex);
            return;
        }

        if (!anchor) {
            element.tabIndex = 0;
            return;
        }

        element.removeAttribute("tabindex");
    }

    function syncDisabled(): void {
        lifecycle.setState(disabled ? "disabled" : "ready");
        setAriaDisabled(element, disabled ? true : null);
        syncTabIndex();
        syncHref();
    }

    function navigateNonNative(event: Event): void {
        if (anchor || event.defaultPrevented || !href) {
            return;
        }

        const win = getOwnerWindow(element);
        const effectiveTarget = getEffectiveTarget();

        if (effectiveTarget && effectiveTarget !== "_self") {
            win.open(href, effectiveTarget, "noopener,noreferrer");
            return;
        }

        win.location.href = href;
    }

    function handleClick(event: MouseEvent): void {
        if (disabled) {
            event.preventDefault();
            event.stopPropagation();
            return;
        }

        onNavigate?.(event);
        navigateNonNative(event);
    }

    function handleKeyDown(event: KeyboardEvent): void {
        if (disabled || !isEnterKey(event)) {
            return;
        }

        event.preventDefault();
        element.click();
    }

    function setHref(nextHref: string | null): void {
        if (lifecycle.isDestroyed()) return;

        href = nextHref;
        syncHref();
    }

    function setDisabled(nextDisabled: boolean): void {
        if (lifecycle.isDestroyed()) return;

        disabled = nextDisabled;
        syncDisabled();
    }

    function setExternal(nextExternal: boolean): void {
        if (lifecycle.isDestroyed()) return;

        external = nextExternal;
        syncExternal();
        syncTargetAndRel();
    }

    function setCurrent(nextCurrent: LinkCurrent): void {
        if (lifecycle.isDestroyed()) return;

        current = nextCurrent;
        syncCurrent();
    }

    if (!anchor) {
        if (!element.hasAttribute("role")) {
            setRole(element, "link");
        }

        if (!element.hasAttribute("tabindex")) {
            element.tabIndex = 0;
        }

        lifecycle.addCleanup(addEventListener<KeyboardEvent>(element, "keydown", handleKeyDown));
    }

    element.setAttribute("data-af-variant", options.variant ?? "default");
    element.setAttribute("data-af-size", options.size ?? "md");

    lifecycle.addCleanup(addEventListener<MouseEvent>(element, "click", handleClick));

    lifecycle.addCleanup(() => {
        restoreAttribute(element, "role", originalRole);
        restoreAttribute(element, "tabindex", originalTabIndex);
        restoreAttribute(element, "href", originalHref);
        restoreAttribute(element, "target", originalTarget);
        restoreAttribute(element, "rel", originalRel);
        restoreAttribute(element, "aria-disabled", originalAriaDisabled);
        restoreAttribute(element, "aria-current", originalAriaCurrent);
        restoreAttribute(element, "data-af-variant", originalVariant);
        restoreAttribute(element, "data-af-size", originalSize);
        restoreAttribute(element, "data-af-external", originalExternal);
        restoreAttribute(element, "data-af-href", originalDataHref);
    });

    syncExternal();
    syncTargetAndRel();
    syncCurrent();
    syncDisabled();

    return {
        element,

        setHref,
        getHref: () => href,

        setDisabled,
        isDisabled: () => disabled,

        setExternal,
        setCurrent,

        update(nextOptions: LinkUpdateOptions): void {
            if ("href" in nextOptions) {
                setHref(nextOptions.href ?? null);
            }

            if (nextOptions.disabled !== undefined) {
                setDisabled(nextOptions.disabled);
            }

            if (nextOptions.external !== undefined) {
                setExternal(nextOptions.external);
            }

            if ("target" in nextOptions) {
                target = nextOptions.target ?? null;
                syncTargetAndRel();
            }

            if ("rel" in nextOptions) {
                rel = nextOptions.rel ?? null;
                syncTargetAndRel();
            }

            if ("current" in nextOptions) {
                setCurrent(nextOptions.current ?? null);
            }

            if ("onNavigate" in nextOptions) {
                onNavigate = nextOptions.onNavigate ?? null;
            }

            if (nextOptions.variant !== undefined) {
                element.setAttribute("data-af-variant", nextOptions.variant);
            }

            if (nextOptions.size !== undefined) {
                element.setAttribute("data-af-size", nextOptions.size);
            }
        },

        destroy(): void {
            lifecycle.destroy();
        },

        isDestroyed(): boolean {
            return lifecycle.isDestroyed();
        }
    };
}
