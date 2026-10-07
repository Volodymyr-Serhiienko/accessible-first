# Speech

The Speech core module defines a small provider-neutral contract for reading
text. It supports browser Web Speech and ready audio recordings through the same
playback contract. Audio generation, hosting, and caching remain application-owned.

Use it when an application needs explicit playback of text, labels, learning
material, instructions, or other user-requested content. It does not produce
visible UI or user-facing text; use `SpeechControls` or `SpeechButton` when
composition controls are appropriate.

## Quick Start

```ts
const engine = createBrowserSpeechEngine();

const playback = engine.speak({
    volume: 0.9,
    segments: [
        { text: instructionText, language: "uk-UA", rate: 0.9 },
        { text: targetText, language: "en-US", rate: 0.8 }
    ]
});
```

The call to `speak()` should come from a visible user action. Browsers may
block speech initiated automatically during page load, route rendering, or an
unrelated asynchronous callback.

## Contract

- `SpeechEngine` starts a request and stops its active playback.
- `SpeechRequest` contains one or more ordered `SpeechSegment` values.
- Each segment has text and a BCP 47 `language` tag. It can override request
  `rate` and use `mode: "spell"` to read Unicode letters and numbers one by
  one. Spell mode always ignores punctuation. Set `spellWhitespaceText` to a
  localized word such as `"space"` when word boundaries should be spoken;
  omit it to skip whitespace.
- `SpeechPlayback` exposes the current state, pause, resume, stop, and a
  subscription method.
- `SpeechPlaybackStatus` distinguishes normal completion from stopped,
  unavailable, paused, and failed playback.
- `SpeechEngineCapabilities` lets applications decide which actions to offer.

## Playback Follow-Ups

Use `afterSpeechCompletes()` when an action must run only after the requested
speech finishes normally. Use `afterSpeechSettles()` when the follow-up must
also run after a stop, an unavailable engine, or a playback error. Both return
a cleanup function, so a screen can cancel its pending follow-up when it is
destroyed.

Cancel the previous follow-up before replacing playback, and cancel all owned
follow-ups before stopping speech during screen teardown. A stopped request is
settled, so `afterSpeechSettles()` can run immediately on `stop()`. Before moving
focus, also check that the action is still current and the user has not moved to
another control. If unavailable speech uses a separate announcement fallback,
keep its non-speech follow-up explicit rather than silently skipping it.

```ts
const playback = engine.speak(request);
const cancelFollowUp = afterSpeechSettles(playback, () => {
    focusElement(nextControl);
});
```

Keep live-region announcements application-owned: spoken lesson material and
screen-reader feedback often need different timing and localization rules.

`createBrowserSpeechEngine()` starts the next segment after the preceding
utterance ends and chooses an exact voice-language match before falling back to
the base language. It keeps the current segment on pause and restarts that
segment on resume because native browser resume behavior is not reliable on
all mobile engines.

## Browser Voice Preferences

`createBrowserSpeechVoiceCatalog()` exposes the voices that the current browser
makes available. When the browser exposes `voiceschanged`, it refreshes its
cache after delayed voice discovery on mobile devices. Older or partial Web
Speech implementations may not expose an event surface; the catalog still
works through explicit `catalog.refresh()` calls and must never block app
startup. Call `catalog.refresh()` when a user opens speech settings or
immediately before a user-triggered voice preview; this asks the browser for a
fresh list without background polling.

```ts
const voices = createBrowserSpeechVoiceCatalog();

const englishVoices = voices.getVoices("en-GB");
const selectedVoice = englishVoices[0] ?? null;

const engine = createBrowserSpeechEngine({
    getVoicePreference(language) {
        return language === "en-GB" ? selectedVoice : null;
    }
});
```

The catalog returns serializable `BrowserSpeechVoice` descriptors with
`voiceURI`, `name`, `lang`, `local`, and `default`. Persist only the
`voiceURI`/`name`/`lang` preference, not a native `SpeechSynthesisVoice`
object. `createBrowserSpeechEngine()` resolves that preference on every
segment, so an unavailable or removed voice automatically falls back to the
browser's compatible choice.

Use `catalog.subscribe(...)` when a settings screen must update after delayed
voice discovery, then call `catalog.destroy()` when that application-owned
catalog is no longer needed. `local: true` means the browser reports a local
voice; it is informational rather than a promise that the voice will work
offline.

Set `voiceSelection: "automatic"` to leave `utterance.voice` unset. The engine
still supplies the segment language, but the browser chooses its own voice;
the voice catalog and `getVoicePreference` are not consulted. The default
`"preferred"` mode preserves catalog matching and saved preferences.

The web platform cannot enumerate system speech engines that the browser does
not expose through `speechSynthesis.getVoices()`. Keep an automatic-browser
option and never make a saved named voice mandatory for essential content. An
empty catalog is not proof that speech cannot work: when an utterance has a
language but no assigned `voice`, the browser may use its own device default.

Use `engine.getCapabilities().available` as the feature check for the browser
speech engine itself. It is `false` when the browser context lacks a usable
utterance constructor or the minimum `speechSynthesis.speak()` and `cancel()`
methods; that is the point to show one clear application-level fallback notice.
Do not show that notice merely because a compatible voice list is empty or the
voice-change event is unavailable. A browser may still choose a device voice at
speech time. The application cannot reliably test audible output during page
load because browsers can reject non-user-initiated speech.

The catalog normalizes common mobile tag variants, including underscore tags
such as `uk_UA`, canonical aliases such as `cmn-CN`, and malformed fallback
tags such as `eng-US-f000`. It still cannot guarantee that Safari, WebView, or
another browser will enumerate every installed system voice. Treat a failed
speech capability check as unavailable; treat an empty compatible list as an
automatic-device-voice scenario.

## Recorded Audio

`createAudioSpeechResolver(recordings)` indexes ready `AudioSpeechRecording`
entries (`text`, `language`, optional `mode`, `src`) and returns a synchronous
resolver. Text is NFC-normalized, language tags compare case-insensitively,
and ordinary text is trimmed but not case-folded. Dedicated whitespace spelling
clips preserve their text and match the optional `spellWhitespaceText` exactly.
Missing/aborted requests return `null`; conflicting sources for the same key
are rejected. The application preselects voices and pronunciation variants.
The index owns a snapshot, does not fetch files, and does not assemble an alphabet.

```ts
const engine = createAudioSpeechEngine({
    resolveSegment: createAudioSpeechResolver([
        { text: "the book", language: "en-GB", src: "/audio/book.mp3" }
    ])
});
```

The [recorded-audio example](../../examples/recorded-speech-pilot/README.md)
uses an application-supplied manifest and real recordings with the usual AF controls.

`createAudioSpellingResolver(recordings)` assembles an ordered clip array from
single-grapheme `mode: "spell"` entries in the same catalog. It uses
[Intl.Segmenter](https://tc39.es/ecma402/2024/#segmenter-objects), NFC and
locale-aware case folding, preserving accents and characters outside the BMP.
Punctuation and symbols are ignored. Each whitespace grapheme uses the catalog's
space recording when the segment supplies a matching `spellWhitespaceText`;
without that option whitespace is skipped. Any missing letter, digit or requested
space rejects the whole segment with `null`, not a partial spelling or another voice.
Normal reading, empty output, cancellation and missing/broken native segmentation
also return `null`. There is no network, audio preload or Unicode fallback inside
the resolver. Case-folded conflicting clips and multi-grapheme entries are rejected.
The application must preselect context-dependent readings; this is not automatic
Mandarin pronunciation or a promise that every language has a complete alphabet.

```ts
const read = createAudioSpeechResolver(catalog);
const spell = createAudioSpellingResolver(catalog);
const engine = createAudioSpeechEngine({
    supportsSpelling: true,
    resolveSegment: (segment, signal) =>
        (segment.mode === "spell" ? spell : read)(segment, signal)
});
```

No recording is generated for the whole spelled word: repeated characters reuse
the same URLs. Playback remains sequential HTML audio, not seamless concatenation;
check inter-character pauses and mobile autoplay on real devices.

`createAudioSpeechEngine()` plays ready recordings. The injected `resolveSegment`
receives a `SpeechSegment` and an `AbortSignal` and returns a `SpeechAudioClip`,
an ordered array of clips, or `null`. It may also return a promise/thenable.
It can read an application manifest, local cache, or protected API without
introducing any lesson rules, cloud credentials, or provider SDK into Core.

```ts
const recordings = createAudioSpeechEngine({
    resolveSegment(segment, signal) {
        // Application-owned lookup: exact text, language, mode, and chosen voice.
        return recordingCatalog.find(segment, signal);
    }
});

const spelling = createBrowserSpeechEngine({ voiceSelection: "automatic" });
const engine = createSpeechEngineRouter({ text: recordings, spell: spelling });

// Use the same engine with SpeechControls, SpeechButton, or createSpeechTask.
```

The router explicitly uses its `text` engine for normal reading and its optional
`spell` engine for spelling. Adjacent segments routed to the same engine stay in
one child request; different providers run sequentially, never concurrently.
A missing/unavailable spelling route is unavailable, not ordinary reading.
Request rate/volume and every segment's language/spelling options are preserved.
Pause, resume, stop, and completion still apply to the entire routed request.
Its `available` capability describes the normal-reading engine; `spelling`
additionally requires a usable spelling engine. Own the child engines and do
not use the same instances concurrently outside the router.

An optional `selectEngine(segment)` overrides the text/spell routes per segment.
Use application-owned metadata for explicit sources such as recorded lessons and
browser-read grammar. Returning `undefined` makes that segment unavailable; it
does not fall back to the default route. A thrown selector is a routing failure.
Adjacent segments selecting the same engine stay grouped; other engines run
sequentially with the same cancellation, pause and completion ownership. Keep
provider/lesson policy outside Core. Capabilities still describe the default routes.

`getPauseAfterMs(segment)` optionally inserts silence at an application-defined
boundary. Finite durations are bounded to 0-60000 ms; other values mean no pause.
The router splits a group at that boundary, but does not add silence after the
last playable segment. Pausing during silence preserves its remaining duration;
stop/replacement cancels the timer. This works across providers without silence
files, changing audio speed, announcements, or focus movement.

The audio engine owns one audio element and reuses it for subsequent requests.
`createAudio` can supply a dedicated `HTMLAudioElement`; `null` disables it.
Construction never plays a probe. Empty requests complete, missing recordings
settle as unavailable, and startup/resolution/media failures settle as errors.
Replacement, stop, completion, and failures remove listeners, abort pending
resolution, and release the media source. Late results cannot restart a stopped
request. Pause preserves the audio position rather than restarting the recording.

Pause also suspends the startup timer. `startTimeoutMs` defaults to 15000 and
bounds source resolution, startup, or buffering waits, not the duration of
actively playing audio. `speaking` includes waiting for resolution/startup;
the current shared contract has no separate loading status.

Request volume is bounded to 0-1; audio playback rate is bounded to 0.25-4,
with the segment rate overriding the request rate. Non-finite values use defaults.
The requested rate is applied after `load()`, which restores the native
default rate according to the [HTML media load algorithm](https://html.spec.whatwg.org/multipage/media.html#media-element-load-algorithm).
Audio rate and volume behavior can differ from Web Speech or system-volume
behavior, especially on mobile; test actual target browsers.

Audio-only spelling defaults to unavailable. Enable `supportsSpelling` only if
the resolver supplies real spelling recordings with the requested whitespace
word and omitted punctuation. Alternatively, use the router above: it keeps
spelling on Web Speech with the browser-selected voice. It cannot supply speech
on devices where Web Speech itself is unavailable.
An explicit whitespace-only spelling segment is preserved by the engines/router;
ordinary whitespace-only text remains empty. The browser engine pronounces it
only when `spellWhitespaceText` is supplied. A recording resolver must supply
the matching spoken-space clip rather than silently skip it.

`SpeechPlaybackState.error` contains machine-readable `AudioSpeechErrorCode`
values. Handle `audio-playback-blocked` with localized feedback and a fresh user
action, `audio-source-missing` as unavailable content, and timeout/media/resolver
failures as errors. Provider exception messages are not exposed as user text.
The router preserves child errors and uses `speech-engine-routing-failed` for
an unexpected provider exception. Neither engine announces status or moves focus.

For mobile, resolve a ready manifest synchronously where possible: the engine
calls `play()` before `speak()` returns when the source is synchronous. If lookup
awaits network/cache work, a browser can require another user gesture. Reusing
one element and handling rejected `play()` do not bypass autoplay restrictions.
See [media playback](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/play).

URLs and any blob-URL lifetime are owned by the application. The engine does not
generate audio, revoke application-owned URLs, fetch whole files into memory,
persist recordings, automatically change providers, or download an entire catalog.
Caching, offline quotas, server authorization, and publication policy belong to
the application/platform layers, not this playback adapter.

## Accessibility And Feedback

Speech output is an optional perception channel, not the only presentation of
content. Keep the same text visibly available in the page where the user needs
it.

The core module does not announce playback state. An application can use
`StatusMessage`, `createActionAnnouncer()`, or the composition controls for a
localized, one-event/one-announcement result. Do not announce every spoken
segment through a live region; that would duplicate the speech itself.

## Manual Checks

- Start speech through a real keyboard and touch action in each target browser.
- Check voice selection and language transitions on desktop and mobile.
- Pause, resume, stop, and start another request while a request is active.
- Verify unavailable speech has a visible or spoken fallback appropriate to the
  product.
- Test with NVDA, TalkBack, or VoiceOver without letting status speech overlap
  the requested content.

## Owned Speech Tasks

`createSpeechTask(engine)` owns playback together with its callbacks. `speak(request,
{ onComplete, onFallback })` cancels the previous request and unsubscribes before
stopping it. Normal completion invokes `onComplete`; unavailable/failed synthesis
invokes `onFallback`, then `onComplete` if the task is still current. A stopped
request invokes neither. `cancel()` is reusable; `destroy()` prevents further speech.
Engine capability/speak failures use the same fallback.

Use this for interactive views where speech is optional but the next UI action
must still work. Keep fallback text and focus policy in the application. Check that
focus still belongs to the originating interaction before moving it, and call
`destroy()` when removing the view. Do not combine this controller with an unowned
completion subscription to the same request.
