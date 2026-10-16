import { runCleanups } from "../../../core/src/events";

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

interface HeadSnapshot<T extends HTMLElement> {
    element: T | null;
    attributes: Array<[string, string | null]>;
    managed: Set<T>;
}

type MetaSnapshot = HeadSnapshot<HTMLMetaElement>;
type LinkSnapshot = HeadSnapshot<HTMLLinkElement>;

function captureHeadElement<T extends HTMLElement>(element: T | null, attributes: string[]): HeadSnapshot<T> {
    return { element, attributes: attributes.map(name => [name, element?.getAttribute(name) ?? null]), managed: new Set() };
}

function setAttribute(element: HTMLElement, name: string, value: string | null): void {
    if (element.getAttribute(name) === value) return;
    if (value === null) element.removeAttribute(name);
    else element.setAttribute(name, value);
}

function restoreHeadElement<T extends HTMLElement>(ownerDocument: Document, snapshot: HeadSnapshot<T>): void {
    const managed = [...snapshot.managed]; snapshot.managed.clear();
    runCleanups([
        ...managed.filter(element => element !== snapshot.element).map(element => () => element.remove()),
        () => {
            if (snapshot.element && snapshot.element.parentNode !== ownerDocument.head) ownerDocument.head.append(snapshot.element);
        },
        ...snapshot.attributes.map(([name, value]) => () => { if (snapshot.element) setAttribute(snapshot.element, name, value); })
    ]);
}

function findMeta(ownerDocument: Document, name: string): HTMLMetaElement | null {
    return Array.from(ownerDocument.head.querySelectorAll<HTMLMetaElement>("meta[name]"))
        .find((meta) => meta.getAttribute("name")?.toLowerCase() === name) ?? null;
}

function findLink(ownerDocument: Document, rel: string): HTMLLinkElement | null {
    return Array.from(ownerDocument.head.querySelectorAll<HTMLLinkElement>("link[rel]"))
        .find((link) => (link.getAttribute("rel") ?? "").toLowerCase().split(/\s+/).includes(rel)) ?? null;
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

function toMetadataContent(
    value: string | number | boolean | URL | null | undefined
): string | null {
    if (value === null || value === undefined) return null;

    return String(value);
}

function prepareOpenGraph(openGraph: DocumentMetadataOpenGraphOptions | null): Map<string, string | null> {
    const values = new Map<string, string | null>(OPEN_GRAPH_PROPERTIES.map(name => [name, null]));
    if (!openGraph) return values;
    for (const [name, value] of [
        ["og:title", openGraph.title], ["og:type", openGraph.type], ["og:url", openGraph.url],
        ["og:description", openGraph.description], ["og:site_name", openGraph.siteName], ["og:locale", openGraph.locale]
    ] as const) values.set(name, toMetadataContent(value));
    const image = openGraph.image;
    if (!image) return values;
    if (typeof image === "string" || !("url" in image)) {
        values.set("og:image", stringifyMetadataUrl(image));
        return values;
    }
    for (const [name, value] of [
        ["og:image", image.url], ["og:image:secure_url", image.secureUrl], ["og:image:type", image.type],
        ["og:image:width", image.width], ["og:image:height", image.height], ["og:image:alt", image.alt]
    ] as const) values.set(name, toMetadataContent(value));
    return values;
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
    let originalTitle: string | undefined;
    let originalLang: string | null | undefined;
    let destroyed = false;
    let revision = 0;
    const metaSnapshots = new Map<string, MetaSnapshot>();
    const linkSnapshots = new Map<string, LinkSnapshot>();
    const propertyMetaSnapshots = new Map<string, MetaSnapshot>();
    const managedIcons: HTMLLinkElement[] = [];
    const managedStructuredDataScripts: HTMLScriptElement[] = [];

    function rememberMeta(name: string): MetaSnapshot {
        const existing = metaSnapshots.get(name);

        if (existing) return existing;

        const element = findMeta(ownerDocument, name);
        const snapshot = captureHeadElement(element, ["content"]);

        metaSnapshots.set(name, snapshot);

        return snapshot;
    }

    function rememberLink(rel: string): LinkSnapshot {
        const existing = linkSnapshots.get(rel);

        if (existing) return existing;

        const element = findLink(ownerDocument, rel);
        const snapshot = captureHeadElement(element, ["href", "crossorigin"]);

        linkSnapshots.set(rel, snapshot);

        return snapshot;
    }

    function rememberPropertyMeta(property: string): MetaSnapshot {
        const existing = propertyMetaSnapshots.get(property);

        if (existing) return existing;

        const element = findPropertyMeta(ownerDocument, property);
        const snapshot = captureHeadElement(element, ["content"]);

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
            restoreHeadElement(ownerDocument, snapshot);
            return;
        }

        const existing = findLink(ownerDocument, rel);
        const link = existing ?? ownerDocument.createElement("link");
        snapshot.managed.add(link);
        if (!existing) link.setAttribute("rel", rel);
        setAttribute(link, "href", href);

        for (const [name, value] of Object.entries(attributes)) {
            setAttribute(link, name, value ?? null);
        }

        if (!link.parentElement) {
            ownerDocument.head.append(link);
        }
    }

    function setMeta(name: string, content: string | null): void {
        const snapshot = rememberMeta(name);

        if (content === null) {
            restoreHeadElement(ownerDocument, snapshot);
            return;
        }

        const meta = findMeta(ownerDocument, name) ?? ownerDocument.createElement("meta");
        snapshot.managed.add(meta);
        if (!meta.hasAttribute("name")) meta.setAttribute("name", name);
        setAttribute(meta, "content", content);

        if (!meta.parentElement) {
            ownerDocument.head.append(meta);
        }
    }

    function setPropertyMeta(property: string, content: string | null): void {
        const snapshot = rememberPropertyMeta(property);

        if (content === null) {
            restoreHeadElement(ownerDocument, snapshot);
            return;
        }

        const meta = findPropertyMeta(ownerDocument, property) ?? ownerDocument.createElement("meta");
        snapshot.managed.add(meta);
        setAttribute(meta, "property", property);
        setAttribute(meta, "content", content);

        if (!meta.parentElement) {
            ownerDocument.head.append(meta);
        }
    }

    function setIcons(icons: HTMLLinkElement[]): void {
        if (managedIcons.length === icons.length && managedIcons.every((icon, index) => icon.parentNode === ownerDocument.head && icon.isEqualNode(icons[index]!))) return;
        const previous = managedIcons.splice(0);
        managedIcons.push(...icons);
        runCleanups([...previous.map(icon => () => icon.remove()), () => ownerDocument.head.append(...icons)]);
    }

    function setStructuredData(text: string | null): void {
        if (text !== null && managedStructuredDataScripts.length === 1
            && managedStructuredDataScripts[0]!.parentNode === ownerDocument.head
            && managedStructuredDataScripts[0]!.textContent === text) return;
        const previous = managedStructuredDataScripts.splice(0);
        const script = text === null ? null : ownerDocument.createElement("script");
        if (script) {
            script.type = "application/ld+json";
            script.setAttribute("data-af-document-structured-data", "");
            script.textContent = text;
            managedStructuredDataScripts.push(script);
        }
        runCleanups([...previous.map(element => () => element.remove()), () => { if (script) ownerDocument.head.append(script); }]);
    }

    function update(nextOptions: DocumentMetadataUpdateOptions): void {
        if (destroyed) return;
        const current = ++revision;
        const changes: Array<() => void> = [];
        // Resolve getters, URL values and JSON before changing the current document.
        const title = nextOptions.title;
        if (title !== undefined) changes.push(() => {
            originalTitle ??= ownerDocument.title;
            const value = title ?? originalTitle;
            if (ownerDocument.title !== value) ownerDocument.title = value;
        });
        const lang = nextOptions.lang;
        if (lang !== undefined) changes.push(() => {
            if (originalLang === undefined) originalLang = ownerDocument.documentElement.getAttribute("lang");
            setAttribute(ownerDocument.documentElement, "lang", lang ?? originalLang);
        });
        for (const [key, name] of [["description", "description"], ["viewport", "viewport"], ["themeColor", "theme-color"], ["robots", "robots"]] as const) {
            if (!(key in nextOptions)) continue;
            const value = nextOptions[key] ?? null;
            changes.push(() => setMeta(name, value));
        }
        if ("icons" in nextOptions) {
            const icons = (nextOptions.icons ?? []).map(icon => createIcon(ownerDocument, icon));
            changes.push(() => setIcons(icons));
        }
        if ("canonical" in nextOptions) {
            const value = toMetadataContent(nextOptions.canonical);
            changes.push(() => setLink("canonical", value));
        }
        if ("manifest" in nextOptions) {
            const manifest = nextOptions.manifest;
            const href = typeof manifest === "string" ? manifest : manifest?.href ?? null;
            const crossOrigin = typeof manifest === "object" ? manifest?.crossOrigin ?? null : null;
            changes.push(() => setLink("manifest", href, { crossorigin: crossOrigin }));
        }
        if ("openGraph" in nextOptions) {
            const values = prepareOpenGraph(nextOptions.openGraph ?? null);
            for (const [name, value] of values) changes.push(() => setPropertyMeta(name, value));
        }
        if ("twitter" in nextOptions) {
            const twitter = nextOptions.twitter;
            const values = [twitter?.card, twitter?.site, twitter?.creator, twitter?.title, twitter?.description, twitter?.image, twitter?.imageAlt];
            TWITTER_META_NAMES.forEach((name, index) => {
                const value = toMetadataContent(values[index]);
                changes.push(() => setMeta(name, value));
            });
        }
        if ("structuredData" in nextOptions) {
            const data = nextOptions.structuredData;
            const text = data == null ? null : JSON.stringify(data);
            if (text === undefined) throw new TypeError("Structured data must serialize to JSON.");
            const safeText = text?.replace(/</g, "\\u003c") ?? null;
            changes.push(() => setStructuredData(safeText));
        }
        runCleanups(changes.map(change => () => { if (!destroyed && current === revision) change(); }));
    }

    const controller: DocumentMetadataController = {
        document: ownerDocument,
        update,

        destroy(): void {
            if (destroyed) return;
            destroyed = true; revision += 1;
            const snapshots = [...metaSnapshots.values(), ...linkSnapshots.values(), ...propertyMetaSnapshots.values()];
            metaSnapshots.clear(); linkSnapshots.clear(); propertyMetaSnapshots.clear();
            runCleanups([
                () => { if (originalTitle !== undefined) ownerDocument.title = originalTitle; },
                () => { if (originalLang !== undefined) setAttribute(ownerDocument.documentElement, "lang", originalLang); },
                ...snapshots.map(snapshot => () => restoreHeadElement(ownerDocument, snapshot as HeadSnapshot<HTMLElement>)),
                () => setIcons([]), () => setStructuredData(null)
            ]);
        }
    };
    try { update(options); return controller; }
    catch (error) {
        try { controller.destroy(); } catch { /* Preserve the construction failure. */ }
        throw error;
    }
}
