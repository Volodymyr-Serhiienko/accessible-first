import { describe, expect, it, vi } from "vitest";
import {
    createMemoryStorage,
    createScopedStorage,
    createVersionedStorage
} from "../../../packages/core/src/storage";

describe("createScopedStorage", () => {
    it("keeps raw records under one physical key while supporting versioned records", () => {
        const backend = createMemoryStorage();
        const first = createScopedStorage({
            key: "first-app",
            storage: backend
        });
        const second = createScopedStorage({
            key: "second-app",
            storage: backend
        });

        expect(first).not.toBeNull();
        expect(second).not.toBeNull();

        first?.setItem("locale", "uk");
        second?.setItem("locale", "nb");

        const preferences = createVersionedStorage<{ theme: string }>({
            key: "preferences",
            version: 1,
            storage: first,
            validate(value): value is { theme: string } {
                return Boolean(
                    value
                    && typeof value === "object"
                    && typeof (value as { theme?: unknown }).theme === "string"
                );
            }
        });

        preferences.write({ theme: "dark" });

        expect(first?.getItem("locale")).toBe("uk");
        expect(second?.getItem("locale")).toBe("nb");
        expect(preferences.read()).toEqual({ theme: "dark" });
        expect(backend.snapshot()).toEqual({
            "first-app": expect.stringContaining("accessible-first.scoped-storage"),
            "second-app": expect.stringContaining("accessible-first.scoped-storage")
        });
    });

    it("migrates configured physical keys only after writing the scoped record", () => {
        const backend = createMemoryStorage({
            "legacy.locale": "ru",
            "legacy.preferences": "{\"theme\":\"dark\"}"
        });
        const scoped = createScopedStorage({
            key: "app-state",
            storage: backend,
            legacyKeys: {
                locale: "legacy.locale",
                preferences: "legacy.preferences"
            }
        });

        expect(scoped?.getItem("locale")).toBe("ru");
        expect(scoped?.getItem("preferences")).toBe("{\"theme\":\"dark\"}");
        expect(backend.getItem("legacy.locale")).toBeNull();
        expect(backend.getItem("legacy.preferences")).toBeNull();
        expect(JSON.parse(backend.getItem("app-state") ?? "")).toEqual({
            format: "accessible-first.scoped-storage",
            records: {
                locale: "ru",
                preferences: "{\"theme\":\"dark\"}"
            }
        });
    });

    it("converts a recognized legacy envelope without asking the caller to rebuild a storage facade", () => {
        const backend = createMemoryStorage({
            "app-state": JSON.stringify({
                format: "legacy-app-state",
                records: {
                    locale: "uk",
                    preferences: {
                        theme: "dark"
                    }
                }
            })
        });
        const scoped = createScopedStorage({
            key: "app-state",
            storage: backend,
            readLegacy(value) {
                if (
                    !value
                    || typeof value !== "object"
                    || (value as { format?: unknown }).format !== "legacy-app-state"
                ) {
                    return null;
                }

                const records = (value as { records?: unknown }).records;

                if (!records || typeof records !== "object") {
                    return null;
                }

                const locale = (records as { locale?: unknown }).locale;
                const preferences = (records as { preferences?: unknown }).preferences;

                return typeof locale === "string" && preferences !== undefined
                    ? {
                        locale,
                        preferences: JSON.stringify(preferences)
                    }
                    : null;
            }
        });

        expect(scoped?.getItem("locale")).toBe("uk");
        expect(scoped?.getItem("preferences")).toBe("{\"theme\":\"dark\"}");
        expect(JSON.parse(backend.getItem("app-state") ?? "")).toEqual({
            format: "accessible-first.scoped-storage",
            records: {
                locale: "uk",
                preferences: "{\"theme\":\"dark\"}"
            }
        });
    });

    it("leaves an unrecognized physical value intact and reports the failure", () => {
        const backend = createMemoryStorage({
            state: "not-json"
        });
        const onError = vi.fn();
        const scoped = createScopedStorage({
            key: "state",
            storage: backend,
            onError
        });

        expect(scoped?.getItem("locale")).toBeNull();
        scoped?.setItem("locale", "en");

        expect(backend.getItem("state")).toBe("not-json");
        expect(onError).toHaveBeenCalledWith(expect.objectContaining({
            key: "state",
            operation: "parse"
        }));
    });
});
