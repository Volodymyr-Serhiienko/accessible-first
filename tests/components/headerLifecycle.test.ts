import { afterEach, describe, expect, it, vi } from "vitest";
import { AppHeader, Brand, Button, HeaderBar, HeaderTools, ThemeToggle, createLocaleController } from "../../packages/components/src";

afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); });
const child = (destroy = vi.fn()) => ({ element: document.createElement("span"), destroy });
const speech = () => [...document.querySelectorAll("[data-af-live-region]")].map(node => node.textContent).join("");
function mockBox(element: HTMLElement, width = 200): void {
    const rect = new DOMRect(0, 0, width, 44);
    vi.spyOn(element, "getBoundingClientRect").mockReturnValue(rect);
    vi.spyOn(element, "getClientRects").mockReturnValue([rect] as unknown as DOMRectList);
}
function mountMenu(tools: ReturnType<typeof HeaderTools>): ReturnType<typeof HeaderBar> {
    const header = HeaderBar({ actions: tools }); document.body.append(header.element);
    mockBox(header.element, 100); mockBox(tools.trigger.element, 44);
    for (const element of tools.controls.children) mockBox(element as HTMLElement);
    tools.checkPlacement();
    return header;
}

describe("Header slots", () => {
    it.each(["tools", "theme"] as const)("%s keeps its default tooltip closed on focus and available on hover", kind => {
        const control = kind === "tools" ? HeaderTools({ controls: [Button({ text: "Action" })] })
            : ThemeToggle({ hint: "Theme help", hintDisplay: "both" });
        const header = "trigger" in control ? mountMenu(control) : null;
        const target = "trigger" in control ? control.trigger.element : control.element;
        if (!header) document.body.append(target);
        try {
            target.focus();
            expect(document.querySelector("[data-af-tooltip-visible]")).toBeNull();
            const ids = target.getAttribute("aria-describedby")?.split(/\s+/) ?? [];
            expect(ids.some(id => document.getElementById(id)?.textContent)).toBe(true);
            target.dispatchEvent(new Event("pointerenter"));
            expect(document.querySelector("[data-af-tooltip-visible]")).not.toBeNull();
            target.dispatchEvent(new Event("pointerleave"));
            expect(document.querySelector("[data-af-tooltip-visible]")).toBeNull();
        } finally { if (header) header.destroy(); else control.destroy(); }
    });

    it.each(["bar", "brand"] as const)("finishes exceptional %s cleanup once and ignores late calls", kind => {
        const first = child(vi.fn(() => { throw new Error("child"); })); const second = child(); const third = child();
        const control = kind === "bar" ? HeaderBar({ brand: first, content: second, actions: third })
            : Brand({ href: "#test", name: second, logo: first, tagline: third });
        expect(() => control.destroy()).toThrow("child");
        expect(first.destroy).toHaveBeenCalledOnce(); expect(second.destroy).toHaveBeenCalledOnce(); expect(third.destroy).toHaveBeenCalledOnce();
        const before = control.element.outerHTML;
        if ("setBrand" in control) {
            control.setBrand("Late"); control.setContent("Late"); control.setActions("Late"); control.update({ layout: "stacked" });
        } else {
            control.setLogo("Late"); control.setName("Late"); control.setTagline("Late"); control.update({ label: "Late" });
        }
        control.destroy(); expect(control.element.outerHTML).toBe(before);
    });

    it.each(["bar", "brand"] as const)("updates all %s slots and visibility after a cleanup failure", kind => {
        const first = child(vi.fn(() => { throw new Error("old"); }));
        const control = kind === "bar" ? HeaderBar({ brand: first }) : Brand({ name: "Name", logo: first });
        expect(() => {
            if ("setBrand" in control) control.update({ brand: null, content: "New", actions: "Action" });
            else control.update({ logo: null, name: "New", tagline: "Tagline" });
        }).toThrow("old");
        if ("brandSlot" in control) { expect(control.brandSlot.hidden).toBe(true); expect(control.contentSlot.textContent).toBe("New"); expect(control.actionsSlot.hidden).toBe(false); }
        else { expect(control.logo.hidden).toBe(true); expect(control.name.textContent).toBe("New"); expect(control.tagline.hidden).toBe(false); }
        control.destroy();
    });

    it.each(["bar", "brand"] as const)("a newer %s update cancels older remaining slots", kind => {
        let replace = () => {};
        const previous = child(vi.fn(() => replace()));
        const control = kind === "bar" ? HeaderBar({ brand: previous }) : Brand({ name: "Name", logo: previous });
        replace = () => {
            if ("setBrand" in control) control.update({ brand: "New brand", content: "New content", actions: "New action" });
            else control.update({ logo: "New logo", name: "New name", tagline: "New tagline" });
        };
        if ("setBrand" in control) control.update({ brand: "Old brand", content: "Old content", actions: "Old action" });
        else control.update({ logo: "Old logo", name: "Old name", tagline: "Old tagline" });
        expect(control.element.textContent).not.toContain("Old");
        expect(control.element.textContent).toContain("New");
        control.destroy();
    });

    it("preserves an authored brand accessible label until explicitly cleared", () => {
        const brand = Brand({ name: "Name", attributes: { "aria-label": "Authored name" } });
        brand.update({ variant: "plain" }); expect(brand.element.getAttribute("aria-label")).toBe("Authored name");
        brand.update({ label: null }); expect(brand.element.hasAttribute("aria-label")).toBe(false);
        brand.destroy();
    });

    it("does not rebuild unchanged brand structure", () => {
        const brand = Brand({ name: "Name", tagline: "Tagline" });
        const replace = vi.spyOn(brand.content, "replaceChildren");
        brand.update({ logoPosition: "start", variant: "plain" });
        expect(replace).not.toHaveBeenCalled();
        brand.destroy();
    });

    it("AppHeader releases generated account/theme controls after a sibling throws", () => {
        const unsubscribe = vi.fn();
        const header = AppHeader({ language: false, tools: false, controls: [child(vi.fn(() => { throw new Error("custom"); }))],
            account: { source: { getState: () => ({ signedIn: false, pending: false }), subscribe: () => unsubscribe } } });
        expect(() => header.destroy()).toThrow("custom");
        expect(unsubscribe).toHaveBeenCalledOnce();
        const target = document.documentElement;
        const before = target.getAttribute("data-af-theme");
        header.themeControl!.setTheme("dark"); expect(target.getAttribute("data-af-theme")).toBe(before);
        expect(header.accountControl!.button.isDestroyed()).toBe(true);
        header.destroy();
    });

    it("AppHeader releases an already-created brand if a generated theme fails", () => {
        const dispose = vi.fn();
        const locale = createLocaleController({ supportedLocales: ["en"], fallbackLocale: "en", storage: null, navigatorSource: null });
        vi.spyOn(locale, "t").mockImplementation(() => { throw new Error("translation"); });
        expect(() => AppHeader({ locale, language: false, brand: { name: child(dispose) } })).toThrow("translation");
        expect(dispose).toHaveBeenCalledOnce(); locale.destroy();
    });
});

describe("HeaderTools ownership and behavior", () => {
    it("retains reused controls without destroying or replacing their focused node", () => {
        const control = Button({ text: "Control" }); const destroy = vi.spyOn(control, "destroy");
        const tools = HeaderTools({ controls: [control] }); document.body.append(tools.element); control.element.focus();
        tools.update({ controls: [control], title: "Updated" });
        expect(destroy).not.toHaveBeenCalled(); expect(document.activeElement).toBe(control.element);
        tools.destroy(); expect(destroy).toHaveBeenCalledOnce();
    });

    it("supports null close text/description and preserves internal close behavior after updates", () => {
        const tools = HeaderTools({ controls: [Button({ text: "Action" })], closeText: null, description: null }); const header = mountMenu(tools);
        expect(tools.closeButton.element.hidden).toBe(true);
        expect(tools.panel.hasAttribute("aria-describedby")).toBe(false);
        const onPress = vi.fn(); tools.update({ closeText: "Finish", closeButtonOptions: { onPress }, panelOptions: { id: "updated-panel" } });
        expect(tools.closeButton.element.hidden).toBe(false); expect(tools.trigger.element.getAttribute("aria-controls")).toBe("updated-panel");
        tools.trigger.element.click(); expect(tools.trigger.element.getAttribute("aria-expanded")).toBe("true");
        tools.closeButton.element.click();
        expect(onPress).toHaveBeenCalledOnce(); expect(tools.trigger.element.getAttribute("aria-expanded")).toBe("false");
        header.destroy();
    });

    it("uses the latest close callback and permits explicit cancellation", () => {
        const old = vi.fn(); const next = vi.fn((event: Event) => event.preventDefault());
        const tools = HeaderTools({ controls: [Button({ text: "Action" })], closeButtonOptions: { onPress: old } }); const header = mountMenu(tools);
        tools.update({ closeButtonOptions: { onPress: next } }); tools.trigger.element.click(); tools.closeButton.element.click();
        expect(old).not.toHaveBeenCalled(); expect(next).toHaveBeenCalledOnce();
        expect(tools.trigger.element.getAttribute("aria-expanded")).toBe("true"); header.destroy();
    });

    it("does not regenerate its trigger icon on unrelated text updates", () => {
        const icon = child(); const tools = HeaderTools({ controls: [], triggerIcon: icon });
        tools.update({ title: "Updated", closeText: "Finish" });
        expect(icon.destroy).not.toHaveBeenCalled(); expect(tools.trigger.element.contains(icon.element)).toBe(true);
        tools.destroy(); expect(icon.destroy).toHaveBeenCalledOnce();
    });

    it("finishes teardown after provider and control failures, canceling late updates/timers", () => {
        vi.useFakeTimers(); let notify = () => {};
        const dispose = vi.fn(() => { throw new Error("control"); });
        const tools = HeaderTools({ controls: [child(dispose)], locale: { t: () => "Tools", subscribe(fn) { notify = fn; return () => { throw new Error("locale"); }; } } });
        document.body.append(tools.element); tools.panel.dispatchEvent(new FocusEvent("focusout"));
        expect(() => tools.destroy()).toThrow("locale"); expect(dispose).toHaveBeenCalledOnce();
        expect(tools.trigger.isDestroyed()).toBe(true); expect(tools.closeButton.isDestroyed()).toBe(true);
        const before = tools.element.outerHTML; notify(); tools.checkPlacement(); tools.update({ title: "Late", controls: ["Late"] });
        vi.runOnlyPendingTimers(); tools.destroy(); expect(tools.element.outerHTML).toBe(before);
    });

    it("ignores callbacks from an old locale provider", () => {
        let notify = () => {}; const t = vi.fn(() => "Old");
        const tools = HeaderTools({ controls: [], locale: { t, subscribe(fn) { notify = fn; return () => {}; } } });
        tools.update({ locale: { t: () => "New" } }); t.mockClear(); notify(); expect(t).not.toHaveBeenCalled();
        expect(tools.trigger.element.getAttribute("aria-label")).toBe("New"); tools.destroy();
    });

    it("a reentrant control replacement keeps the newer set and text", () => {
        let replace = () => {};
        const old = child(vi.fn(() => replace())); const tools = HeaderTools({ controls: [old] });
        const next = Button({ text: "New control" });
        replace = () => tools.update({ controls: [next], title: "New title" });
        tools.update({ controls: ["Obsolete control"], title: "Obsolete title" });
        expect(tools.controls.textContent).toBe("New control"); expect(tools.panel.querySelector("h2")?.textContent).toBe("New title");
        tools.destroy();
    });

    it("commits replacement controls and text after retired control cleanup fails", () => {
        const tools = HeaderTools({ controls: [child(vi.fn(() => { throw new Error("retired"); }))] });
        expect(() => tools.update({ controls: ["New"], title: "New title" })).toThrow("retired");
        expect(tools.controls.textContent).toBe("New"); expect(tools.panel.querySelector("h2")?.textContent).toBe("New title");
        tools.destroy();
    });

    it("does not poll every frame while no header container exists", () => {
        const frame = vi.spyOn(window, "requestAnimationFrame");
        const tools = HeaderTools({ controls: [] }); const count = frame.mock.calls.length;
        tools.checkPlacement(); tools.checkPlacement(); expect(frame).toHaveBeenCalledTimes(count); tools.destroy();
    });

    it("preserves control identity and chooses a visible focus destination on resize", () => {
        const action = Button({ text: "Action" }); const tools = HeaderTools({ controls: [action] });
        const header = HeaderBar({ actions: tools }); document.body.append(header.element);
        let width = 500;
        vi.spyOn(header.element, "getBoundingClientRect").mockImplementation(() => new DOMRect(0, 0, width, 60));
        vi.spyOn(action.element, "getBoundingClientRect").mockImplementation(() => new DOMRect(0, 0, 200, 44));
        vi.spyOn(action.element, "getClientRects").mockReturnValue([new DOMRect(0, 0, 200, 44)] as unknown as DOMRectList);
        action.element.focus(); width = 100; tools.checkPlacement();
        expect(tools.getPlacement()).toBe("menu"); expect(document.activeElement).toBe(tools.trigger.element);
        expect(tools.controls.contains(action.element)).toBe(true);
        width = 500; tools.checkPlacement();
        expect(tools.getPlacement()).toBe("inline"); expect(document.activeElement).toBe(action.element);
        header.destroy();
    });

    it("keeps differently sized, vertically centered controls in one inline row", () => {
        const first = Button({ text: "Tall" }); const second = Button({ text: "Short" });
        const tools = HeaderTools({ controls: [first, second] }); const header = HeaderBar({ actions: tools }); document.body.append(header.element);
        vi.spyOn(header.element, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 0, 500, 100));
        vi.spyOn(first.element, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 0, 100, 80));
        vi.spyOn(second.element, "getBoundingClientRect").mockReturnValue(new DOMRect(110, 18, 100, 44));
        tools.checkPlacement(); expect(tools.getPlacement()).toBe("inline"); header.destroy();
    });

    it("disposes controls when initial locale subscription fails", () => {
        const dispose = vi.fn();
        expect(() => HeaderTools({ controls: [child(dispose)], locale: { t: () => "Tools", subscribe() { throw new Error("subscribe"); } } })).toThrow("subscribe");
        expect(dispose).toHaveBeenCalledOnce();
    });

    it("restores authored visibility and priority after a failed inline probe", () => {
        const action = Button({ text: "Action" }); const tools = HeaderTools({ controls: [action] }); const header = mountMenu(tools);
        tools.inline.style.setProperty("visibility", "visible", "important");
        vi.mocked(action.element.getBoundingClientRect).mockImplementation(() => { throw new Error("geometry"); });
        expect(() => tools.checkPlacement()).toThrow("geometry");
        expect(tools.inline.style.getPropertyValue("visibility")).toBe("visible");
        expect(tools.inline.style.getPropertyPriority("visibility")).toBe("important"); header.destroy();
    });
});

describe("ThemeToggle lifecycle", () => {
    it("permits explicitly opting out of automatic label reservation", () => {
        const toggle = ThemeToggle({ reserveText: null, announcement: false });
        expect(toggle.element.hasAttribute("data-af-button-reserved-text")).toBe(false);
        toggle.destroy();
    });
    it("forwards pending options without disabling or changing theme", () => {
        const target = document.createElement("div");
        const toggle = ThemeToggle({ target, pending: true, pendingMessage: false, hintShowOnFocus: false });
        toggle.element.click(); expect(toggle.getTheme()).toBe("light"); expect(toggle.element.disabled).toBe(false);
        expect(toggle.element.getAttribute("aria-busy")).toBe("true");
        toggle.update({ pending: false }); toggle.element.click(); expect(toggle.getTheme()).toBe("dark"); toggle.destroy();
    });

    it("clears switch-only hints and semantics when returning to button mode", () => {
        const toggle = ThemeToggle({ display: "switch", announcement: false }); document.body.append(toggle.element);
        expect(toggle.element.hasAttribute("data-af-tooltip")).toBe(true);
        toggle.update({ display: "button" });
        expect(toggle.element.hasAttribute("data-af-tooltip")).toBe(false);
        expect(toggle.element.hasAttribute("aria-checked")).toBe(false); expect(toggle.element.hasAttribute("role")).toBe(false);
        expect(toggle.element.getAttribute("data-af-button-reserved-text")).toBe("Light theme"); toggle.destroy();
    });

    it("late setters and external/locale callbacks cannot revive a destroyed toggle", async () => {
        let notify = () => {}; const target = document.createElement("div");
        const toggle = ThemeToggle({ target, locale: { t: () => "Theme", subscribe(fn) { notify = fn; return () => { throw new Error("unsubscribe"); }; } } });
        expect(() => toggle.destroy()).toThrow("unsubscribe"); expect(toggle.button.isDestroyed()).toBe(true);
        const before = toggle.element.outerHTML;
        toggle.update({ display: "switch" }); toggle.setTheme("dark"); toggle.toggleTheme(); notify();
        expect(target.hasAttribute("data-af-theme")).toBe(false);
        target.setAttribute("data-af-theme", "dark"); await Promise.resolve();
        expect(toggle.element.outerHTML).toBe(before); toggle.destroy();
    });

    it("ignores the previous locale provider after replacement", () => {
        let notify = () => {}; const t = vi.fn(() => "Old");
        const toggle = ThemeToggle({ locale: { t, subscribe(fn) { notify = fn; return () => {}; } } });
        toggle.update({ locale: { t: () => "New" } }); t.mockClear(); notify(); expect(t).not.toHaveBeenCalled();
        expect(toggle.element.textContent).toBe("New"); toggle.destroy();
    });

    it("suppresses outdated announcements after a reentrant theme callback", () => {
        vi.useFakeTimers(); const target = document.createElement("div");
        const toggle = ThemeToggle({ target, onThemeChange(detail) { if (detail.theme === "dark") toggle.setTheme("light"); },
            announcement: detail => detail.theme });
        toggle.setTheme("dark"); vi.advanceTimersByTime(50);
        expect(toggle.getTheme()).toBe("light"); expect(speech()).toBe("light"); toggle.destroy();
    });

    it("does not announce after the resolver destroys its owner", () => {
        vi.useFakeTimers(); const target = document.createElement("div");
        const toggle = ThemeToggle({ target, announcement() { toggle.destroy(); return "Obsolete"; } });
        toggle.setTheme("dark"); vi.advanceTimersByTime(50); expect(speech()).toBe("");
    });

    it("keeps a newer localized update from a reentrant resolver", () => {
        let resolve = () => "Initial";
        const toggle = ThemeToggle({ locale: { t: () => resolve() }, announcement: false });
        resolve = () => { toggle.update({ toDarkLabel: "New", toLightLabel: "New", switchLabel: "New", locale: null }); return "Old"; };
        toggle.update({ variant: "secondary" }); expect(toggle.element.textContent).toBe("New"); toggle.destroy();
    });
});
