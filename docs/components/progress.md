# Progress

Progress provides an accessible progress indicator for completion, loading, syncing, setup, lessons, and other task progress.

It uses the native `<progress>` element by default, then adds Accessible First structure for labels, descriptions, value text, variants, and responsive styling.

## When To Use

Use `Progress` when users need to understand how far a known or ongoing task has advanced.

Common places:

- lesson completion;
- vocabulary mastery;
- import or sync progress;
- setup progress;
- upload or download progress;
- form completion summaries;
- dashboard or card summaries.

Use `Badge` for compact status labels. Use `Toast` or live regions for short completion messages. Use `EmptyState` when there is no progress to show yet.

## Quick Start

Determinate progress:

```ts
Progress({
    label: "Lesson progress",
    value: 60,
    max: 100
});
```

With visible value text:

```ts
Progress({
    label: "Vocabulary mastery",
    value: 18,
    max: 24,
    valueText: "18 of 24 words"
});
```

Indeterminate progress:

```ts
Progress({
    label: "Syncing lessons",
    value: null,
    description: "This may take a few seconds."
});
```

## Layers

- Composition API: `Progress(options)`
- Reuses: native `<progress>`, native label semantics, optional description and value slots
- Does not add keyboard behavior because progress is static status content

## Behavior

- Renders a labelled native `<progress>` element.
- Uses determinate progress when `value` is a number.
- Uses indeterminate progress when `value` is `null` or omitted.
- Clamps visual progress between `0` and `max` for value text and CSS variables.
- Supports optional description and value text.
- Does not announce every value change automatically. Use a live region, `Toast`, or page announcement for important progress milestones.
- Exposes stable data attributes for styling.

## Options

- `label` - Required label content.
- `value` - Current progress value. `null` or omitted creates indeterminate progress.
- `max` - Maximum value. Defaults to `100`.
- `description` - Optional explanatory content.
- `valueText` - Optional visible value text such as `60%` or `18 of 24 words`.
- `showValue` - Whether to show generated value text when `valueText` is not provided. Defaults to `true` for determinate progress.
- `variant` - `"default"`, `"success"`, `"warning"`, or `"danger"`. Defaults to `"default"`.
- `size` - `"md"`.
- `labelOptions` - Common DOM options for the label slot.
- `controlOptions` - Common DOM options for the native progress element.
- `descriptionOptions` - Common DOM options for the description slot.
- `valueOptions` - Common DOM options for the value text slot.
- common composition options from [foundation.md](./foundation.md#common-composition-options).

## Update Notes

```ts
const lessonProgress = Progress({
    label: "Lesson progress",
    value: 20
});

lessonProgress.setValue(60);
lessonProgress.setValueText("60% complete");
lessonProgress.update({
    variant: "success"
});
```

Use `setValue(null)` to switch to indeterminate progress.

## Styling

Useful hooks include `[data-af-composition="progress"]`, `[data-af-progress-header]`, `[data-af-progress-label]`, `[data-af-progress-value]`, `[data-af-progress-control]`, `[data-af-progress-description]`, `[data-af-state]`, `[data-af-variant]`, and `[data-af-size]`.

```ts
Progress({
    className: "lesson-progress",
    label: "Review progress",
    value: 8,
    max: 10
});
```

The default styles use native progress styling where possible and CSS variables such as `--af-progress-height` and `--af-progress-value-ratio`.

## Manual Checks

- The progress indicator has a clear accessible label.
- Determinate progress exposes the current value and maximum.
- Indeterminate progress does not expose a misleading numeric value.
- Value text is understandable when shown visually.
- Frequent progress changes do not create excessive screen reader announcements.
- Colors meet contrast expectations in light and dark themes.
- Progress remains readable inside cards and on small screens.
