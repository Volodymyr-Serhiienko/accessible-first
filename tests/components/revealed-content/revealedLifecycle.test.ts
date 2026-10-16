import { afterEach, describe, expect, it, vi } from "vitest";
import { Disclosure, createDisclosure } from "../../../packages/components/src/disclosure";
import { Accordion, createAccordion } from "../../../packages/components/src/accordion";
import { createDisclosure as createCoreDisclosure } from "../../../packages/core/src/disclosure";
import { FormSection } from "../../../packages/components/src/form-section";
import { SettingsGroup } from "../../../packages/components/src/settings-group";
import { FieldGroup } from "../../../packages/components/src/field-group";

function child(text: string, destroy = vi.fn()) {
    const element = document.createElement("span"); element.textContent = text; return { element, destroy };
}
afterEach(() => { vi.useRealTimers(); document.body.replaceChildren(); });

for (const { name, create } of [{ name: "FormSection", create: FormSection }, { name: "SettingsGroup", create: SettingsGroup }]) {
    describe(`${name} ownership`, () => {
        it("ignores late setters and update", () => {
            const view = create({ title: "Title", description: "Help", children: "Body", actions: "Save" });
            view.destroy(); const markup = view.element.outerHTML;
            view.setTitleContent("late"); view.setDescription("late"); view.setChildren("late"); view.setActions("late");
            view.update({ variant: "plain", attributes: { "data-late": "true" } });
            expect(view.element.outerHTML).toBe(markup);
        });
        it("cleans all slots after a heading cleanup failure, only once", () => {
            const title = child("Title", vi.fn(() => { throw Error("title cleanup"); }));
            const description = child("Help"); const body = child("Body"); const action = child("Save");
            const view = create({ title, description, children: body, actions: action });
            expect(() => view.destroy()).toThrow("title cleanup");
            for (const item of [description, body, action]) expect(item.destroy).toHaveBeenCalledOnce();
            expect(() => view.destroy()).not.toThrow();
        });
        it("continues requested updates after a removed heading cleanup fails", () => {
            const title = child("Title", vi.fn(() => { throw Error("title cleanup"); }));
            const view = create({ title, description: "Help", actions: "Save" });
            expect(() => view.update({ title: "New", description: null, actions: null })).toThrow("title cleanup");
            expect(view.description.hidden).toBe(true); expect(view.actions.hidden).toBe(true); view.destroy();
        });
        it("does not overwrite newer work from heading cleanup", () => {
            const title = child("Title", vi.fn(() => view.setDescription("newest")));
            const view = create({ title, description: "old" });
            view.update({ title: "New", description: "obsolete" });
            expect(view.description.textContent).toBe("newest"); view.destroy();
        });
        it("stops later slots after heading cleanup destroys the section", () => {
            const title = child("Title", vi.fn(() => view.destroy())); const body = child("Body");
            const view = create({ title, children: body }); view.update({ title: "New", children: "late" });
            expect(view.body.textContent).not.toBe("late"); expect(body.destroy).toHaveBeenCalledOnce();
        });
        it("releases only owned title and description references", () => {
            const view = create({ title: "Title", description: "Help", descriptionMode: "aria",
                attributes: { "aria-labelledby": "external-title", "aria-describedby": "external-help" } });
            expect(view.element.getAttribute("aria-labelledby")).toBe(`external-title ${view.heading.id}`);
            expect(view.element.getAttribute("aria-describedby")).toBe(`external-help ${view.description.id}`);
            view.update({ headingOptions: { id: "new-title" }, descriptionOptions: { id: "new-help" } });
            expect(view.element.getAttribute("aria-labelledby")).toBe("external-title new-title");
            view.destroy(); expect(view.element.getAttribute("aria-describedby")).toBe("external-help");
        });
    });
}

describe("FieldGroup ownership", () => {
    it("ignores late field state and content setters", () => {
        const view = FieldGroup({ label: "Label", children: "Body" }); view.destroy(); const markup = view.element.outerHTML;
        view.setLabelContent("late"); view.setDescription("late"); view.setErrorMessage("late"); view.setChildren("late");
        view.setDisabled(true); view.setRequired(true); view.setInvalid(true); view.setOrientation("horizontal");
        view.update({ variant: "plain" }); expect(view.element.outerHTML).toBe(markup); expect(view.isDisabled()).toBe(false);
    });
    it("cleans every slot and field semantics after a legend cleanup failure", () => {
        const label = child("Label", vi.fn(() => { throw Error("legend cleanup"); }));
        const description = child("Help"); const error = child("Error"); const body = child("Body");
        const view = FieldGroup({ label, description, errorMessage: error, children: body, invalid: true, required: true });
        expect(() => view.destroy()).toThrow("legend cleanup");
        for (const item of [description, error, body]) expect(item.destroy).toHaveBeenCalledOnce();
        expect(view.element.hasAttribute("aria-invalid")).toBe(false); expect(() => view.destroy()).not.toThrow();
    });
    it("finishes combined replacement and semantic synchronization after cleanup failure", () => {
        const label = child("Label", vi.fn(() => { throw Error("legend cleanup"); }));
        const view = FieldGroup({ label, description: "old" });
        expect(() => view.update({ label: "New", description: null, required: true })).toThrow("legend cleanup");
        expect(view.description.hidden).toBe(true); expect(view.legend.hasAttribute("data-af-required")).toBe(true); view.destroy();
    });
    it("keeps a newer error from removed label cleanup", () => {
        const label = child("Label", vi.fn(() => view.setErrorMessage("newest")));
        const view = FieldGroup({ label }); view.update({ label: "New", errorMessage: "obsolete" });
        expect(view.errorMessage.textContent).toBe("newest"); view.destroy();
    });
});

describe("Disclosure lifecycle and event ownership", () => {
    it("ignores all late composition/enhancement methods", () => {
        const view = Disclosure({ trigger: "Details", panel: "Body" }); view.destroy(); const markup = view.element.outerHTML;
        view.setDescription("late"); view.setTriggerContent("late"); view.setPanelContent("late");
        view.update({ open: true, variant: "plain" }); view.open(); view.toggle(); view.setDisabled(true);
        expect(view.element.outerHTML).toBe(markup);
    });
    it("cleans panel and behavior after a trigger cleanup failure", () => {
        const trigger = child("Details", vi.fn(() => { throw Error("trigger cleanup"); })); const panel = child("Body");
        const view = Disclosure({ trigger, panel }); expect(() => view.destroy()).toThrow("trigger cleanup");
        expect(panel.destroy).toHaveBeenCalledOnce(); expect(view.isDestroyed()).toBe(true);
        expect(() => view.destroy()).not.toThrow();
    });
    it("finishes panel replacement despite trigger cleanup failure", () => {
        const trigger = child("Details", vi.fn(() => { throw Error("trigger cleanup"); }));
        const view = Disclosure({ trigger, panel: "old" });
        expect(() => view.update({ trigger: "New", panel: "new" })).toThrow("trigger cleanup");
        expect(view.body.textContent).toBe("new"); view.destroy();
    });
    it("does not overwrite a newer panel update from trigger cleanup", () => {
        const trigger = child("Details", vi.fn(() => view.setPanelContent("newest")));
        const view = Disclosure({ trigger, panel: "old" }); view.update({ trigger: "New", panel: "obsolete" });
        expect(view.body.textContent).toBe("newest"); view.destroy();
    });
    it("uses the new panel and announcement when open is in the same update", () => {
        vi.useFakeTimers();
        const view = Disclosure({ trigger: "Details", panel: "old", announcement: "old message" });
        view.update({ open: true, panel: "new panel", announcement: true }); vi.advanceTimersByTime(60);
        expect([...document.querySelectorAll('[aria-live="polite"]')].map(e => e.textContent)).toContain("new panel"); view.destroy();
    });
    it("does not revive attributes or announce after the open callback destroys it", () => {
        vi.useFakeTimers(); const view = Disclosure({ trigger: "Details", panel: "Body", announcement: "obsolete",
            onOpenChange() { view.destroy(); } });
        view.open(); vi.advanceTimersByTime(60); expect(view.element.hasAttribute("data-af-open")).toBe(false);
        expect(document.querySelector("[data-af-live-region]")).toBeNull();
    });
    it("does not announce resolver output after the resolver closes it", () => {
        vi.useFakeTimers(); const view = Disclosure({ trigger: "Details", panel: "Body",
            announcement() { view.close(); return "obsolete"; } });
        view.open(); vi.advanceTimersByTime(60); expect(view.isOpen()).toBe(false);
        expect(document.querySelector("[data-af-live-region]")).toBeNull(); view.destroy();
    });
    it("refreshes default description speech for direct setDescription", () => {
        vi.useFakeTimers(); const view = Disclosure({ trigger: "Details", panel: "Body", description: "old" });
        view.setDescription("new description"); view.open(); vi.advanceTimersByTime(60);
        expect([...document.querySelectorAll('[aria-live="polite"]')].map(e => e.textContent)).toContain("new description"); view.destroy();
    });
    it("keeps external trigger descriptions through id/mode updates and destruction", () => {
        const view = Disclosure({ trigger: "Details", panel: "Body", description: "Help", descriptionMode: "aria" });
        view.trigger.setAttribute("aria-describedby", `external ${view.description.id}`);
        view.update({ descriptionId: "new-description" });
        expect(view.trigger.getAttribute("aria-describedby")).toBe("external new-description");
        view.update({ descriptionMode: "content" }); expect(view.trigger.getAttribute("aria-describedby")).toBe("external"); view.destroy();
    });
    it("enhancement update is terminal and applies callbacks before state", () => {
        const root = document.createElement("div"); const trigger = document.createElement("button"); const panel = document.createElement("div");
        const old = vi.fn(); const next = vi.fn(); const view = createDisclosure(root, { trigger, panel, open: false, onOpenChange: old });
        view.update({ open: true, onOpenChange: next }); expect(old).not.toHaveBeenCalled(); expect(next).toHaveBeenCalledWith(true);
        view.destroy(); const markup = root.outerHTML; view.update({ variant: "plain" }); expect(root.outerHTML).toBe(markup);
    });
    it("core preserves authored disabled state and exact panel hidden token", () => {
        const trigger = document.createElement("button"); trigger.disabled = true;
        const panel = document.createElement("div"); panel.setAttribute("hidden", "until-found");
        const view = createCoreDisclosure(trigger, panel); expect(view.isDisabled()).toBe(true); view.destroy();
        expect(panel.getAttribute("hidden")).toBe("until-found");
    });
    it("returns owned panel focus on collapse but preserves outside focus", () => {
        const view = Disclosure({ trigger: "Details", panel: "Body", open: true });
        const input = document.createElement("input"); view.body.append(input); const outside = document.createElement("button");
        document.body.append(view.element, outside); input.focus(); view.close(); expect(document.activeElement).toBe(view.trigger);
        view.open(); outside.focus(); view.close(); expect(document.activeElement).toBe(outside); view.destroy();
    });
    it("cancels queued owned opening speech when closed before delivery", () => {
        vi.useFakeTimers(); const view = Disclosure({ trigger: "Details", panel: "Body", announcement: "obsolete" });
        view.open(); view.close(); vi.advanceTimersByTime(60);
        expect([...document.querySelectorAll('[aria-live="polite"]')].map(e => e.textContent)).not.toContain("obsolete"); view.destroy();
    });
    it("fallback trigger does not consume nested, composing or already handled keys", () => {
        const trigger = document.createElement("div"); const input = document.createElement("input"); trigger.append(input);
        const view = createCoreDisclosure(trigger, document.createElement("div"), { defaultOpen: false });
        const nested = new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }); input.dispatchEvent(nested);
        expect(nested.defaultPrevented).toBe(false); expect(view.isOpen()).toBe(false);
        const composing = new KeyboardEvent("keydown", { key: "Enter", isComposing: true, cancelable: true }); trigger.dispatchEvent(composing);
        expect(composing.defaultPrevented).toBe(false); expect(view.isOpen()).toBe(false);
        const handled = new KeyboardEvent("keydown", { key: "Enter", cancelable: true }); handled.preventDefault(); trigger.dispatchEvent(handled);
        expect(view.isOpen()).toBe(false); view.destroy();
    });
});

describe("Accordion lifecycle and updates", () => {
    it("preserves an authored disabled trigger when enhancement has no item override", () => {
        const root = document.createElement("div"); const trigger = document.createElement("button");
        trigger.disabled = true; const panel = document.createElement("div"); root.append(trigger, panel);
        const view = createAccordion(root, { items: [{ element: root, trigger, panel }] });
        expect(view.items[0]!.isDisabled()).toBe(true); view.destroy(); expect(trigger.disabled).toBe(true);
    });
    it("chooses an enabled initial required-open item after authored disabled triggers", () => {
        const root = document.createElement("div");
        const items = [true, false].map(disabled => {
            const element = document.createElement("div"); const trigger = document.createElement("button");
            const panel = document.createElement("div"); trigger.disabled = disabled; element.append(trigger, panel); root.append(element);
            return { element, trigger, panel };
        });
        const view = createAccordion(root, { items, collapsible: false });
        expect(view.items[0]!.isOpen()).toBe(false); expect(view.items[1]!.isOpen()).toBe(true); view.destroy();
    });
    it("ignores late parent/item and exposed disclosure updates", () => {
        const view = Accordion({ items: [{ trigger: "Details", panel: "Body" }] }); const item = view.items[0]!;
        view.destroy(); const markup = view.element.outerHTML;
        item.setDescription("late"); item.setTriggerContent("late"); item.setPanelContent("late"); item.setDisabled(true);
        item.disclosure.update({ variant: "plain" }); view.update({ variant: "plain", items: [{ trigger: "late" }] });
        view.openItem(item.value); expect(view.element.outerHTML).toBe(markup);
    });
    it("cleans all item slots and behavior after child cleanup fails", () => {
        const trigger = child("Details", vi.fn(() => { throw Error("trigger cleanup"); })); const body = child("Body"); const other = child("Other");
        const view = Accordion({ items: [{ trigger, panel: body }, { trigger: "Other", panel: other }] });
        expect(() => view.destroy()).toThrow("trigger cleanup");
        expect(body.destroy).toHaveBeenCalledOnce(); expect(other.destroy).toHaveBeenCalledOnce();
        expect(view.isDestroyed()).toBe(true); expect(() => view.destroy()).not.toThrow();
    });
    it("cleans already prepared items when a later item fails to build", () => {
        const first = child("First"); const trigger = child("Second");
        expect(() => Accordion({ items: [{ trigger: "First", panel: first }, { trigger,
            get panel(): string { throw Error("prepare"); } }] })).toThrow("prepare");
        expect(first.destroy).toHaveBeenCalledOnce(); expect(trigger.destroy).toHaveBeenCalledOnce();
    });
    it("updates item text and announcement before opening in one update", () => {
        vi.useFakeTimers(); const view = Accordion({ items: [{ trigger: "Details", panel: "old", description: "old message" }] });
        view.update({ items: [{ open: true, panel: "new", announcement: "new message" }] }); vi.advanceTimersByTime(60);
        expect([...document.querySelectorAll('[aria-live="polite"]')].map(e => e.textContent)).toContain("new message"); view.destroy();
    });
    it("finishes remaining item slots after a cleanup failure", () => {
        const trigger = child("Details", vi.fn(() => { throw Error("trigger cleanup"); }));
        const view = Accordion({ items: [{ trigger, panel: "old" }, { trigger: "Other", panel: "old" }] });
        expect(() => view.update({ items: [{ trigger: "New", panel: "first" }, { panel: "second" }] })).toThrow("trigger cleanup");
        expect(view.items.map(item => item.body.textContent)).toEqual(["first", "second"]); view.destroy();
    });
    it("preserves a newer item content update from trigger cleanup", () => {
        const trigger = child("Details", vi.fn(() => view.items[0]!.setPanelContent("newest")));
        const view = Accordion({ items: [{ trigger, panel: "old" }] });
        view.update({ items: [{ trigger: "New", panel: "obsolete" }] }); expect(view.items[0]!.body.textContent).toBe("newest"); view.destroy();
    });
    it("preserves external panel and trigger IDREF contributions", () => {
        const view = Accordion({ descriptionMode: "aria", items: [{ trigger: "Details", panel: "Body", description: "Help" }] });
        const item = view.items[0]!; item.trigger.setAttribute("aria-describedby", `external ${item.description.id}`);
        item.panel.setAttribute("aria-labelledby", `external-title ${item.trigger.id}`);
        view.update({ items: [{ descriptionId: "new-help" }], panelRole: "none" });
        expect(item.trigger.getAttribute("aria-describedby")).toBe("external new-help");
        expect(item.panel.getAttribute("aria-labelledby")).toBe("external-title"); view.destroy();
        expect(item.trigger.getAttribute("aria-describedby")).toBe("external");
    });
    it("does not revive another item after a close callback destroys the accordion", () => {
        const view = Accordion({ items: [{ value: "a", trigger: "A", panel: "A", open: true }, { value: "b", trigger: "B", panel: "B" }],
            onOpenChange(detail) { if (!detail.open) view.destroy(); } });
        view.openItem("b"); expect(view.isDestroyed()).toBe(true); expect(view.element.hasAttribute("data-af-accordion-multiple")).toBe(false);
        expect(view.items.every(item => !item.element.hasAttribute("data-af-open"))).toBe(true);
    });
    it("skips hidden items and leaves composing/handled arrow keys alone", () => {
        const view = Accordion({ items: ["A", "B", "C"].map(trigger => ({ trigger, panel: "Body" })) });
        document.body.append(view.element);
        for (const element of [view.element, ...view.items.map(item => item.trigger)]) {
            Object.defineProperty(element, "getClientRects", { value: () => element.closest("[hidden]") ? [] : [{ width: 100, height: 44 }] });
        }
        view.items[1]!.element.hidden = true; const first = view.items[0]!.trigger; first.focus();
        const event = new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true }); first.dispatchEvent(event);
        expect(document.activeElement).toBe(view.items[2]!.trigger); expect(event.defaultPrevented).toBe(true);
        first.focus(); const composing = new KeyboardEvent("keydown", { key: "ArrowDown", isComposing: true, bubbles: true, cancelable: true }); first.dispatchEvent(composing);
        expect(composing.defaultPrevented).toBe(false); expect(document.activeElement).toBe(first);
        const handled = new KeyboardEvent("keydown", { key: "End", bubbles: true, cancelable: true }); handled.preventDefault(); first.dispatchEvent(handled);
        expect(document.activeElement).toBe(first); view.destroy();
    });
    it("does not emit an obsolete open event after another callback opens a third item", () => {
        const changes: string[] = [];
        const view = Accordion({ items: [
            { value: "a", trigger: "A", panel: "A", open: true }, { value: "b", trigger: "B", panel: "B" }, { value: "c", trigger: "C", panel: "C" }
        ], onOpenChange(detail) { changes.push(`${detail.value}:${detail.open}`); if (detail.value === "a" && !detail.open) view.openItem("c"); } });
        view.openItem("b"); expect(view.getOpenValues()).toEqual(["c"]); expect(changes).not.toContain("b:true"); view.destroy();
    });
    it("cannot collapse or announce a required last-open item through a click", () => {
        vi.useFakeTimers(); const change = vi.fn(); const view = Accordion({ collapsible: false, announcement: "obsolete",
            items: [{ trigger: "Details", panel: "Body" }], onOpenChange: change });
        const item = view.items[0]!; item.trigger.click(); vi.advanceTimersByTime(60);
        expect(item.isOpen()).toBe(true); expect(item.trigger.getAttribute("aria-disabled")).toBe("true");
        expect(change).not.toHaveBeenCalled(); expect(document.querySelector("[data-af-live-region]")).toBeNull(); view.destroy();
    });
    it("supports unbound parent open/close methods", () => {
        const view = Accordion({ items: [{ value: "a", trigger: "Details", panel: "Body" }] }); const open = view.openItem; const close = view.closeItem;
        expect(() => open("a")).not.toThrow(); expect(view.getOpenValues()).toEqual(["a"]); expect(() => close("a")).not.toThrow(); view.destroy();
    });
});
