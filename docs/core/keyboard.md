# Keyboard Module

Small key classifiers shared by component behavior. Every helper accepts a
`KeyboardEvent` and returns a boolean; it does not cancel the event or move focus.

## Key Helpers

| Helper | `event.key` |
| --- | --- |
| `isTabKey` | `Tab` |
| `isEscapeKey` | `Escape` |
| `isEnterKey` | `Enter` |
| `isSpaceKey` | A space or legacy `Spacebar` |
| `isArrowUpKey`, `isArrowDownKey` | `ArrowUp`, `ArrowDown` |
| `isArrowLeftKey`, `isArrowRightKey` | `ArrowLeft`, `ArrowRight` |
| `isHomeKey`, `isEndKey` | `Home`, `End` |
| `isPageUpKey`, `isPageDownKey` | `PageUp`, `PageDown` |
| `isDeleteKey`, `isBackspaceKey` | `Delete`, `Backspace` |

## Event Ownership

Callers choose policy before classifying a key. Ordinary collection navigation
and activation ignore already-handled events, IME composition and Ctrl/Alt/Meta
chords. Shift remains meaningful for reverse Tab or a typed uppercase letter.
Do not turn that policy into a global shortcut blocker: Combobox deliberately
supports Alt+Arrow commands, and application shortcuts own their explicit chords.

Roving focus handles only events from registered items. A focused editable
descendant or a nested widget keeps its own keyboard behavior. A parent focus
trap must not process a Tab event already handled by a child trap.

These helpers do not implement RTL direction mapping, application shortcuts,
composition handling or locale-dependent search themselves. Keep those rules in
the owning controller and verify native keyboard interaction in a browser.
