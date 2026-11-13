import type { RecordTracker, TrackedRecord } from './recordTracker';
import type { CellChange } from '../settings';

/**
 * What the record resolution reads from the grid.
 */
export interface RecordReader {
  /**
   * Returns the number of physical rows.
   */
  countPhysicalRows(): number;
  /**
   * Returns the number of visual rows.
   */
  countVisualRows(): number;
  /**
   * Returns the source row object at a physical row (not a copy).
   */
  readRowObject(physicalRow: number): unknown;
  /**
   * Returns the stored cell meta of a cell, or `undefined` when none is stored.
   */
  getStoredMeta(physicalRow: number, physicalColumn: number): object | undefined;
  /**
   * Returns the id a configured row key (the `rowId` option or `dataProvider.rowId`) reads from a physical row, or
   * `null` when no key is configured or the row has no id. Generated ids (`rowId: true`) follow the same index
   * mapper events as the tracker, so they are not read here.
   */
  readKeyedRowId(physicalRow: number): unknown;
  /**
   * Returns the physical row that holds a row id, or `null`.
   */
  findPhysicalRowById(id: unknown): number | null;
}

/**
 * A record captured when something started to wait on it, with what tells it apart from other records later.
 */
export interface RecordAnchor {
  /**
   * The tracked physical row of the record.
   */
  record: TrackedRecord;
  /**
   * The source row object the record had when it was captured.
   */
  rowObject: unknown;
  /**
   * The id a row key read from the record when it was captured, or `null`.
   */
  rowId: unknown;
  /**
   * A stored cell meta object of the record, which follows the record on inserts and removals.
   */
  meta: object | null;
  /**
   * The physical column of `meta`.
   */
  metaColumn: number;
}

/**
 * A record followed while something waits on it, returned by the `@private` `Core#_trackRecord()`.
 */
export interface TrackedRecordHandle {
  /**
   * Returns the physical row the record holds now, or `null` once it is gone.
   */
  getPhysicalRow(): number | null;
  /**
   * Returns the visual row the record has now, or `null` once it is gone or while it is trimmed out of the
   * visual space.
   */
  getVisualRow(): number | null;
  /**
   * Stops following the record. Call it once the wait ends.
   */
  release(): void;
}

/**
 * Captures the record at a physical row and starts to track it.
 *
 * @param {object} tracker The record tracker.
 * @param {object} reader Reads the grid.
 * @param {number} physicalRow The physical row of the record.
 * @returns {object}
 */
export function captureRecord(tracker: RecordTracker, reader: RecordReader, physicalRow: number): RecordAnchor {
  return {
    record: tracker.track(physicalRow),
    rowObject: reader.readRowObject(physicalRow),
    rowId: reader.readKeyedRowId(physicalRow),
    meta: null,
    metaColumn: -1,
  };
}

/**
 * Finds the physical rows of source row objects. Returns the physical row that holds an object, `null` when more
 * than one row holds it (so it names no record), or `undefined` when no row holds it.
 */
export type RowObjectLocator = (rowObject: object) => number | null | undefined;

/**
 * Creates a locator that scans every physical row for each object it is asked about.
 *
 * @param {object} reader Reads the grid.
 * @returns {Function}
 */
function createScanningLocator(reader: RecordReader): RowObjectLocator {
  return (rowObject) => {
    const rowsCount = reader.countPhysicalRows();
    let found: number | null | undefined;

    for (let physicalRow = 0; physicalRow < rowsCount; physicalRow++) {
      if (reader.readRowObject(physicalRow) === rowObject) {
        if (found !== undefined) {
          return null;
        }

        found = physicalRow;
      }
    }

    return found;
  };
}

/**
 * Creates a locator that indexes every physical row once, on its first call, and answers from that index. Use it
 * while the source rows cannot change, for example for the records of one change set resolved at once.
 *
 * @param {object} reader Reads the grid.
 * @returns {Function}
 */
export function createIndexedLocator(reader: RecordReader): RowObjectLocator {
  let index: Map<object, number | null> | null = null;

  return (rowObject) => {
    if (index === null) {
      index = new Map();

      const rowsCount = reader.countPhysicalRows();

      for (let physicalRow = 0; physicalRow < rowsCount; physicalRow++) {
        const rowAtRow = reader.readRowObject(physicalRow);

        if (isRowObject(rowAtRow)) {
          index.set(rowAtRow, index.has(rowAtRow) ? null : physicalRow);
        }
      }
    }

    return index.get(rowObject);
  };
}

/**
 * Tells whether a record was captured with the id a row key read from it.
 *
 * @param {object} anchor The record anchor.
 * @returns {boolean}
 */
function hasRowId(anchor: RecordAnchor): boolean {
  return anchor.rowId !== null && anchor.rowId !== undefined;
}

/**
 * Tells whether a source row is an object that names one record by its reference.
 *
 * @param {*} rowObject The source row.
 * @returns {boolean}
 */
function isRowObject(rowObject: unknown): rowObject is object {
  return typeof rowObject === 'object' && rowObject !== null;
}

/**
 * Resolves a record captured with a row id. An edit of the key column changes the id the row holds, so the row
 * object the record was captured with names it first, at the tracked row. Then the id names it, at the tracked row
 * or anywhere else (`updateData()` with copies brings new row objects), and last the row object anywhere else.
 *
 * @param {object} reader Reads the grid.
 * @param {object} anchor The record anchor.
 * @param {number|null} trackedRow The tracked physical row, or `null` when a removal took it.
 * @param {Function} locate Finds the physical row of a row object.
 * @returns {number|null}
 */
function resolveKeyedRecord(
  reader: RecordReader,
  anchor: RecordAnchor,
  trackedRow: number | null,
  locate: RowObjectLocator,
): number | null {
  if (trackedRow !== null && reader.readKeyedRowId(trackedRow) === anchor.rowId) {
    return trackedRow;
  }

  const rowById = reader.findPhysicalRowById(anchor.rowId);

  if (rowById !== null) {
    return rowById;
  }

  return isRowObject(anchor.rowObject) ? locate(anchor.rowObject) ?? null : null;
}

/**
 * Resolves a record captured without a row id. The row object names it wherever it is now. `updateData()` keeps
 * the cell meta by physical row, so the stored meta captured with the record names it only when no row holds the
 * row object any more (the data was replaced by copies): then the tracked row holds the record when it still
 * stores that meta.
 *
 * @param {object} reader Reads the grid.
 * @param {object} anchor The record anchor.
 * @param {number|null} trackedRow The tracked physical row, or `null` when a removal took it.
 * @param {Function} locate Finds the physical row of a row object.
 * @returns {number|null}
 */
function resolveUnkeyedRecord(
  reader: RecordReader,
  anchor: RecordAnchor,
  trackedRow: number | null,
  locate: RowObjectLocator,
): number | null {
  const rowByObject = isRowObject(anchor.rowObject) ? locate(anchor.rowObject) : undefined;

  if (rowByObject !== undefined) {
    return rowByObject;
  }

  if (trackedRow !== null && anchor.meta !== null &&
      reader.getStoredMeta(trackedRow, anchor.metaColumn) === anchor.meta) {
    return trackedRow;
  }

  return null;
}

/**
 * Returns the physical row a captured record holds now, or `null` when the record is gone.
 *
 * 1. The tracked physical row, when it holds the row object the record was captured with.
 * 2. With a row id, the row the id names (`resolveKeyedRecord()`).
 * 3. Without one, the row the row object names, or the tracked row by its stored meta (`resolveUnkeyedRecord()`).
 *
 * @param {object} reader Reads the grid.
 * @param {object} anchor The record anchor.
 * @param {Function} [locate] Finds the physical row of a row object. Scans the rows on every call by default.
 * @returns {number|null}
 */
export function resolveRecord(
  reader: RecordReader,
  anchor: RecordAnchor,
  locate: RowObjectLocator = createScanningLocator(reader),
): number | null {
  const { physicalRow } = anchor.record;
  const trackedRow = physicalRow !== null && physicalRow < reader.countPhysicalRows() ? physicalRow : null;

  if (trackedRow !== null && isRowObject(anchor.rowObject) && reader.readRowObject(trackedRow) === anchor.rowObject) {
    return trackedRow;
  }

  if (hasRowId(anchor)) {
    return resolveKeyedRecord(reader, anchor, trackedRow, locate);
  }

  return resolveUnkeyedRecord(reader, anchor, trackedRow, locate);
}

/**
 * Puts the visual row a record has now into its change. The change tuple types its row as a number, the visual
 * row a change is made at; a change applied to a record that is trimmed out of the visual space meanwhile has no
 * visual row, and `afterChange` and `beforeChangeRender` report `null` for it.
 *
 * @param {Array} change The change.
 * @param {number|null} visualRow The visual row the change's record has now.
 */
function writeChangeRow(change: CellChange, visualRow: number | null): void {
  Reflect.set(change, 0, visualRow);
}

/**
 * Told about the rows inserted into or removed from the visual space, by the visual row of the first one and their
 * count. A removal is told after its rows are gone, an insert after its rows are in.
 */
export interface RowShiftListener {
  /**
   * Called after rows are inserted at a visual row.
   */
  rowsInserted(visualRow: number, amount: number): void;
  /**
   * Called after rows are removed from a visual row.
   */
  rowsRemoved(visualRow: number, amount: number): void;
}

/**
 * Starts telling a listener about the rows inserted and removed, and returns the function that stops it.
 */
export type RowShiftObserver = (listener: RowShiftListener) => () => void;

/**
 * The records of the changes of one set that waits for its validators.
 */
export interface WaitingChangeRecords {
  /**
   * Captures the record of every change of the set that addresses an existing row, and the visual row of every
   * change of a row past the last one. Runs once, before the first validator of the set is called; later calls do
   * nothing.
   */
  capture(changes: CellChange[]): void;
  /**
   * Notes the stored cell meta a validated change's cell has, which tells its record apart later.
   */
  noteMeta(change: CellChange, meta: object, physicalColumn: number): void;
  /**
   * Tells whether the set captured a record for any change. A set no validator waited on captures none.
   */
  hasRecords(): boolean;
  /**
   * Returns the tracked record of a change, or `undefined` for a change no record was captured for.
   */
  getRecord(change: CellChange): TrackedRecord | undefined;
  /**
   * Returns the physical row the record of a change holds now, `null` when the record is gone, or `undefined` for
   * a change no record was captured for.
   */
  resolve(change: object): number | null | undefined;
  /**
   * Resolves the record of every change when the set is applied: a change whose record is gone is taken out of
   * `changes` (in place) and returned, and every other tracked change gets the visual row its record has now in
   * place of the one it was made at (`null` while the record is trimmed out of the visual space). A change of a
   * row past the last one moves only by the rows inserted or removed above it while it waited, so such a row does
   * not turn it into a write to the record that slid to its row. A row appended at the end does not move it: a
   * write past the last row appends the row that a later change to the same row then writes to.
   */
  settle(changes: CellChange[], toVisualRow: (physicalRow: number) => number | null): CellChange[];
  /**
   * Returns the physical row `settle()` resolved for a change, or `undefined` for a change it did not resolve.
   */
  getSettledPhysicalRow(change: CellChange): number | undefined;
  /**
   * Returns the physical row of a change's record: the one `settle()` resolved once the set is applied, the one
   * the record holds now while it waits (`null` once it is gone), or `undefined` for a change no record was
   * captured for.
   */
  getPhysicalRow(change: object): number | null | undefined;
  /**
   * Stops tracking the records.
   */
  release(): void;
}

/**
 * Creates the record bookkeeping of one change set.
 *
 * @param {object} tracker The record tracker.
 * @param {object} reader Reads the grid.
 * @param {Function} toPhysicalRow Returns the physical row of a visual row of an existing row, or `null` for a row
 *   past the last one, which the write creates and which keeps its visual coordinates.
 * @param {WeakMap} registry Maps each captured change to the bookkeeping of its set, for as long as the set holds
 *   its records, so the record of one change is found in O(1) whatever number of sets waits.
 * @param {Function} observeRowShifts Tells the changes of rows past the last one about the rows inserted and
 *   removed while they wait.
 * @returns {object}
 */
export function createWaitingChangeRecords(
  tracker: RecordTracker,
  reader: RecordReader,
  toPhysicalRow: (visualRow: number) => number | null,
  registry: WeakMap<object, WaitingChangeRecords>,
  observeRowShifts: RowShiftObserver,
): WaitingChangeRecords {
  const anchorsByChange = new Map<object, RecordAnchor>();
  const anchors = new Set<RecordAnchor>();
  const settledRows = new Map<object, number>();
  const pastEndRows = new Map<CellChange, number>();
  let stopObservingRows: (() => void) | null = null;
  let captured = false;

  /**
   * Moves the rows of the changes past the last row by the rows inserted at or above them, unless the rows are
   * appended at the end.
   *
   * @param {number} visualRow The visual row of the first inserted row.
   * @param {number} amount The number of inserted rows.
   */
  const shiftOnInsert = (visualRow: number, amount: number) => {
    if (visualRow >= reader.countVisualRows() - amount) {
      return;
    }

    pastEndRows.forEach((row, change) => {
      if (visualRow <= row) {
        pastEndRows.set(change, row + amount);
      }
    });
  };

  /**
   * Moves the rows of the changes past the last row up by the removed rows above them.
   *
   * @param {number} visualRow The visual row of the first removed row.
   * @param {number} amount The number of removed rows.
   */
  const shiftOnRemove = (visualRow: number, amount: number) => {
    pastEndRows.forEach((row, change) => {
      if (visualRow < row) {
        pastEndRows.set(change, row - Math.min(amount, row - visualRow));
      }
    });
  };

  /**
   * Stops following the rows inserted and removed.
   */
  const stopShifting = () => {
    stopObservingRows?.();
    stopObservingRows = null;
  };

  const records: WaitingChangeRecords = {
    capture(changes) {
      if (captured) {
        return;
      }

      captured = true;

      const anchorsByRow = new Map<number, RecordAnchor>();
      const visualRowsCount = reader.countVisualRows();

      changes.forEach((change) => {
        const physicalRow = Number.isInteger(change[0]) ? toPhysicalRow(change[0]) : null;

        if (physicalRow === null) {
          if (Number.isInteger(change[0]) && change[0] >= visualRowsCount) {
            pastEndRows.set(change, change[0]);
          }

          return;
        }

        let anchor = anchorsByRow.get(physicalRow);

        if (anchor === undefined) {
          anchor = captureRecord(tracker, reader, physicalRow);
          anchorsByRow.set(physicalRow, anchor);
          anchors.add(anchor);
        }

        anchorsByChange.set(change, anchor);
        registry.set(change, records);
      });

      if (pastEndRows.size > 0) {
        stopObservingRows = observeRowShifts({ rowsInserted: shiftOnInsert, rowsRemoved: shiftOnRemove });
      }
    },
    noteMeta(change, meta, physicalColumn) {
      const anchor = anchorsByChange.get(change);

      if (anchor !== undefined && anchor.meta === null) {
        anchor.meta = meta;
        anchor.metaColumn = physicalColumn;
      }
    },
    getRecord(change) {
      return anchorsByChange.get(change)?.record;
    },
    resolve(change) {
      const anchor = anchorsByChange.get(change);

      return anchor === undefined ? undefined : resolveRecord(reader, anchor);
    },
    hasRecords() {
      return anchorsByChange.size > 0;
    },
    settle(changes, toVisualRow) {
      stopShifting();
      pastEndRows.forEach((row, change) => writeChangeRow(change, row));

      if (anchorsByChange.size === 0) {
        return [];
      }

      const resolved = new Map<RecordAnchor, number | null>();
      const removed: CellChange[] = [];
      const locate = createIndexedLocator(reader);

      for (let i = changes.length - 1; i >= 0; i--) {
        const change = changes[i];
        const anchor = anchorsByChange.get(change);

        if (anchor === undefined) {
          continue;
        }

        if (!resolved.has(anchor)) {
          resolved.set(anchor, resolveRecord(reader, anchor, locate));
        }

        const physicalRow = resolved.get(anchor)!;

        if (physicalRow === null) {
          changes.splice(i, 1);
          removed.unshift(change);

        } else {
          settledRows.set(change, physicalRow);
          writeChangeRow(change, toVisualRow(physicalRow));
        }
      }

      return removed;
    },
    getSettledPhysicalRow(change) {
      return settledRows.get(change);
    },
    getPhysicalRow(change) {
      const settledRow = settledRows.get(change);

      if (settledRow !== undefined) {
        return settledRow;
      }

      const anchor = anchorsByChange.get(change);

      return anchor === undefined ? undefined : resolveRecord(reader, anchor);
    },
    release() {
      anchors.forEach(anchor => tracker.release(anchor.record));
      anchorsByChange.forEach((_, change) => {
        if (registry.get(change) === records) {
          registry.delete(change);
        }
      });
      anchors.clear();
      anchorsByChange.clear();
      settledRows.clear();
      stopShifting();
      pastEndRows.clear();
    },
  };

  return records;
}
