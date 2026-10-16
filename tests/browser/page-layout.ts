import "../../packages/components/src/styles/index.css";
import { AppShell, Button, Screen, Select, Stack, ThemeToggle, type PageLayoutOptions } from "../../packages/components/src";
import { addPageHideCleanup, runCleanups } from "../../packages/core/src/events";

const app = document.querySelector<HTMLElement>("#app")!;
const status = document.createElement("p"); status.setAttribute("role", "status");
const report = document.createElement("ol");
const headingText = document.createElement("p"); headingText.textContent = "Header content";
const headerAction = Button({ text: "Header action" });
const header = Stack({ children: [headingText, headerAction] });
header.element.style.paddingBlock = "0.5rem";
const navigation = Button({ text: "Navigation action" });
const before = Button({ text: "Context action" });
const theme = ThemeToggle({ announcement: false });
const sections = Array.from({ length: 12 }, (_, index) => {
    const section = document.createElement("section"); section.style.cssText = "min-block-size:14rem;overflow-wrap:anywhere";
    const title = document.createElement("h2"); title.textContent = `Content section ${index + 1}`;
    const input = document.createElement("input"); input.setAttribute("aria-label", `Section ${index + 1} field`);
    section.append(title, input); return section;
});
const screen = Screen({ title: "AF Page Layout Audit", headingLevel: 1, children: [report, ...sections] });
const shell = AppShell({ title: "AF Page Layout Audit", theme: "light", header, navigation,
    beforeOutlet: before, content: screen, footer: "Fixture footer", layout: false });
shell.element.style.setProperty("--af-page-layout-gutter", "3rem", "important");
shell.update({ layout: { maxWidth: "60rem", gutter: "1rem", chrome: "normal" } });
shell.element.style.setProperty("--af-page-chrome-transition", "none");
shell.page.main.style.paddingBlockEnd = "15rem";
const modes: Record<string, PageLayoutOptions["chrome"]> = {
    normal: "normal", sticky: "sticky", fixed: "fixed", reveal: "reveal",
    mixed: { header: "sticky", navigation: "fixed", beforeOutlet: "fixed" },
    mixedReveal: { header: "sticky", navigation: "reveal", beforeOutlet: "sticky" }
};
let currentMode = "normal";
let topOffset = false;
function updateChrome() {
    const selected = modes[currentMode] ?? "normal";
    const chrome = typeof selected === "string" ? { header: selected, navigation: selected, beforeOutlet: selected } : selected;
    shell.update({ layout: { chrome: { ...chrome, topOffset: topOffset ? "5rem" : "0px" } } });
}
const mode = Select({ label: "Chrome mode", value: currentMode,
    items: Object.keys(modes).map(value => ({ value, label: value })),
    onValueChange({ value }) {
        currentMode = String(value); window.scrollTo(0, 0);
        updateChrome();
        status.textContent = `Mode: ${currentMode}`;
    } });
const down = Button({ text: "Scroll down", onPress() { window.scrollBy(0, 500); } });
const up = Button({ text: "Scroll up", onPress() { window.scrollBy(0, -20); } });
const top = Button({ text: "Top", onPress() { window.scrollTo(0, 0); } });
const focus = Button({ text: "Focus header", onPress() { headerAction.element.focus({ preventScroll: true }); } });
const expand = Button({ text: "Toggle expanded header", onPress() {
    const expanded = headerAction.element.getAttribute("aria-expanded") !== "true";
    headerAction.element.setAttribute("aria-expanded", String(expanded)); status.textContent = `Expanded: ${expanded}`;
} });
const grow = Button({ text: "Grow header", onPress() {
    headingText.textContent = headingText.textContent === "Header content" ? "LongLocalizedHeaderTextWithoutSpaces".repeat(8) : "Header content";
    headingText.style.overflowWrap = "anywhere";
} });
const direction = Button({ text: "Toggle direction", onPress() { document.documentElement.dir = document.documentElement.dir === "rtl" ? "ltr" : "rtl"; } });
const offset = Button({ text: "Toggle top offset", onPress() { topOffset = !topOffset; updateChrome(); } });
const pageMode = Select({ label: "Page mode", value: "app", items: [{ value: "app", label: "app" }, { value: "document", label: "document" }],
    onValueChange({ value }) { shell.update({ layout: { mode: value === "document" ? "document" : "app" } }); } });
const remove = Button({ text: "Remove layout", onPress() {
    shell.update({ layout: false });
    const style = shell.element.style;
    const restored = style.getPropertyValue("--af-page-layout-gutter") === "3rem" && style.getPropertyPriority("--af-page-layout-gutter") === "important";
    status.textContent = `${restored && !shell.element.hasAttribute("data-af-page-layout") && !shell.element.querySelector("[data-af-page-chrome-placeholder]") ? "PASS" : "FAIL"}: layout removed; authored CSS priority restored`;
} });
const check = Button({ text: "Check layout", onPress() {
    const results: Array<{ name: string; passed: boolean }> = [];
    const test = (name: string, passed: boolean) => results.push({ name, passed });
    const root = shell.element;
    const headerElement = root.querySelector<HTMLElement>("[data-af-page-header]")!;
    const navElement = root.querySelector<HTMLElement>("[data-af-page-navigation]")!;
    const context = root.querySelector<HTMLElement>("[data-af-app-shell-before-outlet]")!;
    const height = (element: HTMLElement) => element.getBoundingClientRect().height;
    const pixels = (name: string) => parseFloat(root.style.getPropertyValue(name));
    const pinned = (name: string) => ["sticky", "fixed", "reveal"].includes(root.getAttribute(name) ?? "");
    const hidden = root.getAttribute("data-af-page-chrome-visible") === "false";
    const visibleHeight = (element: HTMLElement, name: string) => pinned(name) && !(hidden && root.getAttribute(name) === "reveal") ? height(element) : 0;
    test("Exactly one native main landmark", document.querySelectorAll("main").length === 1);
    test("Header remains a native landmark", headerElement.tagName === "HEADER");
    test("Navigation remains a native landmark", navElement.tagName === "NAV");
    test("Header measurement matches rendered geometry", Math.abs(pixels("--af-page-header-block-size") - height(headerElement)) < 1);
    test("Navigation measurement matches rendered geometry", Math.abs(pixels("--af-page-navigation-block-size") - height(navElement)) < 1);
    test("Context measurement matches rendered geometry", Math.abs(pixels("--af-page-before-outlet-block-size") - height(context)) < 1);
    const headerOffset = visibleHeight(headerElement, "data-af-page-header-mode");
    const navOffset = visibleHeight(navElement, "data-af-page-navigation-mode");
    test("Navigation offset includes only visible pinned header", Math.abs(pixels("--af-page-navigation-offset-block-size") - headerOffset) < 1);
    test("Context offset includes only visible pinned predecessors", Math.abs(pixels("--af-page-before-outlet-offset-block-size") - headerOffset - navOffset) < 1);
    const regions = [[headerElement, "data-af-page-header-mode"], [navElement, "data-af-page-navigation-mode"], [context, "data-af-page-before-outlet-mode"]] as const;
    const fixed = regions.filter(([, name]) => root.getAttribute(name) === "fixed");
    const placeholders = root.querySelectorAll<HTMLElement>("[data-af-page-chrome-placeholder]");
    test("Only fixed regions receive flow placeholders", placeholders.length === fixed.length);
    test("Fixed reservations follow their own region", fixed.every(([element]) => element.nextElementSibling?.hasAttribute("data-af-page-chrome-placeholder")));
    test("Fixed reservation heights match their regions", fixed.every(([element]) => Math.abs(element.nextElementSibling!.getBoundingClientRect().height - height(element)) < 1));
    test("Context remains aligned with main width", context.getBoundingClientRect().width <= shell.page.main.getBoundingClientRect().width + 1);
    test("Hidden reveal regions leave no visible strip", regions.every(([element, name]) => !hidden || root.getAttribute(name) !== "reveal" || element.getBoundingClientRect().bottom <= 1));
    test("Page has no horizontal overflow", document.documentElement.scrollWidth <= innerWidth);
    if (scrollY < 1) {
        const bottom = Math.max(...regions.map(([element]) => element.getBoundingClientRect().bottom));
        test("Initial heading is below every chrome region", screen.element.querySelector("h1")!.getBoundingClientRect().top >= bottom - 1);
        test("Initial pinned regions do not overlap", regions.every(([element, name], index) => index === 0 || !pinned(name) || element.getBoundingClientRect().top >= regions[index - 1]![0].getBoundingClientRect().bottom - 1));
    }
    report.replaceChildren(...results.map(result => { const item = document.createElement("li"); item.textContent = `${result.passed ? "PASS" : "FAIL"}: ${result.name}`; return item; }));
    status.textContent = `${results.filter(result => result.passed).length}/${results.length} layout checks passed; ${currentMode}; ${hidden ? "hidden" : "visible"}`;
} });
const tools = Stack({ children: [mode, pageMode, down, up, top, focus, expand, grow, direction, offset, theme, check, remove, status] });
tools.element.style.cssText = "position:fixed;inset-block-end:0;inset-inline:0;z-index:1200;display:flex;flex-wrap:wrap;gap:0.25rem;align-items:end;background:var(--af-color-bg);padding:0.5rem;border-block-start:1px solid var(--af-color-border);max-block-size:40vh;overflow:auto";
app.append(shell.element, tools.element);
addPageHideCleanup(window, () => runCleanups([() => tools.destroy?.(), shell.destroy]));
