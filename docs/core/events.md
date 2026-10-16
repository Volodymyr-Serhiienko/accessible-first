# Events Module

## Purpose

The Events module provides small utilities for working with browser events.

Its first responsibility is predictable listener cleanup. Higher-level modules should not duplicate `addEventListener` / `removeEventListener` pairs manually.

## Public API

### addEventListener()

Adds an event listener and returns a cleanup function.

```ts
const cleanup = addEventListener(element, "keydown", handler);

cleanup();
```

### runCleanups()

Runs every cleanup in the supplied order, then rethrows the first failure.
Use it when one failing callback must not leave later subscriptions alive.
It does not reverse the list or silently swallow errors.

```ts
const owned = cleanups.splice(0).reverse();
try { runCleanups(owned); }
finally { restoreOwnedAttributes(); }
```

### addPageHideCleanup()

Registers cleanup for a real document exit and returns a listener removal function.
`pagehide` with `persisted: true` keeps both the app and the listener alive for
back/forward-cache restoration. A later non-persisted hide removes the listener
before calling cleanup, even when that callback throws.

```ts
const removePageHide = addPageHideCleanup(window, destroyApp);
// Also remove it when destroyApp() is called explicitly.
```

Do not destroy a live app on `beforeunload`: navigation may be cancelled. If an
application owns services outside a routed/static template, set the template's
`destroyOnPageHide: false` and register one cleanup for the complete application.
Playback may stop on every page hide without disposing the application.
