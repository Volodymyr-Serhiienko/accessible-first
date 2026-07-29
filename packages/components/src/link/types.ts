import type { Component } from "../foundation";

/**
 * Visual style variant for a link.
 */
export type LinkVariant = "default" | "muted" | "standalone";

/**
 * Link size token.
 */
export type LinkSize = "md";

/**
 * Browser target used by a link.
 */
export type LinkTarget = "_self" | "_blank" | "_parent" | "_top" | (string & {});

/**
 * aria-current value for links that represent the current item.
 */
export type LinkCurrent = boolean | "page" | "step" | "location" | "date" | "time" | null;

/**
 * Options for createLink().
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
 * Link behavior controller returned by createLink().
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
