/**
 * Text direction values accepted by the web app manifest.
 */
export type WebAppManifestDirection = "ltr" | "rtl" | "auto";

/**
 * Display modes for an installed or launched web app.
 */
export type WebAppManifestDisplay =
    | "fullscreen"
    | "standalone"
    | "minimal-ui"
    | "browser"
    | (string & {});

/**
 * Orientation values accepted by the web app manifest.
 */
export type WebAppManifestOrientation =
    | "any"
    | "natural"
    | "landscape"
    | "portrait"
    | "portrait-primary"
    | "portrait-secondary"
    | "landscape-primary"
    | "landscape-secondary"
    | (string & {});

/**
 * JSON-compatible value accepted in custom manifest extras.
 */
export type WebAppManifestJsonValue =
    | string
    | number
    | boolean
    | null
    | WebAppManifestJsonValue[]
    | { [key: string]: WebAppManifestJsonValue };

/**
 * Image resource used by manifest icons, shortcuts, screenshots, and related members.
 */
export interface WebAppManifestImageResourceOptions {
    src: string | URL;
    sizes?: string;
    type?: string;
    purpose?: string;
    label?: string;
    formFactor?: string;
}

/**
 * Shortcut shown by supporting platforms for common app actions.
 */
export interface WebAppManifestShortcutOptions {
    name: string;
    shortName?: string;
    description?: string;
    url: string | URL;
    icons?: readonly WebAppManifestImageResourceOptions[];
}

/**
 * Options for createWebAppManifest().
 */
export interface WebAppManifestOptions {
    name: string;
    shortName?: string | null;
    description?: string | null;
    lang?: string | null;
    dir?: WebAppManifestDirection | null;
    id?: string | null;
    startUrl?: string | URL | null;
    scope?: string | URL | null;
    display?: WebAppManifestDisplay | null;
    displayOverride?: readonly WebAppManifestDisplay[] | null;
    orientation?: WebAppManifestOrientation | null;
    themeColor?: string | null;
    backgroundColor?: string | null;
    categories?: readonly string[] | null;
    icons?: readonly WebAppManifestImageResourceOptions[] | null;
    shortcuts?: readonly WebAppManifestShortcutOptions[] | null;
    extras?: Record<string, WebAppManifestJsonValue> | null;
}

/**
 * Plain manifest object returned by createWebAppManifest().
 *
 * Known fields are generated from typed options, while extra fields remain
 * available for newer platform features without changing the helper API.
 */
export interface WebAppManifest {
    [member: string]: unknown;
    name: string;
}

function toManifestUrl(value: string | URL): string {
    return typeof value === "string" ? value : value.toString();
}

function setManifestValue(
    manifest: WebAppManifest,
    member: string,
    value: unknown
): void {
    if (value !== null && value !== undefined) {
        manifest[member] = value;
    }
}

function createImageResource(options: WebAppManifestImageResourceOptions): Record<string, string> {
    const resource: Record<string, string> = {
        src: toManifestUrl(options.src)
    };

    if (options.sizes !== undefined) resource.sizes = options.sizes;
    if (options.type !== undefined) resource.type = options.type;
    if (options.purpose !== undefined) resource.purpose = options.purpose;
    if (options.label !== undefined) resource.label = options.label;
    if (options.formFactor !== undefined) resource.form_factor = options.formFactor;

    return resource;
}

function createShortcut(options: WebAppManifestShortcutOptions): Record<string, unknown> {
    const shortcut: Record<string, unknown> = {
        name: options.name,
        url: toManifestUrl(options.url)
    };

    if (options.shortName !== undefined) shortcut.short_name = options.shortName;
    if (options.description !== undefined) shortcut.description = options.description;
    if (options.icons !== undefined) shortcut.icons = options.icons.map(createImageResource);

    return shortcut;
}

/**
 * Severity level for web app manifest diagnostics.
 */
export type WebAppManifestDiagnosticsLevel = "info" | "warning" | "error";

/**
 * Manifest area checked by diagnostics.
 */
export type WebAppManifestDiagnosticsCategory =
    | "identity"
    | "launch"
    | "display"
    | "color"
    | "icon"
    | "shortcut";

/**
 * Overall web app manifest diagnostics status.
 */
export type WebAppManifestDiagnosticsStatus = "healthy" | "needs-attention" | "blocked";

/**
 * One issue found by inspectWebAppManifest().
 */
export interface WebAppManifestDiagnosticsIssue {
    level: WebAppManifestDiagnosticsLevel;
    category: WebAppManifestDiagnosticsCategory;
    code: string;
    message: string;
    member?: string;
}

/**
 * Options for stricter web app manifest diagnostics.
 */
export interface WebAppManifestDiagnosticsOptions {
    requireShortName?: boolean;
    requireDescription?: boolean;
    requireStartUrl?: boolean;
    requireDisplay?: boolean;
    requireIcons?: boolean;
    requireMaskableIcon?: boolean;
    requireThemeColor?: boolean;
    requireBackgroundColor?: boolean;
}

/**
 * Report returned by inspectWebAppManifest().
 */
export interface WebAppManifestDiagnosticsReport {
    status: WebAppManifestDiagnosticsStatus;
    issues: WebAppManifestDiagnosticsIssue[];
    errorCount: number;
    warningCount: number;
    infoCount: number;
}

function createManifestIssue(
    level: WebAppManifestDiagnosticsLevel,
    category: WebAppManifestDiagnosticsCategory,
    code: string,
    message: string,
    member?: string
): WebAppManifestDiagnosticsIssue {
    const issue: WebAppManifestDiagnosticsIssue = { level, category, code, message };

    if (member !== undefined) issue.member = member;

    return issue;
}

function getManifestDiagnosticsStatus(
    errorCount: number,
    warningCount: number
): WebAppManifestDiagnosticsStatus {
    if (errorCount > 0) return "blocked";
    if (warningCount > 0) return "needs-attention";

    return "healthy";
}

function isManifestRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function inspectStringMember(
    manifest: WebAppManifest,
    member: string,
    category: WebAppManifestDiagnosticsCategory,
    issues: WebAppManifestDiagnosticsIssue[],
    requiredLevel?: WebAppManifestDiagnosticsLevel
): string | null {
    const value = manifest[member];

    if (value === null || value === undefined) {
        if (requiredLevel) {
            issues.push(createManifestIssue(
                requiredLevel,
                category,
                `manifest.${member}.missing`,
                `Manifest member "${member}" is missing.`,
                member
            ));
        }

        return null;
    }

    if (typeof value !== "string") {
        issues.push(createManifestIssue(
            "error",
            category,
            `manifest.${member}.type`,
            `Manifest member "${member}" must be a string.`,
            member
        ));
        return null;
    }

    if (!value.trim()) {
        issues.push(createManifestIssue(
            "warning",
            category,
            `manifest.${member}.empty`,
            `Manifest member "${member}" should not be empty.`,
            member
        ));
        return null;
    }

    return value;
}

/**
 * Inspects a web app manifest object for common publishing and installability issues.
 */
export function inspectWebAppManifest(
    manifest: WebAppManifest,
    options: WebAppManifestDiagnosticsOptions = {}
): WebAppManifestDiagnosticsReport {
    const issues: WebAppManifestDiagnosticsIssue[] = [];

    inspectStringMember(manifest, "name", "identity", issues, "error");
    inspectStringMember(manifest, "short_name", "identity", issues, options.requireShortName ? "warning" : undefined);
    inspectStringMember(manifest, "description", "identity", issues, options.requireDescription ? "warning" : undefined);
    inspectStringMember(manifest, "start_url", "launch", issues, options.requireStartUrl ? "warning" : undefined);
    inspectStringMember(manifest, "display", "display", issues, options.requireDisplay ? "warning" : undefined);
    inspectStringMember(manifest, "theme_color", "color", issues, options.requireThemeColor ? "warning" : undefined);
    inspectStringMember(manifest, "background_color", "color", issues, options.requireBackgroundColor ? "warning" : undefined);

    const icons = manifest.icons;
    let hasMaskableIcon = false;

    if (icons === null || icons === undefined) {
        if (options.requireIcons) {
            issues.push(createManifestIssue("warning", "icon", "manifest.icons.missing", "Manifest should provide icons.", "icons"));
        }
    } else if (!Array.isArray(icons)) {
        issues.push(createManifestIssue("error", "icon", "manifest.icons.type", "Manifest icons must be an array.", "icons"));
    } else if (icons.length === 0) {
        issues.push(createManifestIssue("warning", "icon", "manifest.icons.empty", "Manifest icons array should not be empty.", "icons"));
    } else {
        icons.forEach((icon, index) => {
            const member = `icons[${index}]`;

            if (!isManifestRecord(icon)) {
                issues.push(createManifestIssue("error", "icon", "manifest.icon.type", "Manifest icon must be an object.", member));
                return;
            }

            if (typeof icon.src !== "string" || !icon.src.trim()) {
                issues.push(createManifestIssue("error", "icon", "manifest.icon.src.missing", "Manifest icon must provide a non-empty src.", `${member}.src`));
            }

            if (icon.purpose !== undefined && icon.purpose !== null) {
                if (typeof icon.purpose !== "string") {
                    issues.push(createManifestIssue("error", "icon", "manifest.icon.purpose.type", "Manifest icon purpose must be a string.", `${member}.purpose`));
                } else if (icon.purpose.split(/\s+/).includes("maskable")) {
                    hasMaskableIcon = true;
                }
            }

            if (icon.sizes === undefined) {
                issues.push(createManifestIssue("info", "icon", "manifest.icon.sizes.missing", "Manifest icon has no sizes value.", `${member}.sizes`));
            }

            if (icon.type === undefined) {
                issues.push(createManifestIssue("info", "icon", "manifest.icon.type.missing", "Manifest icon has no type value.", `${member}.type`));
            }
        });
    }

    if (options.requireMaskableIcon && !hasMaskableIcon) {
        issues.push(createManifestIssue("warning", "icon", "manifest.icon.maskable.missing", "Installable apps should provide at least one maskable icon.", "icons"));
    }

    const shortcuts = manifest.shortcuts;

    if (shortcuts !== null && shortcuts !== undefined) {
        if (!Array.isArray(shortcuts)) {
            issues.push(createManifestIssue("error", "shortcut", "manifest.shortcuts.type", "Manifest shortcuts must be an array.", "shortcuts"));
        } else {
            shortcuts.forEach((shortcut, index) => {
                const member = `shortcuts[${index}]`;

                if (!isManifestRecord(shortcut)) {
                    issues.push(createManifestIssue("error", "shortcut", "manifest.shortcut.type", "Manifest shortcut must be an object.", member));
                    return;
                }

                if (typeof shortcut.name !== "string" || !shortcut.name.trim()) {
                    issues.push(createManifestIssue("error", "shortcut", "manifest.shortcut.name.missing", "Manifest shortcut must provide a non-empty name.", `${member}.name`));
                }

                if (typeof shortcut.url !== "string" || !shortcut.url.trim()) {
                    issues.push(createManifestIssue("error", "shortcut", "manifest.shortcut.url.missing", "Manifest shortcut must provide a non-empty url.", `${member}.url`));
                }
            });
        }
    }

    const errorCount = issues.filter((issue) => issue.level === "error").length;
    const warningCount = issues.filter((issue) => issue.level === "warning").length;
    const infoCount = issues.filter((issue) => issue.level === "info").length;

    return {
        status: getManifestDiagnosticsStatus(errorCount, warningCount),
        issues,
        errorCount,
        warningCount,
        infoCount
    };
}

/**
 * Logs a web app manifest diagnostics report to the developer console.
 */
export function logWebAppManifestDiagnostics(report: WebAppManifestDiagnosticsReport): void {
    console.groupCollapsed("Accessible First Web App Manifest Report");
    console.log(`Status: ${report.status}`);
    console.log(`Errors: ${report.errorCount}`);
    console.log(`Warnings: ${report.warningCount}`);
    console.log(`Info: ${report.infoCount}`);

    for (const issue of report.issues) {
        const member = issue.member ? ` ${issue.member}` : "";
        const line = `[${issue.level}] ${issue.category}/${issue.code}:${member} ${issue.message}`;

        if (issue.level === "error") console.error(line);
        else if (issue.level === "warning") console.warn(line);
        else console.info(line);
    }

    console.groupEnd();
}

/**
 * Creates a typed web app manifest object using practical defaults.
 */
export function createWebAppManifest(options: WebAppManifestOptions): WebAppManifest {
    const manifest: WebAppManifest = { name: options.name };

    setManifestValue(manifest, "short_name", options.shortName);
    setManifestValue(manifest, "description", options.description);
    setManifestValue(manifest, "lang", options.lang);
    setManifestValue(manifest, "dir", options.dir);
    setManifestValue(manifest, "id", options.id);

    const startUrl = "startUrl" in options ? options.startUrl : ".";
    const display = "display" in options ? options.display : "standalone";

    setManifestValue(manifest, "start_url", startUrl === null || startUrl === undefined ? startUrl : toManifestUrl(startUrl));
    setManifestValue(manifest, "scope", options.scope === null || options.scope === undefined ? options.scope : toManifestUrl(options.scope));
    setManifestValue(manifest, "display", display);
    setManifestValue(manifest, "display_override", options.displayOverride ? [...options.displayOverride] : null);
    setManifestValue(manifest, "orientation", options.orientation);
    setManifestValue(manifest, "theme_color", options.themeColor);
    setManifestValue(manifest, "background_color", options.backgroundColor);
    setManifestValue(manifest, "categories", options.categories ? [...options.categories] : null);
    setManifestValue(manifest, "icons", options.icons ? options.icons.map(createImageResource) : null);
    setManifestValue(manifest, "shortcuts", options.shortcuts ? options.shortcuts.map(createShortcut) : null);

    if (options.extras) {
        for (const [member, value] of Object.entries(options.extras)) {
            manifest[member] = value;
        }
    }

    return manifest;
}

/**
 * Converts a manifest object into formatted JSON.
 */
export function stringifyWebAppManifest(
    manifest: WebAppManifest,
    space = 2
): string {
    return JSON.stringify(manifest, null, space);
}

/**
 * Creates a typed web app manifest and returns it as formatted JSON.
 */
export function createWebAppManifestJson(
    options: WebAppManifestOptions,
    space = 2
): string {
    return stringifyWebAppManifest(createWebAppManifest(options), space);
}
