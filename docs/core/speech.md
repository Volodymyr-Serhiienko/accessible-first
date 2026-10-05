# Speech

The Speech core module defines a small provider-neutral contract for reading
text. It supports browser Web Speech today and leaves room for recorded-audio
or remote speech adapters later.

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
