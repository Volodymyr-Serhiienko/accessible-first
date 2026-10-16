import "../../packages/components/src/styles/index.css";
import { AppShell, Button, Screen, Stack, TextField, ThemeToggle } from "../../packages/components/src";
import { addPageHideCleanup, runCleanups } from "../../packages/core/src/events";

const app = document.querySelector<HTMLElement>("#app")!;
const status = document.createElement("p"); status.setAttribute("role", "status");
const report = document.createElement("ol");
const headerInput = TextField({ label: "Stable header field", value: "Retained header value" });
const theme = ThemeToggle({ announcement: false });
const header = Stack({ children: [headerInput, theme] });
const mainInput = TextField({ label: "Main field", value: "Retained main value" });
const long = document.createElement("p");
long.textContent = "LocalizedPageContentWithAnUnbrokenWord".repeat(5);
long.style.overflowWrap = "anywhere";
let footer = makeFooter();
let navigation = makeNavigation();
let before = Button({ text: "Before outlet action" });
let after = Button({ text: "After outlet action" });
let extra: ReturnType<typeof Button> | null = null;
let screenNumber = 0;

function makeFooter() {
    return TextField({ label: "Footer field", value: "Footer value" });
}
function makeNavigation() {
    const nav = document.createElement("div");
    nav.style.cssText = "display:flex;flex-wrap:wrap;gap:1rem";
    for (const name of ["Main destination", "Report destination"]) {
        const link = document.createElement("a"); link.textContent = name;
        link.href = name === "Main destination" ? "#main" : "#fixture-report";
        nav.append(link);
    }
    return nav;
}
function makeScreen() {
    screenNumber += 1;
    return Screen({ title: `Fixture screen ${screenNumber}`, headingLevel: 1, children: [mainInput, long, report] });
}

const checks = Button({ text: "Run page shell checks", onPress() {
    const results: Array<{ name: string; passed: boolean }> = [];
    const check = (name: string, passed: boolean) => results.push({ name, passed });
    headerInput.control.focus();
    shell.update({ header, navigation, beforeOutlet: before, afterOutlet: after, footer });
    check("Stable header update preserves focus", document.activeElement === headerInput.control);
    check("Header input value survives chrome updates", headerInput.control.value === "Retained header value");
    check("Header input retains its DOM identity", shell.element.querySelector("header input") === headerInput.control);
    check("Main field value survives chrome updates", mainInput.control.value === "Retained main value");
    check("Header, navigation and footer use native landmarks", ["header", "nav", "footer"].every(tag => shell.element.querySelector(tag)));
    check("The document has exactly one main landmark", document.querySelectorAll("main").length === 1);
    check("Navigation retains an accessible name", shell.element.querySelector("nav")?.getAttribute("aria-label") === "Fixture navigation");
    check("Before slot remains before the outlet", shell.outlet.element.previousElementSibling?.hasAttribute("data-af-app-shell-before-outlet") === true);
    check("After slot remains after the outlet", shell.outlet.element.nextElementSibling?.hasAttribute("data-af-app-shell-after-outlet") === true);

    mainInput.control.focus();
    if (!extra) { extra = Button({ text: "Appended main action" }); shell.page.appendToMain(extra); }
    check("Appending main content preserves existing focus", document.activeElement === mainInput.control);
    check("Appended content stays inside main", Boolean(extra.element.closest("main")));

    const removed = [before.element, after.element, footer.element, navigation];
    shell.update({ beforeOutlet: null, afterOutlet: null, footer: null, navigation: null });
    const selectors = ["[data-af-app-shell-before-outlet]", "[data-af-app-shell-after-outlet]", "[data-af-page-footer]", "[data-af-page-navigation]"];
    check("Empty regions expose hidden state", selectors.every(selector => shell.element.querySelector<HTMLElement>(selector)!.hidden));
    check("Empty regions are absent from rendered layout", selectors.every(selector => shell.element.querySelector<HTMLElement>(selector)!.getClientRects().length === 0));
    check("Removed controls are no longer connected", removed.every(element => !element.isConnected));
    before = Button({ text: "Before outlet action" }); after = Button({ text: "After outlet action" });
    footer = makeFooter(); navigation = makeNavigation();
    shell.update({ beforeOutlet: before, afterOutlet: after, footer, navigation });
    check("Fresh region controls become visible again", selectors.every(selector => shell.element.querySelector<HTMLElement>(selector)!.getClientRects().length > 0));
    check("Restored footer input remains editable", !footer.control.disabled && !footer.control.readOnly);
    shell.page.focusMain();
    check("Programmatic content focus reaches main", document.activeElement === shell.page.main);
    check("Main does not become a permanent tab stop", shell.page.main.tabIndex === -1);
    check("Skip link targets the actual main landmark", shell.element.querySelector("[data-af-skip-link]")?.getAttribute("href") === `#${shell.page.main.id}`);
    check("Layout root remains marked as an app shell", shell.element.hasAttribute("data-af-app-shell"));
    check("Controls retain touch-target height", [checks.element, theme.element, headerInput.control].every(element => element.getBoundingClientRect().height >= 44));
    check("The document has no horizontal overflow", document.documentElement.scrollWidth <= innerWidth);
    report.replaceChildren(...results.map(result => {
        const item = document.createElement("li"); item.textContent = `${result.passed ? "PASS" : "FAIL"}: ${result.name}`; return item;
    }));
    status.textContent = `${results.filter(result => result.passed).length}/${results.length} page shell checks passed`;
} });
const direction = Button({ text: "Toggle direction", onPress() {
    document.documentElement.dir = document.documentElement.dir === "rtl" ? "ltr" : "rtl";
    status.textContent = `Direction: ${document.documentElement.dir}`;
} });
const focus = Button({ text: "Focus main", onPress() { shell.page.focusMain(); } });
const controls = Stack({ children: [checks, direction, focus, status] });
report.id = "fixture-report";
const shell = AppShell({ title: "AF Page Shell Audit", theme: "light", header, navigation,
    navigationLabel: "Fixture navigation", beforeOutlet: before, afterOutlet: after,
    content: makeScreen(), footer, layout: { maxWidth: "60rem" } });
// Keep fixture controls independent from the slots replaced by its checks.
shell.page.main.insertBefore(controls.element, shell.page.main.firstChild);
app.append(shell.element);
addPageHideCleanup(window, () => runCleanups([() => controls.destroy?.(), shell.destroy]));
