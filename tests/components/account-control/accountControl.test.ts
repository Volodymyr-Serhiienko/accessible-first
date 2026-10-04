import { afterEach, describe, expect, it, vi } from "vitest";
import { AccountControl, type AccountControlState } from "../../../packages/components/src/account-control";
import { AppHeader } from "../../../packages/components/src/app-header";

afterEach(() => { document.body.replaceChildren(); });

describe("AccountControl", () => {
    it("describes the account on focus but displays its tooltip only on hover by default", () => {
        const control = AccountControl({ accountLabel: "My account" });
        document.body.append(control.element);
        const description = document.getElementById(control.element.getAttribute("aria-describedby")!);
        expect(description?.textContent).toBe("My account");
        control.element.focus();
        const visual = document.querySelector("[data-af-tooltip-visual]");
        expect(visual?.hasAttribute("data-af-tooltip-visible")).toBe(false);
        control.element.dispatchEvent(new Event("pointerenter"));
        expect(visual?.hasAttribute("data-af-tooltip-visible")).toBe(true);
        control.element.dispatchEvent(new Event("pointerleave"));
        expect(visual?.hasAttribute("data-af-tooltip-visible")).toBe(false);
        control.update({ hintShowOnFocus: true });
        expect(visual?.hasAttribute("data-af-tooltip-visible")).toBe(true);
        control.destroy();
    });

    it("dispatches actions without changing authentication itself or losing focus", () => {
        const onSignIn = vi.fn();
        const onSignOut = vi.fn();
        const control = AccountControl({ onSignIn, onSignOut });
        document.body.append(control.element);
        control.element.focus();
        control.element.click();
        expect(onSignIn).toHaveBeenCalledOnce();
        expect(control.getState().signedIn).toBe(false);
        expect(control.element.textContent).toBe("Sign in");
        const original = control.element;
        control.update({ signedIn: true });
        expect(control.element).toBe(original);
        expect(document.activeElement).toBe(original);
        expect(control.element.textContent).toBe("Sign out");
        expect(control.element.getAttribute("data-af-button-reserved-text")).toBe("Sign out");
        expect(control.element.hasAttribute("aria-pressed")).toBe(false);
        expect(control.element.hasAttribute("role")).toBe(false);
        control.element.click();
        expect(onSignOut).toHaveBeenCalledOnce();
        control.destroy();
    });

    it("blocks pending actions without replacing the label", () => {
        const onSignOut = vi.fn();
        const control = AccountControl({ signedIn: true, pending: true, onSignOut });
        expect(control.element.disabled).toBe(true);
        expect(control.element.getAttribute("aria-busy")).toBe("true");
        expect(control.element.textContent).toBe("Sign out");
        control.element.click();
        expect(onSignOut).not.toHaveBeenCalled();
        control.update({ pending: false });
        expect(control.element.disabled).toBe(false);
        expect(control.element.hasAttribute("aria-busy")).toBe(false);
        control.element.click();
        expect(onSignOut).toHaveBeenCalledOnce();
        control.destroy();
    });

    it("supports an accessible profile icon and changing display on the same button", () => {
        const control = AccountControl({ display: "icon", accountLabel: "My account" });
        const original = control.element;
        expect(original.querySelector("svg")).not.toBeNull();
        expect(original.getAttribute("aria-label")).toBe("Sign in");
        expect(original.hasAttribute("data-af-button-reserved-text")).toBe(false);
        control.update({ signedIn: true });
        expect(original.getAttribute("aria-label")).toBe("Sign out");
        control.update({ display: "button" });
        expect(control.element).toBe(original);
        expect(original.querySelector("svg")).toBeNull();
        expect(original.getAttribute("aria-label")).toBeNull();
        expect(original.textContent).toBe("Sign out");
        control.destroy();
    });

    it("tracks external state and detaches subscriptions on replacement and destroy", () => {
        let state: AccountControlState = { signedIn: false, pending: false };
        const listeners = new Set<() => void>();
        const source = {
            getState: () => state,
            subscribe(listener: () => void) {
                listeners.add(listener);
                return () => { listeners.delete(listener); };
            }
        };
        const control = AccountControl({ source });
        state = { signedIn: true, pending: false };
        for (const listener of listeners) listener();
        expect(control.element.textContent).toBe("Sign out");
        control.update({ source: null, signedIn: false });
        expect(listeners.size).toBe(0);
        expect(control.element.textContent).toBe("Sign in");
        control.update({ source });
        control.destroy();
        control.destroy();
        expect(listeners.size).toBe(0);
    });

    it("updates localized fallback text and releases its subscription", () => {
        let translated = "Enter";
        let notify = () => {};
        const unsubscribe = vi.fn();
        const control = AccountControl({ locale: {
            t: () => translated,
            subscribe(listener) { notify = listener; return unsubscribe; }
        } });
        expect(control.element.textContent).toBe("Enter");
        translated = "Log in";
        notify();
        expect(control.element.textContent).toBe("Log in");
        control.destroy();
        expect(unsubscribe).toHaveBeenCalledOnce();
    });

    it("is opt-in in AppHeader and follows the theme control", () => {
        const header = AppHeader({ language: false, account: {}, tools: false });
        expect(header.controls).toEqual([header.themeControl, header.accountControl]);
        expect(header.themeControl!.element.compareDocumentPosition(header.accountControl!.element)
            & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        header.destroy();
        const withoutAccount = AppHeader({ language: false, theme: false });
        expect(withoutAccount.accountControl).toBeNull();
        withoutAccount.destroy();
    });

    it("cleans up the account source when the owning header is destroyed", () => {
        const unsubscribe = vi.fn();
        const header = AppHeader({ language: false, theme: false, account: {
            source: { getState: () => ({ signedIn: true, pending: false }), subscribe: () => unsubscribe }
        } });
        header.destroy();
        expect(unsubscribe).toHaveBeenCalledOnce();
    });
});
