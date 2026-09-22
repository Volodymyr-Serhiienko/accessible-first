import { afterEach, describe, expect, it } from "vitest";
import { Button } from "../../packages/components/src";

afterEach(() => {
    document.body.replaceChildren();
});

describe("Button composition", () => {
    it("reserves the longest expected label without changing the button text content", () => {
        const button = Button({
            text: "Start",
            reserveText: ["Start", "Continue"]
        });

        document.body.append(button.element);

        expect(button.element.textContent).toBe("Start");
        expect(button.element.getAttribute("data-af-button-reserved-text"))
            .toBe("Continue");

        button.setText("Continue");

        expect(button.element.textContent).toBe("Continue");

        button.update({ reserveText: null });

        expect(button.element.hasAttribute("data-af-button-reserved-text")).toBe(false);

        button.destroy();
    });
});
