import type { CellProperties } from '../settings';
import type { BaseRenderer } from './baseRenderer';

/**
 * A renderer function that may carry a `valueFormatter` static. The built-in numeric and date
 * renderers do — they delegate rendering to `textRenderer` and expect the caller to format the
 * value upstream through that static.
 */
export type RendererWithValueFormatter = BaseRenderer & {
  valueFormatter?: (value: unknown, cellProperties: CellProperties) => unknown;
};

/**
 * Resolves the value a cell renders, following the formatter precedence shared by the render path
 * (`TableView.cellRenderer`) and the AutoRowSize/AutoColumnSize samplers: the cell-level
 * `valueFormatter` option wins; otherwise the renderer's own `valueFormatter` static applies;
 * otherwise the value passes through untouched.
 *
 * @param {*} value The raw cell value.
 * @param {object} cellProperties The cell meta object.
 * @param {Function} renderer The cell's renderer function.
 * @returns {*} The value the renderer should receive.
 */
export function formatCellValue(
  value: unknown, cellProperties: CellProperties, renderer: RendererWithValueFormatter
): unknown {
  if (typeof cellProperties.valueFormatter === 'function') {
    return cellProperties.valueFormatter(value, cellProperties);
  }

  if (typeof renderer === 'function' && typeof renderer.valueFormatter === 'function') {
    return renderer.valueFormatter.call(cellProperties, value, cellProperties);
  }

  return value;
}

/**
 * Renders one cell TD following the renderer contract shared by `TableView.cellRenderer` and
 * `GhostTable`: run the cell's renderer, run the base renderer when that renderer did not chain it
 * itself, then reset the chaining flag.
 *
 * The built-in renderers no longer call `baseRenderer` themselves — the caller does it, guarded by
 * the `_isBaseRendererCalled` flag the base renderer sets. The flag lives on the cell meta object,
 * which for a materialized cell is shared with the next draw, so it must always end up reset —
 * leaving it set would make the next draw skip the base renderer and drop its classes from the
 * real cell.
 *
 * @param {Function} renderer The cell's renderer function.
 * @param {Array} rendererArgs The argument tuple every renderer receives.
 */
export function renderCell(renderer: BaseRenderer, rendererArgs: Parameters<BaseRenderer>): void {
  const [hotInstance] = rendererArgs;
  const cellProperties = rendererArgs[6];

  try {
    renderer(...rendererArgs);

    if (!cellProperties._isBaseRendererCalled) {
      hotInstance.getCellRenderer({ renderer: 'base' })(...rendererArgs);
    }
  } finally {
    // Reset even when a renderer throws — a chained-then-thrown flag would survive on the shared
    // cell meta and make the next draw skip the base renderer.
    cellProperties._isBaseRendererCalled = false;
  }
}
