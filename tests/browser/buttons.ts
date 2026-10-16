import "../../packages/components/src/styles/index.css";
import { AccountControl, Button, Icon, IconButton, IconLabel, createButton, createIconButton } from "../../packages/components/src";
import { addPageHideCleanup, runCleanups } from "../../packages/core/src/events";

const app = document.querySelector<HTMLElement>("#app")!;
app.style.cssText = "display:grid;justify-items:start;gap:1rem;max-width:48rem;margin:auto;padding:1rem;font:16px/1.5 sans-serif";
const title = document.createElement("h1"); title.textContent = "AF Action Controls Audit";
const status = document.createElement("p"); status.setAttribute("role", "status");
const report = document.createElement("ol");
const long = "LongLocalizedActionWithoutAnySpaces".repeat(4);
const icon = () => Icon({ path: "M12 5v14M5 12h14", variant: "outline" });
let activations = 0;
const action = Button({ text: "Native action", onPress() { status.textContent = `Native activations: ${++activations}`; } });
const customElement = document.createElement("div"); customElement.textContent = "Custom action";
const custom = createButton(customElement, { onPress() { status.textContent = "Custom activated"; } });
const customIconElement = document.createElement("span"); customIconElement.append(icon().element);
const customIcon = createIconButton(customIconElement, { label: "Custom icon action", onPress() { status.textContent = "Custom icon activated"; } });
const reserved = Button({ text: "Start", reserveText: ["Start", "Continue"] });
const longReserved = Button({ text: long, reserveText: [long, "Short"] });
const iconButtons = (["start", "end", "top", "bottom"] as const).map(position => Button({
    children: [IconLabel({ icon: icon(), label: long, iconPosition: position })]
}));
const staticLabel = IconLabel({ icon: icon(), label: long });
const hint = IconButton({ icon: icon(), label: "Helpful action", hint: "Additional account details", hintDisplay: "both", hintShowOnFocus: false });
const account = AccountControl({ accountLabel: "Account details", onSignIn() { account.update({ signedIn: true }); }, onSignOut() { account.update({ signedIn: false }); } });
const theme = Button({ text: "Toggle theme", onPress() {
    document.documentElement.dataset.afTheme = document.documentElement.dataset.afTheme === "dark" ? "light" : "dark";
} });
const run = Button({ text: "Run action checks", onPress() {
    const checks: Array<{ name: string; passed: boolean }> = [];
    const check = (name: string, passed: boolean) => checks.push({ name, passed });
    reserved.setText("Start"); const width = reserved.element.getBoundingClientRect().width;
    reserved.setText("Continue"); check("Reserved width is stable", Math.abs(width - reserved.element.getBoundingClientRect().width) < 1);
    longReserved.setText("Short"); const longWidth = longReserved.element.getBoundingClientRect().width;
    longReserved.setText(long); check("Long reserved width is stable within its container", Math.abs(longWidth - longReserved.element.getBoundingClientRect().width) < 1);
    action.element.focus(); action.setPending(true); const before = activations; action.element.click();
    check("Pending blocks repeat activation", before === activations);
    check("Pending preserves focus and native enabled semantics", document.activeElement === action.element && !action.element.disabled && !action.element.hasAttribute("aria-disabled"));
    check("Pending retains its label and exposes busy state", action.element.textContent === "Native action" && action.element.getAttribute("aria-busy") === "true");
    action.setPending(false);
    account.update({ signedIn: false, display: "button" }); account.element.focus(); const original = account.element; const accountWidth = original.getBoundingClientRect().width;
    original.click(); check("Account sign-in retains focus and element", account.getState().signedIn && document.activeElement === original && account.element === original);
    check("Account label width is stable", Math.abs(accountWidth - original.getBoundingClientRect().width) < 1);
    original.click(); check("Account sign-out is application-confirmed", !account.getState().signedIn);
    account.update({ display: "icon" }); check("Account icon has the current action name", original.getAttribute("aria-label") === "Sign in");
    account.update({ display: "button" }); check("Text mode removes the icon-only name", !original.hasAttribute("aria-label"));
    hint.element.focus();
    check("Focus retains the programmatic hint", Boolean(hint.element.getAttribute("aria-describedby")));
    check("Hover-only visual hint stays closed on focus", !document.querySelector("[data-af-tooltip-visible]"));
    check("Icon controls meet target dimensions", [hint.element, customIcon.element].every(element => element.getBoundingClientRect().width >= 44 && element.getBoundingClientRect().height >= 44));
    check("IconLabel remains semantic-neutral", !staticLabel.element.hasAttribute("role") && !staticLabel.element.hasAttribute("tabindex"));
    for (const [name, element] of [["Long reserved label", longReserved.element], ["Standalone IconLabel", staticLabel.element], ...iconButtons.map((button, index) => [`IconLabel position ${index}`, button.element] as const)] as const) {
        check(`${name} does not overflow`, element.scrollWidth <= element.clientWidth + 1);
    }
    check("Document has no horizontal overflow", document.documentElement.scrollWidth <= innerWidth);
    report.replaceChildren(...checks.map(check => { const li = document.createElement("li"); li.textContent = `${check.passed ? "PASS" : "FAIL"}: ${check.name}`; return li; }));
    status.textContent = `${checks.filter(check => check.passed).length}/${checks.length} action checks passed`;
} });
app.append(title, run.element, theme.element, status, action.element, custom.element, customIcon.element,
    reserved.element, longReserved.element, ...iconButtons.map(button => button.element), staticLabel.element, hint.element, account.element, report);
addPageHideCleanup(window, () => runCleanups([run, theme, action, custom, customIcon, reserved, longReserved,
    ...iconButtons, staticLabel, hint, account].map(item => () => item.destroy?.())));
