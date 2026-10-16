import { runCleanups } from "../../../core/src/events";
import type { LocaleTextProvider } from "./createLocaleController";

/** @internal Owns one replaceable locale subscription and rejects obsolete callbacks. */
export function createLocaleSubscription(onChange: () => void) {
    let unsubscribe: (() => void) | null = null;
    let destroyed = false;
    let revision = 0;
    return {
        replace(locale: Pick<LocaleTextProvider<string>, "subscribe"> | null | undefined): void {
            if (destroyed) return;
            const current = ++revision;
            const previous = unsubscribe;
            unsubscribe = null;
            runCleanups([
                () => previous?.(),
                () => {
                    if (destroyed || current !== revision || !locale?.subscribe) return;
                    const next = locale.subscribe(() => {
                        if (!destroyed && current === revision) onChange();
                    });
                    if (destroyed || current !== revision) next();
                    else unsubscribe = next;
                }
            ]);
        },
        destroy(): void {
            if (destroyed) return;
            destroyed = true;
            revision += 1;
            const previous = unsubscribe;
            unsubscribe = null;
            previous?.();
        }
    };
}
