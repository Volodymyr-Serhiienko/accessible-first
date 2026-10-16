# Focus Module

## Purpose

The Focus module contains small DOM-first utilities for moving, containing,
trapping, and restoring keyboard focus. Higher-level components use these
primitives for dialogs, popovers, menus, listboxes, comboboxes, tabs, route
outlets, and mobile keyboard dismissal.

## Primary APIs

### Focus one target

```ts
focusElement(element);
focusProgrammatically(heading);
```

`focusElement()` moves focus to an already focusable element.
`focusProgrammatically()` adds `tabindex="-1"` to a semantic target only when
needed, keeping it until blur so removing the attribute does not immediately
send focus back to the body. It never adds a positive Tab stop. Failed/thrown
attempts clean up immediately; existing tabindex values and later author changes
are preserved. Prefer it for a route heading, screen, or
other semantic target that must not enter the regular Tab sequence.

Use `focusElement()` for a known existing target. For a captured focus flow,
use `FocusStack.restore()` or a component's documented restoration behavior.

### Discover and move within a container

```ts
getFocusableElements(container);
hasFocusableElements(container);
containsFocus(container);
focusFirst(container);
focusLast(container);
isFocusable(element);
```

These helpers support component behavior. They do not replace native focus
order or turn arbitrary elements into controls.

`isFocusable()` checks a nonnegative-tabindex candidate; it does not collapse
native radio groups. `getFocusableElements()` sorts positive tabindex values
first (stable within equal values), followed by zero/default values in DOM order.
Prefer natural DOM order in application markup rather than positive tabindex.

Named native radios share a stop by tree root, form owner and case-sensitive
name. Available checked members are preferred, even outside the container;
an already focused member inside it is retained. Otherwise an unchecked group
uses its first candidate, or its last with `getFocusableElements(container, true)`.
`focusLast()` uses that backward discovery. Unnamed radios remain independent.
The helpers do not change radio values. Native browsers may remember a previous
unchecked radio on re-entry; this deterministic boundary policy does not emulate
that hidden browser state. See [HTML focus order](https://html.spec.whatwg.org/multipage/interaction.html#sequential-focus-navigation)
and the [APG native-radio note](https://www.w3.org/WAI/ARIA/apg/patterns/radio/#note).

Discovery is light-DOM only, not a full Shadow DOM/slot, iframe-interior or
platform-specific Tab-order engine. `focusElement()` can also focus an explicit
negative tabindex target when the browser allows it.

### Capture and restore a flow

```ts
const stack = createFocusStack();

stack.capture(dialogElement);
// Open a nested interaction.
stack.restore();
```

A `FocusStack` records existing focus targets for nested, application-owned
flows. Dialog, AlertDialog, and Popover already manage their documented focus
contracts; do not add a second stack unless an application owns a distinct
multi-step interaction.

### Trap a modal region

```ts
const trap = createFocusTrap(dialogElement, {
    restoreFocus: true
});

trap.activate();
// Later:
trap.deactivate();
```

Use a focus trap only for an active modal interaction. It is not a general
layout or navigation tool.
`deactivate()` releases its listeners and optionally restores captured focus;
there is no separate `destroy()` method. Tab handling ignores already-handled
events, IME composition and Ctrl/Alt/Meta chords. A nested trap's handled event
must not be processed again by its parent. Shift+Tab remains ordinary reverse
navigation.
An empty trap focuses its semantic fallback, or the container itself if the
fallback is absent/unfocusable, using temporary `tabindex="-1"` until blur.
Tab remains contained even with no ordinary controls. Supply a connected,
visible container and an in-container fallback. The trap owns Tab events
bubbling through that container; it does not make the rest of the document inert
or recover arbitrary external script/pointer focus. Higher-level modal behavior
and dynamic content changes must keep a meaningful focus target inside it.

### Dismiss the mobile virtual keyboard

```ts
dismissVirtualKeyboard(input);
```

The helper blurs the current editable control in the given document or shadow
root. Use it only when application navigation intentionally moves away from
text entry; never blur a user unexpectedly during typing.

## Principles

- Move focus only when the user action or navigation change makes the target
  clear.
- Prefer native elements and normal Tab order.
- Keep detail errors attached to their field; do not replace focus semantics
  with live-region repetition.
- Restore focus to a meaningful opener after a temporary modal interaction.
- Test desktop keyboard and touch screen-reader order separately.
