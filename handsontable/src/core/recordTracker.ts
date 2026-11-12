/**
 * A source record followed by its physical row while something waits on it (a change that waits for its
 * validator, an editor that waits for the answer). `physicalRow` is `null` once a removal took the row.
 */
export interface TrackedRecord {
  /**
   * A number that names the record for as long as it is tracked, unique per tracker.
   */
  readonly id: number;
  /**
   * The physical row the record holds now, or `null` once its row was removed.
   */
  physicalRow: number | null;
}

/**
 * The part of the index mapper the tracker listens to.
 */
interface TrackedIndexMapper {
  addLocalHook(key: string, callback: Function): unknown;
  removeLocalHook(key: string, callback: Function): unknown;
  getNumberOfIndexes(): number;
}

/**
 * Follows records by their physical rows.
 */
export interface RecordTracker {
  /**
   * Starts following the record at a physical row, or takes one more hold on the record already followed there.
   */
  track(physicalRow: number): TrackedRecord;
  /**
   * Returns the record followed at a physical row, without taking a hold on it.
   */
  find(physicalRow: number): TrackedRecord | undefined;
  /**
   * Drops one hold on a record. The record stops being followed when no hold is left.
   */
  release(record: TrackedRecord): void;
  /**
   * The number of records followed now.
   */
  readonly size: number;
}

/**
 * Returns how many items of a sorted list are lower than a value.
 *
 * @param {number[]} sorted The list, in ascending order.
 * @param {number} value The value.
 * @returns {number}
 */
function countLower(sorted: number[], value: number): number {
  let low = 0;
  let high = sorted.length;

  while (low < high) {
    const middle = Math.floor((low + high) / 2);

    if (sorted[middle] < value) {
      low = middle + 1;
    } else {
      high = middle;
    }
  }

  return low;
}

/**
 * Creates a tracker that keeps the physical row of each followed record current on the index mapper's
 * `indexesInserted` and `indexesRemoved` local hooks. A row a removal takes leaves its record with a `null`
 * physical row. The tracker listens only while it follows a record, so an idle grid pays nothing, and an
 * event costs one pass over the followed records, never O(rows). The index that finds a record by its row is
 * rebuilt lazily, on the first `track()` or `find()` after an event, so a burst of inserts or removals (an
 * `alter()` loop while a large paste waits) pays one rebuild, not one per event.
 *
 * A sort, a move, a filter, and hiding or trimming rows do not change physical rows, so they need nothing.
 * Code that rewrites the data without these hooks (NestedRows' tree operations) leaves a record on a stale
 * row, which the caller has to verify before it trusts it.
 *
 * @param {Function} getIndexMapper Returns the row index mapper.
 * @returns {object}
 */
export function createRecordTracker(getIndexMapper: () => TrackedIndexMapper): RecordTracker {
  const holds = new Map<TrackedRecord, number>();
  const byPhysicalRow = new Map<number, TrackedRecord>();
  let listenedMapper: TrackedIndexMapper | null = null;
  let isIndexStale = false;
  let lastId = 0;

  /**
   * Indexes the followed records by their physical rows again when an event moved them since the last read.
   */
  const ensureIndex = () => {
    if (!isIndexStale) {
      return;
    }

    isIndexStale = false;
    byPhysicalRow.clear();
    holds.forEach((_, record) => {
      if (record.physicalRow !== null) {
        byPhysicalRow.set(record.physicalRow, record);
      }
    });
  };

  /**
   * Moves the records at and after the inserted rows down by their count.
   *
   * @param {number[]} insertedIndexes The physical indexes the index mapper inserted.
   * @param {'start'|'end'} [mode] Where the rows go: at the first index, or one row after it.
   */
  const onIndexesInserted = (insertedIndexes: number[], mode: 'start' | 'end' = 'start') => {
    if (insertedIndexes.length === 0) {
      return;
    }

    const rowsBefore = listenedMapper!.getNumberOfIndexes() - insertedIndexes.length;
    const firstRow = mode === 'end' ? Math.min(insertedIndexes[0] + 1, rowsBefore) : insertedIndexes[0];
    const amount = insertedIndexes.length;

    holds.forEach((_, record) => {
      if (record.physicalRow !== null && record.physicalRow >= firstRow) {
        record.physicalRow += amount;
        isIndexStale = true;
      }
    });
  };

  /**
   * Moves the records after the removed rows up, and marks the records of the removed rows as gone.
   *
   * @param {number[]} removedIndexes The physical indexes the index mapper removed.
   */
  const onIndexesRemoved = (removedIndexes: number[]) => {
    if (removedIndexes.length === 0) {
      return;
    }

    const sorted = removedIndexes.slice().sort((a, b) => a - b);

    holds.forEach((_, record) => {
      if (record.physicalRow === null) {
        return;
      }

      const lower = countLower(sorted, record.physicalRow);
      const isRemoved = sorted[lower] === record.physicalRow;

      if (isRemoved || lower > 0) {
        record.physicalRow = isRemoved ? null : record.physicalRow - lower;
        isIndexStale = true;
      }
    });
  };

  /**
   * Starts or stops listening, so the tracker listens exactly while it follows a record.
   */
  const syncListeners = () => {
    if (holds.size > 0 && listenedMapper === null) {
      listenedMapper = getIndexMapper();
      listenedMapper.addLocalHook('indexesInserted', onIndexesInserted);
      listenedMapper.addLocalHook('indexesRemoved', onIndexesRemoved);

    } else if (holds.size === 0 && listenedMapper !== null) {
      listenedMapper.removeLocalHook('indexesInserted', onIndexesInserted);
      listenedMapper.removeLocalHook('indexesRemoved', onIndexesRemoved);
      listenedMapper = null;
      byPhysicalRow.clear();
      isIndexStale = false;
    }
  };

  return {
    track(physicalRow) {
      ensureIndex();

      let record = byPhysicalRow.get(physicalRow);

      if (record === undefined) {
        lastId += 1;
        record = { id: lastId, physicalRow };
        byPhysicalRow.set(physicalRow, record);
      }

      holds.set(record, (holds.get(record) ?? 0) + 1);
      syncListeners();

      return record;
    },
    find(physicalRow) {
      ensureIndex();

      return byPhysicalRow.get(physicalRow);
    },
    release(record) {
      const count = holds.get(record);

      if (count === undefined) {
        return;
      }

      if (count > 1) {
        holds.set(record, count - 1);

        return;
      }

      holds.delete(record);

      if (!isIndexStale && record.physicalRow !== null && byPhysicalRow.get(record.physicalRow) === record) {
        byPhysicalRow.delete(record.physicalRow);
      }

      syncListeners();
    },
    get size() {
      return holds.size;
    },
  };
}
