import "../../packages/components/src/styles/index.css";
import { Badge, Button, DescriptionList, Progress, StatusMessage } from "../../packages/components/src";
import { addPageHideCleanup, runCleanups } from "../../packages/core/src/events";

const app = document.querySelector<HTMLElement>("#app")!;
app.style.cssText = "display:grid;gap:1.25rem;max-width:48rem;margin:auto;padding:1rem;font:16px/1.5 sans-serif";
const heading = document.createElement("h1"); heading.textContent = "AF Status And Data Audit";
const result = document.createElement("p"); result.setAttribute("role", "status");
const report = document.createElement("ol");
const longText = "LongLocalizedStatusAndProgressWithoutSpaces".repeat(3);
const open = Button({ text: "Details action" });
const list = DescriptionList({ layout: "inline", items: [{ term: longText, details: longText }, { term: "Action", details: open }] });
const progress = Progress({ label: longText, value: 4, max: 10, valueText: longText, description: longText,
    controlOptions: { attributes: { "aria-describedby": "status-data-help" } } });
const help = document.createElement("p"); help.id = "status-data-help"; help.textContent = "External progress help";
const variants = ["neutral", "info", "success", "warning", "danger"] as const;
const messages = variants.map((variant, index) => StatusMessage({ text: index ? `${variant} status` : longText, variant,
    icon: "i", iconPosition: index % 2 ? "end" : "start", announcement: false }));
const badges = variants.map((variant, index) => Badge({ text: index ? `${variant} badge` : longText, icon: "i", variant,
    iconPosition: index % 2 ? "end" : "start" }));
const count = Badge({ text: "12", accessibleLabel: "12 lessons" });
const quiet = [list.element, progress.element, count.element, ...messages.map(item => item.element), ...badges.map(item => item.element)];
const theme = Button({ text: "Toggle theme", onPress() {
    document.documentElement.dataset.afTheme = document.documentElement.dataset.afTheme === "dark" ? "light" : "dark";
} });
const run = Button({ text: "Run status checks", onPress() {
    const checks: Array<{ name: string; passed: boolean }> = [];
    const check = (name: string, passed: boolean) => checks.push({ name, passed });
    check("Native progress has its visible label", progress.label.htmlFor === progress.control.id && progress.control.labels?.[0] === progress.label);
    check("Progress preserves external description", progress.control.getAttribute("aria-describedby") === `${help.id} ${progress.description.id}`);
    progress.setValue(null);
    check("Indeterminate has no native numeric value", !progress.control.hasAttribute("value"));
    progress.update({ value: 30, max: 10 });
    check("Determinate value is clamped", progress.control.value === 10 && progress.control.max === 10);
    check("Data and visible status are quiet by default", quiet.every(element => !element.hasAttribute("aria-live") && !element.hasAttribute("role")));
    check("Badge alternate label does not repeat visible abbreviation", count.content.getAttribute("aria-hidden") === "true" && count.accessibleLabel.textContent === "12 lessons");
    check("Decorative icons stay hidden from AT", [...messages, ...badges].every(item => item.icon.getAttribute("aria-hidden") === "true"));
    check("Description list keeps native term/details semantics", list.element.tagName === "DL" && list.items.every(item => item.term.tagName === "DT" && item.details.tagName === "DD"));
    open.element.focus(); const item = list.items[1]; list.update({ layout: "inline", variant: "plain" });
    check("Layout updates retain the focused action", list.items[1] === item && document.activeElement === open.element);
    for (const [name, element] of [["StatusMessage", messages[0]!.element], ["Badge", badges[0]!.element], ["Progress", progress.element], ["DescriptionList", list.element]] as const) {
        check(`${name} long content stays within container`, element.scrollWidth <= element.clientWidth);
        element.hidden = true;
        check(`${name} native hidden is respected`, element.getClientRects().length === 0);
        element.hidden = false;
    }
    check("Document has no horizontal overflow", document.documentElement.scrollWidth <= innerWidth);
    report.replaceChildren(...checks.map(check => {
        const row = document.createElement("li"); row.textContent = `${check.passed ? "PASS" : "FAIL"}: ${check.name}`; return row;
    }));
    result.textContent = `${checks.filter(check => check.passed).length}/${checks.length} status checks passed`;
} });
app.append(heading, run.element, theme.element, result, help, progress.element, list.element,
    ...messages.map(item => item.element), ...badges.map(item => item.element), count.element, report);
addPageHideCleanup(window, () => runCleanups([progress, list, ...messages, ...badges, count, run, theme].map(item => () => item.destroy())));
