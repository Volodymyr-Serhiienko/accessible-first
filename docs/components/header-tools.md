# HeaderTools

HeaderTools is an adaptive header overflow component for application controls.

Use it inside `HeaderBar({ actions })` when controls such as search, commands, language, theme, and profile actions should stay inline while they fit, then move into one accessible popover when the header becomes too narrow.

## Quick Start

```ts
HeaderBar({
    brand: Brand({ name: "Accessible First" }),
    actions: HeaderTools({
        locale,
        controls: [
            RouteSearchBox({ routes, locale }),
            RouteCommandPalette({ routes, locale }),
            LanguageSelect({ locale }),
            ThemeToggle({ locale, display: "switch" })
        ]
    })
});
```

## Behavior

- Renders one control set and moves it between inline placement and the overflow panel.
- Switches to menu placement when controls would overflow the header or wrap below the brand row.
- Probes inline placement again when the header becomes wider.
- Opens the overflow panel as a popover with dialog semantics, title, description, announcement, collision handling, and explicit close button.
- Restores focus to the trigger when the close button is used.
- Closes when focus leaves the panel, when the anchor disappears, or when the popover dismiss behavior closes it.
- Subscribes to locale changes when the locale provider supports `subscribe()`.

## Options

- `controls` - required composed controls to place inline or in the overflow panel.
- `locale` - shared localization provider for framework-owned service text.
- `triggerLabel`, `triggerHint`, `triggerIcon` - override the overflow trigger accessible name, hint, or icon.
- `title`, `description`, `closeText` - override panel title, panel description, or close button text. Set `closeText: null` to hide the explicit close button.
- `container` - optional element used for placement checks. Defaults to the closest `HeaderBar`.
- `inlineProbeDelta` - extra width needed before probing a return from menu to inline placement. Defaults to `16`.
- `inlineOptions`, `menuOptions`, `panelOptions`, `controlsOptions`, `footerOptions` - advanced DOM options for internal slots.
- `triggerOptions`, `closeButtonOptions` - advanced options passed to the internal trigger and close button.
- Base options: `id`, `className`, `attributes`.

## Styling

Useful hooks include `[data-af-composition="header-tools"]`, `[data-af-header-tools-inline]`, `[data-af-header-tools-menu]`, `[data-af-header-tools-panel]`, `[data-af-header-tools-controls]`, and `[data-af-header-tools-footer]`.

Useful variables:

- `--af-header-tools-panel-width` - preferred desktop popover width. Defaults to `22rem`.
- `--af-header-tools-panel-mobile-width` - preferred mobile popover width. Defaults to `20rem`.

Controls inside the panel are constrained to the panel width. Search boxes are allowed to fill the panel even when they use a narrower inline width.

## Accessibility Notes

HeaderTools is not a navigation component. It is for utility controls that are part of the app header.

The overflow trigger uses `IconButton` with a visible tooltip and screen-reader hint by default. The panel title and description are announced when the panel opens, and the close button gives keyboard and screen-reader users an explicit final stop.

Prefer moving one control set instead of rendering separate desktop and mobile controls. Duplicating controls can create duplicate shortcuts, stale state, and confusing screen-reader order.

## Manual Checks

- On a wide viewport, controls stay inline beside the brand.
- When the header becomes narrow, only the overflow trigger remains beside the brand.
- Opening the trigger announces the panel title and description once.
- Tab moves through panel controls and reaches the close button.
- Closing the panel returns focus to the trigger.
- Resizing back to a wide viewport moves the same controls inline again.
