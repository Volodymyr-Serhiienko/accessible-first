# Speech Controls

`SpeechControls`, `SpeechToggleButton`, and `SpeechButton` provide accessible composition controls
for an application-supplied `SpeechEngine`. They do not own product copy,
language settings, provider selection, or the shared engine's global policy.

The same controls accept browser synthesis, recorded audio, or an explicit
text/spelling engine router. See [Core speech](../core/speech.md) for creation,
autoplay errors, cancellation, and browser-default spelling voices.
For a real-recording check with the same components, use the
[isolated audio example](../../examples/recorded-speech-pilot/README.md).

Use `SpeechControls` for a visible start, pause/resume, and stop group. Use
`SpeechToggleButton` for one compact visible action that progresses through
start, pause, and resume. Use `SpeechButton` for compact, per-item playback
such as a word, label, or table cell.

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

SpeechToggleButton({
    engine,
    request: grammarRequest,
    startText: t("reader.start"),
    pauseText: t("reader.pause"),
    resumeText: t("reader.resume"),
    onUnavailable: () => announce(t("reader.unavailable")),
    onFailure: () => announce(t("reader.failed"))
});
```

All visible and spoken wording belongs to the application. This keeps every
language and product decision localized rather than embedding English service
text in the framework.

## Behavior

All three controllers expose `isDestroyed()` and ignore actions after destruction.
One internal playback owner retires stale events and releases terminal subscriptions
before application feedback, including immediate completion from `subscribe()`.
New playback requested by cleanup, feedback or an engine callback wins over old work.
Cleanup attempts all owned resources after a failure; the first exception propagates.
Unexpected provider exceptions also report the configured failure feedback, then
rethrow. Providers must clean up a failed `subscribe()` that never returned a disposer;
the control can reject its late events, but cannot release an undisclosed resource.

Controls never call the shared `engine.stop()`. The group/toggle stop their own
active playback on replacement or destruction. Compact `SpeechButton` only releases
its subscription, preserving existing fire-and-forget behavior; its containing
screen/task remains responsible for cancellation. Do not separately destroy owned
buttons/status parts.

### SpeechControls

- Uses an `ActionsBar` with an accessible group name.
- Starts with pause and stop unavailable until a request is playing.
- Changes the pause action to resume while playback is paused.
- Keeps pause unavailable when the engine does not support it; stop remains usable.
- Shows a `StatusMessage` only for configured pause, stop, unavailable, or
  failed states; those event messages are announced once through the shared
  document channel.
- Defaults to start alignment and `fillOnWrap: true`, so action rows remain
  compact on wide screens and fill available width after wrapping.
- `setRequest()` stops active playback before changing the request.
- `destroy()` stops active playback and releases child component resources.
- If completion/stop disables the currently focused pause/stop action, focus moves
  to the available start button. External focus is not moved.

### SpeechButton

- Renders an accessible `IconButton` with a default speaker icon.
- Requires a programmatic `label`; the default icon is decorative.
- Delegates unavailable and failed playback to optional application callbacks.
- Does not create a status message itself, because compact item actions usually
  need feedback chosen by their containing workflow.

### SpeechToggleButton

- Starts a request from its initial action, pauses while speech is active, and
  resumes after a pause without moving focus.
- Returns to its start action when playback completes, becomes unavailable, or
  fails.
- Delegates unavailable and failed playback to optional application callbacks;
  it intentionally does not create a status message of its own.
- A nonpausable engine retains the start action; pressing again restarts playback
  rather than offering a pause action that cannot work.

## Options

`SpeechControls` requires `engine`, `request`, `label`, `startText`,
`pauseText`, `resumeText`, and `stopText`. `pausedText`, `stoppedText`,
`unavailableText`, and `failedText` are optional localized status text.
`align` defaults to `"start"`; `fillOnWrap` defaults to `true`.

`SpeechButton` requires `engine`, `request`, and `label`. It accepts the normal
`IconButton` composition options except `children`, `icon`, `label`, and
`onPress`; use `icon` to replace the default speaker graphic. `onUnavailable`
and `onFailure` are optional application callbacks.

`SpeechToggleButton` requires `engine`, `request`, `startText`, `pauseText`,
and `resumeText`. It accepts normal `Button` options except `children`,
`onPress`, and `text`; `onUnavailable` and `onFailure` are optional callbacks.

Both components accept ordinary composition `id`, `className`, and `attributes`
options.

## Styling

`SpeechControls` composes the standard `ActionsBar` and `StatusMessage` styles.
Its outer hook is `[data-af-composition="speech-controls"]`.

`SpeechButton` uses the standard `IconButton` styles and adds
`[data-af-speech-button]` to its native button.

`SpeechToggleButton` uses the standard `Button` styles and adds
`[data-af-speech-toggle-button]` to its native button.

## Manual Checks

- Every action has localized visible text or an accessible icon-button label.
- Pause and stop are unavailable before start and after completion or stop.
- A pause action changes to resume without moving focus.
- Status feedback is spoken once and does not overlap the requested content.
- Wrapped action rows remain usable on narrow screens.
- Per-item buttons have a useful label such as "Listen to water", rather than
  a generic "Play".
- A single-action control reads start, pause, and resume labels in the active
  interface language as its state changes.
- Verify browser user-gesture restrictions with real keyboard, touch, and
  screen-reader activation.
