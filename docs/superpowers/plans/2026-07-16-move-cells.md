# moveCells (drag-to-move selection) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an off-by-default `moveCells: boolean` grid option that lets the user grab the edge of a selected cell range and drag it to move the block's data (values + formatting + adjusted formula references), Excel/Sheets-style, with Ctrl for copy.

**Architecture:** Built into core selection + Walkontable `Border` (no plugin), gated at runtime by the setting. The border grows a transparent edge hit-zone with a `grab` cursor that emits a mousedown through a new Walkontable setting callback; core runs the drag loop (dashed source + ghost preview), and on drop a core routine relocates data via `populateFromArray`/cell-meta, delegating to HyperFormula's `moveCells`/copy-paste when the Formulas plugin is active. A new UndoRedo action snapshots and reverses the move.

**Tech Stack:** TypeScript (core + Walkontable), Jest unit (`*.unit.js`), Jasmine/Puppeteer E2E (`*.spec.js`), Walkontable's separate Puppeteer runner, SCSS + CSS custom-property tokens, HyperFormula (Formulas plugin), UndoRedo plugin.

---

## Conventions (read before every task)

- Core rules: `handsontable/CLAUDE.md`. `throwWithCause` not `throw`. No `window`/`document`/`console` → `this.hot.rootWindow`/`rootDocument`/`helpers/console`. Private `#` fields. Hook callbacks as arrow class fields passed directly. Cognitive complexity ≤ 15. Multiline JSDoc on every class/method/function/field in `src/**/*.ts`. Never raw `setTimeout` → `this.hot._registerTimeout`.
- Walkontable rules: `handsontable/src/3rdparty/walkontable/CLAUDE.md`. Layout-forcing DOM reads go through `this.wot.domBindings.geometryReader.*`. Walkontable must not import core modules.
- Naming: public option is `moveCells`; internal drag state `#moveDrag`; core routine `moveCellRange(...)`; HF calls written `engine.moveCells(...)`. Keep these distinct.
- Tests: every `it()` in `*.spec.js` is `async`; every HOT API call `await`ed. E2E helpers are globals (`handsontable`, `selectCell`, `getData`, `getDataAtCell`, `createSpreadsheetData`, `getCell`).
- Rebuild core before E2E: `npm --prefix handsontable run build`.
- Commit after each task. Branch `selection-handler`. Do not force-push.
- `@since` for new option/hooks: `18.0.0` (the in-development version; matches `selectionHandles`).

## Verified API facts

- `hot.populateFromArray(start: CellCoords, input: unknown[][], end?: CellCoords, source?: string, method?: string)` — block write (core.ts:1229). Takes CellCoords, not (row,col).
- `hot.getData(r, c, r2, c2)` → 2D values array.
- `hot.getCellMeta(visualRow, visualCol)` / `hot.setCellMeta(row, col, key, value)` / `hot.removeCellMeta(row, col, key)`.
- `hot._createCellCoords(row, col)` → CellCoords.
- `getCellCoordsFromMousePosition(hot, clientX, clientY)` from `handsontable/src/helpers/dom/cellCoords.ts` — cell under pointer (throws on none).
- Walkontable edge-mousedown precedent: `onSelectionHandleMouseDown` — setting default in `src/3rdparty/walkontable/src/settings/defaults.ts:197`, emitted in `border.ts:171`, bridged in `tableView.ts:1208`.
- Formulas engine: `engine.moveCells(source, destinationLeftCorner)` + `engine.isItPossibleToMoveCells(source, dest)`; coords via the plugin's `rowAxisSyncer/columnAxisSyncer.getHfIndexFromVisualIndex(visualIndex)` + `this.sheetId`; row/col-move delegation precedent at `formulas.ts` ~L399-419.
- UndoRedo action precedent: `src/plugins/undoRedo/actions/rowMove.ts`.
- Drag-preview overlay precedent: `src/plugins/manualRowMove/ui/{_base,backlight,guideline}.ts`.

---

## File map

| File | Responsibility | Action |
|---|---|---|
| `src/dataMap/metaManager/metaSchema.ts` | `moveCells` default + JSDoc | Modify |
| `src/selection/types.ts` | `moveCells?` on `SelectionSettings` | Modify |
| `src/core/settings.ts` | `moveCells?` + hook signatures on `GridSettings` | Modify |
| `src/core/hooks/constants.ts` | Register `beforeMoveCells`/`afterMoveCells` | Modify |
| `src/selection/moveCells.ts` | Pure helpers: clamp target, guards, meta move plan | Create |
| `src/selection/__tests__/moveCells.unit.js` | Unit tests for helpers | Create |
| `src/3rdparty/walkontable/src/selection/border/types.ts` | `moveEnabled` border setting | Modify |
| `src/3rdparty/walkontable/src/selection/border/border.ts` | Edge hit-zone, grab cursor, dashed class, emit `onSelectionEdgeMouseDown` | Modify |
| `src/3rdparty/walkontable/src/settings/defaults.ts` | `onSelectionEdgeMouseDown` default | Modify |
| `src/styles/components/core/_selection.scss` | dashed source, ghost preview, grab cursor | Modify |
| `src/tableView.ts` | bridge edge mousedown → drag loop → ghost + commit | Modify |
| `src/selection/selection.ts` | `moveCellRange` routine + selection-after-move | Modify |
| `src/plugins/formulas/formulas.ts` | listen `beforeMoveCells`/`afterMoveCells` → HF move/copy | Modify |
| `src/plugins/undoRedo/actions/moveCells.ts` | undo/redo action | Create |
| `src/plugins/undoRedo/undoRedo.ts` | register the action | Modify |
| `docs/content/guides/cell-features/selection/selection.md` | guide + demo | Modify |
| `.changelogs/<pr>.json` | changelog | Create |

---

## Task 1: Add the `moveCells` option

**Files:**
- Modify: `handsontable/src/dataMap/metaManager/metaSchema.ts` (after the `selectionHandles` block)
- Modify: `handsontable/src/selection/types.ts` (`SelectionSettings`)
- Modify: `handsontable/src/core/settings.ts` (`GridSettings`)
- Test: metaSchema unit test + `handsontable/src/__tests__/core/settings.types.ts`

- [ ] **Step 1: Failing unit test** — in the metaSchema unit test (as used for `selectionHandles`):

```js
it('should default `moveCells` to false', () => {
  expect(metaSchema().moveCells).toBe(false);
});
```

- [ ] **Step 2: Run, confirm fail**: `npm --prefix handsontable run test:unit -- --testPathPattern=metaSchema` → FAIL.

- [ ] **Step 3: Add to `metaSchema.ts`** after the `selectionHandles: false,` entry:

```js
    /**
     * The `moveCells` option lets you move a [selection](@/guides/cell-features/selection/selection.md) by
     * dragging its edge. When enabled, hovering the border of a selected cell range shows a grab cursor;
     * dragging the border moves the block's data (values, formatting, and — with the
     * [`formulas`](@/api/options.md#formulas) plugin — adjusted formula references) to the new location.
     * Hold <kbd>Ctrl</kbd>/<kbd>Cmd</kbd> during the drag to copy instead of move.
     *
     * The move applies to a single contiguous cell range only. It has no effect on full-row, full-column,
     * select-all, or multiple selections, and the target must stay within the grid and must not overlap
     * read-only cells.
     *
     * This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
     *
     * @since 18.0.0
     * @memberof Options#
     * @type {boolean}
     * @default false
     * @category Core
     *
     * @example
     * ```js
     * // enable drag-to-move for selections
     * moveCells: true,
     * ```
     */
    moveCells: false,
```

- [ ] **Step 4: Types** — in `src/selection/types.ts` `SelectionSettings`, after `selectionHandles?: boolean;`:

```ts
  moveCells?: boolean;
```

In `src/core/settings.ts` `GridSettings`, after the `selectionHandles?: boolean;` line:

```ts
  moveCells?: boolean;
```

Add to `handsontable/src/__tests__/core/settings.types.ts` near the `selectionHandles` regression: `hot.updateSettings({ moveCells: true });` and add `moveCells: true` to the `allSettings` object.

- [ ] **Step 5: Run** `npm --prefix handsontable run test:unit -- --testPathPattern=metaSchema` (PASS) and `npm --prefix handsontable run test:types` (PASS; pre-existing third-party `@types/jest`/`@types/react` failures are acceptable if unrelated).

- [ ] **Step 6: Commit**

```bash
git add handsontable/src/dataMap handsontable/src/selection/types.ts handsontable/src/core/settings.ts handsontable/src/__tests__/core/settings.types.ts
git commit -m "feat(selection): add moveCells option (default false)"
```

---

## Task 2: Register `beforeMoveCells` / `afterMoveCells` hooks

**Files:**
- Modify: `handsontable/src/core/hooks/constants.ts` (`REGISTERED_HOOKS`)
- Modify: `handsontable/src/core/settings.ts` (hook signatures)
- Test: hooks registration unit test + `settings.types.ts`

- [ ] **Step 1: Failing test** in the hooks unit test (as for `afterOnSelectionHandleMouseDown`):

```js
it('should register the beforeMoveCells and afterMoveCells hooks', () => {
  const hooks = new Hooks();

  expect(hooks.isRegistered('beforeMoveCells')).toBe(true);
  expect(hooks.isRegistered('afterMoveCells')).toBe(true);
});
```

- [ ] **Step 2: Run, confirm fail**: `npm --prefix handsontable run test:unit -- --testPathPattern="core/hooks/__tests__/index.unit"` → FAIL.

- [ ] **Step 3: Register** — add `'beforeMoveCells'` and `'afterMoveCells'` to `REGISTERED_HOOKS` in `constants.ts` (group near other selection/move hooks), each with a multiline JSDoc block. Use `@param {Event}`-style types consistent with sibling hooks; describe params: `sourceRange` (CellRange), `targetTopLeft`/`targetRange` (CellCoords/CellRange), `isCopy` (boolean). Include `@since 18.0.0`.

- [ ] **Step 4: Type on `GridSettings`** in `src/core/settings.ts` near `afterOnSelectionHandleMouseDown`:

```ts
  /**
   * Fired before a `moveCells` drag relocates a selection. Return `false` to cancel the move.
   *
   * @since 18.0.0
   */
  beforeMoveCells?: (sourceRange: CellRange, targetTopLeft: CellCoords, isCopy: boolean) => void | boolean;
  /**
   * Fired after a `moveCells` drag has relocated a selection.
   *
   * @since 18.0.0
   */
  afterMoveCells?: (sourceRange: CellRange, targetRange: CellRange, isCopy: boolean) => void;
```

(Confirm `CellRange`/`CellCoords` are imported in `settings.ts`; if not, import their types the way neighboring hook signatures do.) Add TS regressions to `settings.types.ts`:

```ts
hot.updateSettings({ beforeMoveCells(source, target, isCopy) { return true; } });
hot.updateSettings({ afterMoveCells(source, target, isCopy) {} });
```

- [ ] **Step 5: Run** hooks unit test (PASS) + `test:types` (PASS).

- [ ] **Step 6: Commit**

```bash
git add handsontable/src/core/hooks/constants.ts handsontable/src/core/settings.ts handsontable/src/core/hooks/__tests__/ handsontable/src/__tests__/core/settings.types.ts
git commit -m "feat(selection): register beforeMoveCells/afterMoveCells hooks"
```

---

## Task 3: Pure helpers (`moveCells.ts`)

**Files:**
- Create: `handsontable/src/selection/moveCells.ts`
- Test: `handsontable/src/selection/__tests__/moveCells.unit.js`

- [ ] **Step 1: Failing tests**

```js
import { clampMoveTarget, canMoveRange } from '../moveCells';

describe('clampMoveTarget', () => {
  it('keeps the whole block inside the grid (top-left clamp)', () => {
    // grabOffset {row:1,col:1} within a 3x3 range, pointer at (0,0) → raw target (-1,-1) → clamp to (0,0)
    expect(clampMoveTarget({
      pointerRow: 0, pointerCol: 0, grabRowOffset: 1, grabColOffset: 1,
      rangeHeight: 3, rangeWidth: 3, totalRows: 20, totalCols: 10,
    })).toEqual({ row: 0, col: 0 });
  });

  it('clamps against the bottom-right so the block does not overflow', () => {
    // 3x3 block, pointer near bottom-right corner of a 20x10 grid
    expect(clampMoveTarget({
      pointerRow: 19, pointerCol: 9, grabRowOffset: 0, grabColOffset: 0,
      rangeHeight: 3, rangeWidth: 3, totalRows: 20, totalCols: 10,
    })).toEqual({ row: 17, col: 7 });
  });

  it('returns the exact top-left for an interior drop', () => {
    expect(clampMoveTarget({
      pointerRow: 5, pointerCol: 5, grabRowOffset: 1, grabColOffset: 1,
      rangeHeight: 2, rangeWidth: 2, totalRows: 20, totalCols: 10,
    })).toEqual({ row: 4, col: 4 });
  });
});

describe('canMoveRange', () => {
  it('allows a single contiguous cell range', () => {
    expect(canMoveRange({ rangeCount: 1, isEntireRow: false, isEntireColumn: false, isHeader: false })).toBe(true);
  });

  it('rejects multiple ranges', () => {
    expect(canMoveRange({ rangeCount: 2, isEntireRow: false, isEntireColumn: false, isHeader: false })).toBe(false);
  });

  it('rejects full-row, full-column, and header selections', () => {
    expect(canMoveRange({ rangeCount: 1, isEntireRow: true, isEntireColumn: false, isHeader: false })).toBe(false);
    expect(canMoveRange({ rangeCount: 1, isEntireRow: false, isEntireColumn: true, isHeader: false })).toBe(false);
    expect(canMoveRange({ rangeCount: 1, isEntireRow: false, isEntireColumn: false, isHeader: true })).toBe(false);
  });
});
```

- [ ] **Step 2: Run, confirm fail**: `npm --prefix handsontable run test:unit -- --testPathPattern=moveCells` → module not found.

- [ ] **Step 3: Implement `moveCells.ts`**

```ts
/**
 * Pure helpers for the `moveCells` (drag-to-move selection) feature. DOM-free so the
 * clamp and guard rules unit-test in isolation.
 */

interface ClampMoveTargetOptions {
  pointerRow: number;
  pointerCol: number;
  grabRowOffset: number;
  grabColOffset: number;
  rangeHeight: number;
  rangeWidth: number;
  totalRows: number;
  totalCols: number;
}

/**
 * Computes the clamped top-left target cell for a move, keeping the whole block inside the grid.
 *
 * @param {ClampMoveTargetOptions} options The pointer cell, the grab offset within the range, the range
 *   dimensions, and the grid extents.
 * @returns {{ row: number, col: number }} The clamped top-left target coordinates.
 */
export function clampMoveTarget({
  pointerRow, pointerCol, grabRowOffset, grabColOffset,
  rangeHeight, rangeWidth, totalRows, totalCols,
}: ClampMoveTargetOptions): { row: number, col: number } {
  const rawRow = pointerRow - grabRowOffset;
  const rawCol = pointerCol - grabColOffset;
  const maxRow = Math.max(0, totalRows - rangeHeight);
  const maxCol = Math.max(0, totalCols - rangeWidth);

  return {
    row: Math.min(Math.max(0, rawRow), maxRow),
    col: Math.min(Math.max(0, rawCol), maxCol),
  };
}

interface CanMoveRangeOptions {
  rangeCount: number;
  isEntireRow: boolean;
  isEntireColumn: boolean;
  isHeader: boolean;
}

/**
 * Tells whether the current selection is eligible for a `moveCells` drag: exactly one contiguous cell
 * range that is not a full row, full column, or header selection.
 *
 * @param {CanMoveRangeOptions} options The selection shape flags.
 * @returns {boolean}
 */
export function canMoveRange({ rangeCount, isEntireRow, isEntireColumn, isHeader }: CanMoveRangeOptions): boolean {
  return rangeCount === 1 && !isEntireRow && !isEntireColumn && !isHeader;
}
```

- [ ] **Step 4: Run** `npm --prefix handsontable run test:unit -- --testPathPattern=moveCells` → PASS.

- [ ] **Step 5: Commit**

```bash
git add handsontable/src/selection/moveCells.ts handsontable/src/selection/__tests__/moveCells.unit.js
git commit -m "feat(selection): add pure clamp/guard helpers for moveCells"
```

---

## Task 4: Cell-meta move helper

**Files:**
- Modify: `handsontable/src/selection/moveCells.ts` (add helper)
- Test: `handsontable/src/selection/__tests__/moveCells.unit.js` (extend)

Goal: a pure planner that, given a source range and a target top-left, returns the list of `{ fromRow, fromCol, toRow, toCol }` cell-coordinate mappings for moving/copying meta. The actual `getCellMeta`/`setCellMeta` calls happen in core (Task 6) using this plan — keeping the helper DOM-free and testable.

- [ ] **Step 1: Failing test**

```js
import { buildMoveMap } from '../moveCells';

describe('buildMoveMap', () => {
  it('maps each source cell to its target cell preserving layout', () => {
    const map = buildMoveMap({ fromRow: 2, fromCol: 2, toRow: 3, toCol: 3, targetRow: 5, targetCol: 6 });

    expect(map).toEqual([
      { fromRow: 2, fromCol: 2, toRow: 5, toCol: 6 },
      { fromRow: 2, fromCol: 3, toRow: 5, toCol: 7 },
      { fromRow: 3, fromCol: 2, toRow: 6, toCol: 6 },
      { fromRow: 3, fromCol: 3, toRow: 6, toCol: 7 },
    ]);
  });
});
```

- [ ] **Step 2: Run, confirm fail**.

- [ ] **Step 3: Implement `buildMoveMap`** in `moveCells.ts`:

```ts
interface BuildMoveMapOptions {
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
  targetRow: number;
  targetCol: number;
}

/**
 * Builds the per-cell source→target coordinate mapping for a move, preserving the block layout.
 *
 * @param {BuildMoveMapOptions} options The normalized source range corners and the target top-left.
 * @returns {Array<{ fromRow: number, fromCol: number, toRow: number, toCol: number }>}
 */
export function buildMoveMap({
  fromRow, fromCol, toRow, toCol, targetRow, targetCol,
}: BuildMoveMapOptions): Array<{ fromRow: number, fromCol: number, toRow: number, toCol: number }> {
  const map = [];

  for (let r = fromRow; r <= toRow; r++) {
    for (let c = fromCol; c <= toCol; c++) {
      map.push({ fromRow: r, fromCol: c, toRow: targetRow + (r - fromRow), toCol: targetCol + (c - fromCol) });
    }
  }

  return map;
}
```

- [ ] **Step 4: Run** → PASS.

- [ ] **Step 5: Commit**

```bash
git add handsontable/src/selection/moveCells.ts handsontable/src/selection/__tests__/moveCells.unit.js
git commit -m "feat(selection): add buildMoveMap helper for moveCells"
```

---

## Task 5: Walkontable border — edge hit-zone, grab cursor, emit mousedown

**Files:**
- Modify: `handsontable/src/3rdparty/walkontable/src/selection/border/types.ts`
- Modify: `handsontable/src/3rdparty/walkontable/src/selection/border/border.ts`
- Modify: `handsontable/src/3rdparty/walkontable/src/settings/defaults.ts`
- Test: `handsontable/src/3rdparty/walkontable/test/spec/selection/moveEdge.spec.js`

- [ ] **Step 1: Add types + default.** In `border/types.ts` add to `BorderInstanceSettings.border`: `moveEnabled?: boolean | ((...args: unknown[]) => boolean);`. In `settings/defaults.ts` add `onSelectionEdgeMouseDown: null,` with a `@property` JSDoc, mirroring `onSelectionHandleMouseDown`.

- [ ] **Step 2: Failing Walkontable test** (mirror `handles.spec.js` boilerplate; build a data-view instance with an area selection whose border has `moveEnabled: () => true`):

```js
it('should create an edge move hit-zone with a grab cursor when moveEnabled', async() => {
  // ...setup...
  const zone = focusBorder.main.querySelector('.wtMoveZone');

  expect(zone).not.toBe(null);
  expect(zone.style.cursor).toBe('grab');
});
```

- [ ] **Step 3: Run, confirm fail**: `npm --prefix handsontable run test:walkontable -- --testPathPattern=moveEdge`.

- [ ] **Step 4: Implement in `border.ts`.** Add a `createMoveZone()` method (desktop data-view only, gated like `createAdjustHandles`) that creates a `<div class="wtMoveZone">` appended to `this.main`, `position:absolute`, `cursor:grab`, `display:none`, `pointer-events:auto`, and a low-ish z-index so the `.wtSelectionHandle` pills (higher z) win where they overlap. Store it as `this.moveZone`. In `appear()`, when `moveEnabled` resolves truthy and not mobile, size/position the zone to the selection perimeter (a band a few px wide around the border box — reuse the `top/inlineStartPos/width/height` already computed; simplest v1: cover the full selection border rectangle with `pointer-events:auto` only on a border-thick frame using an inner cutout is complex — for v1 make the zone the selection's outline: set the zone to the full rectangle but with `pointer-events` only meaningful at the border; ALTERNATIVELY create four thin band divs top/bottom/start/end. Choose four thin bands mirroring the four border edges — each `cursor:grab`, a few px thick, positioned over each edge). Emit on mousedown of any band via `this.eventManager.addEventListener(band, 'mousedown', (e) => { stopImmediatePropagation(e); e.preventDefault(); this.wot.getSetting('onSelectionEdgeMouseDown', e); })`. Hide the zone/bands in `disappear()` and when `moveEnabled` is falsy.

  Keep cognitive complexity ≤ 15 (extract a `positionMoveZone(top, inlineStart, width, height)` method). Do NOT read layout-forcing DOM props. Follow the `adjustHandles` structure exactly.

- [ ] **Step 5: Run** → PASS. Also run `npm --prefix handsontable run test:walkontable -- --testPathPattern="border|handles|corner|moveEdge"` → no regressions.

- [ ] **Step 6: Commit**

```bash
git add handsontable/src/3rdparty/walkontable/src/selection/border/ handsontable/src/3rdparty/walkontable/src/settings/defaults.ts handsontable/src/3rdparty/walkontable/test/spec/selection/moveEdge.spec.js
git commit -m "feat(walkontable): add selection edge move hit-zone with grab cursor"
```

---

## Task 6: Core `moveCellRange` routine (no-Formulas path) + guards

**Files:**
- Modify: `handsontable/src/selection/selection.ts` (add `moveCellRange`)
- Test: `handsontable/test` E2E — `handsontable/src/__tests__/settings/moveCells.spec.js`

- [ ] **Step 1: Failing E2E** (data relocation without formulas):

```js
it('moves a range data to the target and clears the source', async() => {
  handsontable({ data: createSpreadsheetData(10, 10), moveCells: true });
  const before = getDataAtCell(2, 2);

  // programmatically invoke the routine (drag wiring is Task 7); expose via selection
  selectCells([[2, 2, 3, 3]]);
  hot().selection.moveCellRange(getSelectedRangeLast(), hot()._createCellCoords(5, 5), false);
  await sleep(0);

  expect(getDataAtCell(5, 5)).toBe(before);
  expect(getDataAtCell(2, 2)).toBe(null);
  expect(getSelected()).toEqual([[5, 5, 6, 6]]);
});

it('vetoes the move when beforeMoveCells returns false', async() => {
  handsontable({ data: createSpreadsheetData(10, 10), moveCells: true,
    beforeMoveCells: () => false });
  const before = getDataAtCell(2, 2);

  selectCells([[2, 2, 3, 3]]);
  hot().selection.moveCellRange(getSelectedRangeLast(), hot()._createCellCoords(5, 5), false);
  await sleep(0);

  expect(getDataAtCell(2, 2)).toBe(before); // unchanged
  expect(getDataAtCell(5, 5)).not.toBe(before);
});

it('copies (keeps source) when isCopy is true', async() => {
  handsontable({ data: createSpreadsheetData(10, 10), moveCells: true });
  const before = getDataAtCell(2, 2);

  selectCells([[2, 2, 3, 3]]);
  hot().selection.moveCellRange(getSelectedRangeLast(), hot()._createCellCoords(5, 5), true);
  await sleep(0);

  expect(getDataAtCell(2, 2)).toBe(before); // kept
  expect(getDataAtCell(5, 5)).toBe(before);
});

it('vetoes when the target overlaps a read-only cell', async() => {
  handsontable({ data: createSpreadsheetData(10, 10), moveCells: true,
    cell: [{ row: 5, col: 5, readOnly: true }] });
  const before = getDataAtCell(2, 2);

  selectCells([[2, 2, 3, 3]]);
  hot().selection.moveCellRange(getSelectedRangeLast(), hot()._createCellCoords(5, 5), false);
  await sleep(0);

  expect(getDataAtCell(2, 2)).toBe(before); // unchanged, move vetoed
});
```

- [ ] **Step 2: Run, confirm fail** (rebuild first): `npm --prefix handsontable run build && npm --prefix handsontable run test:e2e -- --testPathPattern=moveCells`.

- [ ] **Step 3: Implement `moveCellRange(sourceRange, targetTopLeft, isCopy)` in `selection.ts`.** Steps inside:
  1. Compute `targetRange` = same dimensions from `targetTopLeft`.
  2. Run `beforeMoveCells` via `this.runLocalHooks`/the core hook bridge (fire `beforeMoveCells(sourceRange, targetTopLeft, isCopy)`; if any handler returns `false`, return). Use the core `runHooks` path (selection has `tableProps`/hook access — confirm how selection fires core hooks; if selection cannot fire core hooks directly, put `moveCellRange` on `tableView`/core instead and call selection only for the selection update — pick the layer that can both fire hooks and call `populateFromArray`; core.ts is the natural home since it owns `populateFromArray`. Prefer implementing `moveCellRange` in `core.ts` as a public method and have selection/tableView call it).
  3. Guards: target fully in grid (via `clampMoveTarget` already applied upstream, but re-verify bounds); reject if any target cell is read-only (`getCellMeta(r,c).readOnly`); reject merge-split (if `mergeCells` plugin active, check the target/source don't split a merge — for v1, if any source or target cell has a colspan/rowspan that would be cut, veto). If vetoed, return without changes.
  4. Read source values: `const values = this.hot.getData(sr.from.row, sr.from.col, sr.to.row, sr.to.col)`.
  5. **When the Formulas plugin is NOT active** (this task): if MOVE, clear the source first (populate the source range with a null-filled array of the same size via `populateFromArray(source.from, nullGrid, source.to, 'moveCells')`), then `populateFromArray(targetTopLeft, values, targetBottomRight, 'moveCells')`. If COPY, only populate the target. (Order: for overlapping source/target, snapshot `values` first — already done — then clear then write; since we captured `values`, overlap is safe.)
  6. Move/copy meta: build `buildMoveMap(...)`; for each mapping, copy meta keys from source to target (`setCellMeta`); for MOVE, clear the moved keys on the source cells that are NOT also targets. Keep this to the user-facing meta keys (e.g. `className`, `readOnly`? — do NOT move `readOnly`; move formatting-related keys like `className`, `renderer`, `type`? For v1 move `className` and `type`-related formatting; document the scope). Wrap the whole relocation in `this.hot.batch(() => { ... })` to avoid redundant renders.
  7. Update selection to `targetRange` (via `selectCells`/`setRangeStartOnly`+`setRangeEnd`).
  8. Fire `afterMoveCells(sourceRange, targetRange, isCopy)`.

  Note: expose `moveCellRange` so the E2E can call `hot().selection.moveCellRange(...)` (or `hot().moveCellRange(...)` if implemented on core — adjust the tests to the chosen location). Keep the routine cohesive; extract helpers to stay under complexity 15.

- [ ] **Step 4: Run** the E2E until green; no console exceptions. Rebuild before each run.

- [ ] **Step 5: Commit**

```bash
git add handsontable/src/selection handsontable/src/core.ts handsontable/src/__tests__/settings/moveCells.spec.js
git commit -m "feat(selection): add moveCellRange routine (values + meta, move/copy, guards)"
```

---

## Task 7: Drag interaction + ghost preview (tableView)

**Files:**
- Modify: `handsontable/src/tableView.ts` (bridge edge mousedown → drag → ghost → commit)
- Modify: `handsontable/src/3rdparty/walkontable/.../border.ts` + `_selection.scss` (dashed source class; ghost handled in core overlay)
- Test: `handsontable/src/__tests__/settings/moveCellsDrag.spec.js` (E2E)

- [ ] **Step 1: Failing E2E** — simulate the real drag: mousedown on the `.wtMoveZone` band, mousemove over target cells, mouseup; assert the data moved and the source cleared. (Study `handles`/`autofill` specs for element-mousedown simulation.)

```js
it('moves the selection when dragging its edge to a new location', async() => {
  handsontable({ data: createSpreadsheetData(10, 10), moveCells: true });
  const before = getDataAtCell(2, 2);

  await selectCells([[2, 2, 3, 3]]);
  await mouseOver(getCell(2, 2));
  const zone = spec().$container[0].querySelector('.ht_master .wtMoveZone');

  await simulateMouseDown(zone);
  await mouseMove(getCell(5, 5));
  await mouseUp(getCell(5, 5));

  expect(getDataAtCell(5, 5)).toBe(before);
  expect(getDataAtCell(2, 2)).toBe(null);
});

it('copies instead of moving when Ctrl is held on drop', async() => {
  // hold ctrlKey on the mouseup/mousemove events; assert source kept + target written
});
```

- [ ] **Step 2: Run, confirm fail** (rebuild first).

- [ ] **Step 3: Implement drag in `tableView.ts`.** Register the `onSelectionEdgeMouseDown` Walkontable setting (near `onSelectionHandleMouseDown`, tableView.ts:1208). Handler:
  - Guard: `moveCells` on; `canMoveRange(...)` true for the current selection; else ignore.
  - Record `#moveDrag = { sourceRange, grabRow, grabCol }` where grab offsets come from the cell under the initial pointer minus source top-left. Add dashed class to the source border (toggle a flag on border settings that `_selection.scss` styles, or add/remove a class on the border `main` element).
  - Add document `mousemove`/`mouseup` (via eventManager). On mousemove: `getCellCoordsFromMousePosition` → `clampMoveTarget(...)` → position the ghost overlay at the target rectangle (create a ghost `<div>` overlay following the manualRowMove backlight pattern; append to the overlays layer). On `keydown` Esc → cancel (remove ghost, dashed, listeners; no data change). On mouseup: read `event.ctrlKey || event.metaKey` → `isCopy`; call the Task 6 routine `moveCellRange(sourceRange, clampedTargetTopLeft, isCopy)`; clean up ghost/dashed/listeners.
  - No raw setTimeout; cursor `grabbing` during drag.

- [ ] **Step 4: Dashed + ghost CSS** in `_selection.scss`: a dashed style for the source border during move (class toggled in border.ts), and a `.wtMoveGhost` overlay style (subtle outline/translucent fill, using existing tokens like `--ht-table-transition` if animated; keep static for v1). No `:has()`.

- [ ] **Step 5: Run** the drag E2E until green; rebuild each run; no console exceptions.

- [ ] **Step 6: Commit**

```bash
git add handsontable/src/tableView.ts handsontable/src/3rdparty/walkontable handsontable/src/styles handsontable/src/__tests__/settings/moveCellsDrag.spec.js
git commit -m "feat(selection): drag the selection edge to move it (ghost preview + Ctrl copy)"
```

---

## Task 8: Formulas plugin delegation (formula-aware move)

**Files:**
- Modify: `handsontable/src/plugins/formulas/formulas.ts`
- Test: `handsontable/src/plugins/formulas/__tests__/moveCells.spec.js` (E2E, `handsontable.full.js` build)

- [ ] **Step 1: Failing E2E** (with Formulas plugin):

```js
it('adjusts formula references when a formula cell is moved', async() => {
  handsontable({
    data: [['1', '=A1+10', ''], ['', '', ''], ['', '', '']],
    formulas: { engine: HyperFormula },
    moveCells: true,
  });

  await selectCells([[0, 1, 0, 1]]); // the =A1+10 cell (B1)
  hot().selection.moveCellRange(getSelectedRangeLast(), hot()._createCellCoords(2, 1), false);
  await sleep(0);

  // B1 formula moved to B3; still references A1 (absolute-ish move keeps the ref), value 11
  expect(getDataAtCell(2, 1)).toBe(11);
  expect(getDataAtCell(0, 1)).toBe(null);
});

it('updates dependents when a referenced cell is moved', async() => {
  // move A1 (value 1) elsewhere; a formula =A1 should follow the moved reference per HF moveCells
});
```

(Adjust the exact expected values to HyperFormula's documented `moveCells` reference-adjustment semantics — verify by observing actual output in a probe, then assert the observed correct values.)

- [ ] **Step 2: Run, confirm fail**: `npm --prefix handsontable run build && npm --prefix handsontable run test:e2e -- --testPathPattern=formulas/__tests__/moveCells`.

- [ ] **Step 3: Implement in `formulas.ts`.** Add hooks in `enablePlugin` (arrow class fields, per convention), mirroring the row/col-move delegation (~L399-419):
  - `beforeMoveCells` handler: convert `sourceRange` + `targetTopLeft` visual coords → HF `SimpleCellRange` + `SimpleCellAddress` via `this.rowAxisSyncer.getHfIndexFromVisualIndex` / `this.columnAxisSyncer.getHfIndexFromVisualIndex` + `this.sheetId`. If `!this.engine.isItPossibleToMoveCells(source, dest)` return `false` (veto). Store the converted addresses on a private field for the after handler.
  - `afterMoveCells` handler: for MOVE call `this.engine.moveCells(source, dest)`; for COPY call `this.engine.copy(source)` then `this.engine.paste(dest)`. Wrap in `this.engine.batch(...)` if multiple ops. The grid re-syncs via the existing `valuesUpdated` → `afterFormulasValuesUpdate` path.
  - CRITICAL ordering: the core `moveCellRange` (Task 6) must NOT also write values when the Formulas plugin is active (that would double-move). Gate Task 6's raw value write on "Formulas plugin not enabled". Determine active state via `this.hot.getPlugin('formulas')?.enabled` (or the settings flag) inside `moveCellRange`; when active, `moveCellRange` fires the hooks + moves META only and lets the Formulas plugin move the VALUES/formulas through HF. Document this split clearly in `moveCellRange`.

  Verify HF `moveCells` reference-adjustment behavior with a quick probe before finalizing the asserted values.

- [ ] **Step 4: Run** the formulas E2E until green (uses `handsontable.full.js`); rebuild first. Also re-run Task 6's no-formulas E2E to confirm the gating didn't break the plain path.

- [ ] **Step 5: Commit**

```bash
git add handsontable/src/plugins/formulas handsontable/src/selection handsontable/src/core.ts
git commit -m "feat(formulas): move/copy cells through HyperFormula for moveCells (adjust refs)"
```

---

## Task 9: Undo / redo action

**Files:**
- Create: `handsontable/src/plugins/undoRedo/actions/moveCells.ts`
- Modify: `handsontable/src/plugins/undoRedo/undoRedo.ts` (register)
- Test: `handsontable/src/__tests__/settings/moveCellsUndo.spec.js` (E2E)

- [ ] **Step 1: Failing E2E**

```js
it('undo restores the source and the overwritten target; redo re-applies', async() => {
  handsontable({ data: createSpreadsheetData(10, 10), moveCells: true });
  const src = getDataAtCell(2, 2);
  const dstBefore = getDataAtCell(5, 5);

  await selectCells([[2, 2, 3, 3]]);
  hot().selection.moveCellRange(getSelectedRangeLast(), hot()._createCellCoords(5, 5), false);
  await sleep(0);

  hot().undo();
  await sleep(0);
  expect(getDataAtCell(2, 2)).toBe(src);       // source restored
  expect(getDataAtCell(5, 5)).toBe(dstBefore); // overwritten target restored

  hot().redo();
  await sleep(0);
  expect(getDataAtCell(5, 5)).toBe(src);
  expect(getDataAtCell(2, 2)).toBe(null);
});
```

- [ ] **Step 2: Run, confirm fail**.

- [ ] **Step 3: Implement the action** in `actions/moveCells.ts` following `rowMove.ts`: listen to `afterMoveCells` in `startRegisteringEvents`; the action snapshots `sourceRange`, `targetRange`, `isCopy`, the moved source data + meta, and the target cells' PRIOR data + meta (captured in a `beforeMoveCells` handler so it records the overwritten content before it is replaced). `undo()`: restore the target's prior content and, for MOVE, restore the source content + meta; `redo()`: re-run the relocation. Register the action class in `undoRedo.ts` where other actions are registered. Keep undo deterministic via snapshots (do not rely on HF internal undo) so overwritten dependents restore correctly.

- [ ] **Step 4: Run** → PASS; also verify undo works with the Formulas plugin active (formula values recompute after restore).

- [ ] **Step 5: Commit**

```bash
git add handsontable/src/plugins/undoRedo handsontable/src/__tests__/settings/moveCellsUndo.spec.js
git commit -m "feat(undoRedo): add moveCells undo/redo action"
```

---

## Task 10: Theme / CSS polish

**Files:**
- Modify: `handsontable/src/styles/components/core/_selection.scss`

- [ ] **Step 1:** Ensure the dashed source style, the `.wtMoveGhost` overlay, and the `.wtMoveZone` grab cursor read cleanly across themes. Reuse existing tokens where possible (accent color for the ghost outline, `--ht-table-transition` if any fade). No `:has()`.
- [ ] **Step 2:** `npm --prefix handsontable run stylelint` → PASS; `npm --prefix handsontable run build` → PASS.
- [ ] **Step 3: Commit**

```bash
git add handsontable/src/styles
git commit -m "style(selection): dashed source and ghost preview styling for moveCells"
```

---

## Task 11: Visual regression example

**Files:**
- Create: example under `examples/next/visual-tests/js/demo/src/demos/moveCells/`
- Create: `visual-tests/tests/js-only/move-cells/*.spec.ts`

- [ ] **Step 1:** Invoke `creating-visual-test-examples` + `visual-testing`. Mirror the `selectionHandles` demo + visual spec (registered route, `tablePage`/`goto` fixture).
- [ ] **Step 2:** Demo grid with `moveCells: true`, a pre-selected interior range. The Playwright spec simulates grabbing the edge and moving partway, asserting the ghost overlay (`.wtMoveGhost`) is visible before screenshot. Note the harness injects `animation: none !important`.
- [ ] **Step 3:** Regenerate baseline (`--update-snapshots`), READ the PNG to confirm the dashed source + ghost render. Commit (PNG gitignored → commit spec).

```bash
git add examples/next/visual-tests visual-tests/tests
git commit -m "test(visual): add moveCells visual regression example"
```

---

## Task 12: Documentation + changelog

**Files:**
- Modify: `docs/content/guides/cell-features/selection/selection.md`
- Create: `.changelogs/<pr>.json`
- Modify: AGENTS.md where warranted

- [ ] **Step 1:** Invoke `writing-docs-pages`. Add a "Move a selection by dragging" section: enable with `moveCells: true`; grab the border to move, Ctrl to copy; formatting + (with the Formulas plugin) formula-reference adjustment; the `beforeMoveCells`/`afterMoveCells` hooks; v1 limitations (single contiguous range; not full-row/column/select-all/multiple; target must be in-grid and not read-only). Add a runnable demo (4 framework tabs, mirroring the file's convention). American English, short active sentences, "you", no evaluative adjectives, `javascript` fences.
- [ ] **Step 2:** Invoke `changelog-creation`; `added` entry titled e.g. "Added the `moveCells` option for moving a cell selection by dragging its edge." Use the PR number.
- [ ] **Step 3:** If warranted, add a one-line AGENTS.md note (the `moveCells` option vs HyperFormula `moveCells` method distinction; the border move-zone vs resize pills).
- [ ] **Step 4: Commit**

```bash
git add docs/ .changelogs/ handsontable/src/3rdparty/walkontable/AGENTS.md
git commit -m "docs(selection): document moveCells option + changelog"
```

---

## Task 13: Final verification

- [ ] **Step 1:** ESLint scoped to changed files (full `eslint` crashes pre-existing on `SheetClip.ts`; scope to the feature files) + `npm --prefix handsontable run stylelint` — PASS.
- [ ] **Step 2:** `npm --prefix handsontable run test:types` — PASS (only pre-existing third-party failures).
- [ ] **Step 3:** `npm --prefix handsontable run build` (both variants) — PASS; confirm `dist/handsontable.js` and `dist/handsontable.full.js` contain `moveCells`.
- [ ] **Step 4:** Targeted sweep:
  - `npm --prefix handsontable run test:unit -- --testPathPattern="moveCells|metaSchema|hooks"`
  - `npm --prefix handsontable run test:e2e -- --testPathPattern="moveCells"`
  - `npm --prefix handsontable run test:e2e -- --testPathPattern="formulas/__tests__/moveCells"`
  - `npm --prefix handsontable run test:walkontable -- --testPathPattern="border|moveEdge|handles"`
  All PASS, no console exceptions.
- [ ] **Step 5:** Invoke `superpowers:verification-before-completion`; confirm every claim with output. Then push and update the draft PR (or open a PR) per `pr-creation`.

---

## Cross-cutting notes

- **Formulas-active vs not:** `moveCellRange` moves META always; it writes VALUES only when the Formulas plugin is NOT enabled. When enabled, the Formulas plugin performs the value/formula move via HF (Task 8). This split avoids double-moves — document it at the routine and test both paths.
- **Overlap:** source `values` are snapshotted before any clear/write so overlapping source/target moves are safe.
- **Never change a default:** `moveCells` defaults `false`.
- **Coexistence with `selectionHandles`:** resize pills (higher z) win over the move zone where they overlap.
