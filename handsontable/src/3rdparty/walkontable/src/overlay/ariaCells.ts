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
// The `aria-owns` each row was last given, so an unchanged list costs no DOM write.
const ownedByRow = new WeakMap<Element, string>();
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
 * Returns the id of a cell, giving it one when it has none. An id a renderer wrote is kept and used.
 *
 * @param {Element} cell The cell or header.
 * @param {string} guid The grid's instance id.
 * @returns {string}
 */
function ensureCellId(cell: Element, guid: string): string {
  if (cell.id === '') {
    let id = cellIds.get(cell);

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
 * Writes the list of cells a row takes from the other tables, or removes a list the pass wrote.
 *
 * @param {Element} row The row.
 * @param {string} owned The ids, space separated; empty for none.
 */
function syncOwned(row: Element, owned: string): void {
  if ((ownedByRow.get(row) ?? '') === owned) {
    return;
  }

  if (owned === '') {
    ownedByRow.delete(row);
    row.removeAttribute(OWNS);
  } else {
    ownedByRow.set(row, owned);
    row.setAttribute(OWNS, owned);
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
 * Answers where the block a cell belongs to starts: the coordinates of the block's first cell, or `null` for
 * a cell that belongs to none. The host knows (merged cells); the engine only sees that some cell spans.
 */
export type BlockOriginResolver = (row: number, column: number) => [number, number] | null;

/**
 * What a section is reconciled with: the layout and, for a grid that draws a spanning cell, the host's
 * answer for the blocks.
 */
interface ReconcileContext {
  layout: AriaTreeLayout;
  getBlockOrigin: BlockOriginResolver | null;
}

/**
 * Checks whether a table's copy of a cell is covered: another table owns the cell. A cell of a block (merged
 * cells) is judged by the block's first cell, because a block that crosses a freeze line is drawn in slices:
 * the table that holds the block's first cell owns the whole block, and a slice another table draws (the
 * frozen bottom rows' part of it, which can be a plain 1 by 1 cell) is a copy of the same cell.
 *
 * @param {string} tableName The table's name.
 * @param {number} gridRow The cell's grid row.
 * @param {number} gridColumn The cell's grid column.
 * @param {ReconcileContext} context The layout and the block resolver.
 * @returns {boolean}
 */
function isCoveredCopy(tableName: string, gridRow: number, gridColumn: number, context: ReconcileContext): boolean {
  const origin = context.getBlockOrigin !== null && gridRow >= 0 && gridColumn >= 0
    ? context.getBlockOrigin(gridRow, gridColumn)
    : null;

  return resolveOwningOverlay(context.layout, origin?.[0] ?? gridRow, origin?.[1] ?? gridColumn) !== tableName;
}

/**
 * Walks the rows of one section, hides the cells another table owns, and returns the rows by their grid
 * row index.
 *
 * @param {AriaCellsTable} table The table.
 * @param {HTMLElement} section The THEAD or TBODY element.
 * @param {ReconcileContext} context The layout and the block resolver.
 * @param {Function} toGridRow Maps a row's index in the section to the grid row index.
 * @returns {Map<number, RowSlice>}
 */
function reconcileSection(
  table: AriaCellsTable, section: HTMLElement, context: ReconcileContext, toGridRow: (index: number) => number,
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
    const ownCells: Element[] = [];

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

        // A cell a block covers is not displayed (`display: none`), so no row lists it.
        if (!isCovered && cell.style.display !== 'none') {
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
      rows?.forEach(slice => syncOwned(slice.row, ''));
    }
  });

  leadingRows?.forEach((slice, gridRow) => {
    const ids: string[] = [];

    for (let index = 0; index < tables.length; index++) {
      const other = index === leading ? undefined : tables[index]?.get(gridRow);

      if (other) {
        for (let cellIndex = 0; cellIndex < other.ownCells.length; cellIndex++) {
          ids.push(ensureCellId(other.ownCells[cellIndex], guid));
        }
      }
    }

    syncOwned(slice.row, ids.join(' '));
  });
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
 * @param {BlockOriginResolver} [getBlockOrigin] Answers where the block of a cell starts.
 */
export function reconcileAriaCells(
  tables: AriaCellsTable[], layout: AriaTreeLayout, columnHeadersCount: number, guid: string,
  getBlockOrigin: BlockOriginResolver | null = null,
): void {
  // The host is asked about blocks only when a body draws a spanning cell: one question per cell per draw is
  // a cost a grid without merged cells should not pay.
  const drawsBlocks = getBlockOrigin !== null &&
    tables.some(table => table.TBODY?.querySelector('td[rowspan], td[colspan]'));
  const context: ReconcileContext = { layout, getBlockOrigin: drawsBlocks ? getBlockOrigin : null };
  const byName = new Map(tables.map(table => [table.name, table]));
  const leading = ['start', 'main', 'end'].indexOf(getLeadingSegment(layout));

  (Object.keys(BAND_TABLES) as RowBand[]).forEach((band) => {
    const heads: Array<Map<number, RowSlice> | undefined> = [];
    const bodies: Array<Map<number, RowSlice> | undefined> = [];

    BAND_TABLES[band].forEach((tableName) => {
      const table = byName.get(tableName);
      const isDrawn = table !== undefined && table.columnFilter !== null && table.rowFilter !== null;

      heads.push(isDrawn && table.THEAD && !HIDDEN_HEADS.has(tableName)
        ? reconcileSection(table, table.THEAD, context, index => index - columnHeadersCount)
        : undefined);
      bodies.push(isDrawn && table.TBODY
        ? reconcileSection(table, table.TBODY, context, index => table.rowFilter!.renderedToSource(index))
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
 * Runs the pass for a grid: reads the layout and hands the tables over (`reconcileAriaCells`).
 *
 * @param {AriaTreeSettings} wtSettings The settings.
 * @param {AriaCellsTable[]} tables The master table and the overlay clones' tables.
 */
export function reconcileAriaTree(wtSettings: AriaTreeSettings, tables: AriaCellsTable[]): void {
  const layout = readAriaTreeLayout(wtSettings);

  if (layout) {
    reconcileAriaCells(
      tables,
      layout,
      (wtSettings.getSetting('columnHeaders') as unknown[]).length,
      wtSettings.getSetting('guid') as string,
      (row, column) => {
        // The `meta` source answers with the whole block, whatever part of it the tables render.
        const block = wtSettings.getSetting('onModifyGetCellCoords', row, column, false, 'meta');

        return Array.isArray(block) && Number.isInteger(block[0]) && Number.isInteger(block[1])
          ? [block[0], block[1]]
          : null;
      },
    );
  }
}
