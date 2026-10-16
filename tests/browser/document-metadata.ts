import "../../packages/components/src/styles/index.css";
import { AppShell, Button, Screen, Stack, ThemeToggle, createDocumentMetadata, type DocumentMetadataController, type DocumentMetadataOptions, type DocumentMetadataStructuredData } from "../../packages/components/src";
import { inspectPage } from "../../packages/components/src/page/diagnostics";
import { addPageHideCleanup, runCleanups } from "../../packages/core/src/events";

const originalTitle = document.title;
const originalLang = document.documentElement.getAttribute("lang");
const originalDescription = document.head.querySelector<HTMLMetaElement>("meta[name='Description']")!;
const originalCanonical = document.head.querySelector<HTMLLinkElement>("link[rel='Canonical']")!;
const report = document.createElement("ol");
const status = document.createElement("p"); status.setAttribute("role", "status");
let metadata: DocumentMetadataController | null = null;
const values: DocumentMetadataOptions = {
    title: "Owned metadata title", lang: "uk", description: "Owned description",
    viewport: "width = device-width, initial-scale=1", canonical: "https://example.test/current/", robots: "noindex,nofollow",
    icons: [{ href: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Ctext y='14'%3EA%3C/text%3E%3C/svg%3E", type: "image/svg+xml" }],
    manifest: { href: "data:application/manifest+json,%7B%22name%22%3A%22Fixture%22%7D", crossOrigin: "anonymous" },
    openGraph: { title: "Fixture", image: { url: "https://example.test/image.png", width: 512, height: 512, alt: "Fixture preview" } },
    twitter: { card: "summary", title: "Fixture" },
    structuredData: { "@context": "https://schema.org", "@type": "WebSite", name: "Literal </script> text" }
};
const run = Button({ text: "Run metadata checks", onPress() {
    metadata?.destroy(); metadata = null;
    const checks: Array<{ name: string; passed: boolean }> = [];
    const check = (name: string, passed: boolean) => checks.push({ name, passed });
    metadata = createDocumentMetadata(values);
    check("Title updates in the live document", document.title === values.title);
    check("Document language updates explicitly", document.documentElement.lang === "uk");
    check("Authored named meta identity is retained", document.head.querySelector("meta[name='Description']") === originalDescription && originalDescription.content === values.description);
    check("Canonical relation is matched without changing its authored spelling", originalCanonical.rel === "Canonical" && originalCanonical.href === values.canonical);
    const icon = document.head.querySelector("[data-af-document-icon]"); const script = document.head.querySelector("[data-af-document-structured-data]");
    metadata.update(values);
    check("Unchanged icons retain identity", document.head.querySelector("[data-af-document-icon]") === icon);
    check("Unchanged JSON-LD retains identity", document.head.querySelector("[data-af-document-structured-data]") === script);
    check("JSON-LD preserves literal values without raw HTML delimiters", !script!.textContent!.includes("<") && JSON.parse(script!.textContent!).name === "Literal </script> text");
    check("Open Graph image details remain available", document.head.querySelector("meta[property='og:image:alt']")?.getAttribute("content") === "Fixture preview");
    const diagnostics = shell.inspect({ log: false, landmarks: { requireNavigation: false }, documentMetadata: {
        requireDescription: true, requireCanonical: true, requireRobots: true, requireManifest: true, requireOpenGraph: true, requireTwitter: true, requireStructuredData: true
    } });
    check("Actual fixture page passes scoped structural diagnostics", diagnostics.errorCount === 0 && diagnostics.warningCount === 0);
    const sample = document.implementation.createHTMLDocument("Sample"); sample.body.innerHTML = '<nav><a href="#next">Next</a></nav><button><img alt="Save" src="data:,"></button><input type="hidden">';
    const findings = inspectPage(sample.body, { log: false, categories: ["control", "landmark"], landmarks: { requireHeader: false, requireNavigation: false, requireFooter: false } });
    check("Link text does not falsely name a navigation landmark", findings.issues.some(issue => issue.code === "navigation.name.missing"));
    check("Native image-button name and hidden input cause no false control error", !findings.issues.some(issue => issue.category === "control"));
    const head = document.head.innerHTML; const circular: Record<string, unknown> = {}; circular.self = circular;
    try { metadata.update({ title: "Obsolete", structuredData: circular as DocumentMetadataStructuredData }); } catch { /* Expected serialization failure. */ }
    check("Preparation failure preserves the live head", document.head.innerHTML === head);
    metadata.update({ manifest: values.manifest && typeof values.manifest === "object" ? values.manifest.href : null });
    check("String manifest clears previous crossorigin", !document.head.querySelector("link[rel='manifest']")?.hasAttribute("crossorigin"));
    metadata.destroy();
    check("Destruction restores title and language", document.title === originalTitle && document.documentElement.getAttribute("lang") === originalLang);
    check("Destruction restores authored head tags and removes generated tags", originalDescription.content === "Authored description" && originalCanonical.href === "https://example.test/original/" && !document.head.querySelector("[data-af-document-icon], [data-af-document-structured-data], meta[property='og:title']"));
    const restored = document.head.innerHTML; metadata.update(values); metadata.destroy();
    check("Late update and repeated destruction leave the head unchanged", document.head.innerHTML === restored);
    check("Document has no horizontal overflow", document.documentElement.scrollWidth <= innerWidth);
    report.replaceChildren(...checks.map(result => { const item = document.createElement("li"); item.textContent = `${result.passed ? "PASS" : "FAIL"}: ${result.name}`; return item; }));
    status.textContent = `${checks.filter(result => result.passed).length}/${checks.length} metadata checks passed`;
} });
const theme = ThemeToggle({ announcement: false });
const direction = Button({ text: "Toggle direction", onPress() { document.documentElement.dir = document.documentElement.dir === "rtl" ? "ltr" : "rtl"; } });
const content = Stack({ children: [run, theme, direction, status, report] });
const shell = AppShell({ metadata: false, theme: "light", header: "AF metadata fixture", footer: "Local fixture. No external services.",
    content: Screen({ title: "AF Metadata Audit", headingLevel: 1, children: [content] }) });
shell.element.lang = "en";
document.querySelector("#app")!.append(shell.element);
addPageHideCleanup(window, () => runCleanups([() => metadata?.destroy(), shell.destroy]));
