import {
    P,
    Section,
    Stack,
    type CompositionContent
} from "../../../../packages/components/src";
import { t } from "../localization";

export function AboutPage(): CompositionContent {
    return Stack(
        Section({
            title: t("template.about.title"),
            children: [
                P(t("template.about.p1")),
                P(t("template.about.p2"))
            ]
        }),
        Section({
            title: t("template.grow.title"),
            children: [
                P(t("template.grow.p1")),
                P(t("template.grow.p2"))
            ]
        })
    );
}
