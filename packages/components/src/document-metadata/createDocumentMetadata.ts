/**
 * Responsive viewport value suitable for most web applications.
 */
export const DEFAULT_DOCUMENT_VIEWPORT = "width=device-width, initial-scale=1";

/**
 * Icon link managed by DocumentMetadata.
 */
export interface DocumentMetadataIconOptions {
    href: string;
    rel?: string;
    type?: string;
    sizes?: string;
    media?: string;
    color?: string;
}

/**
 * Valid crossorigin values for a managed web app manifest link.
 */
export type DocumentMetadataManifestCrossOrigin = "" | "anonymous" | "use-credentials";

/**
 * Web app manifest link managed by DocumentMetadata.
 */
export interface DocumentMetadataManifestOptions {
    href: string;
    crossOrigin?: DocumentMetadataManifestCrossOrigin;
}

/**
 * Manifest value accepted by DocumentMetadata.
 * Use a string for the common case, or an object when crossorigin is needed.
 */
export type DocumentMetadataManifest = string | DocumentMetadataManifestOptions;

/**
 * URL value accepted by document metadata fields.
 */
export type DocumentMetadataUrlValue = string | URL;

/**
 * Open Graph image metadata for shared-link previews.
 */
export interface DocumentMetadataOpenGraphImageOptions {
    url: DocumentMetadataUrlValue;
    secureUrl?: DocumentMetadataUrlValue | null;
    type?: string | null;
    width?: string | number | null;
    height?: string | number | null;
    alt?: string | null;
}

/**
 * Open Graph image value accepted by DocumentMetadata.
 */
export type DocumentMetadataOpenGraphImage =
    | DocumentMetadataUrlValue
    | DocumentMetadataOpenGraphImageOptions;

/**
 * Open Graph metadata managed through meta[property].
 */
export interface DocumentMetadataOpenGraphOptions {
    title?: string | null;
    type?: string | null;
    url?: DocumentMetadataUrlValue | null;
    description?: string | null;
    siteName?: string | null;
    locale?: string | null;
    image?: DocumentMetadataOpenGraphImage | null;
}

/**
 * Twitter/X card type.
 */
export type DocumentMetadataTwitterCard =
    | "summary"
    | "summary_large_image"
    | "app"
    | "player"
    | (string & {});

/**
 * Twitter/X card metadata managed through meta[name].
 */
export interface DocumentMetadataTwitterOptions {
    card?: DocumentMetadataTwitterCard | null;
    site?: string | null;
    creator?: string | null;
    title?: string | null;
    description?: string | null;
    image?: DocumentMetadataUrlValue | null;
    imageAlt?: string | null;
}

/**
 * JSON-compatible value accepted by JSON-LD structured data.
 */
export type DocumentMetadataStructuredDataValue =
    | string
    | number
    | boolean
    | null
    | readonly DocumentMetadataStructuredDataValue[]
    | { readonly [key: string]: DocumentMetadataStructuredDataValue };

/**
 * JSON-LD structured data inserted into script[type="application/ld+json"].
 */
export type DocumentMetadataStructuredData = DocumentMetadataStructuredDataValue;

/**
 * Document-level metadata options for apps and pages.
 *
 * Covers the essential accessibility, responsive, SEO, installability,
 * theme, and icon metadata that an application shell usually owns.
 */
export interface DocumentMetadataOptions {
    document?: Document;
    title?: string | null;
    lang?: string | null;
    description?: string | null;
    viewport?: string | null;
    themeColor?: string | null;
    icons?: DocumentMetadataIconOptions[] | null;
    canonical?: string | URL | null;
    robots?: string | null;
    manifest?: DocumentMetadataManifest | null;
    openGraph?: DocumentMetadataOpenGraphOptions | null;
    twitter?: DocumentMetadataTwitterOptions | null;
    structuredData?: DocumentMetadataStructuredData | null;
}

/**
 * Runtime metadata updates. The target document is creation-time only.
 */
export interface DocumentMetadataUpdateOptions
    extends Partial<Omit<DocumentMetadataOptions, "document">> {}

/**
 * Controller returned by createDocumentMetadata().
 */
export interface DocumentMetadataController {
    readonly document: Document;
    update(options: DocumentMetadataUpdateOptions): void;
    destroy(): void;
}

interface MetaSnapshot {
    element: HTMLMetaElement | null;
    content: string | null;
}

interface LinkSnapshot {
    element: HTMLLinkElement | null;
    attributes: Array<[string, string]>;
}

function findMeta(ownerDocument: Document, name: string): HTMLMetaElement | null {
    return Array.from(ownerDocument.head.querySelectorAll<HTMLMetaElement>("meta[name]"))
        .find((meta) => meta.getAttribute("name") === name) ?? null;
}

function restoreMeta(ownerDocument: Document, name: string, snapshot: MetaSnapshot): void {
    const current = findMeta(ownerDocument, name);

    if (!snapshot.element) {
        current?.remove();
        return;
    }

    if (!current) {
        ownerDocument.head.append(snapshot.element);
    }

    if (snapshot.content === null) {
        snapshot.element.removeAttribute("content");
    } else {
        snapshot.element.setAttribute("content", snapshot.content);
    }
}

function findLink(ownerDocument: Document, rel: string): HTMLLinkElement | null {
    return Array.from(ownerDocument.head.querySelectorAll<HTMLLinkElement>("link[rel]"))
        .find((link) => (link.getAttribute("rel") ?? "").split(/\s+/).includes(rel)) ?? null;
}

function getLinkAttributes(element: HTMLLinkElement | null): Array<[string, string]> {
    if (!element) return [];

    return Array.from(element.attributes)
        .map((attribute) => [attribute.name, attribute.value]);
}

function restoreLinkAttributes(
    element: HTMLLinkElement,
    attributes: Array<[string, string]>
): void {
    for (const attribute of Array.from(element.attributes)) {
        element.removeAttribute(attribute.name);
    }

    for (const [name, value] of attributes) {
        element.setAttribute(name, value);
    }
}

function restoreLink(ownerDocument: Document, rel: string, snapshot: LinkSnapshot): void {
    const current = findLink(ownerDocument, rel);

    if (!snapshot.element) {
        current?.remove();
        return;
    }

    if (current && current !== snapshot.element) {
        current.remove();
    }

    if (!snapshot.element.parentElement) {
        ownerDocument.head.append(snapshot.element);
    }

    restoreLinkAttributes(snapshot.element, snapshot.attributes);
}

function stringifyMetadataUrl(value: string | URL): string {
    return typeof value === "string" ? value : value.toString();
}

const OPEN_GRAPH_PROPERTIES = [
    "og:title",
    "og:type",
    "og:url",
    "og:description",
    "og:site_name",
    "og:locale",
    "og:image",
    "og:image:secure_url",
    "og:image:type",
    "og:image:width",
    "og:image:height",
    "og:image:alt"
];

const TWITTER_META_NAMES = [
    "twitter:card",
    "twitter:site",
    "twitter:creator",
    "twitter:title",
    "twitter:description",
    "twitter:image",
    "twitter:image:alt"
];

function findPropertyMeta(ownerDocument: Document, property: string): HTMLMetaElement | null {
    return Array.from(ownerDocument.head.querySelectorAll<HTMLMetaElement>("meta[property]"))
        .find((meta) => meta.getAttribute("property") === property) ?? null;
}

function restorePropertyMeta(
    ownerDocument: Document,
    property: string,
    snapshot: MetaSnapshot
): void {
    const current = findPropertyMeta(ownerDocument, property);

    if (!snapshot.element) {
        current?.remove();
        return;
    }

    if (current && current !== snapshot.element) {
        current.remove();
    }

    if (!snapshot.element.parentElement) {
        ownerDocument.head.append(snapshot.element);
    }

    if (snapshot.content === null) {
        snapshot.element.removeAttribute("content");
    } else {
        snapshot.element.setAttribute("content", snapshot.content);
    }
}

function toMetadataContent(
    value: string | number | boolean | URL | null | undefined
): string | null {
    if (value === null || value === undefined) return null;

    return value instanceof URL ? value.toString() : String(value);
}

function createIcon(ownerDocument: Document, icon: DocumentMetadataIconOptions): HTMLLinkElement {
    const link = ownerDocument.createElement("link");

    link.setAttribute("data-af-document-icon", "");
    link.setAttribute("rel", icon.rel ?? "icon");
    link.setAttribute("href", icon.href);

    if (icon.type !== undefined) link.setAttribute("type", icon.type);
    if (icon.sizes !== undefined) link.setAttribute("sizes", icon.sizes);
    if (icon.media !== undefined) link.setAttribute("media", icon.media);
    if (icon.color !== undefined) link.setAttribute("color", icon.color);

    return link;
}

/**
 * Applies document metadata and restores previous values on destroy().
 */
export function createDocumentMetadata(
    options: DocumentMetadataOptions = {}
): DocumentMetadataController {
    const ownerDocument = options.document ?? document;
    const originalTitle = ownerDocument.title;
    const originalLang = ownerDocument.documentElement.getAttribute("lang");
    const metaSnapshots = new Map<string, MetaSnapshot>();
    const linkSnapshots = new Map<string, LinkSnapshot>();
    const propertyMetaSnapshots = new Map<string, MetaSnapshot>();
    const managedIcons: HTMLLinkElement[] = [];
    const managedStructuredDataScripts: HTMLScriptElement[] = [];

    function rememberMeta(name: string): MetaSnapshot {
        const existing = metaSnapshots.get(name);

        if (existing) return existing;

        const element = findMeta(ownerDocument, name);
        const snapshot: MetaSnapshot = {
            element,
            content: element?.getAttribute("content") ?? null
        };

        metaSnapshots.set(name, snapshot);

        return snapshot;
    }

    function rememberLink(rel: string): LinkSnapshot {
        const existing = linkSnapshots.get(rel);

        if (existing) return existing;

        const element = findLink(ownerDocument, rel);
        const snapshot: LinkSnapshot = {
            element,
            attributes: getLinkAttributes(element)
        };

        linkSnapshots.set(rel, snapshot);

        return snapshot;
    }

    function rememberPropertyMeta(property: string): MetaSnapshot {
        const existing = propertyMetaSnapshots.get(property);

        if (existing) return existing;

        const element = findPropertyMeta(ownerDocument, property);
        const snapshot: MetaSnapshot = {
            element,
            content: element?.getAttribute("content") ?? null
        };

        propertyMetaSnapshots.set(property, snapshot);

        return snapshot;
    }

    function setLink(
        rel: string,
        href: string | null,
        attributes: Record<string, string | null | undefined> = {}
    ): void {
        const snapshot = rememberLink(rel);

        if (href === null) {
            restoreLink(ownerDocument, rel, snapshot);
            return;
        }

        const link = findLink(ownerDocument, rel) ?? ownerDocument.createElement("link");

        link.setAttribute("rel", rel);
        link.setAttribute("href", href);

        for (const [name, value] of Object.entries(attributes)) {
            if (value === null || value === undefined) {
                link.removeAttribute(name);
            } else {
                link.setAttribute(name, value);
            }
        }

        if (!link.parentElement) {
            ownerDocument.head.append(link);
        }
    }

    function setCanonical(canonical: string | URL | null): void {
        setLink("canonical", canonical === null ? null : stringifyMetadataUrl(canonical));
    }

    function setManifest(manifest: DocumentMetadataManifest | null): void {
        if (manifest === null) {
            setLink("manifest", null);
            return;
        }

        if (typeof manifest === "string") {
            setLink("manifest", manifest);
            return;
        }

        setLink("manifest", manifest.href, {
            crossorigin: manifest.crossOrigin
        });
    }

    function setMeta(name: string, content: string | null): void {
        const snapshot = rememberMeta(name);

        if (content === null) {
            restoreMeta(ownerDocument, name, snapshot);
            return;
        }

        const meta = findMeta(ownerDocument, name) ?? ownerDocument.createElement("meta");

        meta.setAttribute("name", name);
        meta.setAttribute("content", content);

        if (!meta.parentElement) {
            ownerDocument.head.append(meta);
        }
    }

    function setPropertyMeta(property: string, content: string | null): void {
        const snapshot = rememberPropertyMeta(property);

        if (content === null) {
            restorePropertyMeta(ownerDocument, property, snapshot);
            return;
        }

        const meta = findPropertyMeta(ownerDocument, property) ?? ownerDocument.createElement("meta");

        meta.setAttribute("property", property);
        meta.setAttribute("content", content);

        if (!meta.parentElement) {
            ownerDocument.head.append(meta);
        }
    }

    function setOpenGraph(openGraph: DocumentMetadataOpenGraphOptions | null): void {
        for (const property of OPEN_GRAPH_PROPERTIES) {
            setPropertyMeta(property, null);
        }

        if (!openGraph) return;

        setPropertyMeta("og:title", openGraph.title ?? null);
        setPropertyMeta("og:type", openGraph.type ?? null);
        setPropertyMeta("og:url", toMetadataContent(openGraph.url));
        setPropertyMeta("og:description", openGraph.description ?? null);
        setPropertyMeta("og:site_name", openGraph.siteName ?? null);
        setPropertyMeta("og:locale", openGraph.locale ?? null);

        const image = openGraph.image ?? null;

        if (!image) return;

        if (typeof image === "string" || image instanceof URL) {
            setPropertyMeta("og:image", stringifyMetadataUrl(image));
            return;
        }

        setPropertyMeta("og:image", stringifyMetadataUrl(image.url));
        setPropertyMeta("og:image:secure_url", toMetadataContent(image.secureUrl));
        setPropertyMeta("og:image:type", image.type ?? null);
        setPropertyMeta("og:image:width", toMetadataContent(image.width));
        setPropertyMeta("og:image:height", toMetadataContent(image.height));
        setPropertyMeta("og:image:alt", image.alt ?? null);
    }

    function setTwitter(twitter: DocumentMetadataTwitterOptions | null): void {
        for (const name of TWITTER_META_NAMES) {
            setMeta(name, null);
        }

        if (!twitter) return;

        setMeta("twitter:card", twitter.card ?? null);
        setMeta("twitter:site", twitter.site ?? null);
        setMeta("twitter:creator", twitter.creator ?? null);
        setMeta("twitter:title", twitter.title ?? null);
        setMeta("twitter:description", twitter.description ?? null);
        setMeta("twitter:image", toMetadataContent(twitter.image));
        setMeta("twitter:image:alt", twitter.imageAlt ?? null);
    }

    function setIcons(icons: DocumentMetadataIconOptions[] | null): void {
        for (const icon of managedIcons.splice(0)) {
            icon.remove();
        }

        if (!icons) return;

        for (const icon of icons) {
            const link = createIcon(ownerDocument, icon);
            managedIcons.push(link);
            ownerDocument.head.append(link);
        }
    }

    function setStructuredData(structuredData: DocumentMetadataStructuredData | null): void {
        for (const script of managedStructuredDataScripts.splice(0)) {
            script.remove();
        }

        if (structuredData === null) return;

        const script = ownerDocument.createElement("script");

        script.type = "application/ld+json";
        script.setAttribute("data-af-document-structured-data", "");
        script.textContent = JSON.stringify(structuredData);

        managedStructuredDataScripts.push(script);
        ownerDocument.head.append(script);
    }

    function update(nextOptions: DocumentMetadataUpdateOptions): void {
        if ("title" in nextOptions && nextOptions.title !== undefined) {
            ownerDocument.title = nextOptions.title ?? originalTitle;
        }

        if ("lang" in nextOptions && nextOptions.lang !== undefined) {
            if (nextOptions.lang === null) {
                if (originalLang === null) {
                    ownerDocument.documentElement.removeAttribute("lang");
                } else {
                    ownerDocument.documentElement.setAttribute("lang", originalLang);
                }
            } else {
                ownerDocument.documentElement.setAttribute("lang", nextOptions.lang);
            }
        }

        if ("description" in nextOptions) setMeta("description", nextOptions.description ?? null);
        if ("viewport" in nextOptions) setMeta("viewport", nextOptions.viewport ?? null);
        if ("themeColor" in nextOptions) setMeta("theme-color", nextOptions.themeColor ?? null);
        if ("icons" in nextOptions) setIcons(nextOptions.icons ?? null);
        if ("canonical" in nextOptions) setCanonical(nextOptions.canonical ?? null);
        if ("robots" in nextOptions) setMeta("robots", nextOptions.robots ?? null);
        if ("manifest" in nextOptions) setManifest(nextOptions.manifest ?? null);
        if ("openGraph" in nextOptions) setOpenGraph(nextOptions.openGraph ?? null);
        if ("twitter" in nextOptions) setTwitter(nextOptions.twitter ?? null);
        if ("structuredData" in nextOptions) setStructuredData(nextOptions.structuredData ?? null);
    }

    update(options);

    return {
        document: ownerDocument,
        update,

        destroy(): void {
            ownerDocument.title = originalTitle;

            if (originalLang === null) {
                ownerDocument.documentElement.removeAttribute("lang");
            } else {
                ownerDocument.documentElement.setAttribute("lang", originalLang);
            }

            for (const [name, snapshot] of metaSnapshots) {
                restoreMeta(ownerDocument, name, snapshot);
            }

            for (const [rel, snapshot] of linkSnapshots) {
                restoreLink(ownerDocument, rel, snapshot);
            }

            for (const [property, snapshot] of propertyMetaSnapshots) {
                restorePropertyMeta(ownerDocument, property, snapshot);
            }

            setIcons(null);
            setStructuredData(null);
        }
    };
}
