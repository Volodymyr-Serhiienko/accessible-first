# Recorded Speech Pilot

An isolated playback example using `createAudioSpeechResolver`, `createAudioSpellingResolver`,
`createAudioSpeechEngine` and `SpeechControls`. No TTS provider, credentials,
lesson rules or background speech. It reads an application-owned import manifest
at `public/recordings/manifest.json` (reading) and `public/spelling/manifest.json`
(characters). Audio is loaded only during playback.
The manifest and recordings are ignored by Git.

For the current AF Platform pilot, from `C:\Users\utosv\projects\af-platform`:

```powershell
.\speech google-export artifacts/speech/google-pilot-plan.json -OutputPath C:\Users\utosv\projects\Study-Languages\accessible-first\examples\recorded-speech-pilot\public\recordings
.\speech google-export artifacts/speech/google-spelling-plan.json -OutputPath C:\Users\utosv\projects\Study-Languages\accessible-first\examples\recorded-speech-pilot\public\spelling
```

Export requires a new directory; it reads existing audio and makes no Google calls.
The version 1 import document contains `recordings: [{ recipe, audioFile }]`.
This example accepts hash-named MP3/WAV files only and preselects one recording
per text/language/mode; an ambiguous voice or pronunciation variant is rejected.

From `C:\Users\utosv\projects\Study-Languages\accessible-first`:

```powershell
npm run example:audio:dev -- --port 5175 --strictPort
```

Open `http://localhost:5175/`; on a phone on the same LAN, use the PC's IPv4 address
with port 5175. Allow this port only on the private network if Windows asks.
No `.env`, Google registration or running backend is needed to listen.

The separate, optional `public/materials/` export contains ready Study Languages
words/sentences, not new framework behavior. Open `/materials/index.html` on the
same server. It uses native players with `preload="none"`, not background playback.
Export the approved `artifacts/speech/study-materials-pronunciation-plan.json` with
`speech google-export` into a new `public/materials/` directory; no re-synthesis.
This folder is ignored by Git and not required by the spelling example.

Check all seven languages, pause/resume without restarting, stop/replacement,
rate/volume and focus with NVDA/TalkBack. The spelling catalog contains six
alphabetic inventories (including diacritics), digits and named spaces. Polish
also includes Q/V/X for foreign words. Mandarin contains digits, space and the
explicit reading of 行 (`xing2`), not a guessed alphabet or context-free reading
of arbitrary Chinese text. Choose an alphabet, digits, or custom spelling text;
letters are case-insensitive, punctuation is ignored, and requested spaces spoken.
Unknown symbols containing letters/digits reject the complete request without
silently skipping content or switching voices. Missing native `Intl.Segmenter`
makes spelling unavailable without preventing ordinary audio playback.
This is a pronunciation/device test, not audio for all lessons. Changing a
setting stops the old request.
Only error/pause/stop feedback is announced; content is not duplicated in a live region.
Autoplay restrictions still apply. Device screen-reader/audio behavior needs
manual validation, particularly external iPhone/Safari testing.
Production builds use the common [browser profile](../../docs/testing.md#accessibility-evaluation-boundary),
not Vite's newer default. This is not a guarantee for untested legacy devices.
