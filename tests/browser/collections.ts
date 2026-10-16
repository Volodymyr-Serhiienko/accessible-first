import "../../packages/components/src/styles/index.css";
import { Button, DropdownMenu, Listbox, Menu, Row, Section, Stack, Tabs } from "../../packages/components/src";
import { createMenu } from "../../packages/core/src/menu";

const app = document.querySelector<HTMLElement>("#app")!;
app.style.cssText = "max-width: 48rem; margin: auto; padding: 1rem;";
const title = document.createElement("h1");
title.textContent = "AF Collection Contracts";
const items = ["Alpha", "Beta", "Gamma"].map((label) => ({ value: label, label }));
const menu = Menu({ orientation: "horizontal", announceOnHover: false, items, attributes: { "aria-label": "Commands" } });
const list = Listbox({ orientation: "horizontal", label: "Choices", announceOnHover: false, items });
const tabs = Tabs({ activationMode: "manual", announceOnHover: false,
    items: items.map((item) => ({ value: item.value, tab: item.label, panel: `${item.label} panel` })) });
const coreRoot = document.createElement("div");
coreRoot.setAttribute("aria-label", "Core commands");
const coreItems = items.map((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = item.label;
    coreRoot.append(button);
    return button;
});
const core = createMenu(coreRoot, { getItems: () => coreItems });
const vertical = Menu({ orientation: "vertical", announceOnHover: false, items, attributes: { "aria-label": "Vertical commands" } });
const dropdown = DropdownMenu({ trigger: "Choose context", value: "Beta", items });
const report = document.createElement("pre");
report.id = "report";
report.style.whiteSpace = "pre-wrap";
const roots = [menu.element, list.element, tabs.tablist];
const middle = [menu.items[1]!.item, list.items[1]!.option, tabs.items[1]!.tab, coreItems[1]!, dropdown.menu.items[1]!.item];
function refresh(): void { menu.refresh(); list.refresh(); tabs.refresh(); core.refresh(); }
const actions = Row(
    Button({ text: "Hide middle items", onPress() { for (const item of middle) item.hidden = true; refresh(); } }),
    Button({ text: "Show middle items", onPress() { for (const item of middle) item.hidden = false; refresh(); } }),
    Button({ text: "Toggle direction", onPress() { app.dir = app.dir === "rtl" ? "ltr" : "rtl"; } }),
    Button({ text: "Inspect collections", onPress() {
        report.textContent = JSON.stringify({
            direction: getComputedStyle(menu.element).direction,
            menu: menu.getCurrentValue(), list: list.getSelectedValues(), tab: tabs.getCurrentValue(),
            tabStops: roots.map((root) => Array.from(root.querySelectorAll<HTMLElement>('[tabindex="0"]')).map((item) => item.textContent)),
            coreDisabled: coreItems.map((item) => item.getAttribute("aria-disabled"))
        }, null, 2);
    } })
);
app.append(title, actions.element, Stack(
    Section({ title: "Menu", children: [menu] }),
    Section({ title: "Listbox", children: [list] }),
    Section({ title: "Tabs", children: [tabs] }),
    Section({ title: "Vertical menu", children: [vertical] }),
    Section({ title: "Context dropdown", children: [dropdown] }),
    Section({ title: "Detached enhancement", children: [coreRoot] })
).element, report);
