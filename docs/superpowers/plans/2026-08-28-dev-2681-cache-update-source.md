# DEV-2681 cache-update source Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expose the index-sequence mutation source on cache-update payloads so EditorManager can distinguish structural changes from rearrangements without tracking index counts.

**Architecture:** Keep the change source alive until the cache update is emitted, then include it in the cache-update state. EditorManager will classify `insert` and `remove` as structural, and route every other source through the existing reconciliation path. This is an additive extension of two public hook payloads.

**Tech Stack:** TypeScript, Jasmine unit tests, Playwright E2E, Handsontable index mapping.

**Spec:** ClickUp DEV-2681 (supplied task summary).

## Global Constraints

- Preserve public-hook compatibility: callers may still invoke cache-update hooks without a payload.
- Do not change default settings or editor behavior outside structural/rearrangement classification.
- Keep `indexesChangeSource` semantics consistent for `init`, `insert`, `remove`, `move`, and `update`.
- Retain the debug-demo instrumentation until a successful post-fix runtime run is recorded.

---

### Task 1: Pin the cache-update source contract

**Files:**
- Modify: `handsontable/src/translations/__tests__/indexMapper.unit.ts`
- Modify: `handsontable/src/core/settings.ts`
- Modify: `handsontable/src/core/hooks/constants.ts`

**Interfaces:**
- Produces: cache-update state containing `indexesChangeSource?: 'init' | 'insert' | 'remove' | 'move' | 'update'`.
- Consumes: existing `IndexMapper#indexesChangeSource` values.

- [ ] **Step 1: Add failing unit coverage for structural sources.**

```ts
indexMapper.addLocalHook('cacheUpdated', callback);
indexMapper.insertIndexes(1, 1);

expect(callback).toHaveBeenCalledWith(jasmine.objectContaining({
  indexesChangeSource: 'insert',
}));
```

Add equivalent cases for `removeIndexes`, `moveIndexes`, `setIndexesSequence`, and `initToLength`. Keep the existing three Boolean flags asserted so the payload extension cannot replace them.

- [ ] **Step 2: Run the focused test and confirm the new assertion fails.**

Run:

```bash
npm run test:unit --prefix handsontable -- --testPathPattern=indexMapper
```

Expected: the cache-update payload has no `indexesChangeSource` property.

- [ ] **Step 3: Extend public hook typing and API documentation.**

```ts
afterRowSequenceCacheUpdate?: (indexesChangesState: {
  indexesSequenceChanged: boolean;
  trimmedIndexesChanged: boolean;
  hiddenIndexesChanged: boolean;
  indexesChangeSource?: 'init' | 'remove' | 'insert' | 'move' | 'update';
}) => void;
```

Apply the same shape to the column hook and document the field in both JSDoc blocks in `core/hooks/constants.ts`. The field remains optional for source compatibility with manually dispatched hooks.

- [ ] **Step 4: Run type and focused unit checks.**

```bash
npm run test:types --prefix handsontable
npm run test:unit --prefix handsontable -- --testPathPattern=indexMapper
```

Expected: types accept existing no-argument manual dispatches; the new source assertions remain red until Task 2.

### Task 2: Preserve and emit the mutation source

**Files:**
- Modify: `handsontable/src/translations/indexMapper.ts`
- Test: `handsontable/src/translations/__tests__/indexMapper.unit.ts`

**Interfaces:**
- Consumes: `indexesChangeSource` set around sequence mutations.
- Produces: `cacheUpdated` state with the corresponding source.

- [ ] **Step 1: Make source lifetime cover a deferred cache update.**

Move the cleanup of `indexesChangeSource` in batched mutation paths so it occurs only after their `resumeOperations()` call emits `cacheUpdated`. Ensure the same lifetime is used by initialization, insertion, and removal; preserve the immediate `setIndexesSequence` and `moveIndexes` paths.

```ts
this.indexesChangeSource = 'insert';
this.indexesSequence.insert(visualInsertionIndex, insertedIndexes);
// Update dependent maps while the source remains available.
this.resumeOperations();
this.indexesChangeSource = undefined;
```

- [ ] **Step 2: Add the source to the emitted state.**

```ts
this.runLocalHooks('cacheUpdated', {
  indexesSequenceChanged: this.indexesSequenceChanged,
  trimmedIndexesChanged: this.trimmedIndexesChanged,
  hiddenIndexesChanged: this.hiddenIndexesChanged,
  indexesChangeSource: this.indexesChangeSource,
});
```

If a caller suspends operations around a mutation and the source would be cleared before its outer resume, retain the pending source specifically for the next cache-update payload and reset it after emission. Do not use a count-based fallback.

- [ ] **Step 3: Run the focused unit test.**

```bash
npm run test:unit --prefix handsontable -- --testPathPattern=indexMapper
```

Expected: all five mutation-source cases pass, including source preservation across a suspended operation.

### Task 3: Remove EditorManager’s count heuristic

**Files:**
- Modify: `handsontable/src/editorManager.ts`
- Test: `tests/e2e/editor-trimmed-row.spec.ts`

**Interfaces:**
- Consumes: `indexesChangesState.indexesChangeSource`.
- Produces: unchanged editor behavior for existing trim, move, insert, remove, and veto paths.

- [ ] **Step 1: Update the existing E2E regression cases first.**

Add explicit coverage that a structural source routes through record recapture while a `move` or trimming source routes through reconciliation. Extend the existing structural-change and nested-removal scenarios; retain their whole-source-data assertions.

```ts
await grid.openEditorAndType(4, 0, 'EDITED');
await grid.removeRowTrimmingFrom(0, 0);
await grid.commitWithEnter();

await expect.poll(() => grid.sourceData()).toEqual([
  ['A1', 'B1'], ['A2', 'B2'], ['A3', 'B3'], ['EDITED', 'B4'],
]);
```

- [ ] **Step 2: Run the focused regression suite against the unfixed implementation.**

```bash
cd tests && npx playwright test --project=e2e-main e2e/editor-trimmed-row.spec.ts
```

Expected: the existing behavior passes, while the source-contract unit test from Task 1 remains the failing proof of the missing information.

- [ ] **Step 3: Replace count comparison with source classification.**

Remove `#lastRowIndexCount`, `#lastColumnIndexCount`, constructor seeding, and their related JSDoc. Route only `insert` and `remove` to `#recaptureEditedRecord()`:

```ts
const isStructuralChange = indexesChangesState.indexesChangeSource === 'insert' ||
  indexesChangesState.indexesChangeSource === 'remove';

this.#repairEditor(isStructuralChange, indexesChangesState);
```

Keep the default state for payload-less public hook dispatches and treat it as non-structural.

- [ ] **Step 4: Run type, unit, and focused E2E checks.**

```bash
npm run test:types --prefix handsontable
npm run test:unit --prefix handsontable -- --testPathPattern=indexMapper
cd tests && npx playwright test --project=e2e-main e2e/editor-trimmed-row.spec.ts
```

Expected: source contract and editor regression behavior both pass.

### Task 4: Verify the fix in the instrumented repro

**Files:**
- Verify: `handsontable/dev-pr.html`
- Verify: `.cursor/debug-404751.log`

**Interfaces:**
- Consumes: local rebuilt bundle and source-bearing cache-update payload.
- Produces: post-fix runtime evidence.

- [ ] **Step 1: Rebuild the local bundle.**

```bash
npm run build --prefix handsontable
```

- [ ] **Step 2: Change only the demo log run ID to `post-fix`, keeping all instrumentation active.**

```js
runId: 'post-fix',
message: 'Cache-update payload shape after a row sequence change',
```

- [ ] **Step 3: Clear only the session log, reproduce the insertion, and inspect its NDJSON entries.**

Expected: the sequence event and cache-update event both identify `insert`; the latter has `hasSource: true`.

- [ ] **Step 4: After the user confirms the post-fix behavior, remove debug-only fetch calls.**

Retain the requested repro pages, but remove only the folded `agent log` regions after the before/after log comparison proves success.
