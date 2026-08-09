# Popover

Popover provides anchored floating content for lightweight non-modal UI.

## When To Use

Use `Popover` when content should appear near a trigger without taking over the whole page.

Good uses include quick actions, small help panels, dropdown shells, combobox popups, and future responsive navigation panels.

Use `Disclosure` when content should expand in the normal page flow. Use `Dialog` when the workflow is modal and focus must stay inside the overlay.

## Quick Start

```ts
Popover({
    trigger: "Open guidance",
    description: "Short guidance appears in a floating panel.",
    children: [
        P("Popover content goes here.")
    ]
});
```

Positioned actions:

```ts
const actions = Popover({
    trigger: "Quick actions",
    description: "Choose one action from the floating panel.",
    side: "bottom",
    alignment: "start",
    matchAnchorWidth: true,
    children: [
        Button({
            text: "Preview",
            onPress() {
                actions.close();
            }
        })
    ]
});
```

Enhance existing HTML:

```ts
const popover = createPopover(content, {
    trigger,
    role: "dialog",
    hasPopup: "dialog",
    labelledBy: "help-title",
    describedBy: "help-description"
});
```

## Layers

- Enhancement API: `createPopover(content, options)`
- Composition API: `Popover(options)`
- Reuses: dismissable layer, overlay stack, popover positioning, optional live announcements, and component lifecycle

## Behavior

- Keeps the trigger in the normal tab order.
- Opens and closes anchored floating content.
- Does not trap focus by default.
- Allows `Tab` to move into focusable content inside the popover and then continue through the page.
- Restores focus to the trigger on close when focus was inside the popover and `restoreFocus` is enabled.
- Closes with `Escape` by default.
- Closes on pointer interaction outside by default.
- Can close on focus leaving the popover when `dismissOnFocusOutside` is enabled.
- Repositions on scroll, resize, wheel, and touch movement while open.
- Closes when the trigger leaves the viewport when `closeOnAnchorHidden` is enabled.
- Connects trigger and content with `aria-controls`.
- Updates trigger `aria-expanded`.
- Applies `aria-haspopup` from `hasPopup`, or from `role` when `hasPopup` is not provided.
- Supports optional `aria-labelledby` and `aria-describedby`.
- Composition API can create a visible `description`.
- Composition `descriptionMode: "content"` keeps the description visible only. This is the default.
- Composition `descriptionMode: "aria"` links the visible description with `aria-describedby`.
- When a composed description exists and no explicit `announcement` is provided, the description can be announced when the popover opens.
- Exposes stable data attributes for styling.
- Restores original attributes on `destroy()`.

## Options

Root options:

- `trigger` - Required trigger content for `Popover()`, or trigger element for `createPopover()`.
- `children` - Floating content for the composition API.
- `description` - Optional visible explanation for composed popovers.
- `descriptionMode` - `"content"` or `"aria"`. Defaults to `"content"`.
- `contentId` - Custom id for the floating content.
- `contentOptions` - Common DOM options for the composed content element.
- `open` - Controlled open state.
- `defaultOpen` - Opens initially.
- `disabled` - Prevents opening and closes the popover.
- `restoreFocus` - Restores focus to the trigger when closing from inside the popover. Defaults to `true`.
- `closeOnAnchorHidden` - Closes the popover when the trigger leaves the viewport. Defaults to `true`.
- `role` - Optional role for the floating content: `"dialog"`, `"menu"`, `"listbox"`, `"tree"`, `"grid"`, or `null`.
- `hasPopup` - Explicit trigger `aria-haspopup` value.
- `labelledBy` - Element or id that labels the popover content.
- `describedBy` - Element or id that describes the popover content.
- `announcement` - Announces text when the popover opens.
- `dismissOnEscape` - Allows `Escape` to close the popover.
- `dismissOnPointerDownOutside` - Allows outside pointer interaction to close the popover.
- `dismissOnFocusOutside` - Allows outside focus movement to close the popover.
- `side` - Preferred placement side: `"top"`, `"right"`, `"bottom"`, or `"left"`.
- `alignment` - Cross-axis alignment: `"start"`, `"center"`, or `"end"`.
- `strategy` - CSS position strategy: `"absolute"` or `"fixed"`.
- `offset` - Distance from trigger.
- `crossAxisOffset` - Cross-axis offset.
- `collisionPadding` - Viewport collision padding.
- `flip` - Allows placement to flip when space is limited.
- `shift` - Keeps the popover inside the viewport when possible.
- `matchAnchorWidth` - Makes the popover at least as wide as the trigger.
- `autoUpdate` - Repositions on scroll, resize, wheel, and touch movement.
- `variant` - `"default"` or `"plain"`.
- `size` - `"md"`.
- `onOpenChange` - Called when open state changes.
- common composition options from [foundation.md](./foundation.md#common-composition-options).

Creation-time options:

- `defaultOpen`
- `useOverlayStack`
- `overlayStack`

## Description And Announcement

`description` and `announcement` serve different jobs.

Use `description` for visible helper text. By default it stays as content and can be announced on open without being repeated when focus later enters the popover.

Use `descriptionMode: "aria"` only when the popover container itself should be described by that text. This is useful for dialog-like popovers, but it can cause repeated speech in some screen reader and browser combinations if the same description is also announced on open.

Use `announcement` when something should be read through a live region on open without moving focus into the popover, especially when the spoken message should be different from the visible description.

When a composed description exists and no explicit `announcement` is provided, the description is announced when the popover opens. Set `announcement: false` to keep the description visible and semantic without an open live-region message.

```ts
Popover({
    trigger: "Open tips",
    description: "Use Tab to move into the panel.",
    children: [
        P("Tip content.")
    ]
});
```

Dialog-like popover:

```ts
Popover({
    trigger: "Open tools",
    description: "Choose one tool.",
    descriptionMode: "aria",
    announcement: false,
    role: "dialog",
    hasPopup: "dialog",
    labelledBy: "tools-title",
    children: [
        H3({ id: "tools-title" }, "Tools"),
        Button({ text: "Preview" })
    ]
});
```

Custom announcement:

```ts
Popover({
    trigger: "Open tips",
    description: "Visible helper text.",
    announcement: "Tips panel opened.",
    children: [
        P("Tip content.")
    ]
});
```

Disable open announcement:

```ts
Popover({
    trigger: "Open quiet panel",
    description: "Visible helper text.",
    announcement: false,
    children: [
        P("Quiet content.")
    ]
});
```

## Popover Versus Disclosure

`Disclosure` reveals content in place. It changes the page layout and is read as part of the normal document flow.

`Popover` creates floating content anchored to a trigger. It is for transient overlay content and can be positioned, dismissed from outside, and layered with other overlays.

If the content belongs permanently in the document, prefer `Disclosure`. If the content is temporary floating UI, prefer `Popover`.

## Styling

Useful hooks include `[data-af-composition="popover"]`, `[data-af-component="popover"]`, `[data-af-popover-content]`, `[data-af-popover-description]`, `[data-af-popover-body]`, `[data-af-open]`, `[data-af-side]`, and `[data-af-align]`.

Useful CSS custom properties:

- `--af-z-popover` - popover stacking level.
- `--af-popover-max-width` - maximum inline size.
- `--af-popover-max-block-size` - maximum block size before scrolling.

```ts
Popover({
    trigger: "Open help",
    className: "help-popover-wrapper",
    contentOptions: {
        className: "help-popover"
    },
    children: [...]
});
```

## Manual Checks

- Trigger announces expanded or collapsed state.
- Trigger announces popup type when `hasPopup` is provided.
- Opening positions the popover near the trigger.
- Scrolling keeps the popover anchored or closes it when the trigger leaves the viewport.
- `Escape` closes the popover when enabled.
- Pointer interaction outside closes the popover when enabled.
- `Tab` can move into focusable content inside the popover.
- `Tab` is not trapped inside the popover.
- Closing from inside restores focus to the trigger when `restoreFocus` is enabled.
- Description and announcement do not create repeated or confusing speech.
- Popover remains inside the viewport on small screens.
- Mobile screen reader can open, read, move through, and close the popover.
