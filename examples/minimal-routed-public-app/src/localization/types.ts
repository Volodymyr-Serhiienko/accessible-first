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
    | "home.gives.p1"
    | "home.gives.p2"
    | "home.gives.title"
    | "home.start.p1"
    | "home.start.p2"
    | "home.start.title"
    | "navigation.returnLink"
    | "route.loadedAnnouncement"
    | "routes.about.description"
    | "routes.about.keywords"
    | "routes.about.label"
    | "routes.about.title"
    | "routes.home.description"
    | "routes.home.keywords"
    | "routes.home.label"
    | "routes.home.title"
    | "shell.contentLabel"
    | "shell.navigationLabel"
    | "shell.skipLink"
    | "template.about.p1"
    | "template.about.p2"
    | "template.about.title"
    | "template.grow.p1"
    | "template.grow.p2"
    | "template.grow.title";

export type TemplateMessageKey = AccessibleFirstMessageKey | AppMessageKey;
