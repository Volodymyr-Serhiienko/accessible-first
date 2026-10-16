import { describe, expect, it } from "vitest";
import { createFormField } from "../../packages/core/src/form-field";
import { createControlHint } from "../../packages/components/src/foundation";
import { createTooltip } from "../../packages/components/src/tooltip/createTooltip";
import { isHTMLElement } from "../../packages/core/src/dom";

const ids = (element: Element, attribute = "aria-describedby") => element.getAttribute(attribute)?.split(/\s+/).filter(Boolean) ?? [];

describe("Field relationship ownership", () => {
    it("preserves authored and later descriptions when changing or destroying a field", () => {
        const input = document.createElement("input");
        input.setAttribute("aria-describedby", "author");
        const field = createFormField(input, { description: "field" });
        expect(ids(input)).toEqual(["author", "field"]);
        input.setAttribute("aria-describedby", `${input.getAttribute("aria-describedby")} later`);
        field.setDescription("replacement");
        expect(ids(input)).toEqual(["author", "later", "replacement"]);
        field.destroy();
        expect(ids(input)).toEqual(["author", "later"]);
        field.update({ description: "late" });
        expect(ids(input)).toEqual(["author", "later"]);
    });

    it("does not resurrect an authored description deliberately removed externally", () => {
        const input = document.createElement("input");
        input.setAttribute("aria-describedby", "author");
        const field = createFormField(input, { description: "field" });
        input.setAttribute("aria-describedby", "field later");
        field.destroy();
        expect(ids(input)).toEqual(["later"]);
    });

    it("shares identical owned ids until the final owner releases them", () => {
        const input = document.createElement("input");
        const first = createFormField(input, { description: "shared" });
        const second = createFormField(input, { description: ["shared", "second"] });
        first.destroy();
        expect(ids(input)).toEqual(["shared", "second"]);
        second.destroy();
        expect(input.hasAttribute("aria-describedby")).toBe(false);
    });

    it("keeps description and error relationships independent and does not repeat errors in both", () => {
        const input = document.createElement("input");
        input.setAttribute("aria-errormessage", "author-error");
        const field = createFormField(input, { description: "help", errorMessage: "error", invalid: true });
        field.setDescription(null);
        expect(input.getAttribute("aria-describedby")).toBeNull();
        expect(ids(input, "aria-errormessage")).toEqual(["author-error", "error"]);
        field.setErrorMessage(null);
        expect(ids(input, "aria-errormessage")).toEqual(["author-error"]);
        field.destroy();
    });

    it("releases replaced native label bindings without deleting shared generated ids", () => {
        const input = document.createElement("input");
        const firstLabel = document.createElement("label");
        const secondLabel = document.createElement("label");
        firstLabel.htmlFor = "original";
        const field = createFormField(input, { label: firstLabel });
        const controlId = input.id;
        expect(firstLabel.htmlFor).toBe(controlId);
        field.setLabel(secondLabel);
        expect(firstLabel.htmlFor).toBe("original");
        secondLabel.htmlFor = "new-author-choice";
        field.destroy();
        expect(secondLabel.htmlFor).toBe("new-author-choice");
        expect(input.id).toBe(controlId);
    });

    it("does not invalidate another field's reference when one controller is destroyed", () => {
        const inputA = document.createElement("input");
        const inputB = document.createElement("input");
        const help = document.createElement("p");
        const first = createFormField(inputA, { description: help });
        const second = createFormField(inputB, { description: help });
        const id = help.id;
        first.destroy();
        expect(help.id).toBe(id);
        expect(ids(inputB)).toEqual([id]);
        second.destroy();
    });

    it("supports native labels in an iframe without redundant aria-labelledby", () => {
        const frame = document.createElement("iframe");
        document.body.append(frame);
        const doc = frame.contentDocument!;
        const input = doc.createElement("input");
        const label = doc.createElement("label");
        const field = createFormField(input, { label });
        expect(label.htmlFor).toBe(input.id);
        expect(input.id).not.toBe("");
        expect(input.hasAttribute("aria-labelledby")).toBe(false);
        field.destroy();
    });

    it("ignores element references from another document without changing them", () => {
        const frame = document.createElement("iframe");
        document.body.append(frame);
        const foreign = frame.contentDocument!.createElement("p");
        const input = document.createElement("input");
        const field = createFormField(input, { description: foreign });
        expect(input.hasAttribute("aria-describedby")).toBe(false);
        expect(foreign.id).toBe("");
        field.destroy();
    });

    it.each(["field-first", "hint-first"] as const)("lets field and hint cleanup coexist: %s", order => {
        const input = document.createElement("input");
        input.setAttribute("aria-describedby", "author");
        document.body.append(input);
        const field = createFormField(input, { description: "field" });
        const hint = createControlHint(input, { hint: "Hint", hintId: "owned-hint" });
        if (order === "field-first") {
            field.destroy();
            expect(ids(input)).toEqual(["author", "owned-hint"]);
            hint.destroy();
        } else {
            hint.destroy();
            expect(ids(input)).toEqual(["author", "field"]);
            field.destroy();
        }
        expect(ids(input)).toEqual(["author"]);
    });

    it("keeps later field relationships when a visual-only hint is destroyed", () => {
        const input = document.createElement("input");
        document.body.append(input);
        const hint = createControlHint(input, { hint: "Hint", hintDisplay: "tooltip" });
        const field = createFormField(input, { description: "field" });
        hint.destroy();
        expect(ids(input)).toEqual(["field"]);
        field.destroy();
    });

    it("lets tooltip updates and disposal preserve a field's description", () => {
        const input = document.createElement("input");
        document.body.append(input);
        const tooltip = createTooltip(input, { text: "Tooltip", describe: true });
        const tooltipId = ids(input)[0]!;
        const field = createFormField(input, { description: "field" });
        tooltip.setText("Updated");
        expect(ids(input)).toEqual([tooltipId, "field"]);
        tooltip.destroy();
        expect(ids(input)).toEqual(["field"]);
        field.destroy();
    });

    it("updates a hint id without keeping its old relationship or losing other help", () => {
        const input = document.createElement("input");
        document.body.append(input);
        const hint = createControlHint(input, { hint: "Hint", hintId: "old-hint" });
        const field = createFormField(input, { description: "field" });
        hint.update({ hintId: "new-hint" });
        expect(ids(input)).toEqual(["new-hint", "field"]);
        expect(document.getElementById("old-hint")).toBeNull();
        hint.destroy();
        field.destroy();
    });

    it("keeps an authored shared id and releases a duplicate contribution only once", () => {
        const input = document.createElement("input");
        input.setAttribute("aria-describedby", "shared");
        const field = createFormField(input, { description: ["shared", "owned", "owned"] });
        expect(ids(input)).toEqual(["shared", "owned"]);
        field.destroy();
        expect(ids(input)).toEqual(["shared"]);
    });

    it("recognizes adopted HTML elements but rejects SVG and structural imitations", () => {
        const frame = document.createElement("iframe");
        document.body.append(frame);
        const adopted = document.adoptNode(frame.contentDocument!.createElement("span"));
        expect(isHTMLElement(adopted)).toBe(true);
        expect(isHTMLElement(document.createElementNS("http://www.w3.org/2000/svg", "svg"))).toBe(false);
        expect(isHTMLElement({ ownerDocument: document, namespaceURI: "http://www.w3.org/1999/xhtml" })).toBe(false);
    });
});
