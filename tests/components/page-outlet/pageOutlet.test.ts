import {
    afterEach,
    describe,
    expect,
    it,
    vi
} from "vitest";
import {
    H2
} from "../../../packages/components/src/composition";
import {
    PageOutlet
} from "../../../packages/components/src/page-outlet";

function getLiveRegionText(): string[] {
    return [
        ...document.querySelectorAll<HTMLElement>("[aria-live]")
    ].map((region) => region.textContent ?? "");
}

afterEach(() => {
    vi.useRealTimers();
});

describe("PageOutlet", () => {
    it("focuses the first heading without a duplicate default announcement", () => {
        const outlet = PageOutlet({
            title: "Lesson library",
            documentTitle: "Lesson library | Study Languages",
            scrollOnRender: false
        });

        document.body.append(outlet.element);
        outlet.render(H2("Lesson library"));

        const heading = outlet.element.querySelector("h2");

        expect(document.title).toBe("Lesson library | Study Languages");
        expect(heading).not.toBeNull();
        expect(document.activeElement).toBe(heading);
        expect(document.querySelectorAll("[data-af-live-region]"))
            .toHaveLength(0);

        outlet.destroy();
    });

    it("announces the screen title when no focus route is selected", () => {
        vi.useFakeTimers();

        const outlet = PageOutlet({
            title: "Lesson library",
            scrollOnRender: false
        });

        document.body.append(outlet.element);
        outlet.render(H2("Lesson library"), {
            focusTarget: null
        });

        vi.advanceTimersByTime(50);

        expect(document.activeElement).not.toBe(outlet.element);
        expect(getLiveRegionText()).toContain("Lesson library");

        outlet.destroy();

        expect(document.querySelectorAll("[data-af-live-region]"))
            .toHaveLength(0);
    });
});
