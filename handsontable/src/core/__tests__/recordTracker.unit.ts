import { IndexMapper } from 'handsontable/translations';
import { createRecordTracker } from '../recordTracker';

/**
 * The record tracker keeps the physical row of each followed record current on the index mapper's row inserts and
 * removals, and listens only while it follows a record.
 */
describe('createRecordTracker', () => {
  /**
   * Creates an index mapper of the given length and a tracker that follows it.
   *
   * @param {number} length The number of rows.
   * @returns {object}
   */
  function setup(length: number) {
    const mapper = new IndexMapper();

    mapper.initToLength(length);

    return { mapper, tracker: createRecordTracker(() => mapper) };
  }

  /**
   * Counts the tracker's listeners on the index mapper.
   *
   * @param {IndexMapper} mapper The index mapper.
   * @returns {number}
   */
  function countListeners(mapper: IndexMapper): number {
    const hooks: Record<string, Function[] | undefined> = Reflect.get(mapper, '_localHooks');

    return (hooks.indexesInserted ?? []).length + (hooks.indexesRemoved ?? []).length;
  }

  it('should move a record down by the number of rows inserted above it', () => {
    const { mapper, tracker } = setup(5);
    const record = tracker.track(2);

    mapper.insertIndexes(0, 2);

    expect(record.physicalRow).toBe(4);
  });

  it('should keep a record when rows are appended after the last row', () => {
    const { mapper, tracker } = setup(5);
    const record = tracker.track(4);

    mapper.insertIndexes(5, 3);

    expect(record.physicalRow).toBe(4);
  });

  it('should keep the record a row is inserted below, in the end mode', () => {
    const { mapper, tracker } = setup(5);
    const above = tracker.track(1);
    const below = tracker.track(2);

    mapper.insertIndexes(1, 1, 'end');

    expect(above.physicalRow).toBe(1);
    expect(below.physicalRow).toBe(3);
  });

  it('should keep the last record when a row is inserted below it, in the end mode', () => {
    const { mapper, tracker } = setup(5);
    const last = tracker.track(4);

    mapper.insertIndexes(4, 1, 'end');

    expect(last.physicalRow).toBe(4);
  });

  it('should move a record up by the removed rows above it, and mark a removed record as gone', () => {
    const { mapper, tracker } = setup(8);
    const between = tracker.track(2);
    const removed = tracker.track(3);
    const after = tracker.track(6);

    mapper.removeIndexes([5, 0, 3]);

    expect(between.physicalRow).toBe(1);
    expect(removed.physicalRow).toBe(null);
    expect(after.physicalRow).toBe(3);
  });

  it('should share one record between the holders of a row and keep it until the last hold is released', () => {
    const { mapper, tracker } = setup(5);
    const first = tracker.track(2);
    const second = tracker.track(2);

    expect(second).toBe(first);
    expect(tracker.size).toBe(1);

    tracker.release(first);
    mapper.insertIndexes(0, 1);

    expect(tracker.size).toBe(1);
    expect(second.physicalRow).toBe(3);
    expect(tracker.find(3)).toBe(second);

    tracker.release(second);

    expect(tracker.size).toBe(0);
    expect(tracker.find(3)).toBeUndefined();
  });

  it('should find a record by its new row after a shift, and not by its old one', () => {
    const { mapper, tracker } = setup(5);
    const record = tracker.track(1);

    mapper.removeIndexes([0]);

    expect(tracker.find(0)).toBe(record);
    expect(tracker.find(1)).toBeUndefined();
    expect(tracker.track(0)).toBe(record);
  });

  it('should start a new record for a row whose record was removed', () => {
    const { mapper, tracker } = setup(5);
    const removed = tracker.track(1);

    mapper.removeIndexes([1]);

    const next = tracker.track(1);

    expect(next).not.toBe(removed);
    expect(next.physicalRow).toBe(1);
  });

  it('should listen to the index mapper only while it follows a record', () => {
    const { mapper, tracker } = setup(5);
    const idle = countListeners(mapper);
    const record = tracker.track(1);

    expect(countListeners(mapper)).toBe(idle + 2);

    tracker.release(record);

    expect(countListeners(mapper)).toBe(idle);
  });
});
