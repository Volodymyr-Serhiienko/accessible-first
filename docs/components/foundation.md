# Component Foundation

Component Foundation defines the shared rules for Accessible First components.

Components should compose core behavior modules instead of duplicating accessibility logic.

## Defaults

Every component should aim for:

- native HTML first;
- keyboard support where expected;
- visible focus states;
- correct ARIA names, relationships, and states;
- disabled state behavior;
- cleanup on `destroy()`;
- stable data attributes for styling and debugging;
- no framework dependency.

## Common Composition Options

Composed components and layout helpers support common DOM options:

- `id` sets the DOM id.
- `className` adds a CSS class.
- `attributes` adds native attributes, including `aria-*`, `data-*`, and `style`.

In composition attribute maps, booleans represent HTML presence attributes:
`true` adds an empty attribute and `false` removes it. Use strings for token-valued
attributes, for example `"aria-hidden": "true"` or SVG `"focusable": "false"`.
For ARIA updates on existing controls, prefer the core ARIA helpers.

`Section`, `Panel`, `Stack`, `Row`, and `Group` also accept `gap` for an explicit
local layout interval. Their defaults are deliberately usable without it: `Section`
uses `0.75rem` to separate a heading from ordinary content, `Panel` uses `0.75rem`
between direct children, and `Stack` uses `1rem` between larger content blocks.

Single-column layouts use a shrinkable grid track. This prevents a rem-sized child
with a percentage maximum from expanding Stack, Panel, Section, Screen, cards,
forms, disclosures, tabs and overlay content beyond its parent. Panel and Section wrap unbroken text;
Stack still leaves raw text wrapping to the content or application. These defaults
do not shrink deliberately fixed-width children or replace a wide table's scroller.

```ts
Section({
    title: "Review",
    gap: "1rem",
    children: [summary, ActionsBar({ primary: submit })]
});
```

Use `gap` when a particular composition needs a different rhythm. Do not add
component-specific margins merely to compensate for a missing parent layout.

Prefer `className` for reusable styles:

```ts
Button({
    text: "Save",
    className: "save-button"
});
```

```css
.save-button {
    min-inline-size: 12rem;
}
```

For one-off adjustments, use native attributes or the returned element:

```ts
const button = Button({ text: "Save" });

button.element.style.setProperty("min-inline-size", "12rem");
```

## Lifecycle

Every component controller should expose:

```ts
destroy(): void;
isDestroyed(): boolean;
```

Components may expose additional methods such as `update()`, `open()`, `close()`, `setDisabled()`, or selection helpers depending on their behavior.

The shared lifecycle runs owned cleanups in reverse registration order. Even if
one fails, remaining cleanups run and original lifecycle attributes are restored;
the first failure is then rethrown. A second `destroy()` does not rerun cleanup.

Native-field compositions (Checkbox, Switch, RadioGroup, Select, TextField and
PasswordField) ignore late setters/update after destruction. Owned content,
field semantics, input listeners and locale/announcement resources are all
released even when a child cleanup fails; the first failure still reaches the
caller. Removed Select item handles cannot mutate a replacement option set.

Layout helpers (`Stack`, `Row`, `Grid`, `Panel`, `Section`, `Group`, `Container`)
and tag helpers (`P`, `Div`, headings, etc.) own composed children passed to them.
Destroying a parent disposes nested controllers, not only its direct DOM markup.
Passing a raw `HTMLElement` does not transfer an unknown controller's ownership;
pass the composed object or explicitly manage its cleanup.

Managed content slots retain children reused by object identity during replacement.
This supports a stable toast viewport beside changing route chrome. Removed children
are disposed once, in reverse order, even if another cleanup fails. An owned
composed instance belongs to one parent at a time; do not share it across owners.
Unmount and app teardown remove owned DOM even after a cleanup failure.

Slot replacement is reentrant: a newer `set()` or `dispose()` called during child
cleanup wins. Superseded candidates are disposed without being appended; a candidate
retained by the newer view stays alive. Cleanup attempts all removed children,
then commits the current replacement before rethrowing the first cleanup failure.
`dispose()` releases ownership without removing markup and cancels an in-flight
replacement. The low-level slot can then be explicitly reused for another lazy-load
attempt; do not reuse already destroyed composed instances. Atomic native DOM
replacement also preserves a newer view created by a connected callback.

`ContentSlot.append(children)` adds owned content without detaching existing DOM,
so an existing input keeps focus. Rendering reads a composed `element` once;
cleanup does not read it again. If materialization throws, newly accepted
controllers are still disposed, including the failing controller, and retained
children stay owned. This is cleanup safety, not rollback of earlier removals.

`ContentSlot.setFrom(factory)` prepares synchronous content inside that same
replacement revision. A newer replacement/disposal during the factory supersedes
its returned candidate; retained children stay alive and obsolete children are
disposed. A throwing factory leaves the previous content in place. This is not an
async loader; use `LazyContent` for promises and cancellation.

Page, AppShell, Screen, InfoCard, EmptyState and ActionsBar apply these ownership rules to their
slots. Combined updates attempt remaining slots after a cleanup failure, then
rethrow the first error. A newer update or destruction from child cleanup cancels
the older update's remaining slot work. This is not transactional rollback.
Destruction is terminal/idempotent: setters and updates become inert, all owned
slots are attempted, and existing DOM/getters remain inspectable.

Composition accepts same-origin iframe-created/adopted DOM children and owns their
controllers. This does not rebind a controller's document listeners when its element
is moved to a different document; initialize behavior in its intended document.

## Data Attributes

Components use stable data attributes as styling and debugging hooks:

```html
data-af-component="button"
data-af-state="ready"
```

Data attributes are not accessibility replacements. ARIA and native HTML semantics remain the accessibility source.

## Native Field State

Checkbox, Switch, RadioGroup and TextField getters read the current native value,
including browser reset, autofill and value sanitization. Programmatic setters do
not emit user-change callbacks. Enhancement keeps authored reset defaults; composed
controls establish their initial configured value as the native reset default.
Later setters/updates change the current value, not that default. Select item
replacement establishes fresh defaults for the replacement option set.

For controls in a connected form, an uncanceled native reset refreshes derived
checked markers/ARIA after the browser default action, without announcing a user
change. The internal reset observer checks current form association, including a
`form` attribute, and cancels queued work on destroy. Native indeterminate state
is not a resettable boolean default; manage a mixed-state workflow explicitly.
Detached forms still reset native values/getters, but do not send reset events
through the document observer. Keep controls in their creation document.

Use controller setters for programmatic changes that must also update styling
markers/ARIA. Reading a directly assigned native value does not manufacture a
change event or synchronously observe every property assignment.

FormField, ControlHint and Tooltip share IDREF ownership: changing or removing one
contribution preserves current authored references and other owners' help. Normal
descriptions and validation errors remain separate, avoiding duplicate detailed
error speech. Native labels keep their `for` association without a redundant ARIA
name. See [Form Field](../core/form-field.md) for stable IDs and ownership limits.

## Default Styles

The public style entry point is `packages/components/src/styles/index.css`.
See [Style System](../style-system.md) for the global CSS contract, semantic tokens, application overrides, theme behavior, and forced-colors baseline.

Internally, styles are split by concern:

- `tokens.css` - theme tokens and shared CSS custom properties;
- `page.css` - page-level utilities such as skip links;
- `composition.css` - semantic composition and layout helper styles;
- `components/*.css` - component-specific default styles.

Applications can import the single entry point or copy only the pieces they need later when package distribution is formalized.

## Shared Helpers

Shared helpers keep repeated accessibility behavior out of individual components.

`LazyContent` owns deferred code/data loading in a synchronous composition slot,
without starting obsolete views or changing router contracts. Its factories,
localized pending/failure content and retry behavior are described in
[LazyContent](lazy-content.md). Authorization stays in the application.

`createPendingState(element, options)` supplies focus-preserving async state:
`setPending`, `isPending`, `guard(event)`, `update` and `destroy`. Pending adds
`aria-busy`/`data-af-pending`, not disabled semantics. Supply localized
`pendingMessage` (text/resolver), or `false` to remain silent. Initial pending is
silent; a later transition/guarded press schedules one message after `pendingDelay`
(default 500 ms). Completion/destroy cancel pending speech and clear only this
helper's announcement. Speech uses the shared document channel outside the busy
subtree; newer results from other controls are preserved.

Use `disabled` for truly unavailable actions, `pending` for in-flight requests.
Button and Combobox controllers expose `setPending`/`isPending`; Table accepts
`pending` to guard sorting. Keep application request guards too: programmatic form submission or other
entry points can bypass a button click. Do not hide controls from assistive technology
or rename them solely to suppress screen-reader feedback. Check actual reader behavior
manually; a live-region implementation cannot control every reader's speech queue.

`createHoverAnnouncement(element, options)` announces an element label through a polite live region when a mouse pointer enters the element. It does not create a visual tooltip.

Use it for controls that already have visible text but may not be announced reliably by some screen reader and pointer-hover combinations.

Each helper uses a document-coordinated announcement channel by default. It shares document live regions with other framework feedback and only clears its own active message, so pointer leave does not erase a newer announcement from another component.

## Descriptions And Announcements

Interactive components should keep visible explanation and live-region speech separate.

Use `hint` for supporting context attached to a control. It should connect through `aria-describedby` when useful.

Use `tooltip` for optional short visual helper text. Tooltip must not be the only source of important information because touch devices do not have reliable hover.

Simple controls use `hintDisplay` to choose the output:

- `"description"` - programmatic hint through `aria-describedby`;
- `"tooltip"` - visual tooltip only;
- `"both"` - programmatic hint and visual tooltip;
- `"none"` - no hint output.

Use `description` for helper text that is visible to everyone and belongs to a component, panel, dialog, popover, field, or region.

Use `announcement` when opening a component should be announced without moving focus. Prefer concise messages for non-modal expandable or floating UI such as Disclosure, Accordion items, and Popover. If a component has a short visible `description`, it can use that as the default open announcement.

Future expandable components should consider this pattern when it helps users understand what opened and what to do next.

The shared terminology is defined in [Hints And Announcements](../hints-and-announcements.md).

## Localizable Text

Components should avoid inventing application-specific copy. When a component needs service text such as close labels, region labels, command placeholders, or route-action prefixes, it should accept explicit options today and move fallback defaults behind the shared localization layer.

Locale detection should prefer, in order: an explicit application setting, a saved user preference, URL or route context when the app owns it, `navigator.languages`, and finally a configured fallback locale. Do not use geographic location for UI language by default; it is privacy-sensitive, often permission-gated, and frequently does not match the user's preferred language.

Developer-facing diagnostics text is separate from user-facing component text. It can remain English until a dedicated diagnostics localization pass. See [Localization](../localization.md) for the planned shared layer.

## Callback Shape

Composition callbacks may receive the component instance when that makes state updates easier:

```ts
Button({
    text: "Enable option",
    onPress(_event, button) {
        const selected = button.toggleSelected();

        button.setText(selected ? "Disable option" : "Enable option");
    }
});
```

This avoids unnecessary external variables for common self-updating controls.

## Principles

- Components compose lower-level behavior.
- Components should preserve user-authored markup.
- Components should restore mutations on `destroy()`.
- Components should be configurable without losing accessible defaults.
- Shared helpers should be extracted when the same accessibility workaround appears in more than one component.
