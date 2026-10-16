import "../../packages/components/src/styles/index.css";
import { AppShell, Button, H2, P, Stack, ThemeToggle, createHashRoutedApp, createLinkRoutedApp, createPublicStaticAppTemplate } from "../../packages/components/src";
import { addPageHideCleanup } from "../../packages/core/src/events";

const status = document.createElement("p"); status.setAttribute("role", "status");
const report = document.createElement("ol"); const surface = document.createElement("div");
const routes = [{ id: "first", title: "First", href: "/first", render: () => P("First") }, { id: "second", title: "Second", href: "/second", render: () => P("Second") }];
const quiet = { scroll: false, focusTarget: null, announcement: false } as const;
const checks = Button({ text: "Run refresh checks", onPress() {
    const results: Array<{ name: string; passed: boolean }> = [];
    const check = (name: string, passed: boolean) => results.push({ name, passed });
    const title = document.title; const theme = document.documentElement.getAttribute("data-af-theme");

    let phase = "initial"; let latePresses = 0; let currentPresses = 0;
    const late = Button({ text: "Obsolete content action", onPress() { latePresses += 1; } });
    const current = Button({ text: "Newest content action", onPress() { currentPresses += 1; } });
    let app: ReturnType<typeof createPublicStaticAppTemplate>;
    app = createPublicStaticAppTemplate({ diagnostics: false, content: () => {
        if (phase === "outer") { phase = "inner"; app.refresh({ shell: false }); return late; }
        return phase === "initial" ? P("Initial") : current;
    } }); surface.append(app.shell.element);
    try {
        phase = "outer"; app.refresh({ shell: false }); late.element.click(); current.element.click();
        check("Nested static refresh preserves the latest screen", app.shell.outlet.element.contains(current.element));
        check("Abandoned content handlers are released", latePresses === 0);
        check("Accepted content handlers remain active", currentPresses === 1);
    } finally { app.destroy(); }

    let stop = false; const afterDestroy = Button({ text: "Late after destroy", onPress() { latePresses += 1; } });
    let terminal: ReturnType<typeof createPublicStaticAppTemplate>;
    terminal = createPublicStaticAppTemplate({ diagnostics: false, content: () => {
        if (stop) { terminal.destroy(); return afterDestroy; } return P("Initial");
    } });
    stop = true; terminal.refresh({ shell: false }); afterDestroy.element.click();
    check("A result returned after destroy cannot keep live handlers", terminal.isDestroyed() && latePresses === 0);

    for (const kind of ["hash", "link"] as const) {
        let state = "initial"; let obsoleteCalls = 0; let activeCalls = 0; let controlCalls = 0;
        const obsolete = Button({ text: "Obsolete chrome action", onPress() { obsoleteCalls += 1; } });
        const newest = Button({ text: "Newest chrome action", onPress() { activeCalls += 1; } });
        const renderChrome = (context: { refreshChrome(): void }) => {
            if (state === "outer") { state = "inner"; context.refreshChrome(); return { header: obsolete, currentRouteControls: [{ setCurrent() { controlCalls += 1; } }] }; }
            return { header: newest };
        };
        const routed = kind === "hash" ? createHashRoutedApp({ routes, start: false, renderChrome })
            : createLinkRoutedApp({ routes, current: "first", renderChrome });
        surface.append(routed.shell.element);
        try {
            state = "outer"; routed.refresh(); obsolete.element.click(); newest.element.click();
            check(`${kind} keeps the newest chrome and handlers`, routed.shell.element.querySelector("header")?.contains(newest.element) === true && activeCalls === 1);
            check(`${kind} releases abandoned chrome without binding it`, obsoleteCalls === 0 && controlCalls === 0);
        } finally { routed.destroy(); }
    }

    let replace = false; let cleanupApp: ReturnType<typeof createPublicStaticAppTemplate>;
    const old = { element: document.createElement("p"), destroy() { if (replace) { replace = false; cleanupApp.refresh(); } } };
    const abandonedFooter = Button({ text: "Abandoned footer", onPress() { latePresses += 1; } });
    let oldPhase = true; let footerPhase = true;
    cleanupApp = createPublicStaticAppTemplate({ diagnostics: false, content: P("Content"), shell: {
        header: () => { if (oldPhase) return old; return P("Newest header"); },
        footer: () => { if (footerPhase) return P("Initial footer"); footerPhase = true; return abandonedFooter; }
    } });
    try {
        oldPhase = false; footerPhase = false; replace = true; cleanupApp.refresh(); abandonedFooter.element.click();
        check("Cleanup reentry cannot apply old remaining slots", cleanupApp.shell.element.querySelector("footer")?.textContent === "Initial footer" && latePresses === 0);
    } finally { cleanupApp.destroy(); }

    const currentIds: string[] = [];
    const hash = createHashRoutedApp({ routes, start: false, shell: { title }, renderChrome: () => ({ currentRouteControls: [{ setCurrent(route) {
        if (route && typeof route === "object") currentIds.push(route.id);
    } }] }) });
    try {
        hash.refresh({ chrome: false, route: false }); currentIds.length = 0;
        hash.router.navigate("second", { ...quiet, updateHistory: false });
        check("Hash controls remain subscribed after route-only refresh", currentIds.includes("second"));
    } finally { hash.destroy(); }

    let nested = false; let link: ReturnType<typeof createLinkRoutedApp<typeof routes[number]>>;
    link = createLinkRoutedApp({ routes, current: "first", routeMetadata: { getTitle(route) {
        if (nested && route.id === "first") { nested = false; link.refresh({ current: "second", chrome: false }); }
        return route.title;
    } } });
    try {
        nested = true; link.refresh({ current: "first", chrome: false });
        check("Nested link metadata cannot restore an old title", document.title === "Second" && link.getCurrentRoute()?.id === "second");
    } finally { link.destroy(); }

    check("Completed checks restore the document title and theme", document.title === title && document.documentElement.getAttribute("data-af-theme") === theme);
    check("Checks preserve the existing keyboard focus", document.activeElement === checks.element);
    check("The fixture has no horizontal overflow", document.documentElement.scrollWidth <= innerWidth);
    surface.replaceChildren();
    report.replaceChildren(...results.map(result => {
        const item = document.createElement("li"); item.textContent = `${result.passed ? "PASS" : "FAIL"}: ${result.name}`; return item;
    }));
    status.textContent = `${results.filter(result => result.passed).length}/${results.length} refresh checks passed`;
} });
const direction = Button({ text: "Toggle direction", onPress() { document.documentElement.dir = document.documentElement.dir === "rtl" ? "ltr" : "rtl"; } });
const theme = ThemeToggle({ announcement: false });
const shell = AppShell({ title: "AF Template Refresh Audit", theme: "light", content: Stack({ children: [H2("Template refresh"), checks, direction, theme, status, report, surface] }) });
document.querySelector("#app")!.append(shell.element);
addPageHideCleanup(window, shell.destroy);
