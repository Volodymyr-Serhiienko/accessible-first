import type {
    LocaleChangeDetail,
    LocaleChangeSource,
    LocaleCode
} from "./createLocaleController";

/**
 * Minimal locale controller surface required by createLocaleRefresh().
 */
export interface LocaleRefreshLocale<TLocale extends LocaleCode = LocaleCode> {
    getLocale(): TLocale;
    subscribe(listener: (detail: LocaleChangeDetail<TLocale>) => void): () => void;
}

/**
 * Scheduling strategy used for locale-driven refresh callbacks.
 */
export type LocaleRefreshSchedule = "animation-frame" | "microtask" | "sync";

/**
 * Context passed to a locale refresh callback.
 */
export interface LocaleRefreshContext<TLocale extends LocaleCode = LocaleCode> {
    locale: TLocale;
    previousLocale: TLocale | null;
    source: LocaleChangeSource;
}

/**
 * Called when app-owned localized UI should be refreshed.
 */
export type LocaleRefreshHandler<TLocale extends LocaleCode = LocaleCode> = (
    context: LocaleRefreshContext<TLocale>
) => void;

/**
 * Options for createLocaleRefresh().
 */
export interface LocaleRefreshOptions<TLocale extends LocaleCode = LocaleCode> {
    locale: LocaleRefreshLocale<TLocale>;
    refresh: LocaleRefreshHandler<TLocale>;
    schedule?: LocaleRefreshSchedule;
    immediate?: boolean;
}

/**
 * Controller returned by createLocaleRefresh().
 */
export interface LocaleRefreshController {
    refresh(): void;
    destroy(): void;
}

function getFallbackSource(): LocaleChangeSource {
    return "programmatic";
}

/**
 * Subscribes app-owned rendering code to locale changes with optional scheduling.
 */
export function createLocaleRefresh<TLocale extends LocaleCode = LocaleCode>(
    options: LocaleRefreshOptions<TLocale>
): LocaleRefreshController {
    let destroyed = false;
    let pending = false;
    let animationFrame: number | null = null;
    let nextContext: LocaleRefreshContext<TLocale> = {
        locale: options.locale.getLocale(),
        previousLocale: null,
        source: getFallbackSource()
    };

    function cancelAnimationFrameRefresh(): void {
        if (animationFrame === null || typeof window === "undefined") return;

        window.cancelAnimationFrame(animationFrame);
        animationFrame = null;
    }

    function runRefresh(): void {
        pending = false;
        animationFrame = null;

        if (destroyed) return;

        options.refresh(nextContext);
    }

    function scheduleRefresh(context: LocaleRefreshContext<TLocale>): void {
        nextContext = context;

        if (options.schedule === "sync") {
            cancelAnimationFrameRefresh();
            pending = false;
            runRefresh();
            return;
        }

        if (pending) return;

        pending = true;

        if (options.schedule === "microtask") {
            queueMicrotask(runRefresh);
            return;
        }

        if (typeof window !== "undefined") {
            animationFrame = window.requestAnimationFrame(runRefresh);
            return;
        }

        setTimeout(runRefresh, 0);
    }

    const unsubscribe = options.locale.subscribe((detail) => {
        scheduleRefresh({
            locale: detail.locale,
            previousLocale: detail.previousLocale,
            source: detail.source
        });
    });

    if (options.immediate) {
        scheduleRefresh(nextContext);
    }

    return {
        refresh(): void {
            scheduleRefresh({
                locale: options.locale.getLocale(),
                previousLocale: null,
                source: getFallbackSource()
            });
        },

        destroy(): void {
            if (destroyed) return;

            destroyed = true;
            cancelAnimationFrameRefresh();
            unsubscribe();
        }
    };
}