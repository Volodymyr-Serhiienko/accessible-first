import { describe, expect, it, vi } from "vitest";
import { createAppDiagnosticsReport, createAppDiagnosticsRunner, createAppDiagnosticsSourceReport } from "../../packages/components/src/app-diagnostics";

describe("App diagnostics aggregation", () => {
    it.each(["blocked", "needs-attention"] as const)("preserves a status-only %s source without inventing findings", status => {
        const report = createAppDiagnosticsReport({ sources: [{ id: "remote", report: { status } }] });
        expect(report.status).toBe(status);
        expect(report.issueCount).toBe(0);
        expect(report.errorCount).toBe(0);
    });

    it("does not let a declared healthy status hide listed errors or warnings", () => {
        const error = createAppDiagnosticsSourceReport({ id: "error", report: { status: "healthy", errorCount: 0, issues: [{ level: "error" }] } })!;
        const warning = createAppDiagnosticsSourceReport({ id: "warning", report: { status: "healthy", warningCount: 1 } })!;
        expect(error.status).toBe("blocked"); expect(error.errorCount).toBe(1);
        expect(warning.status).toBe("needs-attention");
    });

    it.each([-1, NaN, Infinity, 1.5, Number.MAX_SAFE_INTEGER + 1])("ignores invalid count %s but keeps listed findings", value => {
        const source = createAppDiagnosticsSourceReport({ id: "custom", report: { errorCount: value, warningCount: value, infoCount: value,
            issues: [{ level: "error" }, { level: "warning" }, { level: "info" }] } })!;
        expect(source).toMatchObject({ errorCount: 1, warningCount: 1, infoCount: 1, issueCount: 3, status: "blocked" });
    });

    it("keeps larger summary counts and unknown issues without double counting details", () => {
        const source = createAppDiagnosticsSourceReport({ id: "custom", report: { errorCount: 3, warningCount: 1, infoCount: 2,
            issues: [{ level: "error" }, { level: "custom" }] } })!;
        expect(source.issueCount).toBe(6);
        const unknown = createAppDiagnosticsSourceReport({ id: "unknown", report: { issues: [{}, { level: "custom" }] } })!;
        expect(unknown.issueCount).toBe(2); expect(unknown.status).toBe("healthy");
    });

    it("keeps reports immutable, omits absent sources and aggregates in supplied order", () => {
        const original = Object.freeze({ status: "healthy", issues: Object.freeze([{ level: "info" }]) });
        const report = createAppDiagnosticsReport({ sources: [{ id: "absent", report: null }, { id: "first", label: "First", report: original },
            { id: "second", report: { warningCount: 2 } }] });
        expect(report.sources.map(source => source.id)).toEqual(["first", "second"]);
        expect(report.sources[0]?.report).toBe(original);
        expect(report).toMatchObject({ status: "needs-attention", infoCount: 1, warningCount: 2, issueCount: 3 });
        expect(createAppDiagnosticsReport().status).toBe("healthy");
    });

    it("resolves a fresh report once per inspection and logs only on request", () => {
        const sources = vi.fn().mockReturnValueOnce([{ id: "source", report: { status: "blocked" } }]).mockReturnValueOnce([]);
        const log = vi.fn(); const runner = createAppDiagnosticsRunner({ sources, log });
        expect(runner.inspect().status).toBe("blocked"); expect(log).not.toHaveBeenCalled();
        const report = runner.log(); expect(report.status).toBe("healthy"); expect(log).toHaveBeenCalledWith(report);
        expect(sources).toHaveBeenCalledTimes(2);
    });

    it("does not hide resolver failures as a healthy report", () => {
        const runner = createAppDiagnosticsRunner({ sources: () => { throw new Error("Check failed"); } });
        expect(() => runner.inspect()).toThrow("Check failed");
    });
});
