import "../../packages/components/src/styles/index.css";
import "./styles.css";
import { H1, H2, P, Select, SpeechControls, StatusMessage, TextField } from "../../packages/components/src";
import { createAudioSpeechEngine, createAudioSpeechResolver, createAudioSpellingResolver, type SpeechRequest } from "../../packages/core/src/speech";
import { loadPilotRecordings, type PilotRecording } from "./catalog";
import { materialItems, pilotMaterial } from "./material";

const mount = document.querySelector<HTMLElement>("#app")!;
const heading = H1({ id: "page-title" }, "Озвучка");
const status = StatusMessage({ text: "Загрузка…", announcement: false });
mount.append(heading.element, status.element);
const controller = new AbortController();
window.addEventListener("pagehide", () => controller.abort(), { once: true });

void loadPilotRecordings(controller.signal).then((recordings) => {
    if (controller.signal.aborted) return;
    status.hide();
    createPilot(recordings);
}).catch(() => {
    if (!controller.signal.aborted) status.update({ text: "Аудиозаписи недоступны.", variant: "danger", announcement: true });
});

function createPilot(recordings: readonly PilotRecording[]): void {
    const names: Record<string, string> = {
        "ru-ru": "Русский", "uk-ua": "Украинский", "en-gb": "Английский", "nb-no": "Норвежский",
        "de-de": "Немецкий", "pl-pl": "Польский", "zh-cn": "Китайский, мандарин"
    };
    const languages = [...new Set(recordings.map((entry) => entry.language))];
    let language = languages[0]!;
    let selected = "0";
    const audio = document.createElement("audio");
    audio.hidden = true;
    audio.setAttribute("aria-hidden", "true");
    audio.dataset.pilotMedia = "";
    const read = createAudioSpeechResolver(recordings);
    const spell = createAudioSpellingResolver(recordings);
    const engine = createAudioSpeechEngine({
        resolveSegment: (segment, signal) => (segment.mode === "spell" ? spell : read)(segment, signal),
        createAudio: () => audio, supportsSpelling: true
    });
    const title = H2({ className: "pilot-text" });
    const voice = P({ className: "pilot-voice" });
    const content = document.createElement("section");
    content.setAttribute("aria-label", "Материал");
    content.append(title.element, voice.element);
    const languageSelect = Select({
        label: "Язык", value: language, items: languages.map((value) => ({ value, label: names[value.toLowerCase()] ?? value })),
        onValueChange: ({ value }) => {
            language = String(value);
            selected = "0";
            fragmentSelect.setValue(selected);
            resetCustomText();
            update();
        }
    });
    const fragmentSelect = Select({
        label: "Материал", value: selected, items: materialItems,
        onValueChange: ({ value }) => { selected = String(value); update(); }
    });
    const rate = range("Скорость", "rate", 0.5, 2, 0.1, 1);
    const volume = range("Громкость", "volume", 0, 1, 0.1, 1);
    const spellingField = TextField({ label: "Текст для спеллинга", maxLength: 256, autocomplete: "off", onValueInput: update });
    spellingField.element.classList.add("pilot-spelling-field");
    spellingField.control.setAttribute("spellcheck", "false");
    const controls = SpeechControls({
        engine, request: { segments: [] }, label: "Управление озвучкой",
        startText: "Начать", pauseText: "Пауза", resumeText: "Продолжить", stopText: "Остановить",
        pausedText: "Пауза.", stoppedText: "Остановлено.",
        unavailableText: "Нет записи для этого текста или символа.", failedText: "Не удалось воспроизвести аудио. Попробуйте снова."
    });
    const fields = document.createElement("div");
    fields.className = "pilot-fields";
    fields.append(languageSelect.element, fragmentSelect.element, spellingField.element, rate.label, volume.label);
    mount.append(fields, controls.element, content, audio);
    rate.input.addEventListener("input", update);
    volume.input.addEventListener("input", update);
    window.addEventListener("pagehide", () => engine.stop());
    resetCustomText();
    update();

    function resetCustomText(): void {
        spellingField.setValue(language.startsWith("zh") ? "行 2026" : recordings.find((entry) => entry.language === language && entry.mode === "text")?.text ?? "");
        spellingField.control.lang = language;
    }

    function update(): void {
        const material = pilotMaterial(recordings, language, selected, spellingField.getValue());
        const request: SpeechRequest = { segments: material.segments, rate: Number(rate.input.value), volume: Number(volume.input.value) };
        controls.setRequest(request);
        spellingField.element.hidden = selected !== "custom";
        title.element.lang = language;
        title.element.textContent = material.text;
        voice.element.textContent = material.voice;
    }
}

function range(text: string, id: string, min: number, max: number, step: number, initial: number) {
    const label = document.createElement("label");
    label.className = "pilot-range";
    label.htmlFor = id;
    const name = document.createElement("span");
    name.textContent = text;
    const value = document.createElement("output");
    value.setAttribute("for", id);
    value.setAttribute("aria-live", "off");
    value.textContent = String(initial);
    const input = document.createElement("input");
    input.type = "range";
    input.id = id;
    input.min = String(min); input.max = String(max); input.step = String(step); input.value = String(initial);
    input.addEventListener("input", () => { value.textContent = input.value; });
    label.append(name, value, input);
    return { label, input };
}
