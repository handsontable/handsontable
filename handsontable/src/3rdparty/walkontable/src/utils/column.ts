import type { TableDeps } from '../table';
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
    this.wtSettings = deps.wtSettings;
  }

  /**
   * Returns column width based on passed source index.
   *
   * @param {number} sourceIndex Column source index.
   * @returns {number}
   */
  getWidth(sourceIndex: number): number | undefined {
    const width = this.wtSettings.getSetting<number | undefined>('columnWidth', sourceIndex)
      || this.wtSettings.getSetting<number | undefined>('defaultColumnWidth');

    return width;
  }

  /**
   * Returns column header height based on passed header level.
   *
   * @param {number} level Column header level.
   * @returns {number}
   */
  getHeaderHeight(level: number) {
    let height = this.wtSettings.getSetting('stylesHandler').getDefaultRowHeight();
    const oversizedHeight = this.#deps.getWtViewport().oversizedColumnHeaders[level];

    if (oversizedHeight !== undefined) {
      height = height ? Math.max(height, oversizedHeight) : oversizedHeight;
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
