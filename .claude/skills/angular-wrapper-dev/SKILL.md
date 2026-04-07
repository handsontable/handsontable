---
name: angular-wrapper-dev
description: Use when developing or modifying the @handsontable/angular-wrapper package - Angular components with decorators, NgZone performance optimization, and ng-packagr build system
---

# Angular Wrapper Development

## Package location

`wrappers/angular-wrapper/`

Library source lives under `projects/hot-table/src/lib/`.

## Component architecture

The main `HotTableComponent` uses Angular `@Component` with individual `@Input()` decorators for each Handsontable option. This gives consumers standard Angular template binding for every grid setting.

### Lifecycle

- **AfterViewInit** - creates the Handsontable instance on the DOM element obtained via `@ViewChild('container')`.
- **OnChanges** - detects input property changes and calls `updateSettings()` with the new values.
- **OnDestroy** - calls `hot.destroy()` and cleans up references.

### Performance

`NgZone.runOutsideAngular()` wraps the Handsontable constructor and most grid operations. This prevents Angular change detection from running on every internal grid event (scroll, render, mouse move), which is critical for performance with large datasets.

## Services

- **HotSettingsResolver** - resolves and merges settings from component inputs, handling priority between individual inputs and the aggregate settings object.
- **HotGlobalConfig** - provides global default settings that apply to all HotTable instances in the application.

## Module system

`HotTableModule` is the Angular module that declares and exports the component. Consumers add it to their `imports` array.

## Build and test

- **Build system:** ng-packagr 16.
- **Tests:** Jest with `jest-preset-angular`.
- **Gotcha:** Tests require `NODE_OPTIONS=--openssl-legacy-provider` (already configured in the test script).
- **Run tests:** `pnpm --filter @handsontable/angular-wrapper run test`
- **Important:** Build core first with `pnpm --filter handsontable run build`. Wrappers consume `handsontable/tmp/`, not `dist/`.

## Key files

| File | Purpose |
|---|---|
| `projects/hot-table/src/lib/hot-table.component.ts` | Main grid component |
| `projects/hot-table/src/lib/services/` | Settings resolver and global config services |
| `projects/hot-table/src/lib/hot-table.module.ts` | Angular module declaration |

## Rules

- No business logic in wrappers. All data transformation and validation belongs in `handsontable/src/`.
- Cross-platform npm scripts: use Node.js `.mjs` helpers instead of bash-only constructs. Never use bash-specific syntax (`if [ ]`, `mv`, `&&` with `||`) directly in `package.json` script entries.
