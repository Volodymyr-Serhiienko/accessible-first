import {
    applyCompositionElementOptions,
    createContentSlot,
    createElement,
    getCompositionElementOptions,
    hasCompositionContent,
    toCompositionChildren,
    type BaseCompositionOptions,
    type ComposedNode,
    type CompositionContent
} from "../composition";
import { createLink, type LinkOptions, type LinkTarget } from "../link";

/**
 * Content accepted by Brand logo, name, and tagline slots.
 */
export type BrandCompositionContent = CompositionContent;

/**
 * Native element used for the visible brand name.
 */
export type BrandNameTagName = "span" | "p" | "h1" | "h2" | "h3";

/**
 * Brand root element. Linked brands use anchor; static brands use div.
 */
export type BrandElement = HTMLAnchorElement | HTMLDivElement;

/**
 * Logo position relative to brand text.
 */
export type BrandLogoPosition = "start" | "end";

/**
 * Visual style variant for Brand.
 */
export type BrandVariant = "default" | "plain";

/**
 * Brand size token.
 */
export type BrandSize = "md";

/**
 * Called when a linked Brand is activated.
 */
export type BrandOnNavigate = (event: Event, brand: ComposedBrand) => void;

/**
 * Options for Brand().
 */
export interface BrandOptions extends BaseCompositionOptions {
    name: BrandCompositionContent;
    nameTag?: BrandNameTagName;
    maxWidth?: string | null;
    href?: string | null;
    logo?: BrandCompositionContent | null;
    logoAspectRatio?: string | null;
    logoSize?: string | null;
    logoMinSize?: string | null;
    logoMaxSize?: string | null;
    logoScale?: number | null;
    logoOffsetY?: string | null;
    tagline?: BrandCompositionContent | null;
    logoPosition?: BrandLogoPosition;
    label?: string | null;
    external?: boolean;
    target?: LinkTarget | null;
    rel?: string | null;
    variant?: BrandVariant;
    size?: BrandSize;
    logoOptions?: BaseCompositionOptions;
    nameOptions?: BaseCompositionOptions;
    taglineOptions?: BaseCompositionOptions;
    onNavigate?: BrandOnNavigate | null;
}

/**
 * Options accepted by ComposedBrand.update().
 */
export interface BrandUpdateOptions extends Partial<Omit<BrandOptions, "href" | "nameTag">> {}

/**
 * Brand identity block created by the composition API.
 */
export interface ComposedBrand extends ComposedNode<BrandElement> {
    readonly element: BrandElement;
    readonly content: HTMLElement;
    readonly logo: HTMLElement;
    readonly text: HTMLElement;
    readonly name: HTMLElement;
    readonly tagline: HTMLElement;
    setLogo(content: BrandCompositionContent | null): void;
    setName(content: BrandCompositionContent): void;
    setTagline(content: BrandCompositionContent | null): void;
    update(options: BrandUpdateOptions): void;
    destroy(): void;
}

function getLinkOptions(
    options: Partial<Pick<BrandOptions, "href" | "external" | "target" | "rel">>,
    onNavigate: (event: Event) => void
): LinkOptions {
    const linkOptions: LinkOptions = {
        onNavigate
    };

    if ("href" in options) linkOptions.href = options.href ?? null;
    if (options.external !== undefined) linkOptions.external = options.external;
    if ("target" in options) linkOptions.target = options.target ?? null;
    if ("rel" in options) linkOptions.rel = options.rel ?? null;

    return linkOptions;
}

/**
 * Creates a compact brand identity block for headers and app shells.
 */
export function Brand(options: BrandOptions): ComposedBrand {
    const linked = options.href !== undefined && options.href !== null;
    const element = createElement(linked ? "a" : "div", getCompositionElementOptions(options, {
        "data-af-composition": "brand"
    })) as BrandElement;

    const content = createElement("span", {
        attributes: { "data-af-brand-content": "" }
    });

    const logo = createElement("span", getCompositionElementOptions(options.logoOptions, {
        "data-af-brand-logo": ""
    }));

    const text = createElement("span", {
        attributes: { "data-af-brand-text": "" }
    });

    const name = createElement(options.nameTag ?? "span", getCompositionElementOptions(options.nameOptions, {
        "data-af-brand-name": ""
    })) as HTMLElement;

    const tagline = createElement("span", getCompositionElementOptions(options.taglineOptions, {
        "data-af-brand-tagline": ""
    }));

    const logoSlot = createContentSlot(logo, toCompositionChildren(options.logo));
    const nameSlot = createContentSlot(name, toCompositionChildren(options.name));
    const taglineSlot = createContentSlot(tagline, toCompositionChildren(options.tagline));

    let composed!: ComposedBrand;
    let logoContent = options.logo;
    let maxWidth = options.maxWidth ?? null;
    let logoAspectRatio = options.logoAspectRatio ?? null;
    let logoSize = options.logoSize ?? null;
    let logoMinSize = options.logoMinSize ?? null;
    let logoMaxSize = options.logoMaxSize ?? null;
    let logoScale = options.logoScale ?? null;
    let logoOffsetY = options.logoOffsetY ?? null;
    let taglineContent = options.tagline;
    let logoPosition: BrandLogoPosition = options.logoPosition ?? "start";
    let label = options.label;
    let variant: BrandVariant = options.variant ?? "default";
    let size: BrandSize = options.size ?? "md";
    let onNavigate = options.onNavigate ?? null;

    const handleNavigate = (event: Event): void => {
        onNavigate?.(event, composed);
    };

    const link = linked
        ? createLink(element, getLinkOptions(options, handleNavigate))
        : null;

    function syncStructure(): void {
        content.replaceChildren();

        if (logoPosition === "end") {
            content.append(text, logo);
        } else {
            content.append(logo, text);
        }

        text.replaceChildren(name, tagline);
    }

    function syncBrandCssVariable(name: string, value: string | null): void {
        if (value === null || !value.trim()) {
            element.style.removeProperty(name);
            return;
        }

        element.style.setProperty(name, value);
    }

    function syncLogoTuning(): void {
        syncBrandCssVariable("--af-brand-max-width", maxWidth);
        syncBrandCssVariable("--af-brand-logo-aspect-ratio", logoAspectRatio);
        syncBrandCssVariable("--af-brand-logo-size", logoSize);
        syncBrandCssVariable("--af-brand-logo-min-size", logoMinSize);
        syncBrandCssVariable("--af-brand-logo-max-size", logoMaxSize);
        syncBrandCssVariable("--af-brand-logo-offset-y", logoOffsetY);

        if (logoScale === null) {
            element.style.removeProperty("--af-brand-logo-scale");
        } else {
            element.style.setProperty("--af-brand-logo-scale", String(logoScale));
        }
    }

    function sync(): void {
        element.setAttribute("data-af-composition", "brand");
        element.setAttribute("data-af-logo-position", logoPosition);
        element.setAttribute("data-af-variant", variant);
        element.setAttribute("data-af-size", size);

        logo.hidden = !hasCompositionContent(logoContent);
        tagline.hidden = !hasCompositionContent(taglineContent);
        syncLogoTuning();

        if (label === undefined || label === null || !label.trim()) {
            element.removeAttribute("aria-label");
        } else {
            element.setAttribute("aria-label", label);
        }
    }

    function setLogo(content: BrandCompositionContent | null): void {
        logoContent = content;
        logoSlot.set(toCompositionChildren(content));
        sync();
    }

    function setName(content: BrandCompositionContent): void {
        nameSlot.set(toCompositionChildren(content));
    }

    function setTagline(content: BrandCompositionContent | null): void {
        taglineContent = content;
        taglineSlot.set(toCompositionChildren(content));
        sync();
    }

    syncStructure();
    sync();
    element.append(content);

    composed = {
        element,
        content,
        logo,
        text,
        name,
        tagline,
        setLogo,
        setName,
        setTagline,

        update(nextOptions): void {
            applyCompositionElementOptions(element, nextOptions);

            if (nextOptions.logoOptions !== undefined) {
                applyCompositionElementOptions(logo, nextOptions.logoOptions);
                logo.setAttribute("data-af-brand-logo", "");
            }

            if (nextOptions.nameOptions !== undefined) {
                applyCompositionElementOptions(name, nextOptions.nameOptions);
                name.setAttribute("data-af-brand-name", "");
            }

            if (nextOptions.taglineOptions !== undefined) {
                applyCompositionElementOptions(tagline, nextOptions.taglineOptions);
                tagline.setAttribute("data-af-brand-tagline", "");
            }

            if (nextOptions.logoPosition !== undefined) {
                logoPosition = nextOptions.logoPosition;
                syncStructure();
            }

            if ("maxWidth" in nextOptions) {
                maxWidth = nextOptions.maxWidth ?? null;
            }

            if ("logoAspectRatio" in nextOptions) {
                logoAspectRatio = nextOptions.logoAspectRatio ?? null;
            }

            if ("logoSize" in nextOptions) {
                logoSize = nextOptions.logoSize ?? null;
            }

            if ("logoMinSize" in nextOptions) {
                logoMinSize = nextOptions.logoMinSize ?? null;
            }

            if ("logoMaxSize" in nextOptions) {
                logoMaxSize = nextOptions.logoMaxSize ?? null;
            }

            if ("logoScale" in nextOptions) {
                logoScale = nextOptions.logoScale ?? null;
            }

            if ("logoOffsetY" in nextOptions) {
                logoOffsetY = nextOptions.logoOffsetY ?? null;
            }

            if ("label" in nextOptions) label = nextOptions.label ?? null;
            if (nextOptions.variant !== undefined) variant = nextOptions.variant;
            if (nextOptions.size !== undefined) size = nextOptions.size;
            if ("onNavigate" in nextOptions) onNavigate = nextOptions.onNavigate ?? null;

            if ("logo" in nextOptions) setLogo(nextOptions.logo ?? null);
            if (nextOptions.name !== undefined) setName(nextOptions.name);
            if ("tagline" in nextOptions) setTagline(nextOptions.tagline ?? null);

            link?.update(getLinkOptions(nextOptions, handleNavigate));
            sync();
        },

        destroy(): void {
            logoSlot.dispose();
            nameSlot.dispose();
            taglineSlot.dispose();
            link?.destroy();
        }
    };

    return composed;
}
