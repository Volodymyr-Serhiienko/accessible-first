# Core Combobox Behavior

## Purpose

`createCombobox()` enhances an existing input and listbox with the WAI-ARIA
combobox interaction model. It is the low-level behavior layer beneath the
composed `Combobox()` component.

Use the composed component for ordinary application UI. Use this core API only
when an application already owns the input, popup listbox, option rendering, or
non-standard data lifecycle.

## Quick Start

```ts
const controller = createCombobox(input, listbox, {
    getOptions: () => Array.from(
        listbox.querySelectorAll<HTMLElement>("[data-option]")
    )
});
```

The caller owns option content, filtering data, application text, and visual
styles. The controller owns combobox semantics and keyboard behavior.

## Contract

- DOM focus remains on the input.
- The input receives `role="combobox"`, `aria-expanded`, `aria-controls`,
  `aria-haspopup="listbox"`, and `aria-activedescendant` when applicable.
- The popup receives `role="listbox"`; available options receive
  `role="option"` and selection state.
- Arrow keys move the active option; `Enter` selects it; `Escape` closes the
  popup; `Alt+ArrowDown` opens it; and `Alt+ArrowUp` closes it.
- Filtering, disabled options, selection, positioning, and callbacks are
  configurable through `ComboboxOptions`.
- `destroy()` removes listeners, restores captured attributes and input state,
  and tears down popup positioning.

## Boundaries

The controller requires an actual `HTMLInputElement`, an existing popup
container, and a `getOptions()` function that returns the current option
elements. It does not create labels, option text, empty-result UI, localized
service copy, or application data.

For those responsibilities, use the composed [Combobox](../components/combobox.md)
or combine this behavior with application-owned DOM.

## Related APIs

- `createListbox()` for a visible, non-editable option list.
- `createPopoverPosition()` for standalone floating-position behavior.
- `createTypeahead()` for list or grid typeahead without a text input.
- `Combobox()` for Accessible First composition, labels, options, styles, and
  localized empty-result feedback.