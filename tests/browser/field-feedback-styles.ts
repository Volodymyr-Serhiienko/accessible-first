import "../../packages/components/src/styles/index.css";
import { Button, Combobox, FieldGroup, H2, PasswordField, Progress, Select, Stack, StatusMessage, TextField, ThemeToggle, ToastViewport, type CompositionChild } from "../../packages/components/src";
import { addPageHideCleanup, runCleanups } from "../../packages/core/src/events";

type Result = { name: string; passed: boolean; detail: string };
const tests: Array<() => Result> = [];
const word = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const sentence = "A long localized message that remains readable when the text is enlarged.";
const status = document.createElement("p"); status.setAttribute("role", "status");
const report = document.createElement("ol");
report.style.overflowWrap = "anywhere";
function add(name: string, test: () => boolean | [boolean, string]): void {
    tests.push(() => { const result = test(); return { name, passed: typeof result === "boolean" ? result : result[0], detail: typeof result === "boolean" ? "" : result[1] }; });
}
function fits(element: HTMLElement, parent: HTMLElement): boolean {
    const box = element.getBoundingClientRect(); const bounds = parent.getBoundingClientRect();
    return box.left >= bounds.left - 1 && box.right <= bounds.right + 1
        && (element.matches("input, textarea, select") || element.scrollWidth <= element.clientWidth + 1);
}
function tick(element: HTMLElement): boolean {
    const style = getComputedStyle(element, "::before");
    return parseFloat(style.borderRightWidth) > 0 && parseFloat(style.borderBottomWidth) > 0 && parseFloat(style.borderLeftWidth) === 0;
}
function contrast(color: string, background: string): number {
    const luminance = (value: string) => value.match(/[\d.]+/g)!.slice(0, 3).map(Number)
        .map(value => { const c = value / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; })
        .reduce((sum, value, i) => sum + value * [0.2126, 0.7152, 0.0722][i]!, 0);
    const a = luminance(color); const b = luminance(background);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
const surfaces: CompositionChild[] = [];
for (const dir of ["ltr", "rtl"] as const) {
    let surface: ReturnType<typeof Stack>;
    const children: CompositionChild[] = [H2(dir.toUpperCase())];
    for (const variant of ["default", "plain"] as const) {
        const disabled = TextField({ label: "Disabled reference", disabled: true, variant }); children.push(disabled);
        for (const state of ["ready", "valid", "invalid", "readonly", "disabled-readonly"] as const) {
            const field = TextField({ label: `${variant} ${state} ${word}`, description: word, required: true, value: state === "invalid" ? "" : "Example", readOnly: state.includes("readonly"), disabled: state === "disabled-readonly", variant, validationMessages: { valueMissing: word }, announceValidation: false });
            children.push(field);
            if (state === "valid" || state === "invalid") field.validate({ announce: false });
            add(`${dir} ${variant} text ${state}: bounded field and copy`, () => fits(field.element, surface.element) && fits(field.control, field.element));
            if (state === "valid") add(`${dir} ${variant}: valid tick is not mirrored`, () => tick(field.validationIcon));
            if (state === "invalid") add(`${dir} ${variant}: invalid error is visible and linked`, () => !field.errorMessage.hidden && field.control.getAttribute("aria-errormessage")!.split(/\s+/).includes(field.errorMessage.id));
            if (state === "disabled-readonly") add(`${dir} ${variant}: disabled palette wins over readonly`, () => getComputedStyle(field.control).backgroundColor === getComputedStyle(disabled.control).backgroundColor);
        }
        for (const valid of [true, false]) {
            const area = TextField({ label: `${variant} multiline ${word}`, multiline: true, rows: 3, required: true, value: valid ? sentence : "", variant, announceValidation: false, validationMessages: { valueMissing: word } });
            area.validate({ announce: false }); children.push(area);
            add(`${dir} ${variant} textarea ${valid}: bounded`, () => fits(area.element, surface.element) && fits(area.control, area.element));
            const password = PasswordField({ label: `${variant} password ${word}`, value: valid ? "Example" : "", required: true, variant, announceValidation: false, validationMessages: { valueMissing: word } });
            password.validate({ announce: false }); children.push(password);
            add(`${dir} ${variant} password ${valid}: validation and reveal do not overlap`, () => {
                const icon = password.validationIcon.getBoundingClientRect(); const button = password.visibilityButton.element.getBoundingClientRect();
                return fits(password.element, surface.element) && fits(password.visibilityButton.element, password.element) && (icon.right <= button.left || icon.left >= button.right);
            });
        }
        for (const multiple of [false, true]) {
            const select = Select({ label: word, items: [{ value: "first", label: word }, { value: "second", label: sentence }], multiple, variant }); children.push(select);
            add(`${dir} ${variant} select multiple=${multiple}: native control stays bounded`, () => fits(select.element, surface.element) && fits(select.select, select.element));
        }
        const combo = Combobox({ label: word, value: "first", items: [{ value: "first", label: word }, { value: "second", label: sentence }], notFoundText: word, variant, matchAnchorWidth: variant !== "plain", openOnFocus: false, announceOnHover: false }); children.push(combo);
        add(`${dir} ${variant} combobox: root, label and input reflow`, () => fits(combo.element, surface.element) && fits(combo.input, combo.element));
        add(`${dir} ${variant} combobox: popup respects its maximum`, () => {
            combo.open();
            try {
                const width = combo.listbox.getBoundingClientRect().width;
                const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
                return [width <= Math.min(24 * rem, document.documentElement.clientWidth - rem) + 1, `${Math.round(width)}px`];
            } finally { combo.close(); }
        });
        const readonly = TextField({ label: word, readOnly: true });
        const group = FieldGroup({ label: word, description: word, children: [readonly], variant, disabled: true, orientation: "horizontal" }); children.push(group);
        add(`${dir} ${variant} field group: legend and readonly-disabled child fit`, () => fits(group.element, surface.element) && fits(group.legend, group.element) && getComputedStyle(readonly.control).backgroundColor === getComputedStyle(disabled.control).backgroundColor);
    }
    for (const variant of ["neutral", "info", "success", "warning", "danger"] as const) {
        const message = StatusMessage({ text: word, icon: "!", iconPosition: "end", variant, announcement: false }); children.push(message);
        add(`${dir} ${variant} status: long message reflows`, () => fits(message.element, surface.element));
    }
    for (const variant of ["default", "success", "warning", "danger"] as const) {
        const progress = Progress({ label: word, description: word, valueText: word, value: 50, variant }); children.push(progress);
        add(`${dir} ${variant} progress: long label/value/description fit`, () => fits(progress.element, surface.element));
    }
    const indeterminate = Progress({ label: "Indeterminate", description: sentence, value: null }); children.push(indeterminate);
    add(`${dir} indeterminate: native semantics retained`, () => !indeterminate.control.hasAttribute("value") && fits(indeterminate.element, surface.element));
    surface = Stack({ children, gap: "1rem", attributes: { dir, style: "inline-size:20rem;max-inline-size:100%;padding:0.5rem;box-sizing:border-box" } });
    surfaces.push(surface);
}

const toasts = ToastViewport({ label: "Fixture notifications", duration: null, limit: 1, attributes: { lang: "en" } });
function showToast(long = false, variant: "info" | "success" | "warning" | "danger" = "info") {
    toasts.closeAll();
    return toasts.show({ title: word, description: long ? Array.from({ length: 12 }, () => sentence).join(" ") : word, actionText: word, actionLabel: "Fixture action", variant, duration: null });
}
for (const variant of ["info", "success", "warning", "danger"] as const) {
    add(`${variant} toast: long action fits its surface`, () => {
        const toast = showToast(false, variant); const action = toast.element.querySelector<HTMLElement>("[data-af-toast-action]")!;
        return fits(action, toast.element) && fits(toast.element, toasts.element);
    });
}
add("Tall toast stays within the viewport and can scroll", () => {
    showToast(true); const box = toasts.element.getBoundingClientRect();
    return [box.top >= 0 && box.bottom <= innerHeight && box.height <= innerHeight - 16 && /auto|scroll/.test(getComputedStyle(toasts.element).overflowY), `${Math.round(box.height)}px / ${innerHeight}px`];
});
add("The page keeps one bounded Stack column", () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);
const hoverStatus = document.createElement("p"); hoverStatus.setAttribute("role", "status");
const hoverCombo = Combobox({ label: "Hover contrast fixture", items: [{ value: "first", label: "Selected option" }, { value: "second", label: "Other option" }], value: "first", openOnFocus: false, autoUpdate: false, announceOnHover: false });
const hoverProbe = Button({ text: "Probe selected option hover", onPress(event) {
    hoverCombo.open();
    const pointer = event as MouseEvent;
    Object.assign(hoverCombo.listbox.style, { position: "fixed", left: `${Math.max(8, pointer.clientX - 40)}px`, top: `${Math.max(8, pointer.clientY - 24)}px` });
    requestAnimationFrame(() => requestAnimationFrame(() => {
        const selected = hoverCombo.listbox.querySelector<HTMLElement>('[aria-selected="true"]')!;
        const style = getComputedStyle(selected); const ratio = contrast(style.color, style.backgroundColor);
        hoverStatus.textContent = `${selected.matches(":hover") && ratio >= 4.5 ? "PASS" : "FAIL"}: selected option hover, reached=${selected.matches(":hover")}, contrast=${ratio.toFixed(2)}`;
    }));
} });
const run = Button({ text: "Run field and feedback checks", onPress() {
    hoverCombo.close();
    const results = tests.map(test => test()); toasts.closeAll();
    run.element.focus({ preventScroll: true }); run.element.scrollIntoView({ block: "nearest" });
    status.textContent = `${results.filter(result => result.passed).length}/${results.length} field and feedback checks passed`;
    report.replaceChildren(...results.map(result => { const item = document.createElement("li"); item.textContent = `${result.passed ? "PASS" : "FAIL"}: ${result.name}${result.detail ? ` (${result.detail})` : ""}`; return item; }));
} });
const size = Button({ text: "Toggle enlarged text", onPress() { document.documentElement.style.fontSize = document.documentElement.style.fontSize === "32px" ? "16px" : "32px"; } });
const reveal = Button({ text: "Show tall notification", onPress() { showToast(true); } });
const root = Stack({ children: [H2("Fields and feedback"), ThemeToggle({ announcement: false }), size, run, status, report, hoverProbe, hoverStatus, hoverCombo, reveal, ...surfaces], attributes: { style: "max-inline-size:56rem;margin:auto;padding:1rem;box-sizing:border-box" } });
document.querySelector("#app")!.append(root.element, toasts.element);
addPageHideCleanup(window, () => runCleanups([() => root.destroy?.(), toasts.destroy]));
