import { IndexMapper } from 'handsontable/translations';
import { createColumnTracker } from '../columnTracker';

/**
 * The column tracker keeps the physical column of each followed column current on the column index mapper's inserts
 * and removals, and listens only while it follows a column.
 */
describe('createColumnTracker', () => {
  /**
   * Creates an index mapper of the given length and a tracker that follows it.
   *
   * @param {number} length The number of columns.
   * @returns {object}
   */
  function setup(length: number) {
    const mapper = new IndexMapper();

    mapper.initToLength(length);

    return { mapper, tracker: createColumnTracker(() => mapper) };
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

  it('should move a column right by the number of columns inserted before it', () => {
    const { mapper, tracker } = setup(4);
    const column = tracker.track(1);

    mapper.insertIndexes(0, 2);

    expect(column.physicalColumn).toBe(3);
  });

  it('should keep a column when columns are inserted after it', () => {
    const { mapper, tracker } = setup(4);
    const column = tracker.track(1);

    mapper.insertIndexes(2, 2);

    expect(column.physicalColumn).toBe(1);
  });

  it('should move a column left by the number of columns removed before it', () => {
    const { mapper, tracker } = setup(4);
    const column = tracker.track(2);

    mapper.removeIndexes([0, 1]);

    expect(column.physicalColumn).toBe(0);
  });

  it('should answer null once a removal took the column', () => {
    const { mapper, tracker } = setup(4);
    const column = tracker.track(2);

    mapper.removeIndexes([2]);

    expect(column.physicalColumn).toBeNull();
  });

  it('should keep the physical column when the columns are moved', () => {
    const { mapper, tracker } = setup(4);
    const column = tracker.track(1);

    mapper.moveIndexes([1], 3);

    expect(column.physicalColumn).toBe(1);
  });

  it('should return the same column for a physical column that is followed already', () => {
    const { tracker } = setup(4);
    const first = tracker.track(1);
    const second = tracker.track(1);

    expect(second).toBe(first);
    expect(second.id).toBe(first.id);
    expect(tracker.size).toBe(1);
  });

  it('should keep the column until every hold on it is released', () => {
    const { mapper, tracker } = setup(4);
    const first = tracker.track(1);
    const second = tracker.track(1);

    tracker.release(first);
    mapper.insertIndexes(0, 1);

    expect(second.physicalColumn).toBe(2);
    expect(tracker.size).toBe(1);

    tracker.release(second);

    expect(tracker.size).toBe(0);
  });

  it('should listen to the column index mapper only while it follows a column', () => {
    const { mapper, tracker } = setup(4);

    expect(countListeners(mapper)).toBe(0);

    const column = tracker.track(1);

    expect(countListeners(mapper)).toBe(2);

    tracker.release(column);

    expect(countListeners(mapper)).toBe(0);
  });
});
