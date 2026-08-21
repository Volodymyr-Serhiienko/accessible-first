import {
    Link,
    runFocusRoute,
    type ComposedNode,
    type ComposedResponsiveNavigation
} from "./af";

function isVisible(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element);

    return (
        style.display !== "none"
        && style.visibility !== "hidden"
        && element.getClientRects().length > 0
    );
}

function getCurrentNavigationLink(navigation: ComposedResponsiveNavigation): HTMLElement | null {
    const desktopCurrent = navigation.desktopNavigation.items
        .find((item) => item.isCurrent())
        ?.link.element ?? null;

    if (desktopCurrent && isVisible(desktopCurrent)) return desktopCurrent;

    const mobileCurrent = navigation.mobileNavigation.items
        .find((item) => item.isCurrent())
        ?.link.element ?? null;

    if (mobileCurrent && isVisible(mobileCurrent)) return mobileCurrent;

    if (isVisible(navigation.mobileDisclosure.trigger)) {
        return navigation.mobileDisclosure.trigger;
    }

    return navigation.desktopNavigation.items[0]?.link.element ?? navigation.element;
}

export function ReturnToNavigationLink(
    getNavigation: () => ComposedResponsiveNavigation
): ComposedNode {
    return Link({
        className: "playground-return-link",
        href: "#playground-navigation",
        text: "Back to section navigation",
        variant: "standalone",
        hint: "Moves focus back to the current playground navigation item.",
        hintDisplay: "description",
        onNavigate(event) {
            event.preventDefault();

            const target = getCurrentNavigationLink(getNavigation());

            runFocusRoute({
                target,
                scroll: {
                    block: "nearest",
                    inline: "nearest",
                    behavior: "auto"
                }
            });
        }
    });
}
