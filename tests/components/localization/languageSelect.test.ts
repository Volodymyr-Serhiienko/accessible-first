import { afterEach, describe, expect, it } from "vitest";
import {
    AppHeader,
    LanguageCombobox,
    LanguageSelect,
    createLocaleController
} from "../../../packages/components/src";

afterEach(() => {
    document.body.replaceChildren();
});

describe("LanguageSelect", () => {
    it("can combine the localized and native names for automatic items", () => {
        const locale = createLocaleController<"en" | "ru">({
            supportedLocales: ["en", "ru"],
            fallbackLocale: "en",
            initialLocale: "en",
            storage: null,
            navigatorSource: null
        });
        const select = LanguageSelect({
            locale,
            nameFormat: "localized-and-native"
        });

        document.body.append(select.element);

        const russian = select.select.getItem("ru")?.option;

        expect(russian?.textContent?.toLocaleLowerCase("ru")).toContain("русск");
        expect(russian?.textContent).toContain("(");
        expect(russian?.lang).toBe("en");

        locale.setLocale("ru", { persist: false });

        const english = select.select.getItem("en")?.option;

        expect(english?.textContent).toContain("English");
        expect(english?.lang).toBe("ru");

        select.destroy();
        locale.destroy();
    });

    it("refreshes exceptional automatic labels with the active locale", () => {
        const locale = createLocaleController<"en" | "ru">({
            supportedLocales: ["en", "ru"],
            fallbackLocale: "en",
            initialLocale: "en",
            storage: null,
            navigatorSource: null
        });
        const select = LanguageSelect({
            locale,
            getItemLabel: (itemLocale, currentLocale) => {
                return itemLocale === "ru"
                    ? `Russian for ${currentLocale}`
                    : null;
            }
        });

        expect(select.select.getItem("ru")?.option.textContent)
            .toBe("Russian for en");

        locale.setLocale("ru", { persist: false });

        expect(select.select.getItem("ru")?.option.textContent)
            .toBe("Russian for ru");

        select.destroy();
        locale.destroy();
    });
});

describe("LanguageCombobox", () => {
    it("keeps arrow navigation pending until Enter selects a locale", () => {
        const locale = createLocaleController<"en" | "ru">({
            supportedLocales: ["en", "ru"],
            fallbackLocale: "en",
            initialLocale: "en",
            storage: null,
            navigatorSource: null
        });
        const combobox = LanguageCombobox({
            locale,
            nameFormat: "localized-and-native"
        });

        document.body.append(combobox.element);
        combobox.control.dispatchEvent(new KeyboardEvent("keydown", {
            key: "ArrowDown",
            bubbles: true
        }));
        combobox.control.dispatchEvent(new KeyboardEvent("keydown", {
            key: "ArrowDown",
            bubbles: true
        }));

        expect(locale.getLocale()).toBe("en");
        expect(combobox.control.readOnly).toBe(true);
        expect(combobox.combobox.getActiveItem()?.value).toBe("ru");

        combobox.control.dispatchEvent(new KeyboardEvent("keydown", {
            key: "Enter",
            bubbles: true
        }));

        expect(locale.getLocale()).toBe("ru");
        expect(combobox.combobox.getSelectedValue()).toBe("ru");
        expect(combobox.combobox.getItem("en")?.option.lang).toBe("ru");

        combobox.destroy();
        locale.destroy();
    });

    it("lets AppHeader opt into confirmed language selection", () => {
        const locale = createLocaleController<"en" | "ru">({
            supportedLocales: ["en", "ru"],
            fallbackLocale: "en",
            initialLocale: "en",
            storage: null,
            navigatorSource: null
        });
        const header = AppHeader({
            locale,
            language: {
                control: "combobox"
            }
        });

        expect(header.languageControl?.control).toBeInstanceOf(HTMLInputElement);

        header.destroy();
        locale.destroy();
    });
});
