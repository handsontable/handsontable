import IndexMapper from 'handsontable/translations/indexMapper';
import { SkipMap, ValueMap, IndexMap } from 'handsontable/translations';

describe('IndexMapper', () => {
  it('should fill mappers with initial values at start', () => {
    const indexMapper = new IndexMapper();

    expect(indexMapper.getIndexesSequence()).toEqual([]);
    expect(indexMapper.getNotSkippedIndexes()).toEqual([]);
    expect(indexMapper.getNumberOfIndexes()).toBe(0);
    expect(indexMapper.getNotSkippedIndexesLength()).toBe(0);
  });

  it('should fill mappers with proper values by calling `initToLength` function', () => {
    const indexMapper = new IndexMapper();
    indexMapper.initToLength(10);

    expect(indexMapper.getIndexesSequence()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(indexMapper.getNotSkippedIndexes()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(indexMapper.getNumberOfIndexes()).toBe(10);
    expect(indexMapper.getNotSkippedIndexesLength()).toBe(10);
  });

  it('should trigger `change` hook on initialization once', () => {
    const indexMapper = new IndexMapper();
    const changeCallback = jasmine.createSpy('change');

    indexMapper.addLocalHook('change', changeCallback);

    indexMapper.initToLength(10);

    expect(changeCallback.calls.count()).toEqual(1);
  });

  it('should register map to proper collection when it is possible', () => {
    const indexMapper = new IndexMapper();
    const skipMap = new SkipMap();
    const valueMap = new ValueMap();

    expect(indexMapper.skipCollection.getLength()).toBe(0);

    indexMapper.registerMap('uniqueName', skipMap);

    expect(indexMapper.skipCollection.get('uniqueName')).toBe(skipMap);
    expect(indexMapper.skipCollection.getLength()).toBe(1);

    // We can register map under unique key only once. Otherwise, error should be thrown.
    expect(() => {
      indexMapper.registerMap('uniqueName', skipMap);
    }).toThrow();

    expect(() => {
      indexMapper.registerMap('uniqueName', valueMap);
    }).toThrow();

    expect(indexMapper.skipCollection.get('uniqueName')).toBe(skipMap);
    expect(indexMapper.skipCollection.getLength()).toBe(1);

    indexMapper.registerMap('uniqueName2', valueMap);

    expect(indexMapper.variousMappingsCollection.get('uniqueName2')).toBe(valueMap);
    expect(indexMapper.variousMappingsCollection.getLength()).toBe(1);

    indexMapper.unregisterMap('uniqueName');
    indexMapper.unregisterMap('uniqueName2');
  });

  it('should unregister map', () => {
    const indexMapper = new IndexMapper();
    const skipMap = new SkipMap();

    expect(indexMapper.skipCollection.getLength()).toBe(0);

    indexMapper.registerMap('uniqueName', skipMap);

    expect(indexMapper.skipCollection.get('uniqueName')).toBe(skipMap);
    expect(indexMapper.skipCollection.getLength()).toBe(1);

    indexMapper.unregisterMap('uniqueName', skipMap);

    expect(indexMapper.skipCollection.get('uniqueName')).toBe(undefined);
    expect(indexMapper.skipCollection.getLength()).toBe(0);
  });

  it('should handle `Skip` map properly', () => {
    const indexMapper = new IndexMapper();
    const skipMap = new SkipMap();
    const changeCallback = jasmine.createSpy('change');
    let indexesSequenceOnInit;
    let notSkippedIndexesOnInit;
    let numberOfIndexesOnInit;
    let notSkippedIndexesLengthOnInit;

    indexMapper.addLocalHook('change', changeCallback);

    skipMap.addLocalHook('init', () => {
      indexesSequenceOnInit = indexMapper.getIndexesSequence();
      notSkippedIndexesOnInit = indexMapper.getNotSkippedIndexes();
      numberOfIndexesOnInit = indexMapper.getNumberOfIndexes();
      notSkippedIndexesLengthOnInit = indexMapper.getNotSkippedIndexesLength();

      skipMap.setValueAtIndex(0, true);
      skipMap.setValueAtIndex(2, true);
      skipMap.setValueAtIndex(5, true);
    });

    indexMapper.registerMap('uniqueName', skipMap);

    expect(indexMapper.isSkipped(0)).toBeFalsy();
    expect(indexMapper.isSkipped(2)).toBeFalsy();
    expect(indexMapper.isSkipped(5)).toBeFalsy();

    // Initialization of two maps.
    indexMapper.initToLength(10);

    expect(indexesSequenceOnInit).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(notSkippedIndexesOnInit).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(numberOfIndexesOnInit).toBe(10);
    expect(notSkippedIndexesLengthOnInit).toBe(10);

    expect(indexMapper.getIndexesSequence()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(indexMapper.getNotSkippedIndexes()).toEqual([1, 3, 4, 6, 7, 8, 9]);
    expect(indexMapper.getNumberOfIndexes()).toBe(10);
    expect(indexMapper.getNotSkippedIndexesLength()).toBe(7);

    expect(indexMapper.isSkipped(0)).toBeTruthy();
    expect(indexMapper.isSkipped(2)).toBeTruthy();
    expect(indexMapper.isSkipped(5)).toBeTruthy();

    // 2 maps were initialized and 3 `setValueAtIndex` functions were called.
    expect(changeCallback.calls.count()).toEqual(5);

    indexMapper.unregisterMap('uniqueName');
  });

  it('should translate indexes from visual to physical and the other way round properly', () => {
    const indexMapper = new IndexMapper();
    const skipMap = new SkipMap();

    expect(indexMapper.getVisualIndex(0)).toBe(null);
    expect(indexMapper.getPhysicalIndex(0)).toBe(null);

    indexMapper.initToLength(10);

    expect(indexMapper.getVisualIndex(0)).toBe(0);
    expect(indexMapper.getPhysicalIndex(0)).toBe(0);

    expect(indexMapper.getVisualIndex(10)).toBe(null);
    expect(indexMapper.getPhysicalIndex(10)).toBe(null);

    skipMap.addLocalHook('init', () => {
      skipMap.setValueAtIndex(0, true);
      skipMap.setValueAtIndex(2, true);
      skipMap.setValueAtIndex(5, true);
    });

    indexMapper.registerMap('skipMap', skipMap);

    expect(indexMapper.getVisualIndex(0)).toBe(null);
    expect(indexMapper.getPhysicalIndex(0)).toBe(1);
    expect(indexMapper.getVisualIndex(2)).toBe(null);
    expect(indexMapper.getPhysicalIndex(2)).toBe(4);
    expect(indexMapper.getVisualIndex(5)).toBe(null);
    expect(indexMapper.getPhysicalIndex(5)).toBe(8);

    indexMapper.unregisterMap('skipMap', skipMap);
  });

  describe('removing indexes', () => {
    it('should remove multiple indexes from the start', () => {
      const indexMapper = new IndexMapper();
      const indexMap = new IndexMap();
      const valueMap = new ValueMap(index => index + 2);
      const skipMap = new SkipMap();

      indexMapper.registerMap('indexMap', indexMap);
      indexMapper.registerMap('valueMap', valueMap);
      indexMapper.registerMap('skipMap', skipMap);
      indexMapper.initToLength(10);
      skipMap.setValues([true, false, true, false, true, false, true, false, true, false]);

      indexMapper.removeIndexes([0, 1, 2]);

      expect(indexMapper.getIndexesSequence()).toEqual([0, 1, 2, 3, 4, 5, 6]);
      expect(indexMapper.getNotSkippedIndexes()).toEqual([0, 2, 4, 6]);
      // next values (indexes) are counted again (re-indexed).
      expect(indexMap.getValues()).toEqual([0, 1, 2, 3, 4, 5, 6]);
      // next values are just preserved, they aren't counted again.
      expect(valueMap.getValues()).toEqual([5, 6, 7, 8, 9, 10, 11]);
      expect(skipMap.getValues()).toEqual([false, true, false, true, false, true, false]);

      indexMapper.unregisterMap('indexMap');
      indexMapper.unregisterMap('valueMap');
      indexMapper.unregisterMap('skipMap');
    });

    it('should remove multiple indexes from the middle', () => {
      const indexMapper = new IndexMapper();
      const indexMap = new IndexMap();
      const valueMap = new ValueMap(index => index + 2);
      const skipMap = new SkipMap();

      indexMapper.registerMap('indexMap', indexMap);
      indexMapper.registerMap('valueMap', valueMap);
      indexMapper.registerMap('skipMap', skipMap);
      indexMapper.initToLength(10);
      skipMap.setValues([true, false, true, false, true, false, true, false, true, false]);

      indexMapper.removeIndexes([4, 5]);

      expect(indexMapper.getIndexesSequence()).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
      expect(indexMapper.getNotSkippedIndexes()).toEqual([1, 3, 5, 7]);
      // next values (indexes) are counted again (re-indexed).
      expect(indexMap.getValues()).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
      // next values are just preserved, they aren't counted again.
      expect(valueMap.getValues()).toEqual([2, 3, 4, 5, 8, 9, 10, 11]);
      expect(skipMap.getValues()).toEqual([true, false, true, false, true, false, true, false]);

      indexMapper.unregisterMap('indexMap');
      indexMapper.unregisterMap('valueMap');
      indexMapper.unregisterMap('skipMap');
    });

    it('should remove multiple indexes from the end', () => {
      const indexMapper = new IndexMapper();
      const indexMap = new IndexMap();
      const valueMap = new ValueMap(index => index + 2);
      const skipMap = new SkipMap();

      indexMapper.registerMap('indexMap', indexMap);
      indexMapper.registerMap('valueMap', valueMap);
      indexMapper.registerMap('skipMap', skipMap);
      indexMapper.initToLength(10);
      skipMap.setValues([true, false, true, false, true, false, true, false, true, false]);

      indexMapper.removeIndexes([8, 9]);

      expect(indexMapper.getIndexesSequence()).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
      expect(indexMapper.getNotSkippedIndexes()).toEqual([1, 3, 5, 7]);
      // next values (indexes) are counted again (re-indexed).
      expect(indexMap.getValues()).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
      // next values are just preserved, they aren't counted again.
      expect(valueMap.getValues()).toEqual([2, 3, 4, 5, 6, 7, 8, 9]);
      expect(skipMap.getValues()).toEqual([true, false, true, false, true, false, true, false]);

      indexMapper.unregisterMap('indexMap');
      indexMapper.unregisterMap('valueMap');
      indexMapper.unregisterMap('skipMap');
    });

    it('should remove multiple indexes with mixed order #1', () => {
      const indexMapper = new IndexMapper();
      const indexMap = new IndexMap();
      const valueMap = new ValueMap(index => index + 2);
      const skipMap = new SkipMap();

      indexMapper.registerMap('indexMap', indexMap);
      indexMapper.registerMap('valueMap', valueMap);
      indexMapper.registerMap('skipMap', skipMap);
      indexMapper.initToLength(10);
      skipMap.setValues([true, false, true, false, true, false, true, false, true, false]);

      indexMapper.removeIndexes([0, 1, 3, 5]);

      expect(indexMapper.getIndexesSequence()).toEqual([0, 1, 2, 3, 4, 5]);
      expect(indexMapper.getNotSkippedIndexes()).toEqual([3, 5]);
      // next values (indexes) are counted again (re-indexed).
      expect(indexMap.getValues()).toEqual([0, 1, 2, 3, 4, 5]);
      // next values are just preserved, they aren't counted again.
      expect(valueMap.getValues()).toEqual([4, 6, 8, 9, 10, 11]);
      expect(skipMap.getValues()).toEqual([true, true, true, false, true, false]);

      indexMapper.unregisterMap('indexMap');
      indexMapper.unregisterMap('valueMap');
      indexMapper.unregisterMap('skipMap');
    });

    it('should remove multiple indexes with mixed order #2', () => {
      const indexMapper = new IndexMapper();
      const indexMap = new IndexMap();
      const valueMap = new ValueMap(index => index + 2);
      const skipMap = new SkipMap();

      indexMapper.registerMap('indexMap', indexMap);
      indexMapper.registerMap('valueMap', valueMap);
      indexMapper.registerMap('skipMap', skipMap);
      indexMapper.initToLength(10);
      skipMap.setValues([true, false, true, false, true, false, true, false, true, false]);

      indexMapper.removeIndexes([5, 3, 1, 0]);

      expect(indexMapper.getIndexesSequence()).toEqual([0, 1, 2, 3, 4, 5]);
      expect(indexMapper.getNotSkippedIndexes()).toEqual([3, 5]);
      // next values (indexes) are counted again (re-indexed).
      expect(indexMap.getValues()).toEqual([0, 1, 2, 3, 4, 5]);
      // next values are just preserved, they aren't counted again.
      expect(valueMap.getValues()).toEqual([4, 6, 8, 9, 10, 11]);
      expect(skipMap.getValues()).toEqual([true, true, true, false, true, false]);

      indexMapper.unregisterMap('indexMap');
      indexMapper.unregisterMap('valueMap');
      indexMapper.unregisterMap('skipMap');
    });

    it('should remove multiple indexes with mixed order #3', () => {
      const indexMapper = new IndexMapper();
      const indexMap = new IndexMap();
      const valueMap = new ValueMap(index => index + 2);
      const skipMap = new SkipMap();

      indexMapper.registerMap('indexMap', indexMap);
      indexMapper.registerMap('valueMap', valueMap);
      indexMapper.registerMap('skipMap', skipMap);
      indexMapper.initToLength(10);
      skipMap.setValues([true, false, true, false, true, false, true, false, true, false]);

      indexMapper.removeIndexes([0, 5, 3, 1]);

      expect(indexMapper.getIndexesSequence()).toEqual([0, 1, 2, 3, 4, 5]);
      expect(indexMapper.getNotSkippedIndexes()).toEqual([3, 5]);
      // next values (indexes) are counted again (re-indexed).
      expect(indexMap.getValues()).toEqual([0, 1, 2, 3, 4, 5]);
      // next values are just preserved, they aren't counted again.
      expect(valueMap.getValues()).toEqual([4, 6, 8, 9, 10, 11]);
      expect(skipMap.getValues()).toEqual([true, true, true, false, true, false]);

      indexMapper.unregisterMap('indexMap');
      indexMapper.unregisterMap('valueMap');
      indexMapper.unregisterMap('skipMap');
    });
  });

  describe('inserting indexes', () => {
    describe('without skipped indexes', () => {
      it('should insert multiple indexes at the start', () => {
        const indexMapper = new IndexMapper();
        const indexMap = new IndexMap();
        const valueMap = new ValueMap(index => index + 2);

        indexMapper.registerMap('indexMap', indexMap);
        indexMapper.registerMap('valueMap', valueMap);
        indexMapper.initToLength(10);

        indexMapper.insertIndexes(0, 3);

        expect(indexMapper.getIndexesSequence()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
        // next values (indexes) are counted again (re-indexed).
        expect(indexMap.getValues()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
        // next values are just preserved, they aren't counted again.
        expect(valueMap.getValues()).toEqual([2, 3, 4, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);

        indexMapper.unregisterMap('indexMap');
        indexMapper.unregisterMap('valueMap');
      });

      it('should insert multiple indexes at the middle', () => {
        const indexMapper = new IndexMapper();
        const indexMap = new IndexMap();
        const valueMap = new ValueMap(index => index + 2);

        indexMapper.registerMap('indexMap', indexMap);
        indexMapper.registerMap('valueMap', valueMap);
        indexMapper.initToLength(10);

        indexMapper.insertIndexes(4, 3);

        expect(indexMapper.getIndexesSequence()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
        // next values (indexes) are counted again (re-indexed).
        expect(indexMap.getValues()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
        // next values are just preserved, they aren't counted again.
        expect(valueMap.getValues()).toEqual([2, 3, 4, 5, 6, 7, 8, 6, 7, 8, 9, 10, 11]);

        indexMapper.unregisterMap('indexMap');
        indexMapper.unregisterMap('valueMap');
      });

      it('should insert multiple indexes next to the end', () => {
        const indexMapper = new IndexMapper();
        const indexMap = new IndexMap();
        const valueMap = new ValueMap(index => index + 2);

        indexMapper.registerMap('indexMap', indexMap);
        indexMapper.registerMap('valueMap', valueMap);
        indexMapper.initToLength(10);

        indexMapper.insertIndexes(9, 3);

        expect(indexMapper.getIndexesSequence()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
        // next values (indexes) are counted again (re-indexed).
        expect(indexMap.getValues()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
        // next values are just preserved, they aren't counted again.
        expect(valueMap.getValues()).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 11]);

        indexMapper.unregisterMap('indexMap');
        indexMapper.unregisterMap('valueMap');
      });

      it('should insert multiple indexes at the end (index equal to the length of maps)', () => {
        const indexMapper = new IndexMapper();
        const indexMap = new IndexMap();
        const valueMap = new ValueMap(index => index + 2);

        indexMapper.registerMap('indexMap', indexMap);
        indexMapper.registerMap('valueMap', valueMap);
        indexMapper.initToLength(10);

        indexMapper.insertIndexes(10, 3);

        expect(indexMapper.getIndexesSequence()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
        // next values (indexes) are counted again (re-indexed).
        expect(indexMap.getValues()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
        // next values are just preserved, they aren't counted again.
        expect(valueMap.getValues()).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);

        indexMapper.unregisterMap('indexMap');
        indexMapper.unregisterMap('valueMap');
      });

      it('should insert multiple indexes at the end (index higher than length of maps)', () => {
        const indexMapper = new IndexMapper();
        const indexMap = new IndexMap();
        const valueMap = new ValueMap(index => index + 2);

        indexMapper.registerMap('indexMap', indexMap);
        indexMapper.registerMap('valueMap', valueMap);
        indexMapper.initToLength(10);

        indexMapper.insertIndexes(12, 3);

        expect(indexMapper.getIndexesSequence()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
        // next values (indexes) are counted again (re-indexed).
        expect(indexMap.getValues()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
        // next values are just preserved, they aren't counted again.
        expect(valueMap.getValues()).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);

        indexMapper.unregisterMap('indexMap');
        indexMapper.unregisterMap('valueMap');
      });
    });

    describe('with skipped indexes', () => {
      it('should insert indexes properly when just some indexes skipped', () => {
        const indexMapper = new IndexMapper();
        const indexMap = new IndexMap();
        const valueMap = new ValueMap(index => index + 2);
        const skipMap = new SkipMap();

        indexMapper.registerMap('indexMap', indexMap);
        indexMapper.registerMap('valueMap', valueMap);
        indexMapper.registerMap('skipMap', skipMap);
        indexMapper.initToLength(10);
        skipMap.setValues([true, true, true, true, false, false, false, false, false, false]);

        indexMapper.insertIndexes(0, 3);

        expect(indexMapper.getIndexesSequence()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
        expect(indexMapper.getNotSkippedIndexes()).toEqual([4, 5, 6, 7, 8, 9, 10, 11, 12]);
        // // next values (indexes) are counted again (re-indexed).
        expect(indexMap.getValues()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
        // // next values are just preserved, they aren't counted again.
        expect(valueMap.getValues()).toEqual([2, 3, 4, 5, 6, 7, 8, 6, 7, 8, 9, 10, 11]);
        expect(skipMap.getValues()).toEqual([true, true, true, true, false, false, false, false, false, false, false, false, false]);

        indexMapper.unregisterMap('indexMap');
        indexMapper.unregisterMap('valueMap');
        indexMapper.unregisterMap('skipMap');
      });

      it('should insert indexes properly when all indexes are skipped', () => {
        const indexMapper = new IndexMapper();
        const indexMap = new IndexMap();
        const valueMap = new ValueMap(index => index + 2);
        const skipMap = new SkipMap();

        indexMapper.registerMap('indexMap', indexMap);
        indexMapper.registerMap('valueMap', valueMap);
        indexMapper.registerMap('skipMap', skipMap);
        indexMapper.initToLength(10);
        skipMap.setValues([true, true, true, true, true, true, true, true, true, true]);

        indexMapper.insertIndexes(0, 3);

        expect(indexMapper.getIndexesSequence()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
        expect(indexMapper.getNotSkippedIndexes()).toEqual([10, 11, 12]);
        // // next values (indexes) are counted again (re-indexed).
        expect(indexMap.getValues()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
        // // next values are just preserved, they aren't counted again.
        expect(valueMap.getValues()).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
        expect(skipMap.getValues()).toEqual([true, true, true, true, true, true, true, true, true, true, false, false, false]);
      });
    });
  });

  describe('moving indexes', () => {
    it('should move single, given index', () => {
      const indexMapper = new IndexMapper();
      indexMapper.initToLength(10);

      indexMapper.moveIndexes([8], 0); // [8, 0, 1, 2, 3, 4, 5, 6, 7, 9]
      indexMapper.moveIndexes([3], 1); // [8, 2, 0, 1, 3, 4, 5, 6, 7, 9]
      indexMapper.moveIndexes([5], 2);

      expect(indexMapper.getIndexesSequence()).toEqual([8, 2, 4, 0, 1, 3, 5, 6, 7, 9]);
    });

    it('should not change order of indexes after specific move', () => {
      const indexMapper = new IndexMapper();
      indexMapper.initToLength(10);

      indexMapper.moveIndexes([0], 0);
      expect(indexMapper.getIndexesSequence()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

      indexMapper.moveIndexes([9], 9);

      expect(indexMapper.getIndexesSequence()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

      indexMapper.moveIndexes([0, 1, 2], 0);

      expect(indexMapper.getIndexesSequence()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

      // move full array
      indexMapper.moveIndexes([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 0);

      expect(indexMapper.getIndexesSequence()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

      // too high destination index
      indexMapper.moveIndexes([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 100);

      expect(indexMapper.getIndexesSequence()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

      // too low destination index
      indexMapper.moveIndexes([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], -1);
    });

    it('should change order of indexes in place', () => {
      const indexMapper = new IndexMapper();
      indexMapper.initToLength(10);

      indexMapper.moveIndexes([9, 8, 7, 6, 5, 4, 3, 0, 1, 2], 0);
      expect(indexMapper.getIndexesSequence()).toEqual([9, 8, 7, 6, 5, 4, 3, 0, 1, 2]);
    });

    describe('should move given indexes properly from the top to the bottom', () => {
      it('ascending order of moved indexes', () => {
        const indexMapper = new IndexMapper();
        indexMapper.initToLength(10);

        indexMapper.moveIndexes([0, 1, 2, 3], 5);
        expect(indexMapper.getIndexesSequence()).toEqual([4, 5, 6, 7, 8, 0, 1, 2, 3, 9]);
      });

      it('descending order of moved indexes', () => {
        const indexMapper = new IndexMapper();
        indexMapper.initToLength(10);

        indexMapper.moveIndexes([3, 2, 1, 0], 5);
        expect(indexMapper.getIndexesSequence()).toEqual([4, 5, 6, 7, 8, 3, 2, 1, 0, 9]);
      });

      it('mixed order of moved indexes', () => {
        const indexMapper = new IndexMapper();
        indexMapper.initToLength(10);

        indexMapper.moveIndexes([1, 3, 2, 0], 5);
        expect(indexMapper.getIndexesSequence()).toEqual([4, 5, 6, 7, 8, 1, 3, 2, 0, 9]);
      });
    });

    describe('should move given indexes properly from the bottom to the top', () => {
      it('ascending order of moved indexes', () => {
        const indexMapper = new IndexMapper();
        indexMapper.initToLength(10);

        indexMapper.moveIndexes([4, 5, 6, 7], 2);
        expect(indexMapper.getIndexesSequence()).toEqual([0, 1, 4, 5, 6, 7, 2, 3, 8, 9]);
      });

      it('descending order of moved indexes', () => {
        const indexMapper = new IndexMapper();
        indexMapper.initToLength(10);

        indexMapper.moveIndexes([7, 6, 5, 4], 2);
        expect(indexMapper.getIndexesSequence()).toEqual([0, 1, 7, 6, 5, 4, 2, 3, 8, 9]);
      });

      it('mixed order of moved indexes', () => {
        const indexMapper = new IndexMapper();
        indexMapper.initToLength(10);

        indexMapper.moveIndexes([7, 5, 4, 6], 2);
        expect(indexMapper.getIndexesSequence()).toEqual([0, 1, 7, 5, 4, 6, 2, 3, 8, 9]);
      });
    });

    describe('should move given indexes properly when sequence of moves is mixed', () => {
      it('ascending order of moved indexes', () => {
        const indexMapper = new IndexMapper();
        indexMapper.initToLength(10);

        indexMapper.moveIndexes([1, 2, 6, 7], 4);
        expect(indexMapper.getIndexesSequence()).toEqual([0, 3, 4, 5, 1, 2, 6, 7, 8, 9]);
      });

      it('descending order of moved indexes', () => {
        const indexMapper = new IndexMapper();
        indexMapper.initToLength(10);

        indexMapper.moveIndexes([7, 6, 2, 1], 4);
        expect(indexMapper.getIndexesSequence()).toEqual([0, 3, 4, 5, 7, 6, 2, 1, 8, 9]);
      });

      it('mixed order of moved indexes', () => {
        const indexMapper = new IndexMapper();
        indexMapper.initToLength(10);

        indexMapper.moveIndexes([7, 2, 1, 6], 4);
        expect(indexMapper.getIndexesSequence()).toEqual([0, 3, 4, 5, 7, 2, 1, 6, 8, 9]);
      });
    });
  });
});
