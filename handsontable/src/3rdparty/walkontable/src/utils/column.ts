import type { TableDeps } from '../table';
import type { ColumnSizeSource } from '../axisSizing/axisSizeSource';
/**
 * Column utils class contains all necessary information about sizes of the columns.
 *
 * @class {ColumnUtils}
 */
export default class ColumnUtils {
  /**
   * The table module dependencies.
   *
   * @type {TableDeps}
   */
  #deps: TableDeps;
  /**
   * The column-width source — supplies the provided width and the default width.
   *
   * @type {ColumnSizeSource}
   */
  #columnSizeSource: ColumnSizeSource;
  /**
   * @type {Settings}
   */
  wtSettings;
  /**
   * @type {Map<number, number>}
   */
  headerWidths = new Map<number, number>();

  /**
   * Read-only access to the dependencies, for the renderer, which reads `columnUtils.deps`
   * externally and so cannot reach the private `#deps`.
   *
   * @returns {TableDeps}
   */
  get deps(): TableDeps {
    return this.#deps;
  }

  /**
   * @param {TableDeps} deps The table module dependencies.
   */
  constructor(deps: TableDeps) {
    this.#deps = deps;
    this.#columnSizeSource = deps.columnSizeSource;
    this.wtSettings = deps.wtSettings;
  }

  /**
   * Returns column width based on passed source index.
   *
   * @param {number} sourceIndex Column source index.
   * @returns {number}
   */
  getWidth(sourceIndex: number): number | undefined {
    // Preserve the `||` (not `??`) fallback: a provided width of `0` intentionally falls through to
    // the default.
    return this.#columnSizeSource.getSize(sourceIndex) || this.#columnSizeSource.getDefaultSize();
  }

  /**
   * Returns column header height based on passed header level.
   *
   * @param {number} level Column header level.
   * @returns {number}
   */
  getHeaderHeight(level: number) {
    const height = this.wtSettings.getSetting('stylesHandler').getDefaultRowHeight();
    // The provided header height arrives through the `columnHeaderHeight` setting funnel: the
    // `columnHeaderHeight` option, the `modifyColumnHeaderHeight` hook (AutoRowSize feeds it), and -
    // for content-driven headers with no plugin - the render-size probe, all merged per level by the
    // Handsontable-side callback. Content taller than this is not measured here; the header cell is
    // min-height, so it expands on its own and the probe records the result for the next draw.
    const setting = this.wtSettings.getSetting<number | number[] | undefined>('columnHeaderHeight');
    const providedHeight = Array.isArray(setting) ? setting[level] : setting;

    if (providedHeight !== undefined && providedHeight !== null) {
      return height ? Math.max(height, providedHeight) : providedHeight;
    }

    return height;
  }

  /**
   * Returns column header width based on passed source index.
   *
   * @param {number} sourceIndex Column source index.
   * @returns {number}
   */
  getHeaderWidth(sourceIndex: number) {
    const { columnFilter } = this.#deps.getWtTable();

    if (!columnFilter) {
      return undefined;
    }

    return this.headerWidths.get(columnFilter.sourceToRendered(sourceIndex));
  }

  /**
   * Calculates column header widths that can be retrieved from the cache.
   */
  calculateWidths() {
    const { wtSettings } = this;
    let rowHeaderWidthSetting = wtSettings.getSetting('rowHeaderWidth');

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    rowHeaderWidthSetting = wtSettings.getSetting('onModifyRowHeaderWidth', rowHeaderWidthSetting);

    if (rowHeaderWidthSetting !== null && rowHeaderWidthSetting !== undefined) {
      const rowHeadersCount = wtSettings.getSetting<Function[]>('rowHeaders').length;
      const defaultColumnWidth = wtSettings.getSetting('defaultColumnWidth');

      for (let visibleColumnIndex = 0; visibleColumnIndex < rowHeadersCount; visibleColumnIndex++) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        let width = Array.isArray(rowHeaderWidthSetting)
          ? rowHeaderWidthSetting[visibleColumnIndex] : rowHeaderWidthSetting;

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        width = (width === null || width === undefined) ? defaultColumnWidth : width;

        this.headerWidths.set(visibleColumnIndex, width);
      }
    }
  }
}
