import { describe, expect, it } from "vitest";
import { createAppRouteChrome } from "../../../packages/components/src/route-chrome";

describe("createAppRouteChrome", () => {
    it("appends custom before-outlet content after generated breadcrumbs", () => {
        const route = {
            id: "lessons",
            title: "Lessons",
            href: "#lessons"
        };
        const chrome = createAppRouteChrome({
            routes: [route],
            current: route,
            header: false,
            navigation: false,
            breadcrumbs: {
                label: "Current location"
            },
            beforeOutlet: "Speech synthesis is unavailable."
        });

        expect(Array.isArray(chrome.beforeOutlet)).toBe(true);

        if (!Array.isArray(chrome.beforeOutlet)) {
            throw new Error("Expected composed before-outlet content.");
        }

        expect(chrome.beforeOutlet[0]).toBe(chrome.routeChrome.breadcrumbs);
        expect(chrome.beforeOutlet[1]).toBe("Speech synthesis is unavailable.");
    });

    it("keeps custom before-outlet content when a route has no breadcrumbs", () => {
        const chrome = createAppRouteChrome({
            routes: [],
            header: false,
            navigation: false,
            breadcrumbs: false,
            beforeOutlet: "Speech synthesis is unavailable."
        });

        expect(chrome.beforeOutlet).toBe("Speech synthesis is unavailable.");
    });
});
