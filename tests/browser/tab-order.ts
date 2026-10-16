import "../../packages/components/src/styles/index.css";
import { Button, Combobox, Dialog, RadioGroup } from "../../packages/components/src";
import { isVisible } from "../../packages/core/src/dom";
import { createFocusTrap, getFocusableElements } from "../../packages/core/src/focus";

const app = document.querySelector<HTMLElement>("#app")!;
app.style.cssText = "max-width: 48rem; margin: auto; padding: 1rem;";
const title = document.createElement("h1");
title.textContent = "AF Native Tab Contracts";
const report = document.createElement("pre");
report.id = "report";
report.style.whiteSpace = "pre-wrap";

function button(text: string, action?: () => void): HTMLButtonElement {
    const item = document.createElement("button");
    item.type = "button";
    item.textContent = text;
    if (action) item.addEventListener("click", action);
    return item;
}

function fixture(name: string, content: string): HTMLElement {
    const section = document.createElement("section");
    const heading = document.createElement("h2");
    heading.textContent = name;
    const container = document.createElement("div");
    container.id = name;
    container.innerHTML = content;
    const trap = createFocusTrap(container);
    const start = button(`Activate ${name}`, () => trap.activate());
    const stop = button(`Deactivate ${name}`, () => trap.deactivate());
    section.append(heading, start, container, stop);
    app.append(section);
    return container;
}

function nativeFixture(name: string, content: string): HTMLElement {
    const section = document.createElement("section");
    const heading = document.createElement("h2");
    heading.textContent = name;
    const container = document.createElement("div");
    container.id = name;
    container.innerHTML = content;
    section.append(heading, button(`Before ${name}`), container, button(`After ${name}`));
    app.append(section);
    return container;
}

app.append(title);
const positive = fixture("positive", '<button tabindex="0">Zero</button><button tabindex="2">Two</button><button tabindex="1">One</button><button tabindex="2">Two later</button>');
const checked = fixture("checked", '<label><input type="radio" name="checked" checked>Checked first</label><label><input type="radio" name="checked">Unchecked last</label>');
const unchecked = fixture("unchecked", '<label><input type="radio" name="unchecked">Empty first</label><label><input type="radio" name="unchecked">Empty last</label>');
fixture("empty", '<p>No controls here</p>');
nativeFixture("disabled-checked", '<label><input type="radio" name="disabled-checked" checked disabled>Disabled checked</label><label><input type="radio" name="disabled-checked">Enabled unchecked</label>');
nativeFixture("negative-checked", '<label><input type="radio" name="negative-checked" checked tabindex="-1">Negative checked</label><label><input type="radio" name="negative-checked">Zero unchecked</label>');
nativeFixture("hidden-checked", '<label hidden><input type="radio" name="hidden-checked" checked>Hidden checked</label><label><input type="radio" name="hidden-checked">Visible unchecked</label>');
nativeFixture("native-unchecked", '<label><input type="radio" name="native-unchecked">Native first</label><label><input type="radio" name="native-unchecked">Native last</label>');
const availability = document.createElement("section");
availability.innerHTML = '<h2>Availability</h2><details><summary>Closed summary</summary><button>Closed child</button><details open><summary>Nested summary</summary><button>Nested child</button></details></details><div style="content-visibility:hidden"><button>Skipped child</button></div><div hidden="until-found"><button>Until found child</button></div><div style="visibility:hidden"><button style="visibility:visible">Visible override</button></div><button>Available child</button>';
app.append(availability);
const run = button("Inspect candidates", () => {
    const describe = (element: HTMLElement): string => element.textContent?.trim() || element.closest("label")?.textContent?.trim() || element.tagName;
    const fallbackVisibility = Array.from(availability.querySelectorAll<HTMLElement>("button,summary")).map((element) => {
        Object.defineProperty(element, "checkVisibility", { configurable: true, value: undefined });
        try { return { text: describe(element), visible: isVisible(element) }; }
        finally { Reflect.deleteProperty(element, "checkVisibility"); }
    });
    report.textContent = JSON.stringify({
        positive: getFocusableElements(positive).map(describe),
        checked: getFocusableElements(checked).map(describe),
        unchecked: getFocusableElements(unchecked).map(describe),
        availability: Array.from(availability.querySelectorAll<HTMLElement>("button,summary")).map((element) => ({
            text: describe(element), visible: isVisible(element), rects: element.getClientRects().length,
            nativeVisible: element.checkVisibility?.({ visibilityProperty: true })
        })),
        fallbackVisibility
    }, null, 2);
});
app.append(run, report);

const group = RadioGroup({ label: "Dialog choice", defaultValue: "a", items: [
    { value: "a", label: "Choice A" }, { value: "b", label: "Choice B" }
] });
const combo = Combobox({ label: "Dialog filter", items: [
    { value: "one", label: "Option one" }, { value: "two", label: "Option two" }
] });
const child = Dialog({ trigger: "Open nested dialog", title: "Nested dialog", children: [Button({ text: "Nested action" })] });
const composed = Dialog({ trigger: "Open form dialog", title: "Form dialog", children: [group, combo, child] });
const textOnly = Dialog({ trigger: "Open text dialog", title: "Text dialog", hideCloseButton: true, children: ["Only text"] });
app.append(composed.element, textOnly.element);
