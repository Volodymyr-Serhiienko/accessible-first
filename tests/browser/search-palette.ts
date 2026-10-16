import "../../packages/components/src/styles/index.css";
import { Button, CommandPalette, RouteCommandPalette, RouteSearchBox, SearchBox, TextField, ThemeToggle } from "../../packages/components/src";
import { addPageHideCleanup, runCleanups } from "../../packages/core/src/events";

const app = document.querySelector<HTMLElement>("#app")!;
app.style.cssText = "max-width:60rem;margin:auto;padding:1rem;font:16px/1.5 sans-serif;display:grid;gap:1rem";
const title = document.createElement("h1"); title.textContent = "AF Search And Palette Audit";
const result = document.createElement("p"); result.setAttribute("role", "status");
const report = document.createElement("ol");
const destination = TextField({ label: "Command destination" });
const long = "LongLocalizedSearchResultWithoutSpaces".repeat(5);
const records = [
    { id: "apple", label: "Apple", description: "Red fruit", keywords: ["food"] },
    { id: "bag", label: "Bag", description: "Carry things" },
    { id: "disabled", label: "Disabled result", disabled: true },
    { id: "long", label: long, description: long }
];
const search = SearchBox({ label: "Search records", items: records, notFoundText: "No records found", width: "100%", maxWidth: "100%",
    onSelect(detail) { result.textContent = `Selected record: ${detail.item.id}`; destination.control.focus(); } });
const palette = CommandPalette({ trigger: "Open audit commands", title: "Audit commands", description: "Choose a local action",
    shortcut: { key: "k", ctrlKey: true, allowInEditable: true },
    items: [{ id: "focus", label: "Focus destination", description: "Move focus to the page input", run() { result.textContent = "Command completed"; destination.control.focus(); } },
        { id: "long", label: long, description: long }] });
const routes = [{ id: "lessons", title: "Lessons", href: "#lessons" }, { id: "settings", title: "Settings", href: "#settings" }];
const routeSearch = RouteSearchBox({ routes, label: "Search routes", onRouteSelect(detail) { result.textContent = `Selected route: ${detail.route.id}`; destination.control.focus(); } });
const routePalette = RouteCommandPalette({ routes, trigger: "Open route commands", title: "Route commands", onRouteSelect(detail) { result.textContent = `Route command: ${detail.route.id}`; destination.control.focus(); } });
const theme = ThemeToggle({ announcement: false });
const run = Button({ text: "Run search checks", onPress() {
    const checks: Array<{ name: string; passed: boolean }> = [];
    const check = (name: string, passed: boolean) => checks.push({ name, passed });
    check("Search input has combobox semantics and a label", search.input.getAttribute("role") === "combobox" && Boolean(search.input.labels?.length));
    search.combobox.setInputValue("food"); search.combobox.open();
    check("Keywords resolve to their result", search.combobox.getVisibleOptions().length === 1 && search.combobox.getVisibleOptions()[0] === search.combobox.items[0]!.option);
    search.combobox.setInputValue("missing-record"); search.combobox.open();
    check("Empty search exposes the configured not-found option", !search.combobox.notFound.hidden && search.combobox.getVisibleOptions().length === 0);
    search.combobox.setInputValue(""); search.combobox.open();
    check("Disabled result cannot become active", !search.combobox.setActiveOption(search.combobox.items[2]!.option));
    const popup = search.listbox.getBoundingClientRect();
    check("Search popup stays inside horizontal viewport bounds", popup.left >= 0 && popup.right <= innerWidth + 1);
    check("Long result label and description wrap without horizontal scrolling", search.listbox.scrollWidth <= search.listbox.clientWidth + 1);
    search.combobox.close();
    const routeOption = routeSearch.combobox.items[0]!.option;
    routeSearch.input.focus(); routeSearch.update({ className: "audit-route-search" });
    check("Route chrome update retains result identity and input focus", routeSearch.combobox.items[0]!.option === routeOption && document.activeElement === routeSearch.input);
    check("Route items retain original route payloads", routeSearch.getItem("lessons")?.data === routes[0] && routePalette.getItems()[1]?.data === routes[1]);
    palette.open();
    check("Palette opens as a named modal", palette.isOpen() && palette.dialogElement.getAttribute("aria-modal") === "true" && Boolean(palette.dialogElement.getAttribute("aria-labelledby")));
    check("Palette initial focus is its search field", document.activeElement === palette.searchBox.input);
    const body = palette.searchBox.element.parentElement!;
    const box = palette.searchBox.element.getBoundingClientRect();
    check("Palette search fills its available body width", Math.abs(box.width - body.clientWidth) <= 2);
    palette.searchBox.combobox.setInputValue(""); palette.searchBox.combobox.open();
    const palettePopup = palette.searchBox.listbox.getBoundingClientRect();
    check("Palette results stay inside horizontal viewport bounds", palettePopup.left >= 0 && palettePopup.right <= innerWidth + 1);
    check("Palette long results wrap without horizontal scrolling", palette.searchBox.listbox.scrollWidth <= palette.searchBox.listbox.clientWidth + 1);
    palette.close();
    check("Closing palette restores its previous focus owner", document.activeElement === routeSearch.input);
    routeSearch.combobox.close(); destination.control.focus();
    check("Document has no horizontal overflow", document.documentElement.scrollWidth <= innerWidth);
    report.replaceChildren(...checks.map(check => { const li = document.createElement("li"); li.textContent = `${check.passed ? "PASS" : "FAIL"}: ${check.name}`; return li; }));
    result.textContent = `${checks.filter(check => check.passed).length}/${checks.length} search checks passed`;
} });
app.append(title, run.element, theme.element, result, search.element, destination.element, palette.element, routeSearch.element, routePalette.element, report);
addPageHideCleanup(window, () => runCleanups([search.destroy, destination.destroy, palette.destroy, routeSearch.destroy, routePalette.destroy, theme.destroy, run.destroy]));
