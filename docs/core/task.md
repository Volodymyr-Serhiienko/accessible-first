# Task Scope

`createTaskScope()` owns one asynchronous action and its follow-ups. Use it when
a view can be removed, an action replaced, or an account changed before completion.
It contains no routing, account, storage or product policy.

```ts
const scope = createTaskScope();

async function load() {
    const task = scope.begin();
    const response = await fetch(url, { signal: task.signal });
    const data = await response.json();
    if (!task.isCurrent()) return;
    render(data);
}

// Also call cancel() on an application-specific ownership change.
view.destroy = () => scope.destroy();
```

`begin()` cancels the preceding task. `signal` supports cancellable APIs;
`isCurrent()` also protects APIs that cannot abort. Check after every awaited
boundary before committing UI/application state. `addCleanup()` owns subscriptions
or listeners and runs immediately for an obsolete task. Cleanup happens before
abort notifications. `cancel()` leaves the scope reusable; `destroy()` is final.

The application still checks the account, selected resource and user focus when
those determine whether a result is applicable. For owned playback with a
non-speech fallback, use [createSpeechTask](speech.md#owned-speech-tasks).
