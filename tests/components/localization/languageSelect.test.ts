import { afterEach, describe, expect, it } from "vitest";
import {
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
