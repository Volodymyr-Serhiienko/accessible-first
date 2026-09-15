import { describe, expect, it, vi } from "vitest";
import {
    createAppLocalization
} from "../../../packages/components/src/localization";
import {
    createMemoryStorage,
    createScopedStorage
} from "../../../packages/core/src/storage";

describe("createAppLocalization", () => {
    it("keeps the controller reactive, formats from the active locale, and has no duplicate locale alias", () => {
        const localization = createAppLocalization<
            "en" | "uk",
            "app.greeting"
        >({
            supportedLocales: ["en", "uk"],
            fallbackLocale: "en",
            initialLocale: "uk",
            storage: null,
            navigatorSource: null,
            documentElement: document.documentElement,
            messages: {
                en: {
                    "app.greeting": "Hello, {name}."
                },
                uk: {
                    "app.greeting": "Privit, {name}."
                }
            }
        });
        const listener = vi.fn();
        const unsubscribe = localization.subscribe(listener);

        expect(localization.getLocale()).toBe("uk");
        expect(localization.t("app.greeting", {
            name: "Ada"
        })).toBe("Privit, Ada.");
        expect(localization.format.getLocale()).toBe("uk");
        expect(document.documentElement.lang).toBe("uk");
        expect("locale" in localization).toBe(false);

        localization.setLocale("en", {
            persist: false
        });

        expect(localization.format.getLocale()).toBe("en");
        expect(document.documentElement.lang).toBe("en");
        expect(listener).toHaveBeenCalledWith({
            locale: "en",
            previousLocale: "uk",
            source: "programmatic"
        });

        localization.destroy();

        expect(localization.setLocale("uk", {
            persist: false
        })).toBe("en");

        unsubscribe();
    });

    it("persists locale through a minimal scoped StorageLike backend", () => {
        const scopedStorage = createScopedStorage({
            key: "app-state",
            storage: createMemoryStorage()
        });

        scopedStorage?.setItem("locale", "uk");

        const localization = createAppLocalization<"en" | "uk">({
            supportedLocales: ["en", "uk"],
            fallbackLocale: "en",
            storageKey: "locale",
            storage: scopedStorage,
            navigatorSource: null
        });

        expect(localization.getLocale()).toBe("uk");

        localization.setLocale("en");

        expect(scopedStorage?.getItem("locale")).toBe("en");
    });
});
