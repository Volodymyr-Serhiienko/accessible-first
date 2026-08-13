/**
 * Theme preference accepted by Accessible First page/theme helpers.
 * "system" resolves from the user's operating system color-scheme preference.
 */
export type ThemePreference = "system" | "light" | "dark";

/**
 * Concrete theme currently applied to the page.
 */
export type ResolvedTheme = "light" | "dark";

function getThemeTarget(target?: HTMLElement | null): HTMLElement {
    return target ?? document.documentElement;
}

/**
 * Returns the user's current system color-scheme preference.
 */
export function getSystemTheme(): ResolvedTheme {
    if (typeof window.matchMedia !== "function") {
        return "light";
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * Resolves "system" to a concrete light/dark theme.
 */
export function resolveThemePreference(preference: ThemePreference): ResolvedTheme {
    return preference === "system" ? getSystemTheme() : preference;
}

/**
 * Reads the currently applied Accessible First theme.
 */
export function getResolvedTheme(target?: HTMLElement | null): ResolvedTheme {
    return getThemeTarget(target).getAttribute("data-af-theme") === "dark" ? "dark" : "light";
}

/**
 * Applies a concrete light/dark theme to the target element.
 */
export function applyResolvedTheme(
    theme: ResolvedTheme,
    target?: HTMLElement | null
): void {
    const themeTarget = getThemeTarget(target);

    if (theme === "dark") {
        themeTarget.setAttribute("data-af-theme", "dark");
        return;
    }

    themeTarget.removeAttribute("data-af-theme");
}

/**
 * Applies a theme preference and returns the concrete resolved theme.
 */
export function applyThemePreference(
    preference: ThemePreference,
    target?: HTMLElement | null
): ResolvedTheme {
    const resolvedTheme = resolveThemePreference(preference);

    applyResolvedTheme(resolvedTheme, target);

    return resolvedTheme;
}

/**
 * Toggles the target between light and dark themes.
 */
export function toggleResolvedTheme(target?: HTMLElement | null): ResolvedTheme {
    const nextTheme: ResolvedTheme = getResolvedTheme(target) === "dark" ? "light" : "dark";

    applyResolvedTheme(nextTheme, target);

    return nextTheme;
}
