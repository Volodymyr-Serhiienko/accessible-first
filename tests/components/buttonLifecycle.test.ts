import { afterEach, describe, expect, it, vi } from "vitest";
import { AccountControl, Button, IconButton, IconLabel, createButton, createIconButton } from "../../packages/components/src";

afterEach(() => { vi.useRealTimers(); document.body.replaceChildren(); });

describe("Action controls lifecycle", () => {
    it.each([createButton, createIconButton])("inherits and restores authored button state: %s", create => {
        const element = document.createElement("button");
        element.disabled = true;
        element.setAttribute("aria-pressed", "mixed");
        const control = create(element);
        expect(control.isDisabled()).toBe(true);
        expect(control.getPressed()).toBe("mixed");
        control.update({ disabled: false, pressed: false });
        control.destroy();
        expect(element.disabled).toBe(true);
        expect(element.getAttribute("aria-pressed")).toBe("mixed");
    });

    it.each([createButton, createIconButton])("inherits custom aria-disabled and ignores handled activation: %s", create => {
        const element = document.createElement("div");
        element.setAttribute("aria-disabled", "true");
        const onPress = vi.fn();
        const control = create(element, { onPress });
        expect(control.isDisabled()).toBe(true);
        control.setDisabled(false);
        const click = new MouseEvent("click", { cancelable: true }); click.preventDefault();
        element.dispatchEvent(click);
        expect(onPress).not.toHaveBeenCalled();
        control.destroy();
        expect(element.getAttribute("aria-disabled")).toBe("true");
    });

    it.each([createButton, createIconButton])("limits custom activation to its own unhandled keyboard events: %s", create => {
        const element = document.createElement("div");
        const nested = document.createElement("input"); element.append(nested);
        const onPress = vi.fn();
        const control = create(element, { onPress });
        for (const init of [{ isComposing: true }, { keyCode: 229 }, { ctrlKey: true }, { altKey: true }, { metaKey: true }]) {
            element.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true, ...init }));
        }
        const handled = new KeyboardEvent("keydown", { key: "Enter", cancelable: true }); handled.preventDefault();
        element.dispatchEvent(handled);
        nested.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
        element.dispatchEvent(new KeyboardEvent("keyup", { key: " ", cancelable: true }));
        expect(onPress).not.toHaveBeenCalled();
        element.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", cancelable: true }));
        element.dispatchEvent(new KeyboardEvent("keydown", { key: " ", cancelable: true }));
        element.dispatchEvent(new KeyboardEvent("keyup", { key: " ", cancelable: true }));
        expect(onPress).toHaveBeenCalledTimes(2);
        element.dispatchEvent(new KeyboardEvent("keydown", { key: " ", cancelable: true }));
        element.dispatchEvent(new Event("blur"));
        element.dispatchEvent(new KeyboardEvent("keyup", { key: " ", cancelable: true }));
        expect(onPress).toHaveBeenCalledTimes(2);
        control.destroy();
    });

    it("supports an unbound native button update", () => {
        const control = createButton(document.createElement("button"));
        const update = control.update;
        update({ disabled: true, pressed: true });
        expect(control.isDisabled()).toBe(true);
        expect(control.getPressed()).toBe(true);
        control.destroy();
    });

    it.each(["button", "icon"] as const)("finishes %s teardown after a child throws and rejects late updates", kind => {
        const onPress = vi.fn();
        const dispose = vi.fn(() => { throw new Error("child cleanup"); });
        const child = { element: document.createElement("span"), destroy: dispose };
        const control = kind === "button"
            ? Button({ children: [child], hint: "Help", onPress })
            : IconButton({ icon: child, label: "Action", hint: "Help", onPress });
        document.body.append(control.element);
        expect(() => control.destroy()).toThrow("child cleanup");
        expect(control.isDestroyed()).toBe(true);
        const before = control.element.outerHTML;
        control.update({ children: ["Late"], selected: true, hint: "Late", attributes: { "data-late": "yes" } });
        control.setHint("Late"); control.setDisabled(true); control.setSelected(true);
        if ("setText" in control) control.setText("Late");
        else { control.setTitle("Late"); control.setLabel("Late"); }
        control.element.click(); control.destroy();
        expect(onPress).not.toHaveBeenCalled();
        expect(dispose).toHaveBeenCalledOnce();
        expect(control.element.outerHTML).toBe(before);
        expect(document.querySelector("[data-af-control-hint]")).toBeNull();
    });

    it.each(["button", "icon"] as const)("a reentrant %s update keeps the newer hint and content", kind => {
        let replace = () => {};
        const child = { element: document.createElement("span"), destroy: () => replace() };
        const control = kind === "button" ? Button({ children: [child] }) : IconButton({ children: [child], label: "Action" });
        replace = () => control.update({ children: ["New"], hint: "New hint", hintDisplay: "description" });
        control.update({ children: ["Obsolete"], hint: "Old hint" });
        expect(control.element.textContent).toBe("New");
        expect(document.getElementById(control.element.getAttribute("aria-describedby")!)?.textContent).toBe("New hint");
        control.destroy();
    });

    it.each(["button", "icon"] as const)("refreshes %s hints even if replaced child cleanup throws", kind => {
        const child = { element: document.createElement("span"), destroy() { throw new Error("retired"); } };
        const control = kind === "button" ? Button({ children: [child] }) : IconButton({ children: [child], label: "Action" });
        expect(() => control.update({ children: ["New"], hint: "New hint", hintDisplay: "description" })).toThrow("retired");
        expect(control.element.textContent).toBe("New");
        expect(document.getElementById(control.element.getAttribute("aria-describedby")!)?.textContent).toBe("New hint");
        control.destroy();
    });

    it.each(["button", "icon"] as const)("a direct %s hint setter supersedes an older update", kind => {
        let replace = () => {};
        const child = { element: document.createElement("span"), destroy: () => replace() };
        const control = kind === "button" ? Button({ children: [child] }) : IconButton({ children: [child], label: "Action", hintDisplay: "description" });
        replace = () => control.setHint("New hint");
        control.update({ children: ["New"], hint: "Obsolete hint" });
        expect(document.getElementById(control.element.getAttribute("aria-describedby")!)?.textContent).toBe("New hint");
        control.destroy();
    });

    it("IconLabel disposes every owned child once after a cleanup failure", () => {
        const iconDispose = vi.fn();
        const labelDispose = vi.fn(() => { throw new Error("label cleanup"); });
        const label = IconLabel({ icon: { element: document.createElement("span"), destroy: iconDispose },
            label: { element: document.createElement("span"), destroy: labelDispose } });
        expect(() => label.destroy?.()).toThrow("label cleanup");
        label.destroy?.();
        expect(iconDispose).toHaveBeenCalledOnce();
        expect(labelDispose).toHaveBeenCalledOnce();
    });

    it("does not announce a wait after its resolver completes or destroys the action", () => {
        vi.useFakeTimers();
        const button = Button({ pendingMessage: () => { button.setPending(false); return "Obsolete wait"; } });
        const icon = Button({ pendingMessage: () => { icon.destroy(); return "Destroyed wait"; } });
        document.body.append(button.element, icon.element);
        button.setPending(true); icon.setPending(true);
        vi.advanceTimersByTime(1000);
        expect([...document.querySelectorAll("[data-af-live-region]")].map(node => node.textContent).join("")).toBe("");
        button.destroy();
    });
});

describe("Icon accessible names and subscriptions", () => {
    it("refreshes the fallback name after changing title or text", () => {
        const control = IconButton();
        expect(control.element.getAttribute("data-af-warning")).toBe("missing-accessible-name");
        control.setTitle("Named action");
        expect(control.element.hasAttribute("aria-label")).toBe(false);
        expect(control.element.hasAttribute("data-af-warning")).toBe(false);
        control.setTitle(null);
        expect(control.element.getAttribute("aria-label")).toBe("Icon button");
        control.update({ children: ["Visible name"] });
        expect(control.element.hasAttribute("aria-label")).toBe(false);
        control.update({ children: [] });
        expect(control.element.getAttribute("aria-label")).toBe("Icon button");
        control.destroy();
    });

    it("keeps a new explicit name through subsequent refreshes", () => {
        const control = IconButton();
        control.setLabel("Action");
        control.update({ variant: "primary" });
        expect(control.element.getAttribute("aria-label")).toBe("Action");
        expect(control.element.hasAttribute("data-af-warning")).toBe(false);
        control.destroy();
    });

    it("defaults to hover-only visual hints while keeping the focus description", () => {
        const control = IconButton({ label: "Action", hint: "Help", hintDisplay: "both" });
        document.body.append(control.element); control.element.focus();
        const tooltip = document.querySelector("[data-af-tooltip-visual]");
        expect(tooltip?.hasAttribute("data-af-tooltip-visible")).toBe(false);
        expect(document.getElementById(control.element.getAttribute("aria-describedby")!)?.textContent).toBe("Help");
        control.element.dispatchEvent(new Event("pointerenter"));
        expect(tooltip?.hasAttribute("data-af-tooltip-visible")).toBe(true);
        control.destroy();
    });

    it("ignores obsolete locale callbacks and restores semantics after unsubscribe failure", () => {
        let oldNotify = () => {};
        let newNotify = () => {};
        const t = vi.fn(() => "Old");
        const element = document.createElement("button"); element.title = "";
        const control = createIconButton(element, { locale: { t, subscribe(fn) { oldNotify = fn; return () => { throw new Error("unsubscribe"); }; } } });
        expect(() => control.update({ locale: { t: () => "New", subscribe(fn) { newNotify = fn; return () => {}; } } })).toThrow("unsubscribe");
        t.mockClear(); oldNotify(); expect(t).not.toHaveBeenCalled();
        newNotify(); expect(element.getAttribute("aria-label")).toBe("New");
        control.destroy(); const before = element.outerHTML;
        control.update({ locale: { t }, variant: "primary", label: "Late" });
        newNotify(); expect(element.outerHTML).toBe(before);
    });

    it("restores authored attributes even when locale teardown throws", () => {
        const element = document.createElement("button"); element.setAttribute("data-af-warning", "authored");
        const control = createIconButton(element, { locale: { t: () => "Fallback", subscribe: () => () => { throw new Error("locale"); } } });
        expect(() => control.destroy()).toThrow("locale");
        expect(element.getAttribute("data-af-warning")).toBe("authored");
        expect(element.hasAttribute("aria-label")).toBe(false);
        expect(element.hasAttribute("data-af-component")).toBe(false);
    });

    it.each(["destroy", "rename"] as const)("a fallback resolver cannot overwrite a newer %s", operation => {
        let resolve = () => "Fallback";
        const control = createIconButton(document.createElement("button"), { locale: { t: () => resolve() } });
        resolve = () => {
            if (operation === "destroy") control.destroy();
            else control.setLabel("New action");
            return "Obsolete fallback";
        };
        control.update({ label: null });
        expect(control.element.getAttribute("aria-label")).toBe(operation === "destroy" ? null : "New action");
        control.destroy();
    });

    it("does not revive composed content when fallback localization destroys the button", () => {
        const control = IconButton();
        control.update({ locale: { t() { control.destroy(); return "Late"; } }, children: ["Late"], title: "Late" });
        expect(control.isDestroyed()).toBe(true);
        expect(control.element.textContent).toBe("");
        expect(control.element.hasAttribute("title")).toBe(false);
    });
});

describe("Account action cleanup", () => {
    it("does not resubscribe locale when replacing only the state source", () => {
        const subscribe = vi.fn(() => () => {});
        const control = AccountControl({ locale: { t: () => "Action", subscribe } });
        control.update({ source: { getState: () => ({ signedIn: true, pending: false }), subscribe: () => () => {} } });
        expect(subscribe).toHaveBeenCalledOnce();
        control.destroy();
    });

    it("ignores a retired source callback and releases all resources after a throwing unsubscribe", () => {
        let oldNotify = () => {};
        const oldGetState = vi.fn(() => ({ signedIn: false, pending: false }));
        const sourceDispose = vi.fn(); const localeDispose = vi.fn(); const onSignIn = vi.fn();
        const control = AccountControl({ onSignIn,
            source: { getState: oldGetState, subscribe(fn) { oldNotify = fn; return () => { throw new Error("old source"); }; } },
            locale: { t: () => "Action", subscribe: () => localeDispose } });
        expect(() => control.update({ source: { getState: () => ({ signedIn: true, pending: false }), subscribe: () => sourceDispose } })).toThrow("old source");
        oldGetState.mockClear(); oldNotify(); expect(oldGetState).not.toHaveBeenCalled();
        expect(control.element.getAttribute("data-af-account-control-signed-in")).toBe("true");
        control.destroy();
        expect(sourceDispose).toHaveBeenCalledOnce(); expect(localeDispose).toHaveBeenCalledOnce();
        const before = control.element.outerHTML;
        control.update({ signedIn: false }); oldNotify(); control.element.click(); control.destroy();
        expect(control.element.outerHTML).toBe(before); expect(onSignIn).not.toHaveBeenCalled();
    });

    it("destroys the button and locale even if the active source unsubscribe throws", () => {
        const localeDispose = vi.fn(); const onSignIn = vi.fn();
        const control = AccountControl({ onSignIn,
            source: { getState: () => ({ signedIn: false, pending: false }), subscribe: () => () => { throw new Error("source"); } },
            locale: { t: () => "Action", subscribe: () => localeDispose } });
        expect(() => control.destroy()).toThrow("source");
        expect(control.button.isDestroyed()).toBe(true); expect(localeDispose).toHaveBeenCalledOnce();
        control.element.click(); expect(onSignIn).not.toHaveBeenCalled();
    });
});
