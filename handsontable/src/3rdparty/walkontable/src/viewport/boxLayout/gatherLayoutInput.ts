/**
 * The input-gathering seam for layout resolution — the ONLY file in the layout slice that touches the
 * live DOM (through the geometry-read port) and the settings. It reads the current geometry into a
 * plain `LayoutInput`; the pure solver in `resolveLayout` takes it from there.
 *
 * Following the composition-root convention, `createLayoutDeps(ctx)` picks the narrow set of
 * dependencies this slice needs out of the `EngineContext`; its inferred `ReturnType` is the deps
 * type. `gatherLayoutInput(deps)` is the read step.
 *
 * NOTE: this module is not wired into the draw yet. It exists so the pure solver has a real,
 * reviewable source of inputs. The exact derivation of the workspace box (client box vs offset box
 * minus borders) is refined when the snapshot is wired into the viewport in a later stage; the
 * scrollbar math it feeds is already final and unit-tested.
 */
import type { EngineContext } from '../../wire';
import type { LayoutInput, OverflowMode } from './layoutSnapshot';
import { measureWorkspaceWidth, measureWorkspaceHeight } from '../workspaceSize';

/**
 * Narrows the engine context to the dependencies the layout slice reads.
 *
 * @param {EngineContext} ctx The engine composition context.
 * @returns {object} The layout dependency set.
 */
export function createLayoutDeps(ctx: EngineContext) {
  return {
    geometryReader: ctx.geometryReader,
    wtSettings: ctx.wtSettings,
    rootDocument: ctx.rootDocument,
    rootWindow: ctx.rootWindow,
    getWtTable: ctx.getWtTable,
    getWtViewport: ctx.getWtViewport,
    getTopOverlay: ctx.getTopOverlay,
    getInlineStartOverlay: ctx.getInlineStartOverlay,
  };
}

export type LayoutDeps = ReturnType<typeof createLayoutDeps>;

/**
 * Maps a raw CSS `overflow` string to the narrowed `OverflowMode`. Anything that is not `scroll` or
 * `hidden` (including `visible`, `auto`, and unset) resolves to `'auto'` — "scrollbar only on
 * overflow" — which is the engine's default behavior.
 *
 * @param {string | undefined} value The raw computed `overflow-x`/`overflow-y` value.
 * @returns {OverflowMode}
 */
function toOverflowMode(value: string | undefined): OverflowMode {
  if (value === 'scroll') {
    return 'scroll';
  }

  if (value === 'hidden') {
    return 'hidden';
  }

  return 'auto';
}

/**
 * Reads the current geometry and settings into a pure `LayoutInput`.
 *
 * @param {LayoutDeps} deps The layout dependency set.
 * @returns {LayoutInput}
 */
export function gatherLayoutInput(deps: LayoutDeps): LayoutInput {
  const { geometryReader, wtSettings, rootDocument, rootWindow } = deps;
  const viewport = deps.getWtViewport();
  const wtTable = deps.getWtTable();
  const trimmingContainer = deps.getTopOverlay().trimmingContainer;
  const isWindow = trimmingContainer === rootWindow;
  const isRtl = wtSettings.getSetting<boolean>('rtlMode');
  const scrollbarSize = geometryReader.getScrollbarWidth(rootDocument);

  // The prefix-sum caches are the source of the content totals below. Build them here so a lazy
  // `getLayout()` after a cache invalidation (which also drops the snapshot, see
  // `Viewport#invalidateRowHeightCache`) recomputes correct totals instead of reading
  // `getTotalSize()` as 0. `ensureBuilt()` is a no-op when already built, so the in-draw resolve
  // (where the draw has already built the caches) is unaffected.
  viewport.rowHeightCache.ensureBuilt();
  viewport.columnWidthCache.ensureBuilt();

  const rowHeaderWidth = viewport.getRowHeaderWidth();
  const columnHeaderHeight = viewport.getColumnHeaderHeight();
  // Match the hider extent the engine actually renders into: the internal row-height calculator
  // carries a known 1px miscalculation that `Overlays#adjustElementsSize` compensates for by adding
  // 1px to the hider height (and does not when AutoRowSize supplies exact heights — the
  // `externalRowCalculator` case). Fold the same compensation into the total so the predicted
  // vertical-scroll boundary matches today's post-render measurement exactly.
  const hiderHeightCompensation = wtSettings.getSetting<boolean>('externalRowCalculator') ? 0 : 1;
  const totalContentWidth = rowHeaderWidth + viewport.columnWidthCache.getTotalSize();
  const totalContentHeight = columnHeaderHeight + viewport.rowHeightCache.getTotalSize() +
    hiderHeightCompensation;

  // The element whose overflow decides the scrollbars is the one that actually scrolls: the document
  // in window mode, the table `holder` in element mode. This is NOT the trimming container — a
  // trimming container with `overflow: hidden` still clips to its box while the inner holder shows
  // the scrollbar, which is why the engine's `hasVerticalScroll()` is content-vs-workspace and
  // overflow-agnostic on the container. Reading the holder keeps the prediction aligned with it.
  const overflowElement = isWindow ? rootDocument.documentElement : wtTable.holder;
  const overflowX = toOverflowMode(geometryReader.getStyle(overflowElement, 'overflow-x'));
  const overflowY = toOverflowMode(geometryReader.getStyle(overflowElement, 'overflow-y'));

  if (isWindow) {
    const documentElement = rootDocument.documentElement;

    return {
      scrollMode: 'window',
      workspaceWidth: geometryReader.clientWidth(documentElement),
      workspaceHeight: geometryReader.clientHeight(documentElement),
      totalContentWidth,
      totalContentHeight,
      scrollbarSize,
      overflowX,
      overflowY,
      rowHeaderWidth,
      columnHeaderHeight,
      isRtl,
      windowContext: {
        documentScrollWidth: geometryReader.scrollWidth(documentElement),
        documentScrollHeight: geometryReader.scrollHeight(documentElement),
        documentClientWidth: geometryReader.clientWidth(documentElement),
        documentClientHeight: geometryReader.clientHeight(documentElement),
        currentHiderWidth: geometryReader.offsetWidth(wtTable.hider),
        currentHiderHeight: geometryReader.offsetHeight(wtTable.hider),
      },
    };
  }

  return {
    scrollMode: 'element',
    // Source the workspace box from the RAW measure functions (not the public
    // `getWorkspaceWidth`/`getWorkspaceHeight`, which on the single-pass path return this very
    // snapshot — calling them here would recurse). The raw measures carry the exact legacy semantics,
    // notably the `#3119` zero-height→window fallback, so the snapshot stays behavior-identical.
    workspaceWidth: measureWorkspaceWidth(viewport),
    workspaceHeight: measureWorkspaceHeight(viewport),
    totalContentWidth,
    totalContentHeight,
    scrollbarSize,
    overflowX,
    overflowY,
    rowHeaderWidth,
    columnHeaderHeight,
    isRtl,
  };
}
