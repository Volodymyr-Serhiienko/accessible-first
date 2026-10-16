import "../../packages/components/src/styles/index.css";
import { Accordion, Button, Disclosure, FieldGroup, FormSection, SettingsGroup } from "../../packages/components/src";
import { addPageHideCleanup, runCleanups } from "../../packages/core/src/events";

const app = document.querySelector<HTMLElement>("#app")!;
app.style.cssText = "display:grid;gap:1.25rem;max-width:48rem;margin:auto;padding:1rem;font:16px/1.5 sans-serif";
const heading = document.createElement("h1"); heading.textContent = "AF Revealed Content Audit";
const result = document.createElement("p"); result.setAttribute("role", "status");
const report = document.createElement("ol");
const longText = "LongLocalizedSectionContentWithoutSpaces".repeat(3);
const inside = Button({ text: "Inside disclosure" });
const disclosure = Disclosure({ trigger: `Details ${longText}`, panel: [longText, inside], description: longText, announcement: false });
const accordion = Accordion({ announcement: false, items: [
    { value: "first", trigger: `First ${longText}`, panel: longText },
    { value: "hidden", trigger: "Hidden item", panel: longText },
    { value: "locked", trigger: "Locked item", panel: longText, disabled: true },
    { value: "last", trigger: `Last ${longText}`, panel: longText }
] });
accordion.items[1]!.element.hidden = true;
const section = FormSection({ title: longText, description: longText, children: longText,
    descriptionMode: "aria", actions: Button({ text: "Section action" }) });
const settingsAction = Button({ text: "Settings action" });
const settings = SettingsGroup({ title: longText, description: longText, children: settingsAction, actions: longText });
const checkbox = document.createElement("input"); checkbox.type = "checkbox"; checkbox.id = "revealed-checkbox";
const checkboxLabel = document.createElement("label"); checkboxLabel.htmlFor = checkbox.id; checkboxLabel.textContent = "Grouped checkbox";
const group = FieldGroup({ label: longText, description: longText, invalid: true, errorMessage: longText, required: true,
    children: [checkbox, checkboxLabel] });
const outside = Button({ text: "Outside action" });
const theme = Button({ text: "Toggle theme", onPress() {
    document.documentElement.dataset.afTheme = document.documentElement.dataset.afTheme === "dark" ? "light" : "dark";
} });
const run = Button({ text: "Run revealed checks", onPress() {
    const checks: Array<{ name: string; passed: boolean }> = [];
    const check = (name: string, passed: boolean) => checks.push({ name, passed });
    disclosure.open();
    check("Disclosure exposes its open panel", disclosure.trigger.getAttribute("aria-expanded") === "true" && !disclosure.panel.hidden);
    check("Default description is not attached to the trigger", !disclosure.trigger.hasAttribute("aria-describedby"));
    inside.element.focus(); disclosure.close();
    check("Collapse returns owned focus to the trigger", document.activeElement === disclosure.trigger && Boolean(disclosure.panel.hidden));
    outside.element.focus(); disclosure.open(); disclosure.close();
    check("Collapse preserves outside focus", document.activeElement === outside.element);
    accordion.update({ multiple: false, collapsible: true }); accordion.openItem("first"); accordion.openItem("last");
    check("Single-open mode closes the previous panel", accordion.getOpenValues().join() === "last");
    accordion.items[2]!.trigger.click(); check("Disabled trigger cannot open", !accordion.items[2]!.isOpen());
    accordion.update({ multiple: true }); accordion.openItem("first");
    check("Multiple mode retains both panels", accordion.getOpenValues().length === 2);
    accordion.update({ multiple: false, collapsible: false });
    const required = accordion.items.find(item => item.isOpen())!;
    check("Required-open trigger remains tabbable with aria-disabled", required.trigger.getAttribute("aria-disabled") === "true" && !required.trigger.disabled);
    required.trigger.click(); check("Required-open click does not collapse", required.isOpen());
    check("Section and settings keep native heading relationships", section.element.getAttribute("aria-labelledby") === section.heading.id && settings.element.getAttribute("aria-labelledby") === settings.heading.id);
    check("FieldGroup keeps native fieldset and legend", group.element.localName === "fieldset" && group.legend.localName === "legend");
    group.setDisabled(true); check("Disabled fieldset disables its native field", checkbox.matches(":disabled")); group.setDisabled(false);
    check("Invalid group exposes its error", group.element.getAttribute("aria-errormessage") === group.errorMessage.id && !group.errorMessage.hidden);
    settingsAction.element.focus(); settings.update({ variant: "plain" });
    check("Style-only section updates preserve child focus", document.activeElement === settingsAction.element);
    disclosure.open();
    for (const [name, element] of [["Disclosure", disclosure.element], ["Accordion", accordion.element], ["FormSection", section.element], ["SettingsGroup", settings.element], ["FieldGroup", group.element]] as const) {
        check(`${name} long content stays within container`, element.scrollWidth <= element.clientWidth);
        element.hidden = true; check(`${name} native hidden is respected`, element.getClientRects().length === 0); element.hidden = false;
    }
    disclosure.close();
    check("Document has no horizontal overflow", document.documentElement.scrollWidth <= innerWidth);
    report.replaceChildren(...checks.map(check => {
        const row = document.createElement("li"); row.textContent = `${check.passed ? "PASS" : "FAIL"}: ${check.name}`; return row;
    }));
    result.textContent = `${checks.filter(check => check.passed).length}/${checks.length} revealed checks passed`;
} });
app.append(heading, run.element, theme.element, result, disclosure.element, accordion.element,
    section.element, settings.element, group.element, outside.element, report);
addPageHideCleanup(window, () => runCleanups([disclosure, accordion, section, settings, group, outside, run, theme].map(item => () => item.destroy())));
