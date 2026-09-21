import { createElement } from "./createElement";
import { getCompositionElementOptions } from "./options";
import type { BaseCompositionOptions, ComposedNode } from "./types";

/** Direction metadata for a language-specific text fragment. */
export type LanguageTextDirection = "ltr" | "rtl" | "auto";

/** An optional reading aid displayed after language-specific text. */
export interface LanguageTextPronunciation {
    text: string;
    /** BCP 47 language tag for the pronunciation notation. */
    lang: string;
    dir?: LanguageTextDirection;
    prefix?: string;
    suffix?: string;
}

/** Text and language metadata managed by LanguageText(). */
export interface LanguageTextContentOptions {
    text: string;
    /** BCP 47 language tag for the primary text. */
    lang: string;
    dir?: LanguageTextDirection;
    pronunciation?: LanguageTextPronunciation | null;
}

/** Options for LanguageText(). */
export interface LanguageTextOptions extends BaseCompositionOptions, LanguageTextContentOptions {}

/** A language-specific text fragment that can be updated in place. */
export interface ComposedLanguageText extends ComposedNode<HTMLSpanElement> {
    update(options: LanguageTextContentOptions): void;
}

function setDirection(
    element: HTMLElement,
    direction: LanguageTextDirection | undefined
): void {
    if (direction === undefined) {
        element.removeAttribute("dir");
        return;
    }

    element.dir = direction;
}

function getPronunciationText(pronunciation: LanguageTextPronunciation): string {
    return `${pronunciation.prefix ?? " "}${pronunciation.text}${pronunciation.suffix ?? ""}`;
}

function renderLanguageText(
    element: HTMLSpanElement,
    options: LanguageTextContentOptions
): void {
    element.lang = options.lang;
    setDirection(element, options.dir);
    element.replaceChildren(options.text);

    const pronunciation = options.pronunciation;

    if (!pronunciation || !pronunciation.text.trim()) {
        return;
    }

    const pronunciationElement = element.ownerDocument.createElement("span");

    pronunciationElement.textContent = getPronunciationText(pronunciation);
    pronunciationElement.lang = pronunciation.lang;
    setDirection(pronunciationElement, pronunciation.dir);
    element.append(pronunciationElement);
}

/**
 * Creates a language-specific text fragment.
 *
 * Use it for a word, phrase, or passage whose language differs from the
 * surrounding content. It provides no ARIA role or live announcement.
 */
export function LanguageText(options: LanguageTextOptions): ComposedLanguageText {
    const element = createElement("span", getCompositionElementOptions(options, {
        "data-af-composition": "language-text"
    })) as HTMLSpanElement;

    function update(nextOptions: LanguageTextContentOptions): void {
        renderLanguageText(element, nextOptions);
    }

    update(options);

    return { element, update };
}
