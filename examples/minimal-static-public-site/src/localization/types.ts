import type { AccessibleFirstMessageKey } from "../../../../packages/components/src";

export const supportedLocales = ["en", "uk"] as const;

export type AppLocale = typeof supportedLocales[number];

export type AppMessageKey =
    | "app.description"
    | "app.frameworkName"
    | "app.logoAlt"
    | "app.name"
    | "app.shortName"
    | "brand.tagline"
    | "footer.text"
    | "home.build.p1"
    | "home.build.p2"
    | "home.build.title"
    | "home.description"
    | "home.intro.p1"
    | "home.intro.p2"
    | "home.intro.title"
    | "home.next.p1"
    | "home.next.p2"
    | "home.next.title"
    | "home.title"
    | "shell.contentLabel"
    | "shell.skipLink";

export type TemplateMessageKey = AccessibleFirstMessageKey | AppMessageKey;
