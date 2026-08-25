import { createId } from "../../../core/src/id";
import { Button, type ButtonCompositionOptions, type ComposedButton } from "../button";
import {
    append,
    applyCompositionElementOptions,
    collectDestroyers,
    createElement,
    getCompositionElementOptions,
    Icon,
    type BaseCompositionOptions,
    type ComposedNode,
    type CompositionChild,
    type CompositionContent
} from "../composition";
import {
    accessibleFirstEnglishMessages,
    getLocaleText,
    type LocaleTextProvider
} from "../localization";
import { createPopover, type PopoverInstance, type PopoverOptions } from "../popover";
import {
    IconButton,
    type ComposedIconButton,
    type IconButtonCompositionOptions
} from "../icon-button";

/**
 * Current layout placement chosen by HeaderTools().
 */
export type HeaderToolsPlacement = "inline" | "menu";

/**
 * Localized message keys used by HeaderTools fallback text.
 */
export type HeaderToolsMessageKey =
    | "headerTools.closeText"
    | "headerTools.description"
    | "headerTools.hint"
    | "headerTools.title"
    | "headerTools.trigger";

/**
 * Localization provider accepted by HeaderTools.
 */
export type HeaderToolsLocalization = LocaleTextProvider<HeaderToolsMessageKey>;

/**
 * Content accepted by HeaderTools slots.
 */
export type HeaderToolsCompositionContent = CompositionContent;

/**
 * Options for HeaderTools().
 */
export interface HeaderToolsOptions extends BaseCompositionOptions {
    /** Controls that move between inline header placement and the overflow panel. */
    controls: CompositionChild[];
    /** Locale provider for framework-owned trigger, panel, and close labels. */
    locale?: HeaderToolsLocalization | null;
    /** Accessible name for the overflow trigger. Defaults to localized framework text. */
    triggerLabel?: string | null;
    /** Hint exposed through IconButton tooltip/description behavior. */
    triggerHint?: string | null;
    /** Icon content for the overflow trigger. Defaults to a settings-style icon. */
    triggerIcon?: HeaderToolsCompositionContent | null;
    /** Visible and accessible panel title. Defaults to localized framework text. */
    title?: string | null;
    /** Visible and announced panel description. Defaults to localized framework text. */
    description?: string | null;
    /** Text for the explicit close action. Set null to hide the close action. */
    closeText?: string | null;
    /** Element used for overflow measurement. Defaults to the closest HeaderBar. */
    container?: HTMLElement | null;
    /** Extra inline width required before moving controls back out of the menu. */
    inlineProbeDelta?: number;
    /** Advanced DOM options for the inline controls slot. */
    inlineOptions?: BaseCompositionOptions;
    /** Advanced DOM options for the overflow menu root. */
    menuOptions?: BaseCompositionOptions;
    /** Advanced DOM options for the overflow popover panel. */
    panelOptions?: BaseCompositionOptions;
    /** Advanced DOM options for the panel controls slot. */
    controlsOptions?: BaseCompositionOptions;
    /** Advanced DOM options for the panel footer slot. */
    footerOptions?: BaseCompositionOptions;
    /** Options forwarded to the internal IconButton trigger. */
    triggerOptions?: Partial<IconButtonCompositionOptions>;
    /** Options forwarded to the internal close Button. */
    closeButtonOptions?: Partial<ButtonCompositionOptions>;
}

/**
 * Options accepted by ComposedHeaderTools.update().
 */
export interface HeaderToolsUpdateOptions extends Partial<HeaderToolsOptions> {}

/**
 * Header tools overflow controller created by HeaderTools().
 */
export interface ComposedHeaderTools extends ComposedNode<HTMLElement> {
    readonly element: HTMLElement;
    readonly inline: HTMLElement;
    readonly menu: HTMLElement;
    readonly trigger: ComposedIconButton;
    readonly panel: HTMLElement;
    readonly controls: HTMLElement;
    readonly closeButton: ComposedButton;
    getPlacement(): HeaderToolsPlacement;
    checkPlacement(): void;
    update(options: HeaderToolsUpdateOptions): void;
    destroy(): void;
}

const DEFAULT_ICON_PATH = "M19.4 13.5c.1-.5.1-1 .1-1.5s0-1-.1-1.5l2-1.5-2-3.5-2.4 1a7.7 7.7 0 0 0-2.6-1.5L14 2h-4l-.4 2.5A7.7 7.7 0 0 0 7 6L4.6 5 2.6 8.5l2 1.5c-.1.5-.1 1-.1 1.5s0 1 .1 1.5l-2 1.5 2 3.5 2.4-1a7.7 7.7 0 0 0 2.6 1.5L10 22h4l.4-2.5A7.7 7.7 0 0 0 17 18l2.4 1 2-3.5-2-1.5ZM12 15.5A3.5 3.5 0 1 1 12 8a3.5 3.5 0 0 1 0 7.5Z";

function isNode(value: EventTarget | null): value is Node {
    return typeof value === "object" && value !== null && "nodeType" in value;
}

function isBoxVisible(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();

    return rect.width > 0 || rect.height > 0;
}

function getElementChildren(element: HTMLElement): HTMLElement[] {
    return Array.from(element.children)
        .filter((child): child is HTMLElement => child instanceof HTMLElement && !child.hidden);
}

function getDefaultContainer(element: HTMLElement): HTMLElement | null {
    return element.closest<HTMLElement>('[data-af-composition="header-bar"]');
}

function getBrandSlot(container: HTMLElement): HTMLElement | null {
    return container.querySelector<HTMLElement>('[data-af-header-bar-brand]:not([hidden])');
}

function getLocaleMessage(
    locale: HeaderToolsLocalization | null,
    key: HeaderToolsMessageKey
): string {
    return getLocaleText(locale, key, accessibleFirstEnglishMessages[key]);
}

function getTriggerLabel(options: HeaderToolsOptions, locale: HeaderToolsLocalization | null): string {
    return options.triggerLabel ?? getLocaleMessage(locale, "headerTools.trigger");
}

function getTriggerHint(options: HeaderToolsOptions, locale: HeaderToolsLocalization | null): string {
    return options.triggerHint ?? getLocaleMessage(locale, "headerTools.hint");
}

function getTitle(options: HeaderToolsOptions, locale: HeaderToolsLocalization | null): string {
    return options.title ?? getLocaleMessage(locale, "headerTools.title");
}

function getDescription(options: HeaderToolsOptions, locale: HeaderToolsLocalization | null): string | null {
    return options.description ?? getLocaleMessage(locale, "headerTools.description");
}

function getCloseText(options: HeaderToolsOptions, locale: HeaderToolsLocalization | null): string | null {
    return options.closeText ?? getLocaleMessage(locale, "headerTools.closeText");
}

function getDefaultTriggerIcon(): CompositionChild {
    return Icon({
        path: DEFAULT_ICON_PATH,
        variant: "outline"
    });
}

function getTriggerIcon(options: HeaderToolsOptions): CompositionChild[] {
    if (!("triggerIcon" in options)) return [getDefaultTriggerIcon()];

    const content = options.triggerIcon;

    if (content === null || content === undefined) return [];

    return Array.isArray(content) ? [...content] : [content];
}

function isInlineOverflowing(container: HTMLElement, inlineHost: HTMLElement): boolean {
    const controls = getElementChildren(inlineHost).filter(isBoxVisible);

    if (controls.length === 0) return false;

    const tolerance = 1;
    const containerRect = container.getBoundingClientRect();
    const brandRect = getBrandSlot(container)?.getBoundingClientRect() ?? null;

    if (brandRect) {
        return controls.some((control) => {
            const rect = control.getBoundingClientRect();

            return rect.left < containerRect.left - tolerance
                || rect.right > containerRect.right + tolerance
                || rect.top > brandRect.bottom - tolerance;
        });
    }

    const firstTop = controls[0]?.getBoundingClientRect().top ?? containerRect.top;

    return controls.some((control) => {
        const rect = control.getBoundingClientRect();

        return rect.left < containerRect.left - tolerance
            || rect.right > containerRect.right + tolerance
            || Math.abs(rect.top - firstTop) > tolerance;
    });
}

function getContainerInlineSize(container: HTMLElement): number {
    return container.getBoundingClientRect().width;
}

function applyInternalOptions(element: HTMLElement, options: BaseCompositionOptions | undefined, marker: string): void {
    applyCompositionElementOptions(element, options);
    element.setAttribute(marker, "");
}

/**
 * Creates adaptive header actions that stay inline while they fit and move into a popover when they wrap.
 */
export function HeaderTools(options: HeaderToolsOptions): ComposedHeaderTools {
    let currentOptions: HeaderToolsOptions = options;
    let locale: HeaderToolsLocalization | null = options.locale ?? null;
    let controls = [...options.controls];
    let controlDestroyers = collectDestroyers(controls);
    let placement: HeaderToolsPlacement = "inline";
    let currentHost: HTMLElement | null = null;
    let pendingPlacementFrame: number | null = null;
    let observedContainer: HTMLElement | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let lastOverflowInlineSize = 0;
    let destroyed = false;
    let unsubscribeLocale: (() => void) | null = null;

    const titleId = options.panelOptions?.id
        ? `${options.panelOptions.id}-title`
        : createId("af-header-tools-title");
    const descriptionId = createId("af-header-tools-description");
    const panelId = options.panelOptions?.id ?? createId("af-header-tools-panel");

    const element = createElement("div", getCompositionElementOptions(options, {
        "data-af-composition": "header-tools",
        "data-af-header-tools-placement": placement
    }));

    const inline = createElement("div", getCompositionElementOptions(options.inlineOptions, {
        "data-af-header-tools-inline": ""
    }));

    const menu = createElement("div", getCompositionElementOptions(options.menuOptions, {
        "data-af-header-tools-menu": ""
    }));

    const title = createElement("h2", {
        id: titleId,
        attributes: {
            "data-af-header-tools-title": ""
        }
    });

    const description = createElement("p", {
        id: descriptionId,
        attributes: {
            "data-af-header-tools-description": ""
        }
    });

    const controlsSlot = createElement("div", getCompositionElementOptions(options.controlsOptions, {
        "data-af-header-tools-controls": ""
    }));

    let popover: PopoverInstance;
    let composed!: ComposedHeaderTools;

    function restoreTriggerFocus(): void {
        window.setTimeout(() => {
            if (trigger.element.isConnected) {
                trigger.element.focus({ preventScroll: true });
            }
        }, 0);
    }

    function schedulePlacementCheck(): void {
        if (destroyed || pendingPlacementFrame !== null) return;

        pendingPlacementFrame = window.requestAnimationFrame(() => {
            pendingPlacementFrame = null;
            checkPlacement();
        });
    }

    const closeButton = Button({
        ...(options.closeButtonOptions ?? {}),
        text: getCloseText(currentOptions, locale) ?? "",
        variant: options.closeButtonOptions?.variant ?? "secondary",
        onPress(event, button) {
            options.closeButtonOptions?.onPress?.(event, button);
            popover.close();
            restoreTriggerFocus();
            schedulePlacementCheck();
        }
    });

    const footer = createElement("div", getCompositionElementOptions(options.footerOptions, {
        "data-af-header-tools-footer": ""
    }));

    footer.append(closeButton.element);

    const body = createElement("div", {
        attributes: {
            "data-af-header-tools-body": ""
        },
        children: [controlsSlot, footer]
    });

    const panel = createElement("div", getCompositionElementOptions(options.panelOptions, {
        id: panelId,
        "data-af-popover-content": "",
        "data-af-header-tools-panel": ""
    }, [title, description, body]));

    const trigger = IconButton({
        ...(options.triggerOptions ?? {}),
        label: getTriggerLabel(currentOptions, locale),
        hint: getTriggerHint(currentOptions, locale),
        hintDisplay: options.triggerOptions?.hintDisplay ?? "both",
        icon: undefined,
        children: getTriggerIcon(currentOptions),
        variant: options.triggerOptions?.variant ?? "secondary"
    });

    menu.append(trigger.element, panel);
    element.append(inline, menu);

    function getContainer(): HTMLElement | null {
        return currentOptions.container ?? getDefaultContainer(element);
    }

    function syncText(): void {
        const nextTitle = getTitle(currentOptions, locale);
        const nextDescription = getDescription(currentOptions, locale)?.trim() ?? "";
        const nextCloseText = getCloseText(currentOptions, locale);

        title.textContent = nextTitle;
        description.textContent = nextDescription;
        description.hidden = !nextDescription;
        closeButton.update({
            text: nextCloseText ?? ""
        });
        closeButton.element.hidden = nextCloseText === null;
        footer.hidden = nextCloseText === null;

        trigger.update({
            label: getTriggerLabel(currentOptions, locale),
            hint: getTriggerHint(currentOptions, locale),
            children: getTriggerIcon(currentOptions)
        });

        popover.update({
            labelledBy: title.id,
            describedBy: nextDescription ? description.id : null,
            announcement: {
                message: nextDescription ? `${nextTitle}. ${nextDescription}` : nextTitle,
                politeness: "polite"
            }
        });
    }

    function syncLocaleSubscription(): void {
        unsubscribeLocale?.();
        unsubscribeLocale = null;

        if (!locale?.subscribe) return;

        unsubscribeLocale = locale.subscribe(() => {
            syncText();
            schedulePlacementCheck();
        });
    }

    function focusStaysInsidePanel(): boolean {
        const activeElement = panel.ownerDocument.activeElement;

        return isNode(activeElement) && (
            panel.contains(activeElement)
            || trigger.element.contains(activeElement)
        );
    }

    function handlePanelFocusOut(): void {
        window.setTimeout(() => {
            if (!popover.isOpen() || focusStaysInsidePanel()) return;

            popover.close();
        }, 0);
    }

    function moveControls(host: HTMLElement): void {
        if (currentHost === host) return;

        inline.replaceChildren();
        controlsSlot.replaceChildren();
        append(host, ...controls);
        currentHost = host;
    }

    function setPlacement(nextPlacement: HeaderToolsPlacement): void {
        placement = nextPlacement;
        element.setAttribute("data-af-header-tools-placement", placement);

        if (placement === "menu") {
            inline.hidden = true;
            menu.hidden = false;
            moveControls(controlsSlot);
            return;
        }

        popover.close();
        menu.hidden = true;
        inline.hidden = false;
        moveControls(inline);
    }

    function shouldProbeInline(container: HTMLElement): boolean {
        if (placement === "inline") return true;
        if (lastOverflowInlineSize === 0) return true;

        return getContainerInlineSize(container) > lastOverflowInlineSize + (currentOptions.inlineProbeDelta ?? 16);
    }

    function observeContainer(container: HTMLElement): void {
        if (observedContainer === container) return;

        resizeObserver?.disconnect();
        observedContainer = container;

        if (typeof ResizeObserver === "undefined") return;

        resizeObserver = new ResizeObserver(() => {
            schedulePlacementCheck();
        });
        resizeObserver.observe(container);
    }

    function checkPlacement(): void {
        if (destroyed) return;

        const container = getContainer();

        if (!container) {
            schedulePlacementCheck();
            return;
        }

        observeContainer(container);

        if (popover.isOpen() || !shouldProbeInline(container)) {
            return;
        }

        const previousVisibility = inline.style.visibility;

        if (placement === "menu") {
            inline.style.visibility = "hidden";
        }

        setPlacement("inline");

        const overflowing = isInlineOverflowing(container, inline);

        inline.style.visibility = previousVisibility;

        if (overflowing) {
            lastOverflowInlineSize = getContainerInlineSize(container);
            setPlacement("menu");
            return;
        }

        lastOverflowInlineSize = 0;
    }

    function handleWindowResize(): void {
        schedulePlacementCheck();
    }

    function resetControls(nextControls: CompositionChild[]): void {
        for (const destroy of [...controlDestroyers].reverse()) {
            destroy();
        }

        controls = [...nextControls];
        controlDestroyers = collectDestroyers(controls);
        currentHost = null;
        setPlacement(placement);
        schedulePlacementCheck();
    }

    popover = createPopover(panel, {
        trigger: trigger.element,
        contentId: panel.id,
        role: "dialog",
        hasPopup: "dialog",
        labelledBy: title.id,
        describedBy: description.id,
        side: "bottom",
        alignment: "end",
        offset: 8,
        collisionPadding: 8,
        flip: true,
        shift: true,
        dismissOnFocusOutside: true,
        restoreFocus: true,
        closeOnAnchorHidden: true,
        announcement: {
            message: "",
            politeness: "polite"
        },
        onOpenChange(detail) {
            if (!detail.open) {
                schedulePlacementCheck();
            }
        }
    } satisfies PopoverOptions);

    panel.addEventListener("focusout", handlePanelFocusOut);
    window.addEventListener("resize", handleWindowResize);
    window.addEventListener("orientationchange", handleWindowResize);

    syncText();
    syncLocaleSubscription();
    setPlacement("inline");
    schedulePlacementCheck();
    document.fonts?.ready.then(schedulePlacementCheck).catch(() => undefined);

    composed = {
        element,
        inline,
        menu,
        trigger,
        panel,
        controls: controlsSlot,
        closeButton,

        getPlacement(): HeaderToolsPlacement {
            return placement;
        },

        checkPlacement,

        update(nextOptions): void {
            currentOptions = {
                ...currentOptions,
                ...nextOptions
            };

            applyCompositionElementOptions(element, nextOptions);
            element.setAttribute("data-af-composition", "header-tools");
            element.setAttribute("data-af-header-tools-placement", placement);

            if (nextOptions.inlineOptions !== undefined) {
                applyInternalOptions(inline, nextOptions.inlineOptions, "data-af-header-tools-inline");
            }

            if (nextOptions.menuOptions !== undefined) {
                applyInternalOptions(menu, nextOptions.menuOptions, "data-af-header-tools-menu");
            }

            if (nextOptions.panelOptions !== undefined) {
                applyInternalOptions(panel, nextOptions.panelOptions, "data-af-header-tools-panel");
                panel.setAttribute("data-af-popover-content", "");
            }

            if (nextOptions.controlsOptions !== undefined) {
                applyInternalOptions(controlsSlot, nextOptions.controlsOptions, "data-af-header-tools-controls");
            }

            if (nextOptions.footerOptions !== undefined) {
                applyInternalOptions(footer, nextOptions.footerOptions, "data-af-header-tools-footer");
            }

            if (nextOptions.triggerOptions !== undefined) {
                trigger.update(nextOptions.triggerOptions);
            }

            if (nextOptions.closeButtonOptions !== undefined) {
                closeButton.update(nextOptions.closeButtonOptions);
            }

            if ("locale" in nextOptions) {
                locale = nextOptions.locale ?? null;
                syncLocaleSubscription();
            }

            if (nextOptions.controls !== undefined) {
                resetControls(nextOptions.controls);
            }

            syncText();
            schedulePlacementCheck();
        },

        destroy(): void {
            if (destroyed) return;

            destroyed = true;

            if (pendingPlacementFrame !== null) {
                window.cancelAnimationFrame(pendingPlacementFrame);
                pendingPlacementFrame = null;
            }

            resizeObserver?.disconnect();
            unsubscribeLocale?.();
            window.removeEventListener("resize", handleWindowResize);
            window.removeEventListener("orientationchange", handleWindowResize);
            panel.removeEventListener("focusout", handlePanelFocusOut);
            popover.destroy();
            closeButton.destroy();
            trigger.destroy();

            for (const destroy of [...controlDestroyers].reverse()) {
                destroy();
            }
        }
    };

    return composed;
}
