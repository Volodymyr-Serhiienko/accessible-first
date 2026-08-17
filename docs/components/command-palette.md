# CommandPalette

CommandPalette creates a modal searchable command picker.

Use it for quick navigation, application commands, settings shortcuts, and Ctrl+K style interfaces where users should be able to search actions without leaving the current screen.

## Quick Start

```ts
const palette = CommandPalette({
    trigger: "Open commands",
    items: [
        {
            id: "open-settings",
            label: "Open settings",
            description: "Go to application preferences.",
            keywords: ["preferences", "account"],
            run() {
                router.navigate("settings", {
                    updateHistory: true,
                    focusTarget: "outlet"
                });
            }
        }
    ]
});
```

## When To Use

Use CommandPalette when an application has several actions or destinations that benefit from fast search:

- page or screen navigation;
- settings and preference shortcuts;
- common workflow commands;
- developer or playground tools;
- power-user keyboard flows.

Do not use it for critical confirmations. Use [Dialog](./dialog.md) or [AlertDialog](./alert-dialog.md) when the user must review important information before continuing.

## Layers

- Composition API: `CommandPalette(options)`
- Reuses: `Dialog`, `SearchBox`, `Combobox`, and `ActionsBar` through Dialog
- Styling hooks: `[data-af-command-palette]`, `[data-af-command-palette-dialog]`, and `[data-af-command-palette-search]`

## Behavior

- Opens as a modal dialog.
- Moves initial focus to the search input.
- Filters commands through the shared SearchBox behavior.
- Runs the selected command's `run(...)` callback when present.
- Calls `onSelect(...)` after item-level `run(...)`.
- Closes after selection by default.
- Allows individual commands to opt out with `closeOnSelect: false`.
- Restores focus through Dialog behavior when closed.

## Options

- `trigger` - content for the trigger button.
- `items` - command list.
- `title` - dialog title. Defaults to `Command palette`.
- `description` - dialog description. Defaults to a short usage hint. Use `null` to omit it.
- `searchLabel` - accessible label for the search input.
- `placeholder` - search input placeholder.
- `notFoundText` - visible and announced empty-results message.
- `closeOnSelect` - whether commands close the palette by default.
- `searchBoxOptions` - SearchBox options not owned by CommandPalette.
- `dialogOptions` - Dialog options not owned by CommandPalette.
- `onSelect` - called when a command is selected.
- `onOpenChange` - called when the palette opens or closes.

## Command Items

Command items extend SearchBox items:

```ts
{
    id: "open-lessons",
    label: "Open lessons",
    description: "Browse language lessons.",
    keywords: ["study", "practice"],
    data: { section: "learning" },
    closeOnSelect: true,
    run(detail, palette) {
        palette.close();
    }
}
```

Supported fields:

- `id` - stable command id.
- `label` - visible command label.
- `description` - optional result description.
- `keywords` - extra searchable terms.
- `disabled` - disables the command result.
- `data` - application-specific payload.
- `optionOptions` - options for the generated result option.
- `run` - item-level command callback.
- `closeOnSelect` - per-item closing override.

## Runtime Passed To Commands

Item-level `run(...)` callbacks receive a small runtime instead of the full component instance:

- `open()`
- `close()`
- `toggle()`
- `setOpen(open)`
- `isOpen()`

This keeps item callbacks simple and avoids coupling individual commands to the full generic component API.

## Styling

CommandPalette uses Dialog and SearchBox styles. Useful CSS custom properties include:

```css
[data-af-command-palette-dialog] {
    --af-command-palette-width: 42rem;
    --af-command-palette-results-width: 42rem;
    --af-command-palette-results-max-block-size: 22rem;
}
```

## Accessibility

CommandPalette inherits modal semantics, focus trapping, scroll locking, and focus restoration from Dialog. Search results inherit Combobox keyboard behavior from SearchBox.

Give every command a clear label. Add descriptions when labels alone do not explain the result or action well enough.

## Manual Checks

- Trigger opens the palette.
- Focus moves to the search input.
- Typing filters results.
- Arrow keys move through results.
- Enter selects the active command.
- Escape closes the palette and restores focus.
- Empty results show `notFoundText`.
- Screen reader announces the dialog title, description, search input, result count behavior, and selected result.
- On mobile, the dialog fits inside the viewport and the keyboard does not create horizontal overflow.
