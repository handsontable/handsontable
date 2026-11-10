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
 * Tells whether the tracked physical row of an anchor still holds the record: the stored meta captured with it
 * is the one stored there, or the row object is the one captured.
 *
 * @param {object} reader Reads the grid.
 * @param {object} anchor The record anchor.
 * @param {number} physicalRow The tracked physical row.
 * @returns {boolean}
 */
function holdsRecord(reader: RecordReader, anchor: RecordAnchor, physicalRow: number): boolean {
  if (physicalRow >= reader.countPhysicalRows()) {
    return false;
  }

  if (anchor.meta !== null && reader.getStoredMeta(physicalRow, anchor.metaColumn) === anchor.meta) {
    return true;
  }

  return isRowObject(anchor.rowObject) && reader.readRowObject(physicalRow) === anchor.rowObject;
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
 * Finds the physical row of a record whose tracked row no longer holds it: by its row id when a row key is
 * configured, otherwise by its source row object. A reference that more than one row holds names no record.
 *
 * @param {object} reader Reads the grid.
 * @param {object} anchor The record anchor.
 * @returns {number|null}
 */
function findRecord(reader: RecordReader, anchor: RecordAnchor): number | null {
  if (anchor.rowId !== null && anchor.rowId !== undefined) {
    return reader.findPhysicalRowById(anchor.rowId);
  }

  if (!isRowObject(anchor.rowObject)) {
    return null;
  }

  const rowsCount = reader.countPhysicalRows();
  let found: number | null = null;

  for (let physicalRow = 0; physicalRow < rowsCount; physicalRow++) {
    if (reader.readRowObject(physicalRow) === anchor.rowObject) {
      if (found !== null) {
        return null;
      }

      found = physicalRow;
    }
  }

  return found;
}

/**
 * Returns the physical row a captured record holds now, or `null` when the record is gone.
 *
 * 1. The tracked physical row, when it still holds the record (`holdsRecord()`).
 * 2. Otherwise, or when a removal took the tracked row, the row `findRecord()` finds.
 *
 * @param {object} reader Reads the grid.
 * @param {object} anchor The record anchor.
 * @returns {number|null}
 */
export function resolveRecord(reader: RecordReader, anchor: RecordAnchor): number | null {
  const { physicalRow } = anchor.record;

  if (physicalRow !== null && holdsRecord(reader, anchor, physicalRow)) {
    return physicalRow;
  }

  return findRecord(reader, anchor);
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
 * The records of the changes of one set that waits for its validators.
 */
export interface WaitingChangeRecords {
  /**
   * Captures the record of every change of the set that addresses an existing row. Runs once, before the first
   * validator of the set is called; later calls do nothing.
   */
  capture(changes: CellChange[]): void;
  /**
   * Notes the stored cell meta a validated change's cell has, which tells its record apart later.
   */
  noteMeta(change: CellChange, meta: object, physicalColumn: number): void;
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
   * place of the one it was made at (`null` while the record is trimmed out of the visual space).
   */
  settle(changes: CellChange[], toVisualRow: (physicalRow: number) => number | null): CellChange[];
  /**
   * Returns the physical row `settle()` resolved for a change, or `undefined` for a change it did not resolve.
   */
  getSettledPhysicalRow(change: CellChange): number | undefined;
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
 * @returns {object}
 */
export function createWaitingChangeRecords(
  tracker: RecordTracker,
  reader: RecordReader,
  toPhysicalRow: (visualRow: number) => number | null,
): WaitingChangeRecords {
  const anchorsByChange = new Map<object, RecordAnchor>();
  const anchors = new Set<RecordAnchor>();
  const settledRows = new Map<CellChange, number>();
  let captured = false;

  return {
    capture(changes) {
      if (captured) {
        return;
      }

      captured = true;

      const anchorsByRow = new Map<number, RecordAnchor>();

      changes.forEach((change) => {
        const physicalRow = Number.isInteger(change[0]) ? toPhysicalRow(change[0]) : null;

        if (physicalRow === null) {
          return;
        }

        let anchor = anchorsByRow.get(physicalRow);

        if (anchor === undefined) {
          anchor = captureRecord(tracker, reader, physicalRow);
          anchorsByRow.set(physicalRow, anchor);
          anchors.add(anchor);
        }

        anchorsByChange.set(change, anchor);
      });
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
    settle(changes, toVisualRow) {
      const resolved = new Map<RecordAnchor, number | null>();
      const removed: CellChange[] = [];

      for (let i = changes.length - 1; i >= 0; i--) {
        const change = changes[i];
        const anchor = anchorsByChange.get(change);

        if (anchor === undefined) {
          continue;
        }

        if (!resolved.has(anchor)) {
          resolved.set(anchor, resolveRecord(reader, anchor));
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
    release() {
      anchors.forEach(anchor => tracker.release(anchor.record));
      anchors.clear();
      anchorsByChange.clear();
    },
  };
}
