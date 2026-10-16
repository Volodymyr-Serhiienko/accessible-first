import "../../packages/components/src/styles/index.css";
import { Button, ResponsiveNavigation, ResponsiveNavigationFocusLink, OverflowScroller, ThemeToggle } from "../../packages/components/src";
import { addPageHideCleanup, runCleanups } from "../../packages/core/src/events";

const app = document.querySelector<HTMLElement>("#app")!;
app.style.cssText = "max-width:60rem;margin:auto;padding:1rem;font:16px/1.5 sans-serif;display:grid;gap:1rem;min-width:0";
const heading = document.createElement("h1"); heading.textContent = "AF Responsive Navigation Audit";
const status = document.createElement("p"); status.setAttribute("role", "status");
const report = document.createElement("ol");
let activations = 0;
const leadingControls: ReturnType<typeof Button>[] = [];
const navigation = ResponsiveNavigation({
    items: Array.from({ length: 9 }, (_, index) => ({ id: `route-${index}`, label: index === 8 ? "LongNavigationLabelWithoutSpaces".repeat(6) : `Section ${index + 1}`, href: `#route-${index}` })),
    current: "route-1", trigger: "Sections", closeButton: "Close menu",
    leadingContent() { const button = Button({ text: "Languages" }); leadingControls.push(button); return button; },
    onNavigate(detail) { activations += 1; navigation.setCurrent(detail.item.id ?? null); status.textContent = `Activation ${activations}: ${detail.item.id}`; }
});
const returnLink = ResponsiveNavigationFocusLink({ navigation, href: "#navigation", text: "Return to navigation", scroll: false });
const update = Button({ text: "Update navigation chrome", onPress() { navigation.update({ size: "md", attributes: { "data-chrome-update": "true" } }); status.textContent = "Navigation chrome updated"; } });
const direction = Button({ text: "Toggle direction", onPress() {
    document.documentElement.dir = document.documentElement.dir === "rtl" ? "ltr" : "rtl";
    navigation.checkLayout(); scroller.refresh(); status.textContent = `Direction: ${document.documentElement.dir}`;
} });
const theme = ThemeToggle({ announcement: false });
const outside = document.createElement("input"); outside.setAttribute("aria-label", "External destination");
const content = document.createElement("div"); content.style.cssText = "display:flex;gap:1rem;min-width:max-content";
for (let index = 0; index < 15; index += 1) { const button = document.createElement("button"); button.textContent = `Overflow item ${index + 1}`; content.append(button); }
const scroller = OverflowScroller({ children: [content], label: "Independent overflow", scrollAmount: 180 });
const run = Button({ text: "Run navigation checks", onPress() {
    const checks: Array<{ name: string; passed: boolean }> = [];
    const check = (name: string, passed: boolean) => checks.push({ name, passed });
    const mobile = getComputedStyle(navigation.mobileDisclosure.element).display !== "none";
    const list = mobile ? navigation.mobileNavigation : navigation.desktopNavigation;
    if (mobile) navigation.mobileDisclosure.open();
    const leading = leadingControls[mobile ? 1 : 0]!;
    leading.element.focus();
    const before = leadingControls.length;
    navigation.update({ className: "chrome-only" });
    check("Desktop and mobile own separate leading controls", leadingControls.length === 2 && leadingControls[0] !== leadingControls[1]);
    check("Chrome-only update does not recreate leading controls", leadingControls.length === before && document.activeElement === leading.element);
    check("Each branch retains its expected orientation", navigation.desktopNavigation.element.dataset.afOrientation === "horizontal" && navigation.mobileNavigation.element.dataset.afOrientation === "vertical");
    check("Links remain native anchors with hrefs", list.items.every(item => item.link.element instanceof HTMLAnchorElement && Boolean(item.link.element.getAttribute("href"))));
    check("Exactly one link per branch is current", [navigation.desktopNavigation, navigation.mobileNavigation].every(branch => branch.items.filter(item => item.isCurrent()).length === 1));
    const link = list.items[1]!.link.element; link.focus();
    check("Link focus is visible", getComputedStyle(link).outlineStyle !== "none" && getComputedStyle(link).outlineWidth !== "0px");
    check("Return target is visible and enabled", navigation.getFocusTarget().getClientRects().length > 0 && navigation.getFocusTarget().getAttribute("aria-disabled") !== "true");
    returnLink.update({ text: "Return to navigation" });
    check("Return link updates without recursion", returnLink.element.textContent === "Return to navigation");
    check("Return link focuses its resolved destination", returnLink.focusTarget().focused && document.activeElement === navigation.getFocusTarget());
    const active = list.items[1]!.link.element; const prior = activations; active.click();
    check("Activation is delivered once", activations === prior + 1);
    check("Activation closes the mobile menu", !navigation.mobileDisclosure.isOpen());
    if (mobile) navigation.mobileDisclosure.open();
    const last = list.items[list.items.length - 1]!.link.element;
    check("Long mobile link text stays within its container", !mobile || last.scrollWidth <= last.clientWidth + 1);
    const listViewport = (mobile ? list.element : navigation.desktopScroller.viewport).getBoundingClientRect();
    check("Active navigation viewport stays within the screen", listViewport.left >= 0 && listViewport.right <= innerWidth + 1);
    check("Mobile trigger has a usable touch target", !mobile || navigation.mobileDisclosure.trigger.getBoundingClientRect().height >= 44);
    navigation.mobileDisclosure.close();
    outside.focus(); navigation.checkLayout();
    check("Layout checks preserve external focus", document.activeElement === outside);
    check("Direction marker follows the actual viewport", scroller.element.dataset.afOverflowScrollerDirection === getComputedStyle(scroller.viewport).direction);
    check("Independent scroller has overflow", scroller.viewport.scrollWidth > scroller.viewport.clientWidth);
    check("Scroller reserves inline focus-ring padding", Number.parseFloat(getComputedStyle(scroller.viewport).paddingInlineStart) >= 3);
    check("Document has no horizontal overflow", document.documentElement.scrollWidth <= innerWidth);
    report.replaceChildren(...checks.map(check => { const item = document.createElement("li"); item.textContent = `${check.passed ? "PASS" : "FAIL"}: ${check.name}`; return item; }));
    status.textContent = `${checks.filter(check => check.passed).length}/${checks.length} navigation checks passed`;
} });
app.append(heading, run.element, theme.element, direction.element, status, navigation.element, update.element, returnLink.element, outside, scroller.element, report);
addPageHideCleanup(window, () => runCleanups([navigation.destroy, scroller.destroy, returnLink.destroy, update.destroy, direction.destroy, theme.destroy, run.destroy]));
