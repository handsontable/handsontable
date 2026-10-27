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
   * Translates a visual row index to a physical one.
   */
  toPhysicalRow(row: number): number | null;
  /**
   * Translates a visual column index to a physical one.
   */
  toPhysicalColumn(column: number): number | null;
  /**
   * Translates a physical column index to a visual one.
   */
  toVisualColumn(column: number): number | null;
  /**
   * Returns the width a column renders with before any stretch, including the demand this class
   * reports for it.
   */
  getColumnWidth(column: number): number;
  /**
   * Returns a cell's value formatted the way the renderer draws it.
   */
  formatCellText(row: number, column: number): unknown;
  /**
   * Measures the given texts as cells of their column and returns the widest one per visual column.
   */
  measureTexts(groups: Array<{ column: number, texts: Array<{ row: number, value: unknown }> }>): Map<number, number>;
}

/**
 * The result of a fit.
 */
export interface MergedCellsFitResult {
  /**
   * `true` when any column's demand changed.
   */
  changed: boolean;
  /**
   * The visual columns spanned by a merge that appeared or went away since the last fit. Their samples
   * were taken under the previous merges, so they need a rescan.
   */
  mergesChangedIn: number[];
}

const NO_CHANGE: MergedCellsFitResult = { changed: false, mergesChangedIn: [] };

/**
 * The merges that start in one column with one span, as `MergedCellsWidths` measures them together.
 */
interface MergeGroup {
  key: string;
  cacheKey: string;
  col: number;
  colspan: number;
  physicalColumn: number;
  rows: number[];
  physicalRows: number[];
  signature: string;
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
 *
 * The formatted text of each merge is kept by physical row and column, and the measured width of each
 * group of merges (same lead column, same span) by a signature of its rows and texts. Hiding or showing
 * rows changes which merges a group holds and re-measures only the groups that changed, from texts
 * already read; an edit re-reads one text.
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
   * The formatted text of each merge's first cell, keyed by physical column and then physical row.
   *
   * @type {Map<number, Map<number, unknown>>}
   */
  #texts: Map<number, Map<number, unknown>> = new Map();
  /**
   * A counter per physical column, raised whenever a text in the column is forgotten. It is part of
   * every group signature, so a group whose texts changed is measured again.
   *
   * @type {Map<number, number>}
   */
  #textVersions: Map<number, number> = new Map();
  /**
   * The measured width of each group of merges with the same lead column and span, keyed by
   * `<physical column>:<colspan>`, with the signature of the rows and texts it was measured from.
   *
   * @type {Map<string, { width: number, signature: string }>}
   */
  #groupWidths: Map<string, { width: number, signature: string }> = new Map();
  /**
   * Every merge seen at the last fit, keyed by its physical first row and column and its span. The
   * next fit compares the merges with it, so a merge that appeared or went away with no merge hook
   * (MergeCells' undo and redo, a settings rebuild) is reported. `null` until the first fit.
   *
   * @type {Map<string, { physicalColumn: number, colspan: number }> | null}
   */
  #areaKeys: Map<string, { physicalColumn: number, colspan: number }> | null = null;
  /**
   * `true` when the physical numbering may have changed, so the next fit takes the merges as the new
   * baseline instead of comparing them with keys that no longer mean the same cells.
   *
   * @type {boolean}
   */
  #rebaseline = false;
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
   * Records that the text of one merge's first cell may have changed.
   *
   * @param {number} visualRow The visual row index.
   * @param {number} visualColumn The visual column index.
   */
  invalidateCell(visualRow: number, visualColumn: number): void {
    const physicalRow = this.#host.toPhysicalRow(visualRow);
    const physicalColumn = this.#host.toPhysicalColumn(visualColumn);

    if (physicalRow !== null && physicalColumn !== null) {
      this.#texts.get(physicalColumn)?.delete(physicalRow);
      this.#bumpTextVersion(physicalColumn);
    }

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
      this.#texts.delete(physicalColumn);
      this.#bumpTextVersion(physicalColumn);
    }

    this.#pending = true;
  }

  /**
   * Records that merges were added or removed in a column through a merge hook. The hook's caller
   * queues the rescans that change needs, so the next fit takes the merges as a new baseline rather
   * than reporting them again (merges declared in the settings arrive after the init sweep's fit).
   *
   * @param {number} visualColumn The visual column index.
   */
  markMergesChanged(visualColumn: number): void {
    this.invalidateColumn(visualColumn);
    this.#hasMultiColumnMerges = true;
    this.#rebaseline = true;
  }

  /**
   * Records that the texts may have changed anywhere. The next fit reads and measures every merge's
   * text again.
   */
  markStale(): void {
    this.#stale = true;
  }

  /**
   * Records that the physical row or column numbering may have changed. Like `markStale()`, and the
   * next fit also takes the merges as a new baseline instead of reporting them as changed.
   */
  markRenumbered(): void {
    this.#stale = true;
    this.#rebaseline = true;
  }

  /**
   * Records that the styles may have changed: every group of merges is measured again from the kept
   * texts, without reading a cell.
   */
  markStylesChanged(): void {
    this.#groupWidths.clear();
    this.#pending = true;
  }

  /**
   * Forgets every demand and every measurement.
   */
  clear(): void {
    this.#demands.clear();
    this.#forgetTexts();
    this.#pending = false;
    this.#stale = false;
    this.#hasMultiColumnMerges = false;
    this.#areaKeys = null;
    this.#rebaseline = false;
  }

  /**
   * Forgets the demand and the measurements of one column.
   *
   * @param {number} physicalColumn The physical column index.
   */
  clearColumn(physicalColumn: number): void {
    this.#demands.delete(physicalColumn);
    this.#texts.delete(physicalColumn);
    this.#bumpTextVersion(physicalColumn);
  }

  /**
   * Fits the demands again when an input changed since the last fit.
   *
   * @returns {MergedCellsFitResult}
   */
  fit(): MergedCellsFitResult {
    if (!this.#pending && !this.#stale) {
      return NO_CHANGE;
    }

    if (this.#stale) {
      this.#forgetTexts();
    }

    this.#pending = false;
    this.#stale = false;

    const allAreas = this.#host.getMergedAreas();
    const mergesChangedIn = this.#diffAreas(allAreas);
    const multiColumnAreas = allAreas.filter(({ colspan }) => isMultiColumnMerge(colspan));
    // Counted before the hidden rows are left out, so a merge that a hidden row keeps off screen still
    // counts: showing the row must reach a fit.
    const areas = multiColumnAreas.filter(area => this.#isDrawnArea(area));

    this.#hasMultiColumnMerges = multiColumnAreas.length > 0;

    if (areas.length === 0 && this.#demands.size === 0) {
      return { changed: false, mergesChangedIn };
    }

    const previous = this.#demands;

    this.#demands = new Map();
    this.#resolveDemands(areas);

    return { changed: !haveSameEntries(previous, this.#demands), mergesChangedIn };
  }

  /**
   * Compares the merges with the ones the last fit saw and returns the visual columns spanned by a
   * merge that appeared or went away. The first fit, and the first after a renumbering, only record.
   *
   * @param {MergedCellArea[]} areas Every merge the grid draws.
   * @returns {number[]}
   */
  #diffAreas(areas: MergedCellArea[]) {
    const keys = new Map<string, { physicalColumn: number, colspan: number }>();

    areas.forEach(({ row, col, rowspan, colspan }) => {
      const physicalRow = this.#host.toPhysicalRow(row);
      const physicalColumn = this.#host.toPhysicalColumn(col);

      if (physicalRow !== null && physicalColumn !== null) {
        keys.set(`${physicalRow}:${physicalColumn}:${rowspan}:${colspan}`, { physicalColumn, colspan });
      }
    });

    const previous = this.#areaKeys;
    const columns = new Set<number>();

    this.#areaKeys = keys;

    if (previous === null || this.#rebaseline) {
      this.#rebaseline = false;

      return [];
    }

    const addSpan = ({ physicalColumn, colspan }: { physicalColumn: number, colspan: number }) => {
      const visualColumn = this.#host.toVisualColumn(physicalColumn);

      for (let offset = 0; visualColumn !== null && offset < colspan; offset++) {
        columns.add(visualColumn + offset);
      }
    };

    keys.forEach((area, key) => (previous.has(key) ? undefined : addSpan(area)));
    previous.forEach((area, key) => (keys.has(key) ? undefined : addSpan(area)));

    return Array.from(columns);
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
      // A hidden column draws no part of the merge, whatever hides it (HiddenColumns or the
      // CollapsibleColumns hiding map, whose columns keep their width).
      if (column !== target && !this.#host.isColumnHidden(column)) {
        demand -= this.#host.getColumnWidth(column);
      }
    }

    return demand;
  }

  /**
   * Returns the widest text of the merges per lead column and span. A group whose rows and texts did
   * not change since it was measured reuses its width; the others are measured from the kept texts,
   * reading only the texts that are not kept yet.
   *
   * @param {MergedCellArea[]} areas The merges.
   * @returns {Map<string, number>} The widths keyed by `<visual lead column>:<colspan>`.
   */
  #measureContent(areas: MergedCellArea[]) {
    const widths = new Map<string, number>();
    const toMeasure = new Map<number, MergeGroup[]>();

    this.#groupAreas(areas).forEach((group) => {
      const cached = this.#groupWidths.get(group.cacheKey);

      if (cached !== undefined && cached.signature === group.signature) {
        widths.set(group.key, cached.width);

        return;
      }

      const list = toMeasure.get(group.colspan) ?? [];

      list.push(group);
      toMeasure.set(group.colspan, list);
    });

    // The measurement holds one column per visual index, so each span is measured on its own.
    toMeasure.forEach((groups) => {
      const measured = this.#host.measureTexts(groups.map(group => ({
        column: group.col,
        texts: group.rows.map((row, index) => ({
          row,
          value: this.#getText(row, group.col, group.physicalRows[index], group.physicalColumn),
        })),
      })));

      groups.forEach((group) => {
        const width = measured.get(group.col) ?? 0;

        widths.set(group.key, width);
        this.#groupWidths.set(group.cacheKey, { width, signature: group.signature });
      });
    });

    return widths;
  }

  /**
   * Groups the merges by lead column and span, with the physical rows and the signature of each group.
   *
   * @param {MergedCellArea[]} areas The merges.
   * @returns {MergeGroup[]}
   */
  #groupAreas(areas: MergedCellArea[]) {
    const groups = new Map<string, MergeGroup>();

    areas.forEach(({ row, col, colspan }) => {
      const physicalRow = this.#host.toPhysicalRow(row);
      const physicalColumn = this.#host.toPhysicalColumn(col);

      if (physicalRow === null || physicalColumn === null) {
        return;
      }

      const key = `${col}:${colspan}`;
      const group = groups.get(key) ?? {
        key,
        cacheKey: `${physicalColumn}:${colspan}`,
        col,
        colspan,
        physicalColumn,
        rows: [],
        physicalRows: [],
        signature: '',
      };

      group.rows.push(row);
      group.physicalRows.push(physicalRow);
      groups.set(key, group);
    });

    groups.forEach((group) => {
      group.signature = this.#getSignature(group.physicalColumn, group.physicalRows);
    });

    return Array.from(groups.values());
  }

  /**
   * Returns a signature of the rows a group holds and of the texts kept for its column. Two equal
   * signatures mean the group would measure the same.
   *
   * @param {number} physicalColumn The physical lead column.
   * @param {number[]} physicalRows The physical rows of the group's merges.
   * @returns {string}
   */
  #getSignature(physicalColumn: number, physicalRows: number[]) {
    let sum = 0;
    let hash = 0;

    physicalRows.forEach((physicalRow) => {
      sum += physicalRow;
      // eslint-disable-next-line no-bitwise
      hash = (hash ^ Math.imul(physicalRow + 1, 2654435761)) | 0;
    });

    return `${this.#textVersions.get(physicalColumn) ?? 0}:${physicalRows.length}:${sum}:${hash}`;
  }

  /**
   * Returns the kept text of a merge's first cell, reading and keeping it when it is not kept yet.
   *
   * @param {number} row The visual row.
   * @param {number} column The visual column.
   * @param {number} physicalRow The physical row.
   * @param {number} physicalColumn The physical column.
   * @returns {*}
   */
  #getText(row: number, column: number, physicalRow: number, physicalColumn: number) {
    const texts = this.#texts.get(physicalColumn) ?? new Map<number, unknown>();

    if (!texts.has(physicalRow)) {
      texts.set(physicalRow, this.#host.formatCellText(row, column));
      this.#texts.set(physicalColumn, texts);
    }

    return texts.get(physicalRow);
  }

  /**
   * Raises the text version of a column, so every group that starts in it is measured again.
   *
   * @param {number} physicalColumn The physical column.
   */
  #bumpTextVersion(physicalColumn: number) {
    this.#textVersions.set(physicalColumn, (this.#textVersions.get(physicalColumn) ?? 0) + 1);
  }

  /**
   * Forgets every kept text and measured group width.
   */
  #forgetTexts() {
    this.#texts.clear();
    this.#groupWidths.clear();
    this.#textVersions.clear();
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
