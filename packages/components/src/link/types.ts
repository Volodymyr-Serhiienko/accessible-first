import type { Component } from "../foundation";

/**
 * Defines the structural layout or visual style theme variants for a link element.
 */
export type LinkVariant = "default" | "muted" | "standalone";

/**
 * Defines the spatial or typographic sizing layout variant of a link element.
 */
export type LinkSize = "md";

/**
 * Declares the target browsing context or window scope where the linked resource will open.
 * Supports standard browser keywords alongside raw string tokens for targeting custom iframes or tabs.
 */
export type LinkTarget = "_self" | "_blank" | "_parent" | "_top" | (string & {});

/**
 * Indicates that the link represents the current item within a container structure under WAI-ARIA tokens.
 */
export type LinkCurrent = boolean | "page" | "step" | "location" | "date" | "time" | null;

/**
 * Configuration options used to initialize an interactive, accessible anchor link component.
 */
export interface LinkOptions {
    href?: string | null;
    disabled?: boolean;
    external?: boolean;
    target?: LinkTarget | null;
    rel?: string | null;
    current?: LinkCurrent;
    variant?: LinkVariant;
    size?: LinkSize;
    onNavigate?: ((event: Event) => void) | null;
}

/**
 * Interface representing an accessible interactive anchor link component.
 * Synchronizes native hyper-linking configurations (`href`, `target`, `rel`) alongside 
 * interactive states, active context signatures (`aria-current`), and custom design variants.
 */
export interface Link extends Component {
    setHref(href: string | null): void;
    getHref(): string | null;
    setDisabled(disabled: boolean): void;
    isDisabled(): boolean;
    setExternal(external: boolean): void;
    setCurrent(current: LinkCurrent): void;
    update(options: Partial<LinkOptions>): void;
}
