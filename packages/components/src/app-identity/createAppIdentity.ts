import {
    createAppDocumentMetadata,
    type AppDocumentMetadataOptions,
    type AppDocumentMetadataSoftwareApplicationOptions,
    type DocumentMetadataIconOptions,
    type DocumentMetadataOpenGraphImage,
    type DocumentMetadataOpenGraphOptions,
    type DocumentMetadataStructuredDataValue,
    type DocumentMetadataTwitterOptions,
    type DocumentMetadataUpdateOptions,
    type DocumentMetadataUrlValue
} from "../document-metadata";
import {
    createAppWebAppManifest,
    type AppWebAppManifestIconSetOptions,
    type AppWebAppManifestOptions,
    type WebAppManifest,
    type WebAppManifestDirection
} from "../web-app-manifest";

/**
 * Shared app icon files accepted by createAppIdentity().
 */
export interface AppIdentityIconSetOptions {
    /** SVG app icon used by document metadata and generated manifest icon sets. */
    svg?: string | URL | null;
    /** 192x192 PNG app icon used by generated manifest icon sets. */
    png192?: string | URL | null;
    /** 512x512 PNG app icon used by generated manifest icon sets and social previews when desired. */
    png512?: string | URL | null;
    /** Shared preview image used by generated social metadata. */
    preview?: DocumentMetadataOpenGraphImage | null;
}

/**
 * Normalized app icon files stored on an AppIdentity.
 */
export interface AppIdentityIconSet {
    readonly svg: string | URL | null;
    readonly png192: string | URL | null;
    readonly png512: string | URL | null;
    readonly preview: DocumentMetadataOpenGraphImage | null;
}

/**
 * Schema.org SoftwareApplication defaults stored on an AppIdentity.
 */
export interface AppIdentitySoftwareApplicationOptions extends AppDocumentMetadataSoftwareApplicationOptions {}

/**
 * Declarative app identity accepted by createAppIdentity().
 */
export interface AppIdentityOptions {
    /** Product, site, or application name used as the stable identity name. */
    name: string;
    /** Short app name used by manifests and compact UI. Defaults to name. */
    shortName?: string | null;
    /** Primary app description used by metadata, manifest, diagnostics, and app copy. */
    description?: string | null;
    /** Social preview description. Defaults to description. */
    socialDescription?: string | null;
    /** Twitter/X preview description. Defaults to socialDescription, then description. */
    twitterDescription?: string | null;
    /** SoftwareApplication JSON-LD description. Defaults to description. */
    softwareDescription?: string | null;
    /** Default language for document metadata and manifests when app code does not override it. */
    lang?: string | null;
    /** Text direction for document metadata and manifests when app code does not override it. */
    dir?: WebAppManifestDirection | null;
    /** Public app URL used as the default metadata URL. */
    url?: DocumentMetadataUrlValue | null;
    /** Theme color shared by metadata and manifest helpers. */
    themeColor?: string | null;
    /** Manifest background color. Defaults to themeColor. */
    backgroundColor?: string | null;
    /** Web app manifest href used by document metadata. */
    manifestHref?: string | null;
    /** Shared app icon alt text used when helpers create preview metadata. */
    logoAlt?: string | null;
    /** Shared app icon files. */
    icons?: AppIdentityIconSetOptions | null;
    /** Web app manifest categories. */
    categories?: readonly string[] | null;
    /** SoftwareApplication JSON-LD defaults, or false/null to omit them. */
    softwareApplication?: AppIdentitySoftwareApplicationOptions | null | false;
}

/**
 * Normalized public app identity shared by metadata, manifest, routing, diagnostics, and app chrome.
 */
export interface AppIdentity {
    readonly name: string;
    readonly shortName: string;
    readonly description: string | null;
    readonly socialDescription: string | null;
    readonly twitterDescription: string | null;
    readonly softwareDescription: string | null;
    readonly lang: string | null;
    readonly dir: WebAppManifestDirection | null;
    readonly url: DocumentMetadataUrlValue | null;
    readonly themeColor: string | null;
    readonly backgroundColor: string | null;
    readonly manifestHref: string | null;
    readonly logoAlt: string | null;
    readonly icons: AppIdentityIconSet;
    readonly categories: readonly string[];
    readonly softwareApplication: AppIdentitySoftwareApplicationOptions | null;
}

/**
 * Document metadata overrides accepted by createAppIdentityDocumentMetadata().
 */
export interface AppIdentityDocumentMetadataOptions extends Partial<AppDocumentMetadataOptions> {}

/**
 * Web app manifest overrides accepted by createAppIdentityWebAppManifest().
 */
export interface AppIdentityWebAppManifestOptions extends Partial<AppWebAppManifestOptions> {}

function createAppIdentityIcons(
    icons: AppIdentityIconSetOptions | null | undefined
): AppIdentityIconSet {
    return Object.freeze({
        svg: icons?.svg ?? null,
        png192: icons?.png192 ?? null,
        png512: icons?.png512 ?? null,
        preview: icons?.preview ?? null
    });
}

function createAppIdentitySoftwareApplication(
    options: AppIdentityOptions
): AppIdentitySoftwareApplicationOptions | null {
    const softwareApplication = options.softwareApplication;

    if (!softwareApplication) return null;

    return Object.freeze({ ...softwareApplication });
}

function createDocumentIcons(identity: AppIdentity): DocumentMetadataIconOptions[] {
    if (!identity.icons.svg) return [];

    return [
        {
            href: identity.icons.svg.toString(),
            type: "image/svg+xml"
        }
    ];
}

function createManifestIconSet(identity: AppIdentity): AppWebAppManifestIconSetOptions | undefined {
    const iconSet: AppWebAppManifestIconSetOptions = {};

    if (identity.icons.svg) iconSet.svg = identity.icons.svg;
    if (identity.icons.png192) iconSet.png192 = identity.icons.png192;
    if (identity.icons.png512) iconSet.png512 = identity.icons.png512;

    return Object.keys(iconSet).length > 0 ? iconSet : undefined;
}

function getIdentityOpenGraph(
    identity: AppIdentity,
    options: AppIdentityDocumentMetadataOptions
): DocumentMetadataOpenGraphOptions | null | false | undefined {
    if ("openGraph" in options) {
        const openGraph = options.openGraph;

        if (openGraph === null || openGraph === false || openGraph === undefined) return openGraph;

        return {
            ...(identity.socialDescription !== null ? { description: identity.socialDescription } : {}),
            ...openGraph
        };
    }

    return identity.socialDescription !== null
        ? { description: identity.socialDescription }
        : undefined;
}

function getIdentityTwitter(
    identity: AppIdentity,
    options: AppIdentityDocumentMetadataOptions
): DocumentMetadataTwitterOptions | null | false | undefined {
    if ("twitter" in options) {
        const twitter = options.twitter;

        if (twitter === null || twitter === false || twitter === undefined) return twitter;

        return {
            ...(identity.twitterDescription !== null ? { description: identity.twitterDescription } : {}),
            ...twitter
        };
    }

    return identity.twitterDescription !== null
        ? { description: identity.twitterDescription }
        : undefined;
}

function getIdentitySoftwareApplication(
    identity: AppIdentity,
    options: AppIdentityDocumentMetadataOptions
): AppDocumentMetadataSoftwareApplicationOptions | null | false | undefined {
    if ("softwareApplication" in options) {
        const softwareApplication = options.softwareApplication;

        if (softwareApplication === null || softwareApplication === false || softwareApplication === undefined) {
            return softwareApplication;
        }

        return {
            ...(identity.softwareApplication ?? {}),
            ...(identity.softwareDescription !== null ? { description: identity.softwareDescription } : {}),
            ...softwareApplication
        };
    }

    if (!identity.softwareApplication) return undefined;

    return {
        ...identity.softwareApplication,
        ...(identity.softwareDescription !== null ? { description: identity.softwareDescription } : {})
    };
}

function assignDefinedAppMetadataOption<TKey extends keyof AppDocumentMetadataOptions>(
    options: AppDocumentMetadataOptions,
    key: TKey,
    value: AppDocumentMetadataOptions[TKey] | undefined
): void {
    if (value !== undefined) options[key] = value;
}

/**
 * Creates a normalized app identity object from one app-owned declaration.
 */
export function createAppIdentity(options: AppIdentityOptions): AppIdentity {
    const description = options.description ?? null;
    const socialDescription = options.socialDescription ?? description;
    const twitterDescription = options.twitterDescription ?? socialDescription;
    const softwareDescription = options.softwareDescription ?? description;
    const themeColor = options.themeColor ?? null;
    const backgroundColor = options.backgroundColor ?? themeColor;
    const identity: AppIdentity = {
        name: options.name,
        shortName: options.shortName ?? options.name,
        description,
        socialDescription,
        twitterDescription,
        softwareDescription,
        lang: options.lang ?? null,
        dir: options.dir ?? null,
        url: options.url ?? null,
        themeColor,
        backgroundColor,
        manifestHref: options.manifestHref ?? null,
        logoAlt: options.logoAlt ?? null,
        icons: createAppIdentityIcons(options.icons),
        categories: Object.freeze([...(options.categories ?? [])]),
        softwareApplication: createAppIdentitySoftwareApplication(options)
    };

    return Object.freeze(identity);
}

/**
 * Creates document metadata from an AppIdentity plus optional app- or route-level overrides.
 */
export function createAppIdentityDocumentMetadata(
    identity: AppIdentity,
    options: AppIdentityDocumentMetadataOptions = {}
): DocumentMetadataUpdateOptions {
    const metadataOptions: AppDocumentMetadataOptions = {
        name: options.name ?? identity.name
    };
    const documentIcons = createDocumentIcons(identity);
    const openGraph = getIdentityOpenGraph(identity, options);
    const twitter = getIdentityTwitter(identity, options);
    const softwareApplication = getIdentitySoftwareApplication(identity, options);

    if (identity.description !== null) metadataOptions.description = identity.description;
    if (identity.lang !== null) metadataOptions.lang = identity.lang;
    if (identity.url !== null) metadataOptions.url = identity.url;
    if (identity.themeColor !== null) metadataOptions.themeColor = identity.themeColor;
    if (identity.manifestHref !== null) metadataOptions.manifest = identity.manifestHref;
    if (documentIcons.length > 0) metadataOptions.icons = documentIcons;
    if (identity.icons.preview !== null) metadataOptions.image = identity.icons.preview;
    if (identity.logoAlt !== null) metadataOptions.imageAlt = identity.logoAlt;

    assignDefinedAppMetadataOption(metadataOptions, "title", options.title);
    assignDefinedAppMetadataOption(metadataOptions, "lang", options.lang);
    assignDefinedAppMetadataOption(metadataOptions, "description", options.description);
    assignDefinedAppMetadataOption(metadataOptions, "viewport", options.viewport);
    assignDefinedAppMetadataOption(metadataOptions, "themeColor", options.themeColor);
    assignDefinedAppMetadataOption(metadataOptions, "icons", options.icons);
    assignDefinedAppMetadataOption(metadataOptions, "url", options.url);
    assignDefinedAppMetadataOption(metadataOptions, "canonical", options.canonical);
    assignDefinedAppMetadataOption(metadataOptions, "siteName", options.siteName);
    assignDefinedAppMetadataOption(metadataOptions, "robots", options.robots);
    assignDefinedAppMetadataOption(metadataOptions, "manifest", options.manifest);
    assignDefinedAppMetadataOption(metadataOptions, "image", options.image);
    assignDefinedAppMetadataOption(metadataOptions, "imageAlt", options.imageAlt);
    assignDefinedAppMetadataOption(metadataOptions, "structuredData", options.structuredData);

    if (openGraph !== undefined) metadataOptions.openGraph = openGraph;
    if (twitter !== undefined) metadataOptions.twitter = twitter;
    if (softwareApplication !== undefined) metadataOptions.softwareApplication = softwareApplication;

    return createAppDocumentMetadata(metadataOptions);
}

/**
 * Creates a web app manifest from an AppIdentity plus optional deployment-level overrides.
 */
export function createAppIdentityWebAppManifest(
    identity: AppIdentity,
    options: AppIdentityWebAppManifestOptions = {}
): WebAppManifest {
    const manifestOptions: AppWebAppManifestOptions = {
        name: identity.name,
        shortName: identity.shortName
    };
    const iconSet = createManifestIconSet(identity);

    if (identity.description !== null) manifestOptions.description = identity.description;
    if (identity.lang !== null) manifestOptions.lang = identity.lang;
    if (identity.dir !== null) manifestOptions.dir = identity.dir;
    if (identity.themeColor !== null) manifestOptions.themeColor = identity.themeColor;
    if (identity.backgroundColor !== null) manifestOptions.backgroundColor = identity.backgroundColor;
    if (identity.categories.length > 0) manifestOptions.categories = identity.categories;
    if (iconSet !== undefined) manifestOptions.iconSet = iconSet;

    return createAppWebAppManifest({
        ...manifestOptions,
        ...options
    });
}