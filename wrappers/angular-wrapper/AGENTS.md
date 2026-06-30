# Angular Wrapper (@handsontable/angular-wrapper)

## Critical Rules

- **No business logic** in wrappers - belongs in `handsontable/src/`
- **Feature parity**: Angular wrapper must expose identical Handsontable functionality
- **Build core first**: `npm run build --prefix handsontable` - wrappers consume `handsontable/tmp/` not `dist/`
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

- Build: ng-packagr 19
- Test: `npm run test --prefix wrappers/angular-wrapper` (Jest + jest-preset-angular)
- Gotcha: Tests use `NODE_OPTIONS=--openssl-legacy-provider`

## Common Pitfalls

| Pitfall | What to do instead |
|---|---|
| `arr.push(...largeArray)` with large arrays | Causes stack overflow with 10k+ elements. Use `forEach` loop instead. |
| Using `standalone: false` or `AppModule` | All Angular docs examples use `standalone: true` with `imports: [HotTableModule]` and `app.config.ts`. |
| Adding `licenseKey` to individual `<hot-table>` | Set it globally via `HOT_GLOBAL_CONFIG` in `app.config.ts`. Never put it on each component. |
| Using `*ngIf` / `*ngFor` in templates | Use Angular 17+ built-in control flow: `@if (cond) { }` and `@for (x of list; track x.id) { }`. |
| Typing Angular row data as `any[]` | Use `RowObject[]` imported from `handsontable`. |

For detailed guidance: use skill `angular-wrapper-dev`
