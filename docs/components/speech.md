# Speech Controls

`SpeechControls` and `SpeechButton` provide accessible composition controls
for an application-supplied `SpeechEngine`. They do not own product copy,
language settings, provider selection, or playback policy.

Use `SpeechControls` for a visible start, pause/resume, and stop group. Use
`SpeechButton` for compact, per-item playback such as a word, label, or table
cell.

## Quick Start

```ts
SpeechControls({
    engine,
    request,
    label: t("reader.controls"),
    startText: t("reader.start"),
    pauseText: t("reader.pause"),
    resumeText: t("reader.resume"),
    stopText: t("reader.stop"),
    pausedText: t("reader.paused"),
    stoppedText: t("reader.stopped"),
    unavailableText: t("reader.unavailable"),
    failedText: t("reader.failed")
});

SpeechButton({
    engine,
    request: wordRequest,
    label: t("reader.listenToWord", { word }),
    onUnavailable: () => announce(t("reader.unavailable")),
    onFailure: () => announce(t("reader.failed"))
});
```

All visible and spoken wording belongs to the application. This keeps every
language and product decision localized rather than embedding English service
text in the framework.

## Behavior

### SpeechControls

- Uses an `ActionsBar` with an accessible group name.
- Starts with pause and stop unavailable until a request is playing.
- Changes the pause action to resume while playback is paused.
- Shows a `StatusMessage` only for configured pause, stop, unavailable, or
  failed states; those event messages are announced once through the shared
  document channel.
- Defaults to start alignment and `fillOnWrap: true`, so action rows remain
  compact on wide screens and fill available width after wrapping.
- `setRequest()` stops active playback before changing the request.
- `destroy()` stops active playback and releases child component resources.

### SpeechButton

- Renders an accessible `IconButton` with a default speaker icon.
- Requires a programmatic `label`; the default icon is decorative.
- Delegates unavailable and failed playback to optional application callbacks.
- Does not create a status message itself, because compact item actions usually
  need feedback chosen by their containing workflow.

## Options

`SpeechControls` requires `engine`, `request`, `label`, `startText`,
`pauseText`, `resumeText`, and `stopText`. `pausedText`, `stoppedText`,
`unavailableText`, and `failedText` are optional localized status text.
`align` defaults to `"start"`; `fillOnWrap` defaults to `true`.

`SpeechButton` requires `engine`, `request`, and `label`. It accepts the normal
`IconButton` composition options except `children`, `icon`, `label`, and
`onPress`; use `icon` to replace the default speaker graphic. `onUnavailable`
and `onFailure` are optional application callbacks.

Both components accept ordinary composition `id`, `className`, and `attributes`
options.

## Styling

`SpeechControls` composes the standard `ActionsBar` and `StatusMessage` styles.
Its outer hook is `[data-af-composition="speech-controls"]`.

`SpeechButton` uses the standard `IconButton` styles and adds
`[data-af-speech-button]` to its native button.

## Manual Checks

- Every action has localized visible text or an accessible icon-button label.
- Pause and stop are unavailable before start and after completion or stop.
- A pause action changes to resume without moving focus.
- Status feedback is spoken once and does not overlap the requested content.
- Wrapped action rows remain usable on narrow screens.
- Per-item buttons have a useful label such as "Listen to water", rather than
  a generic "Play".
- Verify browser user-gesture restrictions with real keyboard, touch, and
  screen-reader activation.
