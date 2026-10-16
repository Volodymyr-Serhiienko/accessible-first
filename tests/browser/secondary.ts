import "../../packages/components/src/styles/index.css";
import { Breadcrumbs, Button, ListDetail, Pagination } from "../../packages/components/src";
import { addPageHideCleanup } from "../../packages/core/src/events";

const app = document.querySelector<HTMLElement>("#app")!;
app.style.cssText = "display:grid;gap:1rem;max-width:48rem;margin:auto;padding:1rem;font:16px/1.5 sans-serif";
const heading = document.createElement("h1");
heading.textContent = "AF Secondary Composition Audit";
const summary = document.createElement("p");
summary.setAttribute("role", "status");
const report = document.createElement("ol");
const longWord = "LongLocalizedNavigationLabelWithoutSpaces".repeat(3);
const breadcrumbs = Breadcrumbs({ items: [{ label: "Home", href: "#home" }, { label: longWord }] });
const pagination = Pagination({ page: 2, pageCount: 10,
    previousText: "Previous page with a longer translated label", nextText: longWord,
    onPageChange(detail, owner) { owner.setPage(detail.page); } });
const open = Button({ text: "Open detail", onPress() { view.setDetail("Selected record details"); view.focus("detail"); } });
const view = ListDetail({ list: open, empty: "No selection" });
const clear = Button({ text: "Clear detail", onPress() { view.setDetail(null); view.setEmpty(null); view.focus("detail"); } });
const stress = ListDetail({ listLabel: "Long list", detailLabel: "Long detail", variant: "plain", list: longWord, detail: longWord });
const run = Button({ text: "Run secondary checks", onPress() {
    const results: Array<{ name: string; passed: boolean }> = [];
    const check = (name: string, passed: boolean) => results.push({ name, passed });
    const home = breadcrumbs.items[0]!.content;
    home.focus();
    breadcrumbs.update({ separator: ">" });
    check("Separator updates keep the focused native breadcrumb link", document.activeElement === home && breadcrumbs.items[0]!.content === home);
    check("Breadcrumb separator remains hidden from assistive technology", breadcrumbs.items[0]!.separator?.getAttribute("aria-hidden") === "true");
    const next = pagination.items.find(item => item.kind === "next")!.control;
    next.focus();
    pagination.update({ variant: "plain", label: "Result pages" });
    pagination.setPage(pagination.getPage());
    check("Chrome and unchanged page updates keep the focused pagination control", document.activeElement === next && pagination.items.find(item => item.kind === "next")!.control === next);
    check("Current page stays outside normal Tab order", pagination.items.find(item => item.isCurrent())!.control.tabIndex < 0);
    view.setDetail(null);
    view.setEmpty(null);
    check("Hidden detail resolves focus to the list", view.focus("detail") && document.activeElement === view.list && view.detail.hidden === true);
    view.setDetail("Selected record details");
    check("Explicit focus reaches the named detail area", view.focus("detail") && document.activeElement === view.detail && view.detail.tabIndex === -1);
    const bounded = Pagination({ page: 500000, pageCount: 1000000 });
    check("Large page totals keep a bounded visible range", bounded.items.length <= 11);
    bounded.destroy();
    check("Long breadcrumb content fits its container", breadcrumbs.element.scrollWidth <= breadcrumbs.element.clientWidth);
    check("Long pagination labels fit their container", pagination.element.scrollWidth <= pagination.element.clientWidth);
    check("Long list/detail text fits its container", stress.element.scrollWidth <= stress.element.clientWidth);
    check("Document has no horizontal overflow", document.documentElement.scrollWidth <= innerWidth);
    report.replaceChildren(...results.map(result => {
        const row = document.createElement("li");
        row.textContent = `${result.passed ? "PASS" : "FAIL"}: ${result.name}`;
        row.dataset.passed = String(result.passed);
        return row;
    }));
    summary.textContent = `${results.filter(result => result.passed).length}/${results.length} secondary checks passed`;
} });
app.append(heading, run.element, summary, breadcrumbs.element, pagination.element, view.element, clear.element, stress.element, report);
addPageHideCleanup(window, () => { breadcrumbs.destroy(); pagination.destroy(); view.destroy(); clear.destroy(); stress.destroy(); run.destroy(); });
