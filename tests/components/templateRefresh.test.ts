import { afterEach, describe, expect, it, vi } from "vitest";
import { AppShell, P, createHashRoutedApp, createLinkRoutedApp, createPublicStaticAppTemplate, createPublicHashAppTemplate, createPublicLinkAppTemplate } from "../../packages/components/src";
import { discardPreparedContent } from "../../packages/components/src/composition/preparedContent";
import type { HashRoutedAppChrome, HashRoutedAppContext } from "../../packages/components/src/routed-app";

const cleanups: Array<() => void> = [];
afterEach(() => { for (const cleanup of cleanups.splice(0).reverse()) { try { cleanup(); } catch { /* Deliberate failure fixtures. */ } } vi.restoreAllMocks(); });
const child = (text: string, destroy = vi.fn()) => ({ element: Object.assign(document.createElement("p"), { textContent: text }), destroy });
const quiet = { scroll: false, focusTarget: null, announcement: false } as const;

describe("Prepared content handoff", () => {
    it("does not destroy current or previously transferred outlet content twice", () => {
        const first = child("First"); const next = child("Next"); const fresh = child("Fresh");
        const shell = AppShell({ content: first }); cleanups.push(shell.destroy);
        shell.outlet.render(next, quiet);
        discardPreparedContent(shell, [first, next, fresh, fresh]);
        expect(first.destroy).toHaveBeenCalledOnce(); expect(next.destroy).not.toHaveBeenCalled(); expect(fresh.destroy).toHaveBeenCalledOnce();
        discardPreparedContent(shell, fresh); expect(fresh.destroy).toHaveBeenCalledOnce();
        shell.destroy(); discardPreparedContent(shell, [first, next]); expect(next.destroy).toHaveBeenCalledOnce();
    });

    it("attempts every abandoned cleanup and records it before invoking callbacks", () => {
        const shell = AppShell(); cleanups.push(shell.destroy);
        const first = child("First"); const failure = new Error("Cleanup failed");
        const second = child("Second", vi.fn(() => { discardPreparedContent(shell, second); throw failure; }));
        expect(() => discardPreparedContent(shell, [first, second])).toThrow(failure);
        expect(first.destroy).toHaveBeenCalledOnce(); expect(second.destroy).toHaveBeenCalledOnce();
    });

    it("does not materialize abandoned elements", () => {
        const shell = AppShell(); cleanups.push(shell.destroy); const destroy = vi.fn();
        const element = vi.fn(() => { throw new Error("Element read"); });
        discardPreparedContent(shell, { get element(): HTMLElement { return element(); }, destroy });
        expect(element).not.toHaveBeenCalled(); expect(destroy).toHaveBeenCalledOnce();
    });

    it("disposes pending AppShell update regions after reentrant replacement", () => {
        const current = child("Current"); const discarded = child("Discarded"); const newest = child("Newest");
        let shell: ReturnType<typeof AppShell>;
        shell = AppShell({ header: child("Old", vi.fn(() => shell.setFooter(newest))), footer: current }); cleanups.push(shell.destroy);
        shell.update({ header: child("New header"), footer: discarded });
        expect(shell.element.querySelector("footer")?.textContent).toBe("Newest");
        expect(discarded.destroy).toHaveBeenCalledOnce(); expect(newest.destroy).not.toHaveBeenCalled();
    });
});

describe("Static template refresh revisions", () => {
    it.each(["fresh", "current", "previous"] as const)("discards an obsolete content result (%s) without touching the latest tree", result => {
        const initial = child("Initial"); const latest = child("Latest"); const abandoned = child("Abandoned");
        let phase = "initial"; let app: ReturnType<typeof createPublicStaticAppTemplate>;
        const log = vi.fn();
        app = createPublicStaticAppTemplate({ diagnostics: { page: false, log, logOnCreate: false, logOnRefresh: true }, content: () => {
            if (phase === "outer") {
                phase = "inner"; app.refresh({ shell: false });
                return result === "fresh" ? abandoned : result === "current" ? latest : initial;
            }
            return phase === "initial" ? initial : latest;
        } }); cleanups.push(app.destroy);
        phase = "outer"; app.refresh({ shell: false });
        expect(app.shell.outlet.element.textContent).toBe("Latest"); expect(latest.destroy).not.toHaveBeenCalled();
        expect(initial.destroy).toHaveBeenCalledOnce(); expect(abandoned.destroy).toHaveBeenCalledTimes(result === "fresh" ? 1 : 0);
        expect(log).toHaveBeenCalledOnce();
    });

    it("releases content returned after its resolver destroys the app", () => {
        let stop = false; let app: ReturnType<typeof createPublicStaticAppTemplate>;
        const late = child("Late"); const log = vi.fn();
        app = createPublicStaticAppTemplate({ diagnostics: { page: false, log, logOnCreate: false }, content: () => {
            if (stop) { app.destroy(); return late; } return P("Initial");
        } }); cleanups.push(app.destroy);
        stop = true; app.refresh({ shell: false, diagnostics: true });
        expect(app.isDestroyed()).toBe(true); expect(late.destroy).toHaveBeenCalledOnce(); expect(log).not.toHaveBeenCalled();
    });

    it.each(["refresh", "destroy"] as const)("stops later slot/content resolvers after a header callback calls %s", action => {
        let phase = "initial"; let app: ReturnType<typeof createPublicStaticAppTemplate>;
        const abandoned = child("Abandoned"); const latest = child("Latest");
        const calls: string[] = [];
        app = createPublicStaticAppTemplate({ diagnostics: false, content: () => { calls.push(`${phase}:content`); return P(phase); }, shell: {
            header: () => {
                calls.push(`${phase}:header`);
                if (phase === "outer") { phase = "inner"; if (action === "refresh") app.refresh(); else app.destroy(); return abandoned; }
                return latest;
            }, footer: () => { calls.push(`${phase}:footer`); return P("Footer"); }
        } }); cleanups.push(app.destroy);
        calls.length = 0; phase = "outer"; app.refresh();
        expect(calls).toEqual(action === "refresh" ? ["outer:header", "inner:header", "inner:footer", "inner:content"] : ["outer:header"]);
        expect(abandoned.destroy).toHaveBeenCalledOnce();
        if (action === "refresh") expect(latest.destroy).not.toHaveBeenCalled();
    });

    it("preserves active reused slots and the original error when a later factory fails", () => {
        const retained = child("Retained"); const abandoned = child("Abandoned", vi.fn(() => { throw new Error("Cleanup failed"); }));
        const error = new Error("Resolver failed"); let fail = false;
        const app = createPublicStaticAppTemplate({ diagnostics: false, content: P("Content"), shell: {
            header: () => retained, navigation: () => fail ? abandoned : null,
            footer: () => { if (fail) throw error; return null; }
        } }); cleanups.push(app.destroy);
        fail = true; expect(() => app.refresh()).toThrow(error);
        expect(retained.destroy).not.toHaveBeenCalled(); expect(abandoned.destroy).toHaveBeenCalledOnce();
    });

    it("stops obsolete content and logging after header cleanup starts a new refresh", () => {
        let phase = "initial"; let app: ReturnType<typeof createPublicStaticAppTemplate>;
        const old = child("Old", vi.fn(() => { if (phase === "outer") { phase = "inner"; app.refresh(); } }));
        const staleHeader = child("Stale"); const staleFooter = child("Stale footer"); const log = vi.fn();
        const content = vi.fn(() => P(phase));
        app = createPublicStaticAppTemplate({ diagnostics: { page: false, log, logOnCreate: false, logOnRefresh: true }, content,
            shell: { header: () => phase === "initial" ? old : phase === "outer" ? staleHeader : P("Latest header"),
                footer: () => phase === "outer" ? staleFooter : P("Footer") } }); cleanups.push(app.destroy);
        content.mockClear(); phase = "outer"; app.refresh();
        expect(app.shell.outlet.element.textContent).toBe("inner"); expect(content).toHaveBeenCalledOnce(); expect(log).toHaveBeenCalledOnce();
        expect(staleHeader.destroy).toHaveBeenCalledOnce(); expect(staleFooter.destroy).toHaveBeenCalledOnce();
    });

    it("does not evaluate identity after an obsolete shell resolver", () => {
        let phase = "initial"; let app: ReturnType<typeof createPublicStaticAppTemplate>;
        const identity = vi.fn(() => null);
        app = createPublicStaticAppTemplate({ diagnostics: false, identity, content: P("Content"), shell: () => {
            if (phase === "outer") { phase = "inner"; app.refresh({ content: false }); }
            return { title: phase };
        } }); cleanups.push(app.destroy);
        identity.mockClear(); phase = "outer"; app.refresh({ content: false });
        expect(identity).toHaveBeenCalledOnce(); expect(document.title).toBe("inner");
    });

    it("stops after a title resolver replaces the refresh", () => {
        let phase = "initial"; let app: ReturnType<typeof createPublicStaticAppTemplate>;
        const calls: string[] = [];
        app = createPublicStaticAppTemplate({ diagnostics: false, content: P("Content"), shell: {
            title: () => { if (phase === "outer") { phase = "inner"; app.refresh({ content: false }); return "Stale title"; } return phase; },
            footer: () => { calls.push(phase); return P(phase); }
        } }); cleanups.push(app.destroy);
        calls.length = 0; phase = "outer"; app.refresh({ content: false });
        expect(document.title).toBe("inner"); expect(calls).toEqual(["inner"]);
    });
});

const routes = [{ id: "first", title: "First", href: "/first", render: () => P("First") }, { id: "second", title: "Second", href: "/second", render: () => P("Second") }];
describe.each(["hash", "link"] as const)("%s routed refresh revisions", kind => {
    function create(renderChrome: (context: Pick<HashRoutedAppContext<typeof routes[number]>, "shell" | "refreshChrome">) => HashRoutedAppChrome<typeof routes[number]> | null) {
        const app = kind === "hash" ? createHashRoutedApp({ routes, renderChrome, start: false })
            : createLinkRoutedApp({ routes, current: "first", renderChrome });
        cleanups.push(app.destroy); return app;
    }

    it.each(["refresh", "destroy"] as const)("discards a renderer result after nested %s", action => {
        let phase = "initial"; const late = child("Late"); const latest = child("Latest"); const setCurrent = vi.fn();
        let app: ReturnType<typeof create>;
        app = create(context => {
            if (phase === "outer") {
                phase = "inner"; if (action === "refresh") context.refreshChrome(); else app.destroy();
                return { header: late, currentRouteControls: [{ setCurrent }] };
            }
            return { header: latest };
        });
        phase = "outer"; app.refreshChrome();
        if (action === "refresh") {
            expect(app.shell.element.querySelector("header")?.textContent).toBe("Latest"); expect(latest.destroy).not.toHaveBeenCalled();
            expect(late.destroy).toHaveBeenCalledOnce(); expect(setCurrent).not.toHaveBeenCalled();
        } else {
            expect(app.shell.isDestroyed()).toBe(true);
            expect(late.destroy).toHaveBeenCalledOnce();
        }
    });

    it("keeps an active result returned again by an obsolete renderer", () => {
        let phase = "initial"; const latest = child("Latest");
        const app = create(context => {
            if (phase === "outer") { phase = "inner"; context.refreshChrome(); }
            return { header: latest };
        }); phase = "outer"; app.refreshChrome();
        expect(latest.destroy).not.toHaveBeenCalled(); app.destroy(); expect(latest.destroy).toHaveBeenCalledOnce();
    });

    it("drops remaining old slots when cleanup refreshes the chrome", () => {
        let phase = "initial"; let app: ReturnType<typeof create>;
        const old = child("Old", vi.fn(() => { if (phase === "outer") { phase = "inner"; app.refreshChrome(); } }));
        const staleHeader = child("Stale header"); const staleFooter = child("Stale footer");
        app = create(() => ({ header: phase === "initial" ? old : phase === "outer" ? staleHeader : P("Latest header"),
            footer: phase === "outer" ? staleFooter : P("Latest footer") }));
        phase = "outer"; app.refreshChrome();
        expect(app.shell.element.querySelector("footer")?.textContent).toBe("Latest footer");
        expect(staleHeader.destroy).toHaveBeenCalledOnce(); expect(staleFooter.destroy).toHaveBeenCalledOnce();
    });

    it("releases shell content overridden by a direct chrome slot", () => {
        const ignored = child("Ignored"); const shown = child("Shown");
        const app = create(() => ({ shell: { header: ignored }, header: shown }));
        expect(ignored.destroy).toHaveBeenCalledOnce(); expect(shown.destroy).not.toHaveBeenCalled();
        app.refreshChrome(); expect(ignored.destroy).toHaveBeenCalledOnce();
    });

    it("does not bind obsolete controls after a nested refresh from setCurrent", () => {
        let phase = "initial"; let app: ReturnType<typeof create>;
        const stale = vi.fn(); const latest = vi.fn();
        app = create(() => ({ currentRouteControls: phase === "outer" ? [
            { setCurrent() { phase = "inner"; app.refreshChrome(); } }, { setCurrent: stale }
        ] : [{ setCurrent: latest }] }));
        latest.mockClear(); phase = "outer"; app.refreshChrome();
        expect(stale).not.toHaveBeenCalled(); expect(latest).toHaveBeenCalled();
    });

    it("does not run the old refresh's route/metadata phase after a newer chrome refresh", () => {
        let phase = "initial"; const app = create(context => {
            if (phase === "outer") { phase = "inner"; context.refreshChrome(); }
            return null;
        });
        const render = kind === "hash" ? vi.spyOn((app as ReturnType<typeof createHashRoutedApp>).router, "refresh")
            : vi.spyOn(app.shell, "updateMetadata");
        phase = "outer"; app.refresh(); expect(render).not.toHaveBeenCalled();
    });
});

describe("Routed binding lifetime", () => {
    it.each(["render", "cleanup"] as const)("keeps hash controls usable after route-only reentry during %s", phase => {
        let nested = false; let app: ReturnType<typeof createHashRoutedApp<typeof routes[number]>>;
        const setCurrent = vi.fn();
        const old = child("Old", vi.fn(() => { if (nested && phase === "cleanup") { nested = false; app.refresh({ chrome: false, route: false }); } }));
        let first = true;
        app = createHashRoutedApp({ routes, start: false, renderChrome() {
            if (nested && phase === "render") { nested = false; app.refresh({ chrome: false, route: false }); }
            const header = first ? old : P("New"); first = false;
            return { header, currentRouteControls: [{ setCurrent }] };
        } }); cleanups.push(app.destroy);
        nested = true; app.refreshChrome(); setCurrent.mockClear();
        app.router.navigate("second", { ...quiet, updateHistory: false });
        expect(setCurrent).toHaveBeenCalledWith(routes[1]);
    });

    it.each(["render", "cleanup"] as const)("keeps link controls usable after route-only reentry during %s", phase => {
        let nested = false; let app: ReturnType<typeof createLinkRoutedApp<typeof routes[number]>>;
        const setCurrent = vi.fn();
        const old = child("Old", vi.fn(() => { if (nested && phase === "cleanup") { nested = false; app.refresh({ current: "second", chrome: false }); } }));
        let first = true;
        app = createLinkRoutedApp({ routes, current: "first", renderChrome() {
            if (nested && phase === "render") { nested = false; app.refresh({ current: "second", chrome: false }); }
            const header = first ? old : P("New"); first = false;
            return { header, currentRouteControls: [{ setCurrent }] };
        } }); cleanups.push(app.destroy);
        nested = true; app.refreshChrome(); setCurrent.mockClear();
        app.refresh({ current: "first", chrome: false }); expect(setCurrent).toHaveBeenCalledWith(routes[0]);
    });

    it("keeps hash route controls active across a route-only refresh", () => {
        const setCurrent = vi.fn();
        const app = createHashRoutedApp({ routes, start: false, renderChrome: () => ({ currentRouteControls: [{ setCurrent }] }) }); cleanups.push(app.destroy);
        app.refresh({ chrome: false, route: false }); setCurrent.mockClear();
        app.router.navigate("second", { ...quiet, updateHistory: false });
        expect(setCurrent).toHaveBeenCalledWith(routes[1]);
    });

    it("does not apply old link metadata after its resolver switches routes", () => {
        let switchRoute = false; let app: ReturnType<typeof createLinkRoutedApp<typeof routes[number]>>;
        app = createLinkRoutedApp({ routes, current: "first", routeMetadata: { getTitle(route) {
            if (switchRoute && route.id === "first") { switchRoute = false; app.refresh({ current: "second", chrome: false }); }
            return route.title;
        } } }); cleanups.push(app.destroy);
        switchRoute = true; app.refresh({ current: "first", chrome: false });
        expect(document.title).toBe("Second"); expect(app.getCurrentRoute()?.id).toBe("second");
    });

    it("cleans a link shell if initial location matching fails", () => {
        const value = child("Initial"); const error = new Error("Match failed");
        expect(() => createLinkRoutedApp({ routes, shell: { content: value }, location: "https://fixture.test/first",
            matchLocation: { getHref() { throw error; } } })).toThrow(error);
        expect(value.destroy).toHaveBeenCalledOnce();
    });

    it("preserves a newer link route selected inside location matching", () => {
        let nested = false; let app: ReturnType<typeof createLinkRoutedApp<typeof routes[number]>>;
        app = createLinkRoutedApp({ routes, current: "first", matchLocation: { getHref(route) {
            if (nested) { nested = false; app.refresh({ current: "second", chrome: false }); }
            return route.href;
        } } }); cleanups.push(app.destroy);
        nested = true; app.refresh({ location: "https://fixture.test/first", chrome: false });
        expect(app.getCurrentRoute()?.id).toBe("second"); expect(document.title).toBe("Second");
    });

    it("retains a new link control state after a route-only nested refresh", () => {
        let nested = false; let app: ReturnType<typeof createLinkRoutedApp<typeof routes[number]>>;
        const calls: Array<string | null> = [];
        app = createLinkRoutedApp({ routes, current: "first", renderChrome: () => ({ currentRouteControls: [
            { setCurrent() { if (nested) { nested = false; app.refresh({ current: "second", chrome: false }); } } },
            { setCurrent(route) { calls.push(typeof route === "object" ? route?.id ?? null : route ?? null); } }
        ] }) }); cleanups.push(app.destroy);
        calls.length = 0; nested = true; app.refresh({ current: "first", chrome: false });
        expect(calls).toEqual(["second"]);
    });

    it("does not retain a stale hash subscription after navigation binding reenters", () => {
        let phase = "initial"; let app: ReturnType<typeof createHashRoutedApp<typeof routes[number]>>;
        app = createHashRoutedApp({ routes, start: false, renderChrome: () => ({ navigationControl: { setCurrent() {
            if (phase === "outer") { phase = "inner"; app.refreshChrome(); }
        } } }) }); cleanups.push(app.destroy);
        const subscribe = app.router.subscribe.bind(app.router); let live = 0;
        vi.spyOn(app.router, "subscribe").mockImplementation(handler => {
            live += 1; const remove = subscribe(handler); let removed = false;
            return () => { if (!removed) { live -= 1; removed = true; } remove(); };
        });
        phase = "outer"; app.refreshChrome(); expect(live).toBe(1);
        app.destroy(); expect(live).toBe(0);
    });

    it.each(["hash", "link"] as const)("does not rerun overridden %s shell slot factories during chrome refresh", kind => {
        const factory = vi.fn(() => P("Template header")); const explicit = null;
        const options = { routes, diagnostics: false as const, shell: { header: factory },
            routeChrome: { header: false as const, navigation: false as const, breadcrumbs: false as const, shell: { header: explicit } } };
        const app = kind === "hash" ? createPublicHashAppTemplate({ ...options, start: false })
            : createPublicLinkAppTemplate({ ...options, current: "first" }); cleanups.push(app.destroy);
        factory.mockClear(); app.refreshChrome(); expect(factory).not.toHaveBeenCalled();
    });
});
