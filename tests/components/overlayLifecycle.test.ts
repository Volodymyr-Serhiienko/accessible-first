import { describe, expect, it, vi } from "vitest";
import { createDialog, Dialog } from "../../packages/components/src/dialog";
import { createPopover, Popover } from "../../packages/components/src/popover";

function fixture() {
    const trigger = document.createElement("button");
    const content = document.createElement("div");
    content.hidden = true;
    content.setAttribute("aria-label", "Details");
    const inside = document.createElement("button");
    content.append(inside);
    document.body.append(trigger, content);
    return { trigger, content, inside };
}

describe("Overlay lifecycle boundaries", () => {
    it.each(["dialog", "popover"] as const)("keeps composed %s setters inert after destruction", (kind) => {
        const overlay = kind === "dialog"
            ? Dialog({ trigger: "Open", title: "Original" })
            : Popover({ trigger: "Open", description: "Original" });
        overlay.destroy();
        const html = overlay.element.outerHTML;
        overlay.setDescription("Late description");
        overlay.setContent(["Late content"]);
        overlay.update({ children: ["Late replacement"], description: "Late", className: "late" });
        if ("setTitle" in overlay) {
            overlay.setTitle("Late title");
            overlay.setActions("Late actions");
        } else overlay.setTriggerContent("Late trigger");
        expect(overlay.element.outerHTML).toBe(html);
    });

    it.each(["dialog", "popover"] as const)("finishes composed %s teardown if content cleanup fails", (kind) => {
        const failure = new Error("Body cleanup failed");
        const destroy = vi.fn(() => { throw failure; });
        const triggerCleanup = vi.fn();
        const trigger = { element: document.createElement("span"), destroy: triggerCleanup };
        const child = { element: document.createElement("div"), destroy };
        const overlay = kind === "dialog"
            ? Dialog({ trigger, title: "Original", children: [child] })
            : Popover({ trigger, children: [child] });
        expect(() => overlay.destroy()).toThrow(failure);
        expect(triggerCleanup).toHaveBeenCalledOnce();
        expect(overlay.isDestroyed()).toBe(true);
        expect(() => overlay.destroy()).not.toThrow();
        expect(destroy).toHaveBeenCalledOnce();
    });

    it("does not rewire a destroyed dialog through update", () => {
        const { trigger, content, inside } = fixture();
        const dialog = createDialog(content, { trigger, initialFocus: inside });
        dialog.destroy();
        const html = content.outerHTML;
        const triggerHtml = trigger.outerHTML;
        const subscribe = vi.fn(() => () => undefined);
        dialog.update({ trigger, variant: "plain", locale: { t: () => "Late", subscribe }, open: true });
        expect(content.outerHTML).toBe(html);
        expect(trigger.outerHTML).toBe(triggerHtml);
        expect(subscribe).not.toHaveBeenCalled();
    });

    it("does not resync a dialog destroyed by its state callback", () => {
        const { content, inside } = fixture();
        const dialog = createDialog(content, { initialFocus: inside, onOpenChange: () => dialog.destroy() });
        dialog.open();
        expect(content.hidden).toBe(true);
        expect(content.hasAttribute("data-af-open")).toBe(false);
        expect(content.hasAttribute("role")).toBe(false);
    });

    it("does not rewire or reposition a destroyed popover", () => {
        const { trigger, content } = fixture();
        const popover = createPopover(content, { trigger, closeOnAnchorHidden: false });
        popover.open();
        popover.destroy();
        const html = content.outerHTML;
        const triggerHtml = trigger.outerHTML;
        popover.update({ trigger, open: true, role: "dialog", contentId: "late-id", offset: 40 });
        expect(popover.updatePosition()).toBeNull();
        expect(content.outerHTML).toBe(html);
        expect(trigger.outerHTML).toBe(triggerHtml);
    });

    it.each(["destroy", "close"] as const)("does not announce or notify an opening canceled by its announcement factory: %s", (method) => {
        const { trigger, content } = fixture();
        const onOpenChange = vi.fn();
        const popover = createPopover(content, {
            trigger, closeOnAnchorHidden: false, onOpenChange,
            announcement: () => { popover[method](); return "Stale opening"; }
        });
        popover.open();
        expect(document.querySelectorAll("[data-af-live-region]")).toHaveLength(0);
        expect(onOpenChange.mock.calls).toHaveLength(method === "close" ? 1 : 0);
        popover.destroy();
    });

    it("does not notify a stale close if returning focus reopens the popover", () => {
        const { trigger, content, inside } = fixture();
        const onOpenChange = vi.fn();
        const popover = createPopover(content, { trigger, closeOnAnchorHidden: false, onOpenChange });
        popover.open();
        inside.focus();
        onOpenChange.mockClear();
        trigger.addEventListener("focus", () => popover.open(), { once: true });
        popover.close();
        expect(popover.isOpen()).toBe(true);
        expect(content.hidden).toBe(false);
        expect(onOpenChange.mock.calls).toHaveLength(1);
        popover.destroy();
    });
});
