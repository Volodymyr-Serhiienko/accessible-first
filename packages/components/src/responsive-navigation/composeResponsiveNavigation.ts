import {
    applyCompositionElementOptions,
    createElement,
    getCompositionElementOptions,
    type BaseCompositionOptions,
    type ComposedNode,
    toCompositionChildren,
    type CompositionContent
} from "../composition";
import { Button, type ComposedButton } from "../button";
import {
    Disclosure,
    type ComposedDisclosure,
    type DisclosureCompositionOptions
} from "../disclosure";
import {
    OverflowScroller,
    type ComposedOverflowScroller,
    type OverflowScrollerOptions
} from "../overflow-scroller";
import {
    Navigation,
    type ComposedNavigation,
    type ComposedNavigationItem,
    type NavigationItem,
    type NavigationNavigateDetail,
    type NavigationOptions,
    type NavigationSize,
    type NavigationUpdateOptions,
    type NavigationVariant
} from "../navigation";
import {
    accessibleFirstEnglishMessages,
    getLocaleText,
    type LocaleTextProvider
} from "../localization";

/**
 * Content accepted by the mobile navigation trigger.
 */
export type ResponsiveNavigationTriggerContent = CompositionContent;

/**
 * Content accepted by the mobile navigation close button.
 */
export type ResponsiveNavigationCloseButtonContent = CompositionContent;

/**
 * Side where the mobile trigger menu icon is shown. Defaults to "start".
 */
export type ResponsiveNavigationTriggerIconPosition = "start" | "end";

/**
 * Localized message keys used by ResponsiveNavigation and its internal scroller.
 */
export type ResponsiveNavigationMessageKey =
    | "responsiveNavigation.close"
    | "responsiveNavigation.trigger"
    | "overflowScroller.previousLabel"
    | "overflowScroller.nextLabel";

/**
 * Localization provider accepted by ResponsiveNavigation.
 */
export type ResponsiveNavigationLocalization = LocaleTextProvider<ResponsiveNavigationMessageKey>;

/**
 * Options passed to the internal desktop or mobile Navigation.
 */
export type ResponsiveNavigationListOptions = Omit<NavigationOptions, "items" | "onNavigate">;

/**
 * Options passed to the internal mobile Disclosure.
 */
export type ResponsiveNavigationDisclosureOptions = Omit<
    DisclosureCompositionOptions,
    "trigger" | "panel" | "onOpenChange"
>;

/**
 * Called when any responsive navigation item is activated.
 */
export type ResponsiveNavigationOnNavigate = (
    detail: NavigationNavigateDetail,
    navigation: ComposedResponsiveNavigation
) => void;

/**
 * Options passed to the internal desktop OverflowScroller.
 */
export type ResponsiveNavigationOverflowScrollerOptions = Omit<OverflowScrollerOptions, "children">;

/**
 * Options for ResponsiveNavigation().
 */
export interface ResponsiveNavigationOptions extends BaseCompositionOptions {
    items: NavigationItem[];
    trigger?: ResponsiveNavigationTriggerContent;
    closeButton?: ResponsiveNavigationCloseButtonContent | null;
    triggerIconPosition?: ResponsiveNavigationTriggerIconPosition;
    current?: string | null;
    locale?: ResponsiveNavigationLocalization | null;
    variant?: NavigationVariant;
    mobileVariant?: NavigationVariant;
    size?: NavigationSize;
    closeOnNavigate?: boolean;
    desktopNavigationOptions?: ResponsiveNavigationListOptions;
    mobileNavigationOptions?: ResponsiveNavigationListOptions;
    disclosureOptions?: ResponsiveNavigationDisclosureOptions;
    overflowScrollerOptions?: ResponsiveNavigationOverflowScrollerOptions;
    onNavigate?: ResponsiveNavigationOnNavigate | null;
}

/**
 * Options accepted by ComposedResponsiveNavigation.update().
 */
export interface ResponsiveNavigationUpdateOptions extends Partial<ResponsiveNavigationOptions> {}

/**
 * Responsive navigation created by the composition API.
 */
export interface ComposedResponsiveNavigation extends ComposedNode<HTMLElement> {
    readonly element: HTMLElement;
    readonly desktopNavigation: ComposedNavigation;
    readonly mobileNavigation: ComposedNavigation;
    readonly mobileDisclosure: ComposedDisclosure;
    readonly mobileCloseButton: ComposedButton;
    readonly desktopScroller: ComposedOverflowScroller;
    getFocusTarget(): HTMLElement;
    setItems(items: NavigationItem[]): void;
    setCurrent(match: string | null): void;
    update(options: ResponsiveNavigationUpdateOptions): void;
    destroy(): void;
}

function isElementVisible(element: HTMLElement): boolean {
    const ownerWindow = element.ownerDocument.defaultView;
    const style = ownerWindow?.getComputedStyle(element);

    return (
        style?.display !== "none"
        && style?.visibility !== "hidden"
        && element.getClientRects().length > 0
    );
}

function getVisibleCurrentNavigationLink(
    items: readonly ComposedNavigationItem[]
): HTMLElement | null {
    return items.find((item) => item.isCurrent() && isElementVisible(item.link.element))
        ?.link.element ?? null;
}

/**
 * Returns the best visible focus target for returning to a ResponsiveNavigation instance.
 */
export function getResponsiveNavigationFocusTarget(
    navigation: ComposedResponsiveNavigation
): HTMLElement {
    return (
        getVisibleCurrentNavigationLink(navigation.desktopNavigation.items)
        ?? getVisibleCurrentNavigationLink(navigation.mobileNavigation.items)
        ?? (isElementVisible(navigation.mobileDisclosure.trigger)
            ? navigation.mobileDisclosure.trigger
            : null)
        ?? navigation.desktopNavigation.items[0]?.link.element
        ?? navigation.element
    );
}

function getTriggerContent(
    trigger: ResponsiveNavigationTriggerContent | undefined,
    locale: ResponsiveNavigationLocalization | null
): ResponsiveNavigationTriggerContent {
    return trigger ?? getLocaleText(
        locale,
        "responsiveNavigation.trigger",
        accessibleFirstEnglishMessages["responsiveNavigation.trigger"]
    );
}

function getCloseButtonContent(
    closeButton: ResponsiveNavigationCloseButtonContent | null | undefined,
    locale: ResponsiveNavigationLocalization | null
): ResponsiveNavigationCloseButtonContent | null {
    if (closeButton === null) return null;

    return closeButton ?? getLocaleText(
        locale,
        "responsiveNavigation.close",
        accessibleFirstEnglishMessages["responsiveNavigation.close"]
    );
}

function getNavigationOptions(
    listOptions: ResponsiveNavigationListOptions | undefined,
    items: NavigationItem[],
    variant: NavigationVariant,
    size: NavigationSize,
    onNavigate: (detail: NavigationNavigateDetail) => void,
    mobile: boolean
): NavigationOptions {
    return {
        ...(listOptions ?? {}),
        items,
        orientation: listOptions?.orientation ?? (mobile ? "vertical" : "horizontal"),
        variant: listOptions?.variant ?? variant,
        size: listOptions?.size ?? size,
        onNavigate
    };
}

function getNavigationUpdateOptions(
    listOptions: ResponsiveNavigationListOptions | undefined,
    items: NavigationItem[] | undefined,
    variant: NavigationVariant,
    size: NavigationSize,
    onNavigate: (detail: NavigationNavigateDetail) => void,
    mobile: boolean
): NavigationUpdateOptions {
    const updateOptions: NavigationUpdateOptions = {
        ...(listOptions ?? {}),
        orientation: listOptions?.orientation ?? (mobile ? "vertical" : "horizontal"),
        variant: listOptions?.variant ?? variant,
        size: listOptions?.size ?? size,
        onNavigate
    };

    if (items !== undefined) {
        updateOptions.items = items;
    }

    return updateOptions;
}

/**
 * Creates responsive navigation from one item model.
 *
 * Desktop uses a normal Navigation list. Mobile uses Disclosure with a vertical
 * Navigation list, while links remain real anchors for MPA and SPA use.
 */
export function ResponsiveNavigation(options: ResponsiveNavigationOptions): ComposedResponsiveNavigation {
    const element = createElement("div", getCompositionElementOptions(options, {
        "data-af-composition": "responsive-navigation"
    }));

    let composed!: ComposedResponsiveNavigation;
    let items = options.items;
    let variant: NavigationVariant = options.variant ?? "pills";
    let mobileVariant: NavigationVariant = options.mobileVariant ?? "pills";
    let trigger = options.trigger;
    let closeButton = options.closeButton;
    let triggerIconPosition: ResponsiveNavigationTriggerIconPosition = options.triggerIconPosition ?? "start";
    let locale: ResponsiveNavigationLocalization | null = options.locale ?? null;
    let unsubscribeLocale: (() => void) | null = null;
    let size: NavigationSize = options.size ?? "md";
    let closeOnNavigate = options.closeOnNavigate ?? true;
    let onNavigate = options.onNavigate ?? null;
    let hasCurrent = "current" in options;
    let current = options.current ?? null;
    let destroyed = false;

    function getOverflowScrollerOptions(
        scrollerOptions: ResponsiveNavigationOverflowScrollerOptions | undefined
    ): ResponsiveNavigationOverflowScrollerOptions {
        const resolvedOptions: ResponsiveNavigationOverflowScrollerOptions = {
            ...(scrollerOptions ?? {})
        };

        if (resolvedOptions.locale === undefined && locale !== null) {
            resolvedOptions.locale = locale;
        }

        return resolvedOptions;
    }

    function syncLocaleSubscription(): void {
        unsubscribeLocale?.();
        unsubscribeLocale = null;

        if (!locale?.subscribe) return;

        unsubscribeLocale = locale.subscribe(() => {
            mobileDisclosure.setTriggerContent(getTriggerContent(trigger, locale));
            syncCloseButtonContent();
            desktopScroller.update(getOverflowScrollerOptions(undefined));
        });
    }

    function handleNavigate(detail: NavigationNavigateDetail): void {
        onNavigate?.(detail, composed);

        if (closeOnNavigate) {
            mobileDisclosure.close();
        }
    }

    const desktopNavigation = Navigation(getNavigationOptions(
        options.desktopNavigationOptions,
        items,
        variant,
        size,
        handleNavigate,
        false
    ));

    const desktopScroller = OverflowScroller({
        ...getOverflowScrollerOptions(options.overflowScrollerOptions),
        children: [desktopNavigation]
    });

    const mobileNavigation = Navigation(getNavigationOptions(
        options.mobileNavigationOptions,
        items,
        mobileVariant,
        size,
        handleNavigate,
        true
    ));

    let mobileDisclosure!: ComposedDisclosure;

    function restoreMobileTriggerFocus(): void {
        const ownerWindow = mobileDisclosure.trigger.ownerDocument.defaultView ?? window;

        ownerWindow.setTimeout(() => {
            if (mobileDisclosure.trigger.isConnected) {
                mobileDisclosure.trigger.focus({ preventScroll: true });
            }
        }, 0);
    }

    const mobileCloseButton = Button({
        variant: "secondary",
        onPress() {
            mobileDisclosure.close();
            restoreMobileTriggerFocus();
        }
    });

    mobileCloseButton.element.setAttribute("data-af-responsive-navigation-close", "");

    const mobilePanelContentElement = createElement("div", {
        attributes: {
            "data-af-responsive-navigation-panel-content": ""
        }
    });

    mobilePanelContentElement.append(mobileNavigation.element, mobileCloseButton.element);

    const mobilePanelContent: ComposedNode = {
        element: mobilePanelContentElement,

        destroy(): void {
            mobileCloseButton.destroy();
            mobileNavigation.destroy();
        }
    };

    mobileDisclosure = Disclosure({
        ...(options.disclosureOptions ?? {}),
        trigger: getTriggerContent(trigger, locale),
        panel: mobilePanelContent,
        variant: options.disclosureOptions?.variant ?? "plain",
        announcement: options.disclosureOptions?.announcement ?? false
    });

    desktopScroller.element.setAttribute("data-af-responsive-navigation-desktop", "");
    desktopNavigation.element.setAttribute("data-af-responsive-navigation-desktop-list", "");
    mobileDisclosure.element.setAttribute("data-af-responsive-navigation-mobile", "");
    mobileDisclosure.trigger.setAttribute("data-af-responsive-navigation-trigger", "");
    mobileDisclosure.panel.setAttribute("data-af-responsive-navigation-panel", "");
    mobileNavigation.element.setAttribute("data-af-responsive-navigation-mobile-list", "");

    function syncCloseButtonContent(): void {
        const content = getCloseButtonContent(closeButton, locale);

        mobileCloseButton.element.hidden = content === null || content === false;

        if (content !== null && content !== false) {
            mobileCloseButton.update({
                children: toCompositionChildren(content)
            });
        }
    }

    function syncTriggerIconPosition(): void {
        mobileDisclosure.trigger.setAttribute(
            "data-af-trigger-icon-position",
            triggerIconPosition
        );
    }

    syncCloseButtonContent();
    syncTriggerIconPosition();
    syncLocaleSubscription();

    element.append(desktopScroller.element, mobileDisclosure.element);

    function syncCurrent(): void {
        if (!hasCurrent) return;

        desktopNavigation.setCurrent(current);
        mobileNavigation.setCurrent(current);
    }

    function setItems(nextItems: NavigationItem[]): void {
        items = nextItems;
        desktopNavigation.setItems(items);
        mobileNavigation.setItems(items);
        syncCurrent();
    }

    function setCurrent(match: string | null): void {
        hasCurrent = true;
        current = match;
        syncCurrent();
    }

    syncCurrent();

    composed = {
        element,
        desktopNavigation,
        desktopScroller,
        mobileNavigation,
        mobileDisclosure,
        mobileCloseButton,

        getFocusTarget(): HTMLElement {
            return getResponsiveNavigationFocusTarget(composed);
        },

        setItems,
        setCurrent,

        update(nextOptions): void {
            applyCompositionElementOptions(element, nextOptions);

            if (nextOptions.variant !== undefined) variant = nextOptions.variant;
            if (nextOptions.mobileVariant !== undefined) mobileVariant = nextOptions.mobileVariant;
            if (nextOptions.triggerIconPosition !== undefined) {
                triggerIconPosition = nextOptions.triggerIconPosition;
            }
            if ("locale" in nextOptions) {
                locale = nextOptions.locale ?? null;
                syncLocaleSubscription();
                syncCloseButtonContent();
            }
            if (nextOptions.size !== undefined) size = nextOptions.size;
            if (nextOptions.closeOnNavigate !== undefined) closeOnNavigate = nextOptions.closeOnNavigate;

            if ("onNavigate" in nextOptions) {
                onNavigate = nextOptions.onNavigate ?? null;
            }

            if (nextOptions.items !== undefined) {
                items = nextOptions.items;
            }

            desktopNavigation.update(getNavigationUpdateOptions(
                nextOptions.desktopNavigationOptions,
                nextOptions.items,
                variant,
                size,
                handleNavigate,
                false
            ));

            if (nextOptions.overflowScrollerOptions !== undefined || "locale" in nextOptions) {
                desktopScroller.update(getOverflowScrollerOptions(nextOptions.overflowScrollerOptions));
            }

            desktopScroller.refresh();

            mobileNavigation.update(getNavigationUpdateOptions(
                nextOptions.mobileNavigationOptions,
                nextOptions.items,
                mobileVariant,
                size,
                handleNavigate,
                true
            ));

            if (nextOptions.disclosureOptions !== undefined) {
                mobileDisclosure.update(nextOptions.disclosureOptions);
            }

            if ("trigger" in nextOptions) {
                trigger = nextOptions.trigger;
                mobileDisclosure.setTriggerContent(getTriggerContent(trigger, locale));
            } else if ("locale" in nextOptions) {
                mobileDisclosure.setTriggerContent(getTriggerContent(trigger, locale));
            }

            if ("closeButton" in nextOptions) {
                closeButton = nextOptions.closeButton ?? null;
                syncCloseButtonContent();
            }

            syncTriggerIconPosition();

            if ("current" in nextOptions) {
                setCurrent(nextOptions.current ?? null);
            } else {
                syncCurrent();
            }
        },

        destroy(): void {
            if (destroyed) return;

            destroyed = true;
            unsubscribeLocale?.();
            desktopScroller.destroy();
            mobileDisclosure.destroy();
            element.remove();
        }
    };

    return composed;
}
