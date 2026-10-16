import { describe, expect, it, vi } from "vitest";
import {
    Icon,
    IconLabel,
    Image,
    P,
    TrustedHtml
} from "../../../packages/components/src/composition";

describe("composition contracts", () => {
    it("uses explicit ARIA tokens for decorative images without changing informative alt", () => {
        const decorative = Image({ src: "/logo.svg", decorative: true });
        const informative = Image({ src: "/lesson.png", alt: "Lesson illustration" });

        expect(decorative.element.getAttribute("alt")).toBe("");
        expect(decorative.element.getAttribute("aria-hidden")).toBe("true");
        expect(informative.element.getAttribute("alt")).toBe("Lesson illustration");
        expect(informative.element.hasAttribute("aria-hidden")).toBe(false);
    });

    it("hides decorative SVG and file icons with explicit token values", () => {
        const svg = Icon({ path: "M0 0L1 1", decorative: true });
        const file = Icon({ src: "/save.svg", decorative: true });

        for (const icon of [svg, file]) {
            expect(icon.element.getAttribute("aria-hidden")).toBe("true");
            expect(icon.element.querySelector("svg, img")?.getAttribute("aria-hidden")).toBe("true");
        }
        expect(svg.element.querySelector("svg")?.getAttribute("focusable")).toBe("false");
        expect(file.element.querySelector("img")?.getAttribute("alt")).toBe("");
    });

    it("keeps meaningful icon names on the wrapper without exposing nested artwork", () => {
        const svg = Icon({ path: "M0 0L1 1", title: "Warning" });
        const file = Icon({ src: "/warning.svg", alt: "Warning" });

        for (const icon of [svg, file]) {
            expect(icon.element.getAttribute("role")).toBe("img");
            expect(icon.element.getAttribute("aria-label")).toBe("Warning");
            expect(icon.element.hasAttribute("aria-hidden")).toBe(false);
            expect(icon.element.querySelector("svg, img")?.getAttribute("aria-hidden")).toBe("true");
        }
    });

    it("keeps IconLabel semantic-neutral and cleans up owned icon content", () => {
        const destroyIcon = vi.fn();
        const icon = document.createElement("span");
        const label = IconLabel({
            icon: {
                element: icon,
                destroy: destroyIcon
            },
            label: "Settings",
            iconPosition: "top"
        });
        const button = document.createElement("button");

        button.append(label.element);
        document.body.append(button);

        expect(label.element.getAttribute("data-af-composition"))
            .toBe("icon-label");
        expect(label.element.getAttribute("data-af-icon-label-position"))
            .toBe("top");
        expect(label.element.getAttribute("role")).toBeNull();
        expect(label.element.getAttribute("tabindex")).toBeNull();
        expect(button.textContent).toBe("Settings");

        label.destroy?.();

        expect(destroyIcon).toHaveBeenCalledTimes(1);
    });

    it("keeps ordinary composition text-safe and marks raw markup explicitly", () => {
        const text = P("<strong>Plain text</strong>");
        const trusted = TrustedHtml({
            html: "<strong>Trusted markup</strong>"
        });

        expect(text.element.querySelector("strong")).toBeNull();
        expect(text.element.textContent).toBe("<strong>Plain text</strong>");

        expect(trusted.element.querySelector("strong")?.textContent)
            .toBe("Trusted markup");
    });
});
