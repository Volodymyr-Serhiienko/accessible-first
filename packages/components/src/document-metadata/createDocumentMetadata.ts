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
 * Document-level metadata options for apps and pages.
 */
export interface DocumentMetadataOptions {
    document?: Document;
    title?: string | null;
    lang?: string | null;
    description?: string | null;
    viewport?: string | null;
    themeColor?: string | null;
    icons?: DocumentMetadataIconOptions[] | null;
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

            setIcons(null);
        }
    };
}
