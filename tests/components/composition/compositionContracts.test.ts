import { describe, expect, it, vi } from "vitest";
import {
    IconLabel,
    P,
    TrustedHtml
} from "../../../packages/components/src/composition";

describe("composition contracts", () => {
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
