import {
    Link,
    runFocusRoute,
    type ComposedNode,
    type ComposedResponsiveNavigation
} from "./af";

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

            runFocusRoute({
                target: () => getNavigation().getFocusTarget(),
                scroll: {
                    block: "nearest",
                    inline: "nearest",
                    behavior: "auto"
                }
            });
        }
    });
}