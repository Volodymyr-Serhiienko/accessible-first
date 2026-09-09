# Playground And CSS Audit - September 2026

## Status

Complete for the current pass. Playground remains living documentation, and its
remaining local CSS has been classified against the framework style contract.
No unproven product presentation was promoted into the library.

## Confirmed First Fix

Playground currently loads `styles.css` from HTML before the library stylesheet
loaded by `main.ts`. That reverses the documented cascade order. The targeted
fix is to import local CSS immediately after the framework stylesheet from
`playground/main.ts` and remove the HTML `link`. Verify the Playground after
that change before removing visual overrides.

## Confirmed Second Fix

SearchBox is itself the Combobox element. Its SearchBox width must therefore
also constrain the inherited combobox width. The library stylesheet now owns
that invariant through `--af-combobox-width: 100%`, so Playground no longer
needs a local width workaround.

The next local-styles replacement removes only verified PageLayout duplicates
and obsolete navigation selectors. It deliberately retains presentation rules
that still describe the Playground rather than a reusable default.

## Local CSS Classification

### Completed Baseline Cleanup

The corrected stylesheet order is now active and the following duplicated local
rules have been removed from `playground/styles.css`:

- `body` theme, margin, and font declarations;
- page header, navigation, and footer borders;
- footer block padding and contained horizontal alignment;
- responsive Row/Button declarations that repeat composition and control
  defaults;
- the unused `.icon` selector.

`npm run check` builds the Playground and both independent starters after this
cleanup. Desktop and narrow-viewport browser checks remain part of the manual
release routine whenever a shared style changes.

### Keep Playground-Owned

These selectors describe a demonstration rather than a reusable framework
default:

- grid empty-cell artwork;
- raw trusted-HTML sample spacing;
- the manual-check list;
- Playground branding scale and its route-specific maximum width;
- the return-to-navigation link placement.

### Decisions From This Pass

1. **Panel typography stays local for now.** `Panel` is a framed
   semantic-neutral surface, not a second `Stack` or document-flow system. A
   global direct-heading and paragraph rule would also need to define gaps,
   heading-rank presentation, and arbitrary child interactions. Promote a
   Panel flow contract only after a second application uses the same structure.
2. **The SearchBox leading icon stays Playground-owned.** The current CSS mask
   is branding/presentation, not a semantic requirement. A future reusable
   feature must be an explicit SearchBox visual-slot API with a composition
   icon, not a framework-owned embedded SVG or English-dependent CSS.
3. **Mobile navigation overlay remains an application policy.** The framework
   already supplies an accessible Disclosure, real links, an explicit close
   control, focus restoration, and responsive containment. Hiding the
   Playground before-outlet region is correct for its full-screen menu, but
   has not earned a global default.
4. **Other remaining selectors are demonstrational.** Brand scale, route
   outlet spacing, navigation inner padding, return-link placement, raw-HTML
   spacing, manual-check lists, and empty-cell artwork describe this specific
   documentation app and stay local.

## Demonstration Coverage

The Playground has thirty-nine route demos and also exercises AppShell, public
templates, RouteChrome, HeaderBar, HeaderTools, SearchBox, CommandPalette,
LanguageSelect, ThemeToggle, Brand, and ResponsiveNavigation through its live
application chrome.

The Markup demo is the compact interactive check for Image, IconLabel, and
StatusMessage. It keeps the examples in one composition-oriented place instead
of adding three thin routes to the navigation.
## Route And Language Findings

- All thirty-nine routes share one `playgroundRouteText` resolver. Navigation,
  breadcrumbs, route search, command search, metadata, diagnostics, and the
  route-loaded announcement therefore use the same localized route title.
- Every route renders a semantic `Section`. A few demos also define ids for
  items or table columns; those are internal examples, not competing route ids.
- The selected locale currently owns app chrome and framework service text.
  Demo prose, sample data, and example action announcements are intentionally
  English technical-reference content. This is not a substitute for a fully
  content-localized application and should stay explicit until a dedicated
  multi-locale demo-content layer is justified.
- Thirty-two demos contain an explicit announcement example. The other demos
  should not gain artificial speech merely to increase a count. Keep one short
  application-owned announcement when hands-on assistive-technology testing
  shows that a completed control change otherwise lacks reliable feedback;
  static content and ordinary focus movement do not need an invented result.

## Completed Source Change

HeaderTools now uses a generic localized description rather than enumerating
search, commands, language, and theme. The description remains accurate when a
header has a different control set, without introducing a Playground-specific
exception.

## Exit Criteria

1. Preserve the corrected stylesheet order and keep local CSS after the
   library stylesheet.
2. Keep only documented Playground-owned presentation rules locally.
3. Promote Panel, SearchBox, or mobile-navigation changes only after a second
   application proves the same product-independent need, with an explicit API
   decision and focused contract or browser test where behavior changes.
4. Keep Playground routes as concise decision examples, not a duplicate API
   reference.

