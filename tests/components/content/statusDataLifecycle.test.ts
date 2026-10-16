import { afterEach, describe, expect, it, vi } from "vitest";
import { Badge } from "../../../packages/components/src/badge";
import { StatusMessage } from "../../../packages/components/src/status-message";
import { Progress } from "../../../packages/components/src/progress";
import { DescriptionList } from "../../../packages/components/src/description-list";

function child(text: string, destroy = vi.fn()) {
    const element = document.createElement("span");
    element.textContent = text;
    return { element, destroy };
}

afterEach(() => { document.body.replaceChildren(); });

for (const { name, create } of [{ name: "Badge", create: Badge }, { name: "StatusMessage", create: StatusMessage }]) {
    describe(`${name} lifetime`, () => {
        it("ignores late updates and slot setters", () => {
            const view = create({ text: "Ready", icon: "i" });
            view.destroy();
            const markup = view.element.outerHTML;
            view.setText("late"); view.setContent("late"); view.setIcon("late");
            view.update({ text: "late", attributes: { "data-late": "true" } });
            expect(view.element.outerHTML).toBe(markup);
        });
        it("cleans both slots after an icon cleanup fails, only once", () => {
            const icon = child("icon", vi.fn(() => { throw Error("icon cleanup"); }));
            const content = child("content");
            const view = create({ icon, children: [content] });
            expect(() => view.destroy()).toThrow("icon cleanup");
            expect(content.destroy).toHaveBeenCalledOnce();
            expect(() => view.destroy()).not.toThrow();
        });
        it("finishes a combined replacement after cleanup failure", () => {
            const icon = child("icon", vi.fn(() => { throw Error("icon cleanup"); }));
            const view = create({ icon, text: "old" });
            expect(() => view.update({ icon: null, text: "new" })).toThrow("icon cleanup");
            expect(view.icon.hidden).toBe(true);
            expect(view.getText()).toBe("new");
            view.destroy();
        });
        it("preserves a newer content update from removed icon cleanup", () => {
            const icon = child("icon", vi.fn(() => view.setText("newest")));
            const view = create({ icon, text: "old" });
            view.update({ icon: null, text: "obsolete" });
            expect(view.getText()).toBe("newest");
            view.destroy();
        });
        it("stops later slot work when removed icon cleanup destroys the owner", () => {
            const icon = child("icon", vi.fn(() => view.destroy())); const content = child("old");
            const view = create({ icon, children: [content] });
            view.update({ icon: null, text: "late" });
            expect(view.getText()).not.toBe("late"); expect(content.destroy).toHaveBeenCalledOnce();
        });
    });
}

describe("StatusMessage delivery", () => {
    function announcer() { return { announce: vi.fn(), clear: vi.fn(), destroy: vi.fn() }; }
    it("does not announce or change visibility after destruction", () => {
        const shared = announcer();
        const status = StatusMessage({ text: "Ready", announcer: shared });
        status.destroy(); const markup = status.element.outerHTML;
        status.hide(); status.show(); status.announce();
        status.setText("late", { announcement: true });
        expect(shared.announce).not.toHaveBeenCalled();
        expect(shared.destroy).not.toHaveBeenCalled();
        expect(status.element.outerHTML).toBe(markup);
    });
    it("discards resolver output after a newer announced update", () => {
        const shared = announcer();
        const status = StatusMessage({ text: "old", announcer: shared });
        status.update({ text: "obsolete", announcement() {
            status.setText("newest", { announcement: true }); return "obsolete";
        } });
        expect(shared.announce.mock.calls.map(call => call[0])).toEqual(["newest"]);
        status.destroy();
    });
    it("discards resolver output after destruction", () => {
        const shared = announcer();
        const status = StatusMessage({ text: "Ready", announcer: shared });
        status.update({ announcement() { status.destroy(); return "late"; } });
        expect(shared.announce).not.toHaveBeenCalled();
    });
    it("keeps a newer explicit announcement issued by the resolver", () => {
        const shared = announcer(); const status = StatusMessage({ text: "Ready", announcer: shared });
        status.update({ announcement() { status.announce("newest"); return "obsolete"; } });
        expect(shared.announce.mock.calls.map(call => call[0])).toEqual(["newest"]); status.destroy();
    });
    it("releases its owned channel even after a content cleanup error", () => {
        const old = child("old", vi.fn(() => { throw Error("content cleanup"); }));
        const status = StatusMessage({ children: [old] }); status.announce();
        expect(() => status.destroy()).toThrow("content cleanup");
        expect(document.querySelector("[data-af-live-region]")).toBeNull();
    });
    it("cleans initial content when an initial announcement resolver throws", () => {
        const old = child("old");
        expect(() => StatusMessage({ children: [old], announcement() { throw Error("resolver"); } })).toThrow("resolver");
        expect(old.destroy).toHaveBeenCalledOnce();
    });
    it("does not announce an obsolete update after content cleanup starts a new one", () => {
        const shared = announcer();
        const old = child("old", vi.fn(() => status.setText("newest", { announcement: true })));
        const status = StatusMessage({ children: [old], announcer: shared });
        status.setText("obsolete", { announcement: true });
        expect(shared.announce.mock.calls.map(call => call[0])).toEqual(["newest"]);
        status.destroy();
    });
    it("creates its owned announcement channel in the element's current document", () => {
        const frame = document.createElement("iframe"); document.body.append(frame);
        const owner = frame.contentDocument!;
        const status = StatusMessage({ text: "Ready" }); owner.body.append(status.element);
        status.announce();
        expect(owner.querySelectorAll("[data-af-live-region]").length).toBeGreaterThan(0);
        status.destroy(); frame.remove();
    });
});

describe("Progress lifetime and semantics", () => {
    it("ignores all late setters and update", () => {
        const progress = Progress({ label: "Progress", value: 5 }); progress.destroy();
        const markup = progress.element.outerHTML;
        progress.setLabel("late"); progress.setDescription("late"); progress.setValue(90);
        progress.setMax(200); progress.setValueText("late"); progress.update({ value: 42 });
        expect(progress.element.outerHTML).toBe(markup);
        expect(progress.getValue()).toBe(5); expect(progress.getMax()).toBe(100);
    });
    it("cleans descriptions after label cleanup fails and stays terminal", () => {
        const label = child("Label", vi.fn(() => { throw Error("label cleanup"); }));
        const description = child("Description");
        const progress = Progress({ label, description });
        expect(() => progress.destroy()).toThrow("label cleanup");
        expect(description.destroy).toHaveBeenCalledOnce();
        expect(() => progress.destroy()).not.toThrow();
    });
    it("finishes requested description replacement after label cleanup fails", () => {
        const label = child("Label", vi.fn(() => { throw Error("label cleanup"); }));
        const progress = Progress({ label, description: "old" });
        expect(() => progress.update({ label: "new", description: null, value: 50 })).toThrow("label cleanup");
        expect(progress.description.hidden).toBe(true); expect(progress.control.value).toBe(50);
        progress.destroy();
    });
    it("preserves newer description/value changes from label cleanup", () => {
        const label = child("Label", vi.fn(() => progress.update({ description: "newest", value: 80 })));
        const progress = Progress({ label, description: "old", value: 5 });
        progress.update({ label: "new", description: "obsolete", value: 40 });
        expect(progress.description.textContent).toBe("newest"); expect(progress.getValue()).toBe(80);
        progress.destroy();
    });
    it("stops later slot work after label cleanup destroys the progress", () => {
        const label = child("Label", vi.fn(() => progress.destroy())); const description = child("old");
        const progress = Progress({ label, description });
        progress.update({ label: "new", description: "late" });
        expect(progress.description.textContent).not.toBe("late"); expect(description.destroy).toHaveBeenCalledOnce();
    });
    it("preserves authored description references through update and teardown", () => {
        const progress = Progress({ label: "Label", description: "Help",
            controlOptions: { attributes: { "aria-describedby": "external" } } });
        expect(progress.control.getAttribute("aria-describedby")).toBe(`external ${progress.description.id}`);
        progress.update({ descriptionOptions: { id: "new-help" }, controlOptions: { id: "new-control" } });
        expect(progress.label.htmlFor).toBe("new-control");
        expect(progress.control.getAttribute("aria-describedby")).toBe("external new-help");
        progress.setDescription(null); expect(progress.control.getAttribute("aria-describedby")).toBe("external");
        progress.setDescription("Help"); progress.destroy();
        expect(progress.control.getAttribute("aria-describedby")).toBe("external");
    });
    it("normalizes non-finite inputs and switches native indeterminate state", () => {
        const progress = Progress({ label: "Label", value: Infinity, max: NaN });
        expect(progress.control.hasAttribute("value")).toBe(false); expect(progress.getMax()).toBe(100);
        progress.update({ max: 10, value: 30 }); expect(progress.control.value).toBe(10);
        progress.setValue(null); expect(progress.control.hasAttribute("value")).toBe(false);
        expect(progress.control.hasAttribute("aria-valuetext")).toBe(false);
        progress.destroy();
    });
});

describe("DescriptionList ownership", () => {
    it("ignores late parent and removed item setters", () => {
        const list = DescriptionList({ items: [{ term: "old", details: "old details" }] });
        const stale = list.items[0]!;
        list.setItems([{ term: "new", details: "new details" }]);
        const removed = stale.element.outerHTML; stale.setTermContent("late"); stale.setDetailsContent("late");
        expect(stale.element.outerHTML).toBe(removed);
        const active = list.items[0]!; list.destroy(); const markup = list.element.outerHTML;
        active.setTermContent("late"); list.setItems([{ term: "late", details: "late" }]);
        list.update({ layout: "inline" }); expect(list.element.outerHTML).toBe(markup);
    });
    it("attempts all item slots despite a cleanup failure and retires handles", () => {
        const bad = child("bad", vi.fn(() => { throw Error("term cleanup"); }));
        const detail = child("details"); const other = child("other");
        const list = DescriptionList({ items: [{ term: other, details: "ok" }, { term: bad, details: detail }] });
        expect(() => list.destroy()).toThrow("term cleanup");
        expect(detail.destroy).toHaveBeenCalledOnce(); expect(other.destroy).toHaveBeenCalledOnce();
        expect(list.items).toHaveLength(0); expect(list.element.childElementCount).toBe(0);
        expect(() => list.destroy()).not.toThrow();
    });
    it("retains the newer list started from removed item cleanup", () => {
        const old = child("old", vi.fn(() => list.setItems([{ term: "newest", details: "current" }])));
        const list = DescriptionList({ items: [{ term: old, details: "old details" }] });
        list.setItems([{ term: "obsolete", details: "obsolete" }]);
        expect(list.items[0]!.getTermText()).toBe("newest");
        expect(list.element.textContent).toBe("newestcurrent"); list.destroy();
    });
    it("does not append candidates after removed item cleanup destroys the list", () => {
        const old = child("old", vi.fn(() => list.destroy())); const candidate = child("candidate");
        const list = DescriptionList({ items: [{ term: old, details: "old" }] });
        list.setItems([{ term: candidate, details: "obsolete" }]);
        expect(list.element.childElementCount).toBe(0); expect(list.items).toHaveLength(0);
        expect(candidate.destroy).toHaveBeenCalledOnce();
    });
    it("discards partially prepared candidates after a getter starts a newer list", () => {
        const candidate = child("candidate");
        const list = DescriptionList({ items: [{ term: "old", details: "old" }] });
        list.setItems([{ term: candidate, get details() {
            list.setItems([{ term: "newest", details: "current" }]); return "obsolete";
        } }]);
        expect(list.items[0]!.getTermText()).toBe("newest"); expect(candidate.destroy).toHaveBeenCalledOnce();
        list.destroy();
    });
    it("releases partially created candidate slots when later preparation fails", () => {
        const term = child("prepared"); const first = child("first");
        const list = DescriptionList({ items: [{ term: "old", details: "current" }] });
        expect(() => list.setItems([{ term: first, details: "ok" }, { term,
            get details(): string { throw Error("prepare"); } }])).toThrow("prepare");
        expect(term.destroy).toHaveBeenCalledOnce(); expect(first.destroy).toHaveBeenCalledOnce();
        expect(list.items[0]!.getTermText()).toBe("old"); list.destroy();
    });
    it("keeps existing controls and focus for layout-only updates", () => {
        const button = document.createElement("button"); button.textContent = "Details";
        const list = DescriptionList({ items: [{ term: "Term", details: button }] });
        document.body.append(list.element); button.focus(); const item = list.items[0];
        list.update({ layout: "inline", variant: "plain" });
        expect(list.items[0]).toBe(item); expect(document.activeElement).toBe(button); list.destroy();
    });
});
