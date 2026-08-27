# FocusRoute

FocusRoute is a small application helper for moving focus to a meaningful workflow target after content changes, selections, route actions, or screen-level commands.

It is not a layout system. Use it when application code would otherwise repeat `requestAnimationFrame`, `scrollIntoView`, fallback lookup, link interception, and programmatic focus logic.

## Quick Start

```ts
scheduleFocusRoute({
    target: () => screen.getFocusTarget("title"),
    scroll: true
});
```

Returning to responsive navigation after a route screen:

```ts
FocusRouteLink({
    text: "Back to navigation",
    href: "#navigation",
    variant: "standalone",
    focusTarget: () => navigation.getFocusTarget(),
    scroll: {
        block: "nearest",
        inline: "nearest",
        behavior: "auto"
    }
});
```

With a fallback target:

```ts
scheduleFocusRoute({
    target: () => selectedButton.element,
    fallback: () => listDetail.getFocusTarget("list"),
    scroll: {
        block: "center",
        inline: "nearest",
        behavior: "auto"
    }
});
```

Use the synchronous helper only when the target already exists and layout does not need a render frame:

```ts
runFocusRoute({
    target: () => field.control,
    scroll: true
});
```

## Purpose

Real application flows often need focus movement that is not just normal Tab order:

- a route changes and focus should move to the new screen title;
- a list item is selected and focus should move to its detail area;
- a detail screen needs a visible way back to the selected list item;
- form validation should move focus to the first invalid control;
- a command palette action should leave focus on the changed content, not on the command trigger.

FocusRoute gives these flows one reusable helper instead of copying local focus glue into every demo or app screen.

Use `FocusRouteLink` when the focus route should be exposed as a visible link, such as "Back to navigation" or "Return to selected item". The link keeps a real `href` for semantics and fallback, prevents normal navigation by default, then moves focus to the configured target.

## Accessibility

FocusRoute should be used intentionally. It is best for workflow transitions where the visible content changed or where a user explicitly asked to jump somewhere.

Do not use it to fight normal keyboard navigation. Normal Tab order should still work. FocusRoute should support clear routes through a screen, especially for desktop keyboard users and mobile screen reader users.

When focus moves to a non-interactive region, the target should be a stable programmatic focus target such as `Screen` title/body, `PageOutlet`, or a named `ListDetail` area. These targets should not be added to the regular Tab order.

## Options

`runFocusRoute(options)` and `scheduleFocusRoute(options)` use the same core options:

- `target` - element, `null`, `undefined`, or a function returning an element.
- `fallback` - optional element or resolver used when `target` is missing.
- `scroll` - `false`, `true`, or native `ScrollIntoViewOptions`. Defaults to no scrolling unless set by the caller.
- `focusOptions` - native `FocusOptions`. Defaults to `{ preventScroll: true }`.

`scheduleFocusRoute(options)` also accepts:

- `schedule` - `"sync"`, `"animation-frame"`, or `"double-animation-frame"`. Defaults to `"animation-frame"`.
- `ownerWindow` - optional window used for scheduling.

`FocusRouteLink(options)` accepts all normal `Link` options, plus:

- `focusTarget` - required focus target or resolver.
- `fallbackFocusTarget` - optional fallback focus target or resolver.
- `scroll` - focus-route scroll behavior.
- `focusOptions` - native focus options.
- `preventDefault` - prevents normal link navigation before moving focus. Defaults to `true`.
- `onNavigate` - callback fired after the focus route runs.

## Methods

- `runFocusRoute(options)` - resolves the target immediately, optionally scrolls it into view, and focuses it.
- `scheduleFocusRoute(options)` - schedules `runFocusRoute` after one or two animation frames and returns a cancel handle.
- `resolveFocusRouteTarget(target)` - resolves an element or resolver function to an element or `null`.
- `FocusRouteLink(options)` - creates a visible link that runs a focus route when activated.

## Manual Checks

- Focus moves to the intended target after the workflow action.
- The target is visible or the page scrolls to it.
- Fallback focus works when the primary target is missing.
- FocusRouteLink remains announced as a link with its visible text and hint.
- Mobile screen reader focus does not jump to the app root after the transition.
- Normal Tab order remains logical after the programmatic focus move.