import {
    applyPageLayout,
    createHashRouter,
    createPage,
    mount,
    PageOutlet,
    type ComposedResponsiveNavigation
} from "./demo/af";
import { FooterDemo } from "./demo/footer";
import { HeaderDemo } from "./demo/header";
import { NavigationDemo } from "./demo/navigation";
import { getPlaygroundRouteDocumentTitle, playgroundRoutes } from "./demo/routes";
import { notifications } from "./demo/status";
import { ReturnToNavigationLink } from "./demo/returnToNavigation";
import { PlaygroundSearch } from "./demo/search";

import "../packages/components/src/styles/index.css";

const page = createPage({
    title: "Accessible First Playground",
    mainId: "main",
    skipLink: "Skip to section navigation",
    skipLinkTargetId: "playground-navigation",
    navigationLabel: "Playground sections",
    theme: "system"
});

const outlet = PageOutlet({
    className: "playground-route-outlet",
    label: "Playground demo content",
    announcement: false,
    scrollOnRender: true
});

const router = createHashRouter({
    routes: playgroundRoutes,
    outlet,
    getDocumentTitle: getPlaygroundRouteDocumentTitle,
    getAnnouncement(route) {
        return `${route.title} demo loaded.`;
    },
    inspect() {
        page.inspect();
    }
});

let navigation!: ComposedResponsiveNavigation;

applyPageLayout(page, {
    maxWidth: "var(--playground-max-width)",
    gutter: "var(--playground-gutter)",
    mainGap: "1rem",
    mainPaddingBlock: "1rem 2rem"
});

page.header(HeaderDemo({
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

page.navigation(navigation);
page.setMainContent(
    outlet,
    ReturnToNavigationLink(() => navigation),
    notifications
);
page.footer(FooterDemo());

mount(page, "#app");

router.start({
    announcement: false,
    scroll: true,
    focusTarget: null
});
page.inspect();
