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
`focusProgrammatically()` temporarily applies `tabindex="-1"` when needed,
then restores the prior attribute. Prefer it for a route heading, screen, or
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
trap.destroy();
```

Use a focus trap only for an active modal interaction. It is not a general
layout or navigation tool.

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