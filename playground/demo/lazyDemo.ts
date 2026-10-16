import { Button, LazyContent, P, Stack, type ComposedNode } from "./af";
import { playgroundLocale, t } from "./localization";

/** Loads one demo without preloading the full catalog or creating an obsolete view. */
export function createLazyDemo(load: () => Promise<() => ComposedNode>): () => ComposedNode {
    return () => LazyContent({
        load: async () => {
            const render = await load();
            return () => {
                const content = render();
                content.element.lang = "en";
                return content;
            };
        },
        pendingContent: () => P({ attributes: { lang: playgroundLocale.getLocale() } }, t("app.demo.loading")),
        // Browsers can retain failed module imports for the lifetime of this document.
        failureContent: () => Stack({ attributes: { lang: playgroundLocale.getLocale() } },
            P({ attributes: { role: "status" } }, t("app.demo.failed")),
            Button({ text: t("app.demo.reload"), onPress: () => window.location.reload() })),
        pendingOptions: { pendingMessage: false }
    });
}
