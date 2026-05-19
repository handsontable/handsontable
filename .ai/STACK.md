# Technology Stack

## Languages

**Primary:**
- JavaScript (ES2015+) - Core library (`handsontable/src/`), all source code
- SCSS/CSS - Styling and themes (`handsontable/src/**/*.scss`, `handsontable/styles/`)

**Secondary:**
- TypeScript - Framework wrappers (`wrappers/react-wrapper/src/`, `wrappers/angular-wrapper/`, `wrappers/vue3/src/`) and hand-authored type definitions (`handsontable/types/`)
- HTML - Test runners (`handsontable/test/E2ERunner.html`, `handsontable/src/3rdparty/walkontable/test/SpecRunner.html`)

**Important:** The core package (`handsontable/`) is JavaScript only. Do not create `.ts` files in `handsontable/src/`. TypeScript definitions live in `handsontable/types/` as `.d.ts` files.

## Runtime

**Environment:**
- Node.js 22 (specified in `.nvmrc`)
- Browser-only library at runtime (no server-side logic)

**Package Manager:**
- pnpm 10.30.2 (specified in root `package.json` `packageManager` field)
- Activate via: `corepack enable && corepack prepare pnpm@10.30.2 --activate`
- Lockfile: `pnpm-lock.yaml` present
- Workspace config: `pnpm-workspace.yaml`

## Frameworks

**Core:**
- No framework - vanilla JavaScript data grid library
- Walkontable - internal rendering engine (`handsontable/src/3rdparty/walkontable/src/`)

**Framework Wrappers:**
- React 18 - `wrappers/react-wrapper/` (`@handsontable/react-wrapper`)
- Angular 16+ - `wrappers/angular-wrapper/` (`@handsontable/angular-wrapper`)
- Vue 3.2+ - `wrappers/vue3/` (`@handsontable/vue3`)

**Testing:**
- Jest 27 - Unit tests (`handsontable/jest.config.js`, `*.unit.js` files, jsdom environment, `jest-jasmine2` runner)
- Jasmine 3.4 - E2E browser tests (`*.spec.js` files, run via Puppeteer)
- Puppeteer 24 - Headless Chrome for E2E tests
- Playwright 1.58 - Visual regression tests (`visual-tests/`)
- `@testing-library/react` 14 - React wrapper tests
- `@vue/test-utils` 2.0.0-rc.16 - Vue 3 wrapper tests
- `jest-preset-angular` 14 - Angular wrapper tests (requires `NODE_OPTIONS=--openssl-legacy-provider`)

**Build/Dev:**
- Rspack 1.7 (`@rspack/core`, `@rspack/cli`) - Core library bundling (`handsontable/rspack.config.js` + `handsontable/.config/`). Migrated from Webpack 5; the `.config/` folder name is kept for historical reasons.
- Rollup 4 - React and Vue 3 wrapper bundling
- SWC 1.x (`@swc/core`, `@swc/helpers`) - JavaScript transpilation for all builds: Rspack uses `builtin:swc-loader`, and file-per-file transpilation runs through `handsontable/scripts/swc-transpile.mjs` (used by `build:commonjs`, `build:es`, `build:languages.es`)
- Babel 7 - Retained only for Jest unit tests via `babel-jest` (see `handsontable/babel.config.js`); no longer used for production or test bundles
- ng-packagr 16 - Angular library packaging
- Sass 1.58 - SCSS compilation
- TypeScript 3.8.2 (core types), 5.1.6 (Angular), 4.x (Vue 3)

## Key Dependencies

**Critical (runtime):**
- `dompurify` ^3.1.7 - XSS prevention, HTML sanitization for cell content
- `numbro` 2.5.0 - Number formatting in cells
- `moment` 2.30.1 - Date formatting and manipulation
- `@handsontable/pikaday` ^1.0.0 - Date picker editor (forked Pikaday)

**Optional (runtime):**
- `hyperformula` ^3.0.0 - Spreadsheet formula engine (optional dependency, integrated via `handsontable/src/plugins/formulas/`)

**Angular wrapper runtime:**
- `rxjs` ^7.8.1 - Reactive extensions for Angular
- `tslib` ^2.3.0 - TypeScript runtime helpers
- `zone.js` ~0.13.0 - Angular change detection

**Build tooling (key devDependencies):**
- `eslint` 7 (core) / 8 (wrappers) - Linting with Airbnb base config
- `eslint-plugin-handsontable` - Custom ESLint rules (`handsontable/.config/plugin/eslint/`)
- `eslint-plugin-compat` - Browser API compatibility enforcement
- `stylelint` 16 - CSS/SCSS linting
- `env-cmd` 9 - Injects environment variables from `hot.config.js` during build
- `cross-env` 7 - Cross-platform environment variable setting
- `rspack.CssExtractRspackPlugin` - CSS extraction from Rspack bundles (drop-in replacement for the former `mini-css-extract-plugin`)
- `rspack.LightningCssMinimizerRspackPlugin` - CSS minification via Lightning CSS (replaces the former `css-minimizer-webpack-plugin`)

## Configuration

**Environment:**
- Build environment variables defined in `hot.config.js` (root): `HOT_FILENAME`, `HOT_VERSION`, `HOT_PACKAGE_NAME`, `HOT_BUILD_DATE`, `HOT_RELEASE_DATE`
- Injected via `env-cmd -f ../hot.config.js` in all build/test scripts
- No `.env` files in the repository (air-gapped environment support)

**Rspack configs (`handsontable/.config/`):** (folder name predates the Webpack→Rspack migration)
- `base.js` - Base configuration (UMD output, library name `Handsontable`, `builtin:swc-loader` for JS, empty-loader for numbro/moment locales)
- `development.js` / `production.js` - Dev and production UMD build configs
- `watch.js` - Dev watcher config (used by `npm run watch`)
- `styles-development.js` / `styles-production.js` - CSS build configs
- `themes-css-development.js` / `themes-css-production.js` - Theme CSS builds
- `themes-umd-development.js` / `themes-umd-production.js` - Theme UMD builds
- `languages-development.js` / `languages-production.js` - i18n language pack builds
- `walkontable.js` - Walkontable standalone build
- `test-e2e.js` / `test-e2e-esm-cjs.js` / `test-mobile.js` / `test-production.js` / `test-walkontable.js` - Test bundle configs (consumed by `test:*.dump` scripts)
- `loader/forbidden-imports-loader.js` - Custom Rspack loader that replaces the former `babel-plugin-forbidden-imports` (enforces the E2E allow-list in `test-e2e.js`)
- `plugin/eslint/` - In-repo ESLint plugin (`eslint-plugin-handsontable`), linked via `file:.config/plugin/eslint`

**Babel environments (`handsontable/babel.config.js`):**
- Only one env remains: `commonjs` - used by Jest unit tests via `babel-jest` (`@babel/plugin-transform-runtime` + `@babel/plugin-transform-modules-commonjs`). Every other former env (`commonjs_dist`, `es`, `es_languages`, `commonjs_e2e`) was removed when Babel was swapped out for SWC; the `babel.config.js` header comment states this explicitly.
- `BABEL_ENV=commonjs` / `BABEL_ENV=commonjs_e2e` still appear in several `package.json` scripts that invoke `rspack`. Those assignments are effectively dead — Rspack uses `builtin:swc-loader` and ignores `BABEL_ENV`. They are kept to avoid churn in scripts but do not select a Babel environment.

**SWC pipeline (replaces Babel for everything except Jest):**
- Rspack bundles (`rspack.config.js` + `.config/*`) - JS transpiled by `builtin:swc-loader` using targets from `browser-targets.js`
- `handsontable/scripts/swc-transpile.mjs` - File-per-file transpiler driven by `@swc/core`; produces the `tmp/` output consumed by wrappers. Handles CJS (`build:commonjs`), ESM (`build:es`, `.mjs` output), and i18n language packs with auto-registration (`build:languages.es --lang-registration`)
- `handsontable/scripts/parallel-build.mjs` - Build orchestrator invoked by `npm run build`; runs the Rspack and SWC tasks above concurrently where the dependency graph allows

**Linting:**
- `.eslintrc.js` (root) - Monorepo-level ESLint config
- `handsontable/.eslintrc.js` - Core-specific ESLint with custom rules
- Custom ESLint plugin at `handsontable/.config/plugin/eslint/` with rules:
  - `no-native-error-throw` - Must use `throwWithCause()` from `src/helpers/errors.js`
  - `restricted-module-imports` - No imports from barrel index files
  - `require-async-in-it` - `it()` callbacks in spec files must be `async`
  - `require-await` - Specific HOT API calls must be `await`-ed

**Testing:**
- `handsontable/jest.config.js` - Jest config (jsdom environment, `jest-jasmine2` runner, `*.unit.js` pattern)
- Module aliases in Jest: `handsontable` -> `src/`, `walkontable` -> `src/3rdparty/walkontable/src/`
- CSS/SCSS mocked via `handsontable/test/__mocks__/styleMock.js`
- E2E test dump scripts use Rspack to bundle test helpers and spec files before Puppeteer execution

## Build Outputs

| Output | Path | Format |
|---|---|---|
| UMD bundles | `handsontable/dist/handsontable.js`, `handsontable/dist/handsontable.full.js` | UMD |
| Minified bundles | `handsontable/dist/handsontable.min.js`, `handsontable/dist/handsontable.full.min.js` | UMD (minified) |
| CommonJS modules | `handsontable/tmp/*.js` | CJS |
| ES modules | `handsontable/tmp/*.mjs` | ESM |
| Compiled CSS | `handsontable/styles/` | CSS |
| Language packs | `handsontable/dist/languages/`, `handsontable/languages/` | UMD + ESM |
| Theme bundles | `handsontable/dist/themes/` | UMD + CSS |

**Two build variants:**
- `handsontable.js` - Base build, external dependencies not bundled
- `handsontable.full.js` - Includes HyperFormula bundled in

**Wrappers consume `tmp/` output** via pnpm workspace linking (`"handsontable": "workspace:^"` override in root `package.json`).

## CSS Themes

- `ht-theme-main` - Default modern theme
- `ht-theme-classic` - Legacy Handsontable theme
- `ht-theme-horizon` - Alternative design theme
- Each theme has `-no-icons` variant
- Themes use CSS custom property tokens (design system) declared in Figma

## Platform Requirements

**Development:**
- Node.js 22 (enforced via `.nvmrc`)
- pnpm 10.30.2 (via corepack)
- No Docker, databases, or external services required

**Production (browser targets):**
- Chrome (two latest major versions)
- Firefox (two latest major versions)
- Safari (two latest major versions)
- Edge (two latest major versions)
- Enforced via `eslint-plugin-compat`

**CDN distribution:**
- jsDelivr: `dist/handsontable.full.min.js`
- unpkg: `dist/handsontable.full.min.js`

## CI/CD

**Platform:** GitHub Actions (`.github/workflows/`)

**Key workflows:**
- `test.yml` - Main test pipeline (unit, E2E, Walkontable, wrapper tests)
- `build-all.yml` - Full build verification
- `code-quality.yml` - Linting and code quality checks
- `linter.yml` - ESLint checks
- `publish.yml` - Package publishing pipeline to npm
- `docs-staging.yml` / `docs-production.yml` - Documentation deployment (Netlify)
- `docs-visual-tests.yml` - Visual regression testing for docs
- `changelog.yml` - Changelog verification
- `audit.yml` - Security audit
- `pkg-pr-new.yml` - PR package preview
