import { Icon, type ComposedNode, type ElementAttributes } from "./af";

export const demoOutlineIconAttributes: ElementAttributes = {
    fill: "none",
    stroke: "currentColor",
    "stroke-width": 2,
    "stroke-linecap": "round",
    "stroke-linejoin": "round"
};

export const demoIconPaths = {
    check: "M5 13l4 4L19 7",
    checkCircle: "M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
    search: "m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z",
    lesson: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5Zm0 0v-15",
    warning: "M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
} as const;

export function DemoIcon(path: string, size = "3rem"): ComposedNode {
    return Icon({
        path,
        decorative: true,
        size,
        pathAttributes: demoOutlineIconAttributes
    });
}
