import "../../packages/components/src/styles/index.css";
import { Button, H2, P, PageOutlet, Stack, ThemeToggle, createHashRouter, type HashRouter, type HashRouterRoute } from "../../packages/components/src";
import { addPageHideCleanup } from "../../packages/core/src/events";

const quiet = { scroll: false, focusTarget: null, announcement: false } as const;
const status = document.createElement("p"); status.setAttribute("role", "status");
const report = document.createElement("ol"); const surface = document.createElement("div");
const run = Button({ text: "Run router checks", onPress() {
    const results: Array<{ name: string; passed: boolean }> = [];
    const check = (name: string, passed: boolean) => results.push({ name, passed });
    const title = document.title;
    let obsoletePresses = 0; let activePresses = 0;
    const obsolete = Button({ text: "Obsolete action", onPress() { obsoletePresses += 1; } });
    const active = Button({ text: "Active action", onPress() { activePresses += 1; } });
    const outlet = PageOutlet({ scrollOnRender: false }); surface.append(outlet.element);
    const events: string[] = []; let router: HashRouter<HashRouterRoute>;
    const routes: HashRouterRoute[] = [
        { id: "outer", title: "Outer", render() { router.navigate("inner", quiet); return obsolete; } },
        { id: "inner", title: "Inner", render: () => [H2("Inner"), active] },
        { id: "final", title: "Final", render: () => H2("Final") }
    ];
    router = createHashRouter({ routes, outlet, onRouteChange(route) { events.push(route.id); } });
    try {
        const success = router.navigate("outer", quiet); obsolete.element.click(); active.element.click();
        check("A nested renderer wins and reports supersession", !success && router.getCurrentRoute().id === "inner" && outlet.element.contains(active.element));
        check("Only the accepted route is notified", events.join() === "inner");
        check("Obsolete handlers are removed; current handlers remain", obsoletePresses === 0 && activePresses === 1);
        check("The newest document title is preserved", document.title === "Inner");
        check("Quiet navigation preserves keyboard focus", document.activeElement === run.element);
        const old = { element: document.createElement("p"), destroy() { router.navigate("final", quiet); } };
        routes[1]!.render = () => old; router.refresh();
        routes[1]!.render = () => P("Replacement");
        check("Content cleanup cannot restore the obsolete screen", !router.navigate("outer", quiet) && router.getCurrentRoute().id === "final" && outlet.element.textContent === "Final");
        let latePresses = 0; const late = Button({ text: "After stop", onPress() { latePresses += 1; } });
        routes[0]!.render = () => { router.stop(); return late; };
        check("Stop during render supersedes the operation", !router.navigate("outer", quiet)); late.element.click();
        check("A result returned after stop is released", latePresses === 0);
        check("Manual navigation remains available after stop", router.navigate("final", quiet) && outlet.element.textContent === "Final");
        let failed = true;
        routes[0]!.render = () => { if (failed) throw new Error("Expected fixture failure"); return H2("Recovered"); };
        try { router.navigate("outer", quiet); } catch { failed = false; }
        check("A failed renderer can be retried on the same route", router.navigate("outer", quiet) && outlet.element.textContent === "Recovered");
    } finally { router.stop(); outlet.destroy(); document.title = title; }
    check("Fixture cleanup restores the document title", document.title === title);
    check("No horizontal overflow", document.documentElement.scrollWidth <= innerWidth);
    report.replaceChildren(...results.map(result => { const item = document.createElement("li"); item.textContent = `${result.passed ? "PASS" : "FAIL"}: ${result.name}`; return item; }));
    status.textContent = `${results.filter(result => result.passed).length}/${results.length} router checks passed`;
} });

const historyStatus = document.createElement("p"); historyStatus.setAttribute("role", "status");
const historyOutlet = PageOutlet({ label: "History screen", scrollOnRender: false });
const historyRouter = createHashRouter({ outlet: historyOutlet, routes: [
    { id: "first", title: "First history route", render: () => H2("First history route") },
    { id: "second", title: "Second history route", render: () => H2("Second history route") }
], onRouteChange(route) { historyStatus.textContent = `Current route: ${route.id}`; } });
const first = Button({ text: "First route", onPress() { historyRouter.navigate("first", { updateHistory: true, announcement: false }); } });
const second = Button({ text: "Second route", onPress() { historyRouter.navigate("second", { updateHistory: true, announcement: false }); } });
const rtl = Button({ text: "Toggle direction", onPress() { document.documentElement.dir = document.documentElement.dir === "rtl" ? "ltr" : "rtl"; } });
const stack = Stack({ children: [H2("HashRouter audit"), ThemeToggle({ announcement: false }), rtl, run, status, report, surface, first, second, historyStatus, historyOutlet] });
document.querySelector("#app")!.append(stack.element); historyRouter.start(quiet);
addPageHideCleanup(window, () => { historyRouter.stop(); stack.destroy?.(); });
