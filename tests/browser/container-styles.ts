import "../../packages/components/src/styles/index.css";
import {
    Button, DescriptionList, EmptyState, FormSection, H2, Image, InfoCard, ListDetail,
    Panel, ResultSummary, Screen, Section, SettingsGroup, Stack, Table, ThemeToggle,
    type ComposedNode, type CompositionChild
} from "../../packages/components/src";
import { addPageHideCleanup } from "../../packages/core/src/events";

type Check = { name: string; passed: boolean };
const checks: Array<() => Check> = [];
const word = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".repeat(2);
const status = document.createElement("p"); status.setAttribute("role", "status");
const report = document.createElement("ol"); report.style.overflowWrap = "anywhere";
function check(name: string, test: () => boolean): void {
    checks.push(() => ({ name, passed: test() }));
}
function fits(element: HTMLElement, parent: HTMLElement): boolean {
    const a = element.getBoundingClientRect(); const b = parent.getBoundingClientRect();
    return a.left >= b.left - 1 && a.right <= b.right + 1
        && (element.hasAttribute("data-af-table-viewport") || element.scrollWidth <= element.clientWidth + 1);
}
function boundedChild(): HTMLElement {
    const child = document.createElement("div");
    child.style.cssText = "inline-size:20rem;max-inline-size:100%;min-inline-size:0;overflow-wrap:anywhere";
    child.textContent = word;
    return child;
}
function media() {
    return Image({ src: new URL("../../playground/public/assets/logo.svg", import.meta.url).href, alt: "AF fixture logo" });
}
const surfaces: CompositionChild[] = [];
for (const dir of ["ltr", "rtl"] as const) {
    const children: CompositionChild[] = [H2(dir.toUpperCase())];
    let surface: ReturnType<typeof Stack>;
    function sample(name: string, node: ComposedNode, target = node.element): void {
        children.push(node);
        check(`${dir} ${name}: bounded root and content`, () => fits(node.element, surface.element) && fits(target, node.element));
        check(`${dir} ${name}: native hidden`, () => {
            node.element.hidden = true; const hidden = node.element.getClientRects().length === 0;
            node.element.hidden = false; return hidden;
        });
    }
    for (const variant of ["default", "plain"] as const) {
        for (const orientation of ["horizontal", "vertical"] as const) {
            const cardChild = boundedChild();
            const card = InfoCard({ title: word, description: word, meta: word, media: media(),
                orientation, children: cardChild, actions: Button({ text: "Open card" }), variant });
            sample(`${variant} InfoCard ${orientation}`, card, cardChild);
            check(`${dir} ${variant} InfoCard ${orientation}: title and action fit`, () => fits(card.title, card.element) && fits(card.actions, card.element));
        }
        for (const align of ["start", "center"] as const) {
            const emptyChild = boundedChild();
            const empty = EmptyState({ title: word, description: emptyChild, media: media(), align,
                actions: Button({ text: word }), variant });
            sample(`${variant} EmptyState ${align}`, empty, emptyChild);
            check(`${dir} ${variant} EmptyState ${align}: action stays bounded`, () => fits(empty.actions, empty.element));
        }
        const screenChild = boundedChild();
        const screen = Screen({ title: word, description: word, children: screenChild,
            actions: Button({ text: "Screen action" }), footer: word, variant });
        sample(`${variant} Screen`, screen, screenChild);
        const formChild = boundedChild();
        const form = FormSection({ title: word, description: word, children: formChild,
            actions: Button({ text: "Form action" }), variant });
        sample(`${variant} FormSection`, form, formChild);
        const settingsChild = boundedChild();
        const settings = SettingsGroup({ title: word, description: word, children: settingsChild,
            actions: Button({ text: "Settings action" }), variant });
        sample(`${variant} SettingsGroup`, settings, settingsChild);
        for (const layout of ["stacked", "inline"] as const) {
            const listChild = boundedChild();
            const list = DescriptionList({ layout, variant, items: [{ term: word, details: listChild }, { term: word, details: word }] });
            sample(`${variant} DescriptionList ${layout}`, list, listChild);
            check(`${dir} ${variant} DescriptionList ${layout}: native DL/DT/DD`, () => list.element.tagName === "DL"
                && list.items.every(item => item.term.tagName === "DT" && item.details.tagName === "DD"));
        }
        for (const orientation of ["auto", "horizontal", "vertical"] as const) {
            const detailChild = boundedChild();
            const view = ListDetail({ list: word, detail: detailChild, listLabel: `${dir} ${variant} ${orientation} records`,
                detailLabel: `${dir} ${variant} ${orientation} details`, orientation, variant });
            sample(`${variant} ListDetail ${orientation}`, view, detailChild);
            check(`${dir} ${variant} ListDetail ${orientation}: named areas retain semantics`, () => view.list.tagName === "SECTION"
                && Boolean(view.list.getAttribute("aria-label")) && Boolean(view.detail.getAttribute("aria-label")));
        }
    }
    const panelChild = boundedChild(); sample("Panel", Panel({ children: [panelChild] }), panelChild);
    const sectionChild = boundedChild(); sample("Section", Section({ title: word, children: [sectionChild] }), sectionChild);
    const narrow = DescriptionList({ layout: "inline", items: [{ term: "Term", details: "Value" }],
        attributes: { style: "inline-size:7rem;max-inline-size:100%" } });
    sample("narrow embedded DescriptionList", narrow);
    for (const variant of ["default", "muted", "strong"] as const) {
        const summary = ResultSummary({ total: 10, format: () => word, variant });
        sample(`${variant} ResultSummary`, summary);
        check(`${dir} ${variant} ResultSummary: not automatically live`, () => !summary.element.hasAttribute("aria-live") || summary.element.getAttribute("aria-live") === "off");
    }
    for (const variant of ["default", "plain", "striped"] as const) {
        const table = Table({ caption: word, description: word, variant,
            columns: [{ id: "name", header: word, rowHeader: true, sortable: true }, { id: "detail", header: "Details" }],
            rows: [{ name: word, detail: word }, { name: "Second record", detail: "Second details" }],
            rowOptions: row => ({ attributes: { tabindex: "0", "aria-label": row.name } }),
            onSortChange(sort) { table.update({ sort }); } });
        children.push(table);
        check(`${dir} ${variant} Table: description and viewport stay bounded`, () => fits(table.element, surface.element)
            && fits(table.description, table.element) && fits(table.viewport, table.element));
        check(`${dir} ${variant} Table: scrolling stays local`, () => table.viewport.scrollWidth > table.viewport.clientWidth
            && getComputedStyle(table.viewport).overflowX === "auto");
        check(`${dir} ${variant} Table: native headers and row summary`, () => table.table.tagName === "TABLE"
            && table.table.querySelector('th[scope="row"]') !== null && table.table.querySelector('tr[tabindex="0"][aria-label]') !== null);
        check(`${dir} ${variant} Table: long sort label is bounded`, () => {
            const button = table.table.querySelector<HTMLElement>("[data-af-table-sort]")!;
            return fits(button, button.parentElement!);
        });
        const compact = Table({ caption: `${dir} ${variant} compact table`, description: word, responsive: "none", variant,
            columns: [{ id: "name", header: word, sortable: true }], rows: [{ name: word }], onSortChange() {} });
        sample(`${variant} non-scrolling Table`, compact);
        check(`${dir} ${variant} non-scrolling Table: long text wraps`, () => fits(compact.table, compact.viewport));
        const emptyTable = Table({ caption: `${dir} ${variant} empty table`, columns: [{ id: "name", header: "Name" }],
            rows: [], emptyState: word, variant });
        children.push(emptyTable);
        check(`${dir} ${variant} empty Table: local overflow and spanning cell`, () => fits(emptyTable.viewport, surface.element)
            && emptyTable.table.querySelector("td[colspan]")?.textContent === word);
    }
    surface = Stack({ children, attributes: { dir, style: "inline-size:20rem;max-inline-size:100%;padding:0.5rem;box-sizing:border-box" } });
    surfaces.push(surface);
}
check("Page: no horizontal overflow", () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);
const run = Button({ text: "Run container checks", onPress() {
    const results = checks.map(test => test());
    status.textContent = `${results.filter(result => result.passed).length}/${results.length} container checks passed`;
    report.replaceChildren(...results.map(result => { const item = document.createElement("li"); item.textContent = `${result.passed ? "PASS" : "FAIL"}: ${result.name}`; return item; }));
} });
const size = Button({ text: "Toggle enlarged text", onPress() {
    document.documentElement.style.fontSize = document.documentElement.style.fontSize === "32px" ? "16px" : "32px";
} });
const root = Stack({ children: [H2("Container and presentation styles"), ThemeToggle({ announcement: false }), size, run, status, report, ...surfaces],
    attributes: { style: "max-inline-size:56rem;margin:auto;padding:1rem;box-sizing:border-box" } });
document.querySelector("#app")!.append(root.element);
addPageHideCleanup(window, () => root.destroy?.());
