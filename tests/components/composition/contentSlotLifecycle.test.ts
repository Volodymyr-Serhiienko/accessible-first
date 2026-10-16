import { describe, expect, it, vi } from "vitest";
import { createContentSlot } from "../../../packages/components/src/composition";
import { Checkbox } from "../../../packages/components/src/checkbox";

function child(text: string, destroy = vi.fn()) {
    const element = document.createElement("span");
    element.textContent = text;
    return { element, destroy };
}

describe("Managed content replacement", () => {
    it("retains reordered children and destroys duplicate removed references once", () => {
        const parent = document.createElement("div");
        const kept = child("kept");
        const removed = child("removed");
        const slot = createContentSlot(parent, [removed, kept, removed]);
        slot.set([kept, "new"]);
        expect(removed.destroy).toHaveBeenCalledOnce();
        expect(kept.destroy).not.toHaveBeenCalled();
        expect(parent.textContent).toBe("keptnew");
        slot.dispose();
        expect(kept.destroy).toHaveBeenCalledOnce();
    });

    it("does not overwrite replacement started by a removed child's cleanup", () => {
        const parent = document.createElement("div");
        const newer = child("newer");
        const abandoned = child("abandoned");
        const removed = child("removed", vi.fn(() => slot.set([newer])));
        const slot = createContentSlot(parent, [removed]);
        slot.set([abandoned]);
        expect(parent.textContent).toBe("newer");
        expect(abandoned.destroy).toHaveBeenCalledOnce();
        expect(newer.destroy).not.toHaveBeenCalled();
        slot.dispose();
        expect(newer.destroy).toHaveBeenCalledOnce();
    });

    it("cancels in-flight replacement when its owner is destroyed", () => {
        const parent = document.createElement("div");
        const abandoned = child("abandoned");
        const removed = child("removed", vi.fn(() => slot.dispose()));
        const slot = createContentSlot(parent, [removed]);
        slot.set([abandoned]);
        expect(parent.contains(abandoned.element)).toBe(false);
        expect(abandoned.destroy).toHaveBeenCalledOnce();
        slot.dispose();
        expect(abandoned.destroy).toHaveBeenCalledOnce();
    });

    it("leaves a new candidate alive when a reentrant replacement retains it", () => {
        const parent = document.createElement("div");
        const reused = child("reused");
        const removed = child("removed", vi.fn(() => slot.set([reused])));
        const slot = createContentSlot(parent, [removed]);
        slot.set([reused, "obsolete"]);
        expect(parent.textContent).toBe("reused");
        expect(reused.destroy).not.toHaveBeenCalled();
        slot.dispose();
        expect(reused.destroy).toHaveBeenCalledOnce();
    });

    it("does not double-dispose a candidate consumed by a nested replacement", () => {
        const parent = document.createElement("div");
        const reused = child("reused");
        const newer = child("newer");
        const removed = child("removed", vi.fn(() => { slot.set([reused]); slot.set([newer]); }));
        const slot = createContentSlot(parent, [removed]);
        slot.set([reused]);
        expect(parent.textContent).toBe("newer");
        expect(reused.destroy).toHaveBeenCalledOnce();
        slot.dispose();
    });

    it("commits replacement after all failing cleanup attempts, then rethrows the first error", () => {
        const parent = document.createElement("div");
        const first = child("first", vi.fn(() => { throw new Error("first failed"); }));
        const second = child("second", vi.fn(() => { throw new Error("second failed"); }));
        const next = child("next");
        const slot = createContentSlot(parent, [first, second]);
        expect(() => slot.set([next])).toThrow("second failed");
        expect(first.destroy).toHaveBeenCalledOnce();
        expect(second.destroy).toHaveBeenCalledOnce();
        expect(parent.textContent).toBe("next");
        slot.dispose();
        expect(next.destroy).toHaveBeenCalledOnce();
    });

    it("allows a disposed slot to be explicitly reused for another lazy-load attempt", () => {
        const parent = document.createElement("div");
        const first = child("first");
        const next = child("next");
        const slot = createContentSlot(parent, [first]);
        slot.dispose();
        slot.set([next]);
        expect(parent.textContent).toBe("next");
        slot.dispose();
        expect(first.destroy).toHaveBeenCalledOnce();
        expect(next.destroy).toHaveBeenCalledOnce();
    });

    it("does not append a late label or leak its controller after field destruction", () => {
        const late = child("late");
        const old = child("old", vi.fn(() => field.destroy()));
        const field = Checkbox({ label: old });
        field.setLabelContent(late);
        expect(field.isDestroyed()).toBe(true);
        expect(field.label.contains(late.element)).toBe(false);
        expect(late.destroy).toHaveBeenCalledOnce();
    });

    it("owns iframe-created composition children", () => {
        const frame = document.createElement("iframe");
        document.body.append(frame);
        const parent = frame.contentDocument!.createElement("div");
        const element = frame.contentDocument!.createElement("span");
        element.textContent = "foreign";
        const destroy = vi.fn();
        const slot = createContentSlot(parent, [{ element, destroy }]);
        expect(parent.textContent).toBe("foreign");
        slot.dispose();
        expect(destroy).toHaveBeenCalledOnce();
    });

    it("commits a reentrant request matching only the retained subset", () => {
        const parent = document.createElement("div");
        const kept = child("kept");
        const added = child("added");
        const removed = child("removed", vi.fn(() => slot.set([kept])));
        const slot = createContentSlot(parent, [removed, kept]);
        slot.set([kept, added]);
        expect(parent.textContent).toBe("kept");
        expect(kept.destroy).not.toHaveBeenCalled();
        expect(added.destroy).toHaveBeenCalledOnce();
        slot.dispose();
    });

    it("can clear markup explicitly after disposal without destroying children twice", () => {
        const parent = document.createElement("div");
        const first = child("first");
        const slot = createContentSlot(parent, [first]);
        slot.dispose();
        slot.set([]);
        expect(parent.textContent).toBe("");
        expect(first.destroy).toHaveBeenCalledOnce();
    });

    it("does not append old siblings after a native connected callback commits a new view", () => {
        const parent = document.createElement("div");
        document.body.append(parent);
        const next = child("next");
        const sibling = child("old sibling");
        const slot = createContentSlot(parent);
        customElements.define("af-slot-reentrant", class extends HTMLElement {
            connectedCallback() { slot.set([next]); }
        });
        slot.set([document.createElement("af-slot-reentrant"), sibling]);
        expect(parent.textContent).toBe("next");
        expect(sibling.destroy).toHaveBeenCalledOnce();
        slot.dispose();
    });

    it("keeps adopted iframe nodes renderable and their composed controller owned", () => {
        const frame = document.createElement("iframe");
        document.body.append(frame);
        const parent = document.createElement("div");
        const element = frame.contentDocument!.createElement("span");
        const text = frame.contentDocument!.createTextNode("text");
        element.textContent = "child";
        const destroy = vi.fn();
        const composed = { element, destroy };
        const slot = createContentSlot(parent, [composed, text]);
        slot.set([text, composed]);
        expect(parent.textContent).toBe("textchild");
        slot.dispose();
        expect(destroy).toHaveBeenCalledOnce();
    });
});
