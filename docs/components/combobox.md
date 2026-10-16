# Combobox

Combobox provides an editable input with a filtered listbox popup, or a read-only
choice control when native `input.readOnly` is enabled.

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
- Reuses: core `createCombobox`, collection navigation, popover positioning, scroll utilities, component lifecycle, hover announcement helper, and optional live announcements

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
- Can show and announce `notFoundText` through the document-coordinated channel when no options match the current input.
- Announces option labels on mouse hover by default for screen reader setups that do not reliably announce custom popup options on pointer hover.
- Positions the popup with the shared popover-position module.

Keyboard behavior:

- Typing filters matching options.
- `ArrowDown` opens the popup or moves to the next option.
- `ArrowUp` opens the popup or moves to the previous option.
- `Enter` selects the active option.
- `Escape` closes the popup.
- `Alt+ArrowDown` opens the popup.
- `Alt+ArrowUp` closes the popup.

IME composition, already-prevented keyboard events and repeated `Enter` do not
commit a selection. Read-only input ignores text input and adds click/Space toggling.

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
- `value` - Selected value applied at creation or through `combobox.update({ value })`.
- `defaultValue` - Initially selected value. Creation-time option.
- `inputValue` - Input text applied through creation or update.
- `defaultInputValue` - Initial input text. Creation-time option.
- `notFoundText` - Optional text shown and announced when no options match the typed input.
- `notFoundOptions` - Common DOM options for the not-found message element.
- `announceNotFound` - Announces `notFoundText` through the document-coordinated polite live region. Defaults to `true`.
- `announceOnHover` - Announces option labels on mouse hover. Defaults to `true`.
- `autocomplete` - `"list"` or `"none"`.
- `disabled` - Disables the input and closes the popup.
- `pending` - Guards user activation/editing while keeping input focus and busy semantics; closes the popup.
- `pendingMessage`, `pendingDelay` - Shared waiting announcement options; the default message is silent.
- `open` - Open state applied through creation or update.
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
- `announceOnHover` - Per-option hover announcement override.
- `hoverAnnouncement` - Custom hover announcement text for one option.

## Read-Only Choice And Pending

```ts
const filter = Combobox({
    label: "Role",
    inputOptions: { attributes: { readonly: true } },
    autocomplete: "none",
    filterOption: null,
    openOnFocus: false,
    openOnInput: false,
    items: [{ value: "all", label: "All" }, { value: "editor", label: "Editor" }]
});
filter.setPending(true);
filter.setPending(false);
```

Core owns click/Space toggling, arrow navigation and selection; do not add duplicate
pointer handlers. Application callbacks decide whether pointer selection immediately
applies a server filter or only Enter submits it. Locale selection may apply immediately.

Pending also supports `update({ pending })` and `isPending()`. Tab/Escape, text navigation
and copying remain available; busy focus alone does not open the popup. It neither
disables nor renames the input. Keep request/programmatic guards in the application.
If a parent already announces the request wait, use `pendingMessage: false` to avoid
duplicate feedback. See [pending contract](foundation.md#shared-helpers).

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

Set `announceNotFound: false` when the message should be visible only. The default announcement shares the document channel with other framework feedback, so it does not create a competing live region. Do not additionally send a toast or status message for the same empty-result transition unless it communicates different information.

## Speech And Hover Announcements

Selection changes are exposed through combobox semantics and `aria-activedescendant`; use `onValueChange` when the application should also send a separate status or toast.

`announceOnHover` is a pointer-hover compatibility helper. It politely announces option labels for screen reader setups that do not reliably speak custom popup options on mouse hover. Disable it with `announceOnHover: false` when an application does not need pointer-hover speech.

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

Use `setItems()` when the whole option list changes:

```ts
combobox.setItems([
    { value: "button", label: "Button" },
    { value: "tabs", label: "Tabs" }
]);
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

Full replacement retires old option handles and owned labels; setters on retired
handles do nothing. Cleanup completes after a label failure, including sibling
metadata/filter refresh during partial updates. Reentrant newer replacement wins.
`destroy()` is terminal and frees all option content and behavior, even when one
child cleanup throws. Do not share the same owned composed label between owners.
Custom filters are synchronous; newer replacement/destroy during filtering cancels
the obsolete filter pass. Selection preserves focus moved by an application callback.

## Styling

The root/input can shrink within a narrow grid; long labels and options reflow.
Hover never replaces a selected option's contrasting background. Free-width
popups respect the configured maximum and their containing viewport, including
when `matchAnchorWidth` is false. CSS limits size; the positioning helper handles
collision placement. Native input values remain single-line and scroll internally.

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
- Mouse hover announces option labels when `announceOnHover` is enabled.
- Focus remains on the input while navigating options.
- Focus indicator is visible.
- Popup stays within the viewport on small screens.
- Long option labels wrap without horizontal scrolling, including language pickers.
- Touch and mobile screen reader behavior is understandable.

