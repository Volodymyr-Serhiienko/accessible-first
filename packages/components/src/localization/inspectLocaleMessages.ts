import type {
    LocaleCode,
    LocaleController,
    LocaleMessage,
    LocaleMessages,
    LocaleMessagesByLocale
} from "./createLocaleController";

/**
 * Severity used by localization diagnostics.
 */
export type LocaleDiagnosticsLevel = "info" | "warning" | "error";

/**
 * Localization area checked by diagnostics.
 */
export type LocaleDiagnosticsCategory = "locale" | "message";

/**
 * Overall localization diagnostics status.
 */
export type LocaleDiagnosticsStatus = "healthy" | "needs-attention" | "blocked";

/**
 * One localization diagnostics finding.
 */
export interface LocaleDiagnosticsIssue<
    TLocale extends LocaleCode = LocaleCode,
    TKey extends string = string
> {
    level: LocaleDiagnosticsLevel;
    category: LocaleDiagnosticsCategory;
    code: string;
    message: string;
    locale?: string;
    key?: TKey;
}

/**
 * Options for inspectLocaleMessages().
 */
export interface LocaleDiagnosticsOptions<
    TLocale extends LocaleCode = LocaleCode,
    TKey extends string = string
> {
    supportedLocales?: readonly TLocale[];
    fallbackLocale?: TLocale | null;
    currentLocale?: TLocale | string | null;
    messages?: LocaleMessagesByLocale<TKey>;
    requiredMessages?: readonly TKey[];
    requireSupportedLocales?: boolean;
    requireFallbackMessages?: boolean;
    requireLocaleMessages?: boolean;
    allowEmptyMessages?: boolean;
}

/**
 * Options for inspectLocaleController().
 */
export type LocaleControllerDiagnosticsOptions<
    TLocale extends LocaleCode = LocaleCode,
    TKey extends string = string
> = Omit<
    LocaleDiagnosticsOptions<TLocale, TKey>,
    "supportedLocales" | "fallbackLocale" | "currentLocale" | "messages"
>;

/**
 * Result returned by localization diagnostics.
 */
export interface LocaleDiagnosticsReport<
    TLocale extends LocaleCode = LocaleCode,
    TKey extends string = string
> {
    status: LocaleDiagnosticsStatus;
    issues: Array<LocaleDiagnosticsIssue<TLocale, TKey>>;
    localeCount: number;
    registeredLocaleCount: number;
    requiredMessageCount: number;
    errorCount: number;
    warningCount: number;
    infoCount: number;
}

function normalizeDiagnosticLocale(value: string | null | undefined): string | null {
    const normalized = value?.trim().toLowerCase() ?? "";

    return normalized.length > 0 ? normalized : null;
}

function getDiagnosticsStatus(
    errorCount: number,
    warningCount: number
): LocaleDiagnosticsStatus {
    if (errorCount > 0) return "blocked";
    if (warningCount > 0) return "needs-attention";

    return "healthy";
}

function createIssue<
    TLocale extends LocaleCode,
    TKey extends string
>(
    level: LocaleDiagnosticsLevel,
    category: LocaleDiagnosticsCategory,
    code: string,
    message: string,
    locale?: TLocale | string | null,
    key?: TKey
): LocaleDiagnosticsIssue<TLocale, TKey> {
    const issue: LocaleDiagnosticsIssue<TLocale, TKey> = {
        level,
        category,
        code,
        message
    };

    if (locale !== undefined && locale !== null) issue.locale = String(locale);
    if (key !== undefined) issue.key = key;

    return issue;
}

function createMessageMap<TKey extends string>(
    messages: LocaleMessagesByLocale<TKey> | undefined
): Map<string, LocaleMessages<TKey>> {
    const messageMap = new Map<string, LocaleMessages<TKey>>();

    for (const [locale, localeMessages] of Object.entries(messages ?? {}) as Array<[string, LocaleMessages<TKey>]>) {
        const normalized = normalizeDiagnosticLocale(locale);

        if (!normalized) continue;

        messageMap.set(normalized, {
            ...(messageMap.get(normalized) ?? {}),
            ...localeMessages
        });
    }

    return messageMap;
}

function hasOwnMessage<TKey extends string>(
    messages: LocaleMessages<TKey> | undefined,
    key: TKey
): boolean {
    return messages?.[key] !== undefined;
}

function getOwnMessage<TKey extends string>(
    messages: LocaleMessages<TKey> | undefined,
    key: TKey
): LocaleMessage | undefined {
    return messages?.[key];
}

/**
 * Inspects locale dictionaries for missing supported locales and required messages.
 */
export function inspectLocaleMessages<
    TLocale extends LocaleCode = LocaleCode,
    TKey extends string = string
>(
    options: LocaleDiagnosticsOptions<TLocale, TKey> = {}
): LocaleDiagnosticsReport<TLocale, TKey> {
    const issues: Array<LocaleDiagnosticsIssue<TLocale, TKey>> = [];
    const messageMap = createMessageMap(options.messages);
    const supportedLocales = options.supportedLocales
        ? [...options.supportedLocales]
        : Object.keys(options.messages ?? {}) as unknown as TLocale[];
    const normalizedSupportedLocales: Array<{ locale: TLocale; normalized: string }> = [];
    const supportedSet = new Set<string>();
    const requireSupportedLocales = options.requireSupportedLocales ?? true;
    const requiredMessages = [...new Set(options.requiredMessages ?? [])];
    const requireFallbackMessages = options.requireFallbackMessages ?? requiredMessages.length > 0;
    const requireLocaleMessages = options.requireLocaleMessages ?? requiredMessages.length > 0;
    const allowEmptyMessages = options.allowEmptyMessages ?? false;

    if (requireSupportedLocales && supportedLocales.length === 0) {
        issues.push(createIssue(
            "error",
            "locale",
            "locale.supported.empty",
            "At least one supported locale should be configured."
        ));
    }

    for (const locale of supportedLocales) {
        const normalized = normalizeDiagnosticLocale(locale);

        if (!normalized) {
            issues.push(createIssue(
                "error",
                "locale",
                "locale.supported.empty-code",
                "Supported locale codes must not be empty.",
                locale
            ));
            continue;
        }

        if (supportedSet.has(normalized)) {
            issues.push(createIssue(
                "warning",
                "locale",
                "locale.supported.duplicate",
                `Supported locale "${locale}" duplicates another locale after normalization.`,
                locale
            ));
            continue;
        }

        supportedSet.add(normalized);
        normalizedSupportedLocales.push({ locale, normalized });
    }

    const fallbackLocale = options.fallbackLocale ?? supportedLocales[0] ?? null;
    const normalizedFallback = normalizeDiagnosticLocale(fallbackLocale);

    if (fallbackLocale === null) {
        issues.push(createIssue(
            "error",
            "locale",
            "locale.fallback.missing",
            "A fallback locale should be configured."
        ));
    } else if (normalizedFallback && !supportedSet.has(normalizedFallback)) {
        issues.push(createIssue(
            "warning",
            "locale",
            "locale.fallback.unsupported",
            `Fallback locale "${fallbackLocale}" is not listed in supportedLocales.`,
            fallbackLocale
        ));
    }

    const normalizedCurrent = normalizeDiagnosticLocale(options.currentLocale ?? null);

    if (normalizedCurrent && supportedSet.size > 0 && !supportedSet.has(normalizedCurrent)) {
        issues.push(createIssue(
            "warning",
            "locale",
            "locale.current.unsupported",
            `Current locale "${options.currentLocale}" is not listed in supportedLocales.`,
            options.currentLocale ?? undefined
        ));
    }

    for (const messageLocale of messageMap.keys()) {
        if (supportedSet.size > 0 && !supportedSet.has(messageLocale)) {
            issues.push(createIssue(
                "warning",
                "locale",
                "locale.messages.unsupported",
                `Messages are registered for unsupported locale "${messageLocale}".`,
                messageLocale
            ));
        }
    }

    for (const { locale, normalized } of normalizedSupportedLocales) {
        const localeMessages = messageMap.get(normalized);
        const isFallbackLocale = normalizedFallback !== null && normalized === normalizedFallback;
        const shouldCheckMessages = isFallbackLocale ? requireFallbackMessages : requireLocaleMessages;

        if (!shouldCheckMessages) continue;

        if (!localeMessages || Object.keys(localeMessages).length === 0) {
            issues.push(createIssue(
                isFallbackLocale ? "error" : "warning",
                "locale",
                "locale.messages.missing",
                `Supported locale "${locale}" has no registered messages.`,
                locale
            ));
        }

        for (const key of requiredMessages) {
            const ownMessage = getOwnMessage(localeMessages, key);

            if (!hasOwnMessage(localeMessages, key)) {
                issues.push(createIssue(
                    isFallbackLocale ? "error" : "warning",
                    "message",
                    "locale.message.missing",
                    `Locale "${locale}" is missing required message "${key}".`,
                    locale,
                    key
                ));
                continue;
            }

            if (!allowEmptyMessages && typeof ownMessage === "string" && !ownMessage.trim()) {
                issues.push(createIssue(
                    isFallbackLocale ? "error" : "warning",
                    "message",
                    "locale.message.empty",
                    `Locale "${locale}" has an empty message for "${key}".`,
                    locale,
                    key
                ));
            }
        }
    }

    const errorCount = issues.filter((issue) => issue.level === "error").length;
    const warningCount = issues.filter((issue) => issue.level === "warning").length;
    const infoCount = issues.filter((issue) => issue.level === "info").length;

    return {
        status: getDiagnosticsStatus(errorCount, warningCount),
        issues,
        localeCount: normalizedSupportedLocales.length,
        registeredLocaleCount: messageMap.size,
        requiredMessageCount: requiredMessages.length,
        errorCount,
        warningCount,
        infoCount
    };
}

/**
 * Inspects the dictionaries currently registered in a LocaleController.
 */
export function inspectLocaleController<
    TLocale extends LocaleCode = LocaleCode,
    TKey extends string = string
>(
    controller: LocaleController<TLocale, TKey>,
    options: LocaleControllerDiagnosticsOptions<TLocale, TKey> = {}
): LocaleDiagnosticsReport<TLocale, TKey> {
    const messages: LocaleMessagesByLocale<TKey> = {};

    for (const locale of controller.getRegisteredLocales()) {
        messages[locale] = controller.getMessages(locale);
    }

    return inspectLocaleMessages({
        ...options,
        supportedLocales: controller.supportedLocales,
        fallbackLocale: controller.fallbackLocale,
        currentLocale: controller.getLocale(),
        messages
    });
}

/**
 * Logs a localization diagnostics report to the developer console.
 */
export function logLocaleDiagnostics(report: LocaleDiagnosticsReport): void {
    console.groupCollapsed("Accessible First Localization Report");
    console.log(`Status: ${report.status}`);
    console.log(`Locales: ${report.localeCount}`);
    console.log(`Registered locales: ${report.registeredLocaleCount}`);
    console.log(`Required messages: ${report.requiredMessageCount}`);
    console.log(`Errors: ${report.errorCount}`);
    console.log(`Warnings: ${report.warningCount}`);
    console.log(`Info: ${report.infoCount}`);

    for (const issue of report.issues) {
        const locale = issue.locale ? ` locale=${issue.locale}` : "";
        const key = issue.key ? ` key=${issue.key}` : "";
        const line = `[${issue.level}] ${issue.category}/${issue.code}:${locale}${key} ${issue.message}`;

        if (issue.level === "error") console.error(line);
        else if (issue.level === "warning") console.warn(line);
        else console.info(line);
    }

    console.groupEnd();
}