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

- Build: ng-packagr 22 (Angular 22, TypeScript 6; Angular 22 documents Node ^22.22.3 or ^24.15.0 or ^26, and the wrapper sets no `engines` because that field would be published)
- Test: `npm run test --prefix wrappers/angular-wrapper` (Jest 30 + jest-preset-angular 17)
- Lint: `npm run lint --prefix wrappers/angular-wrapper` (ESLint 9 flat config in `eslint.config.js`; the monorepo root stays on ESLint 8)
- Gotcha: Tests use `NODE_OPTIONS=--openssl-legacy-provider`
- Gotcha: `peerDependencies["@angular/core"]` (`>=16.0.0 <23.0.0`) is the support matrix, not the Angular version we build with. The partial-Ivy `minVersion` in the built `fesm2022` bundle (12.0.0 and 14.0.0) is what lets Angular 16+ link the package. After a compiler bump, grep `minVersion` in `dist/hot-table/fesm2022/*.mjs` and build a consumer app on the oldest supported major against `npm pack` output before changing the range.
- **Test paradigm:** the presence gate covers `wrappers/**` — a wrapper source change must ship a matching test. The Jest suite here is **jsdom** (inputs, lifecycle, change detection). Anything user-visible / real-browser goes to **Playwright E2E** in `tests/e2e/` — see the `handsontable-playwright-e2e` skill (NgZone / `runOutsideAngular` gotchas in its `references/wrappers.md`). Local gates + exact rules: `.ai/LOCAL-ENFORCEMENT.md`.

## Common Pitfalls

| Pitfall | What to do instead |
|---|---|
| `arr.push(...largeArray)` with large arrays | Causes stack overflow with 10k+ elements. Use `forEach` loop instead. |
| Using `standalone: false` or `AppModule` | All Angular docs examples use `standalone: true` with `imports: [HotTableModule]` and `app.config.ts`. |
| Adding `licenseKey` to individual `<hot-table>` | Set it globally via `HOT_GLOBAL_CONFIG` in `app.config.ts`. Never put it on each component. |
| Using `*ngIf` / `*ngFor` in templates | Use Angular 17+ built-in control flow: `@if (cond) { }` and `@for (x of list; track x.id) { }`. |
| Passing `dataProvider` together with `sheetsBar` | A grid-level `dataProvider` is ignored while the sheets bar is on. Put `dataProvider` in each server sheet's `settings`, and keep every `sheets[i].data` reference, and each sheet's `dataProvider` object with its callbacks, referentially stable across re-renders: sheet settings are compared structurally and functions by identity, so a new data array or an inline callback rebuilds the workbook and drops each sheet's cached server state (rows, sort, filters, page). |
| Editing an away sorted sheet's `data` in place with `sheetsBar` and `formulas` | A sheet left sorted, or with moved rows or columns, comes back with the formulas the formula engine holds for it, as long as its `data` is the same array with the same length. A cell changed in place in that array while the sheet is away is not seen. To change it, pass a new `sheets` value, which rebuilds the workbook (sheets added with `addSheet()` are dropped). |
| Typing Angular row data as `any[]` | Use `RowObject[]` imported from `handsontable`. |
| Re-adding an `@angular/*` pin to root `pnpm.overrides` | A root override forces one Angular major onto every workspace package. A pin older than the wrapper's major makes the build die with `does not provide an export named 'IdentifierKind'`. Bump the leaf package instead. |
| `@angular/compiler-cli` 22 declares `@jridgewell/sourcemap-codec ^1.4.14` but needs `encodeRangeMappings` (1.6.0+) | The root `pnpm.overrides` entry `@angular/compiler-cli>@jridgewell/sourcemap-codec` pins `^1.6.0`. Without it a lockfile that already holds 1.5.5 fails at import with `does not provide an export named 'encodeRangeMappings'`. Drop it once compiler-cli declares the right range. |
| Removing `strict: false` or `moduleResolution: "bundler"` from `tsconfig.json` | TypeScript 6 turns `strict` on by default and the wrapper source is not strict-clean (dozens of `TS2564` and `TS18048`). Angular 21+ subpath imports such as `@angular/core/rxjs-interop` need `bundler` resolution, and `tsconfig.spec.json` needs it too for `@angular/core/testing`. Keep `baseUrl` out of the config: with `bundler` resolution TypeScript 6 writes inferred types as `import("node_modules/handsontable")` into the bundled `.d.ts`, which only resolves inside this repo. `scripts/post-build.js` fails the build on that, and consumer apps hide it unless `skipLibCheck` is `false`. |
| Expecting per-file `.d.ts` in the published package | ng-packagr 21+ emits one bundled `types/handsontable-angular-wrapper.d.ts`. Consumers resolve through the `exports` map. It also adds `"type": "module"`, which `scripts/post-build.js` removes: with it, TypeScript reads the bundled declarations as ESM and a `nodenext` consumer fails with TS2709 on `import Handsontable from "handsontable/base"`. |

For detailed guidance: use skill `angular-wrapper-dev`
