import type { HotInstance } from '../../core/types';
import type { default as CellRange } from '../../3rdparty/walkontable/src/cell/range';
import MergedCellCoords from './cellCoords';
import { rangeEach, clamp } from '../../helpers/number';
import { warn } from '../../helpers/console';
import { arrayEach } from '../../helpers/array';
import { toSingleLine } from '../../helpers/templateLiteralTag';
import type { MergeCells } from './mergeCells';

/**
 * Defines a container object for the merged cells.
 *
 * @private
 * @class MergedCellsCollection
 */
class MergedCellsCollection {
  /**
   * Reference to the Merge Cells plugin.
   *
   * @type {MergeCells}
   */
  plugin;
  /**
   * Array of merged cells.
   *
   * @type {MergedCellCoords[]}
   */
  mergedCells: MergedCellCoords[] = [];
  /**
   * Matrix of cells (row, col) that points to the instances of the MergedCellCoords objects.
   *
   * @type {Array}
   */
  mergedCellsMatrix = new Map<number, Map<number, MergedCellCoords>>();
  /**
   * The Handsontable instance.
   *
   * @type {Handsontable}
   */
  declare hot: HotInstance;

  /**
   * Initializes the cells collection with references to the MergeCells plugin and the Handsontable instance.
   */
  constructor(mergeCellsPlugin: MergeCells) {
    this.plugin = mergeCellsPlugin;
    this.hot = mergeCellsPlugin.hot;
  }

  /**
   * Get a warning message for when the declared merged cell data overlaps already existing merged cells.
   *
   * @param {{ row: number, col: number, rowspan: number, colspan: number }} mergedCell Object containing information
   * about the merged cells that was about to be added.
   * @returns {string}
   */
  static IS_OVERLAPPING_WARNING({ row, col }: { row: number, col: number }) {
    return toSingleLine`The merged cell declared at [${row}, ${col}], overlaps\x20
      with the other declared merged cell. The overlapping merged cell was not added to the table, please\x20
      fix your setup.`;
  }

  /**
   * Get a merged cell from the container, based on the provided arguments. You can provide either the "starting coordinates"
   * of a merged cell, or any coordinates from the body of the merged cell.
   *
   * @param {number} row Row index.
   * @param {number} column Column index.
   * @returns {MergedCellCoords|boolean} Returns a wanted merged cell on success and `false` on failure.
   */
  get(row: number, column: number) {
    if (!this.mergedCellsMatrix.has(row)) {
      return false;
    }

    return this.mergedCellsMatrix.get(row)!.get(column) ?? false;
  }

  /**
   * Get the first-found merged cell containing the provided range.
   *
   * @param {CellRange} range The range to search merged cells for.
   * @returns {MergedCellCoords | false}
   */
  getByRange(range: CellRange) {
    const { row: rowStart, col: columnStart } = range.getTopStartCorner();
    const { row: rowEnd, col: columnEnd } = range.getBottomEndCorner();

    if (rowStart === null || rowEnd === null || columnStart === null || columnEnd === null) {
      return false;
    }

    const mergedCellsLength = this.mergedCells.length;
    let result: MergedCellCoords | false = false;

    for (let i = 0; i < mergedCellsLength; i++) {
      const mergedCell = this.mergedCells[i];
      const { row, col, rowspan, colspan } = mergedCell;

      if (
        row >= rowStart && row + rowspan - 1 <= rowEnd &&
        col >= columnStart && col + colspan - 1 <= columnEnd
      ) {
        result = mergedCell;

        break;
      }
    }

    return result;
  }

  /**
   * Get the merged cells that cover any cell of the provided visual row. The cost scales with the
   * number of merged cells covering the row, not with the number of table columns. Merges purged
   * from the lookup matrix (fully hidden) are not returned.
   *
   * @param {number} row Visual row index.
   * @returns {MergedCellCoords[]} Array of merged cells covering the row.
   */
  getByVisualRow(row: number) {
    const rowEntries = this.mergedCellsMatrix.get(row);

    if (!rowEntries) {
      return [];
    }

    return Array.from(new Set(rowEntries.values()));
  }

  /**
   * Get the merged cells that cover any cell of the provided visual column. The cost scales with
   * the total number of merged cells, not with the number of table rows. Merges purged from the
   * lookup matrix (fully hidden) are not returned.
   *
   * @param {number} column Visual column index.
   * @returns {MergedCellCoords[]} Array of merged cells covering the column.
   */
  getByVisualColumn(column: number) {
    const result: MergedCellCoords[] = [];

    for (let i = 0; i < this.mergedCells.length; i++) {
      const mergedCell = this.mergedCells[i];

      if (
        mergedCell.col <= column && column <= mergedCell.col + mergedCell.colspan - 1 &&
        // The lookup matrix is the authority on visibility (see `getWithinRange`).
        this.get(mergedCell.row, mergedCell.col) === mergedCell
      ) {
        result.push(mergedCell);
      }
    }

    return result;
  }

  /**
   * Filters merge cells objects provided by users from overlapping cells.
   *
   * @param {{ row: number, col: number, rowspan: number, colspan: number }} mergedCellsInfo The merged cell information object.
   * Has to contain `row`, `col`, `colspan` and `rowspan` properties.
   * @returns {Array<{ row: number, col: number, rowspan: number, colspan: number }>}
   */
  filterOverlappingMergeCells(mergedCellsInfo: { row: number, col: number, rowspan: number, colspan: number }[]) {
    const occupiedCells = new Set();

    this.mergedCells.forEach((mergedCell) => {
      const { row, col, colspan, rowspan } = mergedCell;

      for (let r = row; r < row + rowspan; r++) {
        for (let c = col; c < col + colspan; c++) {
          occupiedCells.add(`r${r},c${c}`);
        }
      }
    });

    type MergeCellInfo = { row: number, col: number, rowspan: number, colspan: number };
    const filteredMergeCells = mergedCellsInfo.filter((mergedCell: MergeCellInfo) => {
      const { row, col, colspan, rowspan } = mergedCell;
      const localOccupiedCells = new Set();
      let isOverlapping = false;

      for (let r = row; r < row + rowspan; r++) {
        for (let c = col; c < col + colspan; c++) {
          const cellId = `r${r},c${c}`;

          if (occupiedCells.has(cellId)) {
            warn(MergedCellsCollection.IS_OVERLAPPING_WARNING(mergedCell));
            isOverlapping = true;
            break;
          }

          localOccupiedCells.add(cellId);
        }

        if (isOverlapping) {
          break;
        }
      }

      if (!isOverlapping) {
        localOccupiedCells.forEach(cell => occupiedCells.add(cell));
      }

      return !isOverlapping;
    });

    return filteredMergeCells;
  }

  /**
   * Get the merged cells contained in the provided range. Each merged cell is returned once, even
   * when it spans multiple cells of the range. The cost scales with the number of merged cells in
   * the collection, not with the area of the range.
   *
   * @param {CellRange} range The range to search merged cells in.
   * @param {boolean} [countPartials=false] If set to `true`, all the merged cells overlapping the range will be taken into calculation.
   * @returns {MergedCellCoords[]} Array of found merged cells, ordered by their first covered cell in row-major order.
   */
  getWithinRange(range: CellRange, countPartials = false) {
    const { row: rowStart, col: columnStart } = range.getTopStartCorner();
    const { row: rowEnd, col: columnEnd } = range.getBottomEndCorner();

    if (rowStart === null || rowEnd === null || columnStart === null || columnEnd === null) {
      return [];
    }

    const result: MergedCellCoords[] = [];

    for (let i = 0; i < this.mergedCells.length; i++) {
      const mergedCell = this.mergedCells[i];
      const { row, col, rowspan, colspan } = mergedCell;
      const isWithin = countPartials
        ? row <= rowEnd && row + rowspan - 1 >= rowStart &&
          col <= columnEnd && col + colspan - 1 >= columnStart
        : row >= rowStart && row <= rowEnd && col >= columnStart && col <= columnEnd;

      // The lookup matrix is the authority on visibility: merges whose whole visible span is
      // hidden are purged from the matrix while staying in the `mergedCells` list, and their
      // visual coordinates may be stale.
      if (isWithin && this.get(row, col) === mergedCell) {
        result.push(mergedCell);
      }
    }

    if (result.length > 1) {
      result.sort((cellA, cellB) => {
        return (Math.max(cellA.row, rowStart) - Math.max(cellB.row, rowStart)) ||
          (Math.max(cellA.col, columnStart) - Math.max(cellB.col, columnStart));
      });
    }

    return result;
  }

  /**
   * Add a merged cell to the container.
   *
   * @param {object} mergedCellInfo The merged cell information object. Has to contain `row`, `col`, `colspan` and `rowspan` properties.
   * @param {boolean} [auto=false] `true` if called internally by the plugin (usually in batch).
   * @returns {MergedCellCoords|boolean} Returns the new merged cell on success and `false` on failure.
   */
  add(mergedCellInfo: { row: number, col: number, rowspan: number, colspan: number }, auto = false) {
    const row = mergedCellInfo.row;
    const column = mergedCellInfo.col;
    const rowspan = mergedCellInfo.rowspan;
    const colspan = mergedCellInfo.colspan;
    const newMergedCell = new MergedCellCoords(row, column, rowspan, colspan,
      this.hot._createCellCoords, this.hot._createCellRange);
    const alreadyExists = this.get(row, column);
    const isOverlapping = auto ? false : this.isOverlapping(newMergedCell);

    if (!alreadyExists && !isOverlapping) {
      if (this.hot) {
        newMergedCell.normalize(this.hot);
      }

      this.mergedCells.push(newMergedCell);
      this.#addMergedCellToMatrix(newMergedCell);

      return newMergedCell;
    }

    if (isOverlapping) {
      warn(MergedCellsCollection.IS_OVERLAPPING_WARNING(newMergedCell));
    }

    return false;
  }

  /**
   * Remove a merged cell from the container. You can provide either the "starting coordinates"
   * of a merged cell, or any coordinates from the body of the merged cell.
   *
   * @param {number} row Row index.
   * @param {number} column Column index.
   * @returns {MergedCellCoords|boolean} Returns the removed merged cell on success and `false` on failure.
   */
  remove(row: number, column: number) {
    const mergedCell = this.get(row, column);
    const mergedCellIndex = mergedCell ? this.mergedCells.indexOf(mergedCell) : -1;

    if (mergedCell && mergedCellIndex !== -1) {
      this.mergedCells.splice(mergedCellIndex, 1);
      this.#removeMergedCellFromMatrix(mergedCell);

      return mergedCell;
    }

    return false;
  }

  /**
   * Clear all the merged cells.
   */
  clear() {
    arrayEach(this.mergedCells, ({ row, col, rowspan, colspan }) => {
      rangeEach(row, row + rowspan, (r) => {
        rangeEach(col, col + colspan, (c) => {
          const TD = this.hot.getCell(r, c);

          if (TD) {
            TD.removeAttribute('rowspan');
            TD.removeAttribute('colspan');
            TD.style.display = '';
          }
        });
      });
    });

    this.mergedCells.length = 0;
    this.mergedCellsMatrix = new Map<number, Map<number, MergedCellCoords>>();
  }

  /**
   * Check if the provided merged cell overlaps with the others already added.
   *
   * @param {MergedCellCoords} mergedCell The merged cell to check against all others in the container.
   * @returns {boolean} `true` if the provided merged cell overlaps with the others, `false` otherwise.
   */
  isOverlapping(mergedCell: MergedCellCoords) {
    const mergedCellRange = mergedCell.getRange();

    if (!mergedCellRange) {
      return false;
    }

    for (let i = 0; i < this.mergedCells.length; i++) {
      const otherMergedCell = this.mergedCells[i];
      const otherMergedCellRange = otherMergedCell.getRange();

      const overlappingRange = otherMergedCellRange as CellRange & { overlaps(range: CellRange): boolean };

      if (otherMergedCellRange && overlappingRange.overlaps(mergedCellRange)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check whether the provided row/col coordinates direct to a first not hidden cell within merge area.
   *
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @returns {boolean}
   */
  isFirstRenderableMergedCell(row: number, column: number) {
    const mergeParent = this.get(row, column);

    if (!mergeParent) {
      return false;
    }

    const {
      row: mergeRow,
      col: mergeColumn,
      rowspan,
      colspan,
    } = mergeParent;
    const overlayName = this.hot.view.getActiveOverlayName() as string;
    const firstRenderedRow = ['top', 'top_inline_start_corner']
      .includes(overlayName) ? 0 : this.hot.getFirstRenderedVisibleRow();
    const firstRenderedColumn = ['inline_start', 'top_inline_start_corner', 'bottom_inline_start_corner']
      .includes(overlayName) ? 0 : this.hot.getFirstRenderedVisibleColumn();

    const mergeCellsTopRow = clamp(firstRenderedRow, mergeRow, mergeRow + rowspan - 1);
    const mergeCellsStartColumn = clamp(firstRenderedColumn, mergeColumn, mergeColumn + colspan - 1);

    return this.hot.rowIndexMapper.getNearestNotHiddenIndex(mergeCellsTopRow, 1) === row &&
      this.hot.columnIndexMapper.getNearestNotHiddenIndex(mergeCellsStartColumn, 1) === column;
  }

  /**
   * Get the first renderable coords of the merged cell at the provided coordinates.
   *
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @returns {CellCoords} A `CellCoords` object with the coordinates to the first renderable cell within the
   *                        merged cell.
   */
  getFirstRenderableCoords(row: number, column: number) {
    const mergeParent = this.get(row, column);

    if (!mergeParent || this.isFirstRenderableMergedCell(row, column)) {
      return this.hot._createCellCoords(row, column);
    }

    const firstRenderableRow =
      this.hot.rowIndexMapper.getNearestNotHiddenIndex(mergeParent.row, 1) ?? mergeParent.row;
    const firstRenderableColumn =
      this.hot.columnIndexMapper.getNearestNotHiddenIndex(mergeParent.col, 1) ?? mergeParent.col;

    return this.hot._createCellCoords(firstRenderableRow, firstRenderableColumn);
  }

  /**
   * Gets the start-most visual column index that do not intersect with other merged cells within the provided range.
   *
   * @param {CellRange} range The range to search within.
   * @param {number} visualColumnIndex The visual column index to start the search from.
   * @returns {number}
   */
  getStartMostColumnIndex(range: CellRange, visualColumnIndex: number) {
    return this.#findNonIntersectingIndex(range, 'col', -1, visualColumnIndex);
  }

  /**
   * Gets the end-most visual column index that do not intersect with other merged cells within the provided range.
   *
   * @param {CellRange} range The range to search within.
   * @param {number} visualColumnIndex The visual column index to start the search from.
   * @returns {number}
   */
  getEndMostColumnIndex(range: CellRange, visualColumnIndex: number) {
    return this.#findNonIntersectingIndex(range, 'col', 1, visualColumnIndex);
  }

  /**
   * Gets the top-most visual row index that do not intersect with other merged cells within the provided range.
   *
   * @param {CellRange} range The range to search within.
   * @param {number} visualRowIndex The visual row index to start the search from.
   * @returns {number}
   */
  getTopMostRowIndex(range: CellRange, visualRowIndex: number) {
    return this.#findNonIntersectingIndex(range, 'row', -1, visualRowIndex);
  }

  /**
   * Gets the bottom-most visual row index that do not intersect with other merged cells within the provided range.
   *
   * @param {CellRange} range The range to search within.
   * @param {number} visualRowIndex The visual row index to start the search from.
   * @returns {number}
   */
  getBottomMostRowIndex(range: CellRange, visualRowIndex: number) {
    return this.#findNonIntersectingIndex(range, 'row', 1, visualRowIndex);
  }

  /**
   * Collects, per range line along the provided axis, the contributions of the merged cells that
   * intersect the provided range. A line is a single row (for the `row` axis) or a single column
   * (for the `col` axis) of the range. Each merged cell contributes, to every line it covers, its
   * scan extent along the axis (the last covered index when scanning forward, the first when
   * scanning backward) and the number of range cells it covers within the line. Lines without any
   * merged cell are absent from the returned map. Only merged cells present in the lookup matrix
   * are considered — merges purged from the matrix (fully hidden) are skipped.
   *
   * @param {CellRange} range The range to search within.
   * @param {'row' | 'col'} axis The axis to search within.
   * @param {number} scanDirection The direction to scan the range. `1` for forward, `-1` for backward.
   * @returns {Map<number, { extents: Set<number>, coveredCells: number }>} Map keyed by the line index.
   */
  #collectLineContributions(range: CellRange, axis: 'row' | 'col', scanDirection: number) {
    const { row: rangeStartRow, col: rangeStartColumn } = range.getTopStartCorner();
    const { row: rangeEndRow, col: rangeEndColumn } = range.getBottomEndCorner();
    const startRow = rangeStartRow ?? 0;
    const startColumn = rangeStartColumn ?? 0;
    const endRow = rangeEndRow ?? 0;
    const endColumn = rangeEndColumn ?? 0;
    const isRowAxis = axis === 'row';
    const lineStart = isRowAxis ? startRow : startColumn;
    const lineEnd = isRowAxis ? endRow : endColumn;
    const crossStart = isRowAxis ? startColumn : startRow;
    const crossEnd = isRowAxis ? endColumn : endRow;
    const lines = new Map<number, { extents: Set<number>, coveredCells: number }>();

    for (let i = 0; i < this.mergedCells.length; i++) {
      const mergedCell = this.mergedCells[i];
      const mergeLineStart = isRowAxis ? mergedCell.row : mergedCell.col;
      const mergeLineEnd = mergeLineStart + (isRowAxis ? mergedCell.rowspan : mergedCell.colspan) - 1;
      const mergeCrossStart = isRowAxis ? mergedCell.col : mergedCell.row;
      const mergeCrossEnd = mergeCrossStart + (isRowAxis ? mergedCell.colspan : mergedCell.rowspan) - 1;

      if (
        mergeLineEnd < lineStart || mergeLineStart > lineEnd ||
        mergeCrossEnd < crossStart || mergeCrossStart > crossEnd ||
        // The lookup matrix is the authority on visibility: merges purged from the matrix
        // (fully hidden) keep stale visual coordinates in the `mergedCells` list.
        this.get(mergedCell.row, mergedCell.col) !== mergedCell
      ) {
        continue;
      }

      const extent = scanDirection === 1 ? mergeLineEnd : mergeLineStart;
      const coveredCells = Math.min(mergeCrossEnd, crossEnd) - Math.max(mergeCrossStart, crossStart) + 1;
      const firstLine = Math.max(mergeLineStart, lineStart);
      const lastLine = Math.min(mergeLineEnd, lineEnd);

      for (let line = firstLine; line <= lastLine; line++) {
        let entry = lines.get(line);

        if (!entry) {
          entry = { extents: new Set(), coveredCells: 0 };
          lines.set(line, entry);
        }

        entry.extents.add(extent);
        entry.coveredCells += coveredCells;
      }
    }

    return lines;
  }

  /**
   * Finds the nearest index along the provided axis that does not intersect with any merged cell
   * within the provided range. The range's lines are conceptually scanned in the provided
   * direction; a line emits a candidate index when all of its cells agree on a single index — its
   * own index when no merged cell touches it, or the shared scan extent when merged cells cover
   * it uniformly. The first emitted candidate located at or past `visualIndex` (in the scan
   * direction) wins. The cost scales with the number of merged cells intersecting the range, not
   * with the area of the range.
   *
   * @param {CellRange} range The range to search within.
   * @param {'row' | 'col'} axis The axis to search within.
   * @param {number} scanDirection The direction to scan the range. `1` for forward, `-1` for backward.
   * @param {number} visualIndex The visual row/column index the search relates to.
   * @returns {number} The found visual index, or `visualIndex` when every line intersects a merged cell.
   */
  #findNonIntersectingIndex(range: CellRange, axis: 'row' | 'col', scanDirection: number, visualIndex: number) {
    const { row: rangeStartRow, col: rangeStartColumn } = range.getTopStartCorner();
    const { row: rangeEndRow, col: rangeEndColumn } = range.getBottomEndCorner();
    const isRowAxis = axis === 'row';
    const lineStart = (isRowAxis ? rangeStartRow : rangeStartColumn) ?? 0;
    const lineEnd = (isRowAxis ? rangeEndRow : rangeEndColumn) ?? 0;
    const crossLength = isRowAxis
      ? ((rangeEndColumn ?? 0) - (rangeStartColumn ?? 0) + 1)
      : ((rangeEndRow ?? 0) - (rangeStartRow ?? 0) + 1);
    const matches = (index: number) => (scanDirection === 1 ? index >= visualIndex : index <= visualIndex);
    const lines = this.#collectLineContributions(range, axis, scanDirection);
    const touchedLines = Array.from(lines.keys())
      .sort((lineA, lineB) => (lineA - lineB) * scanDirection);

    // The first merge-touched line (in scan order) whose cells all agree on a single index
    // that lies at or past `visualIndex`.
    let touchedMatchLine = null;
    let touchedMatchIndex = 0;

    for (let i = 0; i < touchedLines.length; i++) {
      const line = touchedLines[i];
      const { extents, coveredCells } = lines.get(line)!;

      // Cells not covered by any merged cell contribute the line's own index.
      if (coveredCells < crossLength) {
        extents.add(line);
      }

      if (extents.size === 1) {
        const candidate = extents.values().next().value!;

        if (matches(candidate)) {
          touchedMatchLine = line;
          touchedMatchIndex = candidate;
          break;
        }
      }
    }

    // The first merge-free line in scan order that lies at or past `visualIndex`; such a line
    // always emits its own index.
    let freeMatchLine = scanDirection === 1
      ? Math.max(lineStart, visualIndex)
      : Math.min(lineEnd, visualIndex);

    while (freeMatchLine >= lineStart && freeMatchLine <= lineEnd && lines.has(freeMatchLine)) {
      freeMatchLine += scanDirection;
    }

    const hasFreeMatch = freeMatchLine >= lineStart && freeMatchLine <= lineEnd;

    if (touchedMatchLine === null) {
      return hasFreeMatch ? freeMatchLine : visualIndex;
    }

    if (!hasFreeMatch || (touchedMatchLine - freeMatchLine) * scanDirection <= 0) {
      return touchedMatchIndex;
    }

    return freeMatchLine;
  }

  /**
   * Shift the merged cell in the direction and by an offset defined in the arguments.
   *
   * @param {string} direction `right`, `left`, `up` or `down`.
   * @param {number} index Index where the change, which caused the shifting took place.
   * @param {number} count Number of rows/columns added/removed in the preceding action.
   */
  shiftCollections(direction: string, index: number, count: number) {
    const shiftVector = [0, 0];

    switch (direction) {
      case 'right':
        shiftVector[0] += count;
        break;

      case 'left':
        shiftVector[0] -= count;
        break;

      case 'down':
        shiftVector[1] += count;
        break;

      case 'up':
        shiftVector[1] -= count;
        break;

      default:
    }

    const removedMergedCells: MergedCellCoords[] = [];

    this.mergedCells.forEach((currentMerge) => {
      currentMerge.shift(shiftVector, index);

      if (currentMerge.removed) {
        removedMergedCells.push(currentMerge);
      }
    });

    removedMergedCells.forEach((removedMerge) => {
      this.mergedCells.splice(this.mergedCells.indexOf(removedMerge), 1);
    });

    this.mergedCellsMatrix.clear();

    this.mergedCells.forEach((currentMerge) => {
      this.#addMergedCellToMatrix(currentMerge);
    });
  }

  /**
   * Capture the physical indexes covered by every merged cell along an axis.
   *
   * Used by the manual row/column move and column freeze integrations to translate
   * merges through a reorder: the captured spans pin each merge to the underlying
   * data so the merge can be repositioned (and split, if a non-contiguous run
   * results) after the visual sequence changes.
   *
   * @param {'column' | 'row'} axis Which axis the upcoming reorder targets.
   * @returns {Map<MergedCellCoords, number[]>} Map of merge -> physical indexes along the axis.
   */
  capturePhysicalSpans(axis: 'column' | 'row'): Map<MergedCellCoords, number[]> {
    const isColumn = axis === 'column';
    const indexProp = isColumn ? 'col' : 'row';
    const spanProp = isColumn ? 'colspan' : 'rowspan';
    const toPhysical = isColumn
      ? (visualIndex: number) => this.hot.toPhysicalColumn(visualIndex)
      : (visualIndex: number) => this.hot.toPhysicalRow(visualIndex);
    const snapshot = new Map<MergedCellCoords, number[]>();

    this.mergedCells.forEach((merge) => {
      const physicals = [];

      for (let i = 0; i < merge[spanProp]; i++) {
        physicals.push(toPhysical(merge[indexProp] + i));
      }

      snapshot.set(merge, physicals);
    });

    return snapshot;
  }

  /**
   * Group an ascending list of integers into contiguous runs.
   *
   * @param {number[]} sortedAscending Already-sorted ascending visual indexes.
   * @returns {Array<{ start: number, length: number }>}
   */
  static detectContiguousRuns(sortedAscending: number[]): Array<{ start: number; length: number }> {
    if (sortedAscending.length === 0) {
      return [];
    }

    const runs = [];
    let runStart = sortedAscending[0];
    let runLength = 1;

    for (let i = 1; i < sortedAscending.length; i++) {
      if (sortedAscending[i] === sortedAscending[i - 1] + 1) {
        runLength += 1;
      } else {
        runs.push({ start: runStart, length: runLength });
        runStart = sortedAscending[i];
        runLength = 1;
      }
    }

    runs.push({ start: runStart, length: runLength });

    return runs;
  }

  /**
   * Translate the merged cells collection after a manual row/column reorder, splitting
   * merges whose physical indexes are no longer contiguous in the new visual order.
   *
   * Note: single-cell fragments (`colspan === 1 && rowspan === 1`) are dropped because
   * they no longer represent a merge. The user-facing behavior (auto-split + silent drop
   * of singletons) is documented in `docs/content/guides/cell-features/merge-cells/merge-cells.md`
   * under "Behavior during row/column reorder and column freeze".
   *
   * @param {'column' | 'row'} axis Axis that was reordered.
   * @param {Map<MergedCellCoords, number[]>} snapshot Snapshot taken before the reorder.
   */
  translateAfterAxisMove(axis: 'column' | 'row', snapshot: Map<MergedCellCoords, number[]>): void {
    const isColumn = axis === 'column';
    const indexProp = isColumn ? 'col' : 'row';
    const spanProp = isColumn ? 'colspan' : 'rowspan';
    const otherIndexProp = isColumn ? 'row' : 'col';
    const otherSpanProp = isColumn ? 'rowspan' : 'colspan';
    const toVisual = isColumn
      ? (physicalIndex: number) => this.hot.toVisualColumn(physicalIndex)
      : (physicalIndex: number) => this.hot.toVisualRow(physicalIndex);
    const replacements: Array<{ row: number; col: number; rowspan: number; colspan: number }> = [];

    this.mergedCells.forEach((merge) => {
      const physicals = snapshot.get(merge);

      if (!physicals) {
        replacements.push({
          row: merge.row,
          col: merge.col,
          rowspan: merge.rowspan,
          colspan: merge.colspan,
        });

        return;
      }

      const newVisuals = physicals
        .map(toVisual)
        .filter((visualIndex): visualIndex is number => visualIndex !== null && visualIndex >= 0)
        .sort((a, b) => a - b);

      if (newVisuals.length === 0) {
        return;
      }

      MergedCellsCollection.detectContiguousRuns(newVisuals).forEach((run) => {
        const replacement = {
          [indexProp]: run.start,
          [spanProp]: run.length,
          [otherIndexProp]: merge[otherIndexProp],
          [otherSpanProp]: merge[otherSpanProp],
        };

        if (replacement.colspan === 1 && replacement.rowspan === 1) {
          return;
        }

        replacements.push(replacement as { row: number; col: number; rowspan: number; colspan: number });
      });
    });

    this.mergedCells.length = 0;
    this.mergedCellsMatrix.clear();

    replacements.forEach((info) => {
      this.add(info, true);
    });
  }

  /**
   * Adds a merged cell to the matrix.
   *
   * @param {MergedCellCoords} mergedCell The merged cell to add.
   */
  #addMergedCellToMatrix(mergedCell: MergedCellCoords) {
    for (let row = mergedCell.row; row < mergedCell.row + mergedCell.rowspan; row++) {
      for (let col = mergedCell.col; col < mergedCell.col + mergedCell.colspan; col++) {
        if (!this.mergedCellsMatrix.has(row)) {
          this.mergedCellsMatrix.set(row, new Map());
        }

        this.mergedCellsMatrix.get(row)!.set(col, mergedCell);
      }
    }
  }

  /**
   * Relocates a batch of merges in the coords->merge lookup matrix, applying each merge's new visual
   * top-left. Used after re-anchoring to the visible rows on a trimming/sort change. Incremental
   * alternative to a full rebuild — only the cells of the affected merges are touched. Runs in two
   * phases (remove all, then re-add all) so merges that swap visual positions don't clobber each
   * other's freshly written entries.
   *
   * @param {Array<{ mergedCell: MergedCellCoords, row: number, col: number }>} relocations The merges
   * to move together with their new top-left visual `row`/`col`.
   */
  relocateInMatrix(relocations: { mergedCell: MergedCellCoords, row: number, col: number }[]) {
    relocations.forEach(({ mergedCell }) => this.#removeMergedCellFromMatrix(mergedCell));

    relocations.forEach(({ mergedCell, row, col }) => {
      mergedCell.relocate(row, col);
      this.#addMergedCellToMatrix(mergedCell);
    });
  }

  /**
   * Removes a batch of merges from the coords->merge lookup matrix without touching the
   * `mergedCells` list. Used to purge merges whose whole visible span has been trimmed away, so their
   * stale entries cannot resolve to a phantom merge once a different row surfaces at the same visual
   * slot. The merges themselves are kept (their physical anchor lets them be re-added when visible).
   *
   * @param {Array<MergedCellCoords>} merges The merges to remove from the matrix.
   */
  removeFromMatrix(merges: MergedCellCoords[]) {
    merges.forEach(mergedCell => this.#removeMergedCellFromMatrix(mergedCell));
  }

  /**
   * Removes a merged cell from the matrix.
   *
   * @param {MergedCellCoords} mergedCell The merged cell to remove.
   */
  #removeMergedCellFromMatrix(mergedCell: MergedCellCoords) {
    for (let row = mergedCell.row; row < mergedCell.row + mergedCell.rowspan; row++) {
      for (let col = mergedCell.col; col < mergedCell.col + mergedCell.colspan; col++) {
        this.mergedCellsMatrix.get(row)?.delete(col);
      }
    }
  }
}

export default MergedCellsCollection;
