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
- Uses a generic localized description by default, so the panel remains accurate when the configured controls change.
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
Inline text buttons use their intrinsic label/reserved-label width instead of
shrinking into multiple lines. If controls no longer fit beside the brand,
HeaderTools moves them into the panel, where long labels may wrap normally.

The stable `controls` container moves between the inline host and panel body;
inline layout makes that container transparent with `display: contents`. Scope
panel-only custom rules under `[data-af-header-tools-panel]`. The closed panel
stays out of layout from its first opening, so it cannot displace its own anchor.

## Accessibility Notes

HeaderTools is not a navigation component. It is for utility controls that are part of the app header.

The overflow trigger uses `IconButton` with a hover-only visual tooltip and a
screen-reader description available on focus. The panel title and description are announced when the panel opens, and the close button gives keyboard and screen-reader users an explicit final stop.

Prefer moving one control set instead of rendering separate desktop and mobile controls. Duplicating controls can create duplicate shortcuts, stale state, and confusing screen-reader order.

Resize preserves an existing control focus when returning inline; collapsing a
focused inline control moves focus to the visible tools trigger. Widening while
that trigger is focused chooses the first available inline control. Outside focus
is preserved. Full control replacement leaves a removed control's destination to
the application. Controls reused by identity retain state and ownership.

`checkPlacement()` explicitly rechecks available space; automatic resize checks use
the probe delta to avoid oscillation. A component mounted later without a matching
container does not poll each frame: call `checkPlacement()` after mounting it.
Differently sized controls on the same visual row are not treated as wrapped.

`closeText: null` hides the explicit close action; `description: null` removes that
description. Updated close-button callbacks run before internal close and can cancel
it with `preventDefault()`. Locale replacement rejects obsolete callbacks. Destruction
cancels scheduled work and attempts every resource/owned control cleanup before
rethrowing the first error; late updates do nothing. Internal controllers are borrowed.

## Manual Checks

- On a wide viewport, controls stay inline beside the brand.
- When the header becomes narrow, only the overflow trigger remains beside the brand.
- Opening the trigger announces the panel title and description once.
- Tab moves through panel controls and reaches the close button.
- Closing the panel returns focus to the trigger.
- Resizing back to a wide viewport moves the same controls inline again.
