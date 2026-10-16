import { describe, expect, it } from "vitest";
import { captureInlineStyles } from "../../packages/core/src/dom/captureInlineStyles";

describe("Borrowed inline styles", () => {
    it("restores missing declarations once without erasing later styles", () => {
        const element = document.createElement("div");
        const restore = captureInlineStyles(element, ["left"]);
        element.style.left = "3px";
        element.style.color = "red";
        restore();
        expect(element.style.left).toBe("");
        expect(element.style.color).toBe("red");
        element.style.left = "7px";
        restore();
        expect(element.style.left).toBe("7px");
    });
});
