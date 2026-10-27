/**
 * The geometry of a merged cell, in visual indexes.
 */
export interface MergedCellArea {
  row: number;
  col: number;
  rowspan: number;
  colspan: number;
}

/**
 * What `MergedCellsWidths` needs from the grid. Every index it passes is a visual index.
 */
export interface MergedCellsWidthsHost {
  /**
   * Returns every merged cell the grid draws, or an empty array when there are none.
   */
  getMergedAreas(): MergedCellArea[];
  /**
   * Tells whether a visual row is hidden.
   */
  isRowHidden(row: number): boolean;
  /**
   * Tells whether a visual column is hidden.
   */
  isColumnHidden(column: number): boolean;
  /**
   * Translates a visual column index to a physical one.
   */
  toPhysicalColumn(column: number): number | null;
  /**
   * Returns the width a column renders with before any stretch, including the demand this class
   * reports for it.
   */
  getColumnWidth(column: number): number;
  /**
   * Measures the content of the given cells and returns the widest one per visual column.
   */
  measureContentWidths(groups: Array<{ column: number, rows: number[] }>): Map<number, number>;
}

/**
 * Tells whether a merged cell spans more than one column.
 *
 * @param {*} colspan The `colspan` value.
 * @returns {boolean}
 */
export function isMultiColumnMerge(colspan: unknown): boolean {
  return Number(colspan) > 1;
}

/**
 * Tracks the width that merged cells spanning several columns need from the column they are drawn in.
 *
 * A merge spanning several columns cannot size one column from its text alone, so its demand is the
 * text width minus the widths of the other columns it spans, and it lands on the first column of the
 * span that is not hidden (the one MergeCells draws the merge from). Demands are read only from columns
 * to the right of that column, so resolving them from the rightmost column leftwards lets a merge that
 * starts inside another one's span be sized first.
 *
 * A fit is not free (it reads every merge and may measure text), so it runs only when something it
 * depends on changed: a column width, a merge's text, the set of merges, or the hidden rows.
 */
export class MergedCellsWidths {
  /**
   * The host grid.
   *
   * @type {MergedCellsWidthsHost}
   */
  #host: MergedCellsWidthsHost;
  /**
   * The demands, keyed by physical column.
   *
   * @type {Map<number, number>}
   */
  #demands: Map<number, number> = new Map();
  /**
   * The widest measured text of the merges that start in a column, keyed by the physical index of that
   * column and then by the merges' `colspan`. Merges that start in the same column with the same span
   * need the same room, so only the widest of them matters.
   *
   * @type {Map<number, Map<number, number>>}
   */
  #contentWidths: Map<number, Map<number, number>> = new Map();
  /**
   * `true` when an input of the demands changed since the last fit.
   *
   * @type {boolean}
   */
  #pending = false;
  /**
   * `true` when the merges or their rows may have changed in a way no column-level signal describes.
   * The next fit then re-measures every merge and reports the demands it dropped.
   *
   * @type {boolean}
   */
  #stale = false;
  /**
   * `true` when the grid had a merge spanning several columns at the last fit, or one was added since.
   *
   * @type {boolean}
   */
  #hasMultiColumnMerges = false;

  /**
   * Creates the tracker for one grid.
   *
   * @param {MergedCellsWidthsHost} host What the tracker reads from the grid.
   */
  constructor(host: MergedCellsWidthsHost) {
    this.#host = host;
  }

  /**
   * Tells whether the grid may have a merge spanning several columns. It answers `false` only when
   * none can exist, so a caller can skip reading cell meta per change.
   *
   * @returns {boolean}
   */
  mayHaveMultiColumnMerges(): boolean {
    return this.#hasMultiColumnMerges;
  }

  /**
   * Returns the demand of a column.
   *
   * @param {number} physicalColumn The physical column index.
   * @returns {number|undefined}
   */
  getWidth(physicalColumn: number): number | undefined {
    return this.#demands.get(physicalColumn);
  }

  /**
   * Records that some column widths changed, so the demands that read them are fitted again.
   */
  markWidthsChanged(): void {
    this.#pending = true;
  }

  /**
   * Records that the text of the merges starting in a column may have changed, or that the set of
   * merges covering it did.
   *
   * @param {number} visualColumn The visual column index.
   */
  invalidateColumn(visualColumn: number): void {
    const physicalColumn = this.#host.toPhysicalColumn(visualColumn);

    if (physicalColumn !== null) {
      this.#contentWidths.delete(physicalColumn);
    }

    this.#pending = true;
  }

  /**
   * Records that merges were added or removed in a column.
   *
   * @param {number} visualColumn The visual column index.
   */
  markMergesChanged(visualColumn: number): void {
    this.invalidateColumn(visualColumn);
    this.#hasMultiColumnMerges = true;
  }

  /**
   * Records that anything may have changed. The next fit re-measures every merge.
   */
  markStale(): void {
    this.#stale = true;
  }

  /**
   * Forgets every demand and every measurement.
   */
  clear(): void {
    this.#demands.clear();
    this.#contentWidths.clear();
    this.#pending = false;
    this.#stale = false;
    this.#hasMultiColumnMerges = false;
  }

  /**
   * Forgets the demand and the measurements of one column.
   *
   * @param {number} physicalColumn The physical column index.
   */
  clearColumn(physicalColumn: number): void {
    this.#demands.delete(physicalColumn);
    this.#contentWidths.delete(physicalColumn);
  }

  /**
   * Fits the demands again when an input changed since the last fit.
   *
   * @returns {boolean} `true` when any column's demand changed.
   */
  fit(): boolean {
    if (!this.#pending && !this.#stale) {
      return false;
    }

    if (this.#stale) {
      this.#contentWidths.clear();
    }

    this.#pending = false;
    this.#stale = false;

    const multiColumnAreas = this.#host.getMergedAreas().filter(({ colspan }) => isMultiColumnMerge(colspan));
    // Counted before the hidden rows are left out, so a merge that a hidden row keeps off screen still
    // counts: showing the row must reach a fit.
    const areas = multiColumnAreas.filter(area => this.#isDrawnArea(area));

    this.#hasMultiColumnMerges = multiColumnAreas.length > 0;

    if (areas.length === 0 && this.#demands.size === 0) {
      return false;
    }

    const previous = this.#demands;

    this.#demands = new Map();
    this.#resolveDemands(areas);

    return !haveSameEntries(previous, this.#demands);
  }

  /**
   * Computes every demand from the rightmost drawing column leftwards, writing each one before the
   * next is read, so a column's width already holds the demand of a merge drawn in it.
   *
   * @param {MergedCellArea[]} areas The merges to fit.
   */
  #resolveDemands(areas: MergedCellArea[]) {
    const contentWidths = this.#measureContent(areas);
    // Merges drawn from the same column with the same lead column and span need the same room, so
    // each such span is resolved once (a long list of group rows merged alike is one entry).
    const spansByTarget = new Map<number, Map<string, MergedCellArea>>();

    areas.forEach((area) => {
      const target = this.#getDrawingColumn(area);

      if (target !== null) {
        const spans = spansByTarget.get(target) ?? new Map<string, MergedCellArea>();

        spans.set(`${area.col}:${area.colspan}`, area);
        spansByTarget.set(target, spans);
      }
    });

    Array.from(spansByTarget)
      .sort(([left], [right]) => right - left)
      .forEach(([target, spans]) => {
        const physicalTarget = this.#host.toPhysicalColumn(target);
        let demand = 0;

        spans.forEach((area) => {
          demand = Math.max(demand, this.#getAreaDemand(area, target, contentWidths));
        });

        if (physicalTarget !== null && demand > 0) {
          this.#demands.set(physicalTarget, demand);
        }
      });
  }

  /**
   * Returns how much wider than the rest of its span the drawing column has to be for a merge's text.
   *
   * @param {MergedCellArea} area The merge.
   * @param {number} target The visual column the merge is drawn from.
   * @param {Map<string, number>} contentWidths The measured text widths, keyed by lead column and span.
   * @returns {number}
   */
  #getAreaDemand(area: MergedCellArea, target: number, contentWidths: Map<string, number>) {
    let demand = contentWidths.get(`${area.col}:${area.colspan}`) ?? 0;

    for (let column = area.col; column < area.col + area.colspan; column++) {
      if (column !== target) {
        demand -= this.#host.getColumnWidth(column);
      }
    }

    return demand;
  }

  /**
   * Returns the widest text of the merges per lead column and span, measuring only what is not cached.
   *
   * @param {MergedCellArea[]} areas The merges.
   * @returns {Map<string, number>} The widths keyed by `<visual lead column>:<colspan>`.
   */
  #measureContent(areas: MergedCellArea[]) {
    const widths = new Map<string, number>();
    const missing = new Map<number, Map<number, number[]>>();

    areas.forEach(({ row, col, colspan }) => {
      const physicalColumn = this.#host.toPhysicalColumn(col);
      const cached = physicalColumn === null ? undefined : this.#contentWidths.get(physicalColumn)?.get(colspan);

      if (cached !== undefined) {
        widths.set(`${col}:${colspan}`, cached);

        return;
      }

      const rowsByColumn = missing.get(colspan) ?? new Map<number, number[]>();
      const rows = rowsByColumn.get(col);

      if (rows === undefined) {
        rowsByColumn.set(col, [row]);
      } else {
        rows.push(row);
      }

      missing.set(colspan, rowsByColumn);
    });

    // The measurement holds one column per visual index, so each span is measured on its own.
    missing.forEach((rowsByColumn, colspan) => {
      const measured = this.#host.measureContentWidths(
        Array.from(rowsByColumn, ([column, rows]) => ({ column, rows }))
      );

      rowsByColumn.forEach((_rows, column) => {
        const width = measured.get(column) ?? 0;
        const physicalColumn = this.#host.toPhysicalColumn(column);

        widths.set(`${column}:${colspan}`, width);

        if (physicalColumn !== null) {
          const cache = this.#contentWidths.get(physicalColumn) ?? new Map<number, number>();

          cache.set(colspan, width);
          this.#contentWidths.set(physicalColumn, cache);
        }
      });
    });

    return widths;
  }

  /**
   * Tells whether a merge is drawn at all (not every row of it is hidden).
   *
   * @param {MergedCellArea} area The merge.
   * @returns {boolean}
   */
  #isDrawnArea(area: MergedCellArea) {
    for (let row = area.row; row < area.row + area.rowspan; row++) {
      if (!this.#host.isRowHidden(row)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Returns the first column of a merge's span that is not hidden, or `null` when all are.
   *
   * @param {MergedCellArea} area The merge.
   * @returns {number|null}
   */
  #getDrawingColumn(area: MergedCellArea) {
    for (let column = area.col; column < area.col + area.colspan; column++) {
      if (!this.#host.isColumnHidden(column)) {
        return column;
      }
    }

    return null;
  }
}

/**
 * Tells whether two maps hold the same keys with the same values.
 *
 * @param {Map} left One map.
 * @param {Map} right The other map.
 * @returns {boolean}
 */
function haveSameEntries(left: Map<number, number>, right: Map<number, number>) {
  if (left.size !== right.size) {
    return false;
  }

  for (const [key, value] of left) {
    if (right.get(key) !== value) {
      return false;
    }
  }

  return true;
}
