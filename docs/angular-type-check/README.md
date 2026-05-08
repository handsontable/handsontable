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

Exit code `0` = all examples pass. Any non-zero exit code means at least one type error was found; the failing file and error are printed to stdout.

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
4. **Generates** a temporary `tsconfig.tmp.json` that extends `tsconfig.json` and includes only the `.tmp/` tree plus `types/**/*.d.ts` shims.
5. **Runs** `ngc --noEmit` and forwards its output directly to the terminal.
6. **Cleans up** `tsconfig.tmp.json` after the run (the `.tmp/` directory is left for inspection on failure).

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

The check runs automatically on every pull request and on every push to any branch when files under `docs/content/**/angular/*.ts` or `docs/angular-type-check/**` change. See `.github/workflows/docs-angular-typecheck.yml`.
