import {
    createWebAppManifest,
    type WebAppManifest,
    type WebAppManifestImageResourceOptions,
    type WebAppManifestOptions
} from "./createWebAppManifest";

/**
 * Common icon files accepted by createAppWebAppManifest().
 */
export interface AppWebAppManifestIconSetOptions {
    /** SVG icon source. Added with sizes "any" and type "image/svg+xml". */
    svg?: string | URL | null;
    /** 192x192 PNG icon source. Added with purpose "any maskable" by default. */
    png192?: string | URL | null;
    /** 512x512 PNG icon source. Added with purpose "any maskable" by default. */
    png512?: string | URL | null;
    /** Purpose used for the generated SVG icon. Defaults to "any". */
    svgPurpose?: string;
    /** Purpose used for the generated PNG icons. Defaults to "any maskable". */
    pngPurpose?: string;
}

/**
 * App-level manifest options for public sites and installable app-like experiences.
 */
export interface AppWebAppManifestOptions extends Omit<WebAppManifestOptions, "icons"> {
    /** Common icon set expanded into manifest icons before custom icons. */
    iconSet?: AppWebAppManifestIconSetOptions | null | false;
    /** Additional manifest icons, or null to omit all generated and custom icons. */
    icons?: readonly WebAppManifestImageResourceOptions[] | null;
}

function addGeneratedIcon(
    icons: WebAppManifestImageResourceOptions[],
    src: string | URL | null | undefined,
    sizes: string,
    type: string,
    purpose: string
): void {
    if (src === null || src === undefined) return;

    icons.push({ src, sizes, type, purpose });
}

function createIconSet(
    iconSet: AppWebAppManifestIconSetOptions | null | false | undefined
): WebAppManifestImageResourceOptions[] {
    if (!iconSet) return [];

    const icons: WebAppManifestImageResourceOptions[] = [];
    const svgPurpose = iconSet.svgPurpose ?? "any";
    const pngPurpose = iconSet.pngPurpose ?? "any maskable";

    addGeneratedIcon(icons, iconSet.svg, "any", "image/svg+xml", svgPurpose);
    addGeneratedIcon(icons, iconSet.png192, "192x192", "image/png", pngPurpose);
    addGeneratedIcon(icons, iconSet.png512, "512x512", "image/png", pngPurpose);

    return icons;
}

function createManifestIcons(
    iconSet: AppWebAppManifestIconSetOptions | null | false | undefined,
    customIcons: readonly WebAppManifestImageResourceOptions[] | null | undefined
): readonly WebAppManifestImageResourceOptions[] | null | undefined {
    if (customIcons === null) return null;

    const icons = [
        ...createIconSet(iconSet),
        ...(customIcons ?? [])
    ];

    return icons.length > 0 ? icons : undefined;
}

/**
 * Creates a web app manifest from app-level defaults and optional icon-set shortcuts.
 */
export function createAppWebAppManifest(options: AppWebAppManifestOptions): WebAppManifest {
    const { iconSet, icons: customIcons, ...manifestBaseOptions } = options;
    const manifestOptions: WebAppManifestOptions = { ...manifestBaseOptions };
    const icons = createManifestIcons(iconSet, customIcons);

    if (!("startUrl" in options)) manifestOptions.startUrl = ".";
    if (!("scope" in options)) manifestOptions.scope = ".";
    if (!("display" in options)) manifestOptions.display = "standalone";

    if (!("backgroundColor" in options) && options.themeColor !== undefined) {
        manifestOptions.backgroundColor = options.themeColor;
    }

    if (icons !== undefined) manifestOptions.icons = icons;

    return createWebAppManifest(manifestOptions);
}
