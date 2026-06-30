import type { PositionCache } from '../utils/positionCache';
import type { ViewportBaseCalculator } from './viewportBase';

export interface AxisCalculatorContext extends ViewportBaseCalculator {
  needReverse: boolean;
  lastProcessedIndex: number;
}

export interface AxisCalculationParams<T extends AxisCalculatorContext = AxisCalculatorContext> {
  totalCount: number;
  zeroBasedScrollOffset: number;
  scrollEnd: number;
  positionCache: PositionCache;
  setSizeField: (ctx: T, size: number) => void;
  setTotalCalculated: (ctx: T, value: number) => void;
  getTotalCalculated: (ctx: T) => number;
}

/**
 * Shared axis calculation used by both row and column viewport calculators.
 *
 * Iterates through items (rows or columns) starting from the cache-derived
 * skip position, fills `startPositions`, and delegates to the calculation
 * types via the `_process` / `_initialize` / `_finalize` callbacks on the
 * provided context.
 *
 * @param {object} context The viewport calculator instance (rows or columns).
 * @param {object} params Parameters that differ between the row and column axes.
 * @param {number} params.totalCount Total number of items.
 * @param {number} params.zeroBasedScrollOffset Clamped scroll offset (>= 0).
 * @param {number} params.scrollEnd Pixel threshold at which iteration stops
 *   (rows: `innerViewportHeight`, columns: `zeroBasedScrollOffset + viewportWidth`).
 * @param {PositionCache} params.positionCache Built prefix sum cache.
 * @param {Function} params.setSizeField Callback `(ctx, size) => {}` that writes the
 *   per-item size onto the context (e.g. `ctx.rowHeight = size`).
 * @param {Function} params.setTotalCalculated Callback `(ctx, value) => {}` that writes
 *   the running cumulative total onto the context.
 * @param {Function} params.getTotalCalculated Callback `(ctx) => number` that reads the
 *   running cumulative total from the context.
 */
export function calculateAxis<T extends AxisCalculatorContext>(context: T, {
  totalCount,
  zeroBasedScrollOffset,
  scrollEnd,
  positionCache,
  setSizeField,
  setTotalCalculated,
  getTotalCalculated,
}: AxisCalculationParams<T>): void {
  context._initialize(context);

  let startIndex = 0;

  if (zeroBasedScrollOffset > 0 && totalCount > 0) {
    const cachedIndex = positionCache.findIndexAtOffset(zeroBasedScrollOffset);

    startIndex = cachedIndex;
    setTotalCalculated(context, positionCache.getOffset(startIndex));
  }

  let lastProcessedIndex = -1;

  for (let i = startIndex; i < totalCount; i++) {
    const size = positionCache.getSizeAt(i);

    setSizeField(context, size);
    context._process(i, context);

    lastProcessedIndex = i;
    setTotalCalculated(context, getTotalCalculated(context) + size);

    if (getTotalCalculated(context) >= scrollEnd) {
      context.needReverse = false;
      break;
    }
  }

  context.lastProcessedIndex = lastProcessedIndex;
  context._finalize(context);
}
