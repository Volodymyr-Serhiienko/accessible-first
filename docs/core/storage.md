# Storage

The Storage module provides small, framework-independent helpers for versioned client-side JSON state.

Use it for application preferences, progress, cached lightweight state, feature flags, and other non-sensitive data that should survive reloads.

Do not use browser storage for secrets, admin credentials, payment state, or data that must be authoritative on the server.

## Quick Start

```ts
interface Preferences {
    theme: "light" | "dark";
    speechRate: number;
}

const preferences = createVersionedStorage<Preferences>({
    key: "my-app.preferences",
    version: 1,
    defaultValue: {
        theme: "dark",
        speechRate: 1
    },
    validate(value): value is Preferences {
        return Boolean(
            value
                && typeof value === "object"
                && ((value as Preferences).theme === "light" || (value as Preferences).theme === "dark")
                && typeof (value as Preferences).speechRate === "number"
        );
    }
});

const current = preferences.read();

preferences.write({
    theme: "light",
    speechRate: 0.9
});
```

## Versioned Records

Values are stored in an Accessible First envelope:

```json
{
  "format": "accessible-first.versioned-storage",
  "version": 1,
  "updatedAt": "2026-09-07T12:00:00.000Z",
  "value": {}
}
```

The envelope lets applications migrate old data deliberately instead of guessing from unversioned JSON.

## Migrations

```ts
const progress = createVersionedStorage<ProgressV2>({
    key: "my-app.progress",
    version: 2,
    validate: isProgressV2,
    migrations: [
        {
            from: 1,
            to: 2,
            migrate(value) {
                const old = value as ProgressV1;

                return {
                    targetLanguage: old.targetLanguage,
                    completedLessonIds: old.doneLessons ?? []
                };
            }
        }
    ]
});
```

Migrations run from the stored version toward the configured target version. If migrated data passes validation, the migrated envelope can be persisted automatically.

## Legacy Data

Use `readLegacy` when adopting a key that already contains raw JSON without an Accessible First envelope:

```ts
const selectedPair = createVersionedStorage<SelectedLanguagePair>({
    key: "study-languages.selectedPair",
    version: 1,
    validate: isSelectedLanguagePair,
    readLegacy(value) {
        return isSelectedLanguagePair(value) ? value : null;
    }
});
```

This keeps existing users' local settings when the app moves to versioned storage.

## Storage Backends

`createVersionedStorage()` accepts a small `StorageLike` interface, so it can use browser `localStorage`, `sessionStorage`, in-memory storage for tests, or future adapters.

```ts
const store = createVersionedStorage({
    key: "demo",
    version: 1,
    storage: createMemoryStorage()
});
```

Use `getBrowserStorage("local")` or `getBrowserStorage("session")` when an app needs explicit browser storage selection. If storage is unavailable, reads can still return the configured default value and writes fail quietly through the result API.

## Result API

Use `readResult()` when diagnostics or application flows need to know what happened:

```ts
const result = preferences.readResult();

if (result.status === "migrated") {
    console.info("Preferences were migrated", result.storedVersion, result.version);
}
```

Common statuses:

- `ready` - versioned data was read successfully;
- `empty` - nothing was stored;
- `migrated` - stored or legacy data was migrated successfully;
- `invalid` - data was present but did not pass validation;
- `future-version` - stored data is newer than this application understands;
- `unavailable` - the configured storage backend is unavailable;
- `error` - parsing, migration, validation, or storage access failed.

## Accessibility Notes

Storage is not an accessibility surface by itself. Components and application flows should announce user-visible effects with `StatusMessage`, `Toast`, `PageOutlet`, or `createActionAnnouncer()`.

For example, saving preferences can write to storage and then update a `StatusMessage` with `announcement: true`.
