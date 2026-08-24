import { createAnnouncer, type Announcer, type LiveRegionPoliteness } from "../../../core/src/live-region";
import { Button, type ButtonCompositionOptions, type ComposedButton } from "../button";
import type { ComposedNode } from "../composition";
import {
    accessibleFirstEnglishMessages,
    getLocaleText,
    type LocaleTextProvider
} from "../localization";
import { applyResolvedTheme, getResolvedTheme, type ResolvedTheme } from "./theme";

/**
 * Details emitted when ThemeToggle changes the page theme.
 */
export interface ThemeToggleChangeDetail {
    theme: ResolvedTheme;
    previousTheme: ResolvedTheme;
    target: HTMLElement;
}

/**
 * Announcement configuration for ThemeToggle changes.
 */
export type ThemeToggleAnnouncement =
    | boolean
    | string
    | ((detail: ThemeToggleChangeDetail) => string | null | undefined);

/**
 * Localized message keys used by ThemeToggle fallback text.
 */
export type ThemeToggleMessageKey =
    | "themeToggle.toDarkLabel"
    | "themeToggle.toLightLabel"
    | "themeToggle.darkAnnouncement"
    | "themeToggle.lightAnnouncement";

/**
 * Localization provider accepted by ThemeToggle.
 */
export type ThemeToggleLocalization = LocaleTextProvider<ThemeToggleMessageKey>;

/**
 * Called after ThemeToggle changes the page theme.
 */
export type ThemeToggleOnChange = (
    detail: ThemeToggleChangeDetail,
    toggle: ComposedThemeToggle
) => void;

/**
 * Options for ThemeToggle().
 */
export interface ThemeToggleOptions
    extends Omit<ButtonCompositionOptions, "text" | "children" | "onPress" | "selected" | "pressed"> {
    target?: HTMLElement | null;
    toDarkLabel?: string;
    toLightLabel?: string;
    locale?: ThemeToggleLocalization | null;
    selectedTheme?: ResolvedTheme | null;
    announcement?: ThemeToggleAnnouncement;
    announcementPoliteness?: LiveRegionPoliteness;
    onThemeChange?: ThemeToggleOnChange | null;
}

/**
 * Options accepted by ComposedThemeToggle.update().
 */
export interface ThemeToggleUpdateOptions extends Partial<ThemeToggleOptions> {}

/**
 * Theme toggle created by the composition API.
 */
export interface ComposedThemeToggle extends ComposedNode<HTMLButtonElement> {
    readonly element: HTMLButtonElement;
    readonly button: ComposedButton;
    getTheme(): ResolvedTheme;
    setTheme(theme: ResolvedTheme): void;
    toggleTheme(): ResolvedTheme;
    update(options: ThemeToggleUpdateOptions): void;
    destroy(): void;
}

function getThemeLabel(
    theme: ResolvedTheme,
    toDarkLabel: string | undefined,
    toLightLabel: string | undefined,
    locale: ThemeToggleLocalization | null
): string {
    return theme === "dark"
        ? toLightLabel ?? getLocaleText(
            locale,
            "themeToggle.toLightLabel",
            accessibleFirstEnglishMessages["themeToggle.toLightLabel"]
        )
        : toDarkLabel ?? getLocaleText(
            locale,
            "themeToggle.toDarkLabel",
            accessibleFirstEnglishMessages["themeToggle.toDarkLabel"]
        );
}

function getDefaultAnnouncement(
    theme: ResolvedTheme,
    locale: ThemeToggleLocalization | null
): string {
    const key: ThemeToggleMessageKey = theme === "dark"
        ? "themeToggle.darkAnnouncement"
        : "themeToggle.lightAnnouncement";

    return getLocaleText(locale, key, accessibleFirstEnglishMessages[key]);
}

function getButtonOptions(
    options: ThemeToggleOptions,
    text: string,
    selected: boolean,
    onPress: NonNullable<ButtonCompositionOptions["onPress"]>
): ButtonCompositionOptions {
    const buttonOptions: ButtonCompositionOptions = {
        text,
        selected,
        onPress
    };

    if (options.id !== undefined) buttonOptions.id = options.id;
    if (options.className !== undefined) buttonOptions.className = options.className;
    if (options.attributes !== undefined) buttonOptions.attributes = options.attributes;
    if (options.disabled !== undefined) buttonOptions.disabled = options.disabled;
    if (options.type !== undefined) buttonOptions.type = options.type;
    if (options.variant !== undefined) buttonOptions.variant = options.variant;
    if (options.size !== undefined) buttonOptions.size = options.size;
    if ("hint" in options) buttonOptions.hint = options.hint ?? null;
    if (options.hintId !== undefined) buttonOptions.hintId = options.hintId;
    if (options.hintDisplay !== undefined) buttonOptions.hintDisplay = options.hintDisplay;
    if (options.hintAnnounceOnHover !== undefined) {
        buttonOptions.hintAnnounceOnHover = options.hintAnnounceOnHover;
    }

    return buttonOptions;
}

/**
 * Creates a theme toggle button synchronized with the current page theme.
 */
export function ThemeToggle(options: ThemeToggleOptions = {}): ComposedThemeToggle {
    let composed!: ComposedThemeToggle;
    let currentOptions: ThemeToggleOptions = options;
    let target = options.target ?? document.documentElement;
    let toDarkLabel = options.toDarkLabel;
    let toLightLabel = options.toLightLabel;
    let locale: ThemeToggleLocalization | null = options.locale ?? null;
    let unsubscribeLocale: (() => void) | null = null;
    let selectedTheme: ResolvedTheme | null = "selectedTheme" in options
        ? options.selectedTheme ?? null
        : "dark";
    let announcement: ThemeToggleAnnouncement = options.announcement ?? true;
    let announcementPoliteness: LiveRegionPoliteness = options.announcementPoliteness ?? "polite";
    let onThemeChange = options.onThemeChange ?? null;
    let announcer: Announcer | null = null;

    function isSelected(theme: ResolvedTheme): boolean {
        return selectedTheme !== null && theme === selectedTheme;
    }

    function syncButton(): void {
        const theme = getResolvedTheme(target);

        button.update(getButtonOptions(
            currentOptions,
            getThemeLabel(theme, toDarkLabel, toLightLabel, locale),
            isSelected(theme),
            () => {
                toggleTheme();
            }
        ));
    }

    function getAnnouncementMessage(detail: ThemeToggleChangeDetail): string | null {
        if (announcement === false) return null;
        if (announcement === true) return getDefaultAnnouncement(detail.theme, locale);
        if (typeof announcement === "function") return announcement(detail) ?? null;
        return announcement;
    }

    function announceChange(detail: ThemeToggleChangeDetail): void {
        const message = getAnnouncementMessage(detail);

        if (!message) return;

        announcer ??= createAnnouncer();
        announcer.announce(message, {
            politeness: announcementPoliteness
        });
    }

    function setTheme(theme: ResolvedTheme): void {
        const previousTheme = getResolvedTheme(target);

        applyResolvedTheme(theme, target);
        syncButton();

        if (theme === previousTheme) return;

        const detail: ThemeToggleChangeDetail = {
            theme,
            previousTheme,
            target
        };

        announceChange(detail);
        onThemeChange?.(detail, composed);
    }

    function toggleTheme(): ResolvedTheme {
        const nextTheme: ResolvedTheme = getResolvedTheme(target) === "dark" ? "light" : "dark";

        setTheme(nextTheme);

        return nextTheme;
    }

    const button = Button(getButtonOptions(
        currentOptions,
        getThemeLabel(getResolvedTheme(target), toDarkLabel, toLightLabel, locale),
        isSelected(getResolvedTheme(target)),
        () => {
            toggleTheme();
        }
    ));

    function syncLocaleSubscription(): void {
        unsubscribeLocale?.();
        unsubscribeLocale = null;

        if (!locale?.subscribe) return;

        unsubscribeLocale = locale.subscribe(() => {
            syncButton();
        });
    }

    syncLocaleSubscription();

    const observer = new MutationObserver(syncButton);

    observer.observe(target, {
        attributes: true,
        attributeFilter: ["data-af-theme"]
    });

    composed = {
        element: button.element,
        button,
        getTheme: () => getResolvedTheme(target),
        setTheme,
        toggleTheme,

        update(nextOptions): void {
            currentOptions = {
                ...currentOptions,
                ...nextOptions
            };

            if ("target" in nextOptions) {
                target = nextOptions.target ?? document.documentElement;
                observer.disconnect();
                observer.observe(target, {
                    attributes: true,
                    attributeFilter: ["data-af-theme"]
                });
            }

            if ("toDarkLabel" in nextOptions) toDarkLabel = nextOptions.toDarkLabel;
            if ("toLightLabel" in nextOptions) toLightLabel = nextOptions.toLightLabel;
            if ("locale" in nextOptions) {
                locale = nextOptions.locale ?? null;
                syncLocaleSubscription();
            }
            if ("selectedTheme" in nextOptions) selectedTheme = nextOptions.selectedTheme ?? null;
            if ("announcement" in nextOptions) announcement = nextOptions.announcement ?? true;
            if (nextOptions.announcementPoliteness !== undefined) {
                announcementPoliteness = nextOptions.announcementPoliteness;
            }
            if ("onThemeChange" in nextOptions) onThemeChange = nextOptions.onThemeChange ?? null;

            syncButton();
        },

        destroy(): void {
            observer.disconnect();
            unsubscribeLocale?.();
            announcer?.destroy();
            button.destroy();
        }
    };

    return composed;
}
