import { afterEach, describe, expect, it, vi } from "vitest";
import { inspectPage } from "../../packages/components/src/page/diagnostics";
import type { PageDiagnosticsCategory, PageDiagnosticsOptions } from "../../packages/components/src/page";

afterEach(() => vi.restoreAllMocks());
function root(html: string, tag = "div") {
    const element = document.createElement(tag); element.innerHTML = html; document.body.append(element); return element;
}
function codes(element: HTMLElement, categories: PageDiagnosticsCategory[], options: PageDiagnosticsOptions = {}) {
    return inspectPage(element, { log: false, categories, ...options }).issues.map(issue => issue.code);
}
function documentRoot(head: string) {
    const owner = document.implementation.createHTMLDocument("Fixture"); owner.documentElement.lang = "en"; owner.head.insertAdjacentHTML("beforeend", head);
    return owner.body;
}

describe("Page diagnostics scope and semantic names", () => {
    it("includes a root main landmark and heading", () => {
        const element = root("<h1>Fixture</h1>", "main");
        expect(codes(element, ["landmark", "heading"], { landmarks: { requireHeader: false, requireNavigation: false, requireFooter: false } })).toEqual([]);
    });

    it("detects a root id duplicated by its descendant", () => {
        const element = root('<p id="same">Child</p>'); element.id = "same";
        expect(codes(element, ["aria"])).toEqual(["id.duplicate"]);
    });

    it("includes the root interactive control itself", () => {
        expect(codes(root("", "button"), ["control"])).toEqual(["control.name.missing"]);
    });

    it("does not treat navigation link text as the landmark name", () => {
        const element = root('<nav><a href="#next">Next page</a></nav>');
        expect(codes(element, ["landmark"], { landmarks: { requireHeader: false, requireFooter: false } })).toContain("navigation.name.missing");
    });

    it.each([
        '<button><img alt="Save" src="data:,"></button>',
        '<input type="button" value="Save">',
        '<input type="submit">',
        '<input type="reset">',
        '<input type="image" alt="Save" src="data:,">',
        '<a href="#next"><img alt="Next page" src="data:,"></a>'
    ])("accepts common native names: %s", html => {
        expect(codes(root(html), ["control"])).toEqual([]);
    });

    it("does not mistake field values or hidden icon text for a name", () => {
        const element = root('<input value="Not a label"><textarea>Not a label</textarea><select><option>Not a label</option></select><button><span aria-hidden="true">X</span></button>');
        expect(codes(element, ["control"])).toHaveLength(4);
    });

    it("ignores hidden, inert, CSS-hidden, hidden inputs and closed details controls", () => {
        const element = root('<input type="hidden"><div hidden><button></button></div><div inert><button></button></div><div style="display:none"><button></button></div><details><summary>Details</summary><button></button></details>');
        expect(codes(element, ["control"])).toEqual([]);
    });

    it("still inspects a child with an explicit visible override", () => {
        expect(codes(root('<div style="visibility:hidden"><button style="visibility:visible"></button></div>'), ["control"])).toEqual(["control.name.missing"]);
    });

    it("allows explicit labels that reference hidden local text", () => {
        const element = root('<button aria-labelledby="label"></button><span hidden id="label">Save</span>'); element.remove();
        expect(codes(element, ["aria", "control"])).toEqual([]);
    });

    it("resolves references elsewhere in the same detached fragment", () => {
        const fragment = document.createDocumentFragment(); const label = document.createElement("span"); label.id = "fragment-label"; label.textContent = "Save";
        const element = root("", "button"); element.setAttribute("aria-labelledby", label.id); fragment.append(element, label);
        expect(codes(element, ["aria", "control"])).toEqual([]);
    });

    it("validates active-descendant and error-message references on the root", () => {
        const element = root(""); element.setAttribute("aria-activedescendant", "missing-active"); element.setAttribute("aria-errormessage", "missing-error");
        expect(codes(element, ["aria"])).toEqual(["aria.reference.broken", "aria.reference.broken"]);
    });

    it("does not count hidden headings or a nested article header as a page banner", () => {
        const element = root('<main><h1>Visible</h1><section hidden><h1>Hidden</h1></section><article><header>Article title</header></article></main>');
        const findings = codes(element, ["heading", "landmark"], { landmarks: { requireNavigation: false, requireFooter: false } });
        expect(findings).toEqual(["page.header.missing"]);
    });

    it("recognizes explicit ARIA landmarks and their labels", () => {
        const element = root('<div role="banner">Header</div><div role="navigation" aria-label="Primary">Links</div><div role="main">Content</div><div role="contentinfo">Footer</div>');
        expect(codes(element, ["landmark"])).toEqual([]);
    });

    it("does not use a hidden heading to satisfy a visible section", () => {
        expect(codes(root('<section><h2 hidden>Not exposed</h2>Content</section>'), ["section"])).toEqual(["section.heading.missing"]);
    });

    it("does not scan page descendants when only document metadata was requested", () => {
        const element = root('<button></button>'); const query = vi.spyOn(element, "querySelectorAll");
        codes(element, ["document"]); expect(query).not.toHaveBeenCalled();
    });

    it("keeps inspection read-only", () => {
        const element = root('<main><h1>Fixture</h1><button>Save</button></main>'); const before = element.outerHTML;
        inspectPage(element, { log: false }); expect(element.outerHTML).toBe(before);
    });
});

describe("Document metadata diagnostics", () => {
    it("accepts formatted viewport values and case-insensitive native meta names", () => {
        const element = documentRoot('<meta name="Viewport" content="initial-scale = 1; width = device-width"><meta name="Description" content="Fixture">');
        expect(codes(element, ["document"], { documentMetadata: { requireDescription: true } })).toEqual([]);
    });

    it("does not require an Open Graph image alt when no image is present", () => {
        const element = documentRoot('<meta name="viewport" content="width=device-width"><meta property="og:title" content="Fixture">');
        expect(codes(element, ["document"])).not.toContain("document.opengraph.image-alt.missing");
    });

    it("does not count empty social tags as supplied metadata", () => {
        const element = documentRoot('<meta name="viewport" content="width=device-width"><meta property="og:title" content=" "><meta name="twitter:card" content="">');
        const findings = codes(element, ["document"], { documentMetadata: { requireOpenGraph: true, requireTwitter: true } });
        expect(findings).toContain("document.opengraph.missing"); expect(findings).toContain("document.twitter.missing");
    });

    it("recognizes types in JSON-LD graph nodes", () => {
        const element = documentRoot('<meta name="viewport" content="width=device-width"><script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"WebSite"}]}</script>');
        expect(codes(element, ["document"])).not.toContain("document.structured-data.type.missing");
    });

    it("reports invalid JSON and primitive arrays without throwing", () => {
        const element = documentRoot('<meta name="viewport" content="width=device-width"><script type="application/ld+json">{</script><script type="application/ld+json">[1,2]</script>');
        const report = inspectPage(element, { log: false, categories: ["document"] });
        expect(report.status).toBe("blocked"); expect(report.issues.map(issue => issue.code)).toContain("document.structured-data.shape");
        expect(report.issues.map(issue => issue.code)).toContain("document.structured-data.invalid-json");
    });
});
