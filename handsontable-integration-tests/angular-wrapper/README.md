# @handsontable/angular-wrapper — Integration Tests

Integration tests verifying that `@handsontable/angular-wrapper` works correctly
with modern Angular APIs and patterns introduced across Angular versions 16–20.

---

## What these tests are

Each test file covers Angular APIs introduced or stabilised in a specific version:

| File | Angular version | What it covers |
|---|---|---|
| `ng16-required-inputs.spec.ts` | 16 | `@Input({ required: true })` |
| `ng16-destroy-ref.spec.ts` | 16 | `DestroyRef` + `takeUntilDestroyed()` |
| `ng17-standalone.spec.ts` | 17 | Standalone components, `viewChild()` signal |
| `ng17-control-flow.spec.ts` | 17 | `@if`, `@for`, `@switch`, `@defer` |
| `ng17-signal-inputs.spec.ts` | 17 | `input()`, `computed()`, `model()`, `output()` |
| `ng18-zoneless.spec.ts` | 18 | `provideExperimentalZonelessChangeDetection()`, `afterNextRender()`, `@let` |
| `ng19-linked-signal.spec.ts` | 19 | `linkedSignal()`, `resource()`, `ResourceStatus` |
| `ng20-stable-apis.spec.ts` | 20 | Stable zoneless API, `FormControl` + `toSignal()` bridge |

**103 tests total.** All run against the Angular version installed in
`wrappers/angular-wrapper/node_modules` (currently Angular 19.2).

---

## Compatibility table

Legend: **✅ verified** — test passes on that version · **☑ expected** — API exists in that version, not tested directly · **—** — API not available

| Feature | API / pattern | 16 | 17 | 18 | 19 | 20 |
|---|---|:---:|:---:|:---:|:---:|:---:|
| Basic rendering | `<hot-table>` standalone | ☑ | ☑ | ☑ | ✅ | ✅ |
| Required inputs | `@Input({ required: true })` | ☑ | ☑ | ☑ | ✅ | ✅ |
| Automatic cleanup | `DestroyRef` + `takeUntilDestroyed()` | ☑ | ☑ | ☑ | ✅ | ✅ |
| Standalone components | No `NgModule` required | ☑ | ☑ | ☑ | ✅ | ✅ |
| Signal child query | `viewChild()` | — | ☑ | ☑ | ✅ | ✅ |
| Built-in control flow | `@if`, `@for`, `@switch` | — | ☑ | ☑ | ✅ | ✅ |
| Deferred loading | `@defer` | — | ☑ | ☑ | ✅ | ✅ |
| Signal inputs | `input()`, `input.required()` | — | ☑ | ☑ | ✅ | ✅ |
| Two-way signal binding | `model()` | — | ☑ | ☑ | ✅ | ✅ |
| Typed outputs | `output()` | — | ☑ | ☑ | ✅ | ✅ |
| Derived state | `computed()` | — | ☑ | ☑ | ✅ | ✅ |
| Template variables | `@let` | — | — | ☑ | ✅ | ✅ |
| Zoneless mode | `provideExperimentalZonelessChangeDetection()` | — | — | ☑ | ✅ | ✅ |
| Post-render hook | `afterNextRender()` | — | — | ☑ | ✅ | ✅ |
| Writable derived signal | `linkedSignal()` | — | — | — | ✅ | ✅ |
| Async data loading | `resource()` + `ResourceStatus` | — | — | — | ✅ | ✅ |
| Stable zoneless API | `provideZonelessChangeDetection()` | — | — | — | — | ✅ |
| Reactive forms bridge | `FormControl` + `toSignal()` | — | — | — | — | ✅ |
| Form validation → settings | `NonNullableFormBuilder` + `statusChanges` signal | — | — | — | — | ✅ |

> **✅ verified** means the test suite was executed and all tests passed on that Angular version.
> All ✅ results were obtained on **Angular 19.2**. Angular 20 tests use APIs available in 19.2
> (see [Important limitation](#important-limitation)).
>
> **☑ expected** means the API was introduced in that version according to Angular release notes
> and the wrapper has no known incompatibility, but no automated test run has been performed
> against that exact version. To get verified results for each version, a
> [CI matrix](#ci-matrix-true-compatibility-testing) is required.

---

## Important limitation

> **These tests do NOT install or swap Angular versions.**
>
> `ng16-required-inputs.spec.ts` runs on Angular 19, not Angular 16. The file
> name documents *which Angular version introduced the API being tested*, not
> *which Angular version is under test*.

This means:
- They verify that the wrapper works with these APIs **on the currently installed version**
- They **will not catch** a breaking change introduced between Angular 16 and 19
- They serve as **pattern documentation** and **smoke tests**, not as a full compatibility matrix

For true multi-version compatibility testing see the [CI matrix](#ci-matrix-true-compatibility-testing) section below.

---

## Per-version app projects

To address the limitation above, four standalone Angular CLI applications live alongside the Jest tests — one per major version:

```
angular-16/   — scaffolded with @angular/cli@16  (^16.2.0)  --standalone flag
angular-17/   — scaffolded with @angular/cli@17  (^17.3.0)
angular-18/   — scaffolded with @angular/cli@18  (^18.2.0)
angular-19/   — scaffolded with @angular/cli@19  (^19.2.0)
```

Each project:
- Was generated with `ng new --defaults --skip-git` for that exact CLI version
- Has `@handsontable/angular-wrapper` and `handsontable` in `dependencies`
- Contains the getting-started demo example as the root `AppComponent`
- Uses an `app.config.ts` that follows that version's conventions

### Key differences between projects

| | Angular 16 | Angular 17 | Angular 18 | Angular 19 |
|---|---|---|---|---|
| `standalone: true` in component | explicit | explicit | explicit | implicit (default, omitted) |
| `styleUrls` vs `styleUrl` | array `['...']` | string `'...'` | string `'...'` | string `'...'` |
| `provideZoneChangeDetection` in config | not available | not available | ✅ included | ✅ included |
| `favicon.ico` location | `src/` | `src/` | `public/` | `public/` |
| `ng new` default mode | NgModule (used `--standalone`) | standalone | standalone | standalone |

### Setup

Dependencies are not pre-installed. Install them for the version you want to test:

```bash
cd angular-17   # or angular-16 / angular-18 / angular-19
npm install --legacy-peer-deps
```

> **`--legacy-peer-deps` is required** because `@handsontable/angular-wrapper: latest`
> may resolve to a version built against a newer Angular than the one in the project.
> To avoid this entirely, replace `latest` with a `file:` path pointing to the locally
> built wrapper: `file:../../../wrappers/angular-wrapper/dist/hot-table`

### Serve the demo

```bash
cd angular-17
npm install --legacy-peer-deps
npm start         # opens http://localhost:4200
```

### Build

```bash
npm run build     # output goes to dist/
```

### Test

Each project has a Karma/Jasmine suite (`app.component.spec.ts`) that verifies
the component instantiates correctly. Run it headlessly from the project directory:

```bash
cd angular-17   # or angular-16 / angular-18 / angular-19
npm install --legacy-peer-deps
npx ng test --watch=false --no-progress --browsers=ChromeHeadless
```

> Chrome must be installed. On Linux CI runners, use `ChromeHeadless` (see the
> CI matrix section below for the full configuration).

### What the demo shows

Each project renders the getting-started demo grid with:
- 20 rows of product data
- 7 columns (Company Name, Name, Sell date, In stock, Quantity, Order ID, Country)
- Context menu, dropdown menu, multi-column sorting, filters, row headers
- Alternating row classes via `beforeRenderer` hook
- Manual row/column resize and row move

The component source is in `src/app/app.component.ts`.
The Handsontable configuration lives in `gridSettings` and the data in `initialData`.

---

## Running the tests locally

From this directory (works on Windows `cmd.exe`, Git Bash, and WSL):

```bash
cd handsontable-integration-tests/angular-wrapper

npm test          # all tests, verbose
npm run test:ci   # all tests, no coverage output
```

To run a single file or filter by pattern, call jest directly from
`wrappers/angular-wrapper/` (the directory that owns the correct `node_modules`):

**Git Bash / WSL / Linux / macOS**
```bash
cd wrappers/angular-wrapper
NODE_OPTIONS=--openssl-legacy-provider node_modules/.bin/jest.cmd \
  --config ../../handsontable-integration-tests/angular-wrapper/jest.config.js \
  --testPathPattern="ng20-stable-apis" --no-coverage
```

**Windows cmd.exe**
```cmd
cd wrappers\angular-wrapper
node_modules\.bin\cross-env.CMD NODE_OPTIONS=--openssl-legacy-provider ^
  node_modules\.bin\jest.cmd ^
  --config ..\..\handsontable-integration-tests\angular-wrapper\jest.config.js ^
  --testPathPattern=ng20-stable-apis --no-coverage
```

### Why jest is run from `wrappers/angular-wrapper/`

The repo uses pnpm workspaces. The root `node_modules` contains incompatible
versions of jest-related packages (older jsdom, different ts-jest). Running jest
from `wrappers/angular-wrapper/` ensures the correct Angular 19 toolchain is
used. The `jest.config.js` uses absolute paths for `testEnvironment` and
`moduleDirectories` to prevent the root `node_modules` from interfering.

---

## CI matrix — true compatibility testing

To verify that the wrapper works across **multiple Angular versions**, the
correct approach is a CI matrix job — one job per supported Angular version,
each installing that version's dependencies from scratch.

### GitHub Actions workflow

The workflow lives at `.github/workflows/angular-wrapper-compatibility.yml`.
It triggers on every PR that touches `wrappers/angular-wrapper/**`,
`handsontable/src/**`, or `handsontable-integration-tests/angular-wrapper/**`.

Steps:
1. `pnpm install` — installs workspace dependencies (including Angular 19 in `wrappers/angular-wrapper/node_modules`)
2. Build Handsontable ES + CJS — required by the wrapper's TypeScript source
3. Run Jest from `wrappers/angular-wrapper/` using the integration test config

```yaml
- name: Test
  working-directory: wrappers/angular-wrapper
  run: NODE_OPTIONS=--openssl-legacy-provider node_modules/.bin/jest --config ../../handsontable-integration-tests/angular-wrapper/jest.config.js --no-coverage
```

### Why CI matrix and not separate local packages

| | Separate local `node_modules` per version | CI matrix |
|---|---|---|
| Disk space | ~500 MB × N versions | Only one version at a time |
| Install time | N × 2–5 min on every machine | Cached in CI, run in parallel |
| Maintenance | N copies of config to update | One matrix entry per version |
| Developer experience | Slow, heavy | Run on demand or on PR |

Local per-version directories are useful as a reference for the exact
dependency versions needed. The actual test runs belong in CI.

---

## Architecture

```
handsontable-integration-tests/angular-wrapper/
│
│   Jest API-compatibility tests (run on Angular 19)
├── src/
│   ├── ng16-required-inputs.spec.ts
│   ├── ng16-destroy-ref.spec.ts
│   ├── ng17-standalone.spec.ts
│   ├── ng17-control-flow.spec.ts
│   ├── ng17-signal-inputs.spec.ts
│   ├── ng18-zoneless.spec.ts
│   ├── ng19-linked-signal.spec.ts
│   └── ng20-stable-apis.spec.ts
├── jest.config.js                # uses Angular 19 from wrappers/angular-wrapper/
├── tsconfig.json                 # path aliases → wrappers/angular-wrapper/node_modules
├── setup-jest.ts                 # zone.js test env, browser API mocks, console noise suppression
├── package.json                  # npm test script
│
│   Per-version app projects (each installs its own Angular)
├── angular-16/                   # ng new @angular/cli@16 --standalone, demo example
│   └── src/app/
│       ├── app.component.ts      # standalone: true, styleUrls array (v16 syntax)
│       ├── app.component.html    # <hot-table [data]="..." [settings]="...">
│       └── app.config.ts         # registerAllModules + HOT_GLOBAL_CONFIG (no provideZoneChangeDetection)
├── angular-17/                   # ng new @angular/cli@17, demo example
│   └── src/app/
│       ├── app.component.ts      # standalone: true, styleUrl string (v17+ syntax)
│       ├── app.component.html
│       └── app.config.ts         # registerAllModules + HOT_GLOBAL_CONFIG (no provideZoneChangeDetection)
├── angular-18/                   # ng new @angular/cli@18, demo example
│   └── src/app/
│       ├── app.component.ts      # standalone: true explicit
│       ├── app.component.html
│       └── app.config.ts         # + provideZoneChangeDetection({ eventCoalescing: true })
├── angular-19/                   # ng new @angular/cli@19, demo example
│   └── src/app/
│       ├── app.component.ts      # standalone implicit (Angular 19 default)
│       ├── app.component.html
│       └── app.config.ts         # same as angular-18
│
└── README.md                     # this file
```

### How `@handsontable/angular-wrapper` is resolved

Tests import from `@handsontable/angular-wrapper` which is mapped in
`jest.config.js` directly to the TypeScript source:

```
@handsontable/angular-wrapper
  → wrappers/angular-wrapper/projects/hot-table/src/public-api.ts
```

This means tests run against the **live source**, not a built distribution.
Changes to the wrapper are picked up immediately without a build step.

---

## Adding new tests

1. Create `src/ngXX-<feature>.spec.ts`
2. Use only Angular APIs available in version XX
3. Import from `@handsontable/angular-wrapper` — the module alias handles resolution
4. Run the full suite to check for regressions:

```bash
cd handsontable-integration-tests/angular-wrapper
npm run test:ci
```
