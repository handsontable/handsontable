# Test Report — DEV-1826: Fix published type declarations for ESM/CJS dual-mode package

**PR:** [#12696](https://github.com/handsontable/handsontable/pull/12696)  
**Branch:** `feature/DEV-1826_fix-published-type-declarations`  
**Merged commit:** `dd02110`  
**Date tested:** 2026-06-23  
**Tester:** Claude (automated + manual verification)

---

## Summary

| Test | Result | Notes |
|---|---|---|
| `npm run build:types` | ✅ PASS | tsc emits `tmp/**/*.d.ts` cleanly |
| `.d.mts` wrappers generated | ✅ PASS | 8/8 `.d.ts` files have matching `.d.mts` |
| `.d.mts` content correctness | ✅ PASS | Thin re-export wrappers, no extensionless imports |
| `statSync.isFile()` — file detection | ✅ PASS | Returns `true` for files |
| `statSync.isFile()` — directory rejection | ✅ PASS | Returns `false` for directories |
| `statSync.isFile()` — missing file | ✅ PASS | Returns `false` for nonexistent paths |
| Exports map format — nested conditions | ✅ PASS | Source `package.json` has nested `{import:{types,default},require:{types,default}}` |
| `"type":"commonjs"` injection | ✅ PASS | Injected in `prepare-package-for-publish.mjs` at write time only |
| CI gate added (`publint` + `attw`) | ✅ PASS | `verify-emitted-types.yml` updated |
| Unit tests (`npm run test:unit`) | ⚠️ SKIP | Build env dependency issue (`cross-env-shell` / rspack sass-loader) — unrelated to this change |
| E2E tests | ⚠️ SKIP | Same build env issue — unrelated to this change |
| `publint` against full `tmp/` | ⚠️ N/A | Requires full bundle build (`.mjs`/`.js` files); types-only build insufficient for full validation |
| `attw` against full `tmp/` | ⚠️ N/A | Same — needs full bundle build |

---

## Test Details

### Test 1: build:types

```
npm --prefix handsontable run build:types

  ✓ tsc -p tsconfig.build-types.json (7233ms)
```

**Result: PASS** — TypeScript compilation succeeded with no errors.

---

### Test 2: .d.mts wrapper file generation

Verified that `prepare-package-for-publish.mjs` generates a `.d.mts` wrapper for every `.d.ts` file in `tmp/`:

```
.d.ts files in tmp/:  8
.d.mts files in tmp/: 8
All .d.ts have matching .d.mts: true ✓
```

Files verified: `index`, `base`, `core`, `editorManager`, `eventManager`, `registry`, `settings`, `themes/index`

---

### Test 3: .d.mts wrapper content

```js
// index.d.mts
export * from './index.js';
export { default } from './index.js';

// base.d.mts
export * from './base.js';
export { default } from './base.js';
```

**Result: PASS**
- Each `.d.mts` re-exports from its `.js` sibling (not the `.d.ts` directly)
- TypeScript maps the `.js` reference to `.d.ts` at lookup time (avoids InternalResolutionError)
- `export { default }` present when original `.d.ts` has a default export
- No extensionless imports that would fail under ESM moduleResolution

---

### Test 4: statSync.isFile() validation

```
plugins/ directory → isFile(): false  (expected: false ✓)
index.d.ts file   → isFile(): true   (expected: true ✓)
nonexistent.mjs   → isFile(): false  (expected: false ✓)
```

**Result: PASS** — `statSync(..., { throwIfNoEntry: false })?.isFile()` correctly:
- Returns `false` for directories (unlike `existsSync()` which returned `true`)
- Returns `true` for real files
- Returns `false` for nonexistent paths (no throw)

---

### Test 5: Exports map nested format

Source `handsontable/package.json` `exports` entry for `"."`:

```json
{
  ".": {
    "import": { "types": "./index.d.mts", "default": "./index.mjs" },
    "require": { "types": "./index.d.ts", "default": "./index.js" }
  }
}
```

**Result: PASS** — Nested format correctly separates ESM type declarations (`.d.mts`) from CJS (`.d.ts`).

---

### Test 6: CI workflow update

`verify-emitted-types.yml` now includes:

```yaml
- name: Check package exports and well-formedness (publint)
  run: |
    cd handsontable/tmp
    npx -y publint@0.3.21

- name: Check type-declaration resolution (attw)
  run: |
    cd handsontable/tmp
    npx -y @arethetypeswrong/cli@0.18.3 --pack . --format table \
      --ignore-rules false-export-default untyped-resolution no-resolution
```

**Result: PASS** — Gates were added and merged with the fix.

---

## Known Limitations / Skipped Tests

### Unit + E2E tests skipped

The test runner environment had dependency issues unrelated to this change:
- `cross-env-shell: not found` (missing global dep in this environment)
- `sass-loader` failing in rspack due to missing `ajv` / `schema-utils` module

These are environment setup issues in the CI container, not regressions introduced by DEV-1826.
The change itself modifies only:
1. `handsontable/scripts/prepare-package-for-publish.mjs` — build-time script, no runtime code
2. `handsontable/package.json` — exports map configuration
3. `.github/workflows/verify-emitted-types.yml` — CI config
4. `.changelogs/12696.json` — changelog entry

No runtime JS/TS source was changed, so no HOT unit/E2E tests cover this fix.

### publint/attw against full tmp/

Requires a full build (`npm run build:es`, `npm run build:commonjs`, etc.) to produce `.mjs`/`.js` files.
The `types-only` build path generates declarations but not the runtime bundles needed for a complete pack.

These tools were run locally by the PR author and confirmed:
- `publint@0.3.21`: **0 errors, 0 warnings** (was: 5 errors + 1 warning)
- `attw@0.18.3 --pack . --ignore-rules false-export-default`: **exit 0** (was: FalseCJS + FalseExportDefault)

---

## Githack Demo

- **Before fix:** `demos/DEV-1826/before-fix.html`
- **After fix:** `demos/DEV-1826/after-fix.html`

Githack URLs (served from `claude/bold-goldberg-got6rd` branch):

- Before: `https://rawcdn.githack.com/handsontable/handsontable/<SHA>/demos/DEV-1826/before-fix.html`
- After: `https://rawcdn.githack.com/handsontable/handsontable/<SHA>/demos/DEV-1826/after-fix.html`

_(SHA will be updated after push)_
