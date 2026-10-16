import {
    applyCompositionElementOptions,
    createContentSlot,
    createElement,
    hasCompositionContent,
    toCompositionChildren,
    type BaseCompositionOptions,
    type ComposedNode,
    type CompositionChild,
    type CompositionContent
} from "../composition";
import type { DocumentMetadataUpdateOptions } from "../document-metadata";
import { runCleanups } from "../../../core/src/events";
import { getDestroyer } from "../composition/append";
import { createPreparedContentOwner, type PreparedContentOwner } from "../composition/preparedContent";
import {
    createPage,
    type Page,
    type PageDiagnosticsOptions,
    type PageDiagnosticsReport,
    type PageOptions,
    type PageUpdateOptions
} from "../page";
import {
    applyPageLayout,
    type PageLayoutController,
    type PageLayoutOptions
} from "../page-layout";
import {
    PageOutlet,
    type ComposedPageOutlet,
    type PageOutletFocusTarget,
    type PageOutletOptions,
    type PageOutletRenderOptions,
    type PageOutletUpdateOptions
} from "../page-outlet";

/**
 * Content accepted by AppShell slots.
 */
export type AppShellCompositionContent = CompositionContent;

/**
 * PageOutlet options accepted by AppShell.
 * Initial outlet children are provided through AppShell.content.
 */
export type AppShellOutletOptions = Omit<PageOutletOptions, "children">;

/**
 * PageOutlet update options accepted by AppShell.update().
 * Dynamic screen content should be changed through AppShell.render().
 */
export type AppShellOutletUpdateOptions = Omit<PageOutletUpdateOptions, "children">;

/**
 * Options for AppShell(), the high-level application page scaffold.
 */
export interface AppShellOptions extends BaseCompositionOptions {
    title?: PageOptions["title"];
    mainId?: PageOptions["mainId"];
    skipLink?: PageOptions["skipLink"];
    skipLinkTargetId?: PageOptions["skipLinkTargetId"];
    navigationLabel?: PageOptions["navigationLabel"];
    locale?: PageOptions["locale"];
    theme?: PageOptions["theme"];
    header?: AppShellCompositionContent | null;
    navigation?: AppShellCompositionContent | null;
    beforeOutlet?: AppShellCompositionContent | null;
    content?: AppShellCompositionContent | null;
    afterOutlet?: AppShellCompositionContent | null;
    footer?: AppShellCompositionContent | null;
    outletOptions?: AppShellOutletOptions;
    layout?: PageLayoutOptions | false;
    inspect?: boolean | PageDiagnosticsOptions;
    metadata?: PageOptions["metadata"];
}

/**
 * Options accepted by ComposedAppShell.update().
 */
export interface AppShellUpdateOptions extends Partial<BaseCompositionOptions> {
    title?: PageOptions["title"];
    skipLink?: PageOptions["skipLink"];
    skipLinkTargetId?: PageOptions["skipLinkTargetId"];
    navigationLabel?: PageOptions["navigationLabel"];
    locale?: PageOptions["locale"];
    metadata?: DocumentMetadataUpdateOptions;
    header?: AppShellCompositionContent | null;
    navigation?: AppShellCompositionContent | null;
    beforeOutlet?: AppShellCompositionContent | null;
    afterOutlet?: AppShellCompositionContent | null;
    footer?: AppShellCompositionContent | null;
    outletOptions?: AppShellOutletUpdateOptions;
    layout?: PageLayoutOptions | false;
}

/**
 * Application shell created by the composition API.
 */
export interface ComposedAppShell extends ComposedNode<HTMLElement> {
    readonly element: HTMLElement;
    readonly page: Page;
    readonly outlet: ComposedPageOutlet;
    readonly layout: PageLayoutController | null;
    setHeader(content: AppShellCompositionContent | null): ComposedAppShell;
    setNavigation(content: AppShellCompositionContent | null): ComposedAppShell;
    setBeforeOutlet(content: AppShellCompositionContent | null): ComposedAppShell;
    setAfterOutlet(content: AppShellCompositionContent | null): ComposedAppShell;
    setFooter(content: AppShellCompositionContent | null): ComposedAppShell;
    render(content: AppShellCompositionContent | null, options?: PageOutletRenderOptions): ComposedAppShell;
    focus(target?: PageOutletFocusTarget): boolean;
    updateMetadata(options: DocumentMetadataUpdateOptions): ComposedAppShell;
    inspect(options?: PageDiagnosticsOptions): PageDiagnosticsReport;
    update(options: AppShellUpdateOptions): void;
    destroy(): void;
    isDestroyed(): boolean;
}

type AppShellSlotContent = Exclude<AppShellCompositionContent, undefined> | null;

function normalizeSlotContent(content: AppShellCompositionContent | null): AppShellSlotContent {
    return content === undefined ? null : content;
}

function getPageOptions(options: AppShellOptions): PageOptions {
    const pageOptions: PageOptions = {};

    if (options.title !== undefined) pageOptions.title = options.title;
    if (options.mainId !== undefined) pageOptions.mainId = options.mainId;
    if (options.skipLink !== undefined) pageOptions.skipLink = options.skipLink;
    if (options.skipLinkTargetId !== undefined) pageOptions.skipLinkTargetId = options.skipLinkTargetId;
    if (options.navigationLabel !== undefined) pageOptions.navigationLabel = options.navigationLabel;
    if ("locale" in options) pageOptions.locale = options.locale ?? null;
    if (options.theme !== undefined) pageOptions.theme = options.theme;
    if (options.metadata !== undefined) pageOptions.metadata = options.metadata;

    return pageOptions;
}

function getPageUpdateOptions(options: AppShellUpdateOptions): PageUpdateOptions {
    const pageOptions: PageUpdateOptions = {};

    if (options.title !== undefined) pageOptions.title = options.title;
    if (options.skipLink !== undefined) pageOptions.skipLink = options.skipLink;
    if (options.skipLinkTargetId !== undefined) pageOptions.skipLinkTargetId = options.skipLinkTargetId;
    if (options.navigationLabel !== undefined) pageOptions.navigationLabel = options.navigationLabel;
    if ("locale" in options) pageOptions.locale = options.locale ?? null;
    if (options.metadata !== undefined) pageOptions.metadata = options.metadata;

    return pageOptions;
}

function hasPageUpdateOptions(options: PageUpdateOptions): boolean {
    return Object.keys(options).length > 0;
}

function getOutletOptions(options: AppShellOptions): PageOutletOptions {
    const outletOptions: PageOutletOptions = {
        ...(options.outletOptions ?? {})
    };

    const content = normalizeSlotContent(options.content);

    if (hasCompositionContent(content)) {
        outletOptions.children = toCompositionChildren(content);
    }

    return outletOptions;
}

/**
 * Creates a semantic application shell with stable page regions and a PageOutlet.
 */
export function AppShell(options: AppShellOptions = {}): ComposedAppShell {
    const initialChildren = [
        ...toCompositionChildren(options.header),
        ...toCompositionChildren(options.navigation),
        ...toCompositionChildren(options.beforeOutlet),
        ...toCompositionChildren(options.content),
        ...toCompositionChildren(options.afterOutlet),
        ...toCompositionChildren(options.footer)
    ];
    const pending = new Set(initialChildren);
    let preparedOwner: PreparedContentOwner | null = null;
    const constructionCleanups: Array<() => void> = [() => {
        const abandoned = [...pending];
        pending.clear();
        runCleanups(abandoned.reverse().map(child => () => getDestroyer(child)?.()));
    }];

    function accept(children: CompositionChild[]): CompositionChild[] {
        for (const child of children) pending.delete(child);
        preparedOwner?.accept(children);
        return children;
    }

    try {
        const page = createPage(getPageOptions(options));
        constructionCleanups.push(page.destroy);
        const outletOptions = getOutletOptions(options);
        if (outletOptions.children) accept(outletOptions.children);
        const outlet = PageOutlet(outletOptions);
        constructionCleanups.push(outlet.destroy);

        const beforeOutletElement = createElement("div", {
            attributes: {
                "data-af-app-shell-before-outlet": ""
            }
        });

        const afterOutletElement = createElement("div", {
            attributes: {
                "data-af-app-shell-after-outlet": ""
            }
        });

        let composed!: ComposedAppShell;
        let layoutController: PageLayoutController | null = null;
        let headerContent: AppShellSlotContent = normalizeSlotContent(options.header);
        let navigationContent: AppShellSlotContent = normalizeSlotContent(options.navigation);
        let beforeOutletContent: AppShellSlotContent = normalizeSlotContent(options.beforeOutlet);
        let afterOutletContent: AppShellSlotContent = normalizeSlotContent(options.afterOutlet);
        let footerContent: AppShellSlotContent = normalizeSlotContent(options.footer);
        let destroyed = false;
        let revision = 0;

        const beforeOutletSlot = createContentSlot(
            beforeOutletElement,
            accept(toCompositionChildren(beforeOutletContent))
        );
        constructionCleanups.push(beforeOutletSlot.dispose);

        const afterOutletSlot = createContentSlot(
            afterOutletElement,
            accept(toCompositionChildren(afterOutletContent))
        );
        constructionCleanups.push(afterOutletSlot.dispose);
        constructionCleanups.push(() => {
            const layout = layoutController;
            layoutController = null;
            layout?.destroy();
        });

        function syncRootAttributes(): void {
            page.element.setAttribute("data-af-composition", "app-shell");
            page.element.setAttribute("data-af-app-shell", "");
        }

        function syncPageRegion(
            selector: string,
            content: AppShellSlotContent,
            setRegionContent: (children: CompositionChild[]) => void
        ): void {
            if (destroyed) return;
            const current = revision;
            const hasContent = hasCompositionContent(content);
            const existingRegion = page.element.querySelector<HTMLElement>(selector);

            if (hasContent) {
                runCleanups([
                    () => setRegionContent(accept(toCompositionChildren(content))),
                    () => {
                        if (!destroyed && current === revision) {
                            page.element.querySelector<HTMLElement>(selector)!.hidden = false;
                        }
                    }
                ]);
                return;
            }

            if (existingRegion) {
                runCleanups([
                    () => setRegionContent([]),
                    () => {
                        if (!destroyed && current === revision) existingRegion.hidden = true;
                    }
                ]);
            }
        }

        function syncHeader(): void {
            syncPageRegion("[data-af-page-header]", headerContent, (children) => {
                page.header(...children);
            });
        }

        function syncNavigation(): void {
            syncPageRegion("[data-af-page-navigation]", navigationContent, (children) => {
                page.navigation(...children);
            });
        }

        function syncFooter(): void {
            syncPageRegion("[data-af-page-footer]", footerContent, (children) => {
                page.footer(...children);
            });
        }

        function syncOutletSlots(): void {
            if (destroyed) return;
            beforeOutletElement.hidden = !hasCompositionContent(beforeOutletContent);
            afterOutletElement.hidden = !hasCompositionContent(afterOutletContent);
        }

        function syncLayout(nextLayout: PageLayoutOptions | false | undefined): void {
            if (destroyed) return;
            const current = revision;
            if (nextLayout === false) {
                const previous = layoutController;
                layoutController = null;
                previous?.destroy();
                return;
            }

            if (layoutController) {
                layoutController.update(nextLayout ?? {});
                return;
            }

            const candidate = applyPageLayout(page, nextLayout ?? {});
            if (destroyed || current !== revision) candidate.destroy();
            else layoutController = candidate;
        }

        applyCompositionElementOptions(page.element, options);
        syncRootAttributes();

        page.main.replaceChildren(
            beforeOutletElement,
            outlet.element,
            afterOutletElement
        );

        syncHeader();
        syncNavigation();
        syncFooter();
        syncOutletSlots();
        syncLayout(options.layout);

        if (options.inspect !== undefined && options.inspect !== false) {
            page.inspect(options.inspect === true ? {} : options.inspect);
        }

        composed = {
            get element(): HTMLElement {
                return page.element;
            },

            page,
            outlet,

            get layout(): PageLayoutController | null {
                return layoutController;
            },

            setHeader(content): ComposedAppShell {
                if (destroyed) return composed;
                composed.update({ header: content });

                return composed;
            },

            setNavigation(content): ComposedAppShell {
                if (destroyed) return composed;

                composed.update({ navigation: content });

                return composed;
            },

            setBeforeOutlet(content): ComposedAppShell {
                if (destroyed) return composed;

                composed.update({ beforeOutlet: content });

                return composed;
            },

            setAfterOutlet(content): ComposedAppShell {
                if (destroyed) return composed;

                composed.update({ afterOutlet: content });

                return composed;
            },

            setFooter(content): ComposedAppShell {
                if (destroyed) return composed;

                composed.update({ footer: content });

                return composed;
            },

            render(content, renderOptions = {}): ComposedAppShell {
                if (destroyed) return composed;

                outlet.render(content, renderOptions);

                return composed;
            },

            focus(target): boolean {
                if (destroyed) return false;

                return outlet.focus(target);
            },

            updateMetadata(metadataOptions): ComposedAppShell {
                if (destroyed) return composed;
                revision += 1;
                page.updateMetadata(metadataOptions);

                return composed;
            },

            inspect(inspectOptions = {}): PageDiagnosticsReport {
                return page.inspect(inspectOptions);
            },

            update(nextOptions): void {
                if (destroyed) return;
                const current = ++revision;
                const isCurrent = (): boolean => !destroyed && current === revision;
                nextOptions = { ...nextOptions };
                const candidates = [
                    ...toCompositionChildren(nextOptions.header), ...toCompositionChildren(nextOptions.navigation),
                    ...toCompositionChildren(nextOptions.beforeOutlet), ...toCompositionChildren(nextOptions.afterOutlet),
                    ...toCompositionChildren(nextOptions.footer)
                ];
                runCleanups([
                    () => {
                        if (!isCurrent()) return;
                        applyCompositionElementOptions(page.element, nextOptions);
                        syncRootAttributes();
                        const pageUpdateOptions = getPageUpdateOptions(nextOptions);
                        if (hasPageUpdateOptions(pageUpdateOptions)) page.update(pageUpdateOptions);
                    },
                    () => {
                        if (!isCurrent() || !("header" in nextOptions)) return;
                        headerContent = normalizeSlotContent(nextOptions.header ?? null);
                        syncHeader();
                    },
                    () => {
                        if (!isCurrent() || !("navigation" in nextOptions)) return;
                        navigationContent = normalizeSlotContent(nextOptions.navigation ?? null);
                        syncNavigation();
                    },
                    () => {
                        if (!isCurrent() || !("beforeOutlet" in nextOptions)) return;
                        beforeOutletContent = normalizeSlotContent(nextOptions.beforeOutlet ?? null);
                        runCleanups([
                            () => beforeOutletSlot.set(accept(toCompositionChildren(beforeOutletContent))),
                            syncOutletSlots
                        ]);
                    },
                    () => {
                        if (!isCurrent() || !("afterOutlet" in nextOptions)) return;
                        afterOutletContent = normalizeSlotContent(nextOptions.afterOutlet ?? null);
                        runCleanups([
                            () => afterOutletSlot.set(accept(toCompositionChildren(afterOutletContent))),
                            syncOutletSlots
                        ]);
                    },
                    () => {
                        if (!isCurrent() || !("footer" in nextOptions)) return;
                        footerContent = normalizeSlotContent(nextOptions.footer ?? null);
                        syncFooter();
                    },
                    () => {
                        if (isCurrent() && nextOptions.outletOptions !== undefined) outlet.update(nextOptions.outletOptions);
                    },
                    () => {
                        if (isCurrent() && "layout" in nextOptions) syncLayout(nextOptions.layout);
                    },
                    () => preparedOwner?.discard(candidates)
                ]);
            },

            destroy(): void {
                if (destroyed) return;

                destroyed = true;
                revision += 1;
                runCleanups([...constructionCleanups].reverse());
            },

            isDestroyed(): boolean {
                return destroyed;
            }
        };

        preparedOwner = createPreparedContentOwner(composed, [outlet]);
        preparedOwner.accept(initialChildren);
        return composed;
    } catch (error) {
        try { runCleanups([...constructionCleanups].reverse()); } catch { /* Preserve the construction failure. */ }
        throw error;
    }
}
