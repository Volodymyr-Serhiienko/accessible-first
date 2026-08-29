import { type PublicHashAppTemplateRouteChromeBaseOptions } from "../../../../packages/components/src";
import { appIdentity } from "./identity";
import type { MinimalAppRoute } from "./routes";

export function getRouteChromeOptions(): PublicHashAppTemplateRouteChromeBaseOptions<MinimalAppRoute> {
    return {
        header: {
            identity: appIdentity,
            brand: {
                href: "#main",
                tagline: "Minimal app template",
                maxWidth: "24rem",
                logoScale: 1.6,
                logoOffsetY: "0.2rem"
            }
        }
    };
}
