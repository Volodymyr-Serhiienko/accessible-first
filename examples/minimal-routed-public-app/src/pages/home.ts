import {
    P,
    Section,
    Stack,
    Strong,
    type CompositionContent
} from "../../../../packages/components/src";
import { t } from "../localization";

export function HomePage(): CompositionContent {
    return Stack(
        Section({
            title: t("home.start.title"),
            children: [
                P(Strong(t("app.frameworkName")), " ", t("home.start.p1")),
                P(t("home.start.p2"))
            ]
        }),
        Section({
            title: t("home.gives.title"),
            children: [
                P(t("home.gives.p1")),
                P(t("home.gives.p2"))
            ]
        })
    );
}
