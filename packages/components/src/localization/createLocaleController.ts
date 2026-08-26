import {
    accessibleFirstEnglishMessages,
    type AccessibleFirstMessageKey
} from "./messages";

/**
 * Supported locale code, such as "en", "uk", "ru", or "en-US".
 */
export type LocaleCode = string;

/**
 * Values accepted by localized messages.
 */
export type LocaleMessageParam = string | number | boolean | null | undefined;

/**
 * Named params passed to localized message templates.
 */
export type LocaleMessageParams = Record<string, LocaleMessageParam>;

/**
 * Localized message value.
 */
export type LocaleMessage =
    | string
    | ((params: LocaleMessageParams) => string);

/**
 * Message dictionary for one locale.
 */
export type LocaleMessages<TKey extends string = string> = Partial<Record<TKey, LocaleMessage>>;

/**
 * Message dictionaries keyed by locale.
 */
export type LocaleMessagesByLocale<TKey extends string = string> = Record<string, LocaleMessages<TKey>>;

/**
 * Minimal localized text provider accepted by Accessible First components.
 */
export interface LocaleTextProvider<TKey extends string = AccessibleFirstMessageKey> {
    t(key: TKey, params?: LocaleMessageParams): string;
    subscribe?(listener: () => void): () => void;
}

/**
 * Returns localized text from a provider, or the supplied fallback when no translation exists.
 */
export function getLocaleText<TKey extends string>(
    locale: LocaleTextProvider<TKey> | null | undefined,
    key: TKey,
    fallback: string,
    params?: LocaleMessageParams
): string {
    return locale?.t(key, params) ?? fallback;
}

/**
 * Text direction resolved from a locale.
 */
export type LocaleDirection = "ltr" | "rtl" | "auto";

/**
 * Resolves text direction for a locale.
 */
export type LocaleDirectionResolver<TLocale extends LocaleCode = LocaleCode> = (
    locale: TLocale | string
) => LocaleDirection;

/**
 * Minimal browser language source used by locale detection.
 */
export interface LocaleNavigatorSource {
    readonly language?: string;
    readonly languages?: readonly string[];
}

/**
 * Source used for a locale change notification.
 */
export type LocaleChangeSource =
    | "initial"
    | "programmatic"
    | "storage"
    | "system";

/**
 * Details emitted when the active locale changes.
 */
export interface LocaleChangeDetail<TLocale extends LocaleCode = LocaleCode> {
    locale: TLocale;
    previousLocale: TLocale;
    source: LocaleChangeSource;
}

/**
 * Called when LocaleController changes locale.
 */
export type LocaleChangeListener<TLocale extends LocaleCode = LocaleCode> = (
    detail: LocaleChangeDetail<TLocale>
) => void;

/**
 * Options for LocaleController.setLocale().
 */
export interface LocaleSetOptions {
    persist?: boolean;
    syncDocumentLanguage?: boolean;
    syncDocumentDirection?: boolean;
    source?: LocaleChangeSource;
}

/**
 * Options for createLocaleController().
 */
export interface LocaleControllerOptions<
    TLocale extends LocaleCode = LocaleCode,
    TKey extends string = AccessibleFirstMessageKey
> {
    supportedLocales?: readonly TLocale[];
    fallbackLocale?: TLocale;
    initialLocale?: string | null;
    storageKey?: string | null;
    storage?: Storage | null;
    messages?: LocaleMessagesByLocale<TKey>;
    documentElement?: HTMLElement | null;
    syncDocumentLanguage?: boolean;
    syncDocumentDirection?: boolean;
    getDirection?: LocaleDirectionResolver<TLocale>;
    navigatorSource?: LocaleNavigatorSource | null;
}

/**
 * Runtime locale controller for Accessible First applications.
 */
export interface LocaleController<
    TLocale extends LocaleCode = LocaleCode,
    TKey extends string = AccessibleFirstMessageKey
> {
    readonly supportedLocales: readonly TLocale[];
    readonly fallbackLocale: TLocale;
    getLocale(): TLocale;
    getSystemCandidates(): string[];
    resolve(candidates?: string | readonly string[] | null): TLocale;
    setLocale(locale: string, options?: LocaleSetOptions): TLocale;
    /**
     * Registers or overrides messages for one locale.
     */
    setMessages(locale: string, messages: LocaleMessages<TKey>): void;
    /**
     * Returns locale codes that currently have registered message dictionaries.
     */
    getRegisteredLocales(): string[];
    /**
     * Returns a shallow copy of the messages registered for one locale.
     */
    getMessages(locale?: string | null): LocaleMessages<TKey>;
    /**
     * Returns the text direction for a locale.
     */
    getDirection(locale?: string | null): LocaleDirection;
    has(key: TKey, locale?: string | null): boolean;
    t(key: TKey, params?: LocaleMessageParams): string;
    subscribe(listener: LocaleChangeListener<TLocale>): () => void;
    destroy(): void;
}

const DEFAULT_STORAGE_KEY = "af.locale";

const RTL_LOCALE_LANGUAGES = new Set([
    "ar",
    "dv",
    "fa",
    "he",
    "ps",
    "sd",
    "ug",
    "ur",
    "yi"
]);

type LocaleMessageRegistry = Record<string, LocaleMessage>;

function getDefaultNavigatorSource(): LocaleNavigatorSource | null {
    return typeof navigator === "undefined" ? null : navigator;
}

function getDefaultStorage(): Storage | null {
    if (typeof window === "undefined") return null;

    try {
        return window.localStorage;
    } catch {
        return null;
    }
}

function normalizeLocale(value: string | null | undefined): string | null {
    const normalized = value?.trim().toLowerCase() ?? "";

    return normalized.length > 0 ? normalized : null;
}

function getLocaleLanguage(value: string): string {
    return value.split("-")[0] ?? value;
}

function toCandidateArray(value: string | readonly string[] | null | undefined): string[] {
    if (value === null || value === undefined) return [];
    if (typeof value === "string") return [value];

    return [...value];
}

/**
 * Returns the default writing direction for a locale code.
 */
export function getLocaleDirection(locale: string | null | undefined): LocaleDirection {
    const normalized = normalizeLocale(locale);

    if (!normalized) return "ltr";

    return RTL_LOCALE_LANGUAGES.has(getLocaleLanguage(normalized)) ? "rtl" : "ltr";
}

/**
 * Returns browser/system language candidates in priority order.
 */
export function getSystemLocaleCandidates(
    source: LocaleNavigatorSource | null = getDefaultNavigatorSource()
): string[] {
    if (!source) return [];

    const candidates: string[] = [];

    for (const language of source.languages ?? []) {
        if (language.trim()) candidates.push(language);
    }

    if (source.language?.trim()) {
        candidates.push(source.language);
    }

    return [...new Set(candidates)];
}

/**
 * Resolves locale candidates against a supported locale list.
 */
export function resolveSupportedLocale<TLocale extends LocaleCode>(
    candidates: string | readonly string[] | null | undefined,
    supportedLocales: readonly TLocale[],
    fallbackLocale: TLocale
): TLocale {
    const normalizedSupported = supportedLocales.map((locale) => ({
        locale,
        normalized: normalizeLocale(locale) ?? ""
    }));

    for (const candidate of toCandidateArray(candidates)) {
        const normalizedCandidate = normalizeLocale(candidate);

        if (!normalizedCandidate) continue;

        const exact = normalizedSupported.find((item) => item.normalized === normalizedCandidate);

        if (exact) return exact.locale;

        const candidateLanguage = getLocaleLanguage(normalizedCandidate);
        const languageMatch = normalizedSupported.find((item) => {
            return getLocaleLanguage(item.normalized) === candidateLanguage;
        });

        if (languageMatch) return languageMatch.locale;
    }

    return fallbackLocale;
}

function readStoredLocale(storage: Storage | null, storageKey: string | null): string | null {
    if (!storage || !storageKey) return null;

    try {
        return storage.getItem(storageKey);
    } catch {
        return null;
    }
}

function writeStoredLocale(
    storage: Storage | null,
    storageKey: string | null,
    locale: string
): void {
    if (!storage || !storageKey) return;

    try {
        storage.setItem(storageKey, locale);
    } catch {
        // Storage can be unavailable in private mode or restricted embeds.
    }
}

function formatMessage(message: LocaleMessage, params: LocaleMessageParams = {}): string {
    if (typeof message === "function") return message(params);

    return message.replace(/\{([a-zA-Z0-9_.-]+)\}/g, (match, key: string) => {
        const value = params[key];

        return value === null || value === undefined ? match : String(value);
    });
}

function toMessageRegistry<TKey extends string>(
    messages: LocaleMessages<TKey>
): LocaleMessageRegistry {
    const registry: LocaleMessageRegistry = {};

    for (const [key, message] of Object.entries(messages) as Array<[string, LocaleMessage | undefined]>) {
        if (message !== undefined) registry[key] = message;
    }

    return registry;
}

function mergeMessageRegistry<TKey extends string>(
    current: LocaleMessageRegistry,
    nextMessages: LocaleMessages<TKey>
): LocaleMessageRegistry {
    return {
        ...current,
        ...toMessageRegistry(nextMessages)
    };
}

function createInitialMessages<TKey extends string>(
    messages: LocaleMessagesByLocale<TKey> | undefined
): Map<string, LocaleMessageRegistry> {
    const registry = new Map<string, LocaleMessageRegistry>();

    registry.set("en", toMessageRegistry(accessibleFirstEnglishMessages));

    for (const [locale, localeMessages] of Object.entries(messages ?? {})) {
        const normalized = normalizeLocale(locale);

        if (!normalized) continue;

        registry.set(
            normalized,
            mergeMessageRegistry(registry.get(normalized) ?? {}, localeMessages)
        );
    }

    return registry;
}

function getDefaultDocumentElement(element: HTMLElement | null): HTMLElement | null {
    return element ?? (typeof document === "undefined" ? null : document.documentElement);
}

function syncDocumentLanguage(
    element: HTMLElement | null,
    locale: string,
    enabled: boolean
): void {
    if (!enabled) return;

    const target = getDefaultDocumentElement(element);

    if (!target) return;

    target.lang = locale;
}

function syncDocumentDirection(
    element: HTMLElement | null,
    direction: LocaleDirection,
    enabled: boolean
): void {
    if (!enabled) return;

    const target = getDefaultDocumentElement(element);

    if (!target) return;

    target.dir = direction;
}

/**
 * Creates a locale controller for framework service text and app-level language state.
 */
export function createLocaleController<
    TLocale extends LocaleCode = "en",
    TKey extends string = AccessibleFirstMessageKey
>(
    options: LocaleControllerOptions<TLocale, TKey> = {}
): LocaleController<TLocale, TKey | AccessibleFirstMessageKey> {
    const defaultLocale = (options.fallbackLocale ?? "en") as unknown as TLocale;
    const supportedLocales: readonly TLocale[] = options.supportedLocales ?? [defaultLocale];
    const fallbackLocale: TLocale = options.fallbackLocale ?? supportedLocales[0] ?? defaultLocale;
    const storageKey = options.storageKey === undefined ? DEFAULT_STORAGE_KEY : options.storageKey;
    const storage = options.storage === undefined ? getDefaultStorage() : options.storage;
    const syncLanguage = options.syncDocumentLanguage ?? true;
    const syncDirection = options.syncDocumentDirection ?? true;
    const resolveDirection = options.getDirection ?? getLocaleDirection;
    const navigatorSource = options.navigatorSource === undefined
        ? getDefaultNavigatorSource()
        : options.navigatorSource;

    const messageRegistry = createInitialMessages<TKey>(options.messages);
    const listeners = new Set<LocaleChangeListener<TLocale>>();

    const storedLocale = readStoredLocale(storage, storageKey);
    const initialLocale = resolveSupportedLocale(
        options.initialLocale
            ?? storedLocale
            ?? getSystemLocaleCandidates(navigatorSource),
        supportedLocales,
        fallbackLocale
    );

    let currentLocale = initialLocale;
    let destroyed = false;

    syncDocumentLanguage(options.documentElement ?? null, currentLocale, syncLanguage);
    syncDocumentDirection(options.documentElement ?? null, resolveDirection(currentLocale), syncDirection);

    function notify(previousLocale: TLocale, source: LocaleChangeSource): void {
        const detail: LocaleChangeDetail<TLocale> = {
            locale: currentLocale,
            previousLocale,
            source
        };

        for (const listener of listeners) {
            listener(detail);
        }
    }

    function getMessage(locale: string, key: TKey | AccessibleFirstMessageKey): LocaleMessage | null {
        const normalized = normalizeLocale(locale);

        if (!normalized) return null;

        return messageRegistry.get(normalized)?.[key] ?? null;
    }

    return {
        supportedLocales,
        fallbackLocale,

        getLocale(): TLocale {
            return currentLocale;
        },

        getSystemCandidates(): string[] {
            return getSystemLocaleCandidates(navigatorSource);
        },

        resolve(candidates): TLocale {
            return resolveSupportedLocale(candidates, supportedLocales, fallbackLocale);
        },

        setLocale(locale, setOptions = {}): TLocale {
            if (destroyed) return currentLocale;

            const nextLocale = resolveSupportedLocale(locale, supportedLocales, fallbackLocale);
            const previousLocale = currentLocale;

            currentLocale = nextLocale;

            if (setOptions.persist ?? true) {
                writeStoredLocale(storage, storageKey, currentLocale);
            }

            syncDocumentLanguage(
                options.documentElement ?? null,
                currentLocale,
                setOptions.syncDocumentLanguage ?? syncLanguage
            );

            syncDocumentDirection(
                options.documentElement ?? null,
                resolveDirection(currentLocale),
                setOptions.syncDocumentDirection ?? syncDirection
            );

            if (previousLocale !== currentLocale) {
                notify(previousLocale, setOptions.source ?? "programmatic");
            }

            return currentLocale;
        },

        setMessages(locale, localeMessages): void {
            const normalized = normalizeLocale(locale);

            if (!normalized) return;

            messageRegistry.set(
                normalized,
                mergeMessageRegistry(messageRegistry.get(normalized) ?? {}, localeMessages)
            );
        },

        getRegisteredLocales(): string[] {
            return [...messageRegistry.keys()];
        },

        getMessages(locale = currentLocale): LocaleMessages<TKey | AccessibleFirstMessageKey> {
            const normalized = normalizeLocale(locale ?? currentLocale);

            if (!normalized) return {};

            return { ...(messageRegistry.get(normalized) ?? {}) } as LocaleMessages<TKey | AccessibleFirstMessageKey>;
        },

        getDirection(locale = currentLocale): LocaleDirection {
            return resolveDirection(locale ?? currentLocale);
        },

        has(key, locale = currentLocale): boolean {
            return getMessage(locale ?? currentLocale, key) !== null
                || getMessage(fallbackLocale, key) !== null
                || getMessage("en", key) !== null;
        },

        t(key, params = {}): string {
            const message = getMessage(currentLocale, key)
                ?? getMessage(fallbackLocale, key)
                ?? getMessage("en", key);

            return message ? formatMessage(message, params) : key;
        },

        subscribe(listener): () => void {
            if (destroyed) return () => undefined;

            listeners.add(listener);

            return () => {
                listeners.delete(listener);
            };
        },

        destroy(): void {
            destroyed = true;
            listeners.clear();
        }
    };
}
