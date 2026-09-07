/** Minimal sync key-value storage accepted by Accessible First storage helpers. */
export interface StorageLike {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
}

/** Browser storage backend kind. */
export type BrowserStorageKind = "local" | "session";

/** Stored Accessible First versioned record. */
export interface VersionedStorageRecord<TValue = unknown> {
    readonly format: "accessible-first.versioned-storage";
    readonly version: number;
    readonly updatedAt: string;
    readonly value: TValue;
}

/** Result status for VersionedStorage reads. */
export type VersionedStorageReadStatus =
    | "ready"
    | "empty"
    | "migrated"
    | "invalid"
    | "future-version"
    | "unavailable"
    | "error";

/** Result status for VersionedStorage writes. */
export type VersionedStorageWriteStatus = "written" | "invalid" | "unavailable" | "error";

/** Result status for VersionedStorage removals. */
export type VersionedStorageRemoveStatus = "removed" | "unavailable" | "error";

/** Source of a VersionedStorage change notification. */
export type VersionedStorageChangeSource = "write" | "remove" | "reset" | "migration";

/** Default value or lazy default value for VersionedStorage. */
export type VersionedStorageDefault<TValue> = TValue | (() => TValue);

/** Runtime validator for stored values. */
export type VersionedStorageValidator<TValue> = (value: unknown) => value is TValue;

/** Context passed to storage migration functions. */
export interface VersionedStorageMigrationContext {
    readonly key: string;
    readonly fromVersion: number;
    readonly toVersion: number;
    readonly targetVersion: number;
}

/** Migration step from one stored version to a newer version. */
export interface VersionedStorageMigration {
    readonly from: number;
    readonly to?: number;
    migrate(value: unknown, context: VersionedStorageMigrationContext): unknown;
}

/** Reader used when an existing key still contains unversioned legacy JSON. */
export type VersionedStorageLegacyReader<TValue> = (
    value: unknown,
    context: { readonly key: string; readonly targetVersion: number }
) => TValue | null | undefined;

/** Operation reported to VersionedStorage error handlers. */
export type VersionedStorageOperation = "read" | "write" | "remove" | "parse" | "migrate" | "validate";

/** Error detail emitted by VersionedStorage. */
export interface VersionedStorageErrorDetail {
    readonly key: string;
    readonly operation: VersionedStorageOperation;
    readonly error: unknown;
}

/** Options for createVersionedStorage(). */
export interface VersionedStorageOptions<TValue> {
    key: string;
    version: number;
    storage?: StorageLike | null;
    defaultValue?: VersionedStorageDefault<TValue>;
    validate?: VersionedStorageValidator<TValue>;
    migrations?: readonly VersionedStorageMigration[];
    readLegacy?: VersionedStorageLegacyReader<TValue>;
    persistMigrations?: boolean;
    removeInvalid?: boolean;
    parse?: (raw: string) => unknown;
    serialize?: (record: VersionedStorageRecord<TValue>) => string;
    now?: () => Date;
    onError?: (detail: VersionedStorageErrorDetail) => void;
}

/** Options for VersionedStorage.readResult(). */
export interface VersionedStorageReadOptions {
    useDefault?: boolean;
    persistMigration?: boolean;
    removeInvalid?: boolean;
}

/** Result returned by VersionedStorage.readResult(). */
export interface VersionedStorageReadResult<TValue> {
    readonly key: string;
    readonly version: number;
    readonly storedVersion: number | null;
    readonly status: VersionedStorageReadStatus;
    readonly value: TValue | null;
    readonly usingDefault: boolean;
    readonly migrated: boolean;
    readonly error: unknown | null;
}

/** Options for VersionedStorage.write(). */
export interface VersionedStorageWriteOptions {
    notify?: boolean;
    source?: VersionedStorageChangeSource;
    version?: number;
}

/** Result returned by VersionedStorage.write(). */
export interface VersionedStorageWriteResult<TValue> {
    readonly key: string;
    readonly version: number;
    readonly status: VersionedStorageWriteStatus;
    readonly value: TValue | null;
    readonly error: unknown | null;
}

/** Options for VersionedStorage.remove(). */
export interface VersionedStorageRemoveOptions {
    notify?: boolean;
    source?: VersionedStorageChangeSource;
}

/** Result returned by VersionedStorage.remove(). */
export interface VersionedStorageRemoveResult {
    readonly key: string;
    readonly status: VersionedStorageRemoveStatus;
    readonly error: unknown | null;
}

/** Detail emitted to VersionedStorage subscribers. */
export interface VersionedStorageChangeDetail<TValue> {
    readonly key: string;
    readonly version: number;
    readonly value: TValue | null;
    readonly previousValue: TValue | null;
    readonly source: VersionedStorageChangeSource;
}

/** Listener for VersionedStorage changes in the current app instance. */
export type VersionedStorageChangeListener<TValue> = (
    detail: VersionedStorageChangeDetail<TValue>
) => void;

/** Controller returned by createVersionedStorage(). */
export interface VersionedStorage<TValue> {
    readonly key: string;
    readonly version: number;
    read(options?: VersionedStorageReadOptions): TValue | null;
    readResult(options?: VersionedStorageReadOptions): VersionedStorageReadResult<TValue>;
    write(value: TValue, options?: VersionedStorageWriteOptions): VersionedStorageWriteResult<TValue>;
    update(
        updater: (value: TValue | null) => TValue,
        options?: VersionedStorageWriteOptions
    ): VersionedStorageWriteResult<TValue>;
    remove(options?: VersionedStorageRemoveOptions): VersionedStorageRemoveResult;
    reset(options?: VersionedStorageWriteOptions): VersionedStorageWriteResult<TValue> | VersionedStorageRemoveResult;
    getDefault(): TValue | null;
    subscribe(listener: VersionedStorageChangeListener<TValue>): () => void;
}

/** In-memory storage backend useful for tests, demos, and non-browser runtimes. */
export interface MemoryStorage extends StorageLike {
    snapshot(): Record<string, string>;
    clear(): void;
}

const STORAGE_FORMAT = "accessible-first.versioned-storage";

function isObject(value: unknown): value is Record<string, unknown> {
    return Boolean(value && typeof value === "object");
}

function isVersionedStorageRecord(value: unknown): value is VersionedStorageRecord<unknown> {
    if (!isObject(value)) return false;

    const version = value.version;

    return value.format === STORAGE_FORMAT
        && typeof version === "number"
        && Number.isInteger(version)
        && version >= 0
        && "value" in value;
}

/** Returns browser localStorage or sessionStorage safely. */
export function getBrowserStorage(kind: BrowserStorageKind = "local"): StorageLike | null {
    if (typeof window === "undefined") return null;

    try {
        return kind === "session" ? window.sessionStorage : window.localStorage;
    } catch {
        return null;
    }
}

/** Creates a small in-memory StorageLike backend. */
export function createMemoryStorage(initial: Record<string, string> = {}): MemoryStorage {
    const data = new Map<string, string>(Object.entries(initial));

    return {
        getItem(key) {
            return data.get(key) ?? null;
        },
        setItem(key, value) {
            data.set(key, value);
        },
        removeItem(key) {
            data.delete(key);
        },
        snapshot() {
            return Object.fromEntries(data);
        },
        clear() {
            data.clear();
        }
    };
}

/** Creates a versioned JSON storage controller for non-sensitive app state. */
export function createVersionedStorage<TValue>(
    options: VersionedStorageOptions<TValue>
): VersionedStorage<TValue> {
    const storage = options.storage === undefined ? getBrowserStorage("local") : options.storage;
    const parse = options.parse ?? JSON.parse;
    const serialize = options.serialize ?? JSON.stringify;
    const persistMigrations = options.persistMigrations ?? true;
    const removeInvalid = options.removeInvalid ?? false;
    const listeners = new Set<VersionedStorageChangeListener<TValue>>();

    function emitError(operation: VersionedStorageOperation, error: unknown): void {
        options.onError?.({ key: options.key, operation, error });
    }

    function hasDefault(): boolean {
        return Object.prototype.hasOwnProperty.call(options, "defaultValue");
    }

    function getDefault(): TValue | null {
        if (!hasDefault()) return null;

        const value = options.defaultValue;

        return typeof value === "function"
            ? (value as () => TValue)()
            : value as TValue;
    }

    function withDefault(
        status: VersionedStorageReadStatus,
        storedVersion: number | null,
        migrated: boolean,
        error: unknown | null,
        useDefault: boolean
    ): VersionedStorageReadResult<TValue> {
        const value = useDefault ? getDefault() : null;

        return {
            key: options.key,
            version: options.version,
            storedVersion,
            status,
            value,
            usingDefault: value !== null,
            migrated,
            error
        };
    }

    function isValid(value: unknown): value is TValue {
        return options.validate ? options.validate(value) : true;
    }

    function notify(value: TValue | null, previousValue: TValue | null, source: VersionedStorageChangeSource): void {
        const detail: VersionedStorageChangeDetail<TValue> = {
            key: options.key,
            version: options.version,
            value,
            previousValue,
            source
        };

        listeners.forEach((listener) => listener(detail));
    }

    function removeStoredSilently(): void {
        if (!storage) return;

        try {
            storage.removeItem(options.key);
        } catch {
            // Ignore cleanup failures; the original read/write result owns the error.
        }
    }

    function migrateValue(value: unknown, fromVersion: number): { value: unknown; version: number } {
        let nextValue = value;
        let currentVersion = fromVersion;
        const seenVersions = new Set<number>();

        while (currentVersion < options.version) {
            if (seenVersions.has(currentVersion)) {
                throw new Error(`Storage migration cycle at version ${currentVersion}.`);
            }

            seenVersions.add(currentVersion);

            const migration = options.migrations?.find((item) => item.from === currentVersion);

            if (!migration) {
                throw new Error(`Missing storage migration from version ${currentVersion}.`);
            }

            const toVersion = migration.to ?? currentVersion + 1;

            if (toVersion <= currentVersion || toVersion > options.version) {
                throw new Error(`Invalid storage migration target ${toVersion}.`);
            }

            nextValue = migration.migrate(nextValue, {
                key: options.key,
                fromVersion: currentVersion,
                toVersion,
                targetVersion: options.version
            });
            currentVersion = toVersion;
        }

        return { value: nextValue, version: currentVersion };
    }

    function createRecord(value: TValue, version = options.version): VersionedStorageRecord<TValue> {
        return {
            format: STORAGE_FORMAT,
            version,
            updatedAt: (options.now?.() ?? new Date()).toISOString(),
            value
        };
    }

    function write(value: TValue, writeOptions: VersionedStorageWriteOptions = {}): VersionedStorageWriteResult<TValue> {
        if (!isValid(value)) {
            return { key: options.key, version: options.version, status: "invalid", value: null, error: null };
        }

        if (!storage) {
            return { key: options.key, version: options.version, status: "unavailable", value, error: null };
        }

        const previousValue = writeOptions.notify === false
            ? null
            : read({ useDefault: false, persistMigration: false });

        try {
            storage.setItem(options.key, serialize(createRecord(value, writeOptions.version ?? options.version)));

            if (writeOptions.notify ?? true) {
                notify(value, previousValue, writeOptions.source ?? "write");
            }

            return { key: options.key, version: options.version, status: "written", value, error: null };
        } catch (error) {
            emitError("write", error);
            return { key: options.key, version: options.version, status: "error", value: null, error };
        }
    }

    function readResult(readOptions: VersionedStorageReadOptions = {}): VersionedStorageReadResult<TValue> {
        const useDefault = readOptions.useDefault ?? true;
        const shouldPersistMigration = readOptions.persistMigration ?? persistMigrations;
        const shouldRemoveInvalid = readOptions.removeInvalid ?? removeInvalid;

        if (!storage) return withDefault("unavailable", null, false, null, useDefault);

        let raw: string | null;

        try {
            raw = storage.getItem(options.key);
        } catch (error) {
            emitError("read", error);
            return withDefault("error", null, false, error, useDefault);
        }

        if (raw === null) return withDefault("empty", null, false, null, useDefault);

        let parsed: unknown;

        try {
            parsed = parse(raw);
        } catch (error) {
            emitError("parse", error);
            if (shouldRemoveInvalid) removeStoredSilently();
            return withDefault("error", null, false, error, useDefault);
        }

        try {
            if (isVersionedStorageRecord(parsed)) {
                if (parsed.version > options.version) {
                    return withDefault("future-version", parsed.version, false, null, useDefault);
                }

                const migrated = parsed.version < options.version;
                const migratedResult = migrated
                    ? migrateValue(parsed.value, parsed.version)
                    : { value: parsed.value, version: parsed.version };

                if (!isValid(migratedResult.value)) {
                    if (shouldRemoveInvalid) removeStoredSilently();
                    return withDefault("invalid", parsed.version, migrated, null, useDefault);
                }

                const value = migratedResult.value;

                if (migrated && shouldPersistMigration) {
                    write(value, { notify: false, source: "migration" });
                }

                return {
                    key: options.key,
                    version: options.version,
                    storedVersion: parsed.version,
                    status: migrated ? "migrated" : "ready",
                    value,
                    usingDefault: false,
                    migrated,
                    error: null
                };
            }

            const legacyValue = options.readLegacy?.(parsed, {
                key: options.key,
                targetVersion: options.version
            });

            if (legacyValue === null || legacyValue === undefined || !isValid(legacyValue)) {
                if (shouldRemoveInvalid) removeStoredSilently();
                return withDefault("invalid", null, false, null, useDefault);
            }

            if (shouldPersistMigration) {
                write(legacyValue, { notify: false, source: "migration" });
            }

            return {
                key: options.key,
                version: options.version,
                storedVersion: null,
                status: "migrated",
                value: legacyValue,
                usingDefault: false,
                migrated: true,
                error: null
            };
        } catch (error) {
            emitError("migrate", error);
            return withDefault("error", null, false, error, useDefault);
        }
    }

    function read(readOptions?: VersionedStorageReadOptions): TValue | null {
        return readResult(readOptions).value;
    }

    function getResetRemoveOptions(writeOptions: VersionedStorageWriteOptions): VersionedStorageRemoveOptions {
        const removeOptions: VersionedStorageRemoveOptions = {
            source: "reset"
        };

        if (writeOptions.notify !== undefined) {
            removeOptions.notify = writeOptions.notify;
        }

        return removeOptions;
    }

    function remove(removeOptions: VersionedStorageRemoveOptions = {}): VersionedStorageRemoveResult {
        if (!storage) return { key: options.key, status: "unavailable", error: null };

        const previousValue = removeOptions.notify === false
            ? null
            : read({ useDefault: false, persistMigration: false });

        try {
            storage.removeItem(options.key);

            if (removeOptions.notify ?? true) {
                notify(null, previousValue, removeOptions.source ?? "remove");
            }

            return { key: options.key, status: "removed", error: null };
        } catch (error) {
            emitError("remove", error);
            return { key: options.key, status: "error", error };
        }
    }
    return {
        key: options.key,
        version: options.version,

        read,

        readResult,

        write,

        update(updater, writeOptions) {
            return write(updater(read()), writeOptions);
        },

        remove,

        reset(writeOptions = {}) {
            if (!hasDefault()) {
                return remove(getResetRemoveOptions(writeOptions));
            }

            const defaultValue = getDefault();

            if (defaultValue === null) {
                return remove(getResetRemoveOptions(writeOptions));
            }

            return write(defaultValue, {
                ...writeOptions,
                source: writeOptions.source ?? "reset"
            });
        },

        getDefault,

        subscribe(listener) {
            listeners.add(listener);

            return () => {
                listeners.delete(listener);
            };
        }
    };
}
