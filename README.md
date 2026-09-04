# Accessible First

Accessible First is a framework-independent ecosystem for building accessible web applications.

The project aims to make accessibility the default path: developers should be able to create high-quality interfaces with correct semantics, keyboard behavior, visible focus states, responsive layout, and light/dark theme support without rebuilding these foundations for every project.

## Direction

Accessible First is not only a component library. It is growing into a small development environment for accessible web applications:

- low-level behavior primitives;
- accessible enhancement components for existing HTML;
- composition components that create and enhance DOM;
- semantic page-building primitives;
- app shell, routing, localization, metadata, diagnostics, and public app templates;
- an application blueprint for real web apps.

## Principles

- Accessibility first
- Native HTML first
- Simplicity first
- Performance first
- Progressive enhancement
- Framework independence
- Useful defaults with customization through tokens

## Package Status

This repository is source-first and private in `package.json` while the framework API and examples are still stabilizing. It is not published to npm yet.

The source is licensed under the [MIT License](./LICENSE).

## Current Status

Early stage research and development.

The behavior foundation and component baseline are now broad enough to support app-level work. The project is focused on public app templates, diagnostics, localization, playground validation, AI-friendly repository guidance, and the first reference application path.

## Quick Start

This repository is source-first and is not published to npm yet.

Run the playground with:

```bash
npm run playground:dev
```

Run the route-free starter with:

```bash
npm run example:static:dev
```

Run the routed starter with:

```bash
npm run example:routed:dev
```

## Examples

- `examples/minimal-static-public-site` - the current static public site starter. Run it with `npm run example:static:dev` or build it with `npm run example:static:build`.
- `examples/minimal-routed-public-app` - the current routed public app starter. Run it with `npm run example:routed:dev` or build it with `npm run example:routed:build`.

## For AI Agents

AI coding agents should start with [llms.txt](./llms.txt), [AGENTS.md](./AGENTS.md), and [AI Usage Guide](./docs/ai-usage.md). These files explain the current source-first import style, template selection, component map, accessibility rules, localization rules, and diagnostics expectations.

## Documentation

- [Architecture](./docs/architecture.md)
- [Application Blueprint](./docs/app-blueprint.md)
- [Application Starter](./docs/app-starter.md)
- [Application Templates](./docs/templates.md)
- [AI Usage Guide](./docs/ai-usage.md)
- [Roadmap](./docs/roadmap.md)
- [Component Reference](./docs/components/README.md)
