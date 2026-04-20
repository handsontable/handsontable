# External Integrations

## APIs & External Services

Handsontable is a frontend-only library with no built-in external API integrations. It runs entirely in the browser and makes no network requests unless explicitly configured by the user. The library supports air-gapped environments. There is no built-in telemetry.

**Formula Engine (Optional):**
- HyperFormula - Spreadsheet formula calculation engine
  - Package: `hyperformula` ^3.0.0 (optional dependency)
  - Integration: Plugin-based via `handsontable/src/plugins/formulas/`
  - Engine setup: `handsontable/src/plugins/formulas/engine/register.js`
  - No network calls; runs entirely in-browser
  - Bundled in `handsontable.full.js` variant; external in `handsontable.js`

## Data Storage

**Databases:**
- Not applicable. Handsontable operates on in-memory JavaScript arrays/objects passed by the consumer application.
- Data is managed through `handsontable/src/dataMap/` (DataMap, MetaManager).

**File Storage:**
- Local filesystem only (during development/build).
- No runtime file storage; the library is browser-only.

**Caching:**
- None at the library level. Internal caching of cell metadata and rendering state is handled in-memory.

## Authentication & Identity

**Auth Provider:**
- Not applicable. Handsontable is a UI component library with no authentication layer.
- License validation is handled internally (no network calls).

## Monitoring & Observability

**Error Tracking:**
- None built-in. No telemetry or error reporting services.
- Errors use custom handler: `handsontable/src/helpers/errors.js` with `throwWithCause(error, cause)` utility.

**Logs:**
- Console helpers via `handsontable/src/helpers/console.js` (wraps `console` to avoid direct global access).
- No external logging service integration.

## CI/CD & Deployment

**Hosting:**
- npm registry (published as `handsontable`, `@handsontable/react-wrapper`, `@handsontable/angular-wrapper`, `@handsontable/vue3`)
- CDN: jsDelivr and unpkg (automatic from npm publish)
- Documentation: Netlify (`docs/netlify/`)

**CI Pipeline:**
- GitHub Actions (`.github/workflows/`)
- Key workflows: `test.yml`, `build-all.yml`, `code-quality.yml`, `publish.yml`

**Visual Regression Testing:**
- Argos CI (`@argos-ci/core` ^5.1.1) - Screenshot comparison service used in `visual-tests/`
- Playwright for screenshot capture

**Documentation Search:**
- Algolia - Docs search reindexing (`.github/workflows/docs-algolia-reindex.yml`)

## Environment Configuration

**Required env vars:**
- None for library consumers.
- Build-time variables defined in `hot.config.js` (root):
  - `HOT_FILENAME` - Output filename (`handsontable`)
  - `HOT_VERSION` - Library version string (`17.0.0`)
  - `HOT_PACKAGE_NAME` - npm package name (`handsontable`)
  - `HOT_BUILD_DATE` - Build timestamp (generated via `moment().format()`)
  - `HOT_RELEASE_DATE` - Release date string
- Build mode variables: `NODE_ENV`, `BABEL_ENV`

**Secrets location:**
- No secrets in the repository. No `.env` files present.
- CI secrets managed via GitHub Actions secrets (for npm publish, Netlify deploy, Algolia reindex).

## Webhooks & Callbacks

**Incoming:**
- None. Handsontable is a client-side library with no server endpoints.

**Outgoing:**
- None. No telemetry, analytics, or network requests.

## Third-Party Libraries (Runtime)

These are the only external libraries bundled or referenced at runtime:

| Library | Version | Purpose | Integration Point |
|---|---|---|---|
| `dompurify` | ^3.1.7 | XSS sanitization of HTML content | Used internally for cell content sanitization |
| `numbro` | 2.5.0 | Number formatting | Used by numeric cell type and renderers |
| `moment` | 2.30.1 | Date parsing/formatting | Used by date cell type and Pikaday editor |
| `@handsontable/pikaday` | ^1.0.0 | Date picker UI | Date editor plugin (forked from original Pikaday) |
| `hyperformula` | ^3.0.0 | Formula engine | Optional; integrated via Formulas plugin (`src/plugins/formulas/`) |

**Note:** Numbro locale files and Moment locale files are excluded from the build via empty-loader (`handsontable/.config/loader/empty-loader.js`) to reduce bundle size. Only the base libraries are included.

## Framework Wrapper Integration Points

**React (`wrappers/react-wrapper/`):**
- Peer dependency: `handsontable` ^17.0.0
- Build tool: Rollup 4
- Core component: `wrappers/react-wrapper/src/hotTableInner.tsx`
- Supports React 18
- Selection state preservation via `selection.exportSelection()` / `selection.importSelection()` during `updateSettings()`

**Angular (`wrappers/angular-wrapper/`):**
- Peer dependency: `handsontable` ^17.0.0, `@angular/core` >=16.0.0
- Build tool: ng-packagr 16
- Core component: `wrappers/angular-wrapper/projects/hot-table/src/lib/`
- Runtime deps: `rxjs` ^7.8.1, `tslib` ^2.3.0, `zone.js` ~0.13.0
- Tests require `NODE_OPTIONS=--openssl-legacy-provider`
- **Modern pattern (required for all examples):** Components use `standalone: true` with `imports: [HotTableModule]`. Use `app.config.ts` (`ApplicationConfig` + `provideZoneChangeDetection`) instead of `AppModule`. License is set globally via `HOT_GLOBAL_CONFIG` -- no per-table `licenseKey`. Templates use `@if`/`@for` control flow, not `*ngIf`/`*ngFor`. Row data typed as `RowObject[]` from `handsontable/common`.

**Vue 3 (`wrappers/vue3/`):**
- Peer dependency: `handsontable` ^17.0.0, `vue` ^3.2.22
- Build tool: Rollup 4 with `rollup-plugin-vue`
- No additional runtime dependencies

## Import/Export Capabilities

**Supported formats (client-side only):**
- CSV - Parsed via `handsontable/src/utils/parseTable.js`
- HTML tables - HTML parsing utility for copy/paste and export
- JSON - Data structure is plain arrays/objects
- Excel formulas - When Formulas plugin enabled via HyperFormula

**No built-in database synchronization.** Applications must implement their own save/load mechanisms.

## Hooks System (Internal Event Bus)

Handsontable provides an extensive hook system for component lifecycle and user interactions (not external webhooks). Hooks are defined in `handsontable/src/core/hooks/`. Plugins register hooks globally at module level:

```js
import Hooks from '../../core/hooks';
Hooks.getSingleton().register('beforeMyAction');
Hooks.getSingleton().register('afterMyAction');
```

Key hook categories: lifecycle (`beforeInit`/`afterInit`, `beforeRender`/`afterRender`), data (`beforeChange`/`afterChange`, `beforeLoadData`/`afterLoadData`), selection, editor/renderer, and plugin-specific hooks.
