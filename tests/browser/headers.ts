import "../../packages/components/src/styles/index.css";
import { AppHeader, Button, Image, TextField, ThemeToggle } from "../../packages/components/src";
import { addPageHideCleanup, runCleanups } from "../../packages/core/src/events";

const app = document.querySelector<HTMLElement>("#app")!;
app.style.cssText = "max-width:72rem;margin:auto;padding:1rem;font:16px/1.5 sans-serif;display:grid;gap:1rem";
const title = document.createElement("h1"); title.textContent = "AF Header Audit";
const status = document.createElement("p"); status.setAttribute("role", "status");
const report = document.createElement("ol");
const search = TextField({ label: "Quick search", value: "Retained search" });
search.element.style.width = "10rem";
const themeSwitch = ThemeToggle({ display: "switch", switchLabel: "Theme switch", announcement: false });
const header = AppHeader({ language: false, brand: {
    name: "Accessible First", tagline: "Header audit", href: "#header-main",
    logo: Image({ src: new URL("../../playground/public/assets/logo-192.png", import.meta.url).href, alt: "", decorative: true })
}, controls: [search, themeSwitch], theme: { announcement: false },
account: { variant: "primary", onSignIn() { header.accountControl!.update({ signedIn: true }); },
    onSignOut() { header.accountControl!.update({ signedIn: false }); } } });
const tools = header.toolsControl!;
const outside = Button({ text: "Outside action" });
const long = "LongLocalizedHeaderTextWithoutSpaces".repeat(3);
const localize = Button({ text: "Use long labels", onPress() {
    tools.update({ title: long, description: long, closeText: long, triggerLabel: "Tools", triggerHint: long });
    header.brandControl!.update({ name: long, tagline: long });
    tools.checkPlacement();
} });
const run = Button({ text: "Run header checks", onPress() {
    const checks: Array<{ name: string; passed: boolean }> = [];
    const check = (name: string, passed: boolean) => checks.push({ name, passed });
    check("AppHeader remains landmark-neutral", header.element.localName === "div" && !header.element.hasAttribute("role"));
    check("Brand remains a native link", header.brandControl!.element.localName === "a");
    const image = header.brandControl!.element.querySelector("img")!;
    check("Brand image is decorative and loaded", image.alt === "" && image.complete && image.naturalWidth > 0);
    const originalSearch = search.control;
    header.element.style.width = "1100px"; tools.checkPlacement();
    check("Wide header places controls inline", tools.getPlacement() === "inline");
    search.control.focus({ preventScroll: true });
    header.element.style.width = "260px"; tools.checkPlacement();
    check("Narrow header moves controls into menu", tools.getPlacement() === "menu");
    check("Focused inline control falls back to visible tools trigger", document.activeElement === tools.trigger.element);
    check("Responsive move retains the original search input and value", search.control === originalSearch && search.getValue() === "Retained search");
    const anchor = tools.trigger.element.getBoundingClientRect();
    tools.trigger.element.click();
    const opened = !tools.panel.hidden && tools.panel.getAttribute("role") === "dialog" && Boolean(tools.panel.getAttribute("aria-labelledby"));
    check("Tools opens a named dialog", opened);
    const openAnchor = tools.trigger.element.getBoundingClientRect();
    check("First panel open does not move its anchor", Math.abs(anchor.x - openAnchor.x) < 1 && Math.abs(anchor.y - openAnchor.y) < 1);
    check("Controls occupy the open panel", tools.panel.contains(originalSearch));
    tools.closeButton.element.focus({ preventScroll: true }); tools.closeButton.element.click();
    check("Close returns focus to the trigger", tools.panel.hidden && document.activeElement === tools.trigger.element);
    header.element.style.width = "1100px"; tools.checkPlacement();
    check("Widening restores inline controls and a visible focus destination", tools.getPlacement() === "inline" && document.activeElement === search.control);
    check("Same control set remains owned after repeated placement changes", tools.controls.contains(search.control) && !search.isDestroyed());
    const themeButton = header.themeControl!;
    themeButton.setTheme("light"); const before = themeButton.element.getBoundingClientRect().width;
    themeButton.element.focus({ preventScroll: true }); themeButton.element.click();
    check("Theme action updates without losing focus", themeButton.getTheme() === "dark" && document.activeElement === themeButton.element);
    check("Theme label reservation stabilizes width", Math.abs(before - themeButton.element.getBoundingClientRect().width) < 1);
    themeSwitch.setTheme("light"); themeSwitch.element.click();
    check("Switch semantics follow the resolved theme", themeSwitch.element.getAttribute("role") === "switch" && themeSwitch.element.getAttribute("aria-checked") === "true");
    const account = header.accountControl!; account.update({ signedIn: false }); account.element.click();
    check("Account follows the confirmed state", account.getState().signedIn && account.element.textContent === "Sign out");
    tools.update({ controls: [...header.controls] });
    check("Updating the same control set retains state", search.getValue() === "Retained search" && account.getState().signedIn);
    tools.update({ closeText: null, description: null });
    check("Null close text and description are respected", tools.closeButton.element.hidden && !tools.panel.hasAttribute("aria-describedby"));
    tools.update({ closeText: "Close panel", description: "App controls" });
    header.element.style.width = "100%"; tools.checkPlacement(); outside.element.focus({ preventScroll: true });
    check("Outside focus is preserved by placement checks", document.activeElement === outside.element);
    check("Header remains within its container", header.element.scrollWidth <= header.element.clientWidth + 1);
    check("Document has no horizontal overflow", document.documentElement.scrollWidth <= innerWidth);
    report.replaceChildren(...checks.map(check => { const li = document.createElement("li"); li.textContent = `${check.passed ? "PASS" : "FAIL"}: ${check.name}`; return li; }));
    status.textContent = `${checks.filter(check => check.passed).length}/${checks.length} header checks passed`;
} });
app.append(title, run.element, localize.element, status, header.element, outside.element, report);
addPageHideCleanup(window, () => runCleanups([header.destroy, run.destroy, localize.destroy, outside.destroy]));
