import "../../packages/components/src/styles/index.css";
import {
    Accordion, AccountControl, Breadcrumbs, Button, Dialog, Disclosure, DropdownMenu, Form, H2, Listbox, Menu,
    Navigation, OverflowScroller, Pagination, Popover, ResponsiveNavigation, Stack,
    Tabs, ThemeToggle, Tooltip, type CompositionChild
} from "../../packages/components/src";
import { addPageHideCleanup } from "../../packages/core/src/events";

type Result = { name: string; passed: boolean };
const tests: Array<() => Result> = [];
const word = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".repeat(2);
const sentence = "Long content remains readable and its actions remain reachable with a keyboard.";
const status = document.createElement("p"); status.setAttribute("role", "status");
const report = document.createElement("ol"); report.style.overflowWrap = "anywhere";
function add(name: string, test: () => boolean): void { tests.push(() => ({ name, passed: test() })); }
function fits(element: HTMLElement, parent: HTMLElement, scroll = false): boolean {
    const a = element.getBoundingClientRect(); const b = parent.getBoundingClientRect();
    return a.left >= b.left - 1 && a.right <= b.right + 1 && (scroll || element.scrollWidth <= element.clientWidth + 1);
}
function child(): HTMLElement {
    const node = document.createElement("div"); node.textContent = word;
    node.style.cssText = "inline-size:20rem;max-inline-size:100%;min-inline-size:0;overflow-wrap:anywhere";
    return node;
}
function corner(element: HTMLElement, first: "top" | "right", second: "bottom" | "left"): boolean {
    const style = getComputedStyle(element, "::after");
    const width = (side: string) => parseFloat(style.getPropertyValue(`border-${side}-width`));
    return width(first) > 0 && width(second) > 0 && ["top", "right", "bottom", "left"].filter(side => side !== first && side !== second).every(side => width(side) === 0);
}
function inViewport(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    return rect.left >= 0 && rect.right <= document.documentElement.clientWidth + 1
        && rect.top >= 0 && rect.bottom <= document.documentElement.clientHeight + 1;
}
const surfaces: CompositionChild[] = [];
for (const dir of ["ltr", "rtl"] as const) {
    const children: CompositionChild[] = [H2(dir.toUpperCase())];
    let surface: ReturnType<typeof Stack>;
    for (const variant of ["default", "plain", "pills"] as const) {
        for (const orientation of ["horizontal", "vertical"] as const) {
            const nav = Navigation({ variant, orientation,
                items: [{ id: "first", label: word, href: "#first", current: "page" }, { id: "second", label: word, href: "#second" }],
                onNavigate(detail) { detail.event.preventDefault(); } }); children.push(nav);
            add(`${dir} ${variant} ${orientation} Navigation: long links fit`, () => fits(nav.element, surface.element)
                && [...nav.element.querySelectorAll<HTMLElement>("a")].every(item => fits(item, nav.element)));
            add(`${dir} ${variant} ${orientation} Navigation: current stays native`, () => nav.element.querySelector('a[aria-current="page"]') !== null);
        }
    }
    for (const variant of ["default", "plain"] as const) {
        const formChild = child(); const form = Form({ children: [formChild], variant }); children.push(form);
        add(`${dir} ${variant} Form: bounded content grid`, () => fits(form.element, surface.element) && fits(formChild, form.element));
        const blockChild = child();
        const disclosure = Disclosure({ trigger: word, description: word, panel: blockChild, open: true, variant, announcement: false }); children.push(disclosure);
        add(`${dir} ${variant} Disclosure: root, trigger and body fit`, () => fits(disclosure.element, surface.element)
            && fits(disclosure.trigger, disclosure.element) && fits(blockChild, disclosure.panel));
        add(`${dir} ${variant} Disclosure: chevron is not mirrored`, () => corner(disclosure.trigger, "right", "bottom"));
        const accordionChild = child();
        const accordion = Accordion({ variant, announcement: false, items: [
            { value: "first", trigger: word, panel: accordionChild, open: true },
            { value: "second", trigger: word, panel: word },
            { value: "disabled", trigger: "Disabled section", panel: word, disabled: true }
        ] }); children.push(accordion);
        add(`${dir} ${variant} Accordion: bounded open content`, () => fits(accordion.element, surface.element) && fits(accordionChild, accordion.items[0]!.panel));
        add(`${dir} ${variant} Accordion: closed panel stays hidden`, () => accordion.items[1]!.panel.getClientRects().length === 0);
        for (const orientation of ["horizontal", "vertical"] as const) {
            const tabChild = child();
            const tabs = Tabs({ variant, orientation, announceOnHover: false, activationMode: "manual", items: [
                { value: "first", tab: word, panel: tabChild },
                { value: "second", tab: word, panel: sentence },
                { value: "disabled", tab: "Disabled tab", panel: sentence, disabled: true }
            ] }); children.push(tabs);
            add(`${dir} ${variant} ${orientation} Tabs: labels and selected content fit`, () => fits(tabs.element, surface.element)
                && fits(tabs.tablist, tabs.element) && fits(tabChild, tabs.items[0]!.panel));
            add(`${dir} ${variant} ${orientation} Tabs: only selected panel is visible`, () => tabs.items[0]!.panel.getClientRects().length > 0
                && tabs.items.slice(1).every(item => item.panel.getClientRects().length === 0));
            const menu = Menu({ variant, orientation, announceOnHover: false, items: [{ value: "first", label: word }, { value: "disabled", label: word, disabled: true }],
                attributes: { "aria-label": `${dir} ${variant} ${orientation} commands` } }); children.push(menu);
            add(`${dir} ${variant} ${orientation} Menu: labels wrap without horizontal scrolling`, () => fits(menu.element, surface.element)
                && menu.items.every(item => fits(item.item, menu.element)));
            const listbox = Listbox({ label: `${dir} ${variant} ${orientation} choices`, variant, orientation, announceOnHover: false,
                items: [{ value: "first", label: word }, { value: "second", label: word }] }); children.push(listbox);
            add(`${dir} ${variant} ${orientation} Listbox: bounded vertical labels or local horizontal track`, () => fits(listbox.element, surface.element, orientation === "horizontal")
                && (orientation === "horizontal" || listbox.element.scrollWidth <= listbox.element.clientWidth + 1));
        }
        const breadcrumbs = Breadcrumbs({ variant, items: [{ label: word, href: "#home" }, { label: word }] }); children.push(breadcrumbs);
        add(`${dir} ${variant} Breadcrumbs: labels and separators fit`, () => fits(breadcrumbs.element, surface.element));
        const pages = Pagination({ page: 2, pageCount: 10, previousText: word, nextText: word, variant,
            onPageChange(detail, owner) { owner.setPage(detail.page); } }); children.push(pages);
        add(`${dir} ${variant} Pagination: long controls fit`, () => fits(pages.element, surface.element));
        const dialogChild = child();
        const dialog = Dialog({ trigger: `${dir} ${variant} dialog`, title: word, description: word, children: [dialogChild], variant,
            actions: Button({ text: "Dialog action" }), closeText: "Close fixture dialog" }); children.push(dialog);
        add(`${dir} ${variant} Dialog: surface and copy fit`, () => {
            dialog.trigger.scrollIntoView({ block: "center" }); dialog.open();
            try { return inViewport(dialog.surface) && fits(dialogChild, dialog.surface) && dialog.surface.scrollWidth <= dialog.surface.clientWidth + 1; }
            finally { dialog.close(); }
        });
        const floatingChild = child();
        const floating = Popover({ trigger: `${dir} ${variant} popover`, description: word, children: [floatingChild, Button({ text: "Popover action" })], variant,
            announcement: false }); children.push(floating);
        add(`${dir} ${variant} Popover: positioned surface and body fit`, () => {
            floating.trigger.scrollIntoView({ block: "center" }); floating.open();
            try { return inViewport(floating.content) && fits(floatingChild, floating.content) && floating.content.scrollWidth <= floating.content.clientWidth + 1; }
            finally { floating.close(); }
        });
        const absoluteChild = child();
        const absolute = Popover({ trigger: `${dir} ${variant} absolute popover`, strategy: "absolute", announcement: false,
            attributes: { style: "position:relative;inline-size:100%" }, children: [absoluteChild], variant }); children.push(absolute);
        add(`${dir} ${variant} absolute Popover: containing-block bound and body fit`, () => {
            absolute.trigger.scrollIntoView({ block: "center" }); absolute.open();
            try { return inViewport(absolute.content) && fits(absoluteChild, absolute.content)
                && absolute.content.getBoundingClientRect().width <= absolute.element.getBoundingClientRect().width + 1; }
            finally { absolute.close(); }
        });
    }
    const dropdown = DropdownMenu({ trigger: `${dir} dropdown`, value: "first", items: [{ value: "first", label: word }, { value: "second", label: word }] }); children.push(dropdown);
    add(`${dir} Dropdown: chevron is not mirrored`, () => corner(dropdown.trigger, "right", "bottom"));
    add(`${dir} Dropdown: long menu items fit inside popup`, () => {
        dropdown.trigger.scrollIntoView({ block: "center" }); dropdown.open();
        try { return inViewport(dropdown.menu.element) && dropdown.menu.element.scrollWidth <= dropdown.menu.element.clientWidth + 1; }
        finally { dropdown.close(); }
    });
    for (const controls of ["auto", "always", "none"] as const) {
        const strip = OverflowScroller({ controls, label: `${dir} ${controls} strip`, children: Array.from({ length: 6 }, (_, i) => Button({ text: `Action ${i + 1}` })) }); children.push(strip);
        add(`${dir} ${controls} OverflowScroller: track stays local`, () => { strip.refresh(); return fits(strip.element, surface.element) && fits(strip.viewport, strip.element, true); });
        if (controls !== "none") {
            add(`${dir} ${controls} OverflowScroller: buttons are 44px border boxes`, () => {
                const rect = strip.nextButton.getBoundingClientRect(); return Math.abs(rect.width - 44) < 1 && Math.abs(rect.height - 44) < 1;
            });
            add(`${dir} ${controls} OverflowScroller: physical chevron edges`, () => {
                const style = getComputedStyle(strip.nextButton, "::before"); return parseFloat(style.borderTopWidth) > 0 && parseFloat(style.borderLeftWidth) > 0
                    && parseFloat(style.borderRightWidth) === 0 && parseFloat(style.borderBottomWidth) === 0;
            });
        }
    }
    const responsive = ResponsiveNavigation({ items: [{ label: word, href: "#first", current: "page" }, { label: word, href: "#second" }],
        trigger: word, leadingContent: () => DropdownMenu({ trigger: "Language", items: [{ value: "first", label: word }] }),
        disclosureOptions: { announcement: false }, onNavigate(detail) { detail.event.preventDefault(); } }); children.push(responsive);
    add(`${dir} ResponsiveNavigation: desktop track or mobile panel fit`, () => {
        responsive.desktopScroller.refresh();
        if (responsive.mobileDisclosure.element.getClientRects().length) {
            responsive.mobileDisclosure.open();
            try { return fits(responsive.element, surface.element) && fits(responsive.mobileNavigation.element, responsive.element); }
            finally { responsive.mobileDisclosure.close(); }
        }
        return fits(responsive.element, surface.element) && fits(responsive.desktopScroller.viewport, responsive.element, true);
    });
    children.push(Tooltip({ trigger: Button({ text: `${dir} tooltip probe` }), text: sentence, announceOnHover: false }));
    const themeTarget = document.createElement("div");
    const themeButton = ThemeToggle({ target: themeTarget, toDarkLabel: word, toLightLabel: word, announcement: false }); children.push(themeButton);
    add(`${dir} ThemeToggle button: long label fits`, () => fits(themeButton.element, surface.element));
    const themeSwitch = ThemeToggle({ target: themeTarget, display: "switch", switchLabel: `${dir} theme switch`, announcement: false }); children.push(themeSwitch);
    themeSwitch.element.querySelector<HTMLElement>("[data-af-theme-toggle-switch-thumb]")!.style.transition = "none";
    for (const theme of ["light", "dark"] as const) add(`${dir} ThemeToggle switch ${theme}: thumb stays inside track on its logical side`, () => {
        themeSwitch.setTheme(theme);
        const track = themeSwitch.element.querySelector<HTMLElement>("[data-af-theme-toggle-switch-track]")!;
        const thumb = themeSwitch.element.querySelector<HTMLElement>("[data-af-theme-toggle-switch-thumb]")!;
        const a = thumb.getBoundingClientRect(); const b = track.getBoundingClientRect();
        const physicalEnd = (theme === "dark") === (dir === "ltr");
        return a.left >= b.left && a.right <= b.right && a.top >= b.top - 1 && a.bottom <= b.bottom + 1
            && (physicalEnd ? a.left + a.width / 2 > b.left + b.width / 2 : a.left + a.width / 2 < b.left + b.width / 2);
    });
    const account = AccountControl({ signInLabel: word, signOutLabel: word, hintDisplay: "none" }); children.push(account);
    add(`${dir} AccountControl button: long label fits`, () => fits(account.element, surface.element));
    surface = Stack({ children, attributes: { dir, style: "inline-size:20rem;max-inline-size:100%;padding:0.5rem;box-sizing:border-box" } }); surfaces.push(surface);
}
const tallDialog = Dialog({ trigger: "Open tall dialog", title: "Scrollable fixture dialog", description: sentence,
    children: [Array.from({ length: 30 }, () => sentence).join(" ")], closeText: "Close tall dialog", actions: Button({ text: "Last dialog action" }) });
const tallPopover = Popover({ trigger: "Open tall popover", announcement: false, children: [Array.from({ length: 20 }, () => sentence).join(" "),
    Button({ text: "Last popover action" })] });
const run = Button({ text: "Run navigation and overlay checks", onPress() {
    const results = tests.map(test => test());
    results.push({ name: "Page: no horizontal overflow", passed: document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1 });
    status.textContent = `${results.filter(result => result.passed).length}/${results.length} navigation and overlay checks passed`;
    report.replaceChildren(...results.map(result => { const item = document.createElement("li"); item.textContent = `${result.passed ? "PASS" : "FAIL"}: ${result.name}`; return item; }));
    run.element.focus({ preventScroll: true }); run.element.scrollIntoView({ block: "start" });
} });
const size = Button({ text: "Toggle enlarged text", onPress() { document.documentElement.style.fontSize = document.documentElement.style.fontSize === "32px" ? "16px" : "32px"; } });
const root = Stack({ children: [H2("Navigation and overlay styles"), ThemeToggle({ announcement: false }), size, run, status, report,
    tallDialog, tallPopover, ...surfaces], attributes: { style: "max-inline-size:56rem;margin:auto;padding:1rem;box-sizing:border-box" } });
document.querySelector("#app")!.append(root.element);
addPageHideCleanup(window, () => root.destroy?.());
