import {
    P,
    Screen,
    Section,
    Stack,
    Strong,
    type CompositionContent
} from "../../../../packages/components/src";
import { t } from "../localization";

export function HomePage(): CompositionContent {
    return Screen({
        title: t("home.title"),
        description: t("home.description"),
        descriptionMode: "content",
        headingLevel: 1,
        children: [
            Stack(
                Section({
                    title: t("home.intro.title"),
                    children: [
                        P(Strong(t("app.frameworkName")), " ", t("home.intro.p1")),
                        P(t("home.intro.p2"))
                    ]
                }),
                Section({
                    title: t("home.build.title"),
                    children: [
                        P(t("home.build.p1")),
                        P(t("home.build.p2"))
                    ]
                }),
                Section({
                    title: t("home.next.title"),
                    children: [
                        P(t("home.next.p1")),
                        P(t("home.next.p2"))
                    ]
                })
            )
        ]
    });
}
