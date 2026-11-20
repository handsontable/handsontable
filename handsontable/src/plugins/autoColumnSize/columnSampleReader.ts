import type { HotInstance } from '../../core/types';
import type { CellProperties } from '../../settings';
import { isFunction } from '../../helpers/function';
import { hasOnlyReadOnlyMetaListeners } from '../../utils/readOnlyMetaListeners';

/**
 * `HotInstance` augmented with the internal `_getDataAtColumnForRows` method, the bulk form of
 * `getDataAtCell()`. It exists on the Core runtime object but is intentionally NOT part of the public
 * `HotInstance` type; this plugin is an internal consumer and reaches it through this local type.
 */
type HotInstanceInternal = HotInstance & {
  _getDataAtColumnForRows(column: number, physicalRows: (number | null)[]): unknown[];
};

type CellRenderer = ReturnType<HotInstance['getCellRenderer']>;

/**
 * The fewest rows a reader is built for. Below it, building the reader (one meta extension, one renderer
 * lookup, the bulk read's setup) costs about as much as reading the rows one at a time.
 */
const MIN_READER_ROWS = 16;

/**
 * What the sampler needs to format one cell: its meta, its value, and its renderer.
 */
export interface ColumnSample {
  cellMeta: CellProperties;
  value: unknown;
  renderer: CellRenderer;
}

/**
 * Reads the cells of one column for the AutoColumnSize sampler, resolving once what every cell of the
 * column shares.
 *
 * A cell without stored meta resolves its meta as a new object of the column layer, extended by the
 * `beforeGetCellMeta`/`afterGetCellMeta` listeners and a `cells` function. With none of them, that
 * object is the same for every such cell of the column apart from its coordinates, so the reader
 * resolves it once, resolves its renderer once, and reads the values of those rows in one bulk call.
 * A cell with stored meta and a hidden row are left to the per-cell path.
 */
export class ColumnSampleReader {
  /**
   * The visual column the reader reads.
   */
  readonly visualColumn: number;
  /**
   * The Handsontable instance.
   */
  #hot: HotInstance;
  /**
   * The physical column the reader reads.
   */
  #physicalColumn: number;
  /**
   * The first visual row of the range.
   */
  #fromRow: number;
  /**
   * For each row of the range, the index of its value in `#values`, or -1 for a row read per cell.
   */
  #valueIndexes: Int32Array;
  /**
   * The values of the rows the reader covers, read in one call.
   */
  #values: unknown[];
  /**
   * The meta the column's cells share. Handed out as it is when `#sharesMeta` is set.
   */
  #columnMeta: CellProperties;
  /**
   * The renderer of the column's cells.
   */
  #renderer: CellRenderer;
  /**
   * Whether one meta object serves every row. Only when no code outside this plugin can write to it or
   * keep it: a `valueFormatter` and a `modifyAutoColumnSizeSeed` listener get the meta, and each of them
   * is entitled to the throwaway object of its own that a per-cell read gives. The built-in checkbox
   * listener on that hook only reads it (`markReadOnlyMetaListener()`), so it does not count.
   */
  #sharesMeta: boolean;

  /**
   * @param {object} options The reader's inputs.
   * @param {HotInstance} options.hot The Handsontable instance.
   * @param {number} options.visualColumn The visual column to read.
   * @param {number} options.physicalColumn The physical column to read.
   * @param {number} options.fromRow The first visual row of the range.
   * @param {Int32Array} options.valueIndexes The index of each row's value, or -1.
   * @param {Array} options.values The values of the rows the reader covers.
   * @param {object} options.columnMeta The meta the column's cells share.
   */
  constructor({ hot, visualColumn, physicalColumn, fromRow, valueIndexes, values, columnMeta }: {
    hot: HotInstance;
    visualColumn: number;
    physicalColumn: number;
    fromRow: number;
    valueIndexes: Int32Array;
    values: unknown[];
    columnMeta: CellProperties;
  }) {
    this.#hot = hot;
    this.visualColumn = visualColumn;
    this.#physicalColumn = physicalColumn;
    this.#fromRow = fromRow;
    this.#valueIndexes = valueIndexes;
    this.#values = values;
    this.#columnMeta = columnMeta;
    this.#renderer = hot.getCellRenderer(columnMeta);
    this.#sharesMeta = !isFunction(columnMeta.valueFormatter) &&
      !isFunction((this.#renderer as { valueFormatter?: unknown }).valueFormatter) &&
      hasOnlyReadOnlyMetaListeners(hot, 'modifyAutoColumnSizeSeed');
  }

  /**
   * Returns the meta, value, and renderer of a cell, or `null` when the cell is read per cell.
   *
   * @param {number} visualRow The visual row of the cell.
   * @param {number} physicalRow The physical row of the cell.
   * @param {number} visualColumn The visual column of the cell.
   * @returns {ColumnSample|null}
   */
  read(visualRow: number, physicalRow: number, visualColumn: number): ColumnSample | null {
    const position = visualRow - this.#fromRow;

    if (visualColumn !== this.visualColumn || position < 0 || position >= this.#valueIndexes.length) {
      return null;
    }

    const valueIndex = this.#valueIndexes[position];
    const metaManager = this.#hot._getMetaManager();

    // Checked again per row: a formatter run for an earlier row may have stored meta for this one.
    if (valueIndex === -1 || metaManager.getCellMetaIfExists(physicalRow, this.#physicalColumn) !== undefined) {
      return null;
    }

    let cellMeta = this.#columnMeta;

    if (!this.#sharesMeta) {
      cellMeta = metaManager.createTransientColumnMeta(this.#physicalColumn);
      // `Reflect` keeps the extension's untyped `prop` (an accessor function for some columns) without
      // narrowing the public `CellProperties#prop` type.
      Reflect.set(cellMeta, 'prop', this.#columnMeta.prop);
    }

    metaManager.stampCellMeta(cellMeta, physicalRow, this.#physicalColumn, {
      visualRow,
      visualColumn,
    });

    return { cellMeta, value: this.#values[valueIndex], renderer: this.#renderer };
  }
}

/**
 * Creates a reader for one column over a range of visual rows, or returns `null` when the cells of the
 * column do not share their meta (a meta listener or a `cells` function can change any of them), when the
 * range is too short to pay for the reader, or when no row of the range can be read in bulk.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @param {number} visualColumn The visual column to read.
 * @param {object} rowsRange The visual rows to read, with `from` and `to` indexes.
 * @returns {ColumnSampleReader|null}
 */
export function createColumnSampleReader(
  hot: HotInstance,
  visualColumn: number,
  rowsRange: { from: number, to: number },
): ColumnSampleReader | null {
  const physicalColumn = hot.toPhysicalColumn(visualColumn);

  if (
    physicalColumn === null ||
    rowsRange.to - rowsRange.from + 1 < MIN_READER_ROWS ||
    hot.columnIndexMapper.isHidden(physicalColumn) ||
    hot.hasHook('beforeGetCellMeta') ||
    hot.hasHook('afterGetCellMeta')
  ) {
    return null;
  }

  const metaManager = hot._getMetaManager();

  // The column layer carries a grid-level `cells` function too, through its prototype.
  if (isFunction(metaManager.getColumnMeta(physicalColumn).cells)) {
    return null;
  }

  const valueIndexes = new Int32Array(rowsRange.to - rowsRange.from + 1).fill(-1);
  const physicalRows: number[] = [];
  let firstVisualRow = -1;

  for (let visualRow = rowsRange.from; visualRow <= rowsRange.to; visualRow++) {
    const physicalRow = hot.toPhysicalRow(visualRow);

    // The rows the per-cell path never reads (hidden), and the cells it reads with their stored meta.
    if (
      physicalRow !== null &&
      !hot.rowIndexMapper.isHidden(physicalRow) &&
      metaManager.getCellMetaIfExists(physicalRow, physicalColumn) === undefined
    ) {
      if (firstVisualRow === -1) {
        firstVisualRow = visualRow;
      }

      valueIndexes[visualRow - rowsRange.from] = physicalRows.length;
      physicalRows.push(physicalRow);
    }
  }

  if (firstVisualRow === -1) {
    return null;
  }

  return new ColumnSampleReader({
    hot,
    visualColumn,
    physicalColumn,
    fromRow: rowsRange.from,
    valueIndexes,
    values: (hot as HotInstanceInternal)._getDataAtColumnForRows(visualColumn, physicalRows),
    // The extension runs once here, and with no listener and no `cells` function it changes nothing a
    // later row would resolve differently.
    columnMeta: hot.getCellMetaTransient(firstVisualRow, visualColumn),
  });
}
