import {
    describe,
    expect,
    it
} from "vitest";
import { Button } from "../../../packages/components/src/button";
import {
    Container,
    Grid,
    Group,
    Panel,
    Row,
    Section,
    Stack
} from "../../../packages/components/src/composition";
import { Screen } from "../../../packages/components/src/screen";

describe("Page composition contracts", () => {
    it("adds semantics to Section and Group without turning layout primitives into landmarks", () => {
        const section = Section({
            id: "lesson-overview",
            title: "Lesson overview",
            headingLevel: 3,
            children: ["Lesson content."]
        });
        const group = Group(
            { label: "Lesson controls" },
            "Control content."
        );
        const container = Container(
            {
                maxWidth: "72rem",
                gutter: "1rem"
            },
            Panel(
                Row("Previous", "Next"),
                Stack("Title", "Description"),
                Grid(
                    {
                        columns: 2,
                        minColumnWidth: "16rem",
                        gap: "1rem"
                    },
                    "First card",
                    "Second card"
                )
            )
        );

        document.body.append(section.element, group.element, container.element);

        const heading = section.element.querySelector("h3");
        const panel = container.element.querySelector<HTMLElement>(
            "[data-af-composition=\"panel\"]"
        );
        const row = container.element.querySelector<HTMLElement>(
            "[data-af-layout=\"row\"]"
        );
        const stack = container.element.querySelector<HTMLElement>(
            "[data-af-layout=\"stack\"]"
        );
        const grid = container.element.querySelector<HTMLElement>(
            "[data-af-layout=\"grid\"]"
        );

        expect(section.element.localName).toBe("section");
        expect(heading?.textContent).toBe("Lesson overview");
        expect(section.element.getAttribute("aria-labelledby"))
            .toBe("lesson-overview-title");

        expect(group.element.localName).toBe("div");
        expect(group.element.getAttribute("role")).toBe("group");
        expect(group.element.getAttribute("aria-label")).toBe("Lesson controls");

        expect(container.element.localName).toBe("div");
        expect(container.element.getAttribute("role")).toBeNull();
        expect(container.element.getAttribute("data-af-layout")).toBe("container");
        expect(container.element.style.getPropertyValue("--af-container-max-width"))
            .toBe("72rem");
        expect(container.element.style.getPropertyValue("--af-container-gutter"))
            .toBe("1rem");

        expect(panel?.localName).toBe("div");
        expect(panel?.getAttribute("role")).toBeNull();
        expect(row?.getAttribute("role")).toBeNull();
        expect(stack?.getAttribute("role")).toBeNull();
        expect(grid?.getAttribute("role")).toBeNull();
        expect(grid?.style.getPropertyValue("--af-grid-columns"))
            .toBe("repeat(2, minmax(0, 1fr))");
        expect(grid?.style.getPropertyValue("--af-grid-min"))
            .toBe("16rem");
        expect(grid?.style.getPropertyValue("--af-grid-gap"))
            .toBe("1rem");
    });

    it("keeps Screen structured, quiet by default, and focusable on demand", () => {
        const screen = Screen({
            title: "Lesson settings",
            description: "Choose how this lesson should behave.",
            headingLevel: 1,
            actions: Button({
                text: "Save settings",
                variant: "primary"
            }),
            children: "Setting controls.",
            footer: "Changes apply to future practice sessions.",
            defaultFocusTarget: "body"
        });

        document.body.append(screen.element);

        expect(screen.element.localName).toBe("section");
        expect(screen.title.localName).toBe("h1");
        expect(screen.element.getAttribute("aria-labelledby"))
            .toBe(screen.title.id);
        expect(screen.description.hidden).toBe(false);
        expect(screen.element.getAttribute("aria-describedby")).toBeNull();
        expect(screen.body.hidden).toBe(false);
        expect(screen.actions.hidden).toBe(false);
        expect(screen.footer.hidden).toBe(false);
        expect(screen.getFocusTarget()).toBe(screen.body);

        expect(screen.focus()).toBe(true);
        expect(document.activeElement).toBe(screen.body);

        screen.update({ descriptionMode: "aria" });

        expect(screen.element.getAttribute("aria-describedby"))
            .toBe(screen.description.id);

        screen.setBody(null);

        expect(screen.body.hidden).toBe(true);
        expect(screen.getFocusTarget("body")).toBe(screen.title);

        screen.destroy();
    });
});
