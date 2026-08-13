import {
    createPage,
    mount,
    PageOutlet,
    type ComposedResponsiveNavigation
} from "./demo/af";
import { FooterDemo } from "./demo/footer";
import { HeaderDemo } from "./demo/header";
import { NavigationDemo } from "./demo/navigation";
import {
    getPlaygroundRouteByHash,
    getPlaygroundRouteDocumentTitle,
    getPlaygroundRouteHref,
    type PlaygroundRoute
} from "./demo/routes";
import { notifications } from "./demo/status";
import "../packages/components/src/styles/index.css";

interface RenderRouteOptions {
    updateHistory?: boolean;
    replaceHistory?: boolean;
    announcement?: boolean | string;
    scroll?: boolean;
}

const page = createPage({
    title: "Accessible First Playground",
    mainId: "main",
    navigationLabel: "Playground sections",
    theme: "system"
});

const initialRoute = getPlaygroundRouteByHash();

const outlet = PageOutlet({
    className: "playground-route-outlet",
    label: "Playground demo content",
    title: initialRoute.title,
    documentTitle: getPlaygroundRouteDocumentTitle(initialRoute),
    children: [initialRoute.render()],
    announcement: false,
    scrollOnRender: true
});

let activeRouteId = initialRoute.id;
let navigation!: ComposedResponsiveNavigation;

function syncRouteHistory(route: PlaygroundRoute, options: RenderRouteOptions): void {
    if (!options.updateHistory) return;

    const href = getPlaygroundRouteHref(route);

    if (window.location.hash === href) return;

    if (options.replaceHistory) {
        window.history.replaceState(null, "", href);
    } else {
        window.history.pushState(null, "", href);
    }
}

function focusCurrentRoute(options: RenderRouteOptions = {}): void {
    if (options.scroll ?? true) {
        outlet.element.scrollIntoView({
            block: "start",
            inline: "nearest",
            behavior: "auto"
        });
    }

    outlet.focus("first-heading");
}

function renderRoute(route: PlaygroundRoute, options: RenderRouteOptions = {}): void {
    if (route.id === activeRouteId) {
        syncRouteHistory(route, options);
        navigation.setCurrent(route.id);
        focusCurrentRoute(options);
        return;
    }

    activeRouteId = route.id;
    syncRouteHistory(route, options);

    outlet.render(route.render(), {
        title: route.title,
        documentTitle: getPlaygroundRouteDocumentTitle(route),
        focusTarget: "first-heading",
        scroll: options.scroll ?? true,
        announcement: options.announcement ?? `${route.title} demo loaded.`
    });

    navigation.setCurrent(route.id);
    page.inspect();
}

function renderRouteFromLocation(): void {
    renderRoute(getPlaygroundRouteByHash(), {
        updateHistory: false
    });
}

page.element.classList.add("playground-shell");
page.main.classList.add("playground-main");

page.header(HeaderDemo());

navigation = NavigationDemo({
    current: activeRouteId,
    onRouteNavigate(route, detail) {
        detail.event.preventDefault();

        renderRoute(route, {
            updateHistory: true
        });
    }
});

page.navigation(navigation);
page.setMainContent(outlet);
page.appendToMain(notifications);
page.footer(FooterDemo());

window.addEventListener("popstate", renderRouteFromLocation);
window.addEventListener("hashchange", renderRouteFromLocation);

mount(page, "#app");
page.inspect();
