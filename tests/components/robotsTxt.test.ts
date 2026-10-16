import { describe, expect, it } from "vitest";
import { createRobotsTxt, inspectRobotsTxtOptions } from "../../packages/components/src/robots-txt";

describe("Robots text generation and inspection", () => {
    it("keeps an unrestricted crawler group separate from the following restricted group", () => {
        expect(createRobotsTxt({ groups: [{ userAgent: "TrustedBot" }, { userAgent: "*", disallow: ["/"] }] }))
            .toBe("User-agent: TrustedBot\nDisallow:\n\nUser-agent: *\nDisallow: /\n");
    });

    it("keeps multiple agents in one group and preserves path case/patterns", () => {
        const text = createRobotsTxt({ groups: [{ userAgent: ["FirstBot", "SecondBot"], allow: ["/Public/", "/file%23name"], disallow: ["/*.pdf$", ""] }] });
        expect(text).toBe("User-agent: FirstBot\nUser-agent: SecondBot\nAllow: /Public/\nAllow: /file%23name\nDisallow: /*.pdf$\nDisallow: \n");
        expect(inspectRobotsTxtOptions({ groups: [{ userAgent: "*", disallow: ["/*.pdf$", ""] }] }).status).toBe("healthy");
    });

    it("formats comments and sitemap records without line injection or caller mutation", () => {
        const options = Object.freeze({ comments: Object.freeze(["Generated\r\nSitemap: fake", "   "]),
            groups: Object.freeze([{ userAgent: "*", comments: ["Policy"], allow: [" / \nDisallow: / "] }]),
            sitemaps: Object.freeze([new URL("https://example.test/sitemap.xml")]), trailingNewline: false });
        const text = createRobotsTxt(options);
        expect(text).toContain("# Generated Sitemap: fake\n\n# Policy\nUser-agent: *\nAllow: /  Disallow: /");
        expect(text).toMatch(/Sitemap: https:\/\/example.test\/sitemap.xml$/);
        expect(text.split("\n").filter(line => line.startsWith("Disallow:"))).toEqual([]);
        expect(options.groups[0]?.allow[0]).toContain("\n");
    });

    it("supports empty files, comments-only files and optional final newlines", () => {
        expect(createRobotsTxt()).toBe("");
        expect(createRobotsTxt({ comments: ["Policy"] })).toBe("# Policy\n");
        expect(createRobotsTxt({ groups: [{ userAgent: "*" }], trailingNewline: false })).toBe("User-agent: *\nDisallow:");
    });

    it("reports missing requirements and absent/invalid crawler tokens", () => {
        expect(inspectRobotsTxtOptions({}, { requireGroup: true, requireSitemap: true }).warningCount).toBe(2);
        const report = inspectRobotsTxtOptions({ groups: [{ userAgent: [] }, { userAgent: " " }, { userAgent: "Bad/1" }] });
        expect(report.errorCount).toBe(3); expect(report.warningCount).toBe(0);
    });

    it("detects agent and rule line breaks even if generation keeps them on one line", () => {
        const report = inspectRobotsTxtOptions({ groups: [{ userAgent: "Bot\nDisallow: /", disallow: ["/private\r\nAllow: /"] }] });
        expect(report.issues.map(issue => issue.code)).toContain("robots.user-agent.multiline");
        expect(report.issues.map(issue => issue.code)).toContain("robots.rule.multiline");
        expect(report.status).toBe("blocked");
    });

    it("warns about literal comments in paths but permits encoded hashes", () => {
        const report = inspectRobotsTxtOptions({ groups: [{ userAgent: "*", disallow: ["/private#suffix", "/private%23suffix", "relative"] }] });
        expect(report.issues.map(issue => issue.code)).toEqual(["robots.rule.comment", "robots.rule.path"]);
    });

    it.each(["", "relative.xml", "ftp://example.test/map.xml"])("rejects unsuitable sitemap reference %s", sitemap => {
        expect(inspectRobotsTxtOptions({ sitemaps: [sitemap] }).status).toBe("blocked");
    });

    it("detects duplicate, multiline, credentialed and fragment sitemap URLs", () => {
        const report = inspectRobotsTxtOptions({ sitemaps: ["https://example.test/map.xml", "https://example.test/map.xml",
            "https://example.test/\nmap.xml", "https://user:password@example.test/map.xml", "https://example.test/map.xml#section"] });
        expect(report.issues.map(issue => issue.code)).toEqual(["robots.sitemap.duplicate", "robots.sitemap.multiline", "robots.sitemap.credentials", "robots.sitemap.hash"]);
        expect(report.errorCount).toBe(2);
    });
});
