import "../../packages/components/src/styles/index.css";
import {
    Button, Grid, Listbox, Menu, Panel, Row, Section, Stack, Tabs,
    type ComposedNode
} from "../../packages/components/src";

interface Check {
    name: string;
    passed: boolean;
    detail: string;
}

interface FocusCase {
    name: string;
    node: ComposedNode;
    items: HTMLElement[];
}

const app = document.querySelector<HTMLElement>("#app")!;
const title = document.createElement("h1");
title.textContent = "AF Style Contracts";
const results = document.createElement("ol");
results.id = "results";
const summary = document.createElement("p");
summary.setAttribute("role", "status");
const fixtures = Stack({ gap: "2rem" }).element;
fixtures.id = "fixtures";
app.style.cssText = "max-width: 48rem; margin: auto; padding: 1rem;";
const hiddenFixtures = document.createElement("div");
const cases: FocusCase[] = [];
const checks: Check[] = [];

function check(name: string, passed: boolean, detail = ""): void {
    checks.push({ name, passed, detail });
}

function addFocusCase(kind: "Listbox" | "Menu", plain: boolean, horizontal: boolean, wideRing: boolean): void {
    const name = `${kind} ${plain ? "plain" : "default"} ${horizontal ? "horizontal" : "vertical"}${wideRing ? " wide ring" : ""}`;
    const options = {
        label: name,
        variant: plain ? "plain" as const : "default" as const,
        orientation: horizontal ? "horizontal" as const : "vertical" as const,
        announceOnHover: false,
        items: Array.from({ length: 6 }, (_, index) => ({ value: `${index}`, label: `Option ${index + 1}` }))
    };
    const node = kind === "Listbox" ? Listbox(options) : Menu(options);
    node.element.setAttribute("aria-label", name);
    const items = Array.from(node.element.querySelectorAll<HTMLElement>("[data-af-listbox-option], [data-af-menu-item]"));
    node.element.style.cssText = "max-width: 100%; max-height: 9rem;";
    if (wideRing) {
        node.element.style.setProperty("--af-focus-ring-width", "6px");
        node.element.style.setProperty("--af-focus-ring-offset", "4px");
    }
    const section = Section({ title: name, children: [node] });
    fixtures.append(section.element);
    cases.push({ name, node, items });
}

for (const kind of ["Listbox", "Menu"] as const) {
    for (const plain of [false, true]) {
        for (const horizontal of [false, true]) {
            for (const wideRing of [false, true]) addFocusCase(kind, plain, horizontal, wideRing);
        }
    }
}

const factories: Array<[string, () => ComposedNode]> = [
    ["Button", () => Button({ text: "Hidden action" })],
    ["Stack", () => Stack(Button({ text: "Hidden action" }))],
    ["Row", () => Row(Button({ text: "Hidden action" }))],
    ["Grid", () => Grid({ columns: 2, children: [Button({ text: "Hidden action" })] })],
    ["Panel", () => Panel(Button({ text: "Hidden action" }))],
    ["Listbox", () => Listbox({ label: "Hidden choices", announceOnHover: false, items: [{ label: "Hidden option" }] })],
    ["Menu", () => Menu({ announceOnHover: false, items: [{ label: "Hidden command" }] })],
    ["Menu item", () => {
        const owner = Menu({ announceOnHover: false, items: [{ label: "Hidden command" }] });
        return { element: owner.items[0]!.item, destroy: () => owner.destroy() };
    }],
    ["Listbox option", () => {
        const owner = Listbox({ announceOnHover: false, items: [{ label: "Hidden option" }] });
        return { element: owner.items[0]!.option, destroy: () => owner.destroy() };
    }],
    ["Tab button", () => {
        const owner = Tabs({ announceOnHover: false, items: [{ tab: "Hidden tab", panel: "Panel" }] });
        return { element: owner.items[0]!.tab, destroy: () => owner.destroy() };
    }]
];

function checkHidden(): void {
    hiddenFixtures.replaceChildren();
    for (const [name, create] of factories) {
        const node = create();
        hiddenFixtures.append(node.element);
        for (const value of ["", "hidden", "false"]) {
            node.element.setAttribute("hidden", value);
            const target = node.element.matches("button, [tabindex]")
                ? node.element
                : node.element.querySelector<HTMLElement>("button, [tabindex]");
            target?.focus({ preventScroll: true });
            check(`${name} hidden=${JSON.stringify(value)}`,
                getComputedStyle(node.element).display === "none"
                    && node.element.getClientRects().length === 0
                    && (!target || document.activeElement !== target),
                `display=${getComputedStyle(node.element).display}`);
        }
        node.element.removeAttribute("hidden");
        check(`${name} revealed`, node.element.getClientRects().length > 0);
        node.destroy?.();
        node.element.remove();
    }

    const untilFound = Stack("Findable content");
    const native = document.createElement("div");
    untilFound.element.setAttribute("hidden", "UnTiL-FoUnD");
    native.setAttribute("hidden", "UnTiL-FoUnD");
    hiddenFixtures.append(untilFound.element, native);
    const actualStyle = getComputedStyle(untilFound.element);
    const nativeStyle = getComputedStyle(native);
    check("hidden=until-found retains browser reveal behavior",
        (actualStyle.display === "none") === (nativeStyle.display === "none")
            && actualStyle.contentVisibility === nativeStyle.contentVisibility);
    untilFound.element.removeAttribute("hidden");
    check("revealed until-found layout is restored", getComputedStyle(untilFound.element).display === "grid");
    untilFound.destroy?.();
    untilFound.element.remove();
    native.remove();

    const unrelated = document.createElement("div");
    unrelated.hidden = true;
    unrelated.style.display = "grid";
    hiddenFixtures.append(unrelated);
    check("AF does not override unrelated author display styles", getComputedStyle(unrelated).display === "grid");
    unrelated.remove();
}

function checkFocus(test: FocusCase): void {
    const root = test.node.element;
    root.scrollTo(0, 0);
    const edges = [test.items[0], test.items[test.items.length - 1]];
    for (const [index, item] of edges.entries()) {
        if (!item) continue;
        item.focus({ preventScroll: true });
        item.scrollIntoView({ block: "nearest", inline: "nearest" });
        const style = getComputedStyle(item);
        const ring = parseFloat(style.outlineWidth) + parseFloat(style.outlineOffset);
        const box = root.getBoundingClientRect();
        const itemBox = item.getBoundingClientRect();
        const left = box.left + root.clientLeft;
        const top = box.top + root.clientTop;
        const tolerance = 0.75;
        const gaps = [itemBox.left - left, left + root.clientWidth - itemBox.right,
            itemBox.top - top, top + root.clientHeight - itemBox.bottom];
        check(`${test.name} ${index === 0 ? "first" : "last"} focus clearance`,
            document.activeElement === item && item.matches(":focus-visible")
                && ring > 0 && gaps.every((gap) => gap + tolerance >= ring),
            `ring=${ring}; clearance=${gaps.map((gap) => gap.toFixed(1)).join(",")}`);
    }
}

const run = Button({
    text: "Run checks",
    onPress() {
        checks.length = 0;
        checkHidden();
        for (const test of cases) checkFocus(test);
        check("No horizontal document overflow", document.documentElement.scrollWidth <= innerWidth);
        results.replaceChildren(...checks.map((result) => {
            const item = document.createElement("li");
            item.dataset.passed = `${result.passed}`;
            item.textContent = `${result.passed ? "PASS" : "FAIL"}: ${result.name}${result.detail ? ` (${result.detail})` : ""}`;
            item.style.color = result.passed ? "var(--af-color-fg)" : "var(--af-color-danger)";
            return item;
        }));
        const failed = checks.filter((result) => !result.passed).length;
        summary.textContent = `${checks.length - failed}/${checks.length} passed; ${failed} failed.`;
        document.documentElement.dataset.testResult = failed ? "failed" : "passed";
        run.element.focus();
        run.element.scrollIntoView({ block: "start" });
    }
});

const theme = Button({
    text: "Dark theme",
    onPress() {
        const dark = document.documentElement.dataset.afTheme !== "dark";
        document.documentElement.dataset.afTheme = dark ? "dark" : "light";
        theme.setText(dark ? "Light theme" : "Dark theme");
    }
});
const direction = Button({
    text: "Switch to RTL",
    onPress() {
        const rtl = document.documentElement.dir !== "rtl";
        document.documentElement.dir = rtl ? "rtl" : "ltr";
        direction.setText(rtl ? "Switch to LTR" : "Switch to RTL");
    }
});
const actions = Row(run, theme, direction);
app.append(title, actions.element, summary, results, hiddenFixtures, fixtures);
