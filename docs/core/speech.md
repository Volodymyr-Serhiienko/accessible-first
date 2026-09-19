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

`createBrowserSpeechEngine()` starts the next segment after the preceding
utterance ends and chooses an exact voice-language match before falling back to
the base language. It keeps the current segment on pause and restarts that
segment on resume because native browser resume behavior is not reliable on
all mobile engines.

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
