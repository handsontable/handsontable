import { IndexMapper } from 'handsontable/translations';
import { BooleanMap } from 'handsontable/translations/maps/booleanMap';
import { IndexesSequence } from 'handsontable/translations/maps/indexesSequence';
import {
  IndexMapperStateTracker,
  captureIndexMap,
  haveSameIndexMaps,
  isDerivedIndexMap,
} from 'handsontable/translations/indexMapperSnapshot';

describe('IndexMapperStateTracker', () => {
  let mapper;
  let tracker;

  beforeEach(() => {
    mapper = new IndexMapper();
    mapper.initToLength(10);
    tracker = new IndexMapperStateTracker(mapper);
  });

  afterEach(() => {
    tracker.destroy();
  });

  it('should name a map registered since the previous capture, even before anything writes to it', () => {
    const before = tracker.capture();

    // Registering initializes the map, which fires the `change` the tracker listens to.
    mapper.createAndRegisterIndexMap('hiddenRows', 'hiding');

    const after = tracker.capture();

    expect(after).not.toBe(before);
    expect(after.hiding.has('hiddenRows')).toBe(true);
    expect(haveSameIndexMaps(before, after)).toBe(false);
  });

  it('should tell apart a map set that changed from one re-registered under the same names', () => {
    mapper.createAndRegisterIndexMap('hiddenRows', 'hiding');

    const before = tracker.capture();

    // What a plugin's settings update does: disable, then enable again.
    mapper.unregisterMap('hiddenRows');
    mapper.createAndRegisterIndexMap('hiddenRows', 'hiding');

    const reRegistered = tracker.capture();

    mapper.unregisterMap('hiddenRows');

    const removed = tracker.capture();

    expect(haveSameIndexMaps(before, reRegistered)).toBe(true);
    expect(haveSameIndexMaps(before, removed)).toBe(false);
  });

  it('should capture an untouched axis without materializing any lazy map', () => {
    const bigMapper = new IndexMapper();

    bigMapper.initToLength(50000);
    bigMapper.createAndRegisterIndexMap('hiddenRows', 'hiding');
    bigMapper.createAndRegisterIndexMap('filters', 'trimming');

    const bigTracker = new IndexMapperStateTracker(bigMapper);
    const sequenceSpy = jest.spyOn(IndexesSequence.prototype, 'getValues');
    const booleanSpy = jest.spyOn(BooleanMap.prototype, 'getValues');

    try {
      const snapshot = bigTracker.capture();

      expect(snapshot.length).toBe(50000);
      expect(snapshot.sequence).toEqual({ kind: 'default', length: 50000 });
      expect(snapshot.hiding.get('hiddenRows')).toEqual({ kind: 'default', length: 50000 });
      expect(snapshot.trimming.get('filters')).toEqual({ kind: 'default', length: 50000 });
      expect(sequenceSpy).not.toHaveBeenCalled();
      expect(booleanSpy).not.toHaveBeenCalled();
    } finally {
      sequenceSpy.mockRestore();
      booleanSpy.mockRestore();
      bigTracker.destroy();
    }
  });

  it('should return the previous snapshot itself when nothing changed', () => {
    const first = tracker.capture();

    expect(tracker.isDirty()).toBe(false);
    expect(tracker.capture()).toBe(first);
  });

  it('should copy only the map that changed and share every other map snapshot with the previous capture', () => {
    const hidingMap = mapper.createAndRegisterIndexMap('hiddenRows', 'hiding');

    mapper.createAndRegisterIndexMap('filters', 'trimming');
    mapper.createAndRegisterIndexMap('manualRowResize', 'physicalIndexToValue');

    const before = tracker.capture();

    hidingMap.setValueAtIndex(3, true);

    expect(tracker.isDirty()).toBe(true);

    const after = tracker.capture();

    expect(after).not.toBe(before);
    expect(after.sequence).toBe(before.sequence);
    expect(after.trimming.get('filters')).toBe(before.trimming.get('filters'));
    expect(after.various.get('manualRowResize')).toBe(before.various.get('manualRowResize'));
    expect(after.hiding.get('hiddenRows')).not.toBe(before.hiding.get('hiddenRows'));
  });

  it('should store a hiding map with something hidden as a bitset of one bit per index', () => {
    const bigMapper = new IndexMapper();

    bigMapper.initToLength(50000);

    const hidingMap = bigMapper.createAndRegisterIndexMap('hiddenRows', 'hiding');

    hidingMap.setValueAtIndex(0, true);
    hidingMap.setValueAtIndex(49999, true);

    const snapshot = captureIndexMap(hidingMap);

    expect(snapshot.kind).toBe('bitset');
    expect(snapshot.bits.byteLength).toBe(Math.ceil(50000 / 8));
  });

  it('should restore a reordered sequence and store it as a typed array, never leaking one into the mapper', () => {
    const before = tracker.capture();

    mapper.setIndexesSequence([9, 8, 7, 6, 5, 4, 3, 2, 1, 0]);

    const after = tracker.capture();

    expect(after.sequence.kind).toBe('sequence');
    expect(after.sequence.values).toEqual(jasmine.any(Int32Array));

    tracker.restore(before);

    expect(mapper.getIndexesSequence()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(mapper.indexesSequence.isIdentity()).toBe(true);

    tracker.restore(after);

    expect(Array.isArray(mapper.getIndexesSequence())).toBe(true);
    expect(mapper.getIndexesSequence()).toEqual([9, 8, 7, 6, 5, 4, 3, 2, 1, 0]);
    expect(mapper.getVisualFromPhysicalIndex(9)).toBe(0);
  });

  it('should round-trip the link order of a linked map', () => {
    const linkedMap = mapper.createAndRegisterIndexMap('sortingStates', 'linkedPhysicalIndexToValue');

    linkedMap.setValueAtIndex(3, { sortOrder: 'asc' });
    linkedMap.setValueAtIndex(1, { sortOrder: 'desc' });

    const sorted = tracker.capture();

    linkedMap.clearValue(3);
    linkedMap.setValueAtIndex(5, { sortOrder: 'asc' });

    tracker.restore(sorted);

    expect(linkedMap.orderOfIndexes).toEqual([3, 1]);
    expect(linkedMap.getValues()).toEqual([{ sortOrder: 'asc' }, { sortOrder: 'desc' }]);
    expect(linkedMap.getValueAtIndex(5)).toBe(null);
  });

  it('should keep the snapshot immune to an in-place mutation of the captured or the restored value', () => {
    const linkedMap = mapper.createAndRegisterIndexMap('conditions', 'linkedPhysicalIndexToValue');

    linkedMap.setValueAtIndex(2, { args: ['a'] });

    const snapshot = tracker.capture();

    // An in-place mutation fires no `change`, so the tracker cannot see it; the write that follows
    // makes the map dirty, so the restore below really writes the snapshot back.
    linkedMap.getValueAtIndex(2).args.push('b');
    linkedMap.setValueAtIndex(4, { args: ['x'] });
    tracker.restore(snapshot);

    expect(linkedMap.getValueAtIndex(2)).toEqual({ args: ['a'] });
    expect(linkedMap.orderOfIndexes).toEqual([2]);

    linkedMap.getValueAtIndex(2).args.push('c');
    linkedMap.setValueAtIndex(4, { args: ['y'] });
    tracker.restore(snapshot);

    expect(linkedMap.getValueAtIndex(2)).toEqual({ args: ['a'] });
  });

  it('should store a value map sparsely and switch to a dense copy past a quarter of set entries', () => {
    const sizes = mapper.createAndRegisterIndexMap('manualRowResize', 'physicalIndexToValue');

    sizes.setValueAtIndex(4, 50);

    expect(captureIndexMap(sizes)).toEqual({ kind: 'sparse', length: 10, entries: [[4, 50]] });

    sizes.setValueAtIndex(0, 10);
    sizes.setValueAtIndex(1, 20);
    sizes.setValueAtIndex(2, 30);

    const dense = captureIndexMap(sizes);

    expect(dense.kind).toBe('dense');
    expect(dense.values).toEqual([10, 20, 30, null, 50, null, null, null, null, null]);
  });

  it('should restore a sparse value map', () => {
    const sizes = mapper.createAndRegisterIndexMap('manualRowResize', 'physicalIndexToValue');

    sizes.setValueAtIndex(4, 50);

    const snapshot = tracker.capture();

    sizes.setValueAtIndex(4, 80);
    sizes.setValueAtIndex(7, 20);
    tracker.restore(snapshot);

    expect(sizes.getValues()).toEqual([null, null, null, null, 50, null, null, null, null, null]);
  });

  it('should leave derived maps out of the snapshot and not become dirty when one changes', () => {
    const derived = mapper.createAndRegisterIndexMap('autoRowSize', 'physicalIndexToValue');

    mapper.createAndRegisterIndexMap('columnSorting.columnMeta', 'physicalIndexToValue');

    const snapshot = tracker.capture();

    derived.setValueAtIndex(1, 23);

    expect(tracker.isDirty()).toBe(false);
    expect(snapshot.various.has('autoRowSize')).toBe(false);
    expect(snapshot.various.has('columnSorting.columnMeta')).toBe(false);
    expect(isDerivedIndexMap('nestedHeaders.widthsMap')).toBe(true);
    expect(isDerivedIndexMap('stretchColumns')).toBe(true);
    expect(isDerivedIndexMap('hiddenRows')).toBe(false);
  });

  it('should skip a map the mapper no longer holds and leave alone a map the snapshot does not name', () => {
    const hidingMap = mapper.createAndRegisterIndexMap('hiddenRows', 'hiding');

    hidingMap.setValueAtIndex(1, true);

    const snapshot = tracker.capture();

    mapper.unregisterMap('hiddenRows');

    const trimmingMap = mapper.createAndRegisterIndexMap('trimRows', 'trimming');

    trimmingMap.setValueAtIndex(2, true);

    expect(() => tracker.restore(snapshot)).not.toThrow();
    expect(trimmingMap.getValueAtIndex(2)).toBe(true);
    expect(mapper.getNotTrimmedIndexes()).toEqual([0, 1, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('should resize the axis to the length the data implies before restoring the maps', () => {
    const hidingMap = mapper.createAndRegisterIndexMap('hiddenRows', 'hiding');

    hidingMap.setValueAtIndex(8, true);

    const snapshot = tracker.capture();

    mapper.removeIndexes([0, 1, 2]);

    expect(mapper.getNumberOfIndexes()).toBe(7);

    tracker.restore(snapshot, { length: 10 });

    expect(mapper.getNumberOfIndexes()).toBe(10);
    expect(hidingMap.getValues()).toEqual([false, false, false, false, false, false, false, false, true, false]);
  });

  it('should restore an indexes sequence registered as a map', () => {
    // The sorting plugins keep the unsorted order in such a map.
    const cache = mapper.createAndRegisterIndexMap('columnSorting', 'indexesSequence');

    cache.setValues([2, 0, 1, 3, 4, 5, 6, 7, 8, 9]);

    const snapshot = tracker.capture();

    cache.setValues([9, 8, 7, 6, 5, 4, 3, 2, 1, 0]);
    tracker.restore(snapshot);

    expect(cache.getValues()).toEqual([2, 0, 1, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('should fit a snapshot to an axis that grew at its end, keeping the new indexes as they are', () => {
    const hidingMap = mapper.createAndRegisterIndexMap('hiddenRows', 'hiding');

    mapper.setIndexesSequence([9, 8, 7, 6, 5, 4, 3, 2, 1, 0]);
    hidingMap.setValueAtIndex(8, true);

    const snapshot = tracker.capture();

    mapper.setIndexesSequence([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    hidingMap.setValueAtIndex(8, false);
    // Two indexes appended outside the journal, the second one hidden.
    mapper.insertIndexes(10, 2);
    hidingMap.setValueAtIndex(11, true);

    tracker.restore(snapshot, { length: 12 });

    expect(mapper.getNumberOfIndexes()).toBe(12);
    expect(mapper.getIndexesSequence()).toEqual([9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 10, 11]);
    expect(hidingMap.getValues())
      .toEqual([false, false, false, false, false, false, false, false, true, false, false, true]);
  });

  it('should write back only the maps whose state differs and rebuild the caches once', () => {
    const hidingMap = mapper.createAndRegisterIndexMap('hiddenRows', 'hiding');
    const trimmingMap = mapper.createAndRegisterIndexMap('trimRows', 'trimming');
    const snapshot = tracker.capture();

    hidingMap.setValueAtIndex(1, true);
    tracker.capture();

    const trimmingSpy = jest.spyOn(trimmingMap, 'setValues');
    const trimmingDefaultsSpy = jest.spyOn(trimmingMap, 'setDefaultValues');
    let cacheRebuilds = 0;

    mapper.addLocalHook('cacheUpdated', () => {
      cacheRebuilds += 1;
    });

    mapper.setIndexesSequence([1, 0, 2, 3, 4, 5, 6, 7, 8, 9]);
    hidingMap.setValueAtIndex(2, true);
    cacheRebuilds = 0;

    tracker.restore(snapshot);

    expect(hidingMap.getValues()).toEqual(new Array(10).fill(false));
    expect(mapper.getIndexesSequence()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(trimmingSpy).not.toHaveBeenCalled();
    expect(trimmingDefaultsSpy).not.toHaveBeenCalled();
    // The sequence and the hiding map are written inside one suspended batch.
    expect(cacheRebuilds).toBe(1);
  });

  it('should reuse the restored map snapshots on the next capture instead of copying the maps again', () => {
    const hidingMap = mapper.createAndRegisterIndexMap('hiddenRows', 'hiding');
    const empty = tracker.capture();

    hidingMap.setValueAtIndex(1, true);
    tracker.capture();
    tracker.restore(empty);

    expect(tracker.capture().hiding.get('hiddenRows')).toBe(empty.hiding.get('hiddenRows'));
    expect(tracker.capture().sequence).toBe(empty.sequence);
  });

  it('should restore only the maps that differ between a step\'s two snapshots', () => {
    const hidingMap = mapper.createAndRegisterIndexMap('hiddenRows', 'hiding');
    const trimmingMap = mapper.createAndRegisterIndexMap('trimRows', 'trimming');
    const before = tracker.capture();

    hidingMap.setValueAtIndex(1, true);

    const after = tracker.capture();

    // A change made outside the step, to a map the step did not touch.
    trimmingMap.setValueAtIndex(4, true);
    tracker.restore(before, { changedFrom: after });

    expect(hidingMap.getValueAtIndex(1)).toBe(false);
    expect(trimmingMap.getValueAtIndex(4)).toBe(true);
  });

  it('should stop listening to the mapper once destroyed', () => {
    const hidingMap = mapper.createAndRegisterIndexMap('hiddenRows', 'hiding');

    tracker.capture();
    tracker.destroy();
    hidingMap.setValueAtIndex(1, true);

    expect(mapper._localHooks.change.length).toBe(0);
  });
});
