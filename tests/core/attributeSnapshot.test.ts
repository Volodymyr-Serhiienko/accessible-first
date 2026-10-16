import { describe, expect, it } from "vitest";
import { createAttributeSnapshot } from "../../packages/core/src/dom";

describe("attribute snapshot release", () => {
    it("restores one element and releases ownership of later author changes", () => {
        const first = document.createElement("div");
        const second = document.createElement("div");
        first.setAttribute("role", "note");
        const snapshot = createAttributeSnapshot();
        for (const element of [first, second]) { snapshot.remember(element, "role"); element.setAttribute("role", "option"); }
        snapshot.restoreElement(first);
        expect(first.getAttribute("role")).toBe("note");
        expect(second.getAttribute("role")).toBe("option");
        first.setAttribute("role", "article");
        snapshot.restore();
        expect(first.getAttribute("role")).toBe("article");
        expect(second.hasAttribute("role")).toBe(false);
    });
    it("can capture an element again after release, using its new author attributes", () => {
        const element = document.createElement("div");
        const snapshot = createAttributeSnapshot();
        snapshot.remember(element, "hidden"); element.hidden = true;
        snapshot.restoreElement(element);
        element.setAttribute("hidden", "until-found");
        snapshot.remember(element, "hidden"); element.hidden = false;
        snapshot.restore();
        expect(element.getAttribute("hidden")).toBe("until-found");
        snapshot.restoreElement(element);
    });
});
