import IndexMapper from 'handsontable/translations/indexMapper';
import { SkipMap, PhysicalIndexToValueMap as IndexToValueMap, VisualIndexToPhysicalIndexMap as IndexToIndexMap } from 'handsontable/translations';

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

  it('should register map to a proper collection when it is possible', () => {
    const indexMapper = new IndexMapper();
    const skipMap = new SkipMap();
    const indexToValueMap = new IndexToValueMap();

    expect(indexMapper.skipMapsCollection.getLength()).toBe(0);

    indexMapper.registerMap('uniqueName', skipMap);

    expect(indexMapper.skipMapsCollection.get('uniqueName')).toBe(skipMap);
    expect(indexMapper.skipMapsCollection.getLength()).toBe(1);

    // We can register map under unique key only once. Otherwise, error should be thrown.
    expect(() => {
      indexMapper.registerMap('uniqueName', skipMap);
    }).toThrow();

    expect(() => {
      indexMapper.registerMap('uniqueName', indexToValueMap);
    }).toThrow();

    expect(indexMapper.skipMapsCollection.get('uniqueName')).toBe(skipMap);
    expect(indexMapper.skipMapsCollection.getLength()).toBe(1);

    indexMapper.registerMap('uniqueName2', indexToValueMap);

    expect(indexMapper.variousMapsCollection.get('uniqueName2')).toBe(indexToValueMap);
    expect(indexMapper.variousMapsCollection.getLength()).toBe(1);

    indexMapper.unregisterMap('uniqueName');
    indexMapper.unregisterMap('uniqueName2');
  });

  it('should unregister a map', () => {
    const indexMapper = new IndexMapper();
    const skipMap = new SkipMap();

    expect(indexMapper.skipMapsCollection.getLength()).toBe(0);

    indexMapper.registerMap('uniqueName', skipMap);

    expect(indexMapper.skipMapsCollection.get('uniqueName')).toBe(skipMap);
    expect(indexMapper.skipMapsCollection.getLength()).toBe(1);

    indexMapper.unregisterMap('uniqueName', skipMap);

    expect(indexMapper.skipMapsCollection.get('uniqueName')).toBe(undefined);
    expect(indexMapper.skipMapsCollection.getLength()).toBe(0);
  });

  it('should handle the `Skip` map properly', () => {
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

    // Maps are filled with default values before calling the `init` hook.
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

    // 2 maps were initialized and 3 `setValueAtIndex` functions have been called.
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

  describe('removing items', () => {
    describe('with skipped indexes', () => {
      it('should remove multiple items from the start', () => {
        const indexMapper = new IndexMapper();
        const indexToIndexMap = new IndexToIndexMap();
        const indexToValueMap = new IndexToValueMap(index => index + 2);
        const skipMap = new SkipMap();

        indexMapper.registerMap('indexToIndexMap', indexToIndexMap);
        indexMapper.registerMap('indexToValueMap', indexToValueMap);
        indexMapper.registerMap('skipMap', skipMap);
        indexMapper.initToLength(10);
        skipMap.setValues([true, false, true, false, true, false, true, false, true, false]);

        indexMapper.removeIndexes([0, 1, 2]);

        expect(indexMapper.getIndexesSequence()).toEqual([0, 1, 2, 3, 4, 5, 6]);
        expect(indexMapper.getNotSkippedIndexes()).toEqual([0, 2, 4, 6]);
        // Next values (indexes) are recounted (re-indexed).
        expect(indexToIndexMap.getValues()).toEqual([0, 1, 2, 3, 4, 5, 6]);
        // Next values are just preserved.
        expect(indexToValueMap.getValues()).toEqual([5, 6, 7, 8, 9, 10, 11]);
        expect(skipMap.getValues()).toEqual([false, true, false, true, false, true, false]);

        indexMapper.unregisterMap('indexToIndexMap');
        indexMapper.unregisterMap('indexToValueMap');
        indexMapper.unregisterMap('skipMap');
      });

      it('should remove multiple items from the middle', () => {
        const indexMapper = new IndexMapper();
        const indexToIndexMap = new IndexToIndexMap();
        const indexToValueMap = new IndexToValueMap(index => index + 2);
        const skipMap = new SkipMap();

        indexMapper.registerMap('indexToIndexMap', indexToIndexMap);
        indexMapper.registerMap('indexToValueMap', indexToValueMap);
        indexMapper.registerMap('skipMap', skipMap);
        indexMapper.initToLength(10);
        skipMap.setValues([true, false, true, false, true, false, true, false, true, false]);

        indexMapper.removeIndexes([4, 5]);

        expect(indexMapper.getIndexesSequence()).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
        expect(indexMapper.getNotSkippedIndexes()).toEqual([1, 3, 5, 7]);
        // Next values (indexes) are recounted (re-indexed).
        expect(indexToIndexMap.getValues()).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
        // Next values are just preserved.
        expect(indexToValueMap.getValues()).toEqual([2, 3, 4, 5, 8, 9, 10, 11]);
        expect(skipMap.getValues()).toEqual([true, false, true, false, true, false, true, false]);

        indexMapper.unregisterMap('indexToIndexMap');
        indexMapper.unregisterMap('indexToValueMap');
        indexMapper.unregisterMap('skipMap');
      });

      it('should remove multiple items from the end', () => {
        const indexMapper = new IndexMapper();
        const indexToIndexMap = new IndexToIndexMap();
        const indexToValueMap = new IndexToValueMap(index => index + 2);
        const skipMap = new SkipMap();

        indexMapper.registerMap('indexToIndexMap', indexToIndexMap);
        indexMapper.registerMap('indexToValueMap', indexToValueMap);
        indexMapper.registerMap('skipMap', skipMap);
        indexMapper.initToLength(10);
        skipMap.setValues([true, false, true, false, true, false, true, false, true, false]);

        indexMapper.removeIndexes([8, 9]);

        // Items from the end was removed, no re-indexation.
        expect(indexMapper.getIndexesSequence()).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
        expect(indexMapper.getNotSkippedIndexes()).toEqual([1, 3, 5, 7]);
        // Items from the end was removed, no re-indexation.
        expect(indexToIndexMap.getValues()).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
        // Items from the end was removed.
        expect(indexToValueMap.getValues()).toEqual([2, 3, 4, 5, 6, 7, 8, 9]);
        expect(skipMap.getValues()).toEqual([true, false, true, false, true, false, true, false]);

        indexMapper.unregisterMap('indexToIndexMap');
        indexMapper.unregisterMap('indexToValueMap');
        indexMapper.unregisterMap('skipMap');
      });

      it('should remove multiple items with mixed order #1', () => {
        const indexMapper = new IndexMapper();
        const indexToIndexMap = new IndexToIndexMap();
        const indexToValueMap = new IndexToValueMap(index => index + 2);
        const skipMap = new SkipMap();

        indexMapper.registerMap('indexToIndexMap', indexToIndexMap);
        indexMapper.registerMap('indexToValueMap', indexToValueMap);
        indexMapper.registerMap('skipMap', skipMap);
        indexMapper.initToLength(10);
        skipMap.setValues([true, false, true, false, true, false, true, false, true, false]);

        indexMapper.removeIndexes([0, 1, 3, 5]);

        expect(indexMapper.getIndexesSequence()).toEqual([0, 1, 2, 3, 4, 5]);
        expect(indexMapper.getNotSkippedIndexes()).toEqual([3, 5]);
        // Next values (indexes) are recounted (re-indexed).
        expect(indexToIndexMap.getValues()).toEqual([0, 1, 2, 3, 4, 5]);
        // Next values are just preserved.
        expect(indexToValueMap.getValues()).toEqual([4, 6, 8, 9, 10, 11]);
        expect(skipMap.getValues()).toEqual([true, true, true, false, true, false]);

        indexMapper.unregisterMap('indexToIndexMap');
        indexMapper.unregisterMap('indexToValueMap');
        indexMapper.unregisterMap('skipMap');
      });

      it('should remove multiple items with mixed order #2', () => {
        const indexMapper = new IndexMapper();
        const indexToIndexMap = new IndexToIndexMap();
        const indexToValueMap = new IndexToValueMap(index => index + 2);
        const skipMap = new SkipMap();

        indexMapper.registerMap('indexToIndexMap', indexToIndexMap);
        indexMapper.registerMap('indexToValueMap', indexToValueMap);
        indexMapper.registerMap('skipMap', skipMap);
        indexMapper.initToLength(10);
        skipMap.setValues([true, false, true, false, true, false, true, false, true, false]);

        indexMapper.removeIndexes([5, 3, 1, 0]);

        expect(indexMapper.getIndexesSequence()).toEqual([0, 1, 2, 3, 4, 5]);
        expect(indexMapper.getNotSkippedIndexes()).toEqual([3, 5]);
        // Next values (indexes) are recounted (re-indexed).
        expect(indexToIndexMap.getValues()).toEqual([0, 1, 2, 3, 4, 5]);
        // Next values are just preserved.
        expect(indexToValueMap.getValues()).toEqual([4, 6, 8, 9, 10, 11]);
        expect(skipMap.getValues()).toEqual([true, true, true, false, true, false]);

        indexMapper.unregisterMap('indexToIndexMap');
        indexMapper.unregisterMap('indexToValueMap');
        indexMapper.unregisterMap('skipMap');
      });

      it('should remove multiple items with mixed order #3', () => {
        const indexMapper = new IndexMapper();
        const indexToIndexMap = new IndexToIndexMap();
        const indexToValueMap = new IndexToValueMap(index => index + 2);
        const skipMap = new SkipMap();

        indexMapper.registerMap('indexToIndexMap', indexToIndexMap);
        indexMapper.registerMap('indexToValueMap', indexToValueMap);
        indexMapper.registerMap('skipMap', skipMap);
        indexMapper.initToLength(10);
        skipMap.setValues([true, false, true, false, true, false, true, false, true, false]);

        indexMapper.removeIndexes([0, 5, 3, 1]);

        expect(indexMapper.getIndexesSequence()).toEqual([0, 1, 2, 3, 4, 5]);
        expect(indexMapper.getNotSkippedIndexes()).toEqual([3, 5]);
        // Next values (indexes) are recounted (re-indexed).
        expect(indexToIndexMap.getValues()).toEqual([0, 1, 2, 3, 4, 5]);
        // Next values are just preserved.
        expect(indexToValueMap.getValues()).toEqual([4, 6, 8, 9, 10, 11]);
        expect(skipMap.getValues()).toEqual([true, true, true, false, true, false]);

        indexMapper.unregisterMap('indexToIndexMap');
        indexMapper.unregisterMap('indexToValueMap');
        indexMapper.unregisterMap('skipMap');
      });
    });
  });

  describe('inserting items', () => {
    describe('without skipped indexes', () => {
      it('should insert multiple items at the start', () => {
        const indexMapper = new IndexMapper();
        const indexToIndexMap = new IndexToIndexMap();
        const indexToValueMap = new IndexToValueMap(index => index + 2);

        indexMapper.registerMap('indexToIndexMap', indexToIndexMap);
        indexMapper.registerMap('indexToValueMap', indexToValueMap);
        indexMapper.initToLength(10);

        indexMapper.insertIndexes(0, 3);

        // Next values (indexes) are recounted (re-indexed).
        //                                         inserted items   recounted indexes (+3 added for each original one)
        //                                                /  |  \  /  |  |  |  |  |  |  |   |   \
        expect(indexMapper.getIndexesSequence()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
        // Next values (indexes) are recounted (re-indexed).
        //                                    inserted items   recounted indexes (+3 added for each original one)
        //                                           /  |  \  /  |  |  |  |  |  |  |   |   \
        expect(indexToIndexMap.getValues()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
        // Next values are just preserved.
        //                                    inserted items          shifted items
        //                                           /  |  \  /  |  |  |  |  |  |  |  |  \
        expect(indexToValueMap.getValues()).toEqual([2, 3, 4, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);

        indexMapper.unregisterMap('indexToIndexMap');
        indexMapper.unregisterMap('indexToValueMap');
      });

      it('should insert multiple items in the middle', () => {
        const indexMapper = new IndexMapper();
        const indexToIndexMap = new IndexToIndexMap();
        const indexToValueMap = new IndexToValueMap(index => index + 2);

        indexMapper.registerMap('indexToIndexMap', indexToIndexMap);
        indexMapper.registerMap('indexToValueMap', indexToValueMap);
        indexMapper.initToLength(10);

        indexMapper.insertIndexes(4, 3);

        // Next values (indexes) are recounted (re-indexed).
        //                                                     inserted items  recounted indexes (+3 added for each original one)
        //                                                            /  |  \  /  |  |  |   |   \
        expect(indexMapper.getIndexesSequence()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
        // Next values (indexes) are recounted (re-indexed).
        //                                                inserted items  recounted indexes (+3 added for each original one)
        //                                                       /  |  \  /  |  |   |  |   \
        expect(indexToIndexMap.getValues()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
        // Next values are just preserved.
        //                                                inserted items    shifted items
        //                                                       /  |  \  /  |  |  |  |   \
        expect(indexToValueMap.getValues()).toEqual([2, 3, 4, 5, 6, 7, 8, 6, 7, 8, 9, 10, 11]);

        indexMapper.unregisterMap('indexToIndexMap');
        indexMapper.unregisterMap('indexToValueMap');
      });

      it('should insert multiple items next to the end', () => {
        const indexMapper = new IndexMapper();
        const indexToIndexMap = new IndexToIndexMap();
        const indexToValueMap = new IndexToValueMap(index => index + 2);

        indexMapper.registerMap('indexToIndexMap', indexToIndexMap);
        indexMapper.registerMap('indexToValueMap', indexToValueMap);
        indexMapper.initToLength(10);

        indexMapper.insertIndexes(9, 3);

        // Next values (indexes) are recounted (re-indexed).
        //                                                                    inserted items   recounted index (+3 added for each original one)
        //                                                                           /  |  \     |
        expect(indexMapper.getIndexesSequence()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
        // Next values (indexes) are recounted (re-indexed).
        //                                                               inserted items   recounted index (+3 added for each original one)
        //                                                                      /  |  \     |
        expect(indexToIndexMap.getValues()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
        // Next values are just preserved.
        //                                                                 inserted items  shifted item
        //                                                                        /  |  \     |
        expect(indexToValueMap.getValues()).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 11]);

        indexMapper.unregisterMap('indexToIndexMap');
        indexMapper.unregisterMap('indexToValueMap');
      });

      it('should insert multiple items at the end (insert position equal to the length of maps)', () => {
        const indexMapper = new IndexMapper();
        const indexToIndexMap = new IndexToIndexMap();
        const indexToValueMap = new IndexToValueMap(index => index + 2);

        indexMapper.registerMap('indexToIndexMap', indexToIndexMap);
        indexMapper.registerMap('indexToValueMap', indexToValueMap);
        indexMapper.initToLength(10);

        indexMapper.insertIndexes(10, 3);

        // Just adding new items at the end.
        //                                                                            inserted items
        //                                                                               /  |  \
        expect(indexMapper.getIndexesSequence()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
        // Just adding new items at the end.
        //                                                                       inserted items
        //                                                                          /  |  \
        expect(indexToIndexMap.getValues()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
        // Just adding new items at the end.
        //                                                                         inserted items
        //                                                                            /  |  \
        expect(indexToValueMap.getValues()).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);

        indexMapper.unregisterMap('indexToIndexMap');
        indexMapper.unregisterMap('indexToValueMap');
      });

      it('should insert multiple items at the end (insert position higher than length of maps)', () => {
        const indexMapper = new IndexMapper();
        const indexToIndexMap = new IndexToIndexMap();
        const indexToValueMap = new IndexToValueMap(index => index + 2);

        indexMapper.registerMap('indexToIndexMap', indexToIndexMap);
        indexMapper.registerMap('indexToValueMap', indexToValueMap);
        indexMapper.initToLength(10);

        indexMapper.insertIndexes(12, 3);

        // Just adding new items at the end.
        //                                                                             inserted items
        //                                                                                /  |  \
        expect(indexMapper.getIndexesSequence()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
        // Just adding new items at the end.
        //                                                                        inserted items
        //                                                                           /  |  \
        expect(indexToIndexMap.getValues()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
        // Just adding new items at the end.
        //                                                                          inserted items
        //                                                                             /  |  \
        expect(indexToValueMap.getValues()).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);

        indexMapper.unregisterMap('indexToIndexMap');
        indexMapper.unregisterMap('indexToValueMap');
      });

      it('should insert item properly when starting sequence of indexes is from `n` to `0`, where `n` is number of indexes minus 1', () => {
        const indexMapper = new IndexMapper();

        indexMapper.initToLength(5);
        indexMapper.setIndexesSequence([4, 3, 2, 1, 0]);
        indexMapper.insertIndexes(1, 1);

        // Inserted item will be placed at the 1st visual position. At 1st visual position there is already element with index 3.
        // Newly created item will get index of the originally existing item and will shift all "next elements" (with next indexes).
        // Thus, all items with original indexes >= 3 will get indexes increased by 1.

        // Appointed index: 3, Items with "starting indexes" >= 3 increased.
        //
        //                                                   +---------------- inserted item with appointed index 3
        //                                                   |
        //                                                +------------------- increased indexes of items (originally indexes 4, 3)
        //                                                |  |  |
        //                                                |  |  |
        expect(indexMapper.getIndexesSequence()).toEqual([5, 3, 4, 2, 1, 0]);

        indexMapper.insertIndexes(0, 1);

        // Appointed index: 5, Items with "starting indexes" >= 5 increased.
        expect(indexMapper.getIndexesSequence()).toEqual([5, 6, 3, 4, 2, 1, 0]);

        indexMapper.insertIndexes(7, 1);

        // Appointed index: 7, no items with "starting indexes" >= 7.
        expect(indexMapper.getIndexesSequence()).toEqual([5, 6, 3, 4, 2, 1, 0, 7]);
      });
    });

    describe('with skipped indexes', () => {
      it('should not reindex skipped indexes in the specific situation', () => {
        const indexMapper = new IndexMapper();
        const skipMap = new SkipMap();

        indexMapper.registerMap('skipMap', skipMap);
        indexMapper.initToLength(10);
        skipMap.setValues([true, true, true, true, false, false, false, false, false, false]);

        expect(indexMapper.getNotSkippedIndexes()).toEqual([4, 5, 6, 7, 8, 9]); // skipped indexes: 0, 1, 2, 3 <---

        indexMapper.insertIndexes(0, 3);

        expect(indexMapper.getNotSkippedIndexes()).toEqual([4, 5, 6, 7, 8, 9, 10, 11, 12]); // skipped indexes: 0, 1, 2, 3 <---
        expect(skipMap.getValues()).toEqual([true, true, true, true, false, false, false, false, false, false, false, false, false]);

        indexMapper.unregisterMap('skipMap');
      });

      it('should reindex skipped indexes', () => {
        const indexMapper = new IndexMapper();
        const skipMap = new SkipMap();

        indexMapper.registerMap('skipMap', skipMap);
        indexMapper.initToLength(10);
        skipMap.setValues([false, false, false, false, false, false, true, true, true, true]);

        expect(indexMapper.getNotSkippedIndexes()).toEqual([0, 1, 2, 3, 4, 5]); // skipped indexes: 6, 7, 8, 9 <---

        indexMapper.insertIndexes(0, 3);

        expect(indexMapper.getNotSkippedIndexes()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]); // skipped indexes: 9, 10, 11, 12 <---
        expect(skipMap.getValues()).toEqual([false, false, false, false, false, false, false, false, false, true, true, true, true]);

        indexMapper.unregisterMap('skipMap');
      });

      it('should insert item properly when adding it on the position of an skipped index - actually placing it just after the skipped indexes', () => {
        const indexMapper = new IndexMapper();
        const indexToIndexMap = new IndexToIndexMap();
        const indexToValueMap = new IndexToValueMap(index => index + 2);
        const skipMap = new SkipMap();

        indexMapper.registerMap('indexToIndexMap', indexToIndexMap);
        indexMapper.registerMap('indexToValueMap', indexToValueMap);
        indexMapper.registerMap('skipMap', skipMap);
        indexMapper.initToLength(10);
        skipMap.setValues([false, false, false, true, true, false, false, false, false, false]);

        // Element is inserted at 5th position (before 6th element, because 3rd and 4th elements are skipped).
        indexMapper.insertIndexes(3, 1);

        // Next values (indexes) are recounted (re-indexed).
        //                                   inserted item ------------+   recounted indexes (+1 added for each original one)
        //                                   (2 skipped indexes before) \   /  |  |  |  \
        expect(indexMapper.getIndexesSequence()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        expect(indexMapper.getNotSkippedIndexes()).toEqual([0, 1, 2, 5, 6, 7, 8, 9, 10]);

        // Next values (indexes) are recounted (re-indexed).
        //                              inserted item ------------+   recounted indexes (+1 added for each original one)
        //                              (2 skipped indexes before) \   /  |  |  |  \
        expect(indexToIndexMap.getValues()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

        // Next values are just preserved.
        //                               inserted item ------------+      shifted items
        //                               (2 skipped indexes before) \   /  |  |  |  \
        expect(indexToValueMap.getValues()).toEqual([2, 3, 4, 5, 6, 7, 7, 8, 9, 10, 11]);
        expect(skipMap.getValues()).toEqual([false, false, false, true, true, false, false, false, false, false, false]);

        indexMapper.unregisterMap('indexToIndexMap');
        indexMapper.unregisterMap('indexToValueMap');
        indexMapper.unregisterMap('skipMap');
      });

      it('should insert item properly then adding it on the position just before an skipped index', () => {
        const indexMapper = new IndexMapper();
        const indexToIndexMap = new IndexToIndexMap();
        const indexToValueMap = new IndexToValueMap(index => index + 2);
        const skipMap = new SkipMap();

        indexMapper.registerMap('indexToIndexMap', indexToIndexMap);
        indexMapper.registerMap('indexToValueMap', indexToValueMap);
        indexMapper.registerMap('skipMap', skipMap);
        indexMapper.initToLength(10);
        skipMap.setValues([false, false, false, true, true, false, false, false, false, false]);

        indexMapper.insertIndexes(2, 1);

        // Next values (indexes) are recounted (re-indexed).
        //                         inserted item -------------+   recounted indexes (+1 added for eacqh original one)
        //                         (no skipped indexes before) \   /  |  |  |  |  |  |  \
        expect(indexMapper.getIndexesSequence()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        expect(indexMapper.getNotSkippedIndexes()).toEqual([0, 1, 2, 3, 6, 7, 8, 9, 10]);

        // Next values (indexes) are recounted (re-indexed).
        //                    inserted item -------------+   recounted indexes (+1 added for each original one)
        //                    (no skipped indexes before) \   /  |  |  |  |  |  |  \
        expect(indexToIndexMap.getValues()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

        // Next values are just preserved.
        //                    inserted item -------------+         shifted items
        //                    (no skipped indexes before) \   /  |  |  |  |  |  |  \
        expect(indexToValueMap.getValues()).toEqual([2, 3, 4, 4, 5, 6, 7, 8, 9, 10, 11]);
        expect(skipMap.getValues()).toEqual([false, false, false, false, true, true, false, false, false, false, false]);

        indexMapper.unregisterMap('indexToIndexMap');
        indexMapper.unregisterMap('indexToValueMap');
        indexMapper.unregisterMap('skipMap');
      });

      it('should insert items properly when all indexes are skipped', () => {
        const indexMapper = new IndexMapper();
        const indexToIndexMap = new IndexToIndexMap();
        const indexToValueMap = new IndexToValueMap(index => index + 2);
        const skipMap = new SkipMap();

        indexMapper.registerMap('indexToIndexMap', indexToIndexMap);
        indexMapper.registerMap('indexToValueMap', indexToValueMap);
        indexMapper.registerMap('skipMap', skipMap);
        indexMapper.initToLength(10);
        skipMap.setValues([true, true, true, true, true, true, true, true, true, true]);

        indexMapper.insertIndexes(0, 3);

        // Just adding new items at the end.
        //                                                                            inserted items
        //                                                                               /  |  \
        expect(indexMapper.getIndexesSequence()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
        expect(indexMapper.getNotSkippedIndexes()).toEqual([10, 11, 12]);
        // Just adding new items at the end.
        //                                                                       inserted items
        //                                                                          /  |  \
        expect(indexToIndexMap.getValues()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
        // Just adding new items at the end.
        //                                                                         inserted items
        //                                                                            /  |  \
        expect(indexToValueMap.getValues()).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
        expect(skipMap.getValues()).toEqual([true, true, true, true, true, true, true, true, true, true, false, false, false]);
      });
    });
  });

  describe('moving items', () => {
    it('should move single, given item', () => {
      const indexMapper = new IndexMapper();
      indexMapper.initToLength(10);

      indexMapper.moveIndexes([8], 0); // [8, 0, 1, 2, 3, 4, 5, 6, 7, 9]
      indexMapper.moveIndexes([3], 1); // [8, 2, 0, 1, 3, 4, 5, 6, 7, 9]
      indexMapper.moveIndexes([5], 2);

      expect(indexMapper.getIndexesSequence()).toEqual([8, 2, 4, 0, 1, 3, 5, 6, 7, 9]);
    });

    it('should not change order of items after specific move', () => {
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

    it('should change order of items in place', () => {
      const indexMapper = new IndexMapper();
      indexMapper.initToLength(10);

      indexMapper.moveIndexes([9, 8, 7, 6, 5, 4, 3, 0, 1, 2], 0);
      expect(indexMapper.getIndexesSequence()).toEqual([9, 8, 7, 6, 5, 4, 3, 0, 1, 2]);
    });

    describe('should move given items properly from the top to the bottom', () => {
      it('ascending order of moved items', () => {
        const indexMapper = new IndexMapper();
        indexMapper.initToLength(10);

        indexMapper.moveIndexes([0, 1, 2, 3], 5);
        expect(indexMapper.getIndexesSequence()).toEqual([4, 5, 6, 7, 8, 0, 1, 2, 3, 9]);
      });

      it('descending order of moved items', () => {
        const indexMapper = new IndexMapper();
        indexMapper.initToLength(10);

        indexMapper.moveIndexes([3, 2, 1, 0], 5);
        expect(indexMapper.getIndexesSequence()).toEqual([4, 5, 6, 7, 8, 3, 2, 1, 0, 9]);
      });

      it('mixed order of moved items', () => {
        const indexMapper = new IndexMapper();
        indexMapper.initToLength(10);

        indexMapper.moveIndexes([1, 3, 2, 0], 5);
        expect(indexMapper.getIndexesSequence()).toEqual([4, 5, 6, 7, 8, 1, 3, 2, 0, 9]);
      });
    });

    describe('should move given items properly from the bottom to the top', () => {
      it('ascending order of moved items', () => {
        const indexMapper = new IndexMapper();
        indexMapper.initToLength(10);

        indexMapper.moveIndexes([4, 5, 6, 7], 2);
        expect(indexMapper.getIndexesSequence()).toEqual([0, 1, 4, 5, 6, 7, 2, 3, 8, 9]);
      });

      it('descending order of moved items', () => {
        const indexMapper = new IndexMapper();
        indexMapper.initToLength(10);

        indexMapper.moveIndexes([7, 6, 5, 4], 2);
        expect(indexMapper.getIndexesSequence()).toEqual([0, 1, 7, 6, 5, 4, 2, 3, 8, 9]);
      });

      it('mixed order of moved items', () => {
        const indexMapper = new IndexMapper();
        indexMapper.initToLength(10);

        indexMapper.moveIndexes([7, 5, 4, 6], 2);
        expect(indexMapper.getIndexesSequence()).toEqual([0, 1, 7, 5, 4, 6, 2, 3, 8, 9]);
      });
    });

    describe('should move given items properly when sequence of moves is mixed', () => {
      it('ascending order of moved indexes', () => {
        const indexMapper = new IndexMapper();
        indexMapper.initToLength(10);

        indexMapper.moveIndexes([1, 2, 6, 7], 4);
        expect(indexMapper.getIndexesSequence()).toEqual([0, 3, 4, 5, 1, 2, 6, 7, 8, 9]);
      });

      it('descending order of moved items', () => {
        const indexMapper = new IndexMapper();
        indexMapper.initToLength(10);

        indexMapper.moveIndexes([7, 6, 2, 1], 4);
        expect(indexMapper.getIndexesSequence()).toEqual([0, 3, 4, 5, 7, 6, 2, 1, 8, 9]);
      });

      it('mixed order of moved items', () => {
        const indexMapper = new IndexMapper();
        indexMapper.initToLength(10);

        indexMapper.moveIndexes([7, 2, 1, 6], 4);
        expect(indexMapper.getIndexesSequence()).toEqual([0, 3, 4, 5, 7, 2, 1, 6, 8, 9]);
      });

      it('index of one from the moved elements is equal to the final index #1', () => {
        const indexMapper = new IndexMapper();
        indexMapper.initToLength(10);

        indexMapper.moveIndexes([7, 8], 8);
        expect(indexMapper.getIndexesSequence()).toEqual([0, 1, 2, 3, 4, 5, 6, 9, 7, 8]);
      });

      it('index of one from the moved elements is equal to the final index #2', () => {
        const indexMapper = new IndexMapper();
        indexMapper.initToLength(10);

        indexMapper.moveIndexes([8, 7], 8);
        expect(indexMapper.getIndexesSequence()).toEqual([0, 1, 2, 3, 4, 5, 6, 9, 8, 7]);
      });
    });

    describe('should move items properly when there are skipped indexes', () => {
      it('single index from the top, down to element with skipped index - actually placing it just after the skipped indexes', () => {
        const indexMapper = new IndexMapper();
        const skipMap = new SkipMap();

        indexMapper.registerMap('skipMap', skipMap);
        indexMapper.initToLength(6);
        skipMap.setValues([false, false, false, true, true, false]);

        indexMapper.moveIndexes([0], 2);

        expect(indexMapper.getIndexesSequence()).toEqual([1, 2, 3, 4, 0, 5]);
        expect(indexMapper.getNotSkippedIndexes()).toEqual([1, 2, 0, 5]);
      });

      it('multiple indexes from the top, down to element with skipped index - actually placing it just after the skipped indexes', () => {
        const indexMapper = new IndexMapper();
        const skipMap = new SkipMap();

        indexMapper.registerMap('skipMap', skipMap);
        indexMapper.initToLength(6);
        skipMap.setValues([false, false, false, true, true, false]);

        indexMapper.moveIndexes([1, 0], 1);

        expect(indexMapper.getIndexesSequence()).toEqual([2, 3, 4, 1, 0, 5]);
        expect(indexMapper.getNotSkippedIndexes()).toEqual([2, 1, 0, 5]);
      });

      it('from the top, down to element before skipped index', () => {
        const indexMapper = new IndexMapper();
        const skipMap = new SkipMap();

        indexMapper.registerMap('skipMap', skipMap);
        indexMapper.initToLength(10);
        skipMap.setValues([false, false, false, false, true, false, false, false, false, false]);

        indexMapper.moveIndexes([0], 3);

        expect(indexMapper.getIndexesSequence()).toEqual([1, 2, 3, 4, 0, 5, 6, 7, 8, 9]);
        expect(indexMapper.getNotSkippedIndexes()).toEqual([1, 2, 3, 0, 5, 6, 7, 8, 9]);
      });

      it('from the bottom, up to element before skipped index', () => {
        const indexMapper = new IndexMapper();
        const skipMap = new SkipMap();

        indexMapper.registerMap('skipMap', skipMap);
        indexMapper.initToLength(10);
        skipMap.setValues([false, false, false, false, true, false, false, false, false, false]);

        indexMapper.moveIndexes([5], 3); // Moving physical index 6 as there is one skipped index before the moved element.

        expect(indexMapper.getIndexesSequence()).toEqual([0, 1, 2, 6, 3, 4, 5, 7, 8, 9]);
        expect(indexMapper.getNotSkippedIndexes()).toEqual([0, 1, 2, 6, 3, 5, 7, 8, 9]);
      });

      it('single index from from the bottom, up to element before skipped index - actually placing it just after the skipped indexes', () => {
        const indexMapper = new IndexMapper();
        const skipMap = new SkipMap();

        indexMapper.registerMap('skipMap', skipMap);
        indexMapper.initToLength(6);
        skipMap.setValues([false, true, true, false, false, false]);

        indexMapper.moveIndexes([3], 1); // Moving physical index 5 as there are two skipped index before the moved element.

        expect(indexMapper.getIndexesSequence()).toEqual([0, 1, 2, 5, 3, 4]);
        expect(indexMapper.getNotSkippedIndexes()).toEqual([0, 5, 3, 4]);
      });

      it('multiple indexes from from the bottom, up to element before skipped index - actually placing it just after the skipped indexes', () => {
        const indexMapper = new IndexMapper();
        const skipMap = new SkipMap();

        indexMapper.registerMap('skipMap', skipMap);
        indexMapper.initToLength(6);
        skipMap.setValues([false, true, true, false, false, false]);

        indexMapper.moveIndexes([3, 2], 1); // Moving physical indexes 5 and 4 as there are two skipped index before the moved element.

        expect(indexMapper.getIndexesSequence()).toEqual([0, 1, 2, 5, 4, 3]);
        expect(indexMapper.getNotSkippedIndexes()).toEqual([0, 5, 4, 3]);
      });

      it('when first few starting indexes are skipped', () => {
        const indexMapper = new IndexMapper();
        const skipMap = new SkipMap();

        indexMapper.registerMap('skipMap', skipMap);
        indexMapper.initToLength(10);
        skipMap.setValues([true, true, true, false, false, false, false, false, false, false]);

        indexMapper.moveIndexes([2, 3], 0); // Moving physical indexes 5, 6 as there are three skipped indexes before the moved elements.

        expect(indexMapper.getIndexesSequence()).toEqual([0, 1, 2, 5, 6, 3, 4, 7, 8, 9]);
        expect(indexMapper.getNotSkippedIndexes()).toEqual([5, 6, 3, 4, 7, 8, 9]);
      });

      it('when few last indexes are skipped - move to the last visible position', () => {
        const indexMapper = new IndexMapper();
        const skipMap = new SkipMap();

        indexMapper.registerMap('skipMap', skipMap);
        indexMapper.initToLength(10);
        skipMap.setValues([false, false, false, false, false, false, false, true, true, true]);

        indexMapper.moveIndexes([0, 1], 5); // Elements will be moved at 5th and 6th position.

        expect(indexMapper.getIndexesSequence()).toEqual([2, 3, 4, 5, 6, 0, 1, 7, 8, 9]);
      });

      it('when few last indexes are skipped - try of moving items to the too height index', () => {
        const indexMapper = new IndexMapper();
        const skipMap = new SkipMap();

        indexMapper.registerMap('skipMap', skipMap);
        indexMapper.initToLength(10);
        skipMap.setValues([false, false, false, false, false, false, false, true, true, true]);

        indexMapper.moveIndexes([0, 1], 6); // Elements can't be moved at 6th and 7th position, they will be placed at 5th and 6th position.

        expect(indexMapper.getIndexesSequence()).toEqual([2, 3, 4, 5, 6, 0, 1, 7, 8, 9]);
      });
    });
  });

  describe('cache management', () => {
    it('should reset the cache when `initToLength` function is called', () => {
      const indexMapper = new IndexMapper();
      const cacheUpdatedCallback = jasmine.createSpy('cacheUpdated');
      const notSkippedIndexesCache = indexMapper.notSkippedIndexesCache;

      indexMapper.addLocalHook('cacheUpdated', cacheUpdatedCallback);

      expect(cacheUpdatedCallback).not.toHaveBeenCalled();

      indexMapper.initToLength(10);

      expect(notSkippedIndexesCache).not.toBe(indexMapper.notSkippedIndexesCache);
      expect(cacheUpdatedCallback.calls.count()).toEqual(1);
    });

    it('should reset the cache when `setIndexesSequence` function is called', () => {
      const indexMapper = new IndexMapper();
      const cacheUpdatedCallback = jasmine.createSpy('cacheUpdated');

      indexMapper.initToLength(10);
      indexMapper.addLocalHook('cacheUpdated', cacheUpdatedCallback);

      const notSkippedIndexesCache = indexMapper.notSkippedIndexesCache;

      indexMapper.setIndexesSequence([9, 8, 7, 6, 5, 4, 3, 2, 1, 0]);

      expect(notSkippedIndexesCache).not.toBe(indexMapper.notSkippedIndexesCache);
      expect(cacheUpdatedCallback.calls.count()).toEqual(1);
    });

    it('should reset the cache only when the `updateCache` function is called with `force` parameter set to an truthy value', () => {
      // It's internal function responsible for handling batched operation, called often. Just flag set to `true` should reset the cache.
      const indexMapper = new IndexMapper();
      const cacheUpdatedCallback = jasmine.createSpy('cacheUpdated');

      indexMapper.initToLength(10);
      indexMapper.addLocalHook('cacheUpdated', cacheUpdatedCallback);

      const notSkippedIndexesCache = indexMapper.notSkippedIndexesCache;

      indexMapper.updateCache();

      expect(cacheUpdatedCallback).not.toHaveBeenCalled();
      expect(notSkippedIndexesCache).toBe(indexMapper.notSkippedIndexesCache);
      expect(notSkippedIndexesCache).toEqual(indexMapper.notSkippedIndexesCache);

      indexMapper.updateCache(false);

      expect(cacheUpdatedCallback).not.toHaveBeenCalled();
      expect(notSkippedIndexesCache).toBe(indexMapper.notSkippedIndexesCache);
      expect(notSkippedIndexesCache).toEqual(indexMapper.notSkippedIndexesCache);

      indexMapper.updateCache(true);

      expect(cacheUpdatedCallback).toHaveBeenCalled();
      expect(notSkippedIndexesCache).not.toBe(indexMapper.notSkippedIndexesCache);
    });

    it('should reset two caches when any registered map inside skip collection is changed', () => {
      const indexMapper = new IndexMapper();
      const skipMap1 = new SkipMap();
      const skipMap2 = new SkipMap();
      const cacheUpdatedCallback = jasmine.createSpy('cacheUpdated');

      indexMapper.registerMap('skipMap1', skipMap1);
      indexMapper.registerMap('skipMap2', skipMap2);
      indexMapper.initToLength(10);

      let notSkippedIndexesCache = indexMapper.notSkippedIndexesCache;
      let flattenSkipList = indexMapper.flattenSkipList;

      indexMapper.addLocalHook('cacheUpdated', cacheUpdatedCallback);

      skipMap1.setValues([false, false, false, false, false, false, false, true, true, true]);
      skipMap2.setValues([false, false, false, false, false, false, false, true, true, true]);

      expect(notSkippedIndexesCache).not.toBe(indexMapper.notSkippedIndexesCache);
      expect(flattenSkipList).not.toBe(indexMapper.flattenSkipList);
      expect(cacheUpdatedCallback.calls.count()).toEqual(2);

      notSkippedIndexesCache = indexMapper.notSkippedIndexesCache;
      flattenSkipList = indexMapper.flattenSkipList;

      skipMap1.setValueAtIndex(0, false);

      // Actions on the first collection. No real change. We rebuild cache anyway (`change` hook should be called?).
      expect(notSkippedIndexesCache).not.toBe(indexMapper.notSkippedIndexesCache);
      expect(flattenSkipList).not.toBe(indexMapper.flattenSkipList);
      expect(notSkippedIndexesCache).toEqual(indexMapper.notSkippedIndexesCache);
      expect(flattenSkipList).toEqual(indexMapper.flattenSkipList);
      expect(cacheUpdatedCallback.calls.count()).toEqual(3);

      notSkippedIndexesCache = indexMapper.notSkippedIndexesCache;
      flattenSkipList = indexMapper.flattenSkipList;

      skipMap1.setValueAtIndex(0, true);

      expect(notSkippedIndexesCache).not.toBe(indexMapper.notSkippedIndexesCache);
      expect(flattenSkipList).not.toBe(indexMapper.flattenSkipList);
      expect(cacheUpdatedCallback.calls.count()).toEqual(4);

      notSkippedIndexesCache = indexMapper.notSkippedIndexesCache;
      flattenSkipList = indexMapper.flattenSkipList;

      skipMap1.setValueAtIndex(0, false);

      expect(notSkippedIndexesCache).not.toBe(indexMapper.notSkippedIndexesCache);
      expect(flattenSkipList).not.toBe(indexMapper.flattenSkipList);
      expect(cacheUpdatedCallback.calls.count()).toEqual(5);

      notSkippedIndexesCache = indexMapper.notSkippedIndexesCache;
      flattenSkipList = indexMapper.flattenSkipList;

      skipMap2.setValueAtIndex(0, false);

      // Actions on the second collection. No real change.  We rebuild cache anyway (`change` hook should be called?).
      expect(notSkippedIndexesCache).not.toBe(indexMapper.notSkippedIndexesCache);
      expect(flattenSkipList).not.toBe(indexMapper.flattenSkipList);
      expect(notSkippedIndexesCache).toEqual(indexMapper.notSkippedIndexesCache);
      expect(flattenSkipList).toEqual(indexMapper.flattenSkipList);
      expect(cacheUpdatedCallback.calls.count()).toEqual(6);

      notSkippedIndexesCache = indexMapper.notSkippedIndexesCache;
      flattenSkipList = indexMapper.flattenSkipList;

      skipMap2.setValueAtIndex(0, true);

      expect(notSkippedIndexesCache).not.toBe(indexMapper.notSkippedIndexesCache);
      expect(flattenSkipList).not.toBe(indexMapper.flattenSkipList);
      expect(cacheUpdatedCallback.calls.count()).toEqual(7);

      notSkippedIndexesCache = indexMapper.notSkippedIndexesCache;
      flattenSkipList = indexMapper.flattenSkipList;

      skipMap2.setValueAtIndex(0, false);

      expect(notSkippedIndexesCache).not.toBe(indexMapper.notSkippedIndexesCache);
      expect(flattenSkipList).not.toBe(indexMapper.flattenSkipList);
      expect(cacheUpdatedCallback.calls.count()).toEqual(8);
    });

    it('should not reset two caches when any registered map inside various mappings collection is changed', () => {
      const indexMapper = new IndexMapper();
      const valueMap1 = new IndexToValueMap();
      const valueMap2 = new IndexToValueMap();
      const cacheUpdatedCallback = jasmine.createSpy('cacheUpdated');

      indexMapper.registerMap('valueMap1', valueMap1);
      indexMapper.registerMap('valueMap2', valueMap2);
      indexMapper.initToLength(10);

      const notSkippedIndexesCache = indexMapper.notSkippedIndexesCache;
      const flattenSkipList = indexMapper.flattenSkipList;

      indexMapper.addLocalHook('cacheUpdated', cacheUpdatedCallback);

      valueMap1.setValues([false, false, false, false, false, false, false, true, true, true]);
      valueMap2.setValues([false, false, false, false, false, false, false, true, true, true]);

      expect(cacheUpdatedCallback).not.toHaveBeenCalled();

      valueMap1.setValueAtIndex(0, false);

      // Actions on the first collection. No real change.
      expect(cacheUpdatedCallback).not.toHaveBeenCalled();

      valueMap1.setValueAtIndex(0, true);

      expect(cacheUpdatedCallback).not.toHaveBeenCalled();

      valueMap1.setValueAtIndex(0, false);

      expect(cacheUpdatedCallback).not.toHaveBeenCalled();

      valueMap2.setValueAtIndex(0, false);

      // Actions on the second collection. No real change.
      expect(cacheUpdatedCallback).not.toHaveBeenCalled();

      valueMap2.setValueAtIndex(0, true);

      expect(cacheUpdatedCallback).not.toHaveBeenCalled();

      valueMap2.setValueAtIndex(0, false);

      expect(cacheUpdatedCallback).not.toHaveBeenCalled();

      expect(notSkippedIndexesCache).toBe(indexMapper.notSkippedIndexesCache);
      expect(flattenSkipList).toBe(indexMapper.flattenSkipList);
      expect(notSkippedIndexesCache).toEqual(indexMapper.notSkippedIndexesCache);
      expect(flattenSkipList).toEqual(indexMapper.flattenSkipList);
    });

    it('should update cache only once when used the `executeBatchOperations` function', () => {
      const indexMapper1 = new IndexMapper();
      const indexMapper2 = new IndexMapper();
      const cacheUpdatedCallback1 = jasmine.createSpy('cacheUpdated');
      const cacheUpdatedCallback2 = jasmine.createSpy('cacheUpdated');

      indexMapper1.initToLength(10);
      indexMapper2.initToLength(10);
      indexMapper1.addLocalHook('cacheUpdated', cacheUpdatedCallback1);
      indexMapper2.addLocalHook('cacheUpdated', cacheUpdatedCallback2);

      const notSkippedIndexesCache1 = indexMapper1.notSkippedIndexesCache;
      const notSkippedIndexesCache2 = indexMapper2.notSkippedIndexesCache;

      indexMapper1.executeBatchOperations(() => {
        indexMapper1.setIndexesSequence([9, 8, 7, 6, 5, 4, 3, 2, 1, 0]);
        indexMapper1.setIndexesSequence([0, 1, 2, 3, 4, 9, 8, 7, 6, 5]);
        indexMapper1.setIndexesSequence([9, 8, 7, 6, 0, 1, 2, 3, 4, 5]);
      });

      expect(notSkippedIndexesCache1).not.toBe(indexMapper1.notSkippedIndexesCache);
      expect(cacheUpdatedCallback1.calls.count()).toEqual(1);
      expect(notSkippedIndexesCache2).toBe(indexMapper2.notSkippedIndexesCache);
      expect(notSkippedIndexesCache2).toEqual(indexMapper2.notSkippedIndexesCache);
      expect(cacheUpdatedCallback2).not.toHaveBeenCalled();
    });

    it('should update cache only once when used the `moveIndexes` function', () => {
      const indexMapper = new IndexMapper();

      indexMapper.initToLength(10);

      const cacheUpdatedCallback = jasmine.createSpy('cacheUpdated');
      const notSkippedIndexesCache = indexMapper.notSkippedIndexesCache;

      indexMapper.addLocalHook('cacheUpdated', cacheUpdatedCallback);
      indexMapper.moveIndexes([3, 4, 5, 6], 0);

      expect(notSkippedIndexesCache).not.toBe(indexMapper.notSkippedIndexesCache);
      expect(cacheUpdatedCallback.calls.count()).toEqual(1);
    });

    it('should update cache only once when used the `insertIndexes` function', () => {
      const indexMapper = new IndexMapper();

      indexMapper.initToLength(10);

      const cacheUpdatedCallback = jasmine.createSpy('cacheUpdated');
      const notSkippedIndexesCache = indexMapper.notSkippedIndexesCache;

      indexMapper.addLocalHook('cacheUpdated', cacheUpdatedCallback);
      indexMapper.insertIndexes(0, 5);

      expect(notSkippedIndexesCache).not.toBe(indexMapper.notSkippedIndexesCache);
      expect(cacheUpdatedCallback.calls.count()).toEqual(1);
    });

    it('should update cache only once when used the `removeIndexes` function', () => {
      const indexMapper = new IndexMapper();

      indexMapper.initToLength(10);

      const cacheUpdatedCallback = jasmine.createSpy('cacheUpdated');
      const notSkippedIndexesCache = indexMapper.notSkippedIndexesCache;

      indexMapper.addLocalHook('cacheUpdated', cacheUpdatedCallback);
      indexMapper.removeIndexes([0, 1, 2]);

      expect(notSkippedIndexesCache).not.toBe(indexMapper.notSkippedIndexesCache);
      expect(cacheUpdatedCallback.calls.count()).toEqual(1);
    });
  });
});
