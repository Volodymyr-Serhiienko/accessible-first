import { afterEach, describe, expect, it, vi } from "vitest";
import { ResponsiveNavigation, ResponsiveNavigationFocusLink, type ComposedResponsiveNavigation } from "../../../packages/components/src/responsive-navigation";
import { RouteResponsiveNavigation, type ComposedRouteResponsiveNavigation } from "../../../packages/components/src/route-responsive-navigation";
import { FocusRouteLink, type ComposedFocusRouteLink } from "../../../packages/components/src/focus-route";
import { OverflowScroller } from "../../../packages/components/src/overflow-scroller";
import { activateLinkAppRoute, createAppRouteChrome, createHashAppRouteChromeRenderer, createLinkAppRouteChromeRenderer, createRouteChrome } from "../../../packages/components/src/route-chrome";
import type { LinkRoutedAppContext } from "../../../packages/components/src/routed-app/createLinkRoutedApp";
import type { HashRoutedAppContext } from "../../../packages/components/src/routed-app/createHashRoutedApp";

const disposers: Array<() => void> = [];
function own<T extends { destroy(): void }>(control: T): T { disposers.push(() => control.destroy()); return control; }
function child(text: string, destroy = vi.fn()) {
    const element = document.createElement("span"); element.textContent = text;
    return { element, destroy };
}
function localeProbe(fail = false) {
    let listener = () => {};
    const unsubscribe = vi.fn(() => { if (fail) throw new Error("unsubscribe"); });
    const locale = { t: (key: string) => key, subscribe(callback: () => void) { listener = callback; return unsubscribe; } };
    return { locale, unsubscribe, emit: () => listener() };
}
function show(element: HTMLElement): void {
    vi.spyOn(element, "getClientRects").mockImplementation(() => {
        let node: HTMLElement | null = element;
        while (node) {
            if (node.hidden || node.style.display === "none") return [] as unknown as DOMRectList;
            node = node.parentElement;
        }
        return [new DOMRect(0, 0, 100, 44)] as unknown as DOMRectList;
    });
}
function mountNavigation(navigation: ComposedResponsiveNavigation): void {
    document.body.append(navigation.element);
    [navigation.element, navigation.desktopNavigation.element, navigation.mobileDisclosure.trigger,
        ...navigation.element.querySelectorAll<HTMLElement>("a,button")].forEach(element => { if (!vi.isMockFunction(element.getClientRects)) show(element); });
}
const items = [{ id: "one", label: "One", href: "#one" }, { id: "two", label: "Two", href: "#two" }];
const routes = [{ id: "one", title: "One", href: "#one" }, { id: "two", title: "Two", href: "#two" }];

afterEach(() => {
    disposers.splice(0).reverse().forEach(dispose => { try { dispose(); } catch { /* Expected exceptional cleanup tests. */ } });
    vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); document.body.replaceChildren();
});

describe("Responsive navigation lifecycle", () => {
    it("retains per-list defaults and separate leading controls on unrelated updates", () => {
        const leading = vi.fn(() => child("Leading"));
        const nav = own(ResponsiveNavigation({ items, leadingContent: leading,
            desktopNavigationOptions: { orientation: "vertical", variant: "plain", size: "md" } }));
        const first = nav.desktopNavigation.element.firstElementChild;
        nav.update({ className: "changed" });
        expect(leading).toHaveBeenCalledTimes(2);
        expect(nav.desktopNavigation.element.firstElementChild).toBe(first);
        expect(nav.desktopNavigation.element.dataset.afOrientation).toBe("vertical");
        expect(nav.desktopNavigation.element.dataset.afVariant).toBe("plain");
        expect(nav.desktopNavigation.element.dataset.afSize).toBe("md");
    });

    it("uses new authored trigger and close text together with a locale change", () => {
        const nav = own(ResponsiveNavigation({ items }));
        nav.update({ trigger: "Sections", closeButton: "Done", locale: localeProbe().locale });
        expect(nav.mobileDisclosure.trigger.textContent).toBe("Sections");
        expect(nav.mobileCloseButton.element.textContent).toBe("Done");
    });

    it("releases hidden close content instead of retaining it", () => {
        const content = child("Close");
        const nav = own(ResponsiveNavigation({ items, closeButton: content }));
        nav.update({ closeButton: null });
        expect(content.destroy).toHaveBeenCalledOnce();
        expect(nav.mobileCloseButton.element.hidden).toBe(true);
        expect(nav.mobileCloseButton.element.textContent).toBe("");
    });

    it("keeps a newer close-content update requested by old content cleanup", () => {
        let nav: ComposedResponsiveNavigation;
        const old = child("Old", vi.fn(() => nav.update({ trigger: "Newest", closeButton: "Newest close" })));
        nav = own(ResponsiveNavigation({ items, closeButton: old }));
        nav.update({ trigger: "Obsolete", closeButton: "Obsolete close" });
        expect(nav.mobileDisclosure.trigger.textContent).toBe("Newest");
        expect(nav.mobileCloseButton.element.textContent).toBe("Newest close");
    });

    it("keeps explicit scroller locale during parent locale updates", () => {
        const parent = localeProbe(); const scroller = localeProbe(); const next = localeProbe();
        const nav = own(ResponsiveNavigation({ items, locale: parent.locale, overflowScrollerOptions: { locale: scroller.locale } }));
        nav.update({ locale: next.locale }); parent.emit(); next.emit();
        expect(scroller.unsubscribe).not.toHaveBeenCalled();
        nav.destroy();
        expect(scroller.unsubscribe).toHaveBeenCalledOnce();
    });

    it("retires stale locale callbacks and finishes exceptional destruction", () => {
        const locale = localeProbe(true); const leading = vi.fn(() => child("Leading"));
        const nav = own(ResponsiveNavigation({ items, locale: locale.locale, leadingContent: leading }));
        document.body.append(nav.element);
        expect(() => nav.destroy()).toThrow("unsubscribe");
        const markup = nav.element.outerHTML;
        locale.emit(); nav.update({ trigger: "late" }); nav.setItems([]); nav.setCurrent("two"); nav.checkLayout();
        expect(nav.element.outerHTML).toBe(markup);
        expect(nav.element.isConnected).toBe(false);
        expect(nav.isDestroyed()).toBe(true);
        expect(leading.mock.results.every(result => result.value.destroy.mock.calls.length === 1)).toBe(true);
    });

    it("cleans both branches when a mobile leading factory fails", () => {
        const desktop = child("Desktop"); const locale = localeProbe(); let calls = 0;
        expect(() => ResponsiveNavigation({ items, locale: locale.locale, leadingContent() {
            if (++calls === 2) throw new Error("mobile factory");
            return desktop;
        } })).toThrow("mobile factory");
        expect(desktop.destroy).toHaveBeenCalledOnce();
        expect(locale.unsubscribe).toHaveBeenCalledOnce();
    });

    it("does not close a newly updated menu after an obsolete navigation callback", () => {
        let nav: ComposedResponsiveNavigation;
        nav = own(ResponsiveNavigation({ items, onNavigate() { nav.update({ trigger: "New menu" }); } }));
        nav.mobileDisclosure.open(); nav.mobileNavigation.items[0]!.link.element.click();
        expect(nav.mobileDisclosure.isOpen()).toBe(true);
    });

    it("still closes after an ordinary current-route update", () => {
        let nav: ComposedResponsiveNavigation;
        nav = own(ResponsiveNavigation({ items, onNavigate(detail) { nav.setCurrent(detail.item.id ?? null); } }));
        nav.mobileDisclosure.open(); nav.mobileNavigation.items[0]!.link.element.click();
        expect(nav.mobileDisclosure.isOpen()).toBe(false);
    });

    it("does not steal a destination focus after closing", () => {
        vi.useFakeTimers();
        const nav = own(ResponsiveNavigation({ items })); mountNavigation(nav);
        const destination = document.createElement("input"); document.body.append(destination);
        nav.mobileDisclosure.open(); nav.mobileCloseButton.element.focus(); nav.mobileCloseButton.element.click();
        destination.focus(); vi.runAllTimers();
        expect(document.activeElement).toBe(destination);
    });

    it("transfers owned desktop focus to the mobile trigger on layout change", () => {
        const nav = own(ResponsiveNavigation({ items })); mountNavigation(nav);
        nav.mobileDisclosure.element.style.display = "none";
        nav.desktopNavigation.items[1]!.link.element.focus();
        nav.desktopNavigation.element.style.display = "none"; nav.mobileDisclosure.element.style.display = "";
        nav.checkLayout();
        expect(document.activeElement).toBe(nav.mobileDisclosure.trigger);
    });

    it("returns mobile item focus to its desktop counterpart when widening", () => {
        const nav = own(ResponsiveNavigation({ items })); mountNavigation(nav);
        nav.desktopNavigation.element.style.display = "none"; nav.mobileDisclosure.open();
        nav.mobileNavigation.items[1]!.link.element.focus();
        nav.desktopNavigation.element.style.display = ""; nav.mobileDisclosure.element.style.display = "none";
        nav.checkLayout();
        expect(document.activeElement).toBe(nav.desktopNavigation.items[1]!.link.element);
        expect(nav.mobileDisclosure.isOpen()).toBe(false);
    });

    it("does not transfer external focus during a layout change", () => {
        const nav = own(ResponsiveNavigation({ items })); mountNavigation(nav);
        const other = document.createElement("button"); document.body.append(other); other.focus();
        nav.desktopNavigation.element.style.display = "none"; window.dispatchEvent(new Event("resize"));
        expect(document.activeElement).toBe(other);
    });

    it("skips unavailable current links when choosing a return target", () => {
        const nav = own(ResponsiveNavigation({ items: [{ ...items[0]!, disabled: true }, items[1]!], current: "one" }));
        mountNavigation(nav); nav.mobileDisclosure.element.style.display = "none";
        expect(nav.getFocusTarget()).toBe(nav.desktopNavigation.items[1]!.link.element);
        nav.desktopNavigation.element.setAttribute("inert", "");
        expect(nav.getFocusTarget()).toBe(nav.element);
    });
});

describe("Route and focus link ownership", () => {
    it("updates focus-route and responsive return links without recursion", () => {
        const nav = own(ResponsiveNavigation({ items })); mountNavigation(nav);
        const direct = own(FocusRouteLink({ text: "Return", focusTarget: nav.desktopNavigation.items[0]!.link.element, scroll: false }));
        direct.update({ text: "Back" }); expect(direct.element.textContent).toBe("Back");
        const responsive = own(ResponsiveNavigationFocusLink({ navigation: nav, text: "Return", scroll: false }));
        responsive.update({ text: "Navigation" });
        expect(responsive.focusTarget().focused).toBe(true);
        expect(document.activeElement).toBe(nav.getFocusTarget());
    });

    it("does not focus or notify after a resolver replaces its own route", () => {
        const old = document.createElement("button"); const next = document.createElement("button"); document.body.append(old, next);
        const callback = vi.fn(); let link: ComposedFocusRouteLink;
        link = own(FocusRouteLink({ focusTarget: () => { link.update({ focusTarget: next }); return old; }, onNavigate: callback }));
        link.element.click();
        expect(document.activeElement).not.toBe(old); expect(callback).not.toHaveBeenCalled();
        link.destroy(); expect(link.focusTarget().focused).toBe(false);
    });

    it("resolves the primary target only once and resolves fallback only when necessary", () => {
        const target = document.createElement("button"); document.body.append(target);
        const primary = vi.fn(() => target); const fallback = vi.fn(() => target);
        const link = own(FocusRouteLink({ focusTarget: primary, fallbackFocusTarget: fallback, scroll: false }));
        link.focusTarget(); expect(primary).toHaveBeenCalledOnce(); expect(fallback).not.toHaveBeenCalled();
    });

    it("does not activate an old route after the lower-level callback changes routes", () => {
        const activated = vi.fn(); let nav: ComposedRouteResponsiveNavigation<typeof routes[number]>;
        nav = own(RouteResponsiveNavigation({ routes, onNavigate() { nav.setRoutes([routes[1]!]); }, onRouteNavigate: activated }));
        nav.desktopNavigation.items[0]!.link.element.click();
        expect(activated).not.toHaveBeenCalled();
        expect(nav.getRoutes()).toEqual([routes[1]]);
    });

    it("lets a newer route resolver update win", () => {
        const nav = own(RouteResponsiveNavigation({ routes })); let nested = false;
        nav.update({ navigationItemsOptions: { getLabel(route) {
            if (!nested) { nested = true; nav.update({ routes: [routes[1]!], navigationItemsOptions: { getLabel: () => "Latest" } }); }
            return `Obsolete ${route.title}`;
        } } });
        expect(nav.desktopNavigation.element.textContent).toBe("Latest");
        nav.destroy(); nav.setRoutes(routes); expect(nav.getRoutes()).toEqual([routes[1]]);
    });

    it("cancels route activation after direct item replacement", () => {
        const activated = vi.fn(); let nav: ComposedRouteResponsiveNavigation<typeof routes[number]>;
        nav = own(RouteResponsiveNavigation({ routes, onNavigate() { nav.setItems([]); }, onRouteNavigate: activated }));
        nav.desktopNavigation.items[0]!.link.element.click();
        expect(activated).not.toHaveBeenCalled();
    });
});

describe("Overflow scroller ownership and RTL", () => {
    it.each(["ltr", "rtl"])("uses logical edges and signed movement for %s", direction => {
        vi.useFakeTimers(); const view = own(OverflowScroller({ scrollAmount: 80 }));
        view.viewport.style.direction = direction;
        Object.defineProperties(view.viewport, { clientWidth: { value: 100 }, scrollWidth: { value: 300 }, scrollLeft: { value: 0, writable: true } });
        const scrollBy = vi.fn(); view.viewport.scrollBy = scrollBy;
        vi.runAllTimers(); expect(view.previousButton.disabled).toBe(true); expect(view.nextButton.disabled).toBe(false);
        expect(view.previousButton.getAttribute("aria-label")).toBe("Scroll backward");
        expect(view.nextButton.getAttribute("aria-label")).toBe("Scroll forward");
        view.scrollNext(); expect(scrollBy).toHaveBeenLastCalledWith(expect.objectContaining({ left: direction === "rtl" ? -80 : 80 }));
        view.viewport.scrollLeft = direction === "rtl" ? -200 : 200; view.refresh(); vi.runAllTimers();
        expect(view.nextButton.disabled).toBe(true); expect(view.previousButton.disabled).toBe(false);
        view.scrollPrevious(); expect(scrollBy).toHaveBeenLastCalledWith(expect.objectContaining({ left: direction === "rtl" ? 80 : -80 }));
    });

    it("ignores a scheduled focus scroll when focus moved elsewhere", () => {
        vi.useFakeTimers(); const button = document.createElement("button"); const other = document.createElement("input");
        const view = own(OverflowScroller({ children: [button] })); document.body.append(view.element, other);
        const scrollBy = vi.fn(); view.viewport.scrollBy = scrollBy;
        vi.spyOn(button, "getBoundingClientRect").mockReturnValue(new DOMRect(300, 0, 50, 44));
        button.focus(); other.focus(); vi.runAllTimers(); expect(scrollBy).not.toHaveBeenCalled();
    });

    it("finishes teardown after locale cleanup fails and ignores all late calls", () => {
        vi.useFakeTimers(); const locale = localeProbe(true); const content = child("Content");
        const view = own(OverflowScroller({ locale: locale.locale, children: [content] })); document.body.append(view.element);
        const scrollBy = vi.fn(); view.viewport.scrollBy = scrollBy;
        expect(() => view.destroy()).toThrow("unsubscribe"); const markup = view.element.outerHTML;
        view.update({ label: "late" }); view.setContent(["late"]); view.refresh(); view.scrollNext(); view.scrollPrevious(); locale.emit(); vi.runAllTimers();
        expect(view.element.outerHTML).toBe(markup); expect(view.isDestroyed()).toBe(true);
        expect(content.destroy).toHaveBeenCalledOnce(); expect(scrollBy).not.toHaveBeenCalled(); expect(view.element.isConnected).toBe(false);
    });

    it("cleans children and subscriptions after initial label resolution fails", () => {
        const content = child("Owned"); const probe = localeProbe();
        expect(() => OverflowScroller({ children: [content], locale: { ...probe.locale, t() { throw new Error("label"); } } })).toThrow("label");
        expect(content.destroy).toHaveBeenCalledOnce(); expect(probe.unsubscribe).toHaveBeenCalledOnce();
    });

    it("disconnects an owner-window observer after partial setup failure", () => {
        const disconnect = vi.fn(); let observations = 0;
        vi.stubGlobal("ResizeObserver", class { observe() { if (++observations === 2) throw new Error("observe"); } disconnect = disconnect; });
        const content = child("Owned");
        expect(() => OverflowScroller({ children: [content] })).toThrow("observe");
        expect(disconnect).toHaveBeenCalledOnce(); expect(content.destroy).toHaveBeenCalledOnce();
    });

    it("keeps a newer label update requested by a locale resolver", () => {
        const view = own(OverflowScroller()); let nested = false;
        view.update({ locale: { t(key) {
            if (!nested) { nested = true; view.update({ previousLabel: "Latest previous", nextLabel: "Latest next" }); }
            return key;
        } } });
        expect(view.previousButton.getAttribute("aria-label")).toBe("Latest previous");
        expect(view.nextButton.getAttribute("aria-label")).toBe("Latest next");
    });
});

describe("Route chrome failed construction", () => {
    it("cleans an existing navigation if a later search resolver fails", () => {
        const leading: ReturnType<typeof child>[] = [];
        expect(() => createRouteChrome({ routes, navigation: { leadingContent() { const content = child("Lead"); leading.push(content); return content; } },
            search: { searchItemsOptions: { getLabel() { throw new Error("search labels"); } } } })).toThrow("search labels");
        expect(leading).toHaveLength(2); expect(leading.every(item => item.destroy.mock.calls.length === 1)).toBe(true);
    });

    it("cleans route siblings on header failure without consuming untouched shell content", () => {
        const before = child("Before"); const locale = localeProbe();
        expect(() => createAppRouteChrome({ routes, navigation: { locale: locale.locale }, beforeOutlet: before,
            header: { language: false, theme: false, brand: { get name(): string { throw new Error("brand"); } } } })).toThrow("brand");
        expect(before.destroy).not.toHaveBeenCalled(); expect(locale.unsubscribe).toHaveBeenCalledTimes(2);
    });

    it("cleans generated controls when a renderer hook fails before mounting", () => {
        const locale = localeProbe(); const before = child("Before"); const hook = vi.fn(() => { throw new Error("hook"); });
        const render = createLinkAppRouteChromeRenderer({ options: { routes, header: false,
            navigation: { locale: locale.locale }, beforeOutlet: before, navigationReturnLink: { text: "Return" } }, onCreate: hook });
        expect(() => render({ route: routes[0]! } as LinkRoutedAppContext<typeof routes[number]>)).toThrow("hook");
        expect(locale.unsubscribe).toHaveBeenCalledTimes(2); expect(before.destroy).not.toHaveBeenCalled();
    });

    it("also cleans generated hash chrome when its renderer hook fails", () => {
        const locale = localeProbe();
        const hashRoutes = routes.map(route => ({ ...route, render: () => "" }));
        const render = createHashAppRouteChromeRenderer({ options: { routes: hashRoutes, header: false, navigation: { locale: locale.locale } },
            onCreate() { throw new Error("hash hook"); } });
        expect(() => render({ route: hashRoutes[0]!, router: {} } as HashRoutedAppContext<typeof hashRoutes[number]>)).toThrow("hash hook");
        expect(locale.unsubscribe).toHaveBeenCalledTimes(2);
    });

    it("preserves native anchor activation from an iframe realm", () => {
        const iframe = document.createElement("iframe"); document.body.append(iframe);
        const anchor = iframe.contentDocument!.createElement("a"); anchor.href = "#two";
        const event = new MouseEvent("click", { cancelable: true }); Object.defineProperty(event, "target", { value: anchor });
        const assign = vi.fn();
        expect(activateLinkAppRoute({ route: routes[1]!, event }, { ownerWindow: { location: { assign } } as unknown as Window })).toBe(true);
        expect(assign).not.toHaveBeenCalled(); expect(event.defaultPrevented).toBe(false);
    });

    it("preserves native activation from an iframe SVG child of a link", () => {
        const iframe = document.createElement("iframe"); document.body.append(iframe);
        const anchor = iframe.contentDocument!.createElement("a"); anchor.href = "#two";
        const svg = iframe.contentDocument!.createElementNS("http://www.w3.org/2000/svg", "svg"); anchor.append(svg);
        const event = new MouseEvent("click", { cancelable: true }); Object.defineProperty(event, "target", { value: svg });
        const assign = vi.fn();
        activateLinkAppRoute({ route: routes[1]!, event }, { ownerWindow: { location: { assign } } as unknown as Window });
        expect(assign).not.toHaveBeenCalled(); expect(event.defaultPrevented).toBe(false);
    });
});
