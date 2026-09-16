import type { RowHeadersRenderer } from './rowHeaders';
import type { ColumnHeaderRowsRenderer } from './columnHeaderRows';
import type { ColumnHeadersRenderer } from './columnHeaders';
import type { ColGroupRenderer } from './colGroup';
import type { RowsRenderer } from './rows';
import type { CellsRenderer } from './cells';
import type RowFilter from '../filter/row';
import type ColumnFilter from '../filter/column';
import type RowUtils from '../axisSizing/rowUtils';
import type ColumnUtils from '../axisSizing/columnUtils';
import type { StylesHandler } from '../types';
import { applyRowHeight } from './exactRowHeight';

/**
 * Asked for every cell in the rendered band before the cell element is reset and painted.
 * Answering `false` leaves the element exactly as the previous draw left it.
 */
export type ShouldPaintCell = (
  sourceRow: number, sourceColumn: number, TD: HTMLTableCellElement, band: string
) => boolean;

/**
 * TableRenderer class collects all renderers and properties necessary for table creation. It's
 * responsible for adjusting and rendering each renderer.
 *
 * Below is a diagram of the renderers together with an indication of what they are responisble for.
 *   <table>
 *     <colgroup>  \ (root node)
 *       <col>      \
 *       <col>       \___ ColGroupRenderer
 *       <col>       /
 *       <col>      /
 *     </colgroup> /
 *     <thead>     \ (root node)
 *       <tr>       --- ColumnHeaderRowsRenderer
 *         <th>      \
 *         <th>       \__ ColumnHeadersRenderer
 *         <th>       /
 *         <th>      /
 *       </tr>      /
 *     </thead>    /
 *     <tbody>   ¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯\ (root node)
 *       <tr>   (root node)          \
 *         <th>  --- RowHeadersRenderer
 *         <td>  \                     \
 *         <td>   -- CellsRenderer      \
 *         <td>  /                       \
 *       </tr>                            \
 *       <tr>   (root node)                \
 *         <th>  --- RowHeadersRenderer     \
 *         <td>  \                           \___ RowsRenderer
 *         <td>   -- CellsRenderer           /
 *         <td>  /                          /
 *       </tr>                             /
 *       <tr>   (root node)               /
 *         <th>  --- RowHeadersRenderer  /
 *         <td>  \                      /
 *         <td>   -- CellsRenderer     /
 *         <td>  /                    /
 *       </tr>                       /
 *     </tbody>  ___________________/
 *   </table>.
 *
 * @class {RowsRenderer}
 */
export class TableRenderer {
  /**
   * Table element which will be used to render the children element.
   *
   * @type {HTMLTableElement}
   */
  declare rootNode: HTMLTableElement;
  /**
   * Document owner of the root node.
   *
   * @type {HTMLDocument}
   */
  declare rootDocument: Document;
  /**
   * Renderer class responsible for rendering row headers.
   *
   * @type {RowHeadersRenderer}
   */
  rowHeaders: RowHeadersRenderer | null = null;
  /**
   * Renderer class responsible for rendering column header rows (TR elements in THEAD).
   *
   * @type {ColumnHeaderRowsRenderer}
   */
  columnHeaderRows: ColumnHeaderRowsRenderer | null = null;
  /**
   * Renderer class responsible for rendering column headers (TH elements in TR).
   *
   * @type {ColumnHeadersRenderer}
   */
  columnHeaders: ColumnHeadersRenderer | null = null;
  /**
   * Renderer class responsible for rendering col in colgroup.
   *
   * @type {ColGroupRenderer}
   */
  colGroup: ColGroupRenderer | null = null;
  /**
   * Renderer class responsible for rendering rows in tbody.
   *
   * @type {RowsRenderer}
   */
  rows: RowsRenderer | null = null;
  /**
   * Renderer class responsible for rendering cells.
   *
   * @type {CellsRenderer}
   */
  cells: CellsRenderer | null = null;
  /**
   * Row filter which contains all necessary information about row index transformation.
   *
   * @type {RowFilter}
   */
  rowFilter: RowFilter | null = null;
  /**
   * Column filter which contains all necessary information about column index transformation.
   *
   * @type {ColumnFilter}
   */
  columnFilter: ColumnFilter | null = null;
  /**
   * Row utils class which contains all necessary information about sizes of the rows.
   *
   * @type {RowUtils}
   */
  rowUtils: RowUtils | null = null;
  /**
   * Column utils class which contains all necessary information about sizes of the columns.
   *
   * @type {ColumnUtils}
   */
  columnUtils: ColumnUtils | null = null;
  /**
   * Indicates how much rows should be rendered to fill whole table viewport.
   *
   * @type {number}
   */
  rowsToRender: number = 0;
  /**
   * Indicates how much columns should be rendered to fill whole table viewport.
   *
   * @type {number}
   */
  columnsToRender: number = 0;
  /**
   * The visible row index the cell and row-header renderers start painting from on this render.
   * The rows before it keep their TR children exactly as the previous render left them: no reset,
   * no `cellRenderer` call, no `shouldPaintCell` question, no header repaint. `0` paints the whole
   * band — the default, and the state after every `render()`. Set per render through
   * `setPaintWindow`; the row-band refill in `table/drawCycle.ts` is the one caller.
   *
   * @type {number}
   */
  paintFromRow: number = 0;
  /**
   * An array of functions to be used as a content factory to row headers.
   *
   * @type {Function[]}
   */
  rowHeaderFunctions: Function[] = [];
  /**
   * Count of the function used to render row headers.
   *
   * @type {number}
   */
  rowHeadersCount: number = 0;
  /**
   * An array of functions to be used as a content factory to column headers.
   *
   * @type {Function[]}
   */
  columnHeaderFunctions: Function[] = [];
  /**
   * Count of the function used to render column headers.
   *
   * @type {number}
   */
  columnHeadersCount: number = 0;
  /**
   * Cell renderer used to render cells content.
   *
   * @type {Function}
   */
  declare cellRenderer: Function;
  /**
   * Tells whether a cell element has to be reset and painted on this draw (see the
   * `shouldPaintCell` setting).
   *
   * @type {Function}
   */
  declare shouldPaintCell: ShouldPaintCell;
  /**
   * Holds the name of the currently active overlay.
   *
   * @type {'inline_start'|'top'|'top_inline_start_corner'|'bottom'|'bottom_inline_start_corner'|'master'}
   */
  declare activeOverlayName: string;
  /**
   * Styles handler instance.
   */
  declare stylesHandler: StylesHandler;
  /**
   * When `true`, the column-header pass (THEAD) may be skipped for this draw if the column render
   * window is unchanged. Set once per draw by the draw cycle; only a pure vertical scroll (no data,
   * settings, selection, or column-window change) enables it. Defaults to `false` so every non-scroll
   * draw renders the headers.
   *
   * @type {boolean}
   */
  #columnHeadersRenderSkippable: boolean = false;
  /**
   * `true` once the column-header pass has rendered at least once and stored its render window.
   *
   * @type {boolean}
   */
  #hasStoredColumnHeaderWindow: boolean = false;
  /**
   * The first rendered column (column filter offset) captured on the last column-header render.
   *
   * @type {number}
   */
  #prevColumnHeaderOffset: number = -1;
  /**
   * The number of rendered columns captured on the last column-header render.
   *
   * @type {number}
   */
  #prevColumnsToRender: number = -1;
  /**
   * The column headers count captured on the last column-header render.
   *
   * @type {number}
   */
  #prevColumnHeadersCount: number = -1;
  /**
   * The row headers count captured on the last column-header render.
   *
   * @type {number}
   */
  #prevRowHeadersCount: number = -1;
  /**
   * Creates a new TableRenderer instance.
   *
   * @param {HTMLTableElement} rootNode The HTML table element to use as the root node for rendering.
   * @param {object} options The configuration options.
   * @param {Function} [options.cellRenderer] The cell renderer function.
   * @param {Function} [options.shouldPaintCell] The per-cell paint gate.
   * @param {StylesHandler} [options.stylesHandler] The styles handler instance.
   */
  constructor(
    rootNode: HTMLTableElement,
    { cellRenderer, shouldPaintCell, stylesHandler }: {
      cellRenderer?: Function;
      shouldPaintCell?: ShouldPaintCell;
      stylesHandler?: StylesHandler;
    } = {}) {
    this.rootNode = rootNode;
    this.rootDocument = this.rootNode.ownerDocument;
    this.cellRenderer = cellRenderer!;
    this.shouldPaintCell = shouldPaintCell ?? (() => true);
    this.stylesHandler = stylesHandler!;
  }

  /**
   * Sets the overlay that is currently rendered. If `null` is provided, the master overlay is set.
   *
   * @param {'inline_start'|'top'|'top_inline_start_corner'|'bottom'|'bottom_inline_start_corner'|'master'} overlayName The overlay name.
   */
  setActiveOverlayName(overlayName: string) {
    this.activeOverlayName = overlayName;
  }

  /**
   * Set row and column util classes.
   *
   * @param {RowUtils} rowUtils RowUtils instance which provides useful methods related to row sizes.
   * @param {ColumnUtils} columnUtils ColumnUtils instance which provides useful methods related to row sizes.
   */
  setAxisUtils(rowUtils: RowUtils, columnUtils: ColumnUtils) {
    this.rowUtils = rowUtils;
    this.columnUtils = columnUtils;
  }

  /**
   * Sets viewport size of the table.
   *
   * @param {number} rowsCount An amount of rows to render.
   * @param {number} columnsCount An amount of columns to render.
   */
  setViewportSize(rowsCount: number, columnsCount: number) {
    this.rowsToRender = rowsCount;
    this.columnsToRender = columnsCount;
  }

  /**
   * Restricts the next `render()`'s cell and row-header repaint to the rows at and after
   * `fromVisibleRow`. The caller guarantees that every row before it holds the same source row, in
   * the same column band, as on the previous render: the TR nodes are reused in place, so a band
   * whose start row or column band moved re-identifies every element and must repaint everything.
   * The window applies to one render only; `render()` clears it.
   *
   * @param {number} fromVisibleRow The first visible row index to repaint; `0` repaints the whole band.
   * @returns {TableRenderer}
   */
  setPaintWindow(fromVisibleRow: number) {
    this.paintFromRow = Math.max(0, fromVisibleRow);

    return this;
  }

  /**
   * Marks this draw as one where the column-header (THEAD) pass may be skipped, provided the column
   * render window is unchanged since the last header render. The draw cycle sets this to `true` only
   * for a pure vertical scroll (nothing but the vertical scroll position changed), and to `false`
   * otherwise, so any data, settings, selection, or column-window change re-renders the headers.
   *
   * @param {boolean} skippable Whether the column-header pass may be skipped for this draw.
   */
  setColumnHeadersRenderSkippable(skippable: boolean) {
    this.#columnHeadersRenderSkippable = skippable;
  }

  /**
   * Sets row and column filter instances.
   *
   * @param {RowFilter} rowFilter Row filter instance which contains all necessary information about row index transformation.
   * @param {ColumnFilter} columnFilter Column filter instance which contains all necessary information about row
   * index transformation.
   */
  setFilters(rowFilter: RowFilter, columnFilter: ColumnFilter) {
    this.rowFilter = rowFilter;
    this.columnFilter = columnFilter;
  }

  /**
   * Sets row and column header functions.
   *
   * @param {Function[]} rowHeaders Row header functions. Factories for creating content for row headers.
   * @param {Function[]} columnHeaders Column header functions. Factories for creating content for column headers.
   */
  setHeaderContentRenderers(rowHeaders: Function[], columnHeaders: Function[]) {
    this.rowHeaderFunctions = rowHeaders;
    this.rowHeadersCount = rowHeaders.length;
    this.columnHeaderFunctions = columnHeaders;
    this.columnHeadersCount = columnHeaders.length;
  }

  /**
   * Sets table renderers.
   *
   * @param {renderers} renderers The renderer units.
   * @param {RowHeadersRenderer} renderers.rowHeaders Row headers renderer.
   * @param {ColumnHeaderRowsRenderer} renderers.columnHeaderRows Column header rows renderer.
   * @param {ColumnHeadersRenderer} renderers.columnHeaders Column headers renderer.
   * @param {ColGroupRenderer} renderers.colGroup Col group renderer.
   * @param {RowsRenderer} renderers.rows Rows renderer.
   * @param {CellsRenderer} renderers.cells Cells renderer.
   */
  setRenderers({ rowHeaders, columnHeaderRows, columnHeaders, colGroup, rows, cells }: {
    rowHeaders: RowHeadersRenderer;
    columnHeaderRows: ColumnHeaderRowsRenderer;
    columnHeaders: ColumnHeadersRenderer;
    colGroup: ColGroupRenderer;
    rows: RowsRenderer;
    cells: CellsRenderer;
  }) {
    rowHeaders.setTable(this);
    columnHeaderRows.setTable(this);
    columnHeaders.setTable(this);
    colGroup.setTable(this);
    rows.setTable(this);
    cells.setTable(this);

    this.rowHeaders = rowHeaders;
    this.columnHeaderRows = columnHeaderRows;
    this.columnHeaders = columnHeaders;
    this.colGroup = colGroup;
    this.rows = rows;
    this.cells = cells;
  }

  /**
   * Transforms visual/rendered row index to source index.
   *
   * @param {number} rowIndex Rendered index.
   * @returns {number}
   */
  renderedRowToSource(rowIndex: number) {
    return this.rowFilter!.renderedToSource(rowIndex);
  }

  /**
   * Transforms visual/rendered column index to source index.
   *
   * @param {number} columnIndex Rendered index.
   * @returns {number}
   */
  renderedColumnToSource(columnIndex: number) {
    return this.columnFilter!.renderedToSource(columnIndex);
  }

  /**
   * Returns `true` if the accessibility-related ARIA tags should be added to the table, `false` otherwise.
   *
   * @returns {boolean}
   */
  isAriaEnabled() {
    return this.rowUtils!.wtSettings.getSetting<boolean>('ariaTags');
  }

  /**
   * Returns the `id` used to tie a data cell to its column header for screen readers, or an empty
   * string when the host supplied no instance id. The column-header renderer stamps this id on the
   * owning overlay's header, and the cells renderer points at it through `aria-describedby`, so the
   * header label is announced together with the cell. Keyed by the rendered column index (the
   * Walkontable column, which core has already collapsed from physical to renderable space), so the
   * reference stays valid across horizontal scroll and pooled-node reuse; the instance id keeps it
   * unique when several grids share a page.
   *
   * @param {number} sourceColumnIndex The rendered (renderable) column index the header labels.
   * @returns {string}
   */
  getAriaColumnHeaderId(sourceColumnIndex: number): string {
    const prefix = this.getAriaColumnHeaderIdPrefix();

    return prefix ? `${prefix}${sourceColumnIndex}` : '';
  }

  /**
   * Returns the instance-unique prefix the column-header id is built from, or an empty string when the
   * host supplied no instance id. Draw-constant, so the cells renderer resolves it once per draw and
   * appends the column index per cell instead of reading the setting on every cell.
   *
   * @returns {string}
   */
  getAriaColumnHeaderIdPrefix(): string {
    const guid = this.rowUtils!.wtSettings.getSetting('guid');

    return guid ? `${guid}-colheader-` : '';
  }

  /**
   * Returns `true` when the currently rendered overlay is the single owner of the `aria-describedby`
   * id for the given column, so exactly one header in the whole grid carries it. A frozen
   * (inline-start) column is owned by the inline-start overlay, which always renders it; every other
   * column is owned by the master. The master also renders the frozen columns at horizontal offset 0,
   * so it must decline them there to avoid a duplicate id; the sticky clones (top, bottom, corners)
   * never own an id - they are duplicate copies of a header the master or the inline-start overlay
   * already carries.
   *
   * @param {number} sourceColumnIndex The rendered (renderable) column index.
   * @returns {boolean}
   */
  ownsAriaColumnHeaderId(sourceColumnIndex: number): boolean {
    const isFrozenColumn = sourceColumnIndex < this.rowUtils!.wtSettings.getSetting<number>('fixedColumnsStart');

    if (this.activeOverlayName === 'inline_start') {
      return isFrozenColumn;
    }

    if (this.activeOverlayName === 'master') {
      return !isFrozenColumn;
    }

    return false;
  }

  /**
   * Returns `true` when the grid has at least one column-header row. Read grid-wide from the settings
   * rather than from this table's own `columnHeadersCount`, because a clone that renders no header row
   * (the bottom overlays) reports `0` while the grid still has headers its cells should reference.
   *
   * @returns {boolean}
   */
  hasColumnHeaders(): boolean {
    return this.rowUtils!.wtSettings.getSetting<Function[]>('columnHeaders').length > 0;
  }

  /**
   * Returns `true` when the column-header (THEAD) pass can be skipped for this draw because it is a
   * pure vertical scroll and the exact same column render window (offset + counts) was rendered on
   * the previous header render. The THEAD content is then identical to what is already in the DOM.
   *
   * @returns {boolean}
   */
  #canSkipColumnHeadersRender() {
    return this.#columnHeadersRenderSkippable &&
      this.#hasStoredColumnHeaderWindow &&
      this.#prevColumnHeaderOffset === (this.columnFilter ? this.columnFilter.offset : 0) &&
      this.#prevColumnsToRender === this.columnsToRender &&
      this.#prevColumnHeadersCount === this.columnHeadersCount &&
      this.#prevRowHeadersCount === this.rowHeadersCount;
  }

  /**
   * Stores the current column render window so the next draw can detect whether it is unchanged.
   */
  #storeColumnHeaderRenderWindow() {
    this.#hasStoredColumnHeaderWindow = true;
    this.#prevColumnHeaderOffset = this.columnFilter ? this.columnFilter.offset : 0;
    this.#prevColumnsToRender = this.columnsToRender;
    this.#prevColumnHeadersCount = this.columnHeadersCount;
    this.#prevRowHeadersCount = this.rowHeadersCount;
  }

  /**
   * Renders the table.
   */
  render() {
    try {
      // On a pure vertical scroll the THEAD (column header rows + cells) is identical draw-to-draw, so
      // skip re-rendering it. The selection highlight classes on headers are (re)applied by the
      // separate selection pass, and are unchanged while only the vertical scroll position moves.
      if (!this.#canSkipColumnHeadersRender()) {
        this.columnHeaderRows!.render();
        this.columnHeaders!.render();
        this.#storeColumnHeaderRenderWindow();
      }

      // Stationary bands: the TR/TD/TH nodes keep their DOM positions on every draw — the
      // `OrderView`s reuse the children in place and the renderers below overwrite their content.
      // Rows and cells are deliberately NEVER moved, inserted, or removed while a band merely shifts
      // (the draw cycle keeps both band sizes stable on scroll-driven draws — see
      // `stabilizeRenderedRowsBand`/`stabilizeRenderedColumnsBand`). Structural DOM mutations here
      // would trigger the host page's `:has()` style invalidation on every scroll, at a cost that
      // scales with the host document.
      this.rows!.render();
      this.rowHeaders!.render();
      this.cells!.render();

      // After the cells are rendered calculate columns width to prepare proper values
      // for colGroup renderer (which renders COL elements).
      this.columnUtils!.calculateWidths();
      this.colGroup!.render();

      const { rowsToRender, rows } = this;

      // Fix for multi-line content and for supporting `rowHeights` option. Must stay after
      // `cells.render()`: the cell renderer resets every cell's inline style and class on each draw.
      const rowUtils = this.rowUtils!;
      // Asked once per draw, not once per row: on a grid that never sets the mode this is one
      // constant settings read for the whole band instead of one per rendered row. Kept behind the
      // row count so a table with nothing to render still touches nothing.
      const mayHaveExactRows = rowsToRender > 0 && rowUtils.mayHaveExactRows();

      for (let visibleRowIndex = 0; visibleRowIndex < rowsToRender; visibleRowIndex++) {
        const TR = rows!.getRenderedNode(visibleRowIndex);

        if (TR) {
          const sourceRowIndex = this.renderedRowToSource(visibleRowIndex);
          const isExact = mayHaveExactRows && rowUtils.isExact(sourceRowIndex);

          applyRowHeight(
            TR,
            rowUtils.getHeightByOverlayName(sourceRowIndex, this.activeOverlayName, isExact),
            isExact,
            this.stylesHandler.areCellsBorderBox(),
          );
        }
      }
    } finally {
      // One render only — the next draw (or the next refill pass) decides its own window. In a
      // `finally` so a throwing `cellRenderer` (or an `afterRenderer` hook) cannot leave the window
      // armed and make the next render silently skip the top of the band.
      this.paintFromRow = 0;
    }
  }
}
