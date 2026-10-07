import type { SpeechSegment } from "../../packages/core/src/speech";
import type { PilotRecording } from "./catalog";

export const materialItems = [
    { value: "0", label: "Слово" }, { value: "1", label: "Предложение" }, { value: "2", label: "Грамматика" },
    { value: "letter", label: "Буква или иероглиф" }, { value: "space", label: "Пробел" },
    { value: "sequence", label: "Символ — пробел — символ" }, { value: "alphabet", label: "Все буквы или чтения" },
    { value: "digits", label: "Цифры" }, { value: "custom", label: "Спеллинг текста" },
    { value: "all", label: "Все обычные фрагменты" }
];

/** Builds requests from the selected language catalog, without generating audio. */
export function pilotMaterial(recordings: readonly PilotRecording[], language: string, selected: string, customText: string): {
    text: string; voice: string; segments: readonly SpeechSegment[];
} {
    const entries = recordings.filter((entry) => entry.language === language);
    const reading = entries.filter((entry) => entry.mode === "text");
    const letters = entries.filter((entry) => entry.mode === "spell" && /\p{L}/u.test(entry.text));
    const digits = entries.filter((entry) => entry.mode === "spell" && /^\p{Nd}$/u.test(entry.text));
    const space = entries.find((entry) => entry.mode === "spell" && !entry.text.trim());
    const first = letters[0]?.text ?? "";
    const spellText = selected === "custom" ? customText
        : selected === "alphabet" ? letters.map((entry) => entry.text).join("")
        : selected === "digits" ? digits.map((entry) => entry.text).join("")
        : selected === "sequence" ? `${first} ${first}` : selected === "space" ? " " : first;
    if (["letter", "space", "sequence", "alphabet", "digits", "custom"].includes(selected)) {
        return {
            text: spellText.trim() ? spellText : space?.whitespaceText ?? "",
            voice: letters[0]?.voice ?? digits[0]?.voice ?? "",
            segments: [{ text: spellText, language, mode: "spell",
                ...(space?.whitespaceText ? { spellWhitespaceText: space.whitespaceText } : {}) }]
        };
    }
    const chosen = selected === "all" ? reading : reading.slice(Number(selected), Number(selected) + 1);
    return { text: chosen.map((entry) => entry.text).join(" · "), voice: chosen[0]?.voice ?? "",
        segments: chosen.map((entry) => ({ text: entry.text, language, mode: "text" })) };
}
