# Angular Wrapper (@handsontable/angular-wrapper)

## Critical Rules

- **No business logic** in wrappers - belongs in `handsontable/src/`
- **Build core first**: `pnpm --filter handsontable run build` - wrappers consume `handsontable/tmp/`
- Cross-platform scripts: Use Node.js `.mjs` helpers, never bash constructs

## Architecture

- Library source: `projects/hot-table/src/lib/`
- `@Component` with `@Input()` decorators for each Handsontable option
- Lifecycle: `AfterViewInit` (create), `OnChanges` (update), `OnDestroy` (cleanup)
- `@ViewChild('container')` for DOM access
- `NgZone.runOutsideAngular()` for performance (runs HOT outside Angular change detection)
- Services: `HotSettingsResolver`, `HotGlobalConfig`
- `HotTableModule` for Angular module system

## Key Files

- `projects/hot-table/src/lib/hot-table.component.ts`
- `projects/hot-table/src/lib/services/`

## Build & Test

- Build: ng-packagr 16
- Test: `pnpm --filter @handsontable/angular-wrapper run test` (Jest + jest-preset-angular)
- Gotcha: Tests use `NODE_OPTIONS=--openssl-legacy-provider`

For detailed guidance: use skill `angular-wrapper-dev`
