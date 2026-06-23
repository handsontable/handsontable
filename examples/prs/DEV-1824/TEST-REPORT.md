# Test Report — DEV-1824

**Task:** Fixed the `setDataAtCell` TypeScript signature so the documented array form `setDataAtCell(changes, source)` type-checks again.  
**PR:** [#12685](https://github.com/handsontable/handsontable/pull/12685)  
**Date tested:** 2026-06-23  
**Branch:** `claude/zen-curie-0zxxvg`

---

## Bug Summary

In Handsontable v17.1.0, calling `setDataAtCell` or `setDataAtRowProp` in the **array (batch) form** with a source string raised a TypeScript compile error:

```
TS2345: Argument of type 'string' is not assignable to parameter of type 'number'
```

**Root cause:** The `column` parameter in `core/types.ts` was typed as `number | null`, not accepting `string`. When calling `setDataAtCell([[...]], 'mySource')`, the source string was passed as the second argument (`column`), which TS rejected.

**Before fix** (`handsontable/src/core/types.ts`):
```ts
setDataAtCell(row: number | unknown[][], column?: number | null, value?: unknown, source?: string): void;
```

**After fix:**
```ts
setDataAtCell(row: number | unknown[][], column?: number | string | null, value?: unknown, source?: string): void;
```

---

## Test Results

### 1. TypeScript Type Tests (automated)

**File:** `handsontable/src/__tests__/core/methods.types.ts`

**Command:** `npx tsc -p tsconfig.build-types.json --noEmit`

| Test | Before fix | After fix |
|------|-----------|-----------|
| `hot.setDataAtCell([[...]], 'foo')` — array form with string source | ❌ TS2345 error | ✅ Compiles |
| `hot.setDataAtRowProp([[...]], 'foo')` — array form with string source | ❌ TS2345 error | ✅ Compiles |
| `hot.setDataAtCell(row, col, value, source)` — single-cell form | ✅ Always OK | ✅ Compiles |

**Result: PASS** — `tsc` exits with code 0, no type errors.

**Key change in test file (PR #12685):**
```diff
- (hot as any).setDataAtCell([[123, 123, 'foo'], [123, 123, { myProperty: 'foo' }]], 'foo');
+ hot.setDataAtCell([[123, 123, 'foo'], [123, 123, { myProperty: 'foo' }]], 'foo');
- (hot as any).setDataAtRowProp([[123, 'foo', 'foo'], [123, 'foo', 'foo']], 'foo');
+ hot.setDataAtRowProp([[123, 'foo', 'foo'], [123, 'foo', 'foo']], 'foo');
```

### 2. Full Build Type Check

**Command:** `npm --prefix handsontable run test:types` (step: `tsc -p tsconfig.build-types.json`)

**Result: PASS** — No type errors in source (`tsc -p tsconfig.build-types.json` exits 0).

> Note: The second step `tsc -p ./test/types` fails due to missing `@types/node` package in the environment — this is a pre-existing CI environment issue unrelated to DEV-1824.

### 3. Unit Tests

No unit tests exist for this specific TypeScript signature issue (it is a compile-time-only fix — no runtime behavior change). The type tests in `methods.types.ts` cover this.

### 4. Runtime / System Test (manual)

The runtime behavior of `setDataAtCell` with array form + source was **always correct** — only the TypeScript type was wrong.

**Manual verification via demo pages:**

Both demo pages load a Handsontable grid and call `setDataAtCell([[...]], 'mySource')`.  
The `afterChange` callback correctly receives the source string in both cases.

| Demo | URL | Result |
|------|-----|--------|
| Before fix | `before.html` (CDN v17.1.0) | ✅ Runtime works; shows TS workaround `(hot as any)` |
| After fix | `after.html` (CDN v17.1.0) | ✅ Runtime works; clean code without `as any` |

**Test steps:**
1. Open `before.html` — click "Set data (array form with source)" → `afterChange` log shows correct source
2. Open `after.html` — click "Set data — array form with source" → `afterChange` log shows correct source
3. Verify the source string (e.g., `"myCustomSource"`) appears correctly in the log for both pages

---

## Githack Demo Links

After pushing to branch `claude/zen-curie-0zxxvg`:

- **Before fix:** `https://rawcdn.githack.com/handsontable/handsontable/<commit-sha>/examples/prs/DEV-1824/before.html`
- **After fix:** `https://rawcdn.githack.com/handsontable/handsontable/<commit-sha>/examples/prs/DEV-1824/after.html`

---

## Verdict

✅ **PASS** — The TypeScript fix is correct. The `column` parameter of `setDataAtCell` and `setDataAtRowProp` now accepts `string`, matching the documented runtime behavior. No `as any` workaround is needed. Runtime behavior is unchanged.
