import "../../packages/components/src/styles/index.css";
import { Brand, Button, HeaderBar, HeaderTools, Select, ThemeToggle } from "../../packages/components/src";
import { addPageHideCleanup, runCleanups } from "../../packages/core/src/events";

const app = document.querySelector<HTMLElement>("#app")!;
app.style.cssText = "padding:1rem;display:grid;gap:1rem;font:16px/1.5 sans-serif";
const status = document.createElement("p"); status.setAttribute("role", "status");
const report = document.createElement("ol");
const frame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
const fixtures = ["ltr", "rtl"].flatMap(dir => [false, true].map(custom => {
    const select = Select({ label: "Language", items: [{value:"en",label:"English"}, {value:"uk",label:"Ukrainian"}], value:"uk" });
    const tools = HeaderTools({ controls: [select, Button({text:"Switch the application theme"}), Button({text:"Sign in to your account"})],
        ...(custom ? { panelOptions: { attributes: {style:"--af-header-tools-panel-width:26rem;--af-header-tools-panel-mobile-width:18rem"} } } : {}) });
    const header = HeaderBar({ brand: Brand({name:"Width test"}), actions:tools,
        attributes: {dir, style:"inline-size:min(100%,16rem);margin-inline-start:auto"} });
    return {dir,custom,select,tools,header};
}));
const theme = ThemeToggle({display:"button",announcement:false});
const largeText = Button({text:"Toggle large text",onPress() {
    document.documentElement.style.fontSize = document.documentElement.style.fontSize ? "" : "32px";
}});
const run = Button({text:"Run width checks",onPress:async () => {
    status.textContent = "Running width checks";
    report.replaceChildren();
    const results: string[] = [];
    const check = (label: string, passed: boolean, detail = "") => results.push(`${passed ? "PASS" : "FAIL"}: ${label} ${detail}`.trim());
    for (const {dir,custom,select,tools,header} of fixtures) {
        const name = `${dir} ${custom ? "custom" : "default"}`;
        header.element.scrollIntoView({block:"nearest"});
        tools.checkPlacement();
        check(`${name}: collapsed placement`,tools.getPlacement() === "menu");
        tools.trigger.element.click();
        const first = tools.panel.getBoundingClientRect();
        const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
        const mobile = matchMedia("(max-width:640px)").matches;
        const expected = Math.min(rem * (mobile ? custom ? 18 : 20 : custom ? 26 : 22),document.documentElement.clientWidth - rem);
        check(`${name}: preferred width on first position`,Math.abs(first.width - expected) < 1,`${first.width.toFixed(1)}/${expected.toFixed(1)}`);
        await frame(); await frame();
        const settled = tools.panel.getBoundingClientRect();
        check(`${name}: no width growth after opening`,Math.abs(first.width - settled.width) < 1);
        select.select.focus();
        tools.panel.dispatchEvent(new WheelEvent("wheel",{bubbles:true,deltaY:40}));
        await frame(); await frame();
        const after = tools.panel.getBoundingClientRect();
        check(`${name}: focus/wheel retain width`,Math.abs(settled.width - after.width) < 1);
        check(`${name}: inside viewport`,after.left >= 7 && after.right <= document.documentElement.clientWidth - 7);
        check(`${name}: no horizontal panel overflow`,tools.panel.scrollWidth <= tools.panel.clientWidth + 1);
        tools.closeButton.element.click();
    }
    report.replaceChildren(...results.map(text => {const li=document.createElement("li");li.textContent=text;return li;}));
    status.textContent = `${results.filter(text=>text.startsWith("PASS")).length}/${results.length} width checks passed`;
}});
app.append(run.element,theme.element,largeText.element,status,...fixtures.map(item=>item.header.element),report);
addPageHideCleanup(window,()=>runCleanups([run.destroy,theme.destroy,largeText.destroy,...fixtures.map(item=>item.header.destroy)]));
