import { A11Y_HIDDEN, A11Y_OWNS } from '../../../../helpers/a11y';
import {
  CLONE_BOTTOM,
  CLONE_BOTTOM_INLINE_END_CORNER,
  CLONE_BOTTOM_INLINE_START_CORNER,
  CLONE_INLINE_END,
  CLONE_INLINE_START,
  CLONE_TOP,
  CLONE_TOP_INLINE_END_CORNER,
  CLONE_TOP_INLINE_START_CORNER,
} from './constants';
import { MASTER_TABLE, resolveOwningOverlay } from './overlayOwnership';
import type { OverlayOwnershipLayout } from './overlayOwnership';

const [HIDDEN, HIDDEN_VALUE] = A11Y_HIDDEN();
const OWNS = A11Y_OWNS('')[0];

/**
 * The band of rows a table draws: the frozen top rows (with the column headers), the frozen bottom rows, or
 * the rows between.
 */
export type RowBand = 'top' | 'middle' | 'bottom';

/**
 * The segment of columns a table owns: the frozen start columns (with the row headers), the frozen end
 * columns, or the columns between.
 */
export type ColumnSegment = 'start' | 'main' | 'end';

const ROW_BANDS: Readonly<Record<string, RowBand>> = {
  [CLONE_TOP]: 'top',
  [CLONE_TOP_INLINE_START_CORNER]: 'top',
  [CLONE_TOP_INLINE_END_CORNER]: 'top',
  [CLONE_BOTTOM]: 'bottom',
  [CLONE_BOTTOM_INLINE_START_CORNER]: 'bottom',
  [CLONE_BOTTOM_INLINE_END_CORNER]: 'bottom',
  [CLONE_INLINE_START]: 'middle',
  [CLONE_INLINE_END]: 'middle',
  [MASTER_TABLE]: 'middle',
};
const COLUMN_SEGMENTS: Readonly<Record<string, ColumnSegment>> = {
  [CLONE_INLINE_START]: 'start',
  [CLONE_TOP_INLINE_START_CORNER]: 'start',
  [CLONE_BOTTOM_INLINE_START_CORNER]: 'start',
  [CLONE_INLINE_END]: 'end',
  [CLONE_TOP_INLINE_END_CORNER]: 'end',
  [CLONE_BOTTOM_INLINE_END_CORNER]: 'end',
  [CLONE_TOP]: 'main',
  [CLONE_BOTTOM]: 'main',
  [MASTER_TABLE]: 'main',
};
// The tables of each row band, in reading order: from the inline start to the inline end.
const BAND_TABLES: Readonly<Record<RowBand, readonly string[]>> = {
  top: [CLONE_TOP_INLINE_START_CORNER, CLONE_TOP, CLONE_TOP_INLINE_END_CORNER],
  middle: [CLONE_INLINE_START, MASTER_TABLE, CLONE_INLINE_END],
  bottom: [CLONE_BOTTOM_INLINE_START_CORNER, CLONE_BOTTOM, CLONE_BOTTOM_INLINE_END_CORNER],
};
// The head sections the stylesheet hides (`visibility: hidden`): they are not in the accessibility tree.
const HIDDEN_HEADS: ReadonlySet<string> = new Set([MASTER_TABLE, CLONE_INLINE_START, CLONE_INLINE_END]);

/**
 * The cells this module hid from assistive technology. The renderers keep the attribute on them
 * (`isHiddenByAriaTree`), and the pass removes it only from a cell that is in the set, so an `aria-hidden` a
 * cell renderer wrote itself is neither kept across a repaint nor removed by the pass.
 */
const hiddenCells = new WeakSet<Element>();
// The cells each row was last given (`aria-owns`) with the ids they were listed under, so an unchanged list
// costs no id lookup, no string and no DOM write.
const ownedByRow = new WeakMap<Element, OwnedCells>();
// A row slice of a table whose cells no row lists (the leading table's own cells) shares one empty list.
const NO_CELLS: Element[] = [];
// The ids this module gave to cells, per element: a cell keeps its id while its element lives.
const cellIds = new WeakMap<Element, string>();
let cellIdSequence = 0;

/**
 * The frozen layout with the number of row header columns: what decides which table owns a cell and which
 * table's row stands for a grid row.
 */
export interface AriaTreeLayout extends OverlayOwnershipLayout {
  rowHeadersCount: number;
}

/**
 * The table of an overlay (or the master table), as the pass reads it.
 */
export interface AriaCellsTable {
  name: string;
  THEAD: HTMLElement | null;
  TBODY: HTMLElement | null;
  rowFilter: { renderedToSource(index: number): number } | null;
  columnFilter: { renderedToSource(index: number): number } | null;
}

/**
 * Returns the band of rows the given table draws.
 *
 * @param {string} tableName The table's name: `master` or a clone type.
 * @returns {RowBand}
 */
export function getTableRowBand(tableName: string): RowBand {
  return ROW_BANDS[tableName] ?? 'middle';
}

/**
 * Returns the band a row belongs to. A column header (a negative row) belongs to the top band.
 *
 * @param {OverlayOwnershipLayout} layout The frozen layout.
 * @param {number} row The renderable row index, negative for a column header.
 * @returns {RowBand}
 */
export function getRowBand(layout: OverlayOwnershipLayout, row: number): RowBand {
  if (row < layout.fixedRowsTop) {
    return 'top';
  }

  return row < layout.totalRows && row >= layout.totalRows - layout.fixedRowsBottom ? 'bottom' : 'middle';
}

/**
 * Returns the column segment whose tables hold the first cells of every row: the tables of that segment
 * carry the grid's rows, and their rows take the cells of the other segments (`aria-owns`). The start
 * segment leads when the grid has row headers or frozen start columns, otherwise the columns between, and
 * the end segment only when every column is a frozen end column.
 *
 * @param {AriaTreeLayout} layout The layout.
 * @returns {ColumnSegment}
 */
export function getLeadingSegment(layout: AriaTreeLayout): ColumnSegment {
  if (layout.rowHeadersCount > 0 || layout.fixedColumnsStart > 0) {
    return 'start';
  }

  return layout.totalColumns - layout.fixedColumnsEnd > 0 ? 'main' : 'end';
}

/**
 * Checks whether a table's row is the one that stands for the grid row in the accessibility tree: the table
 * draws the row's band (a frozen top row is a row of the top tables, not of the master, which draws a copy
 * of it underneath), and it belongs to the leading column segment.
 *
 * @param {string} tableName The table's name: `master` or a clone type.
 * @param {AriaTreeLayout} layout The layout.
 * @param {number} row The renderable row index, negative for a column header.
 * @returns {boolean}
 */
export function isGridRowOfTable(tableName: string, layout: AriaTreeLayout, row: number): boolean {
  return getTableRowBand(tableName) === getRowBand(layout, row) &&
    COLUMN_SEGMENTS[tableName] === getLeadingSegment(layout);
}

/**
 * Checks whether the pass hid the given cell. The renderers ask before they clear a recycled element's
 * accessibility attributes, so the attribute is not removed and written again on every paint.
 *
 * @param {Element} element The cell or header.
 * @returns {boolean}
 */
export function isHiddenByAriaTree(element: Element): boolean {
  return hiddenCells.has(element);
}

/**
 * Checks whether the given id is one the pass gave to this cell. The column header renderer asks before it
 * removes a header's id.
 *
 * @param {Element} element The cell or header.
 * @returns {boolean}
 */
export function hasAriaTreeId(element: Element): boolean {
  const id = cellIds.get(element);

  return id !== undefined && element.id === id;
}

/**
 * Hides a covered copy of a cell, or exposes the copy that owns it.
 *
 * @param {Element} cell The cell or header.
 * @param {boolean} isCovered Whether another table owns the cell.
 */
function syncHidden(cell: Element, isCovered: boolean): void {
  if (isCovered === hiddenCells.has(cell)) {
    return;
  }

  if (isCovered) {
    hiddenCells.add(cell);
    cell.setAttribute(HIDDEN, HIDDEN_VALUE);
  } else {
    hiddenCells.delete(cell);
    cell.removeAttribute(HIDDEN);
  }
}

/**
 * Checks whether an id a renderer wrote names this cell: a renderer paints every copy of a cell, so the
 * copies share the id, and a reference by id (`aria-owns`) resolves to the first of them in the document,
 * which can be a copy the pass hid.
 *
 * @param {Element} cell The cell or header.
 * @returns {boolean}
 */
function isFirstWithItsId(cell: Element): boolean {
  const root = cell.getRootNode() as Partial<Pick<Document, 'getElementById'>>;

  // A cell outside a document or a shadow root has no other copy to be mistaken for.
  return typeof root.getElementById !== 'function' || root.getElementById(cell.id) === cell;
}

/**
 * Returns the id of a cell, giving it one when it has none. An id a renderer wrote is kept and used while it
 * names this copy of the cell; a copy that shares its id with an earlier one gets the pass's own id.
 *
 * @param {Element} cell The cell or header.
 * @param {string} guid The grid's instance id.
 * @returns {string}
 */
function ensureCellId(cell: Element, guid: string): string {
  let id = cellIds.get(cell);

  if (cell.id === '' || (cell.id !== id && !isFirstWithItsId(cell))) {
    if (id === undefined) {
      cellIdSequence += 1;
      id = `${guid}-cell-${cellIdSequence}`;
      cellIds.set(cell, id);
    }
    cell.id = id;
  }

  return cell.id;
}

/**
 * The cells a row takes from the other tables, in column order, with the id each was listed under.
 */
interface OwnedCells {
  cells: Element[];
  ids: string[];
}

/**
 * Removes the list of cells the pass gave to a row.
 *
 * @param {Element} row The row.
 */
function dropOwned(row: Element): void {
  if (ownedByRow.delete(row)) {
    row.removeAttribute(OWNS);
  }
}

/**
 * One rendered row of one table: its element, and the cells of it the table owns, in column order.
 */
interface RowSlice {
  row: HTMLElement;
  ownCells: Element[];
}

/**
 * The block a cell belongs to: the coordinates of its first and of its last cell.
 */
export type CellBlock = [row: number, column: number, lastRow: number, lastColumn: number];

/**
 * Answers which block a cell belongs to, or `null` for a cell that belongs to none. The host knows (merged
 * cells); the engine only sees that some cell spans.
 */
export type BlockResolver = (row: number, column: number) => CellBlock | null;

/**
 * The rows and columns a table drew, as grid indexes.
 */
interface DrawnRange {
  firstRow: number;
  lastRow: number;
  firstColumn: number;
  lastColumn: number;
}

/**
 * What a section is reconciled with: the layout and, for a grid that draws a spanning cell, the host's
 * answer for the blocks and what each table drew.
 */
interface ReconcileContext {
  layout: AriaTreeLayout;
  getBlock: BlockResolver | null;
  drawnRanges: Map<string, DrawnRange | null>;
  tables: Map<string, AriaCellsTable>;
}

/**
 * Returns the rows and columns a table drew, or `null` for a table that drew no cell.
 *
 * @param {AriaCellsTable | undefined} table The table.
 * @param {number} rowHeadersCount The number of row header columns.
 * @returns {DrawnRange | null}
 */
function readDrawnRange(table: AriaCellsTable | undefined, rowHeadersCount: number): DrawnRange | null {
  const rows = table?.TBODY?.children;

  if (!table || !rows || rows.length === 0 || table.rowFilter === null || table.columnFilter === null) {
    return null;
  }

  const headers = COLUMN_SEGMENTS[table.name] === 'end' ? 0 : rowHeadersCount;
  const columns = rows[0].children.length - headers;

  if (columns <= 0) {
    return null;
  }

  return {
    firstRow: table.rowFilter.renderedToSource(0),
    lastRow: table.rowFilter.renderedToSource(rows.length - 1),
    firstColumn: table.columnFilter.renderedToSource(0),
    lastColumn: table.columnFilter.renderedToSource(columns - 1),
  };
}

/**
 * Checks whether a table drew any cell of a block.
 *
 * @param {string} tableName The table's name.
 * @param {CellBlock} block The block.
 * @param {ReconcileContext} context The layout, the block resolver, and what each table drew.
 * @returns {boolean}
 */
function drawsPartOfBlock(tableName: string, block: CellBlock, context: ReconcileContext): boolean {
  let range = context.drawnRanges.get(tableName);

  if (range === undefined) {
    range = readDrawnRange(context.tables.get(tableName), context.layout.rowHeadersCount);
    context.drawnRanges.set(tableName, range);
  }

  return range !== null &&
    block[0] <= range.lastRow && block[2] >= range.firstRow &&
    block[1] <= range.lastColumn && block[3] >= range.firstColumn;
}

/**
 * Checks whether a table's copy of a cell is covered: another table owns the cell. A cell of a block (merged
 * cells) is judged by the block's first cell, because a block that crosses a freeze line is drawn in slices:
 * the table that holds the block's first cell owns the whole block, and a slice another table draws (the
 * frozen bottom rows' part of it, which can be a plain 1 by 1 cell) is a copy of the same cell. That holds
 * while the owning table draws some part of the block. When it draws none (the block starts in rows scrolled
 * out of the master, and reaches into the frozen bottom rows), the slice is the only copy on screen and is
 * judged as a cell of its own.
 *
 * @param {string} tableName The table's name.
 * @param {number} gridRow The cell's grid row.
 * @param {number} gridColumn The cell's grid column.
 * @param {ReconcileContext} context The layout, the block resolver, and what each table drew.
 * @returns {boolean}
 */
function isCoveredCopy(tableName: string, gridRow: number, gridColumn: number, context: ReconcileContext): boolean {
  const { layout } = context;
  const block = context.getBlock !== null && gridRow >= 0 && gridColumn >= 0
    ? context.getBlock(gridRow, gridColumn)
    : null;

  if (block !== null) {
    const blockOwner = resolveOwningOverlay(layout, block[0], block[1]);

    if (blockOwner === tableName) {
      return false;
    }

    if (drawsPartOfBlock(blockOwner, block, context)) {
      return true;
    }
  }

  return resolveOwningOverlay(layout, gridRow, gridColumn) !== tableName;
}

/**
 * Walks the rows of one section, hides the cells another table owns, and returns the rows by their grid
 * row index.
 *
 * @param {AriaCellsTable} table The table.
 * @param {HTMLElement} section The THEAD or TBODY element.
 * @param {ReconcileContext} context The layout, the block resolver, and what each table drew.
 * @param {Function} toGridRow Maps a row's index in the section to the grid row index.
 * @param {boolean} listsCells Whether a row of another table lists this table's cells. The leading table's
 * cells are its rows' own children, so nothing collects them.
 * @returns {Map<number, RowSlice>}
 */
function reconcileSection(
  table: AriaCellsTable, section: HTMLElement, context: ReconcileContext, toGridRow: (index: number) => number,
  listsCells: boolean,
): Map<number, RowSlice> {
  const { layout } = context;
  const slices = new Map<number, RowSlice>();
  const rows = section.children;
  const { rowHeadersCount } = layout;
  const hasRowHeaders = COLUMN_SEGMENTS[table.name] !== 'end';

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex] as HTMLElement;
    const gridRow = toGridRow(rowIndex);
    const cells = row.children;
    const headers = hasRowHeaders ? Math.min(rowHeadersCount, cells.length) : 0;
    const ownCells: Element[] = listsCells ? [] : NO_CELLS;

    for (let cellIndex = 0; cellIndex < cells.length; cellIndex++) {
      const cell = cells[cellIndex] as HTMLTableCellElement;
      const gridColumn = cellIndex < headers
        ? cellIndex - headers
        : table.columnFilter!.renderedToSource(cellIndex - headers);
      // The master's own row headers are hidden by the stylesheet, as its head section is.
      const isOutOfTree = table.name === MASTER_TABLE && cellIndex < headers;

      if (!isOutOfTree) {
        const isCovered = isCoveredCopy(table.name, gridRow, gridColumn, context);

        syncHidden(cell, isCovered);

        // A cell a block covers is not displayed (`display: none`), so no row lists it. Only such a cell
        // carries an inline style here, and reading `style` on a cell without one makes the browser create
        // a style declaration that lives as long as the pooled element.
        if (listsCells && !isCovered && (!cell.hasAttribute('style') || cell.style.display !== 'none')) {
          ownCells.push(cell);
        }
      }
    }

    slices.set(gridRow, { row, ownCells });
  }

  return slices;
}

/**
 * Joins the rows of one band: the row of the leading table takes the cells the other tables of the band own.
 *
 * @param {Array<Map<number, RowSlice> | undefined>} tables The rows of the band's tables, in reading order.
 * @param {number} leading The index of the leading table.
 * @param {string} guid The grid's instance id.
 */
function joinBandRows(tables: Array<Map<number, RowSlice> | undefined>, leading: number, guid: string): void {
  const leadingRows = tables[leading];

  tables.forEach((rows, index) => {
    if (index !== leading) {
      // A row that does not stand for a grid row takes no cells.
      rows?.forEach(slice => dropOwned(slice.row));
    }
  });

  leadingRows?.forEach((slice, gridRow) => {
    const others: Element[][] = [];

    for (let index = 0; index < tables.length; index++) {
      const other = index === leading ? undefined : tables[index]?.get(gridRow);

      if (other && other.ownCells.length > 0) {
        others.push(other.ownCells);
      }
    }

    if (!isOwnedListCurrent(slice.row, others)) {
      writeOwned(slice.row, others, guid);
    }
  });
}

/**
 * Checks whether a row already lists exactly the given cells, each under the id it still carries. On a draw
 * that changed nothing (the common one) this is all the pass does for a row: no id is looked up and no
 * string is built.
 *
 * @param {Element} row The row.
 * @param {Element[][]} others The cells the row takes, per table, in reading order.
 * @returns {boolean}
 */
function isOwnedListCurrent(row: Element, others: Element[][]): boolean {
  const previous = ownedByRow.get(row);
  let count = 0;

  for (let index = 0; index < others.length; index++) {
    const cells = others[index];

    if (previous === undefined) {
      return false;
    }

    for (let cellIndex = 0; cellIndex < cells.length; cellIndex++) {
      const cell = cells[cellIndex];

      if (previous.cells[count] !== cell || previous.ids[count] !== cell.id) {
        return false;
      }
      // An id a renderer wrote can be taken by a copy drawn earlier in the document after the list was
      // written (the master renders the row again on a scroll back), and the reference then resolves there.
      if (cellIds.get(cell) !== cell.id && !isFirstWithItsId(cell)) {
        return false;
      }
      count += 1;
    }
  }

  return previous === undefined || previous.cells.length === count;
}

/**
 * Writes the list of cells a row takes from the other tables, or removes a list the pass wrote.
 *
 * @param {Element} row The row.
 * @param {Element[][]} others The cells the row takes, per table, in reading order.
 * @param {string} guid The grid's instance id.
 */
function writeOwned(row: Element, others: Element[][], guid: string): void {
  const cells = others.flat();

  if (cells.length === 0) {
    dropOwned(row);

    return;
  }

  const ids = cells.map(cell => ensureCellId(cell, guid));
  const owned = ids.join(' ');

  ownedByRow.set(row, { cells, ids });

  // A renderer that writes its own id on every paint changes the ids back and forth, not the list.
  if (row.getAttribute(OWNS) !== owned) {
    row.setAttribute(OWNS, owned);
  }
}

/**
 * Makes the grid one tree of rows for assistive technology, after every table was drawn.
 *
 * A cell can be drawn by up to four tables at once (the master and the overlay clones over it). The pass
 * leaves exactly one copy of each cell exposed: the one in the table that owns it, which is the copy the
 * user sees and the one that takes the focus (`resolveOwningOverlay`); every other copy gets `aria-hidden`.
 * It then joins each grid row, whose cells are spread over up to three tables, into one row: the row of the
 * leading table (`isGridRowOfTable`, which the row renderers use to give it the `row` role) takes the cells
 * the other tables own (`aria-owns`, in column order).
 *
 * The pass is the only writer of both attributes, and it runs for every rendered row whatever the cell
 * renderers painted: a cell that kept its content (`renderMode: 'onChange'`) can still change its owner,
 * when a row is added under frozen bottom rows or a column is frozen.
 *
 * @param {AriaCellsTable[]} tables The master table and the overlay clones' tables, in any order.
 * @param {AriaTreeLayout} layout The layout.
 * @param {number} columnHeadersCount The number of column header rows.
 * @param {string} guid The grid's instance id, which makes the cells' ids unique on a page.
 * @param {BlockResolver} [getBlock] Answers which block a cell belongs to.
 */
export function reconcileAriaCells(
  tables: AriaCellsTable[], layout: AriaTreeLayout, columnHeadersCount: number, guid: string,
  getBlock: BlockResolver | null = null,
): void {
  // The host is asked about blocks only when a body draws a spanning cell: one question per cell per draw is
  // a cost a grid without merged cells should not pay.
  const drawsBlocks = getBlock !== null &&
    tables.some(table => table.TBODY?.querySelector('td[rowspan], td[colspan]'));
  const byName = new Map(tables.map(table => [table.name, table]));
  const context: ReconcileContext = {
    layout,
    getBlock: drawsBlocks ? getBlock : null,
    drawnRanges: new Map(),
    tables: byName,
  };
  const leading = ['start', 'main', 'end'].indexOf(getLeadingSegment(layout));

  (Object.keys(BAND_TABLES) as RowBand[]).forEach((band) => {
    const heads: Array<Map<number, RowSlice> | undefined> = [];
    const bodies: Array<Map<number, RowSlice> | undefined> = [];

    BAND_TABLES[band].forEach((tableName, tableIndex) => {
      const table = byName.get(tableName);
      const isDrawn = table !== undefined && table.columnFilter !== null && table.rowFilter !== null;
      const listsCells = tableIndex !== leading;

      heads.push(isDrawn && table.THEAD && !HIDDEN_HEADS.has(tableName)
        ? reconcileSection(table, table.THEAD, context, index => index - columnHeadersCount, listsCells)
        : undefined);
      bodies.push(isDrawn && table.TBODY
        ? reconcileSection(
          table, table.TBODY, context, index => table.rowFilter!.renderedToSource(index), listsCells)
        : undefined);
    });

    joinBandRows(heads, leading, guid);
    joinBandRows(bodies, leading, guid);
  });
}

/**
 * The settings the layout is read from.
 */
interface AriaTreeSettings {
  getSetting(key: string, ...args: unknown[]): unknown;
}

/**
 * Reads the layout the single tree is built from, or returns `null` for a grid that keeps the tables apart:
 * one that writes no accessibility attributes, or one with no instance id to build the cells' ids from (a
 * Walkontable used on its own).
 *
 * @param {AriaTreeSettings} wtSettings The settings.
 * @returns {AriaTreeLayout | null}
 */
export function readAriaTreeLayout(wtSettings: AriaTreeSettings): AriaTreeLayout | null {
  if (!wtSettings.getSetting('ariaTags') || !wtSettings.getSetting('guid')) {
    return null;
  }

  return {
    totalRows: wtSettings.getSetting('totalRows') as number,
    totalColumns: wtSettings.getSetting('totalColumns') as number,
    fixedRowsTop: wtSettings.getSetting('fixedRowsTop') as number,
    fixedRowsBottom: wtSettings.getSetting('fixedRowsBottom') as number,
    fixedColumnsStart: wtSettings.getSetting('fixedColumnsStart') as number,
    fixedColumnsEnd: wtSettings.getSetting('fixedColumnsEnd') as number,
    rowHeadersCount: (wtSettings.getSetting('rowHeaders') as unknown[]).length,
  };
}

/**
 * Runs the pass for a grid with the layout its tables were drawn with (`reconcileAriaCells`).
 *
 * @param {AriaTreeSettings} wtSettings The settings.
 * @param {AriaCellsTable[]} tables The master table and the overlay clones' tables.
 * @param {AriaTreeLayout | null} layout The layout of this draw (`readAriaTreeLayout`), or `null` for a grid
 * that keeps the tables apart.
 */
export function reconcileAriaTree(
  wtSettings: AriaTreeSettings, tables: AriaCellsTable[], layout: AriaTreeLayout | null,
): void {
  if (layout) {
    reconcileAriaCells(
      tables,
      layout,
      (wtSettings.getSetting('columnHeaders') as unknown[]).length,
      wtSettings.getSetting('guid') as string,
      (row, column) => {
        // The `meta` source answers with the whole block, whatever part of it the tables render.
        const block = wtSettings.getSetting('onModifyGetCellCoords', row, column, false, 'meta');

        if (!Array.isArray(block) || !Number.isInteger(block[0]) || !Number.isInteger(block[1])) {
          return null;
        }

        // A host that answers with the first cell only names a block of one cell.
        return [
          block[0],
          block[1],
          Number.isInteger(block[2]) ? block[2] : block[0],
          Number.isInteger(block[3]) ? block[3] : block[1],
        ];
      },
    );
  }
}
