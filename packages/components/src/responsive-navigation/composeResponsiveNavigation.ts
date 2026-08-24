import {
    applyCompositionElementOptions,
    createElement,
    getCompositionElementOptions,
    type BaseCompositionOptions,
    type ComposedNode,
    type CompositionContent
} from "../composition";
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
 * Side where the mobile trigger menu icon is shown.
 */
export type ResponsiveNavigationTriggerIconPosition = "start" | "end";

/**
 * Localized message keys used by ResponsiveNavigation and its internal scroller.
 */
export type ResponsiveNavigationMessageKey =
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
    readonly desktopScroller: ComposedOverflowScroller;
    setItems(items: NavigationItem[]): void;
    setCurrent(match: string | null): void;
    update(options: ResponsiveNavigationUpdateOptions): void;
    destroy(): void;
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
    let triggerIconPosition: ResponsiveNavigationTriggerIconPosition = options.triggerIconPosition ?? "end";
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

    const mobileDisclosure = Disclosure({
        ...(options.disclosureOptions ?? {}),
        trigger: getTriggerContent(trigger, locale),
        panel: mobileNavigation,
        variant: options.disclosureOptions?.variant ?? "plain",
        announcement: options.disclosureOptions?.announcement ?? false
    });

    desktopScroller.element.setAttribute("data-af-responsive-navigation-desktop", "");
    desktopNavigation.element.setAttribute("data-af-responsive-navigation-desktop-list", "");
    mobileDisclosure.element.setAttribute("data-af-responsive-navigation-mobile", "");
    mobileDisclosure.trigger.setAttribute("data-af-responsive-navigation-trigger", "");
    mobileDisclosure.panel.setAttribute("data-af-responsive-navigation-panel", "");
    mobileNavigation.element.setAttribute("data-af-responsive-navigation-mobile-list", "");

    function syncTriggerIconPosition(): void {
        mobileDisclosure.trigger.setAttribute(
            "data-af-trigger-icon-position",
            triggerIconPosition
        );
    }

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
