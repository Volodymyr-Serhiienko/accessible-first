import "../../packages/components/src/styles/index.css";
import { Button, Checkbox, H2, Icon, IconButton, IconLabel, Link, RadioGroup, Stack, Switch, ThemeToggle, createIconButton, type CompositionChild } from "../../packages/components/src";
import { addPageHideCleanup } from "../../packages/core/src/events";

type Check = { name: string; passed: boolean; detail: string };
const checks: Array<() => Check> = [];
const status = document.createElement("p"); status.setAttribute("role", "status");
const report = document.createElement("ol");
const longText = "A long localized label with several words that must remain readable";
const longWord = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const icon = () => Icon({ path: "M5 12h14M12 5v14" });
const close = (a: number, b: number) => Math.abs(a - b) < 0.6;
const rgb = (color: string) => color.match(/[\d.]+/g)!.slice(0, 3).map(Number);
const blend = (foreground: number[], background: number[], opacity: number) => foreground.map((value, i) => value * opacity + background[i]! * (1 - opacity));
function contrast(a: number[], b: number[]): number {
    const luminance = (color: number[]) => color.map(value => { const c = value / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; })
        .reduce((sum, value, i) => sum + value * [0.2126, 0.7152, 0.0722][i]!, 0);
    const first = luminance(a); const second = luminance(b);
    return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}
function add(name: string, test: () => boolean | [boolean, string]): void {
    checks.push(() => { const result = test(); return { name, passed: typeof result === "boolean" ? result : result[0], detail: typeof result === "boolean" ? "" : result[1] }; });
}
function fits(element: HTMLElement, parent: HTMLElement): boolean {
    const box = element.getBoundingClientRect(); const bounds = parent.getBoundingClientRect();
    return box.left >= bounds.left - 1 && box.right <= bounds.right + 1 && element.scrollWidth <= element.clientWidth + 1;
}
function centeredMark(element: HTMLElement): boolean {
    const style = getComputedStyle(element, "::after"); const host = getComputedStyle(element);
    const box = element.getBoundingClientRect(); const matrix = new DOMMatrixReadOnly(style.transform);
    const center = parseFloat(host.borderLeftWidth) + parseFloat(style.left) + matrix.e + parseFloat(style.width) / 2;
    return close(center, box.width / 2);
}

const surfaces: Array<ReturnType<typeof Stack>> = [];
for (const dir of ["ltr", "rtl"] as const) {
    let surface: ReturnType<typeof Stack>;
    const children: CompositionChild[] = [H2(dir.toUpperCase())];
    for (const variant of ["primary", "secondary", "ghost", "danger"] as const) {
        const normal = Button({ text: `${variant} ${longText}`, variant });
        const pending = Button({ text: `${variant} waiting`, variant, pending: true, pendingMessage: false });
        const disabled = Button({ text: `${variant} unavailable`, variant, disabled: true });
        const pressed = Button({ text: `${variant} pressed`, variant, pressed: true });
        const group = Stack({ children: [normal, pending, disabled, pressed] }); children.push(group);
        add(`${dir} ${variant}: text wraps inside the button`, () => fits(normal.element, surface.element));
        add(`${dir} ${variant}: pressed has a visible state`, () => getComputedStyle(pressed.element).boxShadow !== "none");
        for (const [state, control] of [["ready", normal], ["pending", pending]] as const) {
            add(`${dir} ${variant} ${state}: text contrast`, () => {
                const style = getComputedStyle(control.element); const base = rgb(getComputedStyle(document.body).backgroundColor);
                const background = style.backgroundColor === "rgba(0, 0, 0, 0)" ? base : rgb(style.backgroundColor);
                const opacity = Number(style.opacity);
                const ratio = contrast(blend(rgb(style.color), base, opacity), blend(background, base, opacity));
                return [ratio >= 4.5, ratio.toFixed(2)];
            });
        }
        add(`${dir} ${variant}: pending is not disabled`, () => pending.element.getAttribute("aria-busy") === "true" && !pending.element.hasAttribute("disabled") && pending.element.getAttribute("aria-disabled") !== "true");
        add(`${dir} ${variant}: disabled keeps a distinct state`, () => disabled.element.matches(":disabled") && getComputedStyle(disabled.element).color !== getComputedStyle(normal.element).color);
        const icons = [0, 1, 2].map(index => IconButton({ label: `${dir} ${variant} icon ${index + 1}`, icon: icon(), variant, hintDisplay: "none" }));
        const enhanced = document.createElement("span"); enhanced.append(icon().element);
        const enhancedControl = createIconButton(enhanced, { label: `${dir} ${variant} enhanced icon`, variant });
        const row = Stack({ children: [...icons, { element: enhanced, destroy: enhancedControl.destroy }], attributes: { style: "display:flex;flex-direction:row;inline-size:176px;max-inline-size:100%;gap:0" } });
        children.push(row);
        add(`${dir} ${variant}: icon buttons retain exact target dimensions`, () => [...icons, { element: enhanced }].every(control => {
            const box = control.element.getBoundingClientRect(); return close(box.width, 44) && close(box.height, 44);
        }));
    }
    for (const variant of ["default", "muted", "standalone"] as const) {
        const link = Link({ text: longWord, href: "#style-fixture", variant, onNavigate(event) { event.preventDefault(); } });
        const rich = Link({ children: [IconLabel({ label: longWord, icon: icon() })], href: "#style-fixture", variant, onNavigate(event) { event.preventDefault(); } });
        const group = Stack({ children: [link, rich] }); children.push(group);
        add(`${dir} ${variant}: long plain and rich links reflow`, () => fits(link.element, surface.element) && fits(rich.element, surface.element));
    }
    const checked = Checkbox({ label: longText, checked: true });
    const mixed = Checkbox({ label: longText, checked: "mixed" });
    const radio = RadioGroup({ label: "Choose a mode", value: "first", items: [{ value: "first", label: longText }, { value: "second", label: longText }] });
    const toggle = Switch({ label: longText, checked: true });
    const toggles = Stack({ children: [checked, mixed, radio, toggle] }); children.push(toggles);
    const checkboxMark = checked.element.querySelector<HTMLElement>("[data-af-checkbox-indicator]")!;
    const mixedMark = mixed.element.querySelector<HTMLElement>("[data-af-checkbox-indicator]")!;
    const radioMark = radio.element.querySelector<HTMLElement>("[data-af-radio-indicator]")!;
    add(`${dir}: checkbox tick keeps its conventional shape`, () => {
        const style = getComputedStyle(checkboxMark, "::after"); return parseFloat(style.borderRightWidth) > 0 && parseFloat(style.borderBottomWidth) > 0 && parseFloat(style.borderLeftWidth) === 0;
    });
    add(`${dir}: mixed mark is centered`, () => centeredMark(mixedMark));
    add(`${dir}: selected radio mark is centered`, () => centeredMark(radioMark));
    add(`${dir}: toggle labels reflow`, () => [checked, mixed, radio, toggle].every(control => fits(control.element, surface.element)));
    add(`${dir}: switch thumb stays inside its track`, () => {
        const track = toggle.element.querySelector<HTMLElement>("[data-af-switch-track]")!;
        const thumb = toggle.element.querySelector<HTMLElement>("[data-af-switch-thumb]")!;
        return fits(thumb, track);
    });
    const disabledFieldset = document.createElement("fieldset"); disabledFieldset.disabled = true; disabledFieldset.style.cssText = "min-inline-size:0;margin:0;padding:0.5rem";
    const inherited = Checkbox({ label: "Disabled by fieldset", checked: true }); disabledFieldset.append(inherited.element);
    children.push({ element: disabledFieldset, destroy: inherited.destroy });
    add(`${dir}: native fieldset disabled is styled`, () => inherited.input.matches(":disabled") && getComputedStyle(inherited.label).cursor === "not-allowed");
    add(`${dir}: native proxy focus paints an indicator ring`, () => {
        checked.input.focus({ preventScroll: true }); const style = getComputedStyle(checkboxMark);
        return [style.outlineStyle !== "none" && parseFloat(style.outlineWidth) > 0, `${style.outlineStyle} ${style.outlineWidth}`];
    });
    surface = Stack({ children, gap: "1rem", attributes: { dir, style: "inline-size:18rem;max-inline-size:100%;padding:0.5rem;box-sizing:border-box" } });
    surfaces.push(surface);
}
const run = Button({ text: "Run control style checks", onPress() {
    const results = checks.map(check => check()); run.element.focus({ preventScroll: true });
    const passed = results.filter(result => result.passed).length;
    status.textContent = `${passed}/${results.length} control style checks passed`;
    report.replaceChildren(...results.map(result => {
        const item = document.createElement("li"); item.textContent = `${result.passed ? "PASS" : "FAIL"}: ${result.name}${result.detail ? ` (${result.detail})` : ""}`; return item;
    }));
} });
const size = Button({ text: "Toggle enlarged text", onPress() {
    for (const surface of surfaces) surface.element.style.fontSize = surface.element.style.fontSize === "32px" ? "16px" : "32px";
} });
const root = Stack({ children: [H2("Control styles"), ThemeToggle({ announcement: false }), size, run, status, report, ...surfaces], attributes: { style: "max-inline-size:60rem;margin:auto;padding:1rem;box-sizing:border-box" } });
document.querySelector("#app")!.append(root.element);
addPageHideCleanup(window, () => root.destroy?.());
