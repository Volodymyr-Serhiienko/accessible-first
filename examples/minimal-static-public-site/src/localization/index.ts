import {
    createAppLocalization,
    type LanguageSelectItem,
    type LocaleMessageParams,
    type LocaleMessagesByLocale
} from "../../../../packages/components/src";
import { enAppMessages } from "./locales/en";
import { ukAppMessages, ukFrameworkMessages } from "./locales/uk";
import {
    supportedLocales,
    type AppLocale,
    type AppMessageKey,
    type TemplateMessageKey
} from "./types";

const messages = {
    en: enAppMessages,
    uk: {
        ...ukFrameworkMessages,
        ...ukAppMessages
    }
} satisfies LocaleMessagesByLocale<TemplateMessageKey>;

export const appLocalization = createAppLocalization<AppLocale, TemplateMessageKey>({
    supportedLocales,
    fallbackLocale: "en",
    storageKey: "minimal-static-public-site.locale",
    messages
});

export const languageItems: readonly LanguageSelectItem<AppLocale>[] = [
    { locale: "en", label: "English" },
    { locale: "uk", label: "Українська" }
];

export function t(key: AppMessageKey, params?: LocaleMessageParams): string {
    return appLocalization.t(key, params);
}

export type {
    AppLocale,
    AppMessageKey,
    TemplateMessageKey
};
