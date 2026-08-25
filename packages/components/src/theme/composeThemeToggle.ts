import { createAnnouncer, type Announcer, type LiveRegionPoliteness } from "../../../core/src/live-region";
import { Button, type ButtonCompositionOptions, type ComposedButton } from "../button";
import {
    createElement,
    Icon,
    VisuallyHidden,
    type ComposedNode,
    type CompositionChild,
    type ElementAttributes
} from "../composition";
import {
    accessibleFirstEnglishMessages,
    getLocaleText,
    type LocaleTextProvider
} from "../localization";
import { applyResolvedTheme, getResolvedTheme, type ResolvedTheme } from "./theme";

/**
 * Visual presentation used by ThemeToggle().
 */
export type ThemeToggleDisplay = "button" | "switch";

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
    | "themeToggle.switchLabel"
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
    display?: ThemeToggleDisplay;
    toDarkLabel?: string;
    toLightLabel?: string;
    switchLabel?: string;
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

const SUN_ICON_PATHS = [
    "M12 4V2",
    "M12 22v-2",
    "M4.93 4.93 3.52 3.52",
    "m20.48 20.48-1.41-1.41",
    "M2 12h2",
    "M20 12h2",
    "m4.93 19.07-1.41 1.41",
    "m20.48 3.52-1.41 1.41",
    "M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8"
] as const;

const MOON_ICON_PATH = "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z";

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

function getThemeSwitchLabel(
    switchLabel: string | undefined,
    locale: ThemeToggleLocalization | null
): string {
    return switchLabel ?? getLocaleText(
        locale,
        "themeToggle.switchLabel",
        accessibleFirstEnglishMessages["themeToggle.switchLabel"]
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

function getThemeToggleAttributes(
    options: ThemeToggleOptions,
    display: ThemeToggleDisplay,
    theme: ResolvedTheme
): ElementAttributes {
    const attributes: ElementAttributes = {
        ...options.attributes,
        "data-af-theme-toggle": "",
        "data-af-theme-toggle-display": display,
        "data-af-theme-toggle-theme": theme
    };

    if (display === "switch") {
        attributes.role = "switch";
        attributes["aria-checked"] = String(theme === "dark");
        return attributes;
    }

    if (options.attributes?.role === undefined) {
        attributes.role = null;
    }

    attributes["aria-checked"] = null;

    return attributes;
}

function createSwitchContent(theme: ResolvedTheme, switchLabel: string): CompositionChild[] {
    const lightIcon = Icon({
        path: SUN_ICON_PATHS,
        variant: "outline",
        size: "1rem",
        attributes: {
            "data-af-theme-toggle-switch-icon": "light"
        }
    });

    const darkIcon = Icon({
        path: MOON_ICON_PATH,
        variant: "outline",
        size: "1rem",
        attributes: {
            "data-af-theme-toggle-switch-icon": "dark"
        }
    });

    return [
        createElement("span", {
            attributes: {
                "data-af-theme-toggle-switch-track": "",
                "aria-hidden": "true"
            },
            children: [
                lightIcon,
                darkIcon,
                createElement("span", {
                    attributes: {
                        "data-af-theme-toggle-switch-thumb": ""
                    }
                })
            ]
        }),
        VisuallyHidden({ text: switchLabel })
    ];
}

function getButtonOptions(
    options: ThemeToggleOptions,
    theme: ResolvedTheme,
    display: ThemeToggleDisplay,
    actionLabel: string,
    switchLabel: string,
    selected: boolean,
    onPress: NonNullable<ButtonCompositionOptions["onPress"]>
): ButtonCompositionOptions {
    const buttonOptions: ButtonCompositionOptions = {
        selected: display === "button" ? selected : false,
        attributes: getThemeToggleAttributes(options, display, theme),
        onPress
    };

    if (display === "switch") {
        buttonOptions.children = createSwitchContent(theme, switchLabel);
    } else {
        buttonOptions.text = actionLabel;
    }

    if (options.id !== undefined) buttonOptions.id = options.id;
    if (options.className !== undefined) buttonOptions.className = options.className;
    if (options.disabled !== undefined) buttonOptions.disabled = options.disabled;
    if (options.type !== undefined) buttonOptions.type = options.type;
    if (options.variant !== undefined) buttonOptions.variant = options.variant;
    if (options.size !== undefined) buttonOptions.size = options.size;

    if ("hint" in options) {
        buttonOptions.hint = options.hint ?? null;
    } else if (display === "switch") {
        buttonOptions.hint = actionLabel;
    }

    if (options.hintId !== undefined) buttonOptions.hintId = options.hintId;

    if (options.hintDisplay !== undefined) {
        buttonOptions.hintDisplay = options.hintDisplay;
    } else if (display === "switch") {
        buttonOptions.hintDisplay = buttonOptions.hint === null ? "none" : "tooltip";
    }

    if (options.hintAnnounceOnHover !== undefined) {
        buttonOptions.hintAnnounceOnHover = options.hintAnnounceOnHover;
    } else if (display === "switch") {
        buttonOptions.hintAnnounceOnHover = true;
    }

    return buttonOptions;
}

/**
 * Creates a theme toggle synchronized with the current page theme.
 */
export function ThemeToggle(options: ThemeToggleOptions = {}): ComposedThemeToggle {
    let composed!: ComposedThemeToggle;
    let currentOptions: ThemeToggleOptions = options;
    let target = options.target ?? document.documentElement;
    let display: ThemeToggleDisplay = options.display ?? "button";
    let toDarkLabel = options.toDarkLabel;
    let toLightLabel = options.toLightLabel;
    let switchLabel = options.switchLabel;
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

    function getCurrentButtonOptions(
        onPress: NonNullable<ButtonCompositionOptions["onPress"]>
    ): ButtonCompositionOptions {
        const theme = getResolvedTheme(target);

        return getButtonOptions(
            currentOptions,
            theme,
            display,
            getThemeLabel(theme, toDarkLabel, toLightLabel, locale),
            getThemeSwitchLabel(switchLabel, locale),
            isSelected(theme),
            onPress
        );
    }

    function syncButton(): void {
        button.update(getCurrentButtonOptions(() => {
            toggleTheme();
        }));
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

    const button = Button(getCurrentButtonOptions(() => {
        toggleTheme();
    }));

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

            if ("display" in nextOptions) display = nextOptions.display ?? "button";
            if ("toDarkLabel" in nextOptions) toDarkLabel = nextOptions.toDarkLabel;
            if ("toLightLabel" in nextOptions) toLightLabel = nextOptions.toLightLabel;
            if ("switchLabel" in nextOptions) switchLabel = nextOptions.switchLabel;
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