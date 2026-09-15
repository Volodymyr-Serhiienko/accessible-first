import { getBrowserStorage } from "./browser";
import type { StorageLike } from "./types";

const SCOPED_STORAGE_FORMAT = "accessible-first.scoped-storage";

/** One raw record stored inside a ScopedStorage envelope. */
export interface ScopedStorageRecord {
    readonly format: typeof SCOPED_STORAGE_FORMAT;
    readonly records: Readonly<Record<string, string>>;
}

/** Operation reported by ScopedStorage error handlers. */
export type ScopedStorageOperation = "read" | "write" | "remove" | "parse" | "migrate";

/** Error detail emitted by ScopedStorage. */
export interface ScopedStorageErrorDetail {
    readonly key: string;
    readonly operation: ScopedStorageOperation;
    readonly error: unknown;
}

/** Converts an application-specific legacy envelope to raw scoped records. */
export type ScopedStorageLegacyReader = (
    value: unknown,
    context: { readonly key: string }
) => Readonly<Record<string, string>> | null | undefined;

/** Options for createScopedStorage(). */
export interface ScopedStorageOptions {
    /** Physical browser-storage key that owns the application scope. */
    key: string;
    /** Browser or custom backend. Defaults to safe browser localStorage access. */
    storage?: StorageLike | null;
    /** Maps scoped record keys to physical keys from an earlier application layout. */
    legacyKeys?: Readonly<Record<string, string>>;
    /** Converts a previous envelope already stored at key into raw scoped records. */
    readLegacy?: ScopedStorageLegacyReader;
    /** Receives non-fatal browser, parse, and migration failures. */
    onError?: (detail: ScopedStorageErrorDetail) => void;
}

/** A StorageLike namespace backed by one physical browser-storage key. */
export interface ScopedStorage extends StorageLike {
    readonly key: string;
    /** Removes this scope and configured legacy physical keys without clearing other apps. */
    clear(): void;
}

interface ScopeReadResult {
    readonly records: Record<string, string>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function isStringRecord(value: unknown): value is Record<string, string> {
    return isRecord(value) && Object.values(value).every((item) => typeof item === "string");
}

function copyRecords(records: Readonly<Record<string, string>>): Record<string, string> {
    const copy: Record<string, string> = Object.create(null) as Record<string, string>;

    for (const [key, value] of Object.entries(records)) {
        copy[key] = value;
    }

    return copy;
}

function isScopedStorageRecord(value: unknown): value is ScopedStorageRecord {
    return (
        isRecord(value)
        && value.format === SCOPED_STORAGE_FORMAT
        && isStringRecord(value.records)
    );
}

function createRecord(records: Readonly<Record<string, string>>): ScopedStorageRecord {
    return {
        format: SCOPED_STORAGE_FORMAT,
        records: copyRecords(records)
    };
}

/**
 * Creates a raw-record namespace over one physical browser-storage key.
 *
 * Individual records intentionally remain raw strings so existing helpers such
 * as createVersionedStorage() and createAppLocalization() retain ownership of
 * parsing, validation, and record-level migrations.
 */
export function createScopedStorage(options: ScopedStorageOptions): ScopedStorage | null {
    const resolvedStorage = options.storage === undefined
        ? getBrowserStorage("local")
        : options.storage;

    if (!resolvedStorage) return null;

    const storage: StorageLike = resolvedStorage;

    function report(operation: ScopedStorageOperation, error: unknown): void {
        options.onError?.({
            key: options.key,
            operation,
            error
        });
    }

    function writeRecord(records: Readonly<Record<string, string>>): boolean {
        try {
            storage.setItem(options.key, JSON.stringify(createRecord(records)));
            return true;
        } catch (error) {
            report("write", error);
            return false;
        }
    }

    function removeLegacyKeys(keys: readonly string[]): void {
        for (const key of keys) {
            try {
                storage.removeItem(key);
            } catch (error) {
                report("migrate", error);
            }
        }
    }

    function readStoredScope(): ScopeReadResult | null {
        let raw: string | null;

        try {
            raw = storage.getItem(options.key);
        } catch (error) {
            report("read", error);
            return null;
        }

        if (raw === null) {
            return {
                records: copyRecords({})
            };
        }

        let parsed: unknown;

        try {
            parsed = JSON.parse(raw);
        } catch (error) {
            report("parse", error);
            return null;
        }

        if (isScopedStorageRecord(parsed)) {
            return {
                records: copyRecords(parsed.records)
            };
        }

        let legacyRecords: Readonly<Record<string, string>> | null | undefined;

        try {
            legacyRecords = options.readLegacy?.(parsed, { key: options.key });
        } catch (error) {
            report("migrate", error);
            return null;
        }

        if (!legacyRecords || !isStringRecord(legacyRecords)) {
            report("read", new Error(`Invalid scoped storage record for ${options.key}.`));
            return null;
        }

        const records = copyRecords(legacyRecords);

        if (!writeRecord(records)) {
            return { records };
        }

        return { records };
    }

    function readScope(): ScopeReadResult | null {
        const scope = readStoredScope();

        if (!scope) return null;

        const records = copyRecords(scope.records);
        const migratedKeys: string[] = [];

        for (const [recordKey, legacyKey] of Object.entries(options.legacyKeys ?? {})) {
            if (recordKey in records) {
                continue;
            }

            let legacyValue: string | null;

            try {
                legacyValue = storage.getItem(legacyKey);
            } catch (error) {
                report("read", error);
                continue;
            }

            if (legacyValue === null) {
                continue;
            }

            records[recordKey] = legacyValue;
            migratedKeys.push(legacyKey);
        }

        if (migratedKeys.length > 0 && writeRecord(records)) {
            removeLegacyKeys(migratedKeys);
        }

        return { records };
    }

    return {
        key: options.key,

        getItem(key: string): string | null {
            return readScope()?.records[key] ?? null;
        },

        setItem(key: string, value: string): void {
            const scope = readScope();

            if (!scope) return;

            const records = copyRecords(scope.records);
            records[key] = value;
            writeRecord(records);
        },

        removeItem(key: string): void {
            const scope = readScope();

            if (!scope || !(key in scope.records)) return;

            const records = copyRecords(scope.records);
            delete records[key];

            if (Object.keys(records).length === 0) {
                try {
                    storage.removeItem(options.key);
                } catch (error) {
                    report("remove", error);
                }

                return;
            }

            writeRecord(records);
        },

        clear(): void {
            try {
                storage.removeItem(options.key);
            } catch (error) {
                report("remove", error);
            }

            removeLegacyKeys(Object.values(options.legacyKeys ?? {}));
        }
    };
}
