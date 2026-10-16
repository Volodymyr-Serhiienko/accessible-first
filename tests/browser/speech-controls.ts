import "../../packages/components/src/styles/index.css";
import { Button, SpeechButton, SpeechControls, SpeechToggleButton, ThemeToggle } from "../../packages/components/src";
import { createAudioSpeechEngine, type SpeechEngine, type SpeechPlaybackListener, type SpeechPlaybackState } from "../../packages/core/src/speech";
import { addEventListener, addPageHideCleanup, runCleanups } from "../../packages/core/src/events";

const app = document.querySelector<HTMLElement>("#app")!;
app.style.cssText = "max-width:60rem;margin:auto;padding:1rem;display:grid;gap:1rem;min-width:0;font:16px/1.5 sans-serif";
const heading = document.createElement("h1"); heading.textContent = "AF Speech Controls Audit";
const status = document.createElement("p"); status.setAttribute("role", "status");
const report = document.createElement("ol");
const request = { segments: [{ text: "Local fixture", language: "en" }] };
const messages = { label: "Simulated reader", startText: "Start reading", pauseText: "Pause reading", resumeText: "Resume reading", stopText: "Stop reading", pausedText: "Paused", stoppedText: "Stopped", unavailableText: "Unavailable", failedText: "Failed" };

function probeEngine() {
    let emitCurrent = (_status: SpeechPlaybackState["status"]) => {};
    let stale = (_status: SpeechPlaybackState["status"]) => {};
    const engine: SpeechEngine = {
        id: "local-fixture", getCapabilities: () => ({ available: true, pause: true, spelling: false }), stop() {},
        speak() {
            let state: SpeechPlaybackState = { status: "speaking" };
            const listeners = new Set<SpeechPlaybackListener>(); const retired: SpeechPlaybackListener[] = [];
            const emit = (status: SpeechPlaybackState["status"]) => { state = { status }; [...listeners].forEach(listener => listener(state)); };
            stale = emitCurrent; emitCurrent = emit;
            return { getState: () => state, pause: () => emit("paused"), resume: () => emit("speaking"), stop: () => emit("idle"),
                subscribe(listener) { listeners.add(listener); retired.push(listener); listener(state); stale = status => retired.forEach(callback => callback({ status })); return () => listeners.delete(listener); } };
        }
    };
    return { engine, emit: (state: SpeechPlaybackState["status"]) => emitCurrent(state), stale: (state: SpeechPlaybackState["status"]) => stale(state) };
}

const groupProbe = probeEngine(); const toggleProbe = probeEngine(); const compactProbe = probeEngine();
const group = SpeechControls({ ...messages, engine: groupProbe.engine, request });
let unavailable = 0;
const toggle = SpeechToggleButton({ engine: toggleProbe.engine, request, startText: "Read all material", pauseText: "Pause all material", resumeText: "Resume all material" });
const compact = SpeechButton({ engine: compactProbe.engine, request, label: "Listen to fixture", onUnavailable() { unavailable += 1; status.textContent = "Unavailable compact recording"; } });
const long = SpeechToggleButton({ engine: toggleProbe.engine, request,
    startText: "LongLocalizedReadingActionWithoutSpaces".repeat(4), pauseText: "Pause", resumeText: "Resume" });
const outside = document.createElement("input"); outside.setAttribute("aria-label", "External destination");
const theme = ThemeToggle({ announcement: false });
const direction = Button({ text: "Toggle direction", onPress() { document.documentElement.dir = document.documentElement.dir === "rtl" ? "ltr" : "rtl"; status.textContent = `Direction: ${document.documentElement.dir}`; } });

const run = Button({ text: "Run speech checks", onPress() {
    const checks: Array<{ name: string; passed: boolean }> = [];
    const check = (name: string, passed: boolean) => checks.push({ name, passed });
    group.setRequest(request);
    check("Speech actions retain native button semantics", [group.startButton.element, group.pauseButton.element, group.stopButton.element, toggle.element, compact.element].every(element => element instanceof HTMLButtonElement));
    check("Action group has its supplied accessible name", group.element.querySelector('[role="group"]')?.getAttribute("aria-label") === messages.label);
    check("Pause and stop begin unavailable", group.pauseButton.element.disabled && group.stopButton.element.disabled);
    group.startButton.element.focus(); group.play();
    check("Starting enables pause and stop", !group.pauseButton.element.disabled && !group.stopButton.element.disabled);
    group.pauseButton.element.focus(); group.pause();
    check("Pause changes its label without moving focus", group.pauseButton.element.textContent === messages.resumeText && document.activeElement === group.pauseButton.element);
    check("Pause exposes one visible configured status", !group.statusMessage.element.hidden && group.statusMessage.getText() === messages.pausedText);
    group.resume(); check("Resume clears the old pause status", group.pauseButton.element.textContent === messages.pauseText && Boolean(group.statusMessage.element.hidden));
    group.stopButton.element.focus(); group.stop();
    check("Stop retires both active actions", group.pauseButton.element.disabled && group.stopButton.element.disabled);
    check("Disabled-action focus returns to start", document.activeElement === group.startButton.element);
    group.play(); outside.focus(); groupProbe.emit("completed"); check("Completion preserves external focus", document.activeElement === outside);
    group.play(); groupProbe.emit("error"); check("Playback failure has visible localized feedback", !group.statusMessage.element.hidden && group.statusMessage.getText() === messages.failedText);
    group.setRequest(request); check("Changing the request clears obsolete feedback", group.statusMessage.element.hidden && group.pauseButton.element.disabled);
    const width = toggle.element.getBoundingClientRect().width; toggle.element.focus(); toggle.play(); toggle.pause();
    check("Toggle reaches resume while retaining focus", toggle.element.textContent === "Resume all material" && document.activeElement === toggle.element);
    check("Changing action labels retains reserved dimensions", Math.abs(toggle.element.getBoundingClientRect().width - width) < 1);
    toggle.resume(); toggleProbe.emit("completed"); check("Completion restores the start label", toggle.element.textContent === "Read all material");
    compact.play(); const previous = unavailable; compactProbe.emit("unavailable"); compactProbe.stale("unavailable");
    check("Compact terminal feedback is delivered once", unavailable === previous + 1);
    check("Compact action has its application-owned name", compact.element.getAttribute("aria-label") === "Listen to fixture");
    check("Long reserved text wraps within its control", long.element.scrollWidth <= long.element.clientWidth + 1 && long.element.getBoundingClientRect().width <= app.clientWidth);
    check("Controls retain usable touch-target height", [group.startButton.element, toggle.element, compact.element].every(element => element.getBoundingClientRect().height >= 44));
    check("Document has no horizontal overflow", document.documentElement.scrollWidth <= innerWidth);
    report.replaceChildren(...checks.map(check => { const item = document.createElement("li"); item.textContent = `${check.passed ? "PASS" : "FAIL"}: ${check.name}`; return item; }));
    status.textContent = `${checks.filter(check => check.passed).length}/${checks.length} speech checks passed`;
} });

function localWav(): string {
    const sampleRate = 22050; const samples = sampleRate * 4;
    const buffer = new ArrayBuffer(44 + samples * 2); const view = new DataView(buffer);
    const tag = (offset: number, value: string) => [...value].forEach((character, index) => view.setUint8(offset + index, character.charCodeAt(0)));
    tag(0, "RIFF"); view.setUint32(4, buffer.byteLength - 8, true); tag(8, "WAVE"); tag(12, "fmt ");
    view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true); view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true); tag(36, "data"); view.setUint32(40, samples * 2, true);
    for (let index = 0; index < samples; index += 1) {
        const envelope = Math.min(1, index / 500, (samples - index) / 500);
        view.setInt16(44 + index * 2, Math.sin(index * 2 * Math.PI * 440 / sampleRate) * 2000 * envelope, true);
    }
    return URL.createObjectURL(new Blob([buffer], { type: "audio/wav" }));
}
const audioTitle = document.createElement("h2"); audioTitle.textContent = "Native audio engine";
const audioState = document.createElement("p"); audioState.setAttribute("role", "status"); audioState.textContent = "Audio idle";
const audio = document.createElement("audio"); audio.hidden = true; audio.setAttribute("aria-hidden", "true");
const wav = localWav();
const audioEngine = createAudioSpeechEngine({ createAudio: () => audio, resolveSegment: () => ({ src: wav }) });
const real = SpeechControls({ ...messages, label: "Native audio reader", engine: audioEngine, request,
    startText: "Play local WAV", pauseText: "Pause local WAV", resumeText: "Resume local WAV", stopText: "Stop local WAV" });
const audioCleanups = ["playing", "pause", "ended", "error"].map(event => addEventListener(audio, event, () => { audioState.textContent = `Audio ${event}; duration ${Number.isFinite(audio.duration) ? audio.duration.toFixed(2) : "pending"}`; }));
app.append(heading, run.element, theme.element, direction.element, status, group.element, toggle.element, compact.element, long.element, outside, report, audioTitle, real.element, audioState, audio);
addPageHideCleanup(window, () => runCleanups([group.destroy, toggle.destroy, compact.destroy, long.destroy, real.destroy, () => audioEngine.stop(), ...audioCleanups, () => URL.revokeObjectURL(wav), theme.destroy, direction.destroy, run.destroy]));
