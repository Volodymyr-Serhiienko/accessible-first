import { isHTMLElement, isVisible } from "../../../core/src/dom";
import { addEventListener, runCleanups, type Cleanup } from "../../../core/src/events";
import { getFocusableElements, isFocusable } from "../../../core/src/focus";
import { createLocaleSubscription } from "../localization/createLocaleSubscription";
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
    /** Creates a separate leading control for each desktop and mobile list. */
    leadingContent?: NavigationOptions["leadingContent"];
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
    /** Rechecks CSS visibility and transfers only focus owned by the hidden branch. */
    checkLayout(): void;
    setItems(items: NavigationItem[]): void;
    setCurrent(match: string | null): void;
    update(options: ResponsiveNavigationUpdateOptions): void;
    destroy(): void;
    isDestroyed(): boolean;
}

function getVisibleCurrentNavigationLink(
    items: readonly ComposedNavigationItem[]
): HTMLElement | null {
    return items.find((item) => item.isCurrent() && isFocusable(item.link.element))
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
        ?? (isFocusable(navigation.mobileDisclosure.trigger)
            ? navigation.mobileDisclosure.trigger
            : null)
        ?? getFocusableElements(navigation.desktopNavigation.element)[0]
        ?? getFocusableElements(navigation.mobileNavigation.element)[0]
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
    retainedOptions: ResponsiveNavigationListOptions,
    items: NavigationItem[] | undefined,
    variant: NavigationVariant,
    size: NavigationSize,
    onNavigate: (detail: NavigationNavigateDetail) => void,
    mobile: boolean
): NavigationUpdateOptions {
    const updateOptions: NavigationUpdateOptions = {
        ...(listOptions ?? {}),
        orientation: retainedOptions.orientation ?? (mobile ? "vertical" : "horizontal"),
        variant: retainedOptions.variant ?? variant,
        size: retainedOptions.size ?? size,
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
    let size: NavigationSize = options.size ?? "md";
    let closeOnNavigate = options.closeOnNavigate ?? true;
    let onNavigate = options.onNavigate ?? null;
    let hasCurrent = "current" in options;
    let current = options.current ?? null;
    let destroyed = false;
    let revision = 0;
    let desktopListOptions = { ...options.desktopNavigationOptions };
    let mobileListOptions = { ...options.mobileNavigationOptions };
    let scrollerOptions = { ...options.overflowScrollerOptions };
    const cleanups: Cleanup[] = [];
    let desktopNavigation!: ComposedNavigation;
    let desktopScroller!: ComposedOverflowScroller;
    let mobileNavigation!: ComposedNavigation;
    let mobileCloseButton!: ComposedButton;
    let mobileDisclosure!: ComposedDisclosure;
    const localeSubscription = createLocaleSubscription(syncLocalizedContent);

    function getOverflowScrollerOptions(): ResponsiveNavigationOverflowScrollerOptions {
        return { ...scrollerOptions, locale: scrollerOptions.locale === undefined ? locale : scrollerOptions.locale };
    }

    function syncLocalizedContent(): void {
        if (destroyed) return;
        const activeRevision = revision;
        const triggerContent = getTriggerContent(trigger, locale);
        const closeContent = getCloseButtonContent(closeButton, locale);
        if (destroyed || activeRevision !== revision) return;
        runCleanups([
            () => mobileDisclosure.setTriggerContent(triggerContent),
            () => {
                if (destroyed || activeRevision !== revision) return;
                mobileCloseButton.update({ children: toCompositionChildren(closeContent) });
                if (!destroyed && activeRevision === revision) {
                    mobileCloseButton.element.hidden = closeContent === null || closeContent === false;
                }
            }
        ]);
    }

    function handleNavigate(detail: NavigationNavigateDetail): void {
        if (destroyed) return;
        const activeRevision = revision;
        onNavigate?.(detail, composed);

        if (!destroyed && activeRevision === revision && closeOnNavigate) {
            mobileDisclosure.close();
        }
    }

    function destroy(): void {
        if (destroyed) return;
        destroyed = true;
        revision += 1;
        runCleanups([
            localeSubscription.destroy,
            ...[...cleanups].reverse(),
            () => desktopScroller ? desktopScroller.destroy() : desktopNavigation?.destroy(),
            () => mobileDisclosure ? mobileDisclosure.destroy() : runCleanups([
                () => mobileCloseButton?.destroy(), () => mobileNavigation?.destroy()
            ]),
            () => element.remove()
        ]);
    }

    try {
        desktopNavigation = Navigation(getNavigationOptions(
            { ...options.desktopNavigationOptions, ...(options.leadingContent !== undefined ? { leadingContent: options.leadingContent } : {}) },
            items,
            variant,
            size,
            handleNavigate,
            false
        ));

        desktopScroller = OverflowScroller({
            ...getOverflowScrollerOptions(),
            children: [desktopNavigation]
        });

        mobileNavigation = Navigation(getNavigationOptions(
            { ...options.mobileNavigationOptions, ...(options.leadingContent !== undefined ? { leadingContent: options.leadingContent } : {}) },
            items,
            mobileVariant,
            size,
            handleNavigate,
            true
        ));

        mobileCloseButton = Button({
            variant: "secondary",
            onPress() {
                mobileDisclosure.close();
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
                runCleanups([mobileCloseButton.destroy, mobileNavigation.destroy]);
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

        function syncTriggerIconPosition(): void {
            mobileDisclosure.trigger.setAttribute(
                "data-af-trigger-icon-position",
                triggerIconPosition
            );
        }

        syncTriggerIconPosition();

        element.append(desktopScroller.element, mobileDisclosure.element);

        function syncCurrent(): void {
            if (destroyed || !hasCurrent) return;

            runCleanups([() => desktopNavigation.setCurrent(current), () => mobileNavigation.setCurrent(current)]);
        }

        function setItems(nextItems: NavigationItem[]): void {
            update({ items: nextItems });
        }

        function setCurrent(match: string | null): void {
            if (destroyed) return;
            hasCurrent = true;
            current = match;
            syncCurrent();
        }

        syncCurrent();

        function checkLayout(): void {
            if (destroyed) return;
            const active = element.ownerDocument.activeElement;
            const desktopVisible = isVisible(desktopNavigation.element);
            const mobileVisible = isFocusable(mobileDisclosure.trigger);
            const ownsDesktopFocus = isHTMLElement(active) && desktopNavigation.element.contains(active);
            const ownsMobileFocus = isHTMLElement(active) && mobileDisclosure.element.contains(active);
            const mobileItemIndex = mobileNavigation.items.findIndex((item) => item.link.element === active);
            if (desktopVisible && mobileDisclosure.isOpen()) mobileDisclosure.close();
            const afterClose = element.ownerDocument.activeElement;
            if (afterClose !== active && afterClose !== mobileDisclosure.trigger && afterClose !== element.ownerDocument.body) return;
            if (!desktopVisible && mobileVisible && ownsDesktopFocus) {
                mobileDisclosure.trigger.focus({ preventScroll: true });
            } else if (desktopVisible && !mobileVisible && ownsMobileFocus) {
                const counterpart = desktopNavigation.items[mobileItemIndex]?.link.element;
                const target = counterpart && isFocusable(counterpart) ? counterpart : getResponsiveNavigationFocusTarget(composed);
                target.focus({ preventScroll: true });
            }
            desktopScroller.refresh();
        }

        function update(nextOptions: ResponsiveNavigationUpdateOptions): void {
            if (destroyed) return;
            const activeRevision = ++revision;
            const isCurrent = (): boolean => !destroyed && activeRevision === revision;
            applyCompositionElementOptions(element, nextOptions);
            if (nextOptions.variant !== undefined) variant = nextOptions.variant;
            if (nextOptions.mobileVariant !== undefined) mobileVariant = nextOptions.mobileVariant;
            if (nextOptions.triggerIconPosition !== undefined) triggerIconPosition = nextOptions.triggerIconPosition;
            if ("locale" in nextOptions) locale = nextOptions.locale ?? null;
            if ("trigger" in nextOptions) trigger = nextOptions.trigger;
            if ("closeButton" in nextOptions) closeButton = nextOptions.closeButton ?? null;
            if (nextOptions.size !== undefined) size = nextOptions.size;
            if (nextOptions.closeOnNavigate !== undefined) closeOnNavigate = nextOptions.closeOnNavigate;
            if ("onNavigate" in nextOptions) onNavigate = nextOptions.onNavigate ?? null;
            if (nextOptions.items !== undefined) items = nextOptions.items;
            if ("current" in nextOptions) { hasCurrent = true; current = nextOptions.current ?? null; }
            desktopListOptions = { ...desktopListOptions, ...nextOptions.desktopNavigationOptions };
            mobileListOptions = { ...mobileListOptions, ...nextOptions.mobileNavigationOptions };
            scrollerOptions = { ...scrollerOptions, ...nextOptions.overflowScrollerOptions };
            runCleanups([
                () => { if ("locale" in nextOptions) localeSubscription.replace(locale); },
                () => { if (isCurrent()) desktopNavigation.update(getNavigationUpdateOptions(
                    { ...nextOptions.desktopNavigationOptions, ...("leadingContent" in nextOptions ? { leadingContent: nextOptions.leadingContent ?? null } : {}) },
                    desktopListOptions, nextOptions.items, variant, size, handleNavigate, false
                )); },
                () => { if (isCurrent()) mobileNavigation.update(getNavigationUpdateOptions(
                    { ...nextOptions.mobileNavigationOptions, ...("leadingContent" in nextOptions ? { leadingContent: nextOptions.leadingContent ?? null } : {}) },
                    mobileListOptions, nextOptions.items, mobileVariant, size, handleNavigate, true
                )); },
                () => { if (isCurrent() && (nextOptions.overflowScrollerOptions !== undefined || "locale" in nextOptions)) desktopScroller.update(getOverflowScrollerOptions()); },
                () => { if (isCurrent() && nextOptions.disclosureOptions !== undefined) mobileDisclosure.update(nextOptions.disclosureOptions); },
                () => { if (isCurrent() && ("trigger" in nextOptions || "closeButton" in nextOptions || "locale" in nextOptions)) syncLocalizedContent(); },
                () => { if (isCurrent()) { syncTriggerIconPosition(); syncCurrent(); checkLayout(); } }
            ]);
        }

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

            checkLayout,
            setItems,
            setCurrent,
            update,
            destroy,
            isDestroyed: () => destroyed
        };

        const ownerWindow = element.ownerDocument.defaultView;
        if (ownerWindow) cleanups.push(addEventListener(ownerWindow, "resize", checkLayout));
        localeSubscription.replace(locale);
        syncLocalizedContent();
        return composed;
    } catch (error) {
        try { destroy(); } catch { /* Preserve the construction failure. */ }
        throw error;
    }
}
