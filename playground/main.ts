import {
    AppShell,
    createHashRouter,
    mount,
    type ComposedResponsiveNavigation
} from "./demo/af";
import { FooterDemo } from "./demo/footer";
import { HeaderDemo } from "./demo/header";
import { NavigationDemo } from "./demo/navigation";
import { ReturnToNavigationLink } from "./demo/returnToNavigation";
import { getPlaygroundRouteDocumentTitle, playgroundRoutes } from "./demo/routes";
import { PlaygroundSearch } from "./demo/search";
import { notifications } from "./demo/status";

import "../packages/components/src/styles/index.css";

const shell = AppShell({
    title: "Accessible First Playground",
    mainId: "main",
    skipLink: "Skip to section navigation",
    skipLinkTargetId: "playground-navigation",
    navigationLabel: "Playground sections",
    theme: "system",
    outletOptions: {
        className: "playground-route-outlet",
        label: "Playground demo content",
        announcement: false,
        scrollOnRender: true
    },
    layout: {
        maxWidth: "var(--playground-max-width)",
        gutter: "var(--playground-gutter)",
        mainGap: "1rem",
        mainPaddingBlock: "1rem 2rem"
    }
});

const router = createHashRouter({
    routes: playgroundRoutes,
    outlet: shell.outlet,
    getDocumentTitle: getPlaygroundRouteDocumentTitle,
    getAnnouncement(route) {
        return `${route.title} demo loaded.`;
    },
    inspect() {
        shell.inspect();
    }
});

let navigation!: ComposedResponsiveNavigation;

shell.setHeader(HeaderDemo({
    content: [
        PlaygroundSearch({
            router,
            routes: playgroundRoutes
        })
    ]
}));

navigation = NavigationDemo({
    current: router.getCurrentRoute().id,
    onRouteNavigate(route, detail) {
        detail.event.preventDefault();

        router.navigate(route, {
            updateHistory: true,
            scroll: true,
            focusTarget: "outlet"
        });
    }
});

router.setNavigation(navigation);

shell.setNavigation(navigation);
shell.setAfterOutlet([
    ReturnToNavigationLink(() => navigation),
    notifications
]);
shell.setFooter(FooterDemo());

mount(shell, "#app");

router.start({
    announcement: false,
    scroll: true,
    focusTarget: null
});

shell.inspect();
