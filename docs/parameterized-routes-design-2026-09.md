# Parameterized Routes Design - September 2026

## Status

**Proposal. No routing API changes have been made from this document.**

The first Study Languages screens prove that exact routes are the right
default for small applications and static public sites. They also expose a
different need: a catalog that grows after deployment cannot pre-create a
route object for every item. This document proposes a narrow extension that
keeps exact routes simple while allowing an application to resolve a concrete
route from a safe parameterized pattern.

## Goals

- Preserve every existing exact-route API and behavior.
- Support hash-routed SPA and native-link applications from the same
  pattern/parameter model.
- Make parsing, parameter validation, and href generation explicit and typed.
- Give the rendering, title, metadata, breadcrumb, and accessibility
  announcement layers one resolved route instance.
- Keep dynamic detail routes out of top-level navigation, command search,
  sitemap, and diagnostics unless an application deliberately supplies
  catalog items for those surfaces.
- Keep product data lookup, authorization, locking, locale copy, and
  not-found content in the application.

## Non-Goals

- A full route-expression language, regular-expression routes, wildcards, or
  file-system routing.
- A global data loader, HTTP client, cache policy, or authorization layer.
- Automatically listing every possible parameter value in navigation, search,
  or a sitemap.
- Replacing static `HashRouterRoute`, `AppRouteDescriptor`, or
  `AppScreenRoute` definitions.

## Core Model

The implementation should distinguish two values that are currently one
exact-route object.

### Route Definition

A definition is registered once. It has a stable framework identifier and a
simple slash-separated pattern, for example:

```ts
{
    id: "lesson.learn",
    pattern: "lessons/:lessonNumber/learn"
}
```

The first version permits literal path segments and named `:parameters` only.
It does not accept regex, optional segments, or catch-all segments. This makes
matching predictable, makes diagnostics practical, and avoids a router DSL
that applications cannot understand at a glance.

The definition receives raw decoded parameters and must validate/convert them
explicitly. For example, `"12"` can become a positive `lessonNumber`; an empty,
non-numeric, or unknown value returns no resolved route. The framework must not
silently guess domain types.

### Resolved Route Instance

A successful match creates the ordinary route object consumed by rendering.
It retains a stable `definitionId`, an actual route id/href, typed parameters,
and resolved title, description, metadata, parent reference, and render
function. Existing router consumers should work with this resolved instance,
not re-parse the browser location independently.

This separation means one `lesson.learn` definition can resolve any number of
concrete routes without generating the catalog at app startup.

## Proposed API Shape

The names below are a design target, not final source code.

```ts
interface RoutePattern<TParams extends object> {
    readonly id: string;
    readonly pattern: string;
    match(location: string): TParams | null;
    href(params: TParams): string;
}

const lessonLearn = createRoutePattern({
    id: "lesson.learn",
    pattern: "lessons/:lessonNumber/learn",
    parse(params) {
        const lessonNumber = Number(params.lessonNumber);

        return Number.isInteger(lessonNumber) && lessonNumber > 0
            ? { lessonNumber }
            : null;
    }
});

lessonLearn.href({ lessonNumber: 12 });
// "#lessons/12/learn" for a hash adapter
```

`createAppScreenRoutePattern()` would then apply the existing Screen-backed
route convention. Its title, description, metadata, parent, screen slots, and
children resolve from typed parameters. It should produce an ordinary resolved
`AppScreenRoute`, so `PageOutlet`, locale refresh, route announcements, and
diagnostics do not receive a parallel shape.

The router extension should accept a union of existing exact route objects and
pattern definitions. Matching rules must be fixed:

1. An exact route always wins over a pattern.
2. A pattern is matched only as whole path segments, after decoding each
   segment safely.
3. A pattern whose parser returns `null` is not a match.
4. Ambiguous pattern definitions must be reported by diagnostics; route-array
   order must never become a hidden product rule.
5. `href(params)` encodes parameter segments individually. Pages should not
   concatenate URL strings by hand.

Static callers remain unchanged: `router.navigate("settings")` and
`router.getRouteHref(route)` still work. Pattern callers obtain a concrete
resolved route or call the pattern's typed `href()` helper.

## Hierarchy, Chrome, And Metadata

Dynamic pages still need an accurate breadcrumb trail. A pattern route should
be able to resolve a parent reference from the same typed parameters, for
example a lesson to its level. The app route layer resolves that reference into
the parent instance before it builds breadcrumb items.

Pattern definitions are not catalog entries. Therefore their defaults should
be conservative:

- excluded from primary navigation;
- excluded from command-palette/search items;
- excluded from sitemap generation;
- included in route diagnostics as definitions, with pattern-specific checks;
- available to metadata and document-title resolvers only when a concrete
  instance is active.

An application that has a loaded catalog can opt in to search or sitemap
generation by providing its own finite catalog items. This keeps a page like
`lessons/:lessonNumber/learn` from becoming thousands of invisible menu
entries.

## Study Languages Shape

The intended public hash paths are readable resource paths:

```text
#lessons
#levels/1
#lessons/1
#lessons/1/learn
#lessons/1/materials
#lessons/1/grammar
#setup
```

The lesson screens would receive `{ lessonNumber }` once from the resolved
route. They would continue to decide whether the lesson exists, is cached, or
is locked. Those are product rules, not router rules.

During the migration, the app can retain exact legacy redirects such as
`#lesson-1-learn` so existing bookmarks do not break. Redirect policy should
remain optional and app-owned.

## Error Handling

The initial router extension should preserve today's fallback-to-default
behavior when no route matches. A dedicated not-found route is useful but is a
separate public design decision: it must be able to receive location context
without exposing raw unsafe URL text. It should not be slipped into the first
pattern patch.

The Study Languages page-level guard already gives a meaningful accessible
unavailable state for a syntactically valid but absent or locked lesson.

## Required Contract Coverage

Before release, tests must cover:

- static-route compatibility and exact-route precedence;
- parsing, decoding, invalid parameter rejection, and href encoding;
- deterministic ambiguity diagnostics;
- resolved route rendering, focus, title, metadata, and announcement behavior;
- parent resolution and localized breadcrumbs for a dynamic child;
- route refresh after locale change without losing resolved params;
- hash and native-link adapters using the same pattern definition;
- navigation/search/sitemap exclusion by default;
- keyboard activation of a typed generated href;
- Study Languages migration with legacy links and a lesson loaded after app
  startup.

## Decision Needed Before Implementation

The proposed direction is deliberately conservative: a small segment-pattern
primitive, a resolved route instance, typed href generation, and dynamic
routes hidden from global navigation by default. The remaining product-facing
choice is the public Study Languages URL shape shown above. Once that direction
is accepted, implementation can proceed in the framework first, followed by a
small migration of the application route factories.
