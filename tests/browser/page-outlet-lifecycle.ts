import "../../packages/components/src/styles/index.css";
import { AppShell, Button, H2, P, PageOutlet, Stack, ThemeToggle } from "../../packages/components/src";
import { addPageHideCleanup } from "../../packages/core/src/events";

const status = document.createElement("p"); status.setAttribute("role", "status");
const report = document.createElement("ol");
const surface = document.createElement("div");
let running = false;
const waitFrame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
const checks = Button({ text: "Run outlet checks", async onPress() {
    if (running) return;
    running = true;
    const results: Array<{ name: string; passed: boolean }> = [];
    const check = (name: string, passed: boolean) => results.push({ name, passed });
    const outlet = PageOutlet({ scrollOnRender: false });
    const foreignFrame = document.createElement("iframe");
    foreignFrame.title = "Foreign document focus check";
    surface.append(outlet.element);
    let scrolls = 0;
    outlet.element.scrollIntoView = () => { scrolls += 1; };
    try {
        outlet.render(H2("First screen"));
        check("New screen heading receives native focus", document.activeElement === outlet.element.querySelector("h2"));
        let removed = 0; let abandoned = 0; let obsoleteEffects = 0;
        outlet.render({ element: document.createElement("p"), destroy() {
            removed += 1;
            outlet.render(H2("Newest screen"), { documentTitle: "Newest screen" });
        } });
        outlet.render({ element: document.createElement("h2"), destroy() { abandoned += 1; } }, {
            documentTitle: "Obsolete screen", scroll: true,
            focusTarget: () => { obsoleteEffects += 1; return document.body; },
            announcement: () => { obsoleteEffects += 1; return "Obsolete speech"; }
        });
        check("Nested cleanup navigation keeps the newest screen", outlet.element.textContent === "Newest screen");
        check("Nested navigation keeps the newest document title", document.title === "Newest screen");
        check("Removed and abandoned children are each cleaned once", removed === 1 && abandoned === 1);
        check("Old focus, announcement and scroll effects are skipped", obsoleteEffects === 0 && scrolls === 0);

        const first = H2("Focus event screen");
        first.element.addEventListener("focus", () => outlet.render(H2("Focus destination")));
        outlet.render(first, { announcement: () => { obsoleteEffects += 1; return "Obsolete speech"; } });
        check("A native focus listener can navigate without old speech", document.activeElement?.textContent === "Focus destination" && obsoleteEffects === 0);

        outlet.render(P("Resolver screen"), { focusTarget: () => {
            outlet.render(H2("Resolver destination"));
            return checks.element;
        } });
        check("A nested focus resolver cannot reclaim focus", document.activeElement?.textContent === "Resolver destination");

        outlet.render(H2("Old scheduled screen"), { scroll: true });
        outlet.render(H2("Latest scheduled screen"), { scroll: true });
        await waitFrame();
        check("Only the latest follow-up scroll runs", scrolls === 3);

        outlet.render(P("Pending speech"), { focusTarget: null, announcement: "Obsolete pending speech" });
        outlet.render(H2("Quiet destination"));
        await new Promise(resolve => setTimeout(resolve, 80));
        check("A new focused view clears the previous pending message", ![...document.querySelectorAll("[data-af-live-region]")].some(region => region.textContent?.includes("Obsolete pending speech")));

        surface.append(foreignFrame);
        const foreignDocument = foreignFrame.contentDocument!;
        const button = foreignDocument.createElement("button"); button.textContent = "Foreign focus target";
        foreignDocument.body.append(button);
        check("Explicit focus supports a foreign document realm", outlet.focus(button) && foreignDocument.activeElement === button);

        outlet.render(H2("Last scheduled screen"), { scroll: true });
        const beforeDestroy = scrolls;
        outlet.destroy(); await waitFrame();
        check("Destroy cancels pending scrolling and detaches the outlet", scrolls === beforeDestroy && !outlet.element.isConnected);
        let late = 0;
        outlet.setTitle("Late");
        outlet.render(H2("Late"), { documentTitle: "Late", focusTarget: () => { late += 1; return document.body; } });
        outlet.update({ className: "late" });
        check("Destroyed outlets do not accept content, focus or metadata", late === 0 && document.title !== "Late" && outlet.element.className !== "late" && !outlet.element.textContent?.includes("Late"));
        check("The fixture has no horizontal overflow", document.documentElement.scrollWidth <= innerWidth);
    } finally {
        outlet.destroy(); foreignFrame.remove(); surface.replaceChildren(); running = false;
        document.title = "AF PageOutlet Lifecycle Audit";
    }
    report.replaceChildren(...results.map(result => {
        const item = document.createElement("li"); item.textContent = `${result.passed ? "PASS" : "FAIL"}: ${result.name}`; return item;
    }));
    status.textContent = `${results.filter(result => result.passed).length}/${results.length} outlet checks passed`;
    checks.element.focus();
} });
const direction = Button({ text: "Toggle direction", onPress() {
    document.documentElement.dir = document.documentElement.dir === "rtl" ? "ltr" : "rtl";
} });
const theme = ThemeToggle({ announcement: false });
const shell = AppShell({ title: "AF PageOutlet Lifecycle Audit", theme: "light",
    content: Stack({ children: [H2("PageOutlet lifecycle"), checks, direction, theme, status, report, surface] }) });
document.querySelector("#app")!.append(shell.element);
addPageHideCleanup(window, shell.destroy);
