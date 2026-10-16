# DOM Module

Small native-browser primitives shared by focus, ARIA and component behavior.
They have no framework or external-library dependency.

## Ownership And Identity

| Helper | Contract |
| --- | --- |
| `isHTMLElement(value)` | Cross-realm HTMLElement check, including adopted nodes whose original prototype no longer matches their current document's window; SVG/structural imitations are rejected. |
| `getOwnerDocument(node)` | Returns a Document argument itself, otherwise its owner document; global document is the last fallback. |
| `getOwnerWindow(node)` | Resolves the owning document's window, including an iframe Document. |
| `getActiveElement(node)` | Returns the active HTMLElement in that owning document, or null. |
| `contains(container, target)` | Native containment, false for a null target. |

Use these helpers instead of global `instanceof HTMLElement` or `document`
when a controller can receive nodes from another document. Iframe access must
still be same-origin; these helpers do not bypass browser isolation.

## Availability

| Helper | Contract |
| --- | --- |
| `isDisabled(element)` | Native `:disabled`, including inherited disabled fieldset state and the first-legend exception. |
| `isHidden(element)` | Presence of the element's own `hidden` attribute; not an ancestor/CSS traversal. |
| `isInert(element)` | An `inert` ancestor or the element itself in the light DOM. |
| `isVisible(element)` | Own hidden state, computed display/visibility, skipped-subtree checks and nonempty client rects. Requires browser layout. |

Visibility is not a pixel-occlusion, opacity, viewport or full Shadow DOM test.
`isVisible()` is not a replacement for a real focus attempt. Native Tab-order
discovery has additional constraints documented in [Focus](focus.md).
Native `checkVisibility({ visibilityProperty: true })` excludes skipped content;
older engines use ancestor checks for closed `details` (preserving its first
summary subtree) and `content-visibility:hidden`. An explicit visible child of a
`visibility:hidden` parent remains available. No new mandatory browser API is added.

## Attribute Ownership

`restoreAttribute(element, name, value)` restores a captured value, removing the
attribute for null. `createAttributeSnapshot()` remembers each original value
once and restores the captured attributes together. Use it for enhancement
controllers that borrow existing author markup; do not replace unrelated state.
`snapshot.restoreElement(element)` restores and releases just that element.
Dynamic controllers use it when an item leaves their collection, so later author
changes are not overwritten at final teardown and removed nodes are not retained.
