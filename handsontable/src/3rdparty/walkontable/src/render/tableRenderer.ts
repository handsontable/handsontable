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
import { getBoxAdjustedRowHeight } from '../axisSizing/boxModel';

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
   * When `true`, the TBODY row band may be delta-rendered for this draw: instead of re-rendering
   * every rendered row, rotate the surviving TR nodes and run the cell/row-header renderers only for
   * the rows entering the band. Set once per draw by the draw cycle; only a pure vertical scroll (no
   * data, settings, selection, or column-window change) enables it. Defaults to `false`.
   *
   * @type {boolean}
   */
  #rowDeltaRenderable: boolean = false;
  /**
   * `true` once a full render has stored the current row render window (offset + count).
   *
   * @type {boolean}
   */
  #hasStoredRowWindow: boolean = false;
  /**
   * The first rendered row (row filter offset, a renderable index) captured on the last render.
   *
   * @type {number}
   */
  #prevRowOffset: number = -1;
  /**
   * The number of rendered rows captured on the last render.
   *
   * @type {number}
   */
  #prevRowsToRender: number = -1;
  /**
   * The half-open range `[start, end)` of visual row indexes that must be rendered on the current
   * delta draw (the rows entering the band). `null` means "render every rendered row" (a full band
   * render). Consumed by the cells and row-headers renderers via {@link TableRenderer#isRowRenderable}.
   *
   * @type {{ start: number, end: number } | null}
   */
  #enteringRowsRange: { start: number; end: number } | null = null;

  /**
   * Creates a new TableRenderer instance.
   *
   * @param {HTMLTableElement} rootNode The HTML table element to use as the root node for rendering.
   * @param {object} options The configuration options.
   * @param {Function} [options.cellRenderer] The cell renderer function.
   * @param {StylesHandler} [options.stylesHandler] The styles handler instance.
   */
  constructor(
    rootNode: HTMLTableElement,
    { cellRenderer, stylesHandler }: { cellRenderer?: Function; stylesHandler?: StylesHandler } = {}) {
    this.rootNode = rootNode;
    this.rootDocument = this.rootNode.ownerDocument;
    this.cellRenderer = cellRenderer!;
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
   * Marks this draw as one where the TBODY row band may be delta-rendered (rotate surviving rows,
   * render only entering rows), provided the row render window shifted by fewer rows than the band
   * holds. The draw cycle sets this to `true` only for a pure vertical scroll and to `false`
   * otherwise, so any data, settings, selection, or column-window change re-renders the whole band.
   *
   * @param {boolean} renderable Whether the row band may be delta-rendered for this draw.
   */
  setRowDeltaRenderable(renderable: boolean) {
    this.#rowDeltaRenderable = renderable;
  }

  /**
   * Returns `true` when the cell / row-header renderers must render the given visual row on the
   * current draw. On a full band render this is always `true`; on a delta draw it is `true` only for
   * the rows entering the band (the surviving rows keep their existing content and are skipped).
   *
   * @param {number} visualRowIndex The visual (rendered) row index, `0` to `rowsToRender - 1`.
   * @returns {boolean}
   */
  isRowRenderable(visualRowIndex: number) {
    const range = this.#enteringRowsRange;

    return range === null || (visualRowIndex >= range.start && visualRowIndex < range.end);
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
   * Computes the delta-render plan for the TBODY row band. Returns the half-open range of visual row
   * indexes that must be rendered (the entering rows) and the rotation delta, or `null` when the band
   * must be fully re-rendered. Delta rendering is only attempted on a pure vertical scroll where the
   * band size is unchanged and the band shifted by fewer rows than it holds — otherwise every row is
   * new (or the previous window is unknown), so a full render is both required and no slower.
   *
   * The offset is the row filter offset (a renderable index); renderable indexes stay contiguous
   * across a scroll (hidden rows are already removed from the axis), so the shift is a clean rotation.
   *
   * @returns {{ delta: number, start: number, end: number } | null}
   */
  #computeRowDeltaPlan() {
    if (!this.#rowDeltaRenderable || !this.#hasStoredRowWindow) {
      return null;
    }

    const offset = this.rowFilter ? this.rowFilter.offset : 0;
    const count = this.rowsToRender;

    if (count === 0 || count !== this.#prevRowsToRender) {
      return null;
    }

    const delta = offset - this.#prevRowOffset;

    if (delta === 0 || Math.abs(delta) >= count) {
      return null;
    }

    // Scroll down (delta > 0): the leaving rows are at the top, so the entering rows land at the
    // bottom of the band. Scroll up (delta < 0): mirror — entering rows land at the top.
    return delta > 0
      ? { delta, start: count - delta, end: count }
      : { delta, start: 0, end: -delta };
  }

  /**
   * Rotates the surviving TR nodes of the TBODY in place so DOM child position `i` again holds the
   * content for rendered row `i`, moving only the leaving nodes (which become the entering slots and
   * are re-rendered afterwards). The surviving nodes are never re-parented, so any state they hold
   * (focus, an open editor) is preserved. `moveBefore` (Chrome 133+) is used when available for the
   * moved nodes with an `appendChild`/`insertBefore` fallback.
   *
   * @param {number} delta The signed row shift (positive = scrolled down, negative = scrolled up).
   */
  #rotateBodyRows(delta: number) {
    const tbody = this.rows!.rootNode;
    const supportsMoveBefore = typeof (tbody as unknown as {
      moveBefore?: (node: Node, ref: Node | null) => void;
    }).moveBefore === 'function';
    const move = (node: Node, ref: Node | null) => {
      if (supportsMoveBefore) {
        (tbody as unknown as { moveBefore: (n: Node, r: Node | null) => void }).moveBefore(node, ref);
      } else if (ref === null) {
        tbody.appendChild(node);
      } else {
        tbody.insertBefore(node, ref);
      }
    };

    if (delta > 0) {
      // Move the top `delta` (leaving) rows to the end, keeping their relative order.
      for (let i = 0; i < delta; i++) {
        move(tbody.firstElementChild!, null);
      }
    } else {
      // Move the bottom `|delta|` (leaving) rows to the front, keeping their relative order.
      for (let i = 0; i < -delta; i++) {
        move(tbody.lastElementChild!, tbody.firstElementChild);
      }
    }
  }

  /**
   * Stores the current row render window (offset + count) so the next draw can compute its shift.
   */
  #storeRowWindow() {
    this.#hasStoredRowWindow = true;
    this.#prevRowOffset = this.rowFilter ? this.rowFilter.offset : 0;
    this.#prevRowsToRender = this.rowsToRender;
  }

  /**
   * Renders the table.
   */
  render() {
    // On a pure vertical scroll the THEAD (column header rows + cells) is identical draw-to-draw, so
    // skip re-rendering it. The selection highlight classes on headers are (re)applied by the
    // separate selection pass, and are unchanged while only the vertical scroll position moves.
    if (!this.#canSkipColumnHeadersRender()) {
      this.columnHeaderRows!.render();
      this.columnHeaders!.render();
      this.#storeColumnHeaderRenderWindow();
    }

    // On a pure vertical scroll only the row band shifts. Rotate the surviving TR nodes into their
    // new positions and render only the entering rows; the surviving rows keep their existing cell
    // content, classes, and ARIA (their source row is unchanged). `#enteringRowsRange` gates the
    // cell / row-header renderers through `isRowRenderable`. When it is `null`, every row renders.
    const rowDeltaPlan = this.#computeRowDeltaPlan();

    if (rowDeltaPlan) {
      this.#rotateBodyRows(rowDeltaPlan.delta);
      this.#enteringRowsRange = { start: rowDeltaPlan.start, end: rowDeltaPlan.end };
    } else {
      this.#enteringRowsRange = null;
    }

    this.rows!.render();
    this.rowHeaders!.render();
    this.cells!.render();

    this.#storeRowWindow();
    this.#enteringRowsRange = null;

    // After the cells are rendered calculate columns width to prepare proper values
    // for colGroup renderer (which renders COL elements).
    this.columnUtils!.calculateWidths();
    this.colGroup!.render();

    const { rowsToRender, rows } = this;

    // Fix for multi-line content and for supporting `rowHeights` option.
    for (let visibleRowIndex = 0; visibleRowIndex < rowsToRender; visibleRowIndex++) {
      const TR = rows!.getRenderedNode(visibleRowIndex);
      const rowUtils = this.rowUtils;

      if (TR && TR.firstChild) {
        const sourceRowIndex = this.renderedRowToSource(visibleRowIndex);
        const rowHeight = rowUtils!.getHeightByOverlayName(sourceRowIndex, this.activeOverlayName);

        if (rowHeight) {
          // Convert the logical row height to the pixel height written to the DOM. In content-box mode
          // 1px is "replaced" by the row's 1px top border; the shared helper keeps that constant in one
          // place (see axisSizing/boxModel.ts).
          const pixelHeight = getBoxAdjustedRowHeight(rowHeight, this.stylesHandler.areCellsBorderBox());

          (TR.firstChild as HTMLElement).style.height = `${pixelHeight}px`;
        } else {
          (TR.firstChild as HTMLElement).style.height = '';
        }
      }
    }
  }
}
