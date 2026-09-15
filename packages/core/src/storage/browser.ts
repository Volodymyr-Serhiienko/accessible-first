import type { StorageLike } from "./types";

/** Browser storage backend kind. */
export type BrowserStorageKind = "local" | "session";

/** Returns browser localStorage or sessionStorage safely. */
export function getBrowserStorage(
    kind: BrowserStorageKind = "local"
): StorageLike | null {
    if (typeof window === "undefined") return null;

    try {
        return kind === "session" ? window.sessionStorage : window.localStorage;
    } catch {
        return null;
    }
}
