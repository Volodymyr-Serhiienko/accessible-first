import { afterEach, describe, expect, it, vi } from "vitest";
import { AppShell, P, createPublicHashAppTemplate, createPublicLinkAppTemplate, createPublicStaticAppTemplate } from "../../packages/components/src";
import type { PublicStaticAppTemplateShellOptions } from "../../packages/components/src/public-app";

afterEach(() => vi.restoreAllMocks());
const slots = ["header", "navigation", "beforeOutlet", "afterOutlet", "footer"] as const;
type TemplateKind = "hash" | "link" | "static";
const route = { id: "home", title: "Home", href: "/", render: () => P("Home") };

function build(kind: TemplateKind, shell: PublicStaticAppTemplateShellOptions) {
    if (kind === "static") return createPublicStaticAppTemplate({ shell, content: null, diagnostics: false });
    if (kind === "hash") return createPublicHashAppTemplate({ routes: [route], shell, diagnostics: false, start: false });
    return createPublicLinkAppTemplate({ routes: [route], shell, diagnostics: false });
}

function child(destroy = vi.fn()) {
    return { element: document.createElement("p"), destroy };
}

describe("Initial template materialization", () => {
    for (const kind of ["hash", "link", "static"] as const) {
        it.each(slots)(`cleans returned ${kind} factory results when %s fails`, failed => {
            const failure = new Error("Resolver failed");
            const destroys = slots.map(() => vi.fn());
            const factories = slots.map((slot, index) => vi.fn(() => {
                if (slot === failed) throw failure;
                return child(destroys[index]);
            }));
            const shell: PublicStaticAppTemplateShellOptions = {};
            slots.forEach((slot, index) => { shell[slot] = factories[index]!; });
            expect(() => build(kind, shell)).toThrow(failure);
            slots.forEach((_, index) => {
                expect(destroys[index]).toHaveBeenCalledTimes(index < slots.indexOf(failed) ? 1 : 0);
                expect(factories[index]).toHaveBeenCalledTimes(index <= slots.indexOf(failed) ? 1 : 0);
            });
        });
    }

    it("cleans slot factories if the static content factory fails", () => {
        const order: string[] = [];
        const shell: PublicStaticAppTemplateShellOptions = {};
        for (const slot of slots) shell[slot] = () => child(vi.fn(() => { order.push(slot); }));
        const failure = new Error("Content failed");
        expect(() => createPublicStaticAppTemplate({ shell, diagnostics: false, content: () => { throw failure; } })).toThrow(failure);
        expect(order).toEqual([...slots].reverse());
    });

    it("cleans array children in reverse order, once per returned object", () => {
        const order: string[] = [];
        const first = child(vi.fn(() => { order.push("first"); }));
        const second = child(vi.fn(() => { order.push("second"); }));
        expect(() => build("static", { header: () => [first, second, first], footer: () => { throw new Error("Stop"); } })).toThrow("Stop");
        expect(order).toEqual(["second", "first"]);
    });

    it("preserves the original error and still releases all results when cleanup fails", () => {
        const first = child(); const second = child(vi.fn(() => { throw new Error("Cleanup failed"); }));
        const failure = new Error("Original failure");
        expect(() => build("static", { header: () => [first, second], footer: () => { throw failure; } })).toThrow(failure);
        expect(first.destroy).toHaveBeenCalledOnce(); expect(second.destroy).toHaveBeenCalledOnce();
    });

    it("leaves supplied static controllers with the caller until AppShell is called", () => {
        const retained = child(); const prepared = child();
        expect(() => build("static", { header: retained, navigation: () => prepared, footer: () => { throw new Error("Stop"); } })).toThrow("Stop");
        expect(retained.destroy).not.toHaveBeenCalled(); expect(prepared.destroy).toHaveBeenCalledOnce();
    });

    it("does not materialize a returned element merely to dispose it", () => {
        const destroy = vi.fn(); const element = vi.fn(() => { throw new Error("Element was read"); });
        expect(() => build("static", { header: () => ({ get element(): HTMLElement { return element(); }, destroy }),
            footer: () => { throw new Error("Resolver failure"); } })).toThrow("Resolver failure");
        expect(element).not.toHaveBeenCalled(); expect(destroy).toHaveBeenCalledOnce();
    });

    it.each([null, undefined, false, "text", 7] as const)("accepts a nonowned factory result %s during failure cleanup", value => {
        expect(() => build("static", { header: () => value, footer: () => { throw new Error("Stop"); } })).toThrow("Stop");
    });

    it("does not release successful factory results before the shell is destroyed", () => {
        const header = child(); const content = child();
        const app = createPublicStaticAppTemplate({ shell: { header: () => header }, content: () => content, diagnostics: false });
        expect(header.destroy).not.toHaveBeenCalled(); expect(content.destroy).not.toHaveBeenCalled();
        app.destroy(); app.destroy(); expect(header.destroy).toHaveBeenCalledOnce(); expect(content.destroy).toHaveBeenCalledOnce();
    });
});

describe("AppShell initial ownership transfer", () => {
    it("releases all supplied regions when initial metadata cannot be prepared", () => {
        const children = Array.from({ length: 6 }, () => child());
        const error = new Error("Metadata failed");
        expect(() => AppShell({ header: children[0]!, navigation: children[1]!, beforeOutlet: children[2]!, content: children[3]!,
            afterOutlet: children[4]!, footer: children[5]!, metadata: { structuredData: { get name(): string { throw error; } } } })).toThrow(error);
        for (const item of children) expect(item.destroy).toHaveBeenCalledOnce();
    });

    it.each(["content", "beforeOutlet", "afterOutlet", "header", "navigation", "footer"] as const)("releases accepted and pending regions once when %s cannot materialize", failed => {
        const error = new Error("Element failed");
        const values = { header: child(), navigation: child(), beforeOutlet: child(), content: child(), afterOutlet: child(), footer: child() };
        const failingDestroy = vi.fn();
        const failing = { get element(): HTMLElement { throw error; }, destroy: failingDestroy };
        expect(() => AppShell({ ...values, [failed]: failing, title: "Temporary title" })).toThrow(error);
        expect(failingDestroy).toHaveBeenCalledOnce();
        for (const [name, value] of Object.entries(values)) expect(value.destroy).toHaveBeenCalledTimes(name === failed ? 0 : 1);
        expect(document.title).not.toBe("Temporary title");
    });

    it("does not hide construction errors behind a pending child's failing cleanup", () => {
        const last = child(vi.fn(() => { throw new Error("Cleanup failed"); })); const first = child();
        const error = new Error("Metadata failed");
        expect(() => AppShell({ header: first, footer: last, metadata: { structuredData: { get name(): string { throw error; } } } })).toThrow(error);
        expect(first.destroy).toHaveBeenCalledOnce(); expect(last.destroy).toHaveBeenCalledOnce();
    });

    it("deduplicates pending array references before ownership transfer", () => {
        const value = child();
        expect(() => AppShell({ header: [value, value], metadata: { structuredData: { get name(): string { throw new Error("Stop"); } } } })).toThrow("Stop");
        expect(value.destroy).toHaveBeenCalledOnce();
    });
});
