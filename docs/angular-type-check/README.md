# Angular documentation type checker

Type-checks all Angular example files under `docs/content/**/angular/*.ts` using the Angular compiler (`ngc`).

## What it checks

- TypeScript type correctness of every Angular documentation example
- Correct usage of `@handsontable/angular-wrapper` APIs — wrong generic type arguments, missing properties, invalid method calls
- Angular template type safety (`strictTemplates: true`)
- Strict TypeScript mode: `strict`, `noImplicitOverride`, `noImplicitReturns`, `noPropertyAccessFromIndexSignature`

`@handsontable/angular-wrapper` is resolved from the local dist (`wrappers/angular-wrapper/dist/hot-table`) via a pnpm workspace `link:` reference, so examples are always validated against the current build, not the last published npm release.

## How to run

Build the local packages first, then run the type check from the repo root:

```bash
pnpm install
npm run build --prefix handsontable
npm run build --prefix wrappers/angular-wrapper
npm run typecheck --prefix docs/angular-type-check
```

Or run the script directly from inside the directory (after the builds above):

```bash
node check.mjs
```

Exit code `0` = the run passed; exit code `1` = it failed. The pass/fail rule is **not** "any type error" — it is dual-version (see below):

- **Exit `0`** when the examples type-check cleanly against the local build, **or** when every remaining error is version-specific (present on only one of the two Handsontable versions). Those are reported as warnings, not failures.
- **Exit `1`** only when at least one error occurs in **both** versions. The offending example, error code and message are printed to stdout.

### Useful flags / env

- `node check.mjs --report` — skips the pass/fail gate and instead classifies every example as **PUBLIC** (type-checks against `handsontable@latest`), **DEV-ONLY** (passes on the local build, fails on latest), or **BROKEN** (fails on both). Always exits `0`.
- `REFRESH_LATEST=1` — forces a fresh `handsontable@latest` install instead of reusing the cached one in `.latest/` (see "Dual-version checking" below).

## How the script works

1. **Finds** every `.ts` file located in a directory named `angular` under `docs/content/` (e.g. `docs/content/recipes/cell-types/flatpickr/angular/example1.ts`).
2. **Splits** multi-section files into individual files. Examples use the format:
   ```ts
   /* file: app.component.ts */
   // ...
   /* end-file */

   /* file: app.config.ts */
   // ...
   /* end-file */
   ```
   Each section is written as a separate file under `.tmp/{guide-path}/{example-name}/`.  
   Single-section files (no markers) are copied as-is.
3. **Strips** things the compiler cannot resolve in isolation:
   - `import '...css'` bare CSS imports
   - `styleUrls: [...]` — replaced with `styles: []` (referenced `.css` files don't exist in `.tmp/`)
4. **Generates** a temporary `tsconfig.tmp.{label}.json` per run that extends `tsconfig.json`, points the `handsontable` / `handsontable/*` paths at the version being checked, and includes only the `.tmp/` tree plus `types/**/*.d.ts` shims.
5. **Runs** `ngc --noEmit` (capturing its output, not streaming it) against the local build first. If it is clean, the run stops here and exits `0` — `handsontable@latest` is never installed or checked.
6. If the local build reported errors, **runs `ngc` a second time** against `handsontable@latest` and **classifies** every distinct error as `BOTH`, `LOCAL-ONLY`, or `LATEST-ONLY` (see "Dual-version checking").
7. **Cleans up** each `tsconfig.tmp.{label}.json` after its run (the `.tmp/` directory is left for inspection on failure).

## Dual-version checking

Examples are validated against **two** Handsontable versions so the check can tell a genuinely broken example apart from a transient version-transition artifact (a type that exists in the dev build but not yet in the published release, or vice versa):

| Label | Resolved to | Notes |
|-------|-------------|-------|
| `local` | `../../handsontable/tmp` | the current dev build (requires `npm run build --prefix handsontable`) |
| `latest` | `.latest/node_modules/handsontable` | `handsontable@latest`, installed on demand and cached between runs |

Each error is keyed by `file | TS-code | message` (deliberately ignoring line/column, so the same logical error matches across versions even if positions shift) and bucketed:

- **`BOTH`** — present on local *and* latest → a real error. Fails the run (exit `1`).
- **`LOCAL-ONLY`** — only on the dev build → likely a local type regression. Warning only.
- **`LATEST-ONLY`** — only on the published release → version-transition artifact. Warning only.

The `.latest/` install is cached; delete it or set `REFRESH_LATEST=1` to refresh it.

## GitHub Actions reporting

When run in CI (`GITHUB_ACTIONS=true`) the script adds, on top of the exit code:

- **Annotations** — `::error` for `BOTH` errors (red, and the step fails on exit `1`); `::warning` for `LOCAL-ONLY` / `LATEST-ONLY` errors (yellow, non-failing). When the step passes but warnings exist, it also emits one top-level `::warning` so the run shows the yellow "has warnings" banner instead of looking problem-free.
- **Job summary** — a markdown table (`## Angular docs type-check`) written to `GITHUB_STEP_SUMMARY` listing every error with its scope.
- **A separate check-run** named `Angular docs type-check`, published via the GitHub Checks API, carrying the conclusion that the workflow step itself cannot express: **`neutral`** when there are warnings only, **`failure`** when there are `BOTH` errors. This is the only way a "neutral" entry appears in the PR checks summary — a normal step can resolve only to success (exit `0`) or failure (exit ≠ `0`).

  Publishing the check-run requires `GITHUB_TOKEN` (or `GH_TOKEN`) in the step env **and** `checks: write` permission on the job. Without them the script logs a `::warning` and skips publishing — the step still passes/fails correctly, but no neutral entry is created. Note that for pull requests **from forks** `GITHUB_TOKEN` is read-only, so the neutral check-run cannot be published there.

## Module resolution

| Import | Resolved to |
|--------|-------------|
| `@handsontable/angular-wrapper` | `wrappers/angular-wrapper/dist/hot-table` (pnpm `link:`, requires wrapper to be built) |
| `handsontable` / `handsontable/*` | `handsontable/types` (local source types, via tsconfig `paths`) |
| `handsontable` runtime (peer dep) | `handsontable/tmp` (pnpm `link:`, requires core to be built) |
| `@angular/*`, `rxjs`, `zone.js` | `node_modules/` (managed by pnpm workspace) |

## Adding a new third-party library to an example

This package is a pnpm workspace member. Its dependencies are managed alongside the rest of the monorepo in the root `pnpm-lock.yaml`.

If a new example imports a library that is not yet listed in `docs/angular-type-check/package.json`, the check will fail with a "could not find declaration file" or "cannot find module" error.

When you add an example that uses a new library:

1. Add the package (and its `@types/*` package if it ships types separately) to `docs/angular-type-check/package.json`:
   ```json
   "devDependencies": {
     "some-library": "^x.y.z",
     "@types/some-library": "^x.y.z"
   }
   ```
2. Run `pnpm install` at the repo root to update `pnpm-lock.yaml`.
3. Commit both `package.json` and `pnpm-lock.yaml`.

If the library has no TypeScript declarations at all (not even via `@types/`), add a bare `declare module` entry to `types/shims.d.ts` instead:
```ts
declare module 'some-library';
```

## Type shims

`types/shims.d.ts` declares modules that ship without TypeScript declarations:

- `numbro/dist/languages.min.js`

Add further `declare module '...'` entries there for any other untyped imports used in examples.

## CI

The check runs automatically on every pull request and on every push to any branch when files under `docs/content/**/angular/*.ts`, `docs/angular-type-check/**`, `handsontable/**`, or `wrappers/angular-wrapper/**` change. See `.github/workflows/docs-angular-typecheck.yml`.

The job grants `checks: write` and passes `GITHUB_TOKEN` to the type-check step so the script can publish the `neutral` / `failure` check-run described in "GitHub Actions reporting". If you remove either, warnings will no longer surface as a neutral PR check.
