# Combobox

Combobox provides an editable input with a filtered listbox popup.

## When To Use

Use `Combobox` when users should be able to type text and choose from matching suggestions.

Use `Select` when native form selection is enough and mobile platform picker behavior is preferred.

Use `Listbox` when the option list should stay visible on the page.

## Quick Start

```ts
Combobox({
    label: "Documentation topic",
    placeholder: "Type to filter topics",
    notFoundText: "No matching topics found.",
    items: [
        { value: "button", label: "Button" },
        { value: "combobox", label: "Combobox" },
        { value: "dialog", label: "Dialog" }
    ],
    onValueChange(detail) {
        console.log(detail.value, detail.selectedText);
    }
});
```

With a default value:

```ts
Combobox({
    label: "Testing device",
    defaultValue: "tablet",
    items: [
        { value: "desktop", label: "Desktop keyboard" },
        { value: "tablet", label: "Tablet screen reader" },
        { value: "phone", label: "Phone touch screen" }
    ]
});
```

## Layers

- Enhancement API: `createCombobox(input, listbox, options)`
- Composition API: `Combobox(options)`
- Reuses: core `createCombobox`, collection navigation, popover positioning, scroll utilities, component lifecycle, and optional live announcements

## Behavior

- Keeps DOM focus on the input.
- Exposes the popup with `aria-expanded`, `aria-controls`, and `aria-haspopup="listbox"`.
- Exposes the active option through `aria-activedescendant`.
- Uses `role="combobox"` on the input.
- Uses `role="listbox"` on the popup.
- Uses `role="option"` on each option.
- Filters options as the user types.
- Opens on focus by default.
- Opens on input by default.
- Closes on blur and outside pointer interaction.
- Supports disabled options.
- Can show and announce `notFoundText` when no options match the current input.
- Positions the popup with the shared popover-position module.

Keyboard behavior:

- Typing filters matching options.
- `ArrowDown` opens the popup or moves to the next option.
- `ArrowUp` opens the popup or moves to the previous option.
- `Enter` selects the active option.
- `Escape` closes the popup.
- `Alt+ArrowDown` opens the popup.
- `Alt+ArrowUp` closes the popup.

## Options

Root options:

- `label` - Optional visible label text.
- `labelOptions` - Common DOM options for the label element.
- `inputOptions` - Common DOM options for the input element.
- `listboxOptions` - Common DOM options for the popup listbox.
- `placeholder` - Native input placeholder.
- `name` - Native form field name.
- `required` - Marks the input as required.
- `items` - Required list of option definitions.
- `value` - Controlled selected value.
- `defaultValue` - Initially selected value. Creation-time option.
- `inputValue` - Controlled input text.
- `defaultInputValue` - Initial input text. Creation-time option.
- `notFoundText` - Optional text shown and announced when no options match the typed input.
- `notFoundOptions` - Common DOM options for the not-found message element.
- `announceNotFound` - Announces `notFoundText` through a polite live region. Defaults to `true`.
- `autocomplete` - `"list"` or `"none"`.
- `disabled` - Disables the input and closes the popup.
- `open` - Controlled open state.
- `defaultOpen` - Opens initially. Creation-time option.
- `openOnFocus` - Opens when input receives focus. Defaults to `true`; set to `false` for quieter fields.
- `openOnInput` - Opens while typing. Defaults to `true`.
- `closeOnBlur` - Closes when focus leaves the input/listbox interaction. Defaults to `true`.
- `closeOnEmpty` - Closes when no options match. Defaults to `true`, but defaults to `false` when `notFoundText` is provided.
- `loop` - Allows arrow navigation to wrap.
- `filterOption` - Custom option filter, or `null` to disable filtering.
- `side`, `alignment`, `strategy`, `offset`, `crossAxisOffset`, `collisionPadding`, `flip`, `shift`, `matchAnchorWidth`, `autoUpdate` - Popup positioning options.
- `variant` - `"default"` or `"plain"`.
- `size` - `"md"`.
- `onOpenChange` - Called when popup open state changes.
- `onValueChange` - Called when input text or selected option changes.
- `onActiveOptionChange` - Called when active option changes.
- common composition options from [foundation.md](./foundation.md#common-composition-options).

Item options:

- `value` - Stable option value.
- `label` - Required option label content.
- `textValue` - Optional plain text used for filtering and the selected input value when the visual label contains richer content.
- `disabled` - Disables one option.
- `optionOptions` - Common DOM options for the option element.

## Not Found State

Use `notFoundText` when users need explicit feedback that the current query has no matching options.

```ts
Combobox({
    label: "Component",
    notFoundText: "No matching components found.",
    items: [...]
});
```

When `notFoundText` is provided and `closeOnEmpty` is not set, the popup stays open for empty result sets so the message can be shown.

Set `announceNotFound: false` when the message should be visible only.

## Update Notes

`defaultValue`, `defaultInputValue`, and `defaultOpen` are creation-time options.

Change selection through `value` or controller methods:

```ts
const combobox = Combobox({
    label: "Topic",
    items: [
        { value: "button", label: "Button" },
        { value: "dialog", label: "Dialog" }
    ]
});

combobox.setSelectedValue("dialog");
```

Item updates are partial and matched by index:

```ts
combobox.update({
    items: [
        { label: "Primary button" },
        { disabled: true }
    ]
});
```

## Styling

Useful hooks include `[data-af-composition="combobox"]`, `[data-af-component="combobox"]`, `[data-af-combobox-label]`, `[data-af-combobox-input]`, `[data-af-combobox-listbox]`, `[data-af-combobox-option]`, `[data-af-combobox-not-found]`, `[aria-selected]`, `[aria-disabled]`, `[data-af-variant]`, and `[data-af-state]`.

Useful CSS custom properties:

- `--af-combobox-width` - composed combobox width.
- `--af-combobox-listbox-max-width` - popup maximum width.
- `--af-combobox-listbox-max-block-size` - popup maximum height before scrolling.

```ts
Combobox({
    className: "settings-combobox",
    label: "Component",
    items: [...]
});
```

## Manual Checks

- Label is announced with the input.
- Focus opens the popup and shows available options when the input is empty.
- Typing opens and filters the popup.
- Active option is announced while using arrow keys.
- `Enter` selects the active option.
- `Escape` closes the popup.
- Disabled options cannot be selected.
- `notFoundText` appears and is announced when no result matches.
- Focus remains on the input while navigating options.
- Focus indicator is visible.
- Popup stays within the viewport on small screens.
- Touch and mobile screen reader behavior is understandable.
