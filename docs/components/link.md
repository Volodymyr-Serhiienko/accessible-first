# Link Component

## Purpose

The Link component provides accessible navigation behavior and default styling hooks.

Native `a` elements are preferred. Non-native elements receive fallback link semantics and Enter-key activation.

## Public API

```ts
const link = createLink(element, {
    href: "/docs",
    variant: "default"
});

link.setCurrent("page");
link.setDisabled(true);
link.destroy();
```

---

## Behavior

* Preserves native anchor navigation when used with <a>
* Adds role="link" for non-native elements
* Adds Enter-key activation for non-native elements
* Supports disabled state through aria-disabled
* Removes disabled links from the tab order
* Supports aria-current
* Supports external links with safe _blank defaults
* Exposes stable data attributes for styling
* Restores original attributes on destroy

## Manual Testing

### Desktop:

* Tab reaches enabled links
* Disabled links are skipped
* Focus indicator is clearly visible
* Enter activates the link
* Current page links expose aria-current
* External links use safe rel values when opened in a new tab
* Text contrast is readable in light and dark themes

### Mobile:

* Tap activates enabled links
* Disabled links cannot be activated
* Link text is readable
* Screen reader announces the accessible name and link role
* Current page links announce current state where supported
