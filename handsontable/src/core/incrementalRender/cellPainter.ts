import type { BaseRenderer } from '../../renderers/baseRenderer';
import { formatCellValue, renderCell } from '../../renderers/renderCell';
import type { CellProperties } from '../../settings';
import type { HotInstance } from '../types';
import { isSameCellPaint, readCellPaintStamp, writeCellPaintStamp } from './cellPaintStamps';
import type { CellPaintStamp } from './cellPaintStamps';
import { getCellRenderVersion, RENDER_MODE_ON_CHANGE } from './renderChangeTracker';
import type { RenderChangeTracker } from './renderChangeTracker';

/**
 * Everything a cell paint needs, resolved once per cell per draw: the visual coordinates, the meta,
 * the value after the value hooks, the renderer, and the value the renderer receives.
 */
interface ResolvedCell {
  visualRow: number;
  visualColumn: number;
  cellProperties: CellProperties;
  prop: string;
  value: unknown;
  renderer: BaseRenderer;
  formattedValue: unknown;
}

/**
 * A resolution kept between `shouldPaint()` and the `paint()` that follows it for the same cell.
 */
interface PendingPaint {
  renderedRow: number;
  renderedColumn: number;
  resolved: ResolvedCell;
  stamp: CellPaintStamp | null;
}

/**
 * Translates a renderable (rendered DOM) index pair into visual indexes.
 */
type RenderableToVisual = (renderedRow: number, renderedColumn: number) => [number, number];

/**
 * Paints cells for the rendering engine, and decides per cell whether the paint is needed.
 *
 * The engine asks `shouldPaint()` before it resets a cell element and `paint()` right after. Both
 * need the same resolution (meta, value, renderer), so the first keeps it for the second and a
 * cell is resolved once per draw whichever way the decision goes. A cell whose `renderMode` is
 * `'always'` is always painted; a cell in `'onChange'` mode is painted only when its stamp – what
 * the element showed after its last paint – differs from what this draw would paint.
 */
export class CellPainter {
  /**
   * The Handsontable instance.
   */
  #hot: HotInstance;
  /**
   * The tracker holding the render epoch.
   */
  #tracker: RenderChangeTracker;
  /**
   * Translates renderable indexes into visual ones.
   */
  #toVisual: RenderableToVisual;
  /**
   * The resolution of the cell `shouldPaint()` last examined.
   */
  #pending: PendingPaint | null = null;

  /**
   * Creates a painter for one Handsontable instance.
   *
   * @param {HotInstance} hot The Handsontable instance.
   * @param {RenderChangeTracker} tracker The instance's render tracker.
   * @param {Function} toVisual Translates renderable indexes into visual ones.
   */
  constructor(hot: HotInstance, tracker: RenderChangeTracker, toVisual: RenderableToVisual) {
    this.#hot = hot;
    this.#tracker = tracker;
    this.#toVisual = toVisual;
  }

  /**
   * Tells the engine whether the cell element has to be reset and painted on this draw.
   *
   * @param {number} renderedRow The renderable row index.
   * @param {number} renderedColumn The renderable column index.
   * @param {HTMLTableCellElement} TD The cell element that holds the cell on this draw.
   * @param {string} band The identity of the rendered band the element belongs to.
   * @returns {boolean}
   */
  shouldPaint(renderedRow: number, renderedColumn: number, TD: HTMLTableCellElement, band: string): boolean {
    const resolved = this.#resolve(renderedRow, renderedColumn);
    const pending: PendingPaint = { renderedRow, renderedColumn, resolved, stamp: null };

    if (resolved.cellProperties.renderMode !== RENDER_MODE_ON_CHANGE) {
      this.#pending = pending;

      return true;
    }

    pending.stamp = {
      renderedRow,
      renderedColumn,
      visualRow: resolved.visualRow,
      visualColumn: resolved.visualColumn,
      band,
      epoch: this.#tracker.epoch,
      version: getCellRenderVersion(resolved.cellProperties),
      value: resolved.formattedValue,
      renderer: resolved.renderer,
    };

    const paintNeeded = !isSameCellPaint(readCellPaintStamp(TD), pending.stamp);

    // A skipped cell leaves nothing behind: a later `paint()` for the same coordinates that comes
    // without its own `shouldPaint()` (validation paints a cell directly) resolves the cell afresh.
    this.#pending = paintNeeded ? pending : null;

    return paintNeeded;
  }

  /**
   * Paints the cell into the element: runs the renderer hooks and the renderer, then records the
   * stamp when the cell is in `'onChange'` mode.
   *
   * @param {number} renderedRow The renderable row index.
   * @param {number} renderedColumn The renderable column index.
   * @param {HTMLTableCellElement} TD The cell element to paint into.
   */
  paint(renderedRow: number, renderedColumn: number, TD: HTMLTableCellElement): void {
    const pending = this.#takePending(renderedRow, renderedColumn);
    const { visualRow, visualColumn, cellProperties, prop, value, renderer, formattedValue } =
      pending?.resolved ?? this.#resolve(renderedRow, renderedColumn);

    this.#hot.runHooks('beforeRenderer', TD, visualRow, visualColumn, prop, value, cellProperties);

    renderCell(renderer, [this.#hot, TD, visualRow, visualColumn, prop, formattedValue, cellProperties]);

    this.#hot.runHooks('afterRenderer', TD, visualRow, visualColumn, prop, value, cellProperties);

    if (pending?.stamp) {
      writeCellPaintStamp(TD, pending.stamp);
    }
  }

  /**
   * Returns the resolution `shouldPaint()` kept for this cell, if it is the same cell, and clears it.
   *
   * @param {number} renderedRow The renderable row index.
   * @param {number} renderedColumn The renderable column index.
   * @returns {PendingPaint|null}
   */
  #takePending(renderedRow: number, renderedColumn: number): PendingPaint | null {
    const pending = this.#pending;

    this.#pending = null;

    if (pending === null || pending.renderedRow !== renderedRow || pending.renderedColumn !== renderedColumn) {
      return null;
    }

    return pending;
  }

  /**
   * Resolves the inputs of a cell paint: the meta (through `modifyGetCellCoords`, which MergeCells
   * uses to point a covered cell at its origin), the value (through `beforeValueRender`), the
   * renderer, and the formatted value.
   *
   * @param {number} renderedRow The renderable row index.
   * @param {number} renderedColumn The renderable column index.
   * @returns {ResolvedCell}
   */
  #resolve(renderedRow: number, renderedColumn: number): ResolvedCell {
    const hot = this.#hot;
    const [visualRow, visualColumn] = this.#toVisual(renderedRow, renderedColumn);
    const modifiedCellCoords = hot.runHooks('modifyGetCellCoords', visualRow, visualColumn, false, 'meta');
    let visualRowToCheck = visualRow;
    let visualColumnToCheck = visualColumn;

    if (Array.isArray(modifiedCellCoords)) {
      [visualRowToCheck, visualColumnToCheck] = modifiedCellCoords as [number, number];
    }

    const cellProperties = hot.getCellMeta<CellProperties>(visualRowToCheck, visualColumnToCheck);
    const prop = hot.colToProp(visualColumnToCheck) as string;
    let value = hot.getDataAtRowProp(visualRowToCheck, prop);

    if (hot.hasHook('beforeValueRender')) {
      value = hot.runHooks('beforeValueRender', value, cellProperties);
    }

    const renderer = hot.getCellRenderer(cellProperties) as BaseRenderer;
    const formattedValue = formatCellValue(value, cellProperties, renderer);

    return { visualRow, visualColumn, cellProperties, prop, value, renderer, formattedValue };
  }
}
