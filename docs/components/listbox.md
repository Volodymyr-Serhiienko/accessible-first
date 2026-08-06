# Listbox

Listbox provides selectable option lists with keyboard navigation and optional typeahead.

## When To Use

Use `Listbox` when users need to choose one or more options from a visible list.

For collapsed native form selection, a future `Select` component will build on similar behavior.

## Quick Start

```ts
Listbox({
    defaultValue: "documentation",
    items: [
        { value: "components", label: "Components" },
        { value: "documentation", label: "Documentation" },
        { value: "patterns", label: "Page patterns" },
        { value: "disabled", label: "Unavailable option", disabled: true }
    ],
    onSelectionChange(detail) {
        console.log(detail.selectedValues);
    }
});
```

Multiple selection:

```ts
Listbox({
    selectionMode: "multiple",
    defaultValue: ["keyboard", "mobile"],
    items: [
        { value: "keyboard", label: "Keyboard support" },
        { value: "screen-reader", label: "Screen reader checks" },
        { value: "mobile", label: "Mobile testing" }
    ]
});
```

## Layers

- Enhancement API: `createListbox(element, options)`
- Composition API: `Listbox(options)`
- Reuses: core `createListbox`, roving focus, selection, typeahead, hover announcement helper

## Behavior

- Adds `role="listbox"` to the root element.
- Adds `role="option"` to every option.
- Keeps `aria-selected` synchronized with selection state.
- Adds `aria-multiselectable="true"` for multiple-selection listboxes.
- Uses roving tabindex so one option is reachable from the normal `Tab` sequence.
- Supports vertical and horizontal arrow-key navigation.
- Supports single and multiple selection.
- Supports typeahead by default.
- Skips disabled options.
- Announces option labels on mouse hover by default for screen reader setups that do not reliably announce options on pointer hover.

Keyboard behavior:

- `Tab` moves focus into the current option and then onward to the next focusable page control.
- Arrow keys move between enabled options.
- `Home` moves to the first enabled option.
- `End` moves to the last enabled option.
- Typing printable characters moves to the next matching option when typeahead is enabled.
- In single-selection mode, selection follows focus by default.
- In multiple-selection mode, `Enter` or `Space` toggles the focused option.

## Options

Root options:

- `items` - Required list of option definitions.
- `value` - Controlled selected value or values.
- `defaultValue` - Initially selected value or values.
- `orientation` - `"vertical"` or `"horizontal"`. Creation-time option.
- `selectionMode` - `"single"` or `"multiple"`. Creation-time option.
- `selectionFollowsFocus` - Selects focused options automatically. Creation-time option.
- `loop` - Allows arrow navigation to wrap. Creation-time option.
- `typeahead` - Enables character search. Creation-time option.
- `typeaheadTimeout` - Query reset timeout for typeahead. Creation-time option.
- `variant` - `"default"` or `"plain"`.
- `size` - `"md"`.
- `announceOnHover` - Announces option labels on mouse hover. Defaults to `true`.
- `onSelectionChange` - Called when selected options change.
- common composition options from [foundation.md](./foundation.md#common-composition-options).

Item options:

- `value` - Stable option value.
- `label` - Required option label content.
- `disabled` - Disables one option.
- `defaultSelected` - Selects one option initially when `value` and `defaultValue` are not provided.
- `optionOptions` - Common DOM options for the option element.
- `announceOnHover` - Per-option hover announcement override.
- `hoverAnnouncement` - Custom hover announcement text for one option.

## Update Notes

`orientation`, `selectionMode`, `selectionFollowsFocus`, `loop`, `typeahead`, `typeaheadTimeout`, and `defaultValue` are creation-time options.

Change selection through `value` or controller methods:

```ts
const listbox = Listbox({
    items: [
        { value: "one", label: "One" },
        { value: "two", label: "Two" }
    ]
});

listbox.setSelectedValues("two");
```

Item updates are partial and matched by index:

```ts
listbox.update({
    items: [
        { label: "Updated option" },
        { disabled: true }
    ]
});
```

## Styling

Useful hooks include `[data-af-component="listbox"]`, `[data-af-listbox-option]`, `[aria-selected]`, `[aria-disabled]`, `[data-af-orientation]`, and `[data-af-selection-mode]`.

```ts
Listbox({
    className: "settings-listbox",
    items: [...]
});
```

## Manual Checks

- Option names are announced.
- Selected state is announced.
- Arrow keys move between enabled options.
- Disabled options cannot be selected.
- Typeahead moves to matching options.
- Single-selection mode updates predictably.
- Multiple-selection mode toggles options with `Enter` or `Space`.
- Focus indicator is visible.
- Mouse hover announces option labels when `announceOnHover` is enabled.
- Touch targets are comfortable on mobile.
