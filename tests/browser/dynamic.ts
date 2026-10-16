import "../../packages/components/src/styles/index.css";
import { Button, Navigation, Table } from "../../packages/components/src";
import { addPageHideCleanup } from "../../packages/core/src/events";

const app = document.querySelector<HTMLElement>("#app")!;
app.style.cssText = "max-width:48rem;margin:auto;padding:1rem;font:16px/1.5 sans-serif";
const heading = document.createElement("h1");
heading.textContent = "AF Dynamic Table And Navigation";
const summary = document.createElement("p");
summary.setAttribute("role", "status");
const report = document.createElement("ol");
const nav = document.createElement("nav");
nav.setAttribute("aria-label", "Audit navigation");
const navigation = Navigation({ items: [
    { id: "records", label: "Records", href: "#records" },
    { id: "settings", label: "Settings and preferences", href: "#settings" }
], onNavigate(detail, owner) {
    detail.event.preventDefault();
    owner.setCurrent(detail.item.id!);
} });
nav.append(navigation.element);
const table = Table({ caption: "Audit records", description: "Two sample records", columns: [
    { id: "name", header: "Name", sortable: true, rowHeader: true },
    { id: "level", header: "Level" }
], rows: [{ name: "Alpha", level: 1 }, { name: "Beta", level: 2 }],
rowOptions: row => ({ attributes: { tabindex: "0", "aria-label": `${row.name}, level ${row.level}` } }),
onSortChange(sort) {
    table.update({ sort, rows: sort.direction === "descending"
        ? [{ name: "Beta", level: 2 }, { name: "Alpha", level: 1 }]
        : [{ name: "Alpha", level: 1 }, { name: "Beta", level: 2 }] });
} });

const run = Button({ text: "Run dynamic checks", onPress() {
    const results: Array<{ name: string; passed: boolean }> = [];
    const check = (name: string, passed: boolean) => results.push({ name, passed });
    const button = table.head.querySelector<HTMLButtonElement>("button")!;
    button.focus();
    table.update({ rows: [{ name: "Gamma", level: 3 }], sort: { columnId: "name", direction: "descending" } });
    check("Updating rows preserves the focused sort button", document.activeElement === button);
    check("Confirmed sorting stays on the native column header", table.headerCells[0]!.element.getAttribute("aria-sort") === "descending");
    const row = table.bodyRows[0]!.element;
    row.focus();
    table.setEmptyState("No records");
    check("Empty-state copy does not replace populated rows or their focus", table.bodyRows[0]!.element === row && document.activeElement === row);
    const item = navigation.items[0]!;
    item.link.element.focus();
    navigation.setCurrent("records");
    check("Current-route changes retain the native focused link", document.activeElement === item.link.element && item.isCurrent());
    check("Rows retain native row and row-header semantics", row.localName === "tr" && row.querySelector("th")?.scope === "row");
    table.update({ columns: [{ id: "name", header: "Name", sortable: true, rowHeader: true }, { id: "level", header: "Level" }],
        rows: [{ name: "Alpha", level: 1 }, { name: "Beta", level: 2 }] });
    check("Column and row replacement commits the new data together", table.bodyRows.length === 2 && table.body.textContent === "Alpha1Beta2");

    let disposed = 0;
    const canceled = { element: document.createElement("span"), destroy() { disposed += 1; } };
    const old = { element: document.createElement("span"), destroy() { probe.setRows([{ value: "Newest" }]); } };
    const probe = Table<{ value: string | typeof old }>({ caption: "Cleanup probe", columns: [{ id: "value", header: "Value" }], rows: [{ value: old }] });
    probe.setRows([{ value: canceled }]);
    check("Reentrant cleanup keeps newer rows and releases canceled content", probe.body.textContent === "Newest" && disposed === 1);
    probe.destroy();
    check("Page width stays inside the viewport", document.documentElement.scrollWidth <= innerWidth);
    report.replaceChildren(...results.map(result => {
        const row = document.createElement("li");
        row.dataset.passed = String(result.passed);
        row.textContent = `${result.passed ? "PASS" : "FAIL"}: ${result.name}`;
        return row;
    }));
    summary.textContent = `${results.filter(result => result.passed).length}/${results.length} dynamic checks passed`;
} });
app.append(heading, nav, run.element, table.element, summary, report);
addPageHideCleanup(window, () => { run.destroy(); table.destroy(); navigation.destroy(); });
