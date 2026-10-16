import { describe, expect, it, vi } from "vitest";
import { Screen } from "../../../packages/components/src/screen";
import { InfoCard } from "../../../packages/components/src/info-card";
import { EmptyState } from "../../../packages/components/src/empty-state";
import { ActionsBar } from "../../../packages/components/src/actions-bar";
import { ResultSummary } from "../../../packages/components/src/result-summary";
import { createContentSlot } from "../../../packages/components/src/composition";

function child(text: string, destroy = vi.fn()) {
    const element = document.createElement("span");
    element.textContent = text;
    return { element, destroy };
}

const views = [
    { name: "Screen", create: Screen },
    { name: "InfoCard", create: InfoCard },
    { name: "EmptyState", create: EmptyState }
] as const;

for (const { name, create } of views) describe(`${name} content lifetime`, () => {
    it("ignores late updates and all shared setters after destroy", () => {
        const view = create({ title: "Title", description: "Description", actions: "Action" });
        view.destroy();
        const markup = view.element.outerHTML;
        view.setTitle("late");
        view.setDescription("late");
        view.setActions("late");
        view.update({ attributes: { "data-late": "true" } });
        view.actionsBar.setPrimary("late");
        expect(view.element.outerHTML).toBe(markup);
    });

    it("attempts every slot and action cleanup after a title cleanup fails", () => {
        const bad = child("title", vi.fn(() => { throw new Error("title cleanup"); }));
        const description = child("description");
        const action = child("action");
        const view = create({ title: bad, description, actions: action });
        expect(() => view.destroy()).toThrow("title cleanup");
        expect(description.destroy).toHaveBeenCalledOnce();
        expect(action.destroy).toHaveBeenCalledOnce();
        expect(() => view.destroy()).not.toThrow();
        expect(bad.destroy).toHaveBeenCalledOnce();
    });

    it("finishes requested slots and visibility after a replacement cleanup fails", () => {
        const old = child("old", vi.fn(() => { throw new Error("description cleanup"); }));
        const view = create({ title: "Title", description: old, actions: "Action" });
        expect(() => view.update({ description: null, actions: null })).toThrow("description cleanup");
        expect(view.description.hidden).toBe(true);
        expect(view.actions.hidden).toBe(true);
        view.destroy();
    });

    it("preserves a newer update started from removed title cleanup", () => {
        const old = child("old", vi.fn(() => view.setDescription("Newest")));
        const view = create({ title: old, description: "Initial" });
        view.update({ title: "New title", description: "Obsolete" });
        expect(view.description.textContent).toBe("Newest");
        view.destroy();
    });

    it("does not process later slots after a cleanup destroys the owner", () => {
        const old = child("old", vi.fn(() => view.destroy()));
        const action = child("action");
        const view = create({ title: old, actions: action });
        view.update({ title: "new", description: "late", actions: "late" });
        expect(view.description.textContent).not.toBe("late");
        expect(view.actions.textContent).not.toBe("late");
        expect(action.destroy).toHaveBeenCalledOnce();
    });

    it("keeps independently supplied secondary actions visible on parent synchronization", () => {
        const view = create({ title: "Title" });
        view.actionsBar.setSecondary("Secondary");
        view.update({ variant: "plain" });
        expect(view.actions.hidden).toBe(false);
        view.destroy();
    });
});

describe("Screen accessible context", () => {
    it("preserves external IDREFs when title/description ids and modes change", () => {
        const view = Screen({ title: "Title", description: "Help", descriptionMode: "aria",
            attributes: { "aria-labelledby": "external-title", "aria-describedby": "external-help" } });
        expect(view.element.getAttribute("aria-labelledby")).toBe(`external-title ${view.title.id}`);
        expect(view.element.getAttribute("aria-describedby")).toBe(`external-help ${view.description.id}`);
        view.update({ titleOptions: { id: "renamed-title" }, descriptionOptions: { id: "renamed-help" } });
        expect(view.element.getAttribute("aria-labelledby")).toBe("external-title renamed-title");
        view.update({ descriptionMode: "content" });
        expect(view.element.getAttribute("aria-describedby")).toBe("external-help");
        view.destroy();
        expect(view.element.getAttribute("aria-labelledby")).toBe("external-title");
    });

    it("does not focus after destruction", () => {
        const view = Screen({ title: "Title" });
        document.body.append(view.element);
        view.destroy();
        expect(view.focus()).toBe(false);
    });
});

describe("ActionsBar ownership", () => {
    it("finishes both groups on cleanup failure and ignores late calls", () => {
        const secondary = child("secondary", vi.fn(() => { throw new Error("secondary cleanup"); }));
        const primary = child("primary");
        const view = ActionsBar({ secondary, primary });
        expect(() => view.destroy()).toThrow("secondary cleanup");
        expect(primary.destroy).toHaveBeenCalledOnce();
        const markup = view.element.outerHTML;
        view.setLabel("late");
        view.setLabelledBy("late");
        view.setSecondary("late");
        view.setPrimary("late");
        view.update({ align: "stretch", attributes: { "data-late": "true" } });
        expect(view.element.outerHTML).toBe(markup);
        expect(() => view.destroy()).not.toThrow();
    });

    it("keeps newer primary content during a combined update", () => {
        const old = child("old", vi.fn(() => view.setSecondary("Newest")));
        const view = ActionsBar({ primary: old });
        view.update({ primary: "New primary", secondary: "Obsolete" });
        expect(view.secondarySlot.textContent).toBe("Newest");
        view.destroy();
    });
});

describe("Managed formatter preparation", () => {
    it("discards obsolete prepared content without overwriting a newer view", () => {
        const parent = document.createElement("div");
        const slot = createContentSlot(parent);
        const discarded = child("discarded");
        slot.setFrom(() => { slot.set(["Newest"]); return [discarded]; });
        expect(parent.textContent).toBe("Newest");
        expect(discarded.destroy).toHaveBeenCalledOnce();
        slot.dispose();
    });

    it("keeps a prepared instance already retained by the newer view", () => {
        const parent = document.createElement("div");
        const slot = createContentSlot(parent);
        const kept = child("kept");
        slot.setFrom(() => { slot.set([kept]); return [kept]; });
        expect(parent.textContent).toBe("kept");
        expect(kept.destroy).not.toHaveBeenCalled();
        slot.dispose();
        expect(kept.destroy).toHaveBeenCalledOnce();
    });

    it("leaves current content intact when preparation throws", () => {
        const parent = document.createElement("div");
        const kept = child("kept");
        const slot = createContentSlot(parent, [kept]);
        expect(() => slot.setFrom(() => { throw new Error("prepare"); })).toThrow("prepare");
        expect(parent.textContent).toBe("kept");
        expect(kept.destroy).not.toHaveBeenCalled();
        slot.dispose();
    });

    it("does not double-release a prepared instance consumed by newer replacements", () => {
        const parent = document.createElement("div");
        const candidate = child("candidate");
        const slot = createContentSlot(parent);
        slot.setFrom(() => { slot.set([candidate]); slot.set(["Newest"]); return [candidate]; });
        expect(parent.textContent).toBe("Newest");
        expect(candidate.destroy).toHaveBeenCalledOnce();
        slot.dispose();
    });
});

describe("ResultSummary lifetime", () => {
    it("ignores late mutations and locale notifications after destruction", () => {
        let notify = () => {};
        const view = ResultSummary({ total: 3, live: "polite", locale: {
            t: key => key, subscribe(callback) { notify = callback; return () => {}; }
        } });
        view.destroy();
        const markup = view.element.outerHTML;
        view.setTotal(4); view.setCount(1); view.setRange(1, 2);
        view.update({ attributes: { "data-late": "true" }, live: "assertive" });
        notify();
        expect(view.element.outerHTML).toBe(markup);
        expect(view.getState().total).toBe(3);
    });

    it("releases custom content despite a failing locale unsubscribe", () => {
        const content = child("summary");
        const view = ResultSummary({ format: () => content, locale: {
            t: key => key, subscribe: () => () => { throw new Error("unsubscribe"); }
        } });
        expect(() => view.destroy()).toThrow("unsubscribe");
        expect(content.destroy).toHaveBeenCalledOnce();
        expect(() => view.destroy()).not.toThrow();
    });

    it("keeps a newer formatter result and releases the superseded candidate", () => {
        const discarded = child("discarded");
        const view = ResultSummary({ total: 3 });
        view.update({ format() { view.update({ format: () => "Newest" }); return discarded; } });
        expect(view.content.textContent).toBe("Newest");
        expect(discarded.destroy).toHaveBeenCalledOnce();
        view.destroy();
    });

    it("does not destroy formatter content retained by the newer render", () => {
        const kept = child("kept");
        const view = ResultSummary({ total: 3 });
        view.update({ format() { view.update({ format: () => kept }); return kept; } });
        expect(view.content.textContent).toBe("kept");
        expect(kept.destroy).not.toHaveBeenCalled();
        view.destroy();
        expect(kept.destroy).toHaveBeenCalledOnce();
    });

    it("does not invoke the formatter again for styling/live-only updates", () => {
        const format = vi.fn(() => "Summary");
        const view = ResultSummary({ format });
        view.update({ variant: "strong", live: "polite", atomic: false });
        expect(format).toHaveBeenCalledOnce();
        expect(view.element.getAttribute("aria-atomic")).toBe("false");
        view.destroy();
    });

    it("rejects unsafe numeric input and never exposes overflowing derived indices", () => {
        const view = ResultSummary({ total: Number.MAX_VALUE, page: 1000000000, pageSize: 1000000000 });
        expect(view.getState().total).toBeNull();
        expect(view.getState().start).toBeNull();
        expect(view.getState().end).toBeNull();
        view.destroy();
    });

    it("does not hide the previous valid summary when a later formatter throws", () => {
        const view = ResultSummary({ total: 3 });
        const before = view.content.textContent;
        expect(() => view.update({ format() { throw new Error("format"); } })).toThrow("format");
        expect(view.content.textContent).toBe(before);
        expect(view.element.hidden).toBe(false);
        view.destroy();
    });

    it("releases formatter candidates returned after their owner is destroyed", () => {
        const candidate = child("candidate");
        const view = ResultSummary({ total: 3 });
        view.update({ format() { view.destroy(); return candidate; } });
        expect(view.content.textContent).not.toBe("candidate");
        expect(candidate.destroy).toHaveBeenCalledOnce();
    });

    it("unsubscribes when initial formatting fails", () => {
        const unsubscribe = vi.fn();
        expect(() => ResultSummary({ format() { throw new Error("format"); }, locale: {
            t: key => key, subscribe: () => unsubscribe
        } })).toThrow("format");
        expect(unsubscribe).toHaveBeenCalledOnce();
    });
});
