# LazyContent

Use `LazyContent` to load code or data inside a synchronous Screen/router slot.
It owns one current attempt and the resulting composed children. Product access
rules, data validation and cache policy remain in the application.

## Quick Start

```ts
const content = LazyContent({
    async load(signal) {
        const module = await import("./details");
        return () => module.Details();
    },
    pendingContent: () => StatusMessage({ text: t("wait"), announcement: false }),
    failureContent: (_error, retry) => Stack(
        StatusMessage({ text: t("loadFailed"), variant: "danger", announcement: false }),
        Button({ text: t("retry"), onPress: retry })
    ),
    pendingOptions: { pendingMessage: () => t("wait") }
});
```

Pass `signal` to abortable APIs such as `fetch`. Imports cannot be aborted, but
their late result is ignored. Return a **factory**, not an already-created view:
an obsolete request must not instantiate subscriptions or start page requests.
Recheck current application permissions inside the returned factory when needed.

## Options And Controller

- Common `id`, `className`, `attributes` options apply to the host.
- `load(signal)` returns a promise of a synchronous content factory.
- `pendingContent()` supplies a fresh localized pending view per attempt.
- `failureContent(error, retry)` supplies localized feedback/actions. It must not throw.
- `pendingOptions` configures shared pending feedback; initial loading is silent.
- `reload()` replaces the current attempt; `destroy()` cancels and disposes all content.
- `isDestroyed()` reports permanent disposal; subsequent reloads do nothing.

All composed content transfers ownership to the slot. Do not reuse a destroyed
view or share one composed instance between owners. Factories should construct
fresh content. Cleanup finishes even if a child fails; the first teardown error
is rethrown.

## Behavior And Accessibility

TaskScope, ContentSlot and shared PendingState handle cancellation, ownership and
busy feedback. The component adds no live announcements, disables no controls and
does not steal route focus. A retry that removes its focused control moves focus
to the live host (`tabindex=-1`), not the document body. Success does not move focus.
Use one app-owned toast/status announcement for failures, not both.

An import may remain failed in the browser module cache, or refer to a retired
deployment file. Applications should offer explicit page reload for those failures,
not an automatic restart that may discard user work. Ordinary data errors can retry.

Hooks: `data-af-composition="lazy-content"`, `data-af-lazy-state="pending|ready|error"`,
`data-af-pending` and `aria-busy`. Layout uses the existing Stack defaults, no new CSS.

## Manual Checks

Check slow loading, retry focus, navigation/logout before completion, locale changes,
error feedback and a new deployment with an old tab. Confirm no obsolete view starts
requests. Verify real desktop/mobile screen-reader speech separately from DOM tests.
