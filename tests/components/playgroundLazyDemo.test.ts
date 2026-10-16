import { afterEach, describe, expect, it, vi } from "vitest";
import { createLazyDemo } from "../../playground/demo/lazyDemo";
import { playgroundLocale } from "../../playground/demo/localization";
import { playgroundRoutes } from "../../playground/demo/routes";
import { P, type ComposedNode } from "../../packages/components/src";

const views: ComposedNode[] = [];
afterEach(() => { views.splice(0).reverse().forEach(view => view.destroy?.()); playgroundLocale.setLocale("en"); });

describe("Playground lazy demo ownership", () => {
    it("keeps localized loading text separate from English demo content", async () => {
        playgroundLocale.setLocale("uk");
        const view = createLazyDemo(async () => () => P("English demo"))(); views.push(view);
        expect(view.element.querySelector("[lang=uk]")?.textContent).toBe("Завантаження деморозділу...");
        await vi.waitFor(() => expect(view.element.dataset.afLazyState).toBe("ready"));
        expect(view.element.querySelector("[lang=en]")?.textContent).toBe("English demo");
    });

    it("shows localized failure with an explicit document reload, not an import retry loop", async () => {
        playgroundLocale.setLocale("ru");
        const load = vi.fn().mockRejectedValue(new Error("Offline"));
        const view = createLazyDemo(load)(); views.push(view); document.body.append(view.element);
        await vi.waitFor(() => expect(view.element.dataset.afLazyState).toBe("error"));
        const reload = view.element.querySelector("button")!;
        expect(reload.textContent).toBe("Обновить страницу"); expect(reload.closest("[lang]")?.getAttribute("lang")).toBe("ru");
        reload.focus(); expect(document.activeElement).toBe(reload);
        expect(load).toHaveBeenCalledOnce();
    });

    it("does not instantiate a demo whose route was destroyed before import completed", async () => {
        let resolve!: (factory: () => ComposedNode) => void;
        const factory = vi.fn(() => P("Obsolete"));
        const view = createLazyDemo(() => new Promise(yes => { resolve = yes; }))(); views.push(view);
        view.destroy?.(); resolve(factory); await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
        expect(factory).not.toHaveBeenCalled();
    });

    it.each(playgroundRoutes)("loads the $id section with owned English content", async route => {
        const view = route.render(); views.push(view); document.body.append(view.element);
        if (route.id !== "markup") await vi.waitFor(() => expect(view.element.dataset.afLazyState).toBe("ready"), { timeout: 10000 });
        const demo = route.id === "markup" ? view.element : view.element.querySelector("[lang=en]");
        expect(demo?.getAttribute("lang")).toBe("en");
        expect(demo?.textContent?.trim().length).toBeGreaterThan(10);
    });
});
