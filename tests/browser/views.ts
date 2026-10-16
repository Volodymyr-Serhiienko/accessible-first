import "../../packages/components/src/styles/index.css";
import { Button, EmptyState, InfoCard, ResultSummary, Screen } from "../../packages/components/src";
import { addPageHideCleanup } from "../../packages/core/src/events";

const app = document.querySelector<HTMLElement>("#app")!;
app.style.cssText = "display:grid;gap:1.5rem;max-width:48rem;margin:auto;padding:1rem;font:16px/1.5 sans-serif";
const heading = document.createElement("h1");
heading.textContent = "AF View Composition Audit";
const status = document.createElement("p");
status.setAttribute("role", "status");
const report = document.createElement("ol");
const longText = "LongLocalizedLearningMaterialWithoutSpaces".repeat(3);
const help = document.createElement("p");
help.id = "views-external-help";
help.textContent = "External screen help";
const action = Button({ text: "Screen action" });
const secondary = Button({ text: "Secondary action" });
const screen = Screen({ title: longText, description: longText, children: longText,
    footer: longText, actions: action, attributes: { "aria-describedby": help.id } });
const image = document.createElement("img");
image.src = new URL("../../playground/public/assets/logo-192.png", import.meta.url).href;
image.alt = "Accessible First logo";
image.width = 64; image.height = 64;
const decorative = image.cloneNode() as HTMLImageElement;
const card = InfoCard({ title: longText, description: longText, media: image, meta: longText,
    orientation: "horizontal", children: longText });
const empty = EmptyState({ title: longText, description: longText, media: decorative });
let formatCalls = 0;
const summary = ResultSummary({ total: 3, format() { formatCalls += 1; return longText; } });
const run = Button({ text: "Run view checks", onPress() {
    const results: Array<{ name: string; passed: boolean }> = [];
    const check = (name: string, passed: boolean) => results.push({ name, passed });
    check("Screen has a native title relationship", screen.element.getAttribute("aria-labelledby") === screen.title.id);
    screen.update({ descriptionMode: "aria" });
    check("ARIA description preserves external help", screen.element.getAttribute("aria-describedby") === `${help.id} ${screen.description.id}`);
    screen.update({ descriptionMode: "content" });
    check("Visible-only description removes only its own reference", screen.element.getAttribute("aria-describedby") === help.id);
    check("Screen title is a programmatic, non-Tab focus target", screen.focus("title") && document.activeElement === screen.title && screen.title.tabIndex === -1);
    action.element.focus();
    screen.setBody(longText);
    check("Body updates retain independent action focus", document.activeElement === action.element);
    screen.actionsBar.setSecondary(secondary);
    screen.update({ variant: "plain" });
    check("Secondary actions remain visible after parent sync", !screen.actions.hidden && !screen.actionsBar.secondarySlot.hidden);
    const before = formatCalls;
    summary.update({ variant: "strong", live: "off" });
    check("Summary style updates do not rerun formatting or add a live region", formatCalls === before && !summary.element.hasAttribute("aria-live"));
    check("Meaningful and decorative media remain distinct", !card.media.hasAttribute("aria-hidden") && empty.media.getAttribute("aria-hidden") === "true");
    check("Bitmap assets loaded", image.naturalWidth > 0 && decorative.naturalWidth > 0);
    action.setText(longText);
    for (const [name, element] of [["Screen", screen.element], ["InfoCard", card.element], ["EmptyState", empty.element], ["ResultSummary", summary.element]] as const) {
        check(`${name} long content stays within its container`, element.scrollWidth <= element.clientWidth);
    }
    check("Document has no horizontal overflow", document.documentElement.scrollWidth <= innerWidth);
    report.replaceChildren(...results.map(result => {
        const row = document.createElement("li");
        row.dataset.passed = String(result.passed);
        row.textContent = `${result.passed ? "PASS" : "FAIL"}: ${result.name}`;
        return row;
    }));
    status.textContent = `${results.filter(result => result.passed).length}/${results.length} view checks passed`;
} });
app.append(heading, run.element, status, help, screen.element, card.element, empty.element, summary.element, report);
addPageHideCleanup(window, () => { screen.destroy(); card.destroy(); empty.destroy(); summary.destroy(); run.destroy(); });
