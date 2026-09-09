# Page

`createPage()` creates the low-level semantic page foundation used by
`AppShell()`. It owns one page root, the main landmark, an optional skip link,
header, navigation, footer, document metadata, theme synchronization, and
page diagnostics.

Most applications should begin with `AppShell()` or a public app template.
Use `createPage()` directly only when an application needs a custom shell but
still wants Accessible First to own the page landmarks and cleanup.

## Quick Start

```ts
const page = createPage({
    title: "My application",
    metadata: {
        description: "A concise page description."
    }
});

page.header(AppHeader({ identity }));
page.navigation(Navigation({ label: "Main navigation" }));
page.setMainContent(Screen({
    title: "Welcome",
    children: P("Start by choosing a task.")
}));
page.footer(P("Built with Accessible First."));

mount(page, "#app");
```

## Choose The Right Layer

- Use `createPublicStaticAppTemplate()` for a route-free public page or small
  site.
- Use `createPublicAppTemplate()` for a routed SPA or native-link/MPA public
  application.
- Use `AppShell()` for a custom interactive application shell with a
  `PageOutlet`.
- Use `createPage()` when the application deliberately owns its own slots and
  rendering lifecycle.

## Contract

`createPage()` creates one native `main` landmark and adds optional native
`header`, `nav`, and `footer` regions only when their methods are used. The
skip link is enabled by default and targets the main landmark unless configured
otherwise.

`Page` owns its created DOM and restores document state that it changes when
`destroy()` runs. That includes managed metadata and theme state. Do not create
multiple simultaneous Page controllers for the same browser document unless an
application explicitly owns the resulting document-level interactions.

## Main Methods

- `header(...)`, `navigation(...)`, and `footer(...)` replace their respective
  region contents.
- `section(...)` and `appendToMain(...)` append content to the main landmark.
- `setMainContent(...)` replaces all main content.
- `focusMain()` programmatically focuses the main landmark without adding it to
  normal Tab order.
- `update(...)` refreshes mutable page, locale, skip-link, and metadata
  options.
- `updateMetadata(...)` updates document metadata through the managed
  controller.
- `inspect(...)` returns the page diagnostics report.
- `destroy()` disposes child composition and restores owned state.

## Layout

`createPage()` provides semantics and ownership, not visual layout. Apply
`applyPageLayout(page, options)` for the library baseline: aligned regions,
responsive gutters, a sticky footer, optional borders, and scroll-safe chrome.
`AppShell()` applies the same layout layer when its `layout` option is enabled.

## Accessibility

- Keep one clear primary `h1` in the rendered document.
- Give navigation a useful label when more than one navigation landmark exists.
- Preserve the skip link unless the page has another equivalent early keyboard
  route to main content.
- Use `Screen`, `PageOutlet`, or an explicit focus route to decide route-change
  focus; Page itself does not announce every content update.
- Keep product text and metadata in application-owned localization or page
  files. Framework service text is supplied through the shared locale provider.

See [Semantic Composition](../semantic-composition.md),
[AppShell](./app-shell.md), and [PageLayout](./page-layout.md) for the layers
built around Page.