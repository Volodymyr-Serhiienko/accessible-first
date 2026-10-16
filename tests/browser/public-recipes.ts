import "../../packages/components/src/styles/index.css";
import { Button, P, Screen, Stack, ThemeToggle, createAppIdentity, createPublicStaticAppTemplate, createPublicLinkAppTemplate, createPublicHashAppTemplate } from "../../packages/components/src";
import { addPageHideCleanup } from "../../packages/core/src/events";

const host = document.createElement("div");
const results = document.createElement("ol");
const status = document.createElement("p"); status.setAttribute("role", "status");
const originalTitle = document.title;
const originalLang = document.documentElement.lang;
const chrome = { header: false, navigation: false, breadcrumbs: false, search: false, commands: false } as const;
const run = Button({ text: "Run public recipe checks", onPress() {
    const checks: Array<{ name: string; passed: boolean }> = [];
    const check = (name: string, passed: boolean) => checks.push({ name, passed });
    let current = createAppIdentity({ name: "First identity", description: "First description", lang: "en", url: "https://example.test/first" });
    const app = createPublicStaticAppTemplate({ identity: () => current, mount: host, content: P("Stable content"), diagnostics: false });
    try {
        const content = app.shell.outlet.element.firstElementChild;
        current = createAppIdentity({ name: "Updated identity", description: "Updated description", lang: "uk", url: "https://example.test/updated" });
        app.refresh({ content: false });
        check("Static identity refresh updates title/language", document.title === current.name && document.documentElement.lang === "uk");
        check("Static identity refresh updates canonical/description", document.querySelector("link[rel='canonical']")?.getAttribute("href") === current.url && document.querySelector("meta[name='description']")?.getAttribute("content") === current.description);
        check("Shell-only refresh retains the existing content node", app.shell.outlet.element.firstElementChild === content);
    } finally { app.destroy(); }
    check("Static teardown restores the authored document", document.title === originalTitle && document.documentElement.lang === originalLang && host.children.length === 0);

    const route = { id: "chosen", title: "Route default", href: "/not-the-fixture-path", metadata: { title: "Chosen route", description: "Chosen description", canonical: "https://example.test/chosen" } };
    const identity = createAppIdentity({ name: "App", url: "https://example.test/" });
    const link = createPublicLinkAppTemplate({ routes: [route], current: "chosen", identity, mount: host, routeChrome: chrome, shell: { title: () => "Shell title" }, diagnostics: false });
    try {
        check("Native-link setup keeps an explicitly selected route", link.getCurrentRoute()?.id === "chosen" && document.title === "Chosen route");
        link.refreshChrome();
        const data = JSON.parse(document.querySelector("[data-af-document-structured-data]")?.textContent ?? "{}");
        check("Link chrome refresh retains the route title", document.title === "Chosen route");
        check("WebPage JSON-LD matches final route metadata", data.name === document.title && data.description === "Chosen description" && data.url === "https://example.test/chosen");
    } finally { link.destroy(); }

    const hash = createPublicHashAppTemplate({ routes: [{ ...route, render: () => P("Hash content") }], identity, mount: host, routeChrome: chrome, start: false, initialScrollReset: false, diagnostics: false });
    try {
        hash.router.navigate("chosen", { announcement: false, scroll: false, focusTarget: null, updateHistory: false }); hash.refreshChrome();
        check("Hash chrome refresh retains the route title", document.title === "Chosen route");
    } finally { hash.destroy(); }

    let released = 0;
    try {
        createPublicStaticAppTemplate({ mount: "#missing-fixture-target", content: { element: document.createElement("p"), destroy: () => { released++; } }, diagnostics: false });
    } catch { /* Expected failed mount. */ }
    check("Failed startup releases its content", released === 1);
    check("All template teardown restores the document and DOM", document.title === originalTitle && document.documentElement.lang === originalLang && host.children.length === 0);
    check("Native action keeps keyboard focus", document.activeElement === run.element);
    check("Fixture has no horizontal overflow", document.documentElement.scrollWidth <= innerWidth);
    results.replaceChildren(...checks.map(result => { const item = document.createElement("li"); item.textContent = `${result.passed ? "PASS" : "FAIL"}: ${result.name}`; return item; }));
    status.textContent = `${checks.filter(result => result.passed).length}/${checks.length} public recipe checks passed`;
} });
const root = Stack({ attributes: { lang: "en", style: "max-width:64rem;margin:auto;padding:1rem" } }, Screen({ title: "AF Public Recipes Audit", headingLevel: 1,
    children: [run, ThemeToggle({ announcement: false }), Button({ text: "Toggle direction", onPress() { document.documentElement.dir = document.documentElement.dir === "rtl" ? "ltr" : "rtl"; } }), status, results, host] }));
document.querySelector("#app")!.append(root.element);
addPageHideCleanup(window, () => root.destroy?.());
