# Selection Handles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an off-by-default `selectionHandles: boolean` grid option that shows draggable pill handles at the midpoint of each selection edge on hover, letting the user resize the selected range (selection adjustment, not autofill).

**Architecture:** Built into core selection + Walkontable `Border` (no plugin). The `Border` renders four edge-handle elements, gated by a per-highlight `adjustHandlesVisible` setting (mirroring `cornerVisible`) and positioned in `appear()`. Core wires hover detection (via `beforeOnCellMouseOver`) to toggle which range shows handles, and a document-level drag loop (mirroring autofill) that updates the range through `selection.setRangeStart`/`setRangeEnd` with clamp-no-flip semantics.

**Tech Stack:** TypeScript (core + Walkontable), Jest unit tests (`*.unit.js`), Jasmine/Puppeteer E2E (`*.spec.js`), Walkontable's separate Puppeteer runner, SCSS + CSS custom-property theme tokens, Typedoc/JSDoc docs.

---

## Conventions (read before every task)

- Core rules: `handsontable/CLAUDE.md`. Never `throw new Error` → `throwWithCause`. No `window`/`document`/`console` → `this.hot.rootWindow` / `rootDocument` / `helpers/console`. Private fields `#`. Plugin hook callbacks are arrow class fields passed directly. Cognitive complexity ≤ 15. JSDoc multiline block on every class/method/function/field in `src/**/*.ts`.
- Walkontable rules: `handsontable/src/3rdparty/walkontable/CLAUDE.md`. Layout-forcing DOM reads MUST go through `this.wot.domBindings.geometryReader.*` — never read `getBoundingClientRect`/`offset*`/`getComputedStyle` directly.
- Tests: every `it()` in `*.spec.js` is `async`; every HOT API call is `await`ed. E2E helpers (`handsontable()`, `selectCell()`, `getCell()`, `createSpreadsheetData()`) are globals.
- Rebuild core before E2E: `npm --prefix handsontable run build`.
- Commit after each task. Branch is `selection-handler` (already checked out) — do not force-push.

---

## File map

| File | Responsibility | Action |
|---|---|---|
| `handsontable/src/dataMap/metaManager/metaSchema.ts` | Declare `selectionHandles` default + Typedoc | Modify (near `selectionMode`, ~L5556) |
| `handsontable/src/core/settings.ts` | Type `selectionHandles` + hook `afterOnSelectionHandleMouseDown` on `GridSettings` | Modify |
| `handsontable/src/selection/types.ts` | Add `selectionHandles?` to `SelectionSettings` | Modify (L46-61) |
| `handsontable/src/core/hooks/constants.ts` | Register `afterOnSelectionHandleMouseDown` in `REGISTERED_HOOKS` | Modify |
| `handsontable/src/selection/highlight/types/areaLayered.ts` | Inject `adjustHandlesVisible` into area border settings | Modify |
| `handsontable/src/selection/highlight/highlight.ts` | Pass `adjustHandlesVisible` factory through | Modify |
| `handsontable/src/selection/selection.ts` | Own hover-range + drag state; clamp-no-flip; enable/disable rules | Modify |
| `handsontable/src/3rdparty/walkontable/src/selection/border/types.ts` | `adjustHandlesVisible` on border settings; `AdjustHandles` interface | Modify |
| `handsontable/src/3rdparty/walkontable/src/selection/border/border.ts` | Create, position, hide, and hit-test the 4 handles | Modify |
| `handsontable/src/selection/handleAdjust.ts` | Pure clamp/boundary helpers (unit-tested) | Create |
| `handsontable/src/tableView.ts` | Wire hover + handle-mousedown into selection | Modify |
| `handsontable/styles/**` + `src/themes/static/**` + `scripts/themes/figma/**` | `cell-selection-handle-*` tokens + `.wtSelectionHandle` CSS | Modify |
| `docs/content/guides/cell-features/selection/selection.md` | Guide section + demo | Modify |
| `.changelogs/<id>.json` | Changelog `added` entry | Create |

---

## Task 1: Add the `selectionHandles` option (config plumbing)

**Files:**
- Modify: `handsontable/src/dataMap/metaManager/metaSchema.ts` (after the `selectionMode` block, ~L5556)
- Modify: `handsontable/src/selection/types.ts:59`
- Modify: `handsontable/src/core/settings.ts` (GridSettings)
- Test: `handsontable/src/dataMap/metaManager/__tests__/metaSchema.unit.js` (or nearest existing schema unit test) and `handsontable/src/__tests__/core/settings.types.ts`

- [ ] **Step 1: Write the failing unit test**

In the metaSchema unit test file (find the existing one with `grep -rl "metaSchema" handsontable/src/**/__tests__`):

```js
it('should default `selectionHandles` to false', () => {
  const schema = metaSchema();

  expect(schema.selectionHandles).toBe(false);
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npm --prefix handsontable run test:unit -- --testPathPattern=metaSchema`
Expected: FAIL — `expect(undefined).toBe(false)`.

- [ ] **Step 3: Add the option to `metaSchema.ts`**

Immediately after the `selectionMode: 'multiple',` entry (~L5556):

```js
    /**
     * The `selectionHandles` option enables draggable handles on the edges of a
     * [selection](@/guides/cell-features/selection/selection.md). When enabled, hovering over a
     * selected range shows a pill-shaped handle at the midpoint of each edge; dragging a handle
     * resizes that edge of the selection. This adjusts the selected area only — it does not move,
     * fill, or change any cell data.
     *
     * Handles are shown on desktop only and are hidden on any edge that is flush with the grid
     * boundary. The option has no effect when [`selectionMode`](#selectionmode) is `'single'`.
     *
     * This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
     *
     * @since 16.2.0
     * @memberof Options#
     * @type {boolean}
     * @default false
     * @category Core
     *
     * @example
     * ```js
     * // enable draggable selection-edge handles
     * selectionHandles: true,
     * ```
     */
    selectionHandles: false,
```

(Confirm the correct `@since` version from `handsontable/package.json` `version` at implementation time.)

- [ ] **Step 4: Add to `SelectionSettings`**

`handsontable/src/selection/types.ts`, inside `SelectionSettings` after `fillHandle?: unknown;` (L59):

```ts
  selectionHandles?: boolean;
```

- [ ] **Step 5: Add to `GridSettings` type**

In `handsontable/src/core/settings.ts`, find the `selectionMode` property in the `GridSettings` interface and add below it:

```ts
  selectionHandles?: boolean;
```

Add a TypeScript regression to `handsontable/src/__tests__/core/settings.types.ts`:

```ts
hot.updateSettings({ selectionHandles: true });
```

- [ ] **Step 6: Run tests**

Run: `npm --prefix handsontable run test:unit -- --testPathPattern=metaSchema`
Expected: PASS.
Run: `npm --prefix handsontable run test:types`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add handsontable/src/dataMap/metaManager/metaSchema.ts handsontable/src/selection/types.ts handsontable/src/core/settings.ts handsontable/src/__tests__/core/settings.types.ts handsontable/src/dataMap/metaManager/__tests__/
git commit -m "feat(selection): add selectionHandles option (default false)"
```

---

## Task 2: Register the `afterOnSelectionHandleMouseDown` hook

**Files:**
- Modify: `handsontable/src/core/hooks/constants.ts` (`REGISTERED_HOOKS` array)
- Modify: `handsontable/src/core/settings.ts` (hook signature on `GridSettings`)
- Test: `handsontable/src/core/hooks/__tests__/` (nearest hooks registration unit test) + `handsontable/src/__tests__/core/settings.types.ts`

- [ ] **Step 1: Write the failing test**

Find the hooks unit test with `grep -rl "REGISTERED_HOOKS" handsontable/src`. Add:

```js
it('should register the afterOnSelectionHandleMouseDown hook', () => {
  const hooks = new Hooks();

  expect(hooks.isRegistered('afterOnSelectionHandleMouseDown')).toBe(true);
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npm --prefix handsontable run test:unit -- --testPathPattern=hooks`
Expected: FAIL.

- [ ] **Step 3: Register the hook**

In `handsontable/src/core/hooks/constants.ts`, add `'afterOnSelectionHandleMouseDown'` to `REGISTERED_HOOKS` near `'afterOnCellCornerMouseDown'` (keep alphabetical grouping if the file is sorted).

- [ ] **Step 4: Type the hook on `GridSettings`**

In `handsontable/src/core/settings.ts`, near `afterOnCellCornerMouseDown`, add:

```ts
  /**
   * Fired after the user presses a selection-adjustment handle (see [`selectionHandles`](#selectionhandles)).
   *
   * @param {MouseEvent} event The `mousedown` event.
   * @param {'top' | 'bottom' | 'start' | 'end'} edge The pressed handle's edge.
   */
  afterOnSelectionHandleMouseDown?: (event: MouseEvent, edge: 'top' | 'bottom' | 'start' | 'end') => void;
```

- [ ] **Step 5: Run tests**

Run: `npm --prefix handsontable run test:unit -- --testPathPattern=hooks && npm --prefix handsontable run test:types`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add handsontable/src/core/hooks/constants.ts handsontable/src/core/settings.ts handsontable/src/core/hooks/__tests__/ handsontable/src/__tests__/core/settings.types.ts
git commit -m "feat(selection): register afterOnSelectionHandleMouseDown hook"
```

---

## Task 3: Pure clamp / boundary helpers (`handleAdjust.ts`)

These are the testable core of the drag math, kept free of DOM so they unit-test cleanly.

**Files:**
- Create: `handsontable/src/selection/handleAdjust.ts`
- Test: `handsontable/src/selection/__tests__/handleAdjust.unit.js`

- [ ] **Step 1: Write the failing tests**

`handsontable/src/selection/__tests__/handleAdjust.unit.js`:

```js
import { clampEdge, getHiddenHandleEdges } from '../handleAdjust';

describe('clampEdge', () => {
  it('clamps a dragged top edge so it cannot cross the bottom edge (no flip)', () => {
    // range rows 2..5, dragging TOP toward row 9 → clamp to row 5 (min 1-row height)
    expect(clampEdge({ edge: 'top', target: 9, oppositeIndex: 5 })).toBe(5);
  });

  it('clamps a dragged bottom edge so it cannot cross the top edge', () => {
    expect(clampEdge({ edge: 'bottom', target: 0, oppositeIndex: 2 })).toBe(2);
  });

  it('leaves a valid drag untouched', () => {
    expect(clampEdge({ edge: 'top', target: 3, oppositeIndex: 5 })).toBe(3);
  });

  it('clamps negative targets to 0 (never into headers)', () => {
    expect(clampEdge({ edge: 'top', target: -4, oppositeIndex: 5 })).toBe(0);
  });
});

describe('getHiddenHandleEdges', () => {
  it('hides top when the selection touches row 0 and end when it touches the last column', () => {
    const hidden = getHiddenHandleEdges({
      fromRow: 0, toRow: 4, fromCol: 1, toCol: 9,
      lastRow: 20, lastCol: 9, isRtl: false,
    });

    expect(hidden).toEqual(new Set(['top', 'end']));
  });

  it('mirrors start/end in RTL', () => {
    const hidden = getHiddenHandleEdges({
      fromRow: 2, toRow: 4, fromCol: 0, toCol: 5,
      lastRow: 20, lastCol: 9, isRtl: true,
    });

    // fromCol === 0 is the inline-start edge; RTL mirrors which visual side it maps to
    expect(hidden.has('start')).toBe(true);
  });
});
```

- [ ] **Step 2: Run and confirm failure**

Run: `npm --prefix handsontable run test:unit -- --testPathPattern=handleAdjust`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `handleAdjust.ts`**

```ts
/**
 * Pure geometry helpers for the selection-adjustment handles feature. Kept DOM-free so the
 * clamp and boundary rules unit-test in isolation.
 */

export type HandleEdge = 'top' | 'bottom' | 'start' | 'end';

interface ClampEdgeOptions {
  edge: HandleEdge;
  target: number;
  oppositeIndex: number;
}

/**
 * Clamps a dragged edge index so the dragged edge never crosses the opposite edge (no flip) and
 * never enters the headers (index < 0). Preserves a minimum selection size of one cell.
 *
 * @param {ClampEdgeOptions} options The dragged edge, its target index, and the anchored opposite index.
 * @returns {number} The clamped index.
 */
export function clampEdge({ edge, target, oppositeIndex }: ClampEdgeOptions): number {
  const bounded = Math.max(0, target);

  if (edge === 'top' || edge === 'start') {
    return Math.min(bounded, oppositeIndex);
  }

  return Math.max(bounded, oppositeIndex);
}

interface HiddenEdgesOptions {
  fromRow: number;
  toRow: number;
  fromCol: number;
  toCol: number;
  lastRow: number;
  lastCol: number;
  isRtl: boolean;
}

/**
 * Determines which handle edges must be hidden because they are flush with the grid boundary.
 *
 * @param {HiddenEdgesOptions} options The selection corners and grid extents.
 * @returns {Set<HandleEdge>} The set of edges whose handles must not render.
 */
export function getHiddenHandleEdges({
  fromRow, toRow, fromCol, toCol, lastRow, lastCol,
}: HiddenEdgesOptions): Set<HandleEdge> {
  const hidden = new Set<HandleEdge>();

  if (fromRow <= 0) {
    hidden.add('top');
  }
  if (toRow >= lastRow) {
    hidden.add('bottom');
  }
  if (fromCol <= 0) {
    hidden.add('start');
  }
  if (toCol >= lastCol) {
    hidden.add('end');
  }

  return hidden;
}
```

(Note: `isRtl` is accepted in the test signature for future mirroring of the *visual* side; the
logical start/end mapping above is direction-agnostic because `fromCol`/`toCol` are visual indices
that Walkontable already mirrors via `inlinePosProperty`. Keep the param in the interface.)

- [ ] **Step 4: Run tests**

Run: `npm --prefix handsontable run test:unit -- --testPathPattern=handleAdjust`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add handsontable/src/selection/handleAdjust.ts handsontable/src/selection/__tests__/handleAdjust.unit.js
git commit -m "feat(selection): add pure clamp/boundary helpers for adjustment handles"
```

---

## Task 4: Border — create and hide handle elements

**Files:**
- Modify: `handsontable/src/3rdparty/walkontable/src/selection/border/types.ts`
- Modify: `handsontable/src/3rdparty/walkontable/src/selection/border/border.ts`
- Test: `handsontable/src/3rdparty/walkontable/test/spec/selection/handles.spec.js` (Walkontable runner)

- [ ] **Step 1: Add types**

In `border/types.ts` add to `BorderInstanceSettings.border` (after `cornerVisible`):

```ts
    adjustHandlesVisible?: boolean | ((...args: unknown[]) => boolean);
```

And add a new interface:

```ts
export interface AdjustHandles {
  top: HTMLDivElement;
  bottom: HTMLDivElement;
  start: HTMLDivElement;
  end: HTMLDivElement;
  styles: {
    top: CSSStyleDeclaration;
    bottom: CSSStyleDeclaration;
    start: CSSStyleDeclaration;
    end: CSSStyleDeclaration;
    [key: string]: CSSStyleDeclaration;
  };
  [key: string]: unknown;
}
```

- [ ] **Step 2: Write the failing Walkontable test**

`handsontable/src/3rdparty/walkontable/test/spec/selection/handles.spec.js` — follow the boilerplate of the sibling `border.spec.js`. Core assertion:

```js
it('should create four adjust-handle elements when adjustHandlesVisible is enabled', async() => {
  // build a Walkontable instance with an area selection whose border settings include
  // border: { adjustHandlesVisible: () => true } (copy the selection setup from border.spec.js)
  const handles = spec().$wrapper[0].querySelectorAll('.wtSelectionHandle');

  expect(handles.length).toBe(4);
});
```

- [ ] **Step 3: Run and confirm failure**

Run: `npm --prefix handsontable run test:walkontable -- --testPathPattern=handles`
Expected: FAIL — 0 elements.

- [ ] **Step 4: Declare fields and create elements**

In `border.ts`, add the import and field:

```ts
import type { BorderInstanceSettings, CornerDefaultStyle, SelectionHandles, AdjustHandles } from './types';
```

```ts
  /**
   * @type {AdjustHandles}
   */
  declare adjustHandles: AdjustHandles;
```

Add a creation method (called from `createBorders`, before `this.disappear()`), gated to desktop:

```ts
  /**
   * Creates the four edge-adjustment handle elements used by the `selectionHandles` feature.
   */
  createAdjustHandles() {
    const { rootDocument } = this.wot;
    const make = (edge: string) => {
      const el = rootDocument.createElement('div');

      el.className = `wtSelectionHandle wtSelectionHandle--${edge}`;
      el.style.position = 'absolute';
      el.style.display = 'none';
      this.main!.appendChild(el);

      return el;
    };

    const top = make('top');
    const bottom = make('bottom');
    const start = make('start');
    const end = make('end');

    this.adjustHandles = {
      top,
      bottom,
      start,
      end,
      styles: { top: top.style, bottom: bottom.style, start: start.style, end: end.style },
    };
  }
```

In `createBorders`, before `this.disappear();` (L312):

```ts
    if (!isMobileBrowser()) {
      this.createAdjustHandles();
    }
```

- [ ] **Step 5: Hide in `disappear()`**

Append to `disappear()` (after the mobile block, ~L1467):

```ts
    if (this.adjustHandles) {
      this.adjustHandles.styles.top.display = 'none';
      this.adjustHandles.styles.bottom.display = 'none';
      this.adjustHandles.styles.start.display = 'none';
      this.adjustHandles.styles.end.display = 'none';
    }
```

- [ ] **Step 6: Run test**

Run: `npm --prefix handsontable run test:walkontable -- --testPathPattern=handles`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add handsontable/src/3rdparty/walkontable/src/selection/border/
git commit -m "feat(walkontable): create selection adjust-handle elements"
```

---

## Task 5: Border — position handles in `appear()` with boundary hiding

**Files:**
- Modify: `handsontable/src/3rdparty/walkontable/src/selection/border/border.ts` (`appear()`)
- Test: `handsontable/src/3rdparty/walkontable/test/spec/selection/handles.spec.js`

- [ ] **Step 1: Write the failing tests**

Add to `handles.spec.js`:

```js
it('positions each visible handle at the midpoint of its edge', async() => {
  // area selection spanning several interior rows/cols with adjustHandlesVisible: () => true
  const top = spec().$wrapper[0].querySelector('.wtSelectionHandle--top');

  expect(top.style.display).toBe('block');
  // midpoint assertions: top handle's left ≈ selection left + width/2 (allow ±2px tolerance)
});

it('hides the handle on an edge flush with the grid boundary', async() => {
  // selection with fromRow === 0 → top handle hidden
  const top = spec().$wrapper[0].querySelector('.wtSelectionHandle--top');

  expect(top.style.display).toBe('none');
});
```

- [ ] **Step 2: Run and confirm failure**

Run: `npm --prefix handsontable run test:walkontable -- --testPathPattern=handles`
Expected: FAIL.

- [ ] **Step 3: Add a positioning method**

In `border.ts`, add a method that reuses the geometry already computed in `appear()`. Import the pure helper is NOT allowed across the Walkontable boundary (Walkontable must not import core modules) — so replicate the boundary rule locally here using the raw corners:

```ts
  /**
   * Positions the four edge-adjustment handles at the midpoint of each edge, hiding any handle
   * whose edge is flush with the grid boundary. Called at the end of `appear()` when the feature is
   * enabled for this highlight.
   *
   * @param {number} top The selection border top (px, container-relative).
   * @param {number} inlineStart The selection border inline-start (px, container-relative).
   * @param {number} width The selection border width (px).
   * @param {number} height The selection border height (px).
   * @param {number[]} corners The raw `[fromRow, fromColumn, toRow, toColumn]` visual corners.
   */
  positionAdjustHandles(
    top: number, inlineStart: number, width: number, height: number, corners: number[]) {
    const isRtl = this.wot.wtSettings.getSetting('rtlMode');
    const inlineProp = isRtl ? 'right' : 'left';
    const [fromRow, fromColumn, toRow, toColumn] = corners;
    const lastRow = (this.wot.getSetting('totalRows') as number) - 1;
    const lastColumn = (this.wot.getSetting('totalColumns') as number) - 1;
    const size = parseInt(this.adjustHandles.styles.top.height || '0', 10) ||
      parseInt(this.adjustHandles.styles.top.width || '0', 10);
    const half = Math.round(size / 2);
    const s = this.adjustHandles.styles;

    // reset
    s.top.display = s.bottom.display = s.start.display = s.end.display = 'none';

    // top / bottom sit on the horizontal midline
    const midX = inlineStart + Math.round(width / 2) - half;

    if (fromRow > 0) {
      s.top[inlineProp] = `${midX}px`;
      s.top.top = `${top - half}px`;
      s.top.display = 'block';
    }
    if (toRow < lastRow) {
      s.bottom[inlineProp] = `${midX}px`;
      s.bottom.top = `${top + height - half}px`;
      s.bottom.display = 'block';
    }

    // start / end sit on the vertical midline
    const midY = top + Math.round(height / 2) - half;

    if (fromColumn > 0) {
      s.start[inlineProp] = `${inlineStart - half}px`;
      s.start.top = `${midY}px`;
      s.start.display = 'block';
    }
    if (toColumn < lastColumn) {
      s.end[inlineProp] = `${inlineStart + width - half}px`;
      s.end.top = `${midY}px`;
      s.end.display = 'block';
    }
  }
```

- [ ] **Step 4: Call it from `appear()`**

At the very end of `appear()` (after the mobile `updateMultipleSelectionHandlesPosition` block, ~L1284), add:

```ts
    let adjustVisible = this.settings.border?.adjustHandlesVisible;

    adjustVisible = typeof adjustVisible === 'function'
      ? adjustVisible(this.settings.layerLevel) : adjustVisible;

    if (!isMobileBrowser() && adjustVisible && this.adjustHandles) {
      // Skip when the whole selection sits on a frozen boundary edge (v1 limitation): the frozen
      // overlay branch returned early above; here we simply hide handles on frozen-boundary edges.
      const onFrozenTop = this.isFrozenBoundaryEdge('row', corners[0]);
      const onFrozenStart = this.isFrozenBoundaryEdge('column', corners[1]);

      this.positionAdjustHandles(top, inlineStartPos, width, height, corners);

      if (onFrozenTop) {
        this.adjustHandles.styles.top.display = 'none';
      }
      if (onFrozenStart) {
        this.adjustHandles.styles.start.display = 'none';
      }
    } else if (this.adjustHandles) {
      this.adjustHandles.styles.top.display = 'none';
      this.adjustHandles.styles.bottom.display = 'none';
      this.adjustHandles.styles.start.display = 'none';
      this.adjustHandles.styles.end.display = 'none';
    }
```

(`top`, `inlineStartPos`, `width`, `height`, and `corners` are all in scope at that point in `appear()`.)

- [ ] **Step 5: Run tests**

Run: `npm --prefix handsontable run test:walkontable -- --testPathPattern=handles`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add handsontable/src/3rdparty/walkontable/src/selection/border/border.ts handsontable/src/3rdparty/walkontable/test/spec/selection/handles.spec.js
git commit -m "feat(walkontable): position selection adjust-handles with boundary hiding"
```

---

## Task 6: Theme tokens + handle CSS

**Files:**
- Modify: `scripts/themes/figma/**` (token source) — see `handsontable-css-dev` skill for the four-layer process
- Modify: generated `handsontable/src/themes/static/**` (run `npm --prefix handsontable run generate:themes`)
- Modify/create: the SCSS that renders `.wtSelectionHandle`
- Test: covered by the visual regression example in Task 10 (no unit test — CSS)

- [ ] **Step 1: Read the theme skill**

Invoke the `handsontable-css-dev` skill and follow the four-layer token process. Do not hand-edit generated CSS without also updating the generator source.

- [ ] **Step 2: Add tokens**

Add `cell-selection-handle-size`, `cell-selection-handle-border-width`, `cell-selection-handle-border-color`, `cell-selection-handle-background-color`, `cell-selection-handle-border-radius` to the token source for each theme (classic/main/horizon), mirroring the existing `cell-autofill-*` tokens.

- [ ] **Step 3: Add the `.wtSelectionHandle` rule**

In the SCSS that owns selection border/corner styling (find with `grep -rl "cell-autofill-size" handsontable/src`), add:

```scss
.wtSelectionHandle {
  box-sizing: border-box;
  width: var(--ht-cell-selection-handle-size);
  height: var(--ht-cell-selection-handle-size);
  background: var(--ht-cell-selection-handle-background-color);
  border: var(--ht-cell-selection-handle-border-width) solid var(--ht-cell-selection-handle-border-color);
  border-radius: var(--ht-cell-selection-handle-border-radius);
  z-index: 200;
}

.wtSelectionHandle--top,
.wtSelectionHandle--bottom {
  cursor: ns-resize;
}

.wtSelectionHandle--start,
.wtSelectionHandle--end {
  cursor: ew-resize;
}
```

(Use the exact CSS-variable prefix the repo uses — confirm via the autofill token usage. No `:has()`.)

- [ ] **Step 4: Regenerate + build**

Run: `npm --prefix handsontable run generate:themes && npm --prefix handsontable run build`
Expected: no errors; generated CSS contains the new variables.

- [ ] **Step 5: Run stylelint**

Run: `npm --prefix handsontable run stylelint`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add handsontable/scripts/themes/ handsontable/src/themes/ handsontable/src/**/*.scss
git commit -m "feat(themes): add cell-selection-handle-* tokens and handle styles"
```

---

## Task 7: Wire `adjustHandlesVisible` through the highlight

The area border's `adjustHandlesVisible` must resolve to `true` only for the range currently hovered while `selectionHandles` is on. This mirrors how `cornerVisible` flows from the highlight factory.

**Files:**
- Modify: `handsontable/src/selection/highlight/types/areaLayered.ts`
- Modify: `handsontable/src/selection/highlight/highlight.ts` (pass a factory)
- Modify: `handsontable/src/selection/selection.ts` (own the hovered-layer state, provide the factory)
- Test: E2E in Task 9 (this is integration glue; verified end-to-end)

- [ ] **Step 1: Extend the area highlight factory**

In `areaLayered.ts`, thread a new param:

```ts
export function createHighlight({ areaCornerVisible, adjustHandlesVisible, ...restOptions }: Record<string, unknown>) {
  return new VisualSelection({
    className: 'area',
    createLayers: true,
    border: {
      width: 1,
      color: '#4b89ff',
      cornerVisible: areaCornerVisible,
      adjustHandlesVisible,
    },
    ...restOptions,
    selectionType: HIGHLIGHT_AREA_TYPE,
  });
}
```

- [ ] **Step 2: Pass the factory from `highlight.ts`**

Find where `highlight.ts` calls `createHighlight` for areas and where `areaCornerVisible` is supplied (grep `areaCornerVisible` in `handsontable/src/selection/highlight/highlight.ts`). Add an `adjustHandlesVisible` function that closes over a getter on the Selection instance, e.g.:

```ts
adjustHandlesVisible: (layerLevel) => this.options.adjustHandlesVisible?.(layerLevel) ?? false,
```

Follow the exact wiring style already used for `areaCornerVisible` in that file.

- [ ] **Step 3: Provide the getter from `selection.ts`**

In `selection.ts`, add a private hovered-layer field and a method the highlight closure calls:

```ts
  /**
   * Visual layer index of the range currently hovered while `selectionHandles` is on, or `null`.
   *
   * @type {number | null}
   */
  #handlesHoveredLayer = null;

  /**
   * Tells whether the adjustment handles should render for the given highlight layer.
   *
   * @param {number} layerLevel The area highlight layer level.
   * @returns {boolean}
   */
  isAdjustHandlesVisibleFor(layerLevel) {
    return this.settings.selectionHandles === true &&
      this.settings.selectionMode !== 'single' &&
      this.#handlesHoveredLayer === layerLevel;
  }
```

Wire `isAdjustHandlesVisibleFor` into the highlight options where `areaCornerVisible` is provided (mirror the same construction site).

- [ ] **Step 4: Add a setter for the hovered layer**

```ts
  /**
   * Sets which selection layer currently shows adjustment handles and refreshes the borders.
   *
   * @param {number | null} layer The hovered layer level, or `null` to hide all handles.
   */
  setHandlesHoveredLayer(layer) {
    if (this.#handlesHoveredLayer === layer) {
      return;
    }

    this.#handlesHoveredLayer = layer;
    this.refresh();
  }
```

- [ ] **Step 5: Build + smoke check with a demo page**

Run: `npm --prefix handsontable run build`
Then use the `handsontable-demo-page` skill to create a page with `selectionHandles: true`, select a range, and confirm (temporarily forcing `#handlesHoveredLayer = 0`) that pills render. Revert the force.

- [ ] **Step 6: Commit**

```bash
git add handsontable/src/selection/
git commit -m "feat(selection): route adjustHandlesVisible through the area highlight"
```

---

## Task 8: Hover detection (show handles for the hovered range)

**Files:**
- Modify: `handsontable/src/tableView.ts` (existing `beforeOnCellMouseOver` path, ~L1049-1088)
- Modify: `handsontable/src/selection/selection.ts` (helper to find the layer under a coord)
- Test: E2E in Task 9

- [ ] **Step 1: Add a layer-lookup helper in `selection.ts`**

```ts
  /**
   * Returns the visual layer index of the selected range containing the given coords, or `null`.
   *
   * @param {CellCoords} coords The visual cell coordinates to test.
   * @returns {number | null}
   */
  getLayerContaining(coords) {
    const ranges = this.selectedRange;
    let found = null;

    ranges.ranges.forEach((range, layer) => {
      if (range.includes(coords)) {
        found = layer;
      }
    });

    return found;
  }
```

(Confirm the real API for iterating layers on `SelectionRange` — grep `class SelectionRange` in `handsontable/src/selection/range.ts` and use its actual iterator/`peekByIndex`/`size` methods rather than `.ranges` if that field is not public.)

- [ ] **Step 2: Wire hover in `tableView.ts`**

In the `beforeOnCellMouseOver`/`onCellMouseOver` area (~L1060), when not dragging, when `selectionHandles` is enabled, and the mouse button is up:

```ts
if (this.instance.getSettings().selectionHandles && !isMouseDown) {
  const layer = this.instance.selection.getLayerContaining(visualCoords);

  this.instance.selection.setHandlesHoveredLayer(layer);
}
```

Also clear on mouse leaving the table body (hook into the existing `mouseout`/root leave wiring, or the `afterOnCellMouseOut` hook): `this.instance.selection.setHandlesHoveredLayer(null)`.

- [ ] **Step 3: Build**

Run: `npm --prefix handsontable run build`
Expected: success.

- [ ] **Step 4: Commit**

```bash
git add handsontable/src/tableView.ts handsontable/src/selection/selection.ts
git commit -m "feat(selection): show adjust-handles for the hovered range"
```

---

## Task 9: Drag interaction + enable/disable rules (E2E)

**Files:**
- Modify: `handsontable/src/3rdparty/walkontable/src/selection/border/border.ts` (fire mousedown on handles)
- Modify: `handsontable/src/tableView.ts` (bridge handle-mousedown → hook → drag loop)
- Modify: `handsontable/src/selection/selection.ts` (drag state + `clampEdge` from `handleAdjust.ts`)
- Test: `handsontable/test/e2e/selection/selectionHandles.spec.js`

- [ ] **Step 1: Fire a mousedown signal from the handle elements**

In `border.ts` `registerListeners()`, attach a listener to each adjust handle that raises the event through the existing Walkontable event pathway (mirror how the fill corner surfaces `afterOnCellCornerMouseDown`; grep `afterOnCellCornerMouseDown` to find the emit site). Emit the pressed edge (`'top'|'bottom'|'start'|'end'`). Do NOT import core hooks here — surface via a Walkontable setting callback (e.g. `this.wot.getSetting('onSelectionHandleMouseDown', event, edge)`), added to the Walkontable settings the same way `onCellCornerMouseDown` is.

- [ ] **Step 2: Bridge in `tableView.ts`**

Register the `onSelectionHandleMouseDown` Walkontable setting to run the `afterOnSelectionHandleMouseDown` core hook and start the drag: record `#adjustDrag = { edge, anchor }` where `anchor` is the opposite corner of the current range.

- [ ] **Step 3: Drag loop (document listeners)**

Mirror autofill's document `mousemove`/`mouseup` registration (`handsontable/src/plugins/autofill/autofill.ts` ~L749). On `mousemove`, resolve the cell under the pointer, compute the new edge index, clamp with `clampEdge` from `handleAdjust.ts`, then:

```ts
// edge 'top'/'bottom' changes the row axis; 'start'/'end' the column axis.
// anchor is the opposite corner; newCorner combines the clamped axis with the anchor's other axis.
this.instance.selection.setRangeStart(anchorCoords, undefined, false, focusCoords);
this.instance.selection.setRangeEnd(newCoords);
```

Expand to merged areas by relying on the existing `mergeCells` selection-expansion hooks (no extra code — verify in the E2E test). On `mouseup`, clear `#adjustDrag` and remove the document listeners.

- [ ] **Step 4: Add the full-row/column/select-all guard**

In `selection.ts`, extend `isAdjustHandlesVisibleFor` (or the hover setter) to return `false` when the hovered range is a full column, full row, or select-all. Use the existing selection predicates (grep `isSelectedByColumnHeader`, `isSelectedByRowHeader`, `isSelectedAll`/`isEntireColumnSelected` on the Selection class) rather than inventing new ones.

- [ ] **Step 5: Write the E2E tests**

`handsontable/test/e2e/selection/selectionHandles.spec.js` (standard boilerplate; all `it` async; await API):

```js
describe('selectionHandles', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('does not render handles by default', async() => {
    handsontable({ data: createSpreadsheetData(10, 10) });
    await selectCells([[2, 2, 5, 5]]);

    expect(spec().$container[0].querySelectorAll('.wtSelectionHandle[style*="display: block"]').length).toBe(0);
  });

  it('renders four handles on hover when enabled (interior selection)', async() => {
    handsontable({ data: createSpreadsheetData(10, 10), selectionHandles: true });
    await selectCells([[2, 2, 5, 5]]);
    await mouseOver(getCell(3, 3));

    const visible = spec().$container[0]
      .querySelectorAll('.wtSelectionHandle[style*="display: block"]');

    expect(visible.length).toBe(4);
  });

  it('hides the top handle when the selection touches row 0', async() => {
    handsontable({ data: createSpreadsheetData(10, 10), selectionHandles: true });
    await selectCells([[0, 2, 4, 5]]);
    await mouseOver(getCell(2, 3));

    expect(spec().$container[0].querySelector('.wtSelectionHandle--top').style.display).toBe('none');
  });

  it('resizes the selection when dragging the bottom handle down', async() => {
    handsontable({ data: createSpreadsheetData(10, 10), selectionHandles: true });
    await selectCells([[2, 2, 4, 4]]);
    await mouseOver(getCell(3, 3));

    const handle = spec().$container[0].querySelector('.wtSelectionHandle--bottom');

    await simulateMouseDown(handle); // helper: mousedown on element
    await mouseMove(getCell(7, 4));  // drag pointer down
    await mouseUp(getCell(7, 4));

    expect(getSelected()).toEqual([[2, 2, 7, 4]]);
  });

  it('clamps the dragged edge (no flip) at minimum one row', async() => {
    handsontable({ data: createSpreadsheetData(10, 10), selectionHandles: true });
    await selectCells([[2, 2, 5, 5]]);
    await mouseOver(getCell(3, 3));

    const handle = spec().$container[0].querySelector('.wtSelectionHandle--top');

    await simulateMouseDown(handle);
    await mouseMove(getCell(9, 3)); // drag top edge far below bottom edge
    await mouseUp(getCell(9, 3));

    // bottom edge is row 5, so top clamps to row 5 → single-row selection
    expect(getSelected()).toEqual([[5, 2, 5, 5]]);
  });

  it('does not render handles when selectionMode is "single"', async() => {
    handsontable({ data: createSpreadsheetData(10, 10), selectionHandles: true, selectionMode: 'single' });
    await selectCell(3, 3);
    await mouseOver(getCell(3, 3));

    expect(spec().$container[0].querySelectorAll('.wtSelectionHandle[style*="display: block"]').length).toBe(0);
  });

  it('does not render handles for full-column selections', async() => {
    handsontable({ data: createSpreadsheetData(10, 10), selectionHandles: true, colHeaders: true, rowHeaders: true });
    await selectColumns(2, 4);
    await mouseOver(getCell(3, 3));

    expect(spec().$container[0].querySelectorAll('.wtSelectionHandle[style*="display: block"]').length).toBe(0);
  });

  it('keeps merged cells whole when a dragged edge lands inside a merge', async() => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      selectionHandles: true,
      mergeCells: [{ row: 5, col: 2, rowspan: 2, colspan: 2 }],
    });
    await selectCells([[2, 2, 4, 3]]);
    await mouseOver(getCell(3, 3));

    const handle = spec().$container[0].querySelector('.wtSelectionHandle--bottom');

    await simulateMouseDown(handle);
    await mouseMove(getCell(5, 3)); // into the merged area's first row
    await mouseUp(getCell(5, 3));

    // selection expands to include the whole merged block (through row 6)
    expect(getSelected()).toEqual([[2, 2, 6, 3]]);
  });
});
```

Confirm exact helper names for mouse simulation in `handsontable/test/e2e/` (grep for `mouseOver`, `mouseDown`, `simulateMouseDown` in existing specs) and use the real ones.

- [ ] **Step 6: Run and iterate until green**

Run: `npm --prefix handsontable run build && npm --prefix handsontable run test:e2e -- --testPathPattern=selectionHandles`
Expected: all specs PASS, no console exceptions.

- [ ] **Step 7: Run the Walkontable + unit suites for regressions**

Run: `npm --prefix handsontable run test:unit -- --testPathPattern="selection|handleAdjust|metaSchema|hooks"`
Run: `npm --prefix handsontable run test:walkontable -- --testPathPattern="border|handles|corner"`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add handsontable/src handsontable/test
git commit -m "feat(selection): drag-to-resize selection handles with clamp and enable rules"
```

---

## Task 10: Visual regression example

**Files:**
- Create: example under `examples/next/docs/` (see `creating-visual-test-examples` + `visual-testing` skills)
- Create: Playwright spec under `visual-tests/`

- [ ] **Step 1: Read the skills**

Invoke `creating-visual-test-examples` and `visual-testing` and follow their structure exactly.

- [ ] **Step 2: Create the example**

A Vite example rendering a grid with `selectionHandles: true`, a pre-selected interior range, and (for the screenshot) handles forced visible.

- [ ] **Step 3: Add the Playwright screenshot test**

Capture the selection with all four pills. Register per the visual-tests conventions.

- [ ] **Step 4: Commit**

```bash
git add examples/next/docs/ visual-tests/
git commit -m "test(visual): add selection-handles visual regression example"
```

---

## Task 11: Documentation + changelog

**Files:**
- Modify: `docs/content/guides/cell-features/selection/selection.md`
- Modify: JSDoc already added in Tasks 1-2 (verify it renders)
- Create: `.changelogs/<id>.json`

- [ ] **Step 1: Guide section**

Invoke `writing-docs-pages`. Add a "Selection handles" section to the selection guide: what it does, that it is off by default and desktop-only, the `selectionMode: 'single'` and boundary/frozen limitations, and a runnable demo (`selectionHandles: true`). American English, short active sentences, "you" not "we", no evaluative adjectives.

- [ ] **Step 2: Changelog entry**

Invoke `changelog-creation` and create an `added` entry: title e.g. "Added the `selectionHandles` option for draggable selection-edge resizing." Include the issue/PR reference.

- [ ] **Step 3: Update AGENTS.md if warranted**

If the `adjustHandles` (Border, desktop) vs `selectionHandles` (mobile touch) naming distinction is a gotcha future agents will hit, add a one-line note to `handsontable/src/3rdparty/walkontable/AGENTS.md`.

- [ ] **Step 4: Commit**

```bash
git add docs/ .changelogs/ handsontable/src/3rdparty/walkontable/AGENTS.md
git commit -m "docs(selection): document selectionHandles option + changelog"
```

---

## Task 12: Final verification

- [ ] **Step 1: Full lint**

Run: `npm --prefix handsontable run eslint && npm --prefix handsontable run stylelint`
Expected: PASS (fix any JSDoc / geometry-read / complexity violations).

- [ ] **Step 2: Full type check**

Run: `npm --prefix handsontable run test:types`
Expected: PASS.

- [ ] **Step 3: Targeted test sweep**

Run: `npm --prefix handsontable run build`
Run: `npm --prefix handsontable run test:unit -- --testPathPattern="selection|handleAdjust|metaSchema|hooks"`
Run: `npm --prefix handsontable run test:e2e -- --testPathPattern=selectionHandles`
Run: `npm --prefix handsontable run test:walkontable -- --testPathPattern="border|handles"`
Expected: all PASS, no console exceptions.

- [ ] **Step 4: Both build variants**

Confirm `handsontable.js` and `handsontable.full.js` both build (they do via `npm run build`). Sanity-check a demo page against each if build-time behavior is in doubt.

- [ ] **Step 5: Verification-before-completion**

Invoke `superpowers:verification-before-completion` and confirm every claim with command output before declaring done. Then use `pr-creation` to open the PR.
