import { describe, expect, it, vi } from "vitest";
import {
    createMemoryStorage,
    createVersionedStorage
} from "../../../packages/core/src/storage";

interface Settings {
    density: "comfortable" | "compact";
}

function isSettings(value: unknown): value is Settings {
    if (!value || typeof value !== "object") {
        return false;
    }

    const density = (value as { density?: unknown }).density;

    return density === "comfortable" || density === "compact";
}

describe("createVersionedStorage", () => {
    it("migrates a valid older record, persists it, and reports later changes", () => {
        const storage = createMemoryStorage({
            settings: JSON.stringify({
                format: "accessible-first.versioned-storage",
                version: 1,
                updatedAt: "2026-01-01T00:00:00.000Z",
                value: {
                    density: "compact"
                }
            })
        });

        const settings = createVersionedStorage<Settings>({
            key: "settings",
            version: 2,
            storage,
            defaultValue: {
                density: "comfortable"
            },
            validate: isSettings,
            migrations: [
                {
                    from: 1,
                    migrate: () => ({
                        density: "comfortable"
                    })
                }
            ],
            now: () => new Date("2026-09-08T00:00:00.000Z")
        });

        const migrated = settings.readResult();

        expect(migrated.status).toBe("migrated");
        expect(migrated.value).toEqual({
            density: "comfortable"
        });

        expect(JSON.parse(storage.getItem("settings") ?? "")).toMatchObject({
            format: "accessible-first.versioned-storage",
            version: 2,
            value: {
                density: "comfortable"
            }
        });

        const listener = vi.fn();
        const unsubscribe = settings.subscribe(listener);

        const written = settings.write({
            density: "compact"
        });

        expect(written.status).toBe("written");
        expect(listener).toHaveBeenCalledWith({
            key: "settings",
            version: 2,
            value: {
                density: "compact"
            },
            previousValue: {
                density: "comfortable"
            },
            source: "write"
        });

        unsubscribe();
    });
});
