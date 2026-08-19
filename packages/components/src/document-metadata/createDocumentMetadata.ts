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
    const managedIcons: HTMLLinkElement[] = [];

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

            setIcons(null);
        }
    };
}
