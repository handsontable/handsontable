import {
  createCellSnapshot,
  createSheetSnapshot,
  type CellSnapshot,
  type SheetSnapshot,
} from './model';

/**
 * Fills a `SheetSnapshot` through 1-based row and column numbers, the coordinate system the
 * export code already reasons in. The snapshot itself is 0-based.
 */
export class SheetBuilder {
  /**
   * The sheet being built.
   */
  #sheet: SheetSnapshot;

  /**
   * Creates a builder for a new, visible sheet.
   */
  constructor(name: string) {
    this.#sheet = createSheetSnapshot(name);
  }

  /**
   * Returns the cell at 1-based coordinates, creating it and any missing rows on the way.
   */
  cell(rowNumber: number, colNumber: number): CellSnapshot {
    const { rows } = this.#sheet;

    while (rows.length < rowNumber) {
      rows.push([]);
    }

    const row = rows[rowNumber - 1];

    while (row.length < colNumber) {
      row.push(null);
    }

    if (row[colNumber - 1] === null) {
      row[colNumber - 1] = createCellSnapshot();
    }

    return row[colNumber - 1] as CellSnapshot;
  }

  /**
   * Sets a row height in points.
   */
  setRowHeight(rowNumber: number, points: number): void {
    this.#fill(this.#sheet.rowHeights, rowNumber);
    this.#sheet.rowHeights[rowNumber - 1] = points;
  }

  /**
   * Marks a row hidden.
   */
  hideRow(rowNumber: number): void {
    this.#sheet.hiddenRows.push(rowNumber - 1);
  }

  /**
   * Sets a column width in Excel character units.
   */
  setColWidth(colNumber: number, width: number): void {
    this.#fill(this.#sheet.colWidths, colNumber);
    this.#sheet.colWidths[colNumber - 1] = width;
  }

  /**
   * Marks a column hidden.
   */
  hideCol(colNumber: number): void {
    this.#sheet.hiddenCols.push(colNumber - 1);
  }

  /**
   * Records a merged area from 1-based inclusive corners.
   */
  merge(startRow: number, startCol: number, endRow: number, endCol: number): void {
    this.#sheet.merges.push({
      row: startRow - 1,
      col: startCol - 1,
      rowspan: endRow - startRow + 1,
      colspan: endCol - startCol + 1,
    });
  }

  /**
   * Freezes `cols` columns and `rows` rows. Both zero means no freeze.
   */
  freeze(cols: number, rows: number): void {
    this.#sheet.freeze = cols > 0 || rows > 0 ? { rows, cols } : null;
  }

  /**
   * Sets the sheet's layout direction.
   */
  setRtl(rtl: boolean): void {
    this.#sheet.rtl = rtl;
  }

  /**
   * Sets the sheet visibility.
   */
  setState(state: SheetSnapshot['state']): void {
    this.#sheet.state = state;
  }

  /**
   * Enables sheet protection. An empty password means none.
   */
  protect(password: string, options: Record<string, boolean> = {}): void {
    this.#sheet.protection = { enabled: true, password: password === '' ? null : password, options };
  }

  /**
   * Adds a conditional formatting block over a range reference.
   */
  addConditionalFormatting(ref: string, rules: unknown[]): void {
    this.#sheet.conditionalFormatting.push({ ref, rules });
  }

  /**
   * Returns the sheet built so far. Further builder calls keep mutating the same object.
   */
  toSnapshot(): SheetSnapshot {
    return this.#sheet;
  }

  /**
   * Pads a sparse array with `null` up to a 1-based index.
   */
  #fill(target: Array<number | null>, upTo: number): void {
    while (target.length < upTo) {
      target.push(null);
    }
  }
}
