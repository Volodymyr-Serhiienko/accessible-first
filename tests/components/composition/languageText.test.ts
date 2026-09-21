import { describe, expect, it } from "vitest";
import { LanguageText } from "../../../packages/components/src/composition";

describe("LanguageText", () => {
    it("marks primary text and an optional pronunciation with their own language metadata", () => {
        const text = LanguageText({
            text: "苹果",
            lang: "zh-CN",
            dir: "ltr",
            pronunciation: {
                text: "píngguǒ",
                lang: "zh-Latn-pinyin",
                prefix: " (",
                suffix: ")"
            }
        });
        const pronunciation = text.element.querySelector("span");

        expect(text.element.getAttribute("lang")).toBe("zh-CN");
        expect(text.element.getAttribute("dir")).toBe("ltr");
        expect(text.element.getAttribute("data-af-composition"))
            .toBe("language-text");
        expect(text.element.textContent).toBe("苹果 (píngguǒ)");
        expect(pronunciation?.getAttribute("lang")).toBe("zh-Latn-pinyin");
    });

    it("updates language metadata and removes an obsolete pronunciation", () => {
        const text = LanguageText({
            text: "яблоко",
            lang: "ru-RU",
            dir: "ltr",
            pronunciation: {
                text: "yabloko",
                lang: "ru-Latn"
            }
        });

        text.update({
            text: "an apple",
            lang: "en-GB"
        });

        expect(text.element.getAttribute("lang")).toBe("en-GB");
        expect(text.element.getAttribute("dir")).toBeNull();
        expect(text.element.textContent).toBe("an apple");
        expect(text.element.querySelector("span")).toBeNull();
    });
});
