import { createRecordTracker } from './recordTracker';
import type { TrackedRecord } from './recordTracker';

/**
 * A source column followed by its physical column while something waits on it. `physicalColumn` is `null`
 * once a removal took the column.
 */
export interface TrackedColumn {
  /**
   * A number that names the column for as long as it is tracked, unique per tracker.
   */
  readonly id: number;
  /**
   * The physical column the column holds now, or `null` once it was removed.
   */
  readonly physicalColumn: number | null;
  /**
   * The followed index the shift logic keeps current.
   */
  readonly record: TrackedRecord;
}

/**
 * The part of the index mapper the tracker listens to.
 */
interface TrackedColumnIndexMapper {
  addLocalHook(key: string, callback: Function): unknown;
  removeLocalHook(key: string, callback: Function): unknown;
  getNumberOfIndexes(): number;
}

/**
 * Follows columns by their physical indexes.
 */
export interface ColumnTracker {
  /**
   * Starts following the column at a physical index, or takes one more hold on the column already followed there.
   */
  track(physicalColumn: number): TrackedColumn;
  /**
   * Drops one hold on a column. The column stops being followed when no hold is left.
   */
  release(column: TrackedColumn): void;
  /**
   * The number of columns followed now.
   */
  readonly size: number;
}

/**
 * How the waiting changes of a set resolve a column.
 */
export interface ColumnTracking {
  /**
   * The tracker of the columns.
   */
  tracker: ColumnTracker;
  /**
   * Returns the physical column a property names when the property is that column's physical index, or `null` for
   * a property that names its column some other way (a field name, an accessor, a `columns[].data` index), which
   * stays valid whatever happens to the columns, or for a column that does not exist yet.
   */
  toTrackedPhysicalColumn(prop: unknown): number | null;
  /**
   * Returns the property of a column from its physical index. It is the inverse of `toTrackedPhysicalColumn()`.
   */
  toProp(physicalColumn: number): number;
}

/**
 * Creates a tracker that keeps the physical index of each followed column current on the column index mapper's
 * `indexesInserted` and `indexesRemoved` local hooks. A column a removal takes leaves its tracked column with a
 * `null` physical column. A move, a hide, and a trim do not change physical columns, so they need nothing. The
 * shift rules are those of the row tracker, which this one reuses on the other axis.
 *
 * @param {Function} getIndexMapper Returns the column index mapper.
 * @returns {object}
 */
export function createColumnTracker(getIndexMapper: () => TrackedColumnIndexMapper): ColumnTracker {
  const tracker = createRecordTracker(getIndexMapper);
  const wrappers = new WeakMap<TrackedRecord, TrackedColumn>();

  return {
    track(physicalColumn) {
      const record = tracker.track(physicalColumn);
      let column = wrappers.get(record);

      if (column === undefined) {
        column = {
          id: record.id,
          record,
          get physicalColumn() {
            return record.physicalRow;
          },
        };
        wrappers.set(record, column);
      }

      return column;
    },
    release(column) {
      tracker.release(column.record);
    },
    get size() {
      return tracker.size;
    },
  };
}
