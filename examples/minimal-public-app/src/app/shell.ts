import {
    Small,
    type PublicHashAppTemplateShellOptions
} from "../../../../packages/components/src";
import { appIdentity } from "./identity";

export function getShellOptions(): PublicHashAppTemplateShellOptions {
    return {
        title: appIdentity.name,
        skipLink: "Skip to content",
        metadata: {
            robots: "index,follow"
        },
        footer: Small("Accessible First minimal public app template."),
        outletOptions: {
            label: "Application content",
            announcement: false,
            scrollOnRender: true
        },
        layout: {
            chrome: "normal",
            maxWidth: "64rem",
            gutter: "clamp(1rem, 5vw, 2rem)",
            mainGap: "1rem",
            mainPaddingBlock: "2rem 3rem"
        }
    };
}
