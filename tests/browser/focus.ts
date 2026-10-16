import "../../packages/components/src/styles/index.css";
import { Button, Dialog, Listbox, Menu, Row, Section, Stack, Tabs } from "../../packages/components/src";
import { getActiveElement, getOwnerDocument, getOwnerWindow } from "../../packages/core/src/dom";
import { createFocusTrap, focusProgrammatically, getActiveVirtualKeyboardElement, getFocusableElements } from "../../packages/core/src/focus";
import { createRovingFocus } from "../../packages/core/src/roving-focus";

const app = document.querySelector<HTMLElement>("#app")!;
app.style.cssText = "max-width: 48rem; margin: auto; padding: 1rem;";
const title = document.createElement("h1");
title.textContent = "AF Focus Contracts";
const report = document.createElement("ol");
const summary = document.createElement("p");
summary.setAttribute("role", "status");
const probe = Stack().element;
const results: Array<{ name: string; passed: boolean; detail: string }> = [];

function check(name: string, passed: boolean, detail = ""): void { results.push({ name, passed, detail }); }
function key(target: HTMLElement, init: KeyboardEventInit = {}): KeyboardEvent {
    const event = new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true, ...init });
    target.dispatchEvent(event);
    return event;
}
function button(text: string): HTMLButtonElement {
    const element = document.createElement("button");
    element.type = "button";
    element.textContent = text;
    return element;
}

function checkAvailability(): void {
    const fieldset = document.createElement("fieldset");
    fieldset.disabled = true;
    const legend = document.createElement("legend");
    const legendAction = button("Legend action");
    legend.append(legendAction);
    const disabled = button("Disabled action");
    fieldset.append(legend, disabled);
    const hidden = Button({ text: "Hidden action", attributes: { hidden: true } });
    const invisible = document.createElement("div");
    invisible.style.display = "none";
    invisible.append(button("Invisible child"));
    const inert = document.createElement("div");
    inert.setAttribute("inert", "");
    inert.append(button("Inert child"));
    const readonly = document.createElement("input");
    readonly.readOnly = true;
    readonly.setAttribute("aria-label", "Read-only field");
    const enabled = button("Enabled action");
    const group = Stack(fieldset, hidden, invisible, inert, readonly, enabled);
    probe.append(group.element);
    const focusable = getFocusableElements(group.element);
    check("Disabled fieldset preserves its first legend action", focusable.includes(legendAction) && !focusable.includes(disabled));
    check("Hidden and inert descendants are excluded", focusable.length === 3);
    check("Read-only fields remain in the Tab order", focusable.includes(readonly));
    const heading = document.createElement("h2");
    heading.textContent = "Focus destination";
    group.element.append(heading);
    const focused = focusProgrammatically(heading);
    check("Programmatic heading focus remains outside the Tab order", focused
        && document.activeElement === heading && heading.getAttribute("tabindex") === "-1",
        `focused=${focused}; active=${document.activeElement?.tagName}; tabindex=${heading.getAttribute("tabindex")}`);
    enabled.focus();
    check("Temporary heading tabindex is restored after blur", !heading.hasAttribute("tabindex"));
    heading.hidden = true;
    enabled.focus();
    check("Hidden heading cannot take focus", !focusProgrammatically(heading) && document.activeElement === enabled);
    group.destroy?.();
    group.element.remove();
}

function checkRoving(): void {
    const first = button("First");
    const hidden = button("Hidden");
    hidden.hidden = true;
    const disabled = button("Disabled");
    disabled.disabled = true;
    const last = button("Last");
    const row = Row(first, hidden, disabled, last);
    probe.append(row.element);
    let items = [first, hidden, disabled, last];
    const roving = createRovingFocus(row.element, { getItems: () => items, orientation: "horizontal" });
    roving.activate();
    try {
        first.focus();
        key(first);
        check("Arrow skips hidden/disabled items", document.activeElement === last && roving.getCurrentItem() === last);
        first.focus();
        check("Native focus updates the one roving Tab stop", roving.getCurrentItem() === first && first.tabIndex === 0 && last.tabIndex === -1);
        check("Modified keys remain native", !key(first, { key: "End", ctrlKey: true }).defaultPrevented && document.activeElement === first);
        const outsider = button("Outside collection");
        row.element.append(outsider);
        check("Outside item is rejected", !roving.setCurrentItem(outsider, { focus: true }) && document.activeElement === first);
        items = [last];
        roving.refresh();
        check("Removed items release their original tabindex", !first.hasAttribute("tabindex") && last.tabIndex === 0);
    } finally { roving.deactivate(); row.destroy?.(); row.element.remove(); }
}

function checkTrap(): void {
    const before = button("Outer action");
    const only = button("Inner action");
    const inner = Stack(only);
    const outer = Stack(before, inner);
    probe.append(outer.element);
    const parent = createFocusTrap(outer.element);
    const child = createFocusTrap(inner.element);
    parent.activate();
    child.activate();
    try {
        check("Nested single-control trap keeps Tab", key(only, { key: "Tab" }).defaultPrevented && document.activeElement === only);
        check("Nested single-control trap keeps Shift+Tab", key(only, { key: "Tab", shiftKey: true }).defaultPrevented && document.activeElement === only);
        check("Trap leaves browser shortcuts alone", !key(only, { key: "Tab", ctrlKey: true }).defaultPrevented && document.activeElement === only);
    } finally { child.deactivate(); parent.deactivate(); outer.destroy?.(); outer.element.remove(); }
}

function checkOwnerDocument(): void {
    const frame = document.createElement("iframe");
    frame.title = "Local focus document";
    probe.append(frame);
    try {
        const owner = frame.contentDocument!;
        const input = owner.createElement("input");
        input.setAttribute("aria-label", "Frame field");
        owner.body.append(input);
        input.focus();
        check("Document ownership stays inside iframe", getOwnerDocument(owner) === owner && getOwnerWindow(owner) === frame.contentWindow);
        check("Active-element discovery uses the owning document", getActiveElement(owner) === input);
        check("Virtual-keyboard discovery accepts a foreign-realm node", getActiveVirtualKeyboardElement(input) === input);
    } finally { frame.remove(); }
}

const run = Button({ text: "Run focus checks", onPress() {
    results.length = 0;
    checkAvailability();
    checkRoving();
    checkTrap();
    checkOwnerDocument();
    report.replaceChildren(...results.map((result) => {
        const item = document.createElement("li");
        item.dataset.passed = `${result.passed}`;
        item.textContent = `${result.passed ? "PASS" : "FAIL"}: ${result.name}${result.detail ? ` (${result.detail})` : ""}`;
        return item;
    }));
    const failed = results.filter((result) => !result.passed).length;
    summary.textContent = `${results.length - failed}/${results.length} passed; ${failed} failed.`;
    run.element.focus();
    run.element.scrollIntoView({ block: "start" });
} });

const items = ["Apple", "Apricot", "Banana"].map((label) => ({ value: label, label }));
const menu = Menu({ attributes: { "aria-label": "Keyboard menu" }, announceOnHover: false, items });
const listbox = Listbox({ label: "Keyboard list", announceOnHover: false, items });
const tabs = Tabs({ announceOnHover: false, items: [
    { value: "one", tab: "First tab", panel: "First panel" },
    { value: "two", tab: "Second tab", panel: "Second panel" }
] });
const dialog = Dialog({ trigger: "Open focus dialog", title: "Focus dialog", children: [Button({ text: "First action" }), Button({ text: "Last action" })] });
const manual = Stack(
    Section({ title: "Menu", children: [menu] }),
    Section({ title: "Listbox", children: [listbox] }),
    Section({ title: "Tabs", children: [tabs] }),
    dialog
);
app.append(title, run.element, summary, report, probe, manual.element);
