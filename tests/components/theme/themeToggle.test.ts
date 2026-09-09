import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi
} from "vitest";
import {
    ThemeToggle
} from "../../../packages/components/src/theme";

const announcementDelay = 50;

function createTarget(theme: "light" | "dark" = "light"): HTMLElement {
    const target = document.createElement("div");

    if (theme === "dark") {
        target.setAttribute("data-af-theme", "dark");
    }

    document.body.append(target);

    return target;
}

describe("ThemeToggle", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("reflects the initial theme, toggles it, and announces the completed change", () => {
        const changes: Array<{
            theme: string;
            previousTheme: string;
        }> = [];
        const target = createTarget("dark");
        const toggle = ThemeToggle({
            target,
            toDarkLabel: "Use dark theme",
            toLightLabel: "Use light theme",
            announcement(detail) {
                return `${detail.theme} theme activated`;
            },
            onThemeChange(detail) {
                changes.push({
                    theme: detail.theme,
                    previousTheme: detail.previousTheme
                });
            }
        });

        document.body.append(toggle.element);

        expect(toggle.getTheme()).toBe("dark");
        expect(toggle.element.textContent).toBe("Use light theme");
        expect(toggle.element.getAttribute("data-af-theme-toggle-theme"))
            .toBe("dark");
        expect(toggle.element.getAttribute("data-af-selected")).toBe("true");

        toggle.element.click();

        expect(toggle.getTheme()).toBe("light");
        expect(target.hasAttribute("data-af-theme")).toBe(false);
        expect(toggle.element.textContent).toBe("Use dark theme");
        expect(toggle.element.getAttribute("data-af-theme-toggle-theme"))
            .toBe("light");
        expect(toggle.element.hasAttribute("data-af-selected")).toBe(false);
        expect(changes).toEqual([
            {
                theme: "light",
                previousTheme: "dark"
            }
        ]);

        vi.advanceTimersByTime(announcementDelay);

        const politeText = [
            ...document.querySelectorAll<HTMLElement>('[aria-live="polite"]')
        ].map((region) => region.textContent);

        expect(politeText).toContain("light theme activated");

        toggle.destroy();

        expect(document.querySelectorAll("[data-af-live-region]"))
            .toHaveLength(0);
    });

    it("keeps switch semantics synchronized with external theme changes", async () => {
        const target = createTarget();
        const toggle = ThemeToggle({
            target,
            display: "switch",
            switchLabel: "Color scheme",
            announcement: false
        });

        document.body.append(toggle.element);

        expect(toggle.element.getAttribute("role")).toBe("switch");
        expect(toggle.element.getAttribute("aria-checked")).toBe("false");
        expect(toggle.element.textContent).toContain("Color scheme");

        target.setAttribute("data-af-theme", "dark");

        await Promise.resolve();

        expect(toggle.getTheme()).toBe("dark");
        expect(toggle.element.getAttribute("aria-checked")).toBe("true");
        expect(toggle.element.getAttribute("data-af-theme-toggle-theme"))
            .toBe("dark");

        toggle.destroy();

        expect(document.querySelectorAll("[data-af-live-region]"))
            .toHaveLength(0);
    });
});
