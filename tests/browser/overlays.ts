import "../../packages/components/src/styles/index.css";
import { Button, Popover, Section, Stack } from "../../packages/components/src";
import { createDialog } from "../../packages/core/src/dialog";

const app = document.querySelector<HTMLElement>("#app")!;
app.style.cssText = "max-width: 48rem; margin: auto; padding: 1rem;";
const title = document.createElement("h1");
title.textContent = "AF Overlay Focus Contracts";
const report = document.createElement("ol");
const summary = document.createElement("p");
summary.setAttribute("role", "status");
const probe = Stack().element;
const run = Button({ text: "Run overlay focus checks", onPress() {
    const results: Array<{ name: string; passed: boolean }> = [];
    const check = (name: string, passed: boolean) => results.push({ name, passed });
    const inside = Button({ text: "Probe action" });
    const content = Stack(inside).element;
    content.hidden = true;
    probe.append(content);
    const dialog = createDialog(content, { modal: false, initialFocus: inside.element });
    run.element.focus();
    dialog.open();
    check("Non-modal opening focuses content without aria-modal", document.activeElement === inside.element && !content.hasAttribute("aria-modal"));
    dialog.close();
    check("Non-modal close restores its opener", document.activeElement === run.element);
    dialog.open();
    run.element.focus();
    dialog.close();
    check("Outside focus remains owned by the outside workflow", document.activeElement === run.element);
    dialog.open();
    const reopen = () => dialog.open();
    run.element.addEventListener("focus", reopen, { once: true });
    dialog.close();
    check("Focus-triggered reopening remains visible", dialog.isOpen() && !content.hidden && document.activeElement === inside.element);
    dialog.destroy();
    check("Destroy restores focus and author attributes", document.activeElement === run.element && content.hidden && !content.hasAttribute("role"));
    content.remove();
    inside.destroy();

    const action = Button({ text: "Floating probe action" });
    const panel = Popover({ trigger: "Probe tools", announcement: false, children: [action] });
    probe.append(panel.element);
    panel.trigger.focus();
    panel.open();
    action.element.focus();
    panel.close();
    check("Popover close returns focus to its trigger", document.activeElement === panel.trigger);
    panel.open();
    run.element.focus();
    panel.close();
    check("Popover close does not steal external focus", document.activeElement === run.element);
    panel.destroy();
    const html = panel.element.outerHTML;
    panel.setDescription("Late content");
    panel.update({ open: true, children: ["Late child"] });
    check("Destroyed composition ignores late updates", panel.element.outerHTML === html);
    panel.element.remove();

    report.replaceChildren(...results.map((result) => {
        const row = document.createElement("li");
        row.dataset.passed = `${result.passed}`;
        row.textContent = `${result.passed ? "PASS" : "FAIL"}: ${result.name}`;
        return row;
    }));
    summary.textContent = `${results.filter((result) => result.passed).length}/${results.length} passed.`;
    run.element.focus();
} });

const close = Button({ text: "Close non-modal details", onPress: () => details.close() });
const surface = Section({ title: "Non-modal details", children: [close] });
surface.element.hidden = true;
const details = createDialog(surface.element, { modal: false, initialFocus: close.element });
const open = Button({ text: "Open non-modal details", onPress: () => details.open() });
const outside = Button({ text: "Close from outside", onPress: () => details.close() });
const panel = Popover({ trigger: "Open tools", announcement: false, children: [
    Button({ text: "Close tools", onPress: () => panel.close() })
] });
app.append(title, run.element, summary, report, probe, open.element, surface.element, outside.element, panel.element);
