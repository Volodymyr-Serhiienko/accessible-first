import { afterEach, describe, expect, it, vi } from "vitest";
import { PageOutlet } from "../../../packages/components/src/page-outlet";
import { createHashRouter, type HashRouter, type HashRouterOptions, type HashRouterRoute } from "../../../packages/components/src/routing";

const quiet = { scroll: false, focusTarget: null, announcement: false } as const;
const cleanups: Array<() => void> = [];
const originalTitle = document.title;
const child = (text: string, destroy = vi.fn()) => ({ element: Object.assign(document.createElement("p"), { textContent: text }), destroy });
afterEach(() => {
    for (const cleanup of cleanups.splice(0).reverse()) { try { cleanup(); } catch { /* Deliberate failure fixtures. */ } }
    vi.restoreAllMocks(); window.history.replaceState(null, "", "/"); document.body.replaceChildren(); document.title = originalTitle;
});

function setup(extra: Partial<HashRouterOptions<HashRouterRoute>> = {}) {
    const outlet = PageOutlet({ scrollOnRender: false }); document.body.append(outlet.element);
    outlet.element.scrollIntoView = vi.fn();
    const routes: HashRouterRoute[] = ["first", "second", "third"].map(id => ({ id, title: id, render: vi.fn(() => child(id)) }));
    const router = createHashRouter({ routes, outlet, ...extra });
    cleanups.push(outlet.destroy, router.stop);
    return { outlet, routes, router };
}

describe("HashRouter callback reentry", () => {
    it.each(["metadata", "title", "announcement"] as const)("stops old preparation after nested navigation from %s", phase => {
        let router: HashRouter<HashRouterRoute>;
        const reenter = (route: HashRouterRoute) => { if (route.id === "first") router.navigate("second", quiet); };
        const metadata = vi.fn(); const inspect = vi.fn();
        const result = setup({
            getDocumentMetadata(route) { if (phase === "metadata") reenter(route); return { title: route.title }; },
            getDocumentTitle(route) { if (phase === "title") reenter(route); return route.title; },
            getAnnouncement(route) { if (phase === "announcement") reenter(route); return false; },
            updateDocumentMetadata: metadata, inspect
        }); router = result.router;
        expect(router.navigate("first", { scroll: false, focusTarget: null })).toBe(false);
        expect(router.getCurrentRoute().id).toBe("second"); expect(result.outlet.element.textContent).toBe("second");
        expect(result.routes[0]!.render).toHaveBeenCalledTimes(phase === "announcement" ? 1 : 0); expect(document.title).toBe("second");
        expect(metadata).toHaveBeenCalledExactlyOnceWith({ title: "second" }); expect(inspect).toHaveBeenCalledOnce();
    });

    it.each(["fresh", "current", "previous"] as const)("discards obsolete render results (%s) exactly once", kind => {
        const initial = child("Initial"); const latest = child("Latest"); const unused = child("Unused");
        const { router, outlet, routes } = setup();
        routes[2]!.render = () => initial; router.navigate("third", quiet);
        routes[1]!.render = () => latest;
        routes[0]!.render = () => { router.navigate("second", quiet); return kind === "fresh" ? [unused, unused] : kind === "current" ? latest : initial; };
        expect(router.navigate("first", quiet)).toBe(false);
        expect(outlet.element.textContent).toBe("Latest"); expect(latest.destroy).not.toHaveBeenCalled();
        expect(initial.destroy).toHaveBeenCalledOnce(); expect(unused.destroy).toHaveBeenCalledTimes(kind === "fresh" ? 1 : 0);
        outlet.destroy(); expect(latest.destroy).toHaveBeenCalledOnce();
    });

    it("lets cleanup of an obsolete result start the final transition", () => {
        const { router, outlet, routes } = setup();
        const unused = child("Unused", vi.fn(() => router.navigate("third", quiet)));
        routes[0]!.render = () => { router.navigate("second", quiet); return unused; };
        expect(router.navigate("first", quiet)).toBe(false);
        expect(router.getCurrentRoute().id).toBe("third"); expect(outlet.element.textContent).toBe("third"); expect(unused.destroy).toHaveBeenCalledOnce();
    });

    it("discards every unaccepted result even when cleanup throws", () => {
        const { router, routes } = setup(); const failure = new Error("Cleanup failed");
        const first = child("First"); const second = child("Second", vi.fn(() => { throw failure; }));
        routes[0]!.render = () => { router.stop(); return [first, second]; };
        expect(() => router.navigate("first", quiet)).toThrow(failure);
        expect(first.destroy).toHaveBeenCalledOnce(); expect(second.destroy).toHaveBeenCalledOnce();
    });

    it("keeps the original render error and does not claim never-returned resources", () => {
        const failure = new Error("Render failed"); const ownedByCallback = child("Unreturned");
        const { router, routes } = setup(); routes[0]!.render = () => { throw failure; };
        expect(() => router.navigate("first", quiet)).toThrow(failure); expect(ownedByCallback.destroy).not.toHaveBeenCalled();
    });

    it("preserves render-before-announcement order and the original error while releasing prepared content", () => {
        const order: string[] = []; const failure = new Error("Announcement failed");
        const first = child("First"); const second = child("Second", vi.fn(() => { throw new Error("Cleanup failed"); }));
        const { router, routes, outlet } = setup({ getAnnouncement() { order.push("announcement"); throw failure; } });
        routes[0]!.render = () => { order.push("render"); return [first, second]; };
        expect(() => router.navigate("first", { scroll: false, focusTarget: null })).toThrow(failure);
        expect(order).toEqual(["render", "announcement"]); expect(outlet.element.textContent).toBe("");
        expect(first.destroy).toHaveBeenCalledOnce(); expect(second.destroy).toHaveBeenCalledOnce();
    });

    it.each(["navigate", "refresh"] as const)("uses the incoming route when navigation controls reenter with %s", action => {
        const { router, outlet, routes } = setup(); let armed = true;
        router.setNavigation({ setCurrent(id) {
            if (armed && id === "second") { armed = false; if (action === "navigate") router.navigate("third", quiet); else router.refresh(); }
        } });
        expect(router.navigate("second", quiet)).toBe(false);
        expect(router.getCurrentRoute().id).toBe(action === "navigate" ? "third" : "second");
        expect(outlet.element.textContent).toBe(router.getCurrentRoute().id);
        expect(routes[1]!.render).toHaveBeenCalledTimes(action === "navigate" ? 0 : 1);
    });

    it.each(["pushState", "replaceState"] as const)("does not overwrite a nested transition after %s", method => {
        const { router, outlet } = setup(); const native = window.history[method].bind(window.history); let armed = true;
        vi.spyOn(window.history, method).mockImplementation((data, unused, url) => {
            native(data, unused, url);
            if (armed) { armed = false; router.navigate("second", { ...quiet, updateHistory: true }); }
        });
        expect(router.navigate("first", { ...quiet, updateHistory: true, replaceHistory: method === "replaceState" })).toBe(false);
        expect(window.location.hash).toBe("#second"); expect(outlet.element.textContent).toBe("second");
        expect(router.syncFromLocation(quiet)).toBe(true); expect(router.getCurrentRoute().id).toBe("second");
    });

    it.each(["navigate", "location"] as const)("stops pattern resolution after nested navigation during %s", action => {
        let router: HashRouter<HashRouterRoute>; const laterMatch = vi.fn(() => null);
        const result = setup({ routePatterns: [
            { id: "dynamic", pattern: "dynamic", match(id) { if (id.replace(/^#/, "") !== "dynamic") return null; router.navigate("second", quiet); return { id: "dynamic", title: "Dynamic", render: vi.fn() }; } },
            { id: "later", pattern: "later", match: laterMatch }
        ] }); router = result.router; laterMatch.mockClear();
        if (action === "location") window.history.replaceState(null, "", "#dynamic");
        expect(action === "navigate" ? router.navigate("dynamic", quiet) : router.syncFromLocation(quiet)).toBe(false);
        expect(laterMatch).not.toHaveBeenCalled(); expect(router.getCurrentRoute().id).toBe("second");
    });

    it("resolves a location pattern only once per synchronization", () => {
        const match = vi.fn((id: string) => id === "#dynamic" ? { id: "dynamic", title: "Dynamic", render: () => child("Dynamic") } : null);
        const { router } = setup({ routePatterns: [{ id: "dynamic", pattern: "dynamic", match }] }); match.mockClear();
        window.history.replaceState(null, "", "#dynamic"); router.syncFromLocation(quiet);
        expect(match).toHaveBeenCalledExactlyOnceWith("#dynamic");
    });

    it.each(["onRouteChange", "subscriber", "metadata", "inspect"] as const)("stops stale notifications after nested navigation from %s", phase => {
        const calls: string[] = []; let router: HashRouter<HashRouterRoute>;
        const reenter = () => { if (router.getCurrentRoute().id === "first") router.navigate("second", quiet); };
        const result = setup({
            getDocumentMetadata: route => ({ title: route.title }),
            updateDocumentMetadata() { calls.push(`metadata:${router.getCurrentRoute().id}`); if (phase === "metadata") reenter(); },
            onRouteChange(route) { calls.push(`callback:${route.id}`); if (phase === "onRouteChange") reenter(); },
            inspect() { calls.push(`inspect:${router.getCurrentRoute().id}`); if (phase === "inspect") reenter(); }
        }); router = result.router;
        router.subscribe(route => { calls.push(`first:${route.id}`); if (phase === "subscriber") reenter(); });
        router.subscribe(route => calls.push(`last:${route.id}`));
        expect(router.navigate("first", quiet)).toBe(false);
        expect(calls).toContain("last:second"); expect(calls.includes("last:first")).toBe(phase === "inspect");
        expect(calls.filter(call => call === "inspect:second")).toHaveLength(1);
    });

    it("snapshots subscribers before the route callback and respects removals", () => {
        const calls: string[] = []; let router: HashRouter<HashRouterRoute>; let unsubscribe = () => {};
        const late = () => calls.push("late");
        const result = setup({ onRouteChange() { router.subscribe(late); unsubscribe(); } }); router = result.router;
        router.subscribe(() => calls.push("first")); unsubscribe = router.subscribe(() => calls.push("removed"));
        router.navigate("first", quiet); expect(calls).toEqual(["first"]);
        calls.length = 0; router.navigate("second", quiet); expect(calls).toEqual(["first", "late"]);
    });

    it.each([false, true])("refresh is superseded by navigation (notify=%s)", notify => {
        const { router, outlet, routes } = setup(); router.navigate("first", quiet);
        const callback = vi.fn(); router.subscribe(callback); const stale = child("Stale");
        routes[0]!.render = () => { router.navigate("second", quiet); return stale; };
        expect(router.refresh({ notify })).toBe(false); expect(outlet.element.textContent).toBe("second");
        expect(stale.destroy).toHaveBeenCalledOnce(); expect(callback).toHaveBeenCalledOnce();
    });

    it("stops same-route focus after a scroll callback navigates", () => {
        const { router, outlet } = setup(); router.navigate("first", quiet);
        vi.spyOn(outlet.element, "scrollIntoView").mockImplementation(() => { router.navigate("second", quiet); });
        const focus = vi.spyOn(outlet, "focus");
        expect(router.navigate("first", { focusTarget: "outlet" })).toBe(false);
        expect(focus).not.toHaveBeenCalled(); expect(outlet.element.textContent).toBe("second");
    });

    it.each(["focus", "announcement", "cleanup"] as const)("stops outlet effects and notifications after %s reentry", phase => {
        const { router, outlet, routes } = setup(); const changed = vi.fn(); router.subscribe(changed);
        routes[2]!.render = () => child("Old", vi.fn(() => { if (phase === "cleanup") router.navigate("second", quiet); }));
        router.navigate("third", quiet); changed.mockClear();
        const focus = vi.fn(() => { router.navigate("second", quiet); return outlet.element; });
        const announcement = vi.fn(() => { router.navigate("second", quiet); return "Obsolete announcement"; });
        expect(router.navigate("first", { scroll: false, focusTarget: phase === "focus" ? focus : null, announcement: phase === "announcement" ? announcement : false })).toBe(false);
        expect(outlet.element.textContent).toBe("second"); expect(changed).toHaveBeenCalledOnce();
        expect(document.activeElement).not.toBe(outlet.element);
    });

    it("stop inside render discards the result but allows later manual navigation", () => {
        const { router, outlet, routes } = setup(); const stale = child("Stale");
        routes[0]!.render = () => { router.stop(); return stale; };
        expect(router.navigate("first", quiet)).toBe(false); expect(stale.destroy).toHaveBeenCalledOnce();
        expect(router.navigate("second", quiet)).toBe(true); expect(outlet.element.textContent).toBe("second");
    });

    it("stop removes listeners, cancels queued effects, and start can be retried", () => {
        const { router, outlet } = setup(); const cancel = vi.spyOn(window, "cancelAnimationFrame");
        router.start({ focusTarget: null }); router.stop(); expect(cancel).toHaveBeenCalled();
        window.history.replaceState(null, "", "#second"); window.dispatchEvent(new HashChangeEvent("hashchange"));
        expect(router.getCurrentRoute().id).toBe("first"); router.start(quiet);
        expect(router.getCurrentRoute().id).toBe("second"); expect(outlet.element.textContent).toBe("second");
    });

    it("a failed start releases listeners and remains retryable", () => {
        const { router, routes, outlet } = setup(); const failure = new Error("Startup failed");
        const remove = vi.spyOn(window, "removeEventListener"); routes[0]!.render = () => { throw failure; };
        expect(() => router.start(quiet)).toThrow(failure);
        expect(remove).toHaveBeenCalledWith("hashchange", expect.any(Function));
        routes[1]!.render = () => child("Recovered"); window.history.replaceState(null, "", "#second"); router.start(quiet);
        expect(outlet.element.textContent).toBe("Recovered");
    });

    it("retries the same route after its renderer failed", () => {
        const { router, routes, outlet } = setup(); routes[0]!.render = () => { throw new Error("Failed"); };
        expect(() => router.start(quiet)).toThrow("Failed");
        routes[0]!.render = () => child("Recovered"); router.start(quiet);
        expect(outlet.element.textContent).toBe("Recovered");
    });

    it("renders a nested activation of the route that is still being prepared", () => {
        const { router, routes, outlet } = setup(); let first = true; const stale = child("Stale");
        routes[0]!.render = () => { if (first) { first = false; router.navigate("first", quiet); return stale; } return child("Final"); };
        expect(router.navigate("first", quiet)).toBe(false); expect(outlet.element.textContent).toBe("Final"); expect(stale.destroy).toHaveBeenCalledOnce();
    });

    it.each(["focus", "announcement"] as const)("stop from %s cancels remaining outlet effects", phase => {
        const { router, outlet } = setup(); const changed = vi.fn(); router.subscribe(changed);
        const focus = vi.fn(() => { router.stop(); return outlet.element; });
        const announcement = vi.fn(() => { router.stop(); return "Obsolete"; });
        const frame = vi.spyOn(window, "requestAnimationFrame");
        expect(router.navigate("first", { scroll: true, focusTarget: phase === "focus" ? focus : null, announcement: phase === "announcement" ? announcement : false })).toBe(false);
        expect(frame).not.toHaveBeenCalled(); expect(changed).not.toHaveBeenCalled(); expect(document.activeElement).not.toBe(outlet.element);
    });

    it("a failed outer start does not stop listeners installed by a nested restart", () => {
        const { router, routes, outlet } = setup();
        routes[0]!.render = () => {
            router.stop(); window.history.replaceState(null, "", "#second"); router.start(quiet); throw new Error("Outer startup failed");
        };
        expect(() => router.start(quiet)).toThrow("Outer startup failed");
        window.history.replaceState(null, "", "#third"); window.dispatchEvent(new HashChangeEvent("hashchange"));
        expect(outlet.element.textContent).toBe("third");
    });

    it("unknown navigation leaves the accepted route and its handlers intact", () => {
        const { router, routes, outlet } = setup(); const destroy = vi.fn(); routes[0]!.render = () => child("Current", destroy);
        router.navigate("first", quiet); expect(router.navigate("unknown", quiet)).toBe(false);
        expect(outlet.element.textContent).toBe("Current"); expect(destroy).not.toHaveBeenCalled();
    });
});
