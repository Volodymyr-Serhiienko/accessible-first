import {
    Small,
    type ComposedNode
} from "../../../../packages/components/src";
import { t } from "../localization";

export function Footer(): ComposedNode {
    return Small(t("footer.text"));
}
