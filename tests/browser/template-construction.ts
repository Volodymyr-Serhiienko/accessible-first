import "../../packages/components/src/styles/index.css";
import { AppShell, Button, H2, P, Stack, ThemeToggle, createPublicHashAppTemplate, createPublicLinkAppTemplate, createPublicStaticAppTemplate } from "../../packages/components/src";
import { addPageHideCleanup } from "../../packages/core/src/events";

const status = document.createElement("p"); status.setAttribute("role", "status");
const report = document.createElement("ol");
const route = { id: "fixture", title: "Fixture", href: "/fixture", render: () => P("Fixture") };
const controls = Button({ text: "Run construction checks", onPress() {
    const results: Array<{ name: string; passed: boolean }> = [];
    const check = (name: string, passed: boolean) => results.push({ name, passed });
    const fail = new Error("Expected construction failure");
    const originalTitle = document.title;
    const originalTheme = document.documentElement.getAttribute("data-af-theme");
    let presses = 0;
    const failResolver = () => { throw fail; };

    for (const kind of ["hash", "link", "static"] as const) {
        const button = Button({ text: `${kind} abandoned action`, onPress() { presses += 1; } });
        let received: unknown;
        try {
            const shell = { header: () => button, footer: failResolver };
            if (kind === "hash") createPublicHashAppTemplate({ routes: [route], shell, diagnostics: false, start: false });
            else if (kind === "link") createPublicLinkAppTemplate({ routes: [route], shell, diagnostics: false });
            else createPublicStaticAppTemplate({ shell, diagnostics: false, content: null });
        } catch (error) { received = error; }
        button.element.click();
        check(`${kind} resolver failure releases its returned button`, received === fail && presses === 0);
    }

    const beforeContent = Button({ text: "Header before content failure", onPress() { presses += 1; } });
    try { createPublicStaticAppTemplate({ shell: { header: () => beforeContent }, content: failResolver, diagnostics: false }); } catch { /* Expected. */ }
    beforeContent.element.click();
    check("Static content failure also releases the prepared header", presses === 0);

    let retainedPresses = 0;
    const retained = Button({ text: "Caller-owned action", onPress() { retainedPresses += 1; } });
    try { createPublicStaticAppTemplate({ shell: { header: retained, footer: failResolver }, content: null, diagnostics: false }); } catch { /* Expected. */ }
    retained.element.click();
    check("Unaccepted supplied content remains usable by its caller", retainedPresses === 1);
    retained.destroy();

    const supplied = Array.from({ length: 6 }, () => Button({ text: "Pending shell action", onPress() { presses += 1; } }));
    let metadataError: unknown;
    try { AppShell({ header: supplied[0]!, navigation: supplied[1]!, beforeOutlet: supplied[2]!, content: supplied[3]!, afterOutlet: supplied[4]!, footer: supplied[5]!,
        metadata: { structuredData: { get name(): string { return failResolver(); } } } }); } catch (error) { metadataError = error; }
    supplied.forEach(button => button.element.click());
    check("AppShell owns all supplied slots from construction", metadataError === fail && presses === 0);

    const accepted = Button({ text: "Accepted outlet action", onPress() { presses += 1; } });
    const pending = Button({ text: "Pending footer action", onPress() { presses += 1; } });
    let materializationError: unknown;
    try { AppShell({ content: accepted, header: { get element(): HTMLElement { throw fail; } }, footer: pending,
        title: "Temporary title", theme: originalTheme === "dark" ? "light" : "dark" }); } catch (error) { materializationError = error; }
    accepted.element.click(); pending.element.click();
    check("Partial materialization cleans accepted and pending actions", materializationError === fail && presses === 0);
    check("Failed shell restores the document title and theme", document.title === originalTitle && document.documentElement.getAttribute("data-af-theme") === originalTheme);

    let cleanupCalls = 0; let cleanupError: unknown;
    const shared = { element: document.createElement("p"), destroy() { cleanupCalls += 1; throw new Error("Cleanup failure"); } };
    try { createPublicStaticAppTemplate({ shell: { header: () => [shared, shared], footer: failResolver }, content: null, diagnostics: false }); }
    catch (error) { cleanupError = error; }
    check("Cleanup is deduplicated and preserves the original exception", cleanupCalls === 1 && cleanupError === fail);

    let finished = 0;
    const app = createPublicStaticAppTemplate({ content: () => ({ element: document.createElement("p"), destroy() { finished += 1; } }), diagnostics: false });
    check("Successful construction keeps accepted content alive", finished === 0);
    app.destroy(); app.destroy();
    check("Successful content is destroyed once at the normal lifetime end", finished === 1);
    check("The existing action keeps keyboard focus", document.activeElement === controls.element);
    check("The fixture has no horizontal overflow", document.documentElement.scrollWidth <= innerWidth);
    report.replaceChildren(...results.map(result => {
        const item = document.createElement("li"); item.textContent = `${result.passed ? "PASS" : "FAIL"}: ${result.name}`; return item;
    }));
    status.textContent = `${results.filter(result => result.passed).length}/${results.length} construction checks passed`;
} });
const direction = Button({ text: "Toggle direction", onPress() {
    document.documentElement.dir = document.documentElement.dir === "rtl" ? "ltr" : "rtl";
} });
const theme = ThemeToggle({ announcement: false });
const shell = AppShell({ title: "AF Template Construction Audit", theme: "light", content: Stack({ children: [H2("Template construction"), controls, direction, theme, status, report] }) });
document.querySelector("#app")!.append(shell.element);
addPageHideCleanup(window, shell.destroy);
