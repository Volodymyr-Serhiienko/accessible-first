import { describe, expect, it } from "vitest";
import { createComponentLifecycle } from "../../packages/components/src/foundation";

describe("component disposal", () => {
    it("runs all reverse-order cleanups and restores attributes after a failure", () => {
        const element = document.createElement("div");
        element.setAttribute("data-af-component", "original");
        element.setAttribute("data-af-state", "original");
        const lifecycle = createComponentLifecycle(element, { name: "fixture" });
        const events: number[] = [];
        lifecycle.addCleanup(() => { events.push(1); });
        lifecycle.addCleanup(() => { events.push(2); throw new Error("cleanup failed"); });
        lifecycle.addCleanup(() => { events.push(3); });
        expect(() => lifecycle.destroy()).toThrow("cleanup failed");
        expect(events).toEqual([3, 2, 1]);
        expect(lifecycle.isDestroyed()).toBe(true);
        expect(element.getAttribute("data-af-component")).toBe("original");
        expect(element.getAttribute("data-af-state")).toBe("original");
        expect(() => lifecycle.destroy()).not.toThrow();
        expect(events).toEqual([3, 2, 1]);
    });
});
