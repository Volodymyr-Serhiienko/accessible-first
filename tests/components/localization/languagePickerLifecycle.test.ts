import { afterEach, describe, expect, it, vi } from "vitest";
import { LanguageCombobox, LanguageSelect, createLocaleController } from "../../../packages/components/src";
import { getLanguagePickerItems, getLocaleDisplayName } from "../../../packages/components/src/language-select/languageOptions";

type Locale = "en" | "ru" | "ar";
const makeLocale = () => createLocaleController<Locale>({ supportedLocales: ["en", "ru", "ar"], fallbackLocale: "en", initialLocale: "en",
    storage: null, navigatorSource: null, messages: { en: { "languageSelect.label": "Language" }, ru: { "languageSelect.label": "Interface language RU" } } });
type Picker = ReturnType<typeof LanguageSelect<Locale>> | ReturnType<typeof LanguageCombobox<Locale>>;
const key = (target: HTMLElement, value: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: value, bubbles: true, cancelable: true }));
function commit(picker: Picker, value: string): void {
    if ("select" in picker) { picker.control.value = value; picker.control.dispatchEvent(new Event("change", { bubbles: true })); }
    else { picker.combobox.open(); picker.combobox.setActiveValue(value); key(picker.control, "Enter"); }
}
const option = (picker: Picker, value: string) => "select" in picker ? picker.select.getItem(value)!.option : picker.combobox.getItem(value)!.option;
const value = (picker: Picker) => "select" in picker ? picker.select.getValue() : picker.combobox.getSelectedValue();
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe.each(["select", "combobox"] as const)("Language %s lifecycle", kind => {
    const create = kind === "select" ? LanguageSelect<Locale> : LanguageCombobox<Locale>;

    it("keeps an authored label and result identity on chrome-only updates", () => {
        const locale = makeLocale(); const resolver = vi.fn(() => null);
        const picker = create({ locale, label: "Choose language", getItemLabel: resolver });
        document.body.append(picker.element); picker.control.focus(); const first = option(picker, "en"); resolver.mockClear();
        picker.update({ width: "18rem", className: "custom" });
        expect(picker.element.querySelector("label")?.textContent).toBe("Choose language"); expect(option(picker, "en")).toBe(first);
        expect(resolver).not.toHaveBeenCalled(); expect(document.activeElement).toBe(picker.control); expect(value(picker)).toBe("en");
        picker.destroy(); locale.destroy();
    });

    it("preserves explicit null label and clears manual width in autoWidth=false mode", () => {
        const locale = makeLocale(); const picker = create({ locale, label: null, width: "18rem" });
        picker.update({ autoWidth: false, width: null });
        expect(picker.element.querySelector("label")).toBeNull(); expect(picker.element.style.length).toBe(0);
        picker.destroy(); locale.destroy();
    });

    it("ignores setters, update and stale notifications after terminal destruction", () => {
        const locale = makeLocale(); const original = locale.subscribe; let notify = () => {};
        vi.spyOn(locale, "subscribe").mockImplementation(listener => { notify = () => listener({ locale: "ru", previousLocale: "en", source: "programmatic" }); return original(listener); });
        const picker = create({ locale }); picker.destroy(); const before = picker.element.outerHTML;
        expect(picker.setLocale("ru")).toBe("en"); picker.update({ width: "90rem", label: "Late" }); notify(); picker.destroy();
        expect(locale.getLocale()).toBe("en"); expect(picker.isDestroyed()).toBe(true); expect(picker.element.outerHTML).toBe(before); locale.destroy();
    });

    it("finishes underlying teardown after unsubscribe failure and does not destroy the shared controller", () => {
        const locale = makeLocale(); const original = locale.subscribe; const dispose = vi.fn();
        vi.spyOn(locale, "subscribe").mockImplementation(listener => { const stop = original(listener); return () => { stop(); dispose(); throw new Error("unsubscribe"); }; });
        const picker = create({ locale });
        expect(() => picker.destroy()).toThrow("unsubscribe");
        expect(("select" in picker ? picker.select : picker.combobox).isDestroyed()).toBe(true);
        picker.destroy(); expect(dispose).toHaveBeenCalledOnce(); locale.setLocale("ru"); expect(locale.getLocale()).toBe("ru"); locale.destroy();
    });

    it("accepts synchronous initial subscription notifications without resubscribing", () => {
        const locale = makeLocale(); const original = locale.subscribe;
        const subscribe = vi.spyOn(locale, "subscribe").mockImplementation(listener => { listener({ locale: "en", previousLocale: "en", source: "initial" }); return original(listener); });
        const picker = create({ locale }); picker.update({ label: "Updated" }); locale.setLocale("ru");
        expect(subscribe).toHaveBeenCalledOnce(); expect(value(picker)).toBe("ru"); picker.destroy(); locale.destroy();
    });

    it("cleans a partially constructed underlying control when subscribing throws", () => {
        const locale = makeLocale(); vi.spyOn(locale, "subscribe").mockImplementation(() => { throw new Error("subscribe"); });
        const remove = vi.spyOn(kind === "select" ? HTMLSelectElement.prototype : HTMLInputElement.prototype, "removeEventListener");
        expect(() => create({ locale })).toThrow("subscribe"); expect(remove).toHaveBeenCalled(); locale.destroy();
    });

    it("newer labels from a reentrant resolver win over the previous render", () => {
        const locale = makeLocale(); const picker = create({ locale }); let replace = true;
        picker.update({ getItemLabel() {
            if (replace) { replace = false; picker.update({ getItemLabel: code => `Latest ${code}`, label: "Latest label" }); }
            return "Obsolete";
        } });
        expect(option(picker, "ru").textContent).toBe("Latest ru"); expect(picker.element.querySelector("label")?.textContent).toBe("Latest label");
        picker.destroy(); locale.destroy();
    });

    it("does not write sizing or labels after a resolver destroys its owner", () => {
        const locale = makeLocale(); const picker = create({ locale }); let retired = "";
        picker.update({ width: "90rem", getItemLabel() { picker.destroy(); retired = picker.element.outerHTML; return "Late"; } });
        expect(picker.isDestroyed()).toBe(true); expect(picker.element.outerHTML).toBe(retired); locale.destroy();
    });

    it("refreshes external locale changes in place without announcing a user action", () => {
        const locale = makeLocale(); const changed = vi.fn(); const picker = create({ locale, onLocaleChange: changed });
        const first = option(picker, "en"); locale.setLocale("ru");
        expect(value(picker)).toBe("ru"); expect(option(picker, "en")).toBe(first); expect(first.lang).toBe("ru");
        expect(picker.element.querySelector("label")?.textContent).toBe("Interface language RU"); expect(changed).not.toHaveBeenCalled(); picker.destroy(); locale.destroy();
    });

    it("applies one user change, while same-value and programmatic changes stay silent", () => {
        const locale = makeLocale(); const changed = vi.fn(); const picker = create({ locale, onLocaleChange: changed });
        document.body.append(picker.element); commit(picker, "ru");
        expect(changed).toHaveBeenCalledOnce(); expect(changed.mock.calls[0]![0]).toMatchObject({ previousLocale: "en", locale: "ru" });
        commit(picker, "ru"); picker.setLocale("ar"); expect(changed).toHaveBeenCalledOnce(); expect(value(picker)).toBe("ar"); picker.destroy(); locale.destroy();
    });

    it("does not emit a stale user callback if a locale subscriber destroys the picker", () => {
        const locale = makeLocale(); const changed = vi.fn(); let picker!: Picker;
        locale.subscribe(() => picker.destroy()); picker = create({ locale, onLocaleChange: changed });
        document.body.append(picker.element); commit(picker, "ru"); expect(changed).not.toHaveBeenCalled(); expect(picker.isDestroyed()).toBe(true); locale.destroy();
    });

    it("does not report the selected locale after a subscriber redirects to a newer locale", () => {
        const locale = makeLocale(); const changed = vi.fn();
        locale.subscribe(detail => { if (detail.locale === "ru") locale.setLocale("ar"); });
        const picker = create({ locale, onLocaleChange: changed }); document.body.append(picker.element); commit(picker, "ru");
        expect(changed).not.toHaveBeenCalled(); expect(locale.getLocale()).toBe("ar"); expect(value(picker)).toBe("ar"); picker.destroy(); locale.destroy();
    });

    it("honors per-call persistence, language, direction and source overrides", () => {
        const locale = makeLocale(); const set = vi.spyOn(locale, "setLocale");
        const picker = create({ locale, persist: true, syncDocumentLanguage: true });
        picker.setLocale("ar", { persist: false, syncDocumentLanguage: false, syncDocumentDirection: false, source: "storage" });
        expect(set).toHaveBeenLastCalledWith("ar", { persist: false, syncDocumentLanguage: false, syncDocumentDirection: false, source: "storage" });
        expect(document.documentElement.lang).toBe("en"); expect(document.documentElement.dir).toBe("ltr");
        picker.update({ persist: false, syncDocumentLanguage: false }); picker.setLocale("ru");
        expect(set).toHaveBeenLastCalledWith("ru", { persist: false, syncDocumentLanguage: false, source: "programmatic" }); picker.destroy(); locale.destroy();
    });

    it("marks automatic native names with their own language and localized names with the UI language", () => {
        const locale = makeLocale(); const picker = create({ locale, nameFormat: "native" });
        expect(option(picker, "ru").lang).toBe("ru"); expect(option(picker, "ar").lang).toBe("ar");
        picker.update({ nameFormat: "localized-and-native" }); expect(option(picker, "ru").lang).toBe("en");
        picker.update({ nameFormat: "native", getItemLabel: code => code === "ru" ? "Russian override" : null });
        expect(option(picker, "ru").lang).toBe("en"); expect(option(picker, "ar").lang).toBe("ar"); picker.destroy(); locale.destroy();
    });

    it("resolves custom missing labels consistently while retaining explicit labels and language metadata", () => {
        const locale = makeLocale(); const resolver = vi.fn(); const picker = create({ locale, nameFormat: "native", getItemLabel: resolver,
            items: [{ locale: "en", label: "Custom English", optionOptions: { attributes: { lang: "en-GB" } } }, { locale: "ru" }] });
        expect(option(picker, "en").textContent).toBe("Custom English"); expect(option(picker, "en").lang).toBe("en-GB");
        expect(option(picker, "ru").textContent).toBe(getLocaleDisplayName("ru", "en")); expect(option(picker, "ru").lang).toBe("en");
        expect(resolver).not.toHaveBeenCalled(); picker.destroy(); locale.destroy();
    });
});

describe("Language picker helpers and pending selection", () => {
    it("retains a pending combobox option when width or label changes", () => {
        const locale = makeLocale(); const picker = LanguageCombobox({ locale }); document.body.append(picker.element); picker.control.focus();
        key(picker.control, "ArrowDown"); key(picker.control, "ArrowDown"); const active = picker.combobox.getActiveOption();
        picker.update({ width: "22rem", label: "New label" });
        expect(picker.combobox.getActiveOption()).toBe(active); expect(picker.combobox.isOpen()).toBe(true); expect(locale.getLocale()).toBe("en");
        key(picker.control, "Enter"); expect(locale.getLocale()).toBe("ru"); picker.destroy(); locale.destroy();
    });

    it("falls back to locale codes when Intl.DisplayNames is unavailable", () => {
        vi.stubGlobal("Intl", { ...Intl, DisplayNames: undefined });
        const items = getLanguagePickerItems({ nameFormat: "native" }, "en", ["en", "ru"]);
        expect(items.map(item => item.label)).toEqual(["EN", "RU"]); expect(items[1]!.optionOptions?.attributes?.lang).toBe("ru");
    });

    it("falls back for invalid display-name input rather than throwing", () => {
        expect(getLocaleDisplayName("invalid_code", "invalid_code")).toBe("INVALID_CODE");
    });
});
