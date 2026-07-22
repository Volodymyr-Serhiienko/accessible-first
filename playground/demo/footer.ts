import { P, Small, Stack, type ComposedNode } from "./af";

export function FooterDemo(): ComposedNode {
    return Stack(
        { className: "playground-footer__inner" },
        P(Small("Accessible First playground. Living documentation for the component and page-building API."))
    );
}
