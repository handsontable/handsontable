import {
  IndexMapper,
  TrimmingMap,
  HidingMap,
  PhysicalIndexToValueMap as PIndexToValueMap,
  LinkedPhysicalIndexToValueMap as LPIndexToValueMap,
  IndexesSequence
} from 'handsontable/translations';

describe('IndexMapper', () => {
  it('should fill mappers with initial values at start', () => {
    const indexMapper = new IndexMapper();

    expect(indexMapper.getIndexesSequence()).toEqual([]);
    expect(indexMapper.getNotTrimmedIndexes()).toEqual([]);
    expect(indexMapper.getNotHiddenIndexes()).toEqual([]);
    expect(indexMapper.getNumberOfIndexes()).toBe(0);
    expect(indexMapper.getNotTrimmedIndexesLength()).toBe(0);
  });

  it('should fill mappers with proper values by calling `initToLength` method', () => {
    const indexMapper = new IndexMapper();

    indexMapper.initToLength(10);

    expect(indexMapper.getIndexesSequence()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(indexMapper.getNotTrimmedIndexes()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(indexMapper.getNotHiddenIndexes()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(indexMapper.getNumberOfIndexes()).toBe(10);
    expect(indexMapper.getNotTrimmedIndexesLength()).toBe(10);
  });

  it('should reset values in registered maps properly after calling `initToLength` method', () => {
    const indexMapper = new IndexMapper();
    const trimmingMap = new TrimmingMap();
    const hidingMap = new HidingMap();
    const pIndexToValueMap = new PIndexToValueMap();
    const lPIndexToValueMap = new LPIndexToValueMap();

    indexMapper.registerMap('trimmingMap', trimmingMap);
    indexMapper.registerMap('hidingMap', hidingMap);
    indexMapper.registerMap('pIndexToValueMap', pIndexToValueMap);
    indexMapper.registerMap('lPIndexToValueMap', lPIndexToValueMap);

    indexMapper.initToLength(5);

    trimmingMap.setValueAtIndex(1, true);
    hidingMap.setValueAtIndex(1, true);
    pIndexToValueMap.setValueAtIndex(1, { a: 'b' });
    lPIndexToValueMap.setValueAtIndex(1, { a: 'b' });

    indexMapper.initToLength(7);

    expect(trimmingMap.getValues()).toEqual([false, false, false, false, false, false, false]);
    expect(hidingMap.getValues()).toEqual([false, false, false, false, false, false, false]);
    expect(pIndexToValueMap.getValues()).toEqual([null, null, null, null, null, null, null]);
    expect(lPIndexToValueMap.getValues()).toEqual([]);

    indexMapper.unregisterMap('trimmingMap');
    indexMapper.unregisterMap('hidingMap');
    indexMapper.unregisterMap('pIndexToValueMap');
    indexMapper.unregisterMap('lPIndexToValueMap');
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
    const trimmingMap = new TrimmingMap();
    const hidingMap = new HidingMap();
    const indexToValueMap = new PIndexToValueMap();

    expect(indexMapper.trimmingMapsCollection.getLength()).toBe(0);

    indexMapper.registerMap('uniqueName', trimmingMap);

    expect(indexMapper.trimmingMapsCollection.get('uniqueName')).toBe(trimmingMap);
    expect(indexMapper.trimmingMapsCollection.getLength()).toBe(1);
    expect(indexMapper.hidingMapsCollection.get('uniqueName')).toBe(undefined);
    expect(indexMapper.hidingMapsCollection.getLength()).toBe(0);
    expect(indexMapper.variousMapsCollection.get('uniqueName')).toBe(undefined);
    expect(indexMapper.variousMapsCollection.getLength()).toBe(0);

    // We can register map under unique key only once. Otherwise, error should be thrown.
    expect(() => {
      indexMapper.registerMap('uniqueName', trimmingMap);
    }).toThrow();

    expect(() => {
      indexMapper.registerMap('uniqueName', hidingMap);
    }).toThrow();

    expect(() => {
      indexMapper.registerMap('uniqueName', indexToValueMap);
    }).toThrow();

    expect(indexMapper.trimmingMapsCollection.get('uniqueName')).toBe(trimmingMap);
    expect(indexMapper.trimmingMapsCollection.getLength()).toBe(1);
    expect(indexMapper.hidingMapsCollection.get('uniqueName')).toBe(undefined);
    expect(indexMapper.hidingMapsCollection.getLength()).toBe(0);
    expect(indexMapper.variousMapsCollection.get('uniqueName')).toBe(undefined);
    expect(indexMapper.variousMapsCollection.getLength()).toBe(0);

    indexMapper.registerMap('uniqueName2', hidingMap);

    expect(indexMapper.hidingMapsCollection.get('uniqueName2')).toBe(hidingMap);
    expect(indexMapper.hidingMapsCollection.getLength()).toBe(1);
    expect(indexMapper.trimmingMapsCollection.get('uniqueName2')).toBe(undefined);
    expect(indexMapper.variousMapsCollection.get('uniqueName2')).toBe(undefined);

    indexMapper.registerMap('uniqueName3', indexToValueMap);

    expect(indexMapper.variousMapsCollection.get('uniqueName3')).toBe(indexToValueMap);
    expect(indexMapper.variousMapsCollection.getLength()).toBe(1);
    expect(indexMapper.trimmingMapsCollection.get('uniqueName3')).toBe(undefined);
    expect(indexMapper.hidingMapsCollection.get('uniqueName3')).toBe(undefined);

    indexMapper.unregisterMap('uniqueName');
    indexMapper.unregisterMap('uniqueName2');
    indexMapper.unregisterMap('uniqueName3');
  });

  it('should create and register map to proper collection when it is possible', () => {
    const indexMapper = new IndexMapper();

    expect(indexMapper.trimmingMapsCollection.getLength()).toBe(0);

    const trimmingMap = indexMapper.createAndRegisterIndexMap('uniqueName', 'trimming');

    expect(trimmingMap).toBeInstanceOf(TrimmingMap);
    expect(indexMapper.trimmingMapsCollection.get('uniqueName')).toBeInstanceOf(TrimmingMap);
    expect(indexMapper.trimmingMapsCollection.getLength()).toBe(1);
    expect(indexMapper.hidingMapsCollection.get('uniqueName')).toBe(undefined);
    expect(indexMapper.hidingMapsCollection.getLength()).toBe(0);
    expect(indexMapper.variousMapsCollection.get('uniqueName')).toBe(undefined);
    expect(indexMapper.variousMapsCollection.getLength()).toBe(0);

    // We can register map under unique key only once. Otherwise, error should be thrown.
    expect(() => {
      indexMapper.createAndRegisterIndexMap('uniqueName', 'trimming');
    }).toThrow();

    expect(() => {
      indexMapper.createAndRegisterIndexMap('uniqueName', 'hiding');
    }).toThrow();

    expect(() => {
      indexMapper.createAndRegisterIndexMap('uniqueName', 'physicalIndexToValue');
    }).toThrow();

    expect(indexMapper.trimmingMapsCollection.get('uniqueName')).toBeInstanceOf(TrimmingMap);
    expect(indexMapper.trimmingMapsCollection.getLength()).toBe(1);
    expect(indexMapper.hidingMapsCollection.get('uniqueName')).toBe(undefined);
    expect(indexMapper.hidingMapsCollection.getLength()).toBe(0);
    expect(indexMapper.variousMapsCollection.get('uniqueName')).toBe(undefined);
    expect(indexMapper.variousMapsCollection.getLength()).toBe(0);

    const hidingMap = indexMapper.createAndRegisterIndexMap('uniqueName2', 'hiding');

    expect(hidingMap).toBeInstanceOf(HidingMap);
    expect(indexMapper.hidingMapsCollection.get('uniqueName2')).toBeInstanceOf(HidingMap);
    expect(indexMapper.hidingMapsCollection.getLength()).toBe(1);
    expect(indexMapper.trimmingMapsCollection.get('uniqueName2')).toBe(undefined);
    expect(indexMapper.variousMapsCollection.get('uniqueName2')).toBe(undefined);

    const pIndexToValueMap = indexMapper.createAndRegisterIndexMap('uniqueName3', 'physicalIndexToValue');

    expect(pIndexToValueMap).toBeInstanceOf(PIndexToValueMap);
    expect(indexMapper.variousMapsCollection.get('uniqueName3')).toBeInstanceOf(PIndexToValueMap);
    expect(indexMapper.variousMapsCollection.getLength()).toBe(1);
    expect(indexMapper.trimmingMapsCollection.get('uniqueName3')).toBe(undefined);
    expect(indexMapper.hidingMapsCollection.get('uniqueName3')).toBe(undefined);

    indexMapper.unregisterMap('uniqueName');
    indexMapper.unregisterMap('uniqueName2');
    indexMapper.unregisterMap('uniqueName3');
  });

  it('should unregister map properly (TrimmingMap)', () => {
    const indexMapper = new IndexMapper();
    const trimmingMap = new TrimmingMap();

    expect(indexMapper.trimmingMapsCollection.getLength()).toBe(0);

    indexMapper.registerMap('uniqueName', trimmingMap);

    expect(indexMapper.trimmingMapsCollection.get('uniqueName')).toBe(trimmingMap);
    expect(indexMapper.trimmingMapsCollection.getLength()).toBe(1);
    expect(indexMapper.hidingMapsCollection.get('uniqueName')).toBe(undefined);
    expect(indexMapper.hidingMapsCollection.getLength()).toBe(0);
    expect(indexMapper.variousMapsCollection.get('uniqueName')).toBe(undefined);
    expect(indexMapper.variousMapsCollection.getLength()).toBe(0);

    indexMapper.unregisterMap('uniqueName');

    expect(indexMapper.trimmingMapsCollection.get('uniqueName')).toBe(undefined);
    expect(indexMapper.trimmingMapsCollection.getLength()).toBe(0);
    expect(indexMapper.hidingMapsCollection.get('uniqueName')).toBe(undefined);
    expect(indexMapper.hidingMapsCollection.getLength()).toBe(0);
    expect(indexMapper.variousMapsCollection.get('uniqueName')).toBe(undefined);
    expect(indexMapper.variousMapsCollection.getLength()).toBe(0);
  });

  it('should unregister map properly (HidingMap)', () => {
    const indexMapper = new IndexMapper();
    const hidingMap = new HidingMap();

    expect(indexMapper.hidingMapsCollection.getLength()).toBe(0);

    indexMapper.registerMap('uniqueName', hidingMap);

    expect(indexMapper.hidingMapsCollection.get('uniqueName')).toBe(hidingMap);
    expect(indexMapper.hidingMapsCollection.getLength()).toBe(1);
    expect(indexMapper.trimmingMapsCollection.get('uniqueName')).toBe(undefined);
    expect(indexMapper.trimmingMapsCollection.getLength()).toBe(0);
    expect(indexMapper.variousMapsCollection.get('uniqueName')).toBe(undefined);
    expect(indexMapper.variousMapsCollection.getLength()).toBe(0);

    indexMapper.unregisterMap('uniqueName');

    expect(indexMapper.hidingMapsCollection.get('uniqueName')).toBe(undefined);
    expect(indexMapper.hidingMapsCollection.getLength()).toBe(0);
    expect(indexMapper.trimmingMapsCollection.get('uniqueName')).toBe(undefined);
    expect(indexMapper.trimmingMapsCollection.getLength()).toBe(0);
    expect(indexMapper.variousMapsCollection.get('uniqueName')).toBe(undefined);
    expect(indexMapper.variousMapsCollection.getLength()).toBe(0);
  });

  it('should unregister map properly (various map)', () => {
    const indexMapper = new IndexMapper();
    const indexToValueMap = new PIndexToValueMap();

    expect(indexMapper.variousMapsCollection.getLength()).toBe(0);

    indexMapper.registerMap('uniqueName', indexToValueMap);

    expect(indexMapper.variousMapsCollection.get('uniqueName')).toBe(indexToValueMap);
    expect(indexMapper.variousMapsCollection.getLength()).toBe(1);
    expect(indexMapper.hidingMapsCollection.get('uniqueName')).toBe(undefined);
    expect(indexMapper.hidingMapsCollection.getLength()).toBe(0);
    expect(indexMapper.trimmingMapsCollection.get('uniqueName')).toBe(undefined);
    expect(indexMapper.trimmingMapsCollection.getLength()).toBe(0);

    indexMapper.unregisterMap('uniqueName');

    expect(indexMapper.variousMapsCollection.get('uniqueName')).toBe(undefined);
    expect(indexMapper.variousMapsCollection.getLength()).toBe(0);
    expect(indexMapper.hidingMapsCollection.get('uniqueName')).toBe(undefined);
    expect(indexMapper.hidingMapsCollection.getLength()).toBe(0);
    expect(indexMapper.trimmingMapsCollection.get('uniqueName')).toBe(undefined);
    expect(indexMapper.trimmingMapsCollection.getLength()).toBe(0);
  });

  it('should handle `Trimming` map properly', () => {
    const indexMapper = new IndexMapper();
    const trimmingMap = new TrimmingMap();
    const changeCallback = jasmine.createSpy('change');
    let indexesSequenceOnInit;
    let notTrimmedIndexesOnInit;
    let numberOfIndexesOnInit;
    let notTrimmedIndexesLengthOnInit;

    indexMapper.addLocalHook('change', changeCallback);

    trimmingMap.addLocalHook('init', () => {
      indexesSequenceOnInit = indexMapper.getIndexesSequence();
      notTrimmedIndexesOnInit = indexMapper.getNotTrimmedIndexes();
      numberOfIndexesOnInit = indexMapper.getNumberOfIndexes();
      notTrimmedIndexesLengthOnInit = indexMapper.getNotTrimmedIndexesLength();

      trimmingMap.setValueAtIndex(0, true);
      trimmingMap.setValueAtIndex(2, true);
      trimmingMap.setValueAtIndex(5, true);
    });

    indexMapper.registerMap('uniqueName', trimmingMap);

    expect(indexMapper.isTrimmed(0)).toBeFalsy();
    expect(indexMapper.isTrimmed(2)).toBeFalsy();
    expect(indexMapper.isTrimmed(5)).toBeFalsy();

    // Initialization of two maps (indexes sequence and trimming map).
    indexMapper.initToLength(10);

    // Maps are filled with default values before calling the `init` hook.
    expect(indexesSequenceOnInit).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(notTrimmedIndexesOnInit).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(numberOfIndexesOnInit).toBe(10);
    expect(notTrimmedIndexesLengthOnInit).toBe(10);

    expect(indexMapper.getIndexesSequence()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(indexMapper.getNotTrimmedIndexes()).toEqual([1, 3, 4, 6, 7, 8, 9]);
    expect(indexMapper.getNumberOfIndexes()).toBe(10);
    expect(indexMapper.getNotTrimmedIndexesLength()).toBe(7);

    expect(indexMapper.isTrimmed(0)).toBeTruthy();
    expect(indexMapper.isTrimmed(2)).toBeTruthy();
    expect(indexMapper.isTrimmed(5)).toBeTruthy();

    // 2 maps have been initialized and 3 `setValueAtIndex` functions have been called.
    expect(changeCallback.calls.count()).toEqual(5);

    indexMapper.unregisterMap('uniqueName');
  });

  it('should handle `Hiding` map properly', () => {
    const indexMapper = new IndexMapper();
    const hidingMap = new HidingMap();
    const changeCallback = jasmine.createSpy('change');
    let indexesSequenceOnInit;
    let notHiddenIndexesOnInit;
    let numberOfIndexesOnInit;
    let notHiddenIndexesLengthOnInit;

    indexMapper.addLocalHook('change', changeCallback);

    hidingMap.addLocalHook('init', () => {
      indexesSequenceOnInit = indexMapper.getIndexesSequence();
      notHiddenIndexesOnInit = indexMapper.getNotHiddenIndexes();
      numberOfIndexesOnInit = indexMapper.getNumberOfIndexes();
      notHiddenIndexesLengthOnInit = indexMapper.getNotHiddenIndexesLength();

      hidingMap.setValueAtIndex(0, true);
      hidingMap.setValueAtIndex(2, true);
      hidingMap.setValueAtIndex(5, true);
    });

    indexMapper.registerMap('uniqueName', hidingMap);

    expect(indexMapper.isHidden(0)).toBeFalsy();
    expect(indexMapper.isHidden(2)).toBeFalsy();
    expect(indexMapper.isHidden(5)).toBeFalsy();

    // Initialization of two maps (indexes sequence and hiding map).
    indexMapper.initToLength(10);

    // Maps are filled with default values before calling the `init` hook.
    expect(indexesSequenceOnInit).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(notHiddenIndexesOnInit).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(numberOfIndexesOnInit).toBe(10);
    expect(notHiddenIndexesLengthOnInit).toBe(10);

    expect(indexMapper.getIndexesSequence()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(indexMapper.getNotHiddenIndexes()).toEqual([1, 3, 4, 6, 7, 8, 9]);
    expect(indexMapper.getNumberOfIndexes()).toBe(10);
    expect(indexMapper.getNotHiddenIndexesLength()).toBe(7);

    expect(indexMapper.isHidden(0)).toBeTruthy();
    expect(indexMapper.isHidden(2)).toBeTruthy();
    expect(indexMapper.isHidden(5)).toBeTruthy();

    // 2 maps have been initialized and 3 `setValueAtIndex` functions have been called.
    expect(changeCallback.calls.count()).toEqual(5);

    indexMapper.unregisterMap('uniqueName');
  });

  it('should translate indexes from visual to physical and the other way round properly', () => {
    const indexMapper = new IndexMapper();
    const trimmingMap = new TrimmingMap();
    const hidingMap = new HidingMap();

    expect(indexMapper.getVisualFromPhysicalIndex(0)).toBe(null);
    expect(indexMapper.getPhysicalFromVisualIndex(0)).toBe(null);
    expect(indexMapper.getVisualFromPhysicalIndex(1)).toBe(null);
    expect(indexMapper.getPhysicalFromVisualIndex(1)).toBe(null);
    expect(indexMapper.getVisualFromPhysicalIndex(2)).toBe(null);
    expect(indexMapper.getPhysicalFromVisualIndex(2)).toBe(null);
    expect(indexMapper.getVisualFromPhysicalIndex(3)).toBe(null);
    expect(indexMapper.getPhysicalFromVisualIndex(3)).toBe(null);
    expect(indexMapper.getVisualFromPhysicalIndex(4)).toBe(null);
    expect(indexMapper.getPhysicalFromVisualIndex(4)).toBe(null);
    expect(indexMapper.getVisualFromPhysicalIndex(5)).toBe(null);
    expect(indexMapper.getPhysicalFromVisualIndex(5)).toBe(null);

    indexMapper.initToLength(5);

    expect(indexMapper.getVisualFromPhysicalIndex(0)).toBe(0);
    expect(indexMapper.getPhysicalFromVisualIndex(0)).toBe(0);
    expect(indexMapper.getVisualFromPhysicalIndex(1)).toBe(1);
    expect(indexMapper.getPhysicalFromVisualIndex(1)).toBe(1);
    expect(indexMapper.getVisualFromPhysicalIndex(2)).toBe(2);
    expect(indexMapper.getPhysicalFromVisualIndex(2)).toBe(2);
    expect(indexMapper.getVisualFromPhysicalIndex(3)).toBe(3);
    expect(indexMapper.getPhysicalFromVisualIndex(3)).toBe(3);
    expect(indexMapper.getVisualFromPhysicalIndex(4)).toBe(4);
    expect(indexMapper.getPhysicalFromVisualIndex(4)).toBe(4);
    expect(indexMapper.getVisualFromPhysicalIndex(5)).toBe(null);
    expect(indexMapper.getPhysicalFromVisualIndex(5)).toBe(null);

    indexMapper.setIndexesSequence([1, 4, 2, 0, 3]);

    expect(indexMapper.getVisualFromPhysicalIndex(0)).toBe(3);
    expect(indexMapper.getPhysicalFromVisualIndex(0)).toBe(1);
    expect(indexMapper.getVisualFromPhysicalIndex(1)).toBe(0);
    expect(indexMapper.getPhysicalFromVisualIndex(1)).toBe(4);
    expect(indexMapper.getVisualFromPhysicalIndex(2)).toBe(2);
    expect(indexMapper.getPhysicalFromVisualIndex(2)).toBe(2);
    expect(indexMapper.getVisualFromPhysicalIndex(3)).toBe(4);
    expect(indexMapper.getPhysicalFromVisualIndex(3)).toBe(0);
    expect(indexMapper.getVisualFromPhysicalIndex(4)).toBe(1);
    expect(indexMapper.getPhysicalFromVisualIndex(4)).toBe(3);
    expect(indexMapper.getVisualFromPhysicalIndex(5)).toBe(null);
    expect(indexMapper.getPhysicalFromVisualIndex(5)).toBe(null);

    trimmingMap.addLocalHook('init', () => {
      trimmingMap.setValueAtIndex(2, true);
      trimmingMap.setValueAtIndex(4, true);
    });

    indexMapper.registerMap('trimmingMap', trimmingMap);

    // visual   | 0        1  2
    // physical | 1  4  2  0  3

    expect(indexMapper.getVisualFromPhysicalIndex(0)).toBe(1);
    expect(indexMapper.getPhysicalFromVisualIndex(0)).toBe(1);
    expect(indexMapper.getVisualFromPhysicalIndex(1)).toBe(0);
    expect(indexMapper.getPhysicalFromVisualIndex(1)).toBe(0);
    expect(indexMapper.getVisualFromPhysicalIndex(2)).toBe(null);
    expect(indexMapper.getPhysicalFromVisualIndex(2)).toBe(3);
    expect(indexMapper.getVisualFromPhysicalIndex(3)).toBe(2);
    expect(indexMapper.getPhysicalFromVisualIndex(3)).toBe(null);
    expect(indexMapper.getVisualFromPhysicalIndex(4)).toBe(null);
    expect(indexMapper.getPhysicalFromVisualIndex(4)).toBe(null);
    expect(indexMapper.getVisualFromPhysicalIndex(5)).toBe(null);
    expect(indexMapper.getPhysicalFromVisualIndex(5)).toBe(null);

    hidingMap.addLocalHook('init', () => {
      hidingMap.setValueAtIndex(0, true);
      hidingMap.setValueAtIndex(1, true);
    });

    indexMapper.registerMap('hidingMap', hidingMap);

    // No real changes.
    expect(indexMapper.getVisualFromPhysicalIndex(0)).toBe(1);
    expect(indexMapper.getPhysicalFromVisualIndex(0)).toBe(1);
    expect(indexMapper.getVisualFromPhysicalIndex(1)).toBe(0);
    expect(indexMapper.getPhysicalFromVisualIndex(1)).toBe(0);
    expect(indexMapper.getVisualFromPhysicalIndex(2)).toBe(null);
    expect(indexMapper.getPhysicalFromVisualIndex(2)).toBe(3);
    expect(indexMapper.getVisualFromPhysicalIndex(3)).toBe(2);
    expect(indexMapper.getPhysicalFromVisualIndex(3)).toBe(null);
    expect(indexMapper.getVisualFromPhysicalIndex(4)).toBe(null);
    expect(indexMapper.getPhysicalFromVisualIndex(4)).toBe(null);
    expect(indexMapper.getVisualFromPhysicalIndex(5)).toBe(null);
    expect(indexMapper.getPhysicalFromVisualIndex(5)).toBe(null);

    indexMapper.unregisterMap('trimmingMap');
    indexMapper.unregisterMap('hidingMap');
  });

  it('should translate indexes from visual to renderable and the other way round properly', () => {
    const indexMapper = new IndexMapper();
    const trimmingMap = new TrimmingMap();
    const hidingMap = new HidingMap();

    expect(indexMapper.getVisualFromRenderableIndex(0)).toBe(null);
    expect(indexMapper.getRenderableFromVisualIndex(0)).toBe(null);
    expect(indexMapper.getVisualFromRenderableIndex(1)).toBe(null);
    expect(indexMapper.getRenderableFromVisualIndex(1)).toBe(null);
    expect(indexMapper.getVisualFromRenderableIndex(2)).toBe(null);
    expect(indexMapper.getRenderableFromVisualIndex(2)).toBe(null);
    expect(indexMapper.getVisualFromRenderableIndex(3)).toBe(null);
    expect(indexMapper.getRenderableFromVisualIndex(3)).toBe(null);
    expect(indexMapper.getVisualFromRenderableIndex(4)).toBe(null);
    expect(indexMapper.getRenderableFromVisualIndex(4)).toBe(null);
    expect(indexMapper.getVisualFromRenderableIndex(5)).toBe(null);
    expect(indexMapper.getRenderableFromVisualIndex(5)).toBe(null);
    expect(indexMapper.getVisualFromRenderableIndex(6)).toBe(null);
    expect(indexMapper.getRenderableFromVisualIndex(6)).toBe(null);
    expect(indexMapper.getVisualFromRenderableIndex(7)).toBe(null);
    expect(indexMapper.getRenderableFromVisualIndex(7)).toBe(null);

    indexMapper.initToLength(7);

    expect(indexMapper.getVisualFromRenderableIndex(0)).toBe(0);
    expect(indexMapper.getRenderableFromVisualIndex(0)).toBe(0);
    expect(indexMapper.getVisualFromRenderableIndex(1)).toBe(1);
    expect(indexMapper.getRenderableFromVisualIndex(1)).toBe(1);
    expect(indexMapper.getVisualFromRenderableIndex(2)).toBe(2);
    expect(indexMapper.getRenderableFromVisualIndex(2)).toBe(2);
    expect(indexMapper.getVisualFromRenderableIndex(3)).toBe(3);
    expect(indexMapper.getRenderableFromVisualIndex(3)).toBe(3);
    expect(indexMapper.getVisualFromRenderableIndex(4)).toBe(4);
    expect(indexMapper.getRenderableFromVisualIndex(4)).toBe(4);
    expect(indexMapper.getVisualFromRenderableIndex(5)).toBe(5);
    expect(indexMapper.getRenderableFromVisualIndex(5)).toBe(5);
    expect(indexMapper.getVisualFromRenderableIndex(6)).toBe(6);
    expect(indexMapper.getRenderableFromVisualIndex(6)).toBe(6);
    expect(indexMapper.getVisualFromRenderableIndex(7)).toBe(null);
    expect(indexMapper.getRenderableFromVisualIndex(7)).toBe(null);

    indexMapper.setIndexesSequence([1, 4, 2, 0, 3, 6, 5]);

    expect(indexMapper.getVisualFromRenderableIndex(0)).toBe(0);
    expect(indexMapper.getRenderableFromVisualIndex(0)).toBe(0);
    expect(indexMapper.getVisualFromRenderableIndex(1)).toBe(1);
    expect(indexMapper.getRenderableFromVisualIndex(1)).toBe(1);
    expect(indexMapper.getVisualFromRenderableIndex(2)).toBe(2);
    expect(indexMapper.getRenderableFromVisualIndex(2)).toBe(2);
    expect(indexMapper.getVisualFromRenderableIndex(3)).toBe(3);
    expect(indexMapper.getRenderableFromVisualIndex(3)).toBe(3);
    expect(indexMapper.getVisualFromRenderableIndex(4)).toBe(4);
    expect(indexMapper.getRenderableFromVisualIndex(4)).toBe(4);
    expect(indexMapper.getVisualFromRenderableIndex(5)).toBe(5);
    expect(indexMapper.getRenderableFromVisualIndex(5)).toBe(5);
    expect(indexMapper.getVisualFromRenderableIndex(6)).toBe(6);
    expect(indexMapper.getRenderableFromVisualIndex(6)).toBe(6);
    expect(indexMapper.getVisualFromRenderableIndex(7)).toBe(null);
    expect(indexMapper.getRenderableFromVisualIndex(7)).toBe(null);

    trimmingMap.addLocalHook('init', () => {
      trimmingMap.setValueAtIndex(2, true);
      trimmingMap.setValueAtIndex(4, true);
    });

    indexMapper.registerMap('trimmingMap', trimmingMap);

    // visual   | 0        1  2  3  4
    // physical | 1  4  2  0  3  6  5

    expect(indexMapper.getVisualFromRenderableIndex(0)).toBe(0);
    expect(indexMapper.getRenderableFromVisualIndex(0)).toBe(0);
    expect(indexMapper.getVisualFromRenderableIndex(1)).toBe(1);
    expect(indexMapper.getRenderableFromVisualIndex(1)).toBe(1);
    expect(indexMapper.getVisualFromRenderableIndex(2)).toBe(2);
    expect(indexMapper.getRenderableFromVisualIndex(2)).toBe(2);
    expect(indexMapper.getVisualFromRenderableIndex(3)).toBe(3);
    expect(indexMapper.getRenderableFromVisualIndex(3)).toBe(3);
    expect(indexMapper.getVisualFromRenderableIndex(4)).toBe(4);
    expect(indexMapper.getRenderableFromVisualIndex(4)).toBe(4);
    expect(indexMapper.getVisualFromRenderableIndex(5)).toBe(null);
    expect(indexMapper.getRenderableFromVisualIndex(5)).toBe(null);
    expect(indexMapper.getVisualFromRenderableIndex(6)).toBe(null);
    expect(indexMapper.getRenderableFromVisualIndex(6)).toBe(null);
    expect(indexMapper.getVisualFromRenderableIndex(7)).toBe(null);
    expect(indexMapper.getRenderableFromVisualIndex(7)).toBe(null);

    hidingMap.addLocalHook('init', () => {
      hidingMap.setValueAtIndex(1, true);
      hidingMap.setValueAtIndex(3, true);
    });

    indexMapper.registerMap('hidingMap', hidingMap);

    // renderable   |          0     1  2
    // visual       | 0        1  2  3  4
    // physical     | 1  4  2  0  3  6  5

    expect(indexMapper.getVisualFromRenderableIndex(0)).toBe(1);
    expect(indexMapper.getRenderableFromVisualIndex(0)).toBe(null);
    expect(indexMapper.getVisualFromRenderableIndex(1)).toBe(3);
    expect(indexMapper.getRenderableFromVisualIndex(1)).toBe(0);
    expect(indexMapper.getVisualFromRenderableIndex(2)).toBe(4);
    expect(indexMapper.getRenderableFromVisualIndex(2)).toBe(null);
    expect(indexMapper.getVisualFromRenderableIndex(3)).toBe(null);
    expect(indexMapper.getRenderableFromVisualIndex(3)).toBe(1);
    expect(indexMapper.getVisualFromRenderableIndex(4)).toBe(null);
    expect(indexMapper.getRenderableFromVisualIndex(4)).toBe(2);
    expect(indexMapper.getVisualFromRenderableIndex(5)).toBe(null);
    expect(indexMapper.getRenderableFromVisualIndex(5)).toBe(null);
    expect(indexMapper.getVisualFromRenderableIndex(6)).toBe(null);
    expect(indexMapper.getRenderableFromVisualIndex(6)).toBe(null);
    expect(indexMapper.getVisualFromRenderableIndex(7)).toBe(null);
    expect(indexMapper.getRenderableFromVisualIndex(7)).toBe(null);

    indexMapper.unregisterMap('trimmingMap');
    indexMapper.unregisterMap('hidingMap');
  });

  it('should translate indexes from renderable to physical properly', () => {
    const indexMapper = new IndexMapper();
    const trimmingMap = new TrimmingMap();
    const hidingMap = new HidingMap();

    expect(indexMapper.getPhysicalFromRenderableIndex(0)).toBe(null);
    expect(indexMapper.getPhysicalFromRenderableIndex(1)).toBe(null);
    expect(indexMapper.getPhysicalFromRenderableIndex(2)).toBe(null);
    expect(indexMapper.getPhysicalFromRenderableIndex(3)).toBe(null);
    expect(indexMapper.getPhysicalFromRenderableIndex(4)).toBe(null);
    expect(indexMapper.getPhysicalFromRenderableIndex(5)).toBe(null);
    expect(indexMapper.getPhysicalFromRenderableIndex(6)).toBe(null);
    expect(indexMapper.getPhysicalFromRenderableIndex(7)).toBe(null);

    indexMapper.initToLength(7);

    expect(indexMapper.getPhysicalFromRenderableIndex(0)).toBe(0);
    expect(indexMapper.getPhysicalFromRenderableIndex(1)).toBe(1);
    expect(indexMapper.getPhysicalFromRenderableIndex(2)).toBe(2);
    expect(indexMapper.getPhysicalFromRenderableIndex(3)).toBe(3);
    expect(indexMapper.getPhysicalFromRenderableIndex(4)).toBe(4);
    expect(indexMapper.getPhysicalFromRenderableIndex(5)).toBe(5);
    expect(indexMapper.getPhysicalFromRenderableIndex(6)).toBe(6);
    expect(indexMapper.getPhysicalFromRenderableIndex(7)).toBe(null);

    indexMapper.setIndexesSequence([1, 4, 2, 0, 3, 6, 5]);

    expect(indexMapper.getPhysicalFromRenderableIndex(0)).toBe(1);
    expect(indexMapper.getPhysicalFromRenderableIndex(1)).toBe(4);
    expect(indexMapper.getPhysicalFromRenderableIndex(2)).toBe(2);
    expect(indexMapper.getPhysicalFromRenderableIndex(3)).toBe(0);
    expect(indexMapper.getPhysicalFromRenderableIndex(4)).toBe(3);
    expect(indexMapper.getPhysicalFromRenderableIndex(5)).toBe(6);
    expect(indexMapper.getPhysicalFromRenderableIndex(6)).toBe(5);
    expect(indexMapper.getPhysicalFromRenderableIndex(7)).toBe(null);

    trimmingMap.addLocalHook('init', () => {
      trimmingMap.setValueAtIndex(2, true);
      trimmingMap.setValueAtIndex(4, true);
    });

    indexMapper.registerMap('trimmingMap', trimmingMap);

    // visual   | 0        1  2  3  4
    // physical | 1  4  2  0  3  6  5

    expect(indexMapper.getPhysicalFromRenderableIndex(0)).toBe(1);
    expect(indexMapper.getPhysicalFromRenderableIndex(1)).toBe(0);
    expect(indexMapper.getPhysicalFromRenderableIndex(2)).toBe(3);
    expect(indexMapper.getPhysicalFromRenderableIndex(3)).toBe(6);
    expect(indexMapper.getPhysicalFromRenderableIndex(4)).toBe(5);
    expect(indexMapper.getPhysicalFromRenderableIndex(5)).toBe(null);
    expect(indexMapper.getPhysicalFromRenderableIndex(6)).toBe(null);
    expect(indexMapper.getPhysicalFromRenderableIndex(7)).toBe(null);

    hidingMap.addLocalHook('init', () => {
      hidingMap.setValueAtIndex(1, true);
      hidingMap.setValueAtIndex(3, true);
    });

    indexMapper.registerMap('hidingMap', hidingMap);

    // renderable   |          0     1  2
    // visual       | 0        1  2  3  4
    // physical     | 1  4  2  0  3  6  5

    expect(indexMapper.getPhysicalFromRenderableIndex(0)).toBe(0);
    expect(indexMapper.getPhysicalFromRenderableIndex(1)).toBe(6);
    expect(indexMapper.getPhysicalFromRenderableIndex(2)).toBe(5);
    expect(indexMapper.getPhysicalFromRenderableIndex(3)).toBe(null);
    expect(indexMapper.getPhysicalFromRenderableIndex(4)).toBe(null);
    expect(indexMapper.getPhysicalFromRenderableIndex(5)).toBe(null);
    expect(indexMapper.getPhysicalFromRenderableIndex(6)).toBe(null);
    expect(indexMapper.getPhysicalFromRenderableIndex(7)).toBe(null);

    indexMapper.unregisterMap('trimmingMap');
    indexMapper.unregisterMap('hidingMap');
  });

  it('should return proper values for the `getFirstNotHiddenIndex` method calls', () => {
    const indexMapper = new IndexMapper();
    const trimmingMap = new TrimmingMap();
    const hidingMap = new HidingMap();

    indexMapper.registerMap('trimmingMap', trimmingMap);
    indexMapper.registerMap('hidingMap', hidingMap);
    indexMapper.initToLength(10);
    trimmingMap.setValues([true, false, false, false, false, false, false, false, false, true]);
    hidingMap.setValues([false, true, true, false, false, true, true, false, true, false]);

    // is renderable?  |    -  -  +  +  -  -  +  -
    // visual          |    0  1  2  3  4  5  6  7
    // physical        | 0  1  2  3  4  5  6  7  8  9

    expect(indexMapper.getFirstNotHiddenIndex(6, 1)).toBe(6);
    expect(indexMapper.getFirstNotHiddenIndex(6, -1)).toBe(6);
    expect(indexMapper.getFirstNotHiddenIndex(7, -1)).toBe(6);
    expect(indexMapper.getFirstNotHiddenIndex(7, 1)).toBe(null);
    expect(indexMapper.getFirstNotHiddenIndex(7, 1, true)).toBe(6);
    expect(indexMapper.getFirstNotHiddenIndex(5, 1)).toBe(6);
    expect(indexMapper.getFirstNotHiddenIndex(5, -1)).toBe(3);
    expect(indexMapper.getFirstNotHiddenIndex(1, -1)).toBe(null);
    expect(indexMapper.getFirstNotHiddenIndex(1, -1, true)).toBe(2);
    expect(indexMapper.getFirstNotHiddenIndex(0, -1)).toBe(null);
    expect(indexMapper.getFirstNotHiddenIndex(0, -1, true)).toBe(2);
    expect(indexMapper.getFirstNotHiddenIndex(0, 1)).toBe(2);
    expect(indexMapper.getFirstNotHiddenIndex(1, 1)).toBe(2);

    indexMapper.unregisterMap('trimmingMap');
    indexMapper.unregisterMap('hidingMap');
  });

  it('should return proper values for translating indexes beyond the table boundaries', () => {
    const indexMapper = new IndexMapper();
    const trimmingMap = new TrimmingMap();
    const hidingMap = new HidingMap();

    indexMapper.registerMap('trimmingMap', trimmingMap);
    indexMapper.registerMap('hidingMap', hidingMap);
    indexMapper.initToLength(10);
    trimmingMap.setValues([true, false, false, false, false, false, false, false, false, true]);
    hidingMap.setValues([false, true, false, false, false, false, false, false, true, false]);

    // renderable  |       0  1  2  3  4  5
    // visual      |    0  1  2  3  4  5  6  7
    // physical    | 0  1  2  3  4  5  6  7  8  9

    expect(indexMapper.getVisualFromPhysicalIndex(-1)).toBe(null);
    expect(indexMapper.getPhysicalFromVisualIndex(-1)).toBe(null);
    expect(indexMapper.getRenderableFromVisualIndex(-1)).toBe(null);
    expect(indexMapper.getPhysicalFromRenderableIndex(-1)).toBe(null);
    expect(indexMapper.getFirstNotHiddenIndex(-1, 1)).toBe(null);
    expect(indexMapper.getFirstNotHiddenIndex(-1, -1)).toBe(null);

    expect(indexMapper.getVisualFromPhysicalIndex(10)).toBe(null);
    expect(indexMapper.getPhysicalFromVisualIndex(8)).toBe(null);
    expect(indexMapper.getRenderableFromVisualIndex(8)).toBe(null);
    expect(indexMapper.getFirstNotHiddenIndex(8, 1)).toBe(null);
    expect(indexMapper.getFirstNotHiddenIndex(8, -1)).toBe(null);
    expect(indexMapper.getPhysicalFromRenderableIndex(6)).toBe(null);

    indexMapper.unregisterMap('trimmingMap');
    indexMapper.unregisterMap('hidingMap');
  });

  describe('createChangesObserver', () => {
    it('should throw an error when unsupported observer listener is created', () => {
      const indexMapper = new IndexMapper();

      spyOn(indexMapper.hidingChangesObservable, 'createObserver').and.returnValue('fake-observer');

      expect(() => {
        indexMapper.createChangesObserver('index-map-type');
      }).toThrowError('Unsupported index map type "index-map-type".');
      expect(indexMapper.hidingChangesObservable.createObserver).not.toHaveBeenCalled();
    });

    it('should create and return new index observer listener', () => {
      const indexMapper = new IndexMapper();

      spyOn(indexMapper.hidingChangesObservable, 'createObserver').and.returnValue('fake-observer');

      const value = indexMapper.createChangesObserver('hiding');

      expect(value).toBe('fake-observer');
      expect(indexMapper.hidingChangesObservable.createObserver).toHaveBeenCalled();
    });
  });

  describe('unregisterAll', () => {
    it('should unregister all maps properly', () => {
      const indexMapper = new IndexMapper();

      indexMapper.createAndRegisterIndexMap('myIndexToValueName', 'physicalIndexToValue');
      indexMapper.createAndRegisterIndexMap('myHidingMap1', 'hiding');
      indexMapper.createAndRegisterIndexMap('myHidingMap2', 'hiding');
      indexMapper.createAndRegisterIndexMap('myTrimmingMap', 'trimming');

      indexMapper.unregisterAll();

      expect(indexMapper.variousMapsCollection.get('uniqueName')).toBe(undefined);
      expect(indexMapper.variousMapsCollection.getLength()).toBe(0);
      expect(indexMapper.hidingMapsCollection.get('uniqueName')).toBe(undefined);
      expect(indexMapper.hidingMapsCollection.getLength()).toBe(0);
      expect(indexMapper.trimmingMapsCollection.get('uniqueName')).toBe(undefined);
      expect(indexMapper.trimmingMapsCollection.getLength()).toBe(0);
    });
  });

  describe('removing indexes', () => {
    it('should remove multiple indexes from the start', () => {
      const indexMapper = new IndexMapper();
      const indexesSequence = new IndexesSequence();
      const pIndexToValueMap = new PIndexToValueMap(index => index + 2);
      const lPIndexToValueMap = new LPIndexToValueMap();
      const trimmingMap = new TrimmingMap();
      const hidingMap = new HidingMap();

      indexMapper.registerMap('indexesSequence', indexesSequence);
      indexMapper.registerMap('pIndexToValueMap', pIndexToValueMap);
      indexMapper.registerMap('lPIndexToValueMap', lPIndexToValueMap);
      indexMapper.registerMap('trimmingMap', trimmingMap);
      indexMapper.registerMap('hidingMap', hidingMap);
      indexMapper.initToLength(10);
      trimmingMap.setValues([true, false, false, false, true, false, true, false, true, false]);
      hidingMap.setValues([false, true, false, true, false, false, false, false, false, true]);
      lPIndexToValueMap.setValueAtIndex(0, { a: 'b' });
      lPIndexToValueMap.setValueAtIndex(5, { c: 'd' });
      lPIndexToValueMap.setValueAtIndex(4, { e: 'f' });

      // renderable   |       0        1     2
      // visual       |    0  1  2     3     4     5
      // physical     | 0  1  2  3  4  5  6  7  8  9

      expect(indexMapper.getVisualFromPhysicalIndex(0)).toBe(null);
      expect(indexMapper.getVisualFromPhysicalIndex(1)).toBe(0);
      expect(indexMapper.getVisualFromPhysicalIndex(2)).toBe(1);
      expect(indexMapper.getVisualFromPhysicalIndex(3)).toBe(2);
      expect(indexMapper.getVisualFromPhysicalIndex(4)).toBe(null);
      expect(indexMapper.getVisualFromPhysicalIndex(5)).toBe(3);
      expect(indexMapper.getVisualFromPhysicalIndex(6)).toBe(null);
      expect(indexMapper.getVisualFromPhysicalIndex(7)).toBe(4);
      expect(indexMapper.getVisualFromPhysicalIndex(8)).toBe(null);
      expect(indexMapper.getVisualFromPhysicalIndex(9)).toBe(5);

      expect(indexMapper.getPhysicalFromVisualIndex(0)).toBe(1);
      expect(indexMapper.getPhysicalFromVisualIndex(1)).toBe(2);
      expect(indexMapper.getPhysicalFromVisualIndex(2)).toBe(3);
      expect(indexMapper.getPhysicalFromVisualIndex(3)).toBe(5);
      expect(indexMapper.getPhysicalFromVisualIndex(4)).toBe(7);
      expect(indexMapper.getPhysicalFromVisualIndex(5)).toBe(9);

      expect(indexMapper.getRenderableFromVisualIndex(0)).toBe(null);
      expect(indexMapper.getRenderableFromVisualIndex(1)).toBe(0);
      expect(indexMapper.getRenderableFromVisualIndex(2)).toBe(null);
      expect(indexMapper.getRenderableFromVisualIndex(3)).toBe(1);
      expect(indexMapper.getRenderableFromVisualIndex(4)).toBe(2);
      expect(indexMapper.getRenderableFromVisualIndex(5)).toBe(null);

      indexMapper.removeIndexes([0, 1, 2]); // physical indexes

      // renderable   |       0     1
      // visual       | 0     1     2     3
      // physical     | 0  1  2  3  4  5  6

      expect(indexMapper.getVisualFromPhysicalIndex(0)).toBe(0);
      expect(indexMapper.getVisualFromPhysicalIndex(1)).toBe(null);
      expect(indexMapper.getVisualFromPhysicalIndex(2)).toBe(1);
      expect(indexMapper.getVisualFromPhysicalIndex(3)).toBe(null);
      expect(indexMapper.getVisualFromPhysicalIndex(4)).toBe(2);
      expect(indexMapper.getVisualFromPhysicalIndex(5)).toBe(null);
      expect(indexMapper.getVisualFromPhysicalIndex(6)).toBe(3);

      expect(indexMapper.getPhysicalFromVisualIndex(0)).toBe(0);
      expect(indexMapper.getPhysicalFromVisualIndex(1)).toBe(2);
      expect(indexMapper.getPhysicalFromVisualIndex(2)).toBe(4);
      expect(indexMapper.getPhysicalFromVisualIndex(3)).toBe(6);

      expect(indexMapper.getRenderableFromVisualIndex(0)).toBe(null);
      expect(indexMapper.getRenderableFromVisualIndex(1)).toBe(0);
      expect(indexMapper.getRenderableFromVisualIndex(2)).toBe(1);
      expect(indexMapper.getRenderableFromVisualIndex(3)).toBe(null);

      expect(indexMapper.isTrimmed(0)).toBe(false);
      expect(indexMapper.isTrimmed(1)).toBe(true);
      expect(indexMapper.isTrimmed(2)).toBe(false);
      expect(indexMapper.isTrimmed(3)).toBe(true);
      expect(indexMapper.isTrimmed(4)).toBe(false);
      expect(indexMapper.isTrimmed(5)).toBe(true);
      expect(indexMapper.isTrimmed(6)).toBe(false);

      expect(indexMapper.isHidden(0)).toBe(true);
      expect(indexMapper.isHidden(1)).toBe(false);
      expect(indexMapper.isHidden(2)).toBe(false);
      expect(indexMapper.isHidden(3)).toBe(false);
      expect(indexMapper.isHidden(4)).toBe(false);
      expect(indexMapper.isHidden(5)).toBe(false);
      expect(indexMapper.isHidden(6)).toBe(true);

      expect(indexMapper.getIndexesSequence()).toEqual([0, 1, 2, 3, 4, 5, 6]);
      expect(indexMapper.getNotTrimmedIndexes()).toEqual([0, 2, 4, 6]);
      expect(indexMapper.getNotHiddenIndexes()).toEqual([1, 2, 3, 4, 5]);
      expect(indexMapper.getRenderableIndexes()).toEqual([2, 4]);
      // Next values (indexes) are recounted (re-indexed).
      expect(indexesSequence.getValues()).toEqual([0, 1, 2, 3, 4, 5, 6]);
      // Next values are just preserved, they aren't counted again.
      expect(pIndexToValueMap.getValues()).toEqual([5, 6, 7, 8, 9, 10, 11]);
      expect(lPIndexToValueMap.indexedValues).toEqual([null, { e: 'f' }, { c: 'd' }, null, null, null, null]);
      expect(lPIndexToValueMap.getValues()).toEqual([{ c: 'd' }, { e: 'f' }]);
      expect(lPIndexToValueMap.orderOfIndexes).toEqual([2, 1]);
      expect(trimmingMap.getValues()).toEqual([false, true, false, true, false, true, false]);
      expect(hidingMap.getValues()).toEqual([true, false, false, false, false, false, true]);

      indexMapper.unregisterMap('indexesSequence');
      indexMapper.unregisterMap('pIndexToValueMap');
      indexMapper.unregisterMap('lPIndexToValueMap');
      indexMapper.unregisterMap('trimmingMap');
      indexMapper.unregisterMap('hidingMap');
    });

    it('should remove multiple indexes from the middle', () => {
      const indexMapper = new IndexMapper();
      const indexesSequence = new IndexesSequence();
      const pIndexToValueMap = new PIndexToValueMap(index => index + 2);
      const lPIndexToValueMap = new LPIndexToValueMap();
      const trimmingMap = new TrimmingMap();
      const hidingMap = new HidingMap();

      indexMapper.registerMap('indexesSequence', indexesSequence);
      indexMapper.registerMap('pIndexToValueMap', pIndexToValueMap);
      indexMapper.registerMap('lPIndexToValueMap', lPIndexToValueMap);
      indexMapper.registerMap('trimmingMap', trimmingMap);
      indexMapper.registerMap('hidingMap', hidingMap);
      indexMapper.initToLength(10);
      trimmingMap.setValues([true, false, true, false, true, false, true, false, true, false]);
      hidingMap.setValues([false, false, false, false, false, true, false, false, false, true]);
      lPIndexToValueMap.setValueAtIndex(3, { a: 'b' });
      lPIndexToValueMap.setValueAtIndex(4, { c: 'd' });
      lPIndexToValueMap.setValueAtIndex(0, { e: 'f' });

      // renderable   |    0     1           2
      // visual       |    0     1     2     3     4
      // physical     | 0  1  2  3  4  5  6  7  8  9

      expect(indexMapper.getVisualFromPhysicalIndex(0)).toBe(null);
      expect(indexMapper.getVisualFromPhysicalIndex(1)).toBe(0);
      expect(indexMapper.getVisualFromPhysicalIndex(2)).toBe(null);
      expect(indexMapper.getVisualFromPhysicalIndex(3)).toBe(1);
      expect(indexMapper.getVisualFromPhysicalIndex(4)).toBe(null);
      expect(indexMapper.getVisualFromPhysicalIndex(5)).toBe(2);
      expect(indexMapper.getVisualFromPhysicalIndex(6)).toBe(null);
      expect(indexMapper.getVisualFromPhysicalIndex(7)).toBe(3);
      expect(indexMapper.getVisualFromPhysicalIndex(8)).toBe(null);
      expect(indexMapper.getVisualFromPhysicalIndex(9)).toBe(4);

      expect(indexMapper.getPhysicalFromVisualIndex(0)).toBe(1);
      expect(indexMapper.getPhysicalFromVisualIndex(1)).toBe(3);
      expect(indexMapper.getPhysicalFromVisualIndex(2)).toBe(5);
      expect(indexMapper.getPhysicalFromVisualIndex(3)).toBe(7);
      expect(indexMapper.getPhysicalFromVisualIndex(4)).toBe(9);

      expect(indexMapper.getRenderableFromVisualIndex(0)).toBe(0);
      expect(indexMapper.getRenderableFromVisualIndex(1)).toBe(1);
      expect(indexMapper.getRenderableFromVisualIndex(2)).toBe(null);
      expect(indexMapper.getRenderableFromVisualIndex(3)).toBe(2);
      expect(indexMapper.getRenderableFromVisualIndex(4)).toBe(null);

      indexMapper.removeIndexes([4, 5]);

      // renderable   |    0     1     2
      // visual       |    0     1     2     3
      // physical     | 0  1  2  3  4  5  6  7

      expect(indexMapper.getVisualFromPhysicalIndex(0)).toBe(null);
      expect(indexMapper.getVisualFromPhysicalIndex(1)).toBe(0);
      expect(indexMapper.getVisualFromPhysicalIndex(2)).toBe(null);
      expect(indexMapper.getVisualFromPhysicalIndex(2)).toBe(null);
      expect(indexMapper.getVisualFromPhysicalIndex(3)).toBe(1);
      expect(indexMapper.getVisualFromPhysicalIndex(4)).toBe(null);
      expect(indexMapper.getVisualFromPhysicalIndex(5)).toBe(2);
      expect(indexMapper.getVisualFromPhysicalIndex(6)).toBe(null);
      expect(indexMapper.getVisualFromPhysicalIndex(7)).toBe(3);

      expect(indexMapper.getPhysicalFromVisualIndex(0)).toBe(1);
      expect(indexMapper.getPhysicalFromVisualIndex(1)).toBe(3);
      expect(indexMapper.getPhysicalFromVisualIndex(2)).toBe(5);
      expect(indexMapper.getPhysicalFromVisualIndex(3)).toBe(7);

      expect(indexMapper.getRenderableFromVisualIndex(0)).toBe(0);
      expect(indexMapper.getRenderableFromVisualIndex(1)).toBe(1);
      expect(indexMapper.getRenderableFromVisualIndex(2)).toBe(2);
      expect(indexMapper.getRenderableFromVisualIndex(3)).toBe(null);

      expect(indexMapper.isTrimmed(0)).toBe(true);
      expect(indexMapper.isTrimmed(1)).toBe(false);
      expect(indexMapper.isTrimmed(2)).toBe(true);
      expect(indexMapper.isTrimmed(3)).toBe(false);
      expect(indexMapper.isTrimmed(4)).toBe(true);
      expect(indexMapper.isTrimmed(5)).toBe(false);
      expect(indexMapper.isTrimmed(6)).toBe(true);
      expect(indexMapper.isTrimmed(7)).toBe(false);

      expect(indexMapper.isHidden(0)).toBe(false);
      expect(indexMapper.isHidden(1)).toBe(false);
      expect(indexMapper.isHidden(2)).toBe(false);
      expect(indexMapper.isHidden(3)).toBe(false);
      expect(indexMapper.isHidden(4)).toBe(false);
      expect(indexMapper.isHidden(5)).toBe(false);
      expect(indexMapper.isHidden(6)).toBe(false);
      expect(indexMapper.isHidden(7)).toBe(true);

      expect(indexMapper.getIndexesSequence()).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
      expect(indexMapper.getNotTrimmedIndexes()).toEqual([1, 3, 5, 7]);
      expect(indexMapper.getNotHiddenIndexes()).toEqual([0, 1, 2, 3, 4, 5, 6]);
      expect(indexMapper.getRenderableIndexes()).toEqual([1, 3, 5]);
      // Next values (indexes) are recounted (re-indexed).
      expect(indexesSequence.getValues()).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
      // Next values are just preserved, they aren't counted again.
      expect(pIndexToValueMap.getValues()).toEqual([2, 3, 4, 5, 8, 9, 10, 11]);
      expect(lPIndexToValueMap.indexedValues).toEqual([{ e: 'f' }, null, null, { a: 'b' }, null, null, null, null]);
      expect(lPIndexToValueMap.getValues()).toEqual([{ a: 'b' }, { e: 'f' }]);
      expect(lPIndexToValueMap.orderOfIndexes).toEqual([3, 0]);
      expect(trimmingMap.getValues()).toEqual([true, false, true, false, true, false, true, false]);
      expect(hidingMap.getValues()).toEqual([false, false, false, false, false, false, false, true]);

      indexMapper.unregisterMap('indexesSequence');
      indexMapper.unregisterMap('pIndexToValueMap');
      indexMapper.unregisterMap('lPIndexToValueMap');
      indexMapper.unregisterMap('trimmingMap');
      indexMapper.unregisterMap('hidingMap');
    });

    it('should remove multiple indexes from the end', () => {
      const indexMapper = new IndexMapper();
      const indexesSequence = new IndexesSequence();
      const pIndexToValueMap = new PIndexToValueMap(index => index + 2);
      const lPIndexToValueMap = new LPIndexToValueMap();
      const trimmingMap = new TrimmingMap();
      const hidingMap = new HidingMap();

      indexMapper.registerMap('indexesSequence', indexesSequence);
      indexMapper.registerMap('pIndexToValueMap', pIndexToValueMap);
      indexMapper.registerMap('lPIndexToValueMap', lPIndexToValueMap);
      indexMapper.registerMap('trimmingMap', trimmingMap);
      indexMapper.registerMap('hidingMap', hidingMap);
      indexMapper.initToLength(10);
      trimmingMap.setValues([true, false, true, false, true, false, true, false, true, false]);
      hidingMap.setValues([false, false, false, true, false, true, false, false, false, true]);
      lPIndexToValueMap.setValueAtIndex(9, { a: 'b' });
      lPIndexToValueMap.setValueAtIndex(8, { c: 'd' });
      lPIndexToValueMap.setValueAtIndex(0, { e: 'f' });

      // renderable   |    0                 1
      // visual       |    0     1     2     3     4
      // physical     | 0  1  2  3  4  5  6  7  8  9

      expect(indexMapper.getVisualFromPhysicalIndex(0)).toBe(null);
      expect(indexMapper.getVisualFromPhysicalIndex(1)).toBe(0);
      expect(indexMapper.getVisualFromPhysicalIndex(2)).toBe(null);
      expect(indexMapper.getVisualFromPhysicalIndex(3)).toBe(1);
      expect(indexMapper.getVisualFromPhysicalIndex(4)).toBe(null);
      expect(indexMapper.getVisualFromPhysicalIndex(5)).toBe(2);
      expect(indexMapper.getVisualFromPhysicalIndex(6)).toBe(null);
      expect(indexMapper.getVisualFromPhysicalIndex(7)).toBe(3);
      expect(indexMapper.getVisualFromPhysicalIndex(8)).toBe(null);
      expect(indexMapper.getVisualFromPhysicalIndex(9)).toBe(4);

      expect(indexMapper.getPhysicalFromVisualIndex(0)).toBe(1);
      expect(indexMapper.getPhysicalFromVisualIndex(1)).toBe(3);
      expect(indexMapper.getPhysicalFromVisualIndex(2)).toBe(5);
      expect(indexMapper.getPhysicalFromVisualIndex(3)).toBe(7);
      expect(indexMapper.getPhysicalFromVisualIndex(4)).toBe(9);

      expect(indexMapper.getRenderableFromVisualIndex(0)).toBe(0);
      expect(indexMapper.getRenderableFromVisualIndex(1)).toBe(null);
      expect(indexMapper.getRenderableFromVisualIndex(2)).toBe(null);
      expect(indexMapper.getRenderableFromVisualIndex(3)).toBe(1);
      expect(indexMapper.getRenderableFromVisualIndex(4)).toBe(null);

      indexMapper.removeIndexes([8, 9]);

      // renderable   |    0                 1
      // visual       |    0     1     2     3
      // physical     | 0  1  2  3  4  5  6  7

      expect(indexMapper.getVisualFromPhysicalIndex(0)).toBe(null);
      expect(indexMapper.getVisualFromPhysicalIndex(1)).toBe(0);
      expect(indexMapper.getVisualFromPhysicalIndex(2)).toBe(null);
      expect(indexMapper.getVisualFromPhysicalIndex(3)).toBe(1);
      expect(indexMapper.getVisualFromPhysicalIndex(4)).toBe(null);
      expect(indexMapper.getVisualFromPhysicalIndex(5)).toBe(2);
      expect(indexMapper.getVisualFromPhysicalIndex(6)).toBe(null);
      expect(indexMapper.getVisualFromPhysicalIndex(7)).toBe(3);

      expect(indexMapper.getPhysicalFromVisualIndex(0)).toBe(1);
      expect(indexMapper.getPhysicalFromVisualIndex(1)).toBe(3);
      expect(indexMapper.getPhysicalFromVisualIndex(2)).toBe(5);
      expect(indexMapper.getPhysicalFromVisualIndex(3)).toBe(7);

      expect(indexMapper.getRenderableFromVisualIndex(0)).toBe(0);
      expect(indexMapper.getRenderableFromVisualIndex(1)).toBe(null);
      expect(indexMapper.getRenderableFromVisualIndex(2)).toBe(null);
      expect(indexMapper.getRenderableFromVisualIndex(3)).toBe(1);

      expect(indexMapper.isTrimmed(0)).toBe(true);
      expect(indexMapper.isTrimmed(1)).toBe(false);
      expect(indexMapper.isTrimmed(2)).toBe(true);
      expect(indexMapper.isTrimmed(3)).toBe(false);
      expect(indexMapper.isTrimmed(4)).toBe(true);
      expect(indexMapper.isTrimmed(5)).toBe(false);
      expect(indexMapper.isTrimmed(6)).toBe(true);
      expect(indexMapper.isTrimmed(7)).toBe(false);

      expect(indexMapper.isHidden(0)).toBe(false);
      expect(indexMapper.isHidden(1)).toBe(false);
      expect(indexMapper.isHidden(2)).toBe(false);
      expect(indexMapper.isHidden(3)).toBe(true);
      expect(indexMapper.isHidden(4)).toBe(false);
      expect(indexMapper.isHidden(5)).toBe(true);
      expect(indexMapper.isHidden(6)).toBe(false);
      expect(indexMapper.isHidden(7)).toBe(false);

      expect(indexMapper.getIndexesSequence()).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
      expect(indexMapper.getNotTrimmedIndexes()).toEqual([1, 3, 5, 7]);
      expect(indexMapper.getNotHiddenIndexes()).toEqual([0, 1, 2, 4, 6, 7]);
      expect(indexMapper.getRenderableIndexes()).toEqual([1, 7]);
      // Next values (indexes) are recounted (re-indexed).
      expect(indexesSequence.getValues()).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
      // Next values are just preserved, they aren't counted again.
      expect(pIndexToValueMap.getValues()).toEqual([2, 3, 4, 5, 6, 7, 8, 9]);
      expect(lPIndexToValueMap.indexedValues).toEqual([{ e: 'f' }, null, null, null, null, null, null, null]);
      expect(lPIndexToValueMap.getValues()).toEqual([{ e: 'f' }]);
      expect(lPIndexToValueMap.orderOfIndexes).toEqual([0]);
      expect(trimmingMap.getValues()).toEqual([true, false, true, false, true, false, true, false]);
      expect(hidingMap.getValues()).toEqual([false, false, false, true, false, true, false, false]);

      indexMapper.unregisterMap('indexesSequence');
      indexMapper.unregisterMap('pIndexToValueMap');
      indexMapper.unregisterMap('lPIndexToValueMap');
      indexMapper.unregisterMap('trimmingMap');
      indexMapper.unregisterMap('hidingMap');
    });

    it('should remove multiple indexes with mixed order #1', () => {
      const indexMapper = new IndexMapper();
      const indexesSequence = new IndexesSequence();
      const pIndexToValueMap = new PIndexToValueMap(index => index + 2);
      const lPIndexToValueMap = new LPIndexToValueMap();
      const trimmingMap = new TrimmingMap();
      const hidingMap = new HidingMap();

      indexMapper.registerMap('indexesSequence', indexesSequence);
      indexMapper.registerMap('pIndexToValueMap', pIndexToValueMap);
      indexMapper.registerMap('lPIndexToValueMap', lPIndexToValueMap);
      indexMapper.registerMap('trimmingMap', trimmingMap);
      indexMapper.registerMap('hidingMap', hidingMap);
      indexMapper.initToLength(10);
      trimmingMap.setValues([true, false, true, false, true, false, true, false, true, false]);
      hidingMap.setValues([false, false, false, true, false, false, false, true, false, false]);
      lPIndexToValueMap.setValueAtIndex(5, { a: 'b' });
      lPIndexToValueMap.setValueAtIndex(1, { c: 'd' });
      lPIndexToValueMap.setValueAtIndex(4, { e: 'f' });
      lPIndexToValueMap.setValueAtIndex(2, { g: 'h' });

      // renderable   |    0           1           2
      // visual       |    0     1     2     3     4
      // physical     | 0  1  2  3  4  5  6  7  8  9

      expect(indexMapper.getVisualFromPhysicalIndex(0)).toBe(null);
      expect(indexMapper.getVisualFromPhysicalIndex(1)).toBe(0);
      expect(indexMapper.getVisualFromPhysicalIndex(2)).toBe(null);
      expect(indexMapper.getVisualFromPhysicalIndex(3)).toBe(1);
      expect(indexMapper.getVisualFromPhysicalIndex(4)).toBe(null);
      expect(indexMapper.getVisualFromPhysicalIndex(5)).toBe(2);
      expect(indexMapper.getVisualFromPhysicalIndex(6)).toBe(null);
      expect(indexMapper.getVisualFromPhysicalIndex(7)).toBe(3);
      expect(indexMapper.getVisualFromPhysicalIndex(8)).toBe(null);
      expect(indexMapper.getVisualFromPhysicalIndex(9)).toBe(4);

      expect(indexMapper.getPhysicalFromVisualIndex(0)).toBe(1);
      expect(indexMapper.getPhysicalFromVisualIndex(1)).toBe(3);
      expect(indexMapper.getPhysicalFromVisualIndex(2)).toBe(5);
      expect(indexMapper.getPhysicalFromVisualIndex(3)).toBe(7);
      expect(indexMapper.getPhysicalFromVisualIndex(4)).toBe(9);

      expect(indexMapper.getRenderableFromVisualIndex(0)).toBe(0);
      expect(indexMapper.getRenderableFromVisualIndex(1)).toBe(null);
      expect(indexMapper.getRenderableFromVisualIndex(2)).toBe(1);
      expect(indexMapper.getRenderableFromVisualIndex(3)).toBe(null);
      expect(indexMapper.getRenderableFromVisualIndex(4)).toBe(2);

      indexMapper.removeIndexes([0, 1, 3, 5]);

      // renderable   |                0
      // visual       |          0     1
      // physical     | 0  1  2  3  4  5

      expect(indexMapper.getVisualFromPhysicalIndex(0)).toBe(null);
      expect(indexMapper.getVisualFromPhysicalIndex(1)).toBe(null);
      expect(indexMapper.getVisualFromPhysicalIndex(2)).toBe(null);
      expect(indexMapper.getVisualFromPhysicalIndex(3)).toBe(0);
      expect(indexMapper.getVisualFromPhysicalIndex(4)).toBe(null);
      expect(indexMapper.getVisualFromPhysicalIndex(5)).toBe(1);

      expect(indexMapper.getPhysicalFromVisualIndex(0)).toBe(3);
      expect(indexMapper.getPhysicalFromVisualIndex(1)).toBe(5);

      expect(indexMapper.getRenderableFromVisualIndex(0)).toBe(null);
      expect(indexMapper.getRenderableFromVisualIndex(1)).toBe(0);

      expect(indexMapper.isTrimmed(0)).toBe(true);
      expect(indexMapper.isTrimmed(1)).toBe(true);
      expect(indexMapper.isTrimmed(2)).toBe(true);
      expect(indexMapper.isTrimmed(3)).toBe(false);
      expect(indexMapper.isTrimmed(4)).toBe(true);
      expect(indexMapper.isTrimmed(5)).toBe(false);

      expect(indexMapper.isHidden(0)).toBe(false);
      expect(indexMapper.isHidden(1)).toBe(false);
      expect(indexMapper.isHidden(2)).toBe(false);
      expect(indexMapper.isHidden(3)).toBe(true);
      expect(indexMapper.isHidden(4)).toBe(false);
      expect(indexMapper.isHidden(5)).toBe(false);

      expect(indexMapper.getIndexesSequence()).toEqual([0, 1, 2, 3, 4, 5]);
      expect(indexMapper.getNotTrimmedIndexes()).toEqual([3, 5]);
      expect(indexMapper.getNotHiddenIndexes()).toEqual([0, 1, 2, 4, 5]);
      expect(indexMapper.getRenderableIndexes()).toEqual([5]);
      // Next values (indexes) are recounted (re-indexed).
      expect(indexesSequence.getValues()).toEqual([0, 1, 2, 3, 4, 5]);
      // Next values are just preserved, they aren't counted again.
      expect(pIndexToValueMap.getValues()).toEqual([4, 6, 8, 9, 10, 11]);
      expect(lPIndexToValueMap.indexedValues).toEqual([{ g: 'h' }, { e: 'f' }, null, null, null, null]);
      expect(lPIndexToValueMap.getValues()).toEqual([{ e: 'f' }, { g: 'h' }]);
      expect(lPIndexToValueMap.orderOfIndexes).toEqual([1, 0]);
      expect(trimmingMap.getValues()).toEqual([true, true, true, false, true, false]);
      expect(hidingMap.getValues()).toEqual([false, false, false, true, false, false]);

      indexMapper.unregisterMap('indexesSequence');
      indexMapper.unregisterMap('pIndexToValueMap');
      indexMapper.unregisterMap('lPIndexToValueMap');
      indexMapper.unregisterMap('trimmingMap');
      indexMapper.unregisterMap('hidingMap');
    });

    it('should remove multiple indexes with mixed order #2', () => {
      const indexMapper = new IndexMapper();
      const indexesSequence = new IndexesSequence();
      const pIndexToValueMap = new PIndexToValueMap(index => index + 2);
      const lPIndexToValueMap = new LPIndexToValueMap();
      const trimmingMap = new TrimmingMap();
      const hidingMap = new HidingMap();

      indexMapper.registerMap('indexesSequence', indexesSequence);
      indexMapper.registerMap('pIndexToValueMap', pIndexToValueMap);
      indexMapper.registerMap('lPIndexToValueMap', lPIndexToValueMap);
      indexMapper.registerMap('trimmingMap', trimmingMap);
      indexMapper.registerMap('hidingMap', hidingMap);
      indexMapper.initToLength(10);
      trimmingMap.setValues([true, false, true, false, true, false, true, false, true, false]);
      hidingMap.setValues([false, false, false, true, false, true, false, false, false, true]);
      lPIndexToValueMap.setValueAtIndex(5, { a: 'b' });
      lPIndexToValueMap.setValueAtIndex(1, { c: 'd' });
      lPIndexToValueMap.setValueAtIndex(4, { e: 'f' });
      lPIndexToValueMap.setValueAtIndex(2, { g: 'h' });

      // renderable   |    0                 1
      // visual       |    0     1     2     3     4
      // physical     | 0  1  2  3  4  5  6  7  8  9

      expect(indexMapper.getVisualFromPhysicalIndex(0)).toBe(null);
      expect(indexMapper.getVisualFromPhysicalIndex(1)).toBe(0);
      expect(indexMapper.getVisualFromPhysicalIndex(2)).toBe(null);
      expect(indexMapper.getVisualFromPhysicalIndex(3)).toBe(1);
      expect(indexMapper.getVisualFromPhysicalIndex(4)).toBe(null);
      expect(indexMapper.getVisualFromPhysicalIndex(5)).toBe(2);
      expect(indexMapper.getVisualFromPhysicalIndex(6)).toBe(null);
      expect(indexMapper.getVisualFromPhysicalIndex(7)).toBe(3);
      expect(indexMapper.getVisualFromPhysicalIndex(8)).toBe(null);
      expect(indexMapper.getVisualFromPhysicalIndex(9)).toBe(4);

      expect(indexMapper.getPhysicalFromVisualIndex(0)).toBe(1);
      expect(indexMapper.getPhysicalFromVisualIndex(1)).toBe(3);
      expect(indexMapper.getPhysicalFromVisualIndex(2)).toBe(5);
      expect(indexMapper.getPhysicalFromVisualIndex(3)).toBe(7);
      expect(indexMapper.getPhysicalFromVisualIndex(4)).toBe(9);

      expect(indexMapper.getRenderableFromVisualIndex(0)).toBe(0);
      expect(indexMapper.getRenderableFromVisualIndex(1)).toBe(null);
      expect(indexMapper.getRenderableFromVisualIndex(2)).toBe(null);
      expect(indexMapper.getRenderableFromVisualIndex(3)).toBe(1);
      expect(indexMapper.getRenderableFromVisualIndex(4)).toBe(null);

      indexMapper.removeIndexes([5, 3, 1, 0]);

      // renderable   |          0
      // visual       |          0     1
      // physical     | 0  1  2  3  4  5

      expect(indexMapper.getVisualFromPhysicalIndex(0)).toBe(null);
      expect(indexMapper.getVisualFromPhysicalIndex(1)).toBe(null);
      expect(indexMapper.getVisualFromPhysicalIndex(2)).toBe(null);
      expect(indexMapper.getVisualFromPhysicalIndex(3)).toBe(0);
      expect(indexMapper.getVisualFromPhysicalIndex(4)).toBe(null);
      expect(indexMapper.getVisualFromPhysicalIndex(5)).toBe(1);

      expect(indexMapper.getPhysicalFromVisualIndex(0)).toBe(3);
      expect(indexMapper.getPhysicalFromVisualIndex(1)).toBe(5);

      expect(indexMapper.getRenderableFromVisualIndex(0)).toBe(0);
      expect(indexMapper.getRenderableFromVisualIndex(1)).toBe(null);

      expect(indexMapper.isTrimmed(0)).toBe(true);
      expect(indexMapper.isTrimmed(1)).toBe(true);
      expect(indexMapper.isTrimmed(2)).toBe(true);
      expect(indexMapper.isTrimmed(3)).toBe(false);
      expect(indexMapper.isTrimmed(4)).toBe(true);
      expect(indexMapper.isTrimmed(5)).toBe(false);

      expect(indexMapper.isHidden(0)).toBe(false);
      expect(indexMapper.isHidden(1)).toBe(false);
      expect(indexMapper.isHidden(2)).toBe(false);
      expect(indexMapper.isHidden(3)).toBe(false);
      expect(indexMapper.isHidden(4)).toBe(false);
      expect(indexMapper.isHidden(5)).toBe(true);

      expect(indexMapper.getIndexesSequence()).toEqual([0, 1, 2, 3, 4, 5]);
      expect(indexMapper.getNotTrimmedIndexes()).toEqual([3, 5]);
      expect(indexMapper.getNotHiddenIndexes()).toEqual([0, 1, 2, 3, 4]);
      expect(indexMapper.getRenderableIndexes()).toEqual([3]);
      // Next values (indexes) are recounted (re-indexed).
      expect(indexesSequence.getValues()).toEqual([0, 1, 2, 3, 4, 5]);
      // Next values are just preserved, they aren't counted again.
      expect(pIndexToValueMap.getValues()).toEqual([4, 6, 8, 9, 10, 11]);
      expect(lPIndexToValueMap.indexedValues).toEqual([{ g: 'h' }, { e: 'f' }, null, null, null, null]);
      expect(lPIndexToValueMap.getValues()).toEqual([{ e: 'f' }, { g: 'h' }]);
      expect(lPIndexToValueMap.orderOfIndexes).toEqual([1, 0]);
      expect(trimmingMap.getValues()).toEqual([true, true, true, false, true, false]);
      expect(hidingMap.getValues()).toEqual([false, false, false, false, false, true]);

      indexMapper.unregisterMap('indexesSequence');
      indexMapper.unregisterMap('pIndexToValueMap');
      indexMapper.unregisterMap('lPIndexToValueMap');
      indexMapper.unregisterMap('trimmingMap');
      indexMapper.unregisterMap('hidingMap');
    });

    it('should remove multiple indexes with mixed order #3', () => {
      const indexMapper = new IndexMapper();
      const indexesSequence = new IndexesSequence();
      const pIndexToValueMap = new PIndexToValueMap(index => index + 2);
      const lPIndexToValueMap = new LPIndexToValueMap();
      const trimmingMap = new TrimmingMap();
      const hidingMap = new HidingMap();

      indexMapper.registerMap('indexesSequence', indexesSequence);
      indexMapper.registerMap('pIndexToValueMap', pIndexToValueMap);
      indexMapper.registerMap('lPIndexToValueMap', lPIndexToValueMap);
      indexMapper.registerMap('trimmingMap', trimmingMap);
      indexMapper.registerMap('hidingMap', hidingMap);
      indexMapper.initToLength(10);
      trimmingMap.setValues([true, false, true, false, true, false, true, false, true, false]);
      hidingMap.setValues([false, false, false, true, false, true, false, false, false, true]);
      lPIndexToValueMap.setValueAtIndex(5, { a: 'b' });
      lPIndexToValueMap.setValueAtIndex(1, { c: 'd' });
      lPIndexToValueMap.setValueAtIndex(4, { e: 'f' });
      lPIndexToValueMap.setValueAtIndex(2, { g: 'h' });

      // renderable   |    0                 1
      // visual       |    0     1     2     3     4
      // physical     | 0  1  2  3  4  5  6  7  8  9

      expect(indexMapper.getVisualFromPhysicalIndex(0)).toBe(null);
      expect(indexMapper.getVisualFromPhysicalIndex(1)).toBe(0);
      expect(indexMapper.getVisualFromPhysicalIndex(2)).toBe(null);
      expect(indexMapper.getVisualFromPhysicalIndex(3)).toBe(1);
      expect(indexMapper.getVisualFromPhysicalIndex(4)).toBe(null);
      expect(indexMapper.getVisualFromPhysicalIndex(5)).toBe(2);
      expect(indexMapper.getVisualFromPhysicalIndex(6)).toBe(null);
      expect(indexMapper.getVisualFromPhysicalIndex(7)).toBe(3);
      expect(indexMapper.getVisualFromPhysicalIndex(8)).toBe(null);
      expect(indexMapper.getVisualFromPhysicalIndex(9)).toBe(4);

      expect(indexMapper.getPhysicalFromVisualIndex(0)).toBe(1);
      expect(indexMapper.getPhysicalFromVisualIndex(1)).toBe(3);
      expect(indexMapper.getPhysicalFromVisualIndex(2)).toBe(5);
      expect(indexMapper.getPhysicalFromVisualIndex(3)).toBe(7);
      expect(indexMapper.getPhysicalFromVisualIndex(4)).toBe(9);

      expect(indexMapper.getRenderableFromVisualIndex(0)).toBe(0);
      expect(indexMapper.getRenderableFromVisualIndex(1)).toBe(null);
      expect(indexMapper.getRenderableFromVisualIndex(2)).toBe(null);
      expect(indexMapper.getRenderableFromVisualIndex(3)).toBe(1);
      expect(indexMapper.getRenderableFromVisualIndex(4)).toBe(null);

      indexMapper.removeIndexes([0, 5, 3, 1]);

      // renderable   |          0
      // visual       |          0     1
      // physical     | 0  1  2  3  4  5

      expect(indexMapper.getVisualFromPhysicalIndex(0)).toBe(null);
      expect(indexMapper.getVisualFromPhysicalIndex(1)).toBe(null);
      expect(indexMapper.getVisualFromPhysicalIndex(2)).toBe(null);
      expect(indexMapper.getVisualFromPhysicalIndex(3)).toBe(0);
      expect(indexMapper.getVisualFromPhysicalIndex(4)).toBe(null);
      expect(indexMapper.getVisualFromPhysicalIndex(5)).toBe(1);

      expect(indexMapper.getPhysicalFromVisualIndex(0)).toBe(3);
      expect(indexMapper.getPhysicalFromVisualIndex(1)).toBe(5);

      expect(indexMapper.getRenderableFromVisualIndex(0)).toBe(0);
      expect(indexMapper.getRenderableFromVisualIndex(1)).toBe(null);

      expect(indexMapper.isTrimmed(0)).toBe(true);
      expect(indexMapper.isTrimmed(1)).toBe(true);
      expect(indexMapper.isTrimmed(2)).toBe(true);
      expect(indexMapper.isTrimmed(3)).toBe(false);
      expect(indexMapper.isTrimmed(4)).toBe(true);
      expect(indexMapper.isTrimmed(5)).toBe(false);

      expect(indexMapper.isHidden(0)).toBe(false);
      expect(indexMapper.isHidden(1)).toBe(false);
      expect(indexMapper.isHidden(2)).toBe(false);
      expect(indexMapper.isHidden(3)).toBe(false);
      expect(indexMapper.isHidden(4)).toBe(false);
      expect(indexMapper.isHidden(5)).toBe(true);

      expect(indexMapper.getIndexesSequence()).toEqual([0, 1, 2, 3, 4, 5]);
      expect(indexMapper.getNotTrimmedIndexes()).toEqual([3, 5]);
      expect(indexMapper.getNotHiddenIndexes()).toEqual([0, 1, 2, 3, 4]);
      expect(indexMapper.getRenderableIndexes()).toEqual([3]);
      // Next values (indexes) are recounted (re-indexed).
      expect(indexesSequence.getValues()).toEqual([0, 1, 2, 3, 4, 5]);
      // Next values are just preserved, they aren't counted again.
      expect(pIndexToValueMap.getValues()).toEqual([4, 6, 8, 9, 10, 11]);
      expect(lPIndexToValueMap.indexedValues).toEqual([{ g: 'h' }, { e: 'f' }, null, null, null, null]);
      expect(lPIndexToValueMap.getValues()).toEqual([{ e: 'f' }, { g: 'h' }]);
      expect(lPIndexToValueMap.orderOfIndexes).toEqual([1, 0]);
      expect(trimmingMap.getValues()).toEqual([true, true, true, false, true, false]);
      expect(hidingMap.getValues()).toEqual([false, false, false, false, false, true]);

      indexMapper.unregisterMap('indexesSequence');
      indexMapper.unregisterMap('pIndexToValueMap');
      indexMapper.unregisterMap('lPIndexToValueMap');
      indexMapper.unregisterMap('trimmingMap');
      indexMapper.unregisterMap('hidingMap');
    });
  });

  describe('inserting indexes', () => {
    describe('without indexes skipped in the process of rendering', () => {
      it('should insert multiple indexes at the start', () => {
        const indexMapper = new IndexMapper();
        const indexesSequence = new IndexesSequence();
        const pIndexToValueMap = new PIndexToValueMap(index => index + 2);
        const lPIndexToValueMap = new LPIndexToValueMap();

        indexMapper.registerMap('indexesSequence', indexesSequence);
        indexMapper.registerMap('pIndexToValueMap', pIndexToValueMap);
        indexMapper.registerMap('lPIndexToValueMap', lPIndexToValueMap);
        indexMapper.initToLength(10);

        lPIndexToValueMap.setValueAtIndex(1, { a: 'b' });
        lPIndexToValueMap.setValueAtIndex(0, { c: 'd' });
        lPIndexToValueMap.setValueAtIndex(4, { e: 'f' });

        indexMapper.insertIndexes(0, 3);

        expect(indexMapper.getIndexesSequence()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
        // Next values (indexes) are recounted (re-indexed).
        expect(indexesSequence.getValues()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
        // Next values are just preserved, they aren't counted again.
        expect(pIndexToValueMap.getValues()).toEqual([2, 3, 4, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
        expect(lPIndexToValueMap.indexedValues).toEqual([null, null, null, { c: 'd' }, { a: 'b' }, null, null,
          { e: 'f' }, null, null, null, null, null]);
        expect(lPIndexToValueMap.getValues()).toEqual([{ a: 'b' }, { c: 'd' }, { e: 'f' }]);
        expect(lPIndexToValueMap.orderOfIndexes).toEqual([4, 3, 7]);

        indexMapper.unregisterMap('indexesSequence');
        indexMapper.unregisterMap('pIndexToValueMap');
        indexMapper.unregisterMap('lPIndexToValueMap');
      });

      it('should insert multiple indexes at the middle', () => {
        const indexMapper = new IndexMapper();
        const indexesSequence = new IndexesSequence();
        const pIndexToValueMap = new PIndexToValueMap(index => index + 2);
        const lPIndexToValueMap = new LPIndexToValueMap();

        indexMapper.registerMap('indexesSequence', indexesSequence);
        indexMapper.registerMap('pIndexToValueMap', pIndexToValueMap);
        indexMapper.registerMap('lPIndexToValueMap', lPIndexToValueMap);
        indexMapper.initToLength(10);

        lPIndexToValueMap.setValueAtIndex(2, { a: 'b' });
        lPIndexToValueMap.setValueAtIndex(1, { c: 'd' });
        lPIndexToValueMap.setValueAtIndex(6, { e: 'f' });

        indexMapper.insertIndexes(4, 3);

        expect(indexMapper.getIndexesSequence()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
        // Next values (indexes) are recounted (re-indexed).
        expect(indexesSequence.getValues()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
        // Next values are just preserved, they aren't counted again.
        expect(pIndexToValueMap.getValues()).toEqual([2, 3, 4, 5, 6, 7, 8, 6, 7, 8, 9, 10, 11]);
        expect(lPIndexToValueMap.indexedValues).toEqual([null, { c: 'd' }, { a: 'b' }, null, null, null, null, null,
          null, { e: 'f' }, null, null, null]);
        expect(lPIndexToValueMap.getValues()).toEqual([{ a: 'b' }, { c: 'd' }, { e: 'f' }]);
        expect(lPIndexToValueMap.orderOfIndexes).toEqual([2, 1, 9]);

        indexMapper.unregisterMap('indexesSequence');
        indexMapper.unregisterMap('pIndexToValueMap');
        indexMapper.unregisterMap('lPIndexToValueMap');
      });

      it('should insert multiple indexes next to the end', () => {
        const indexMapper = new IndexMapper();
        const indexesSequence = new IndexesSequence();
        const pIndexToValueMap = new PIndexToValueMap(index => index + 2);
        const lPIndexToValueMap = new LPIndexToValueMap();

        indexMapper.registerMap('indexesSequence', indexesSequence);
        indexMapper.registerMap('pIndexToValueMap', pIndexToValueMap);
        indexMapper.registerMap('lPIndexToValueMap', lPIndexToValueMap);
        indexMapper.initToLength(10);

        lPIndexToValueMap.setValueAtIndex(2, { a: 'b' });
        lPIndexToValueMap.setValueAtIndex(1, { c: 'd' });
        lPIndexToValueMap.setValueAtIndex(9, { e: 'f' });

        indexMapper.insertIndexes(9, 3);

        expect(indexMapper.getIndexesSequence()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
        // Next values (indexes) are recounted (re-indexed).
        expect(indexesSequence.getValues()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
        // Next values are just preserved, they aren't counted again.
        expect(pIndexToValueMap.getValues()).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 11]);
        expect(lPIndexToValueMap.indexedValues).toEqual([null, { c: 'd' }, { a: 'b' }, null, null, null, null, null,
          null, null, null, null, { e: 'f' }]);
        expect(lPIndexToValueMap.getValues()).toEqual([{ a: 'b' }, { c: 'd' }, { e: 'f' }]);
        expect(lPIndexToValueMap.orderOfIndexes).toEqual([2, 1, 12]);

        indexMapper.unregisterMap('indexesSequence');
        indexMapper.unregisterMap('pIndexToValueMap');
        indexMapper.unregisterMap('lPIndexToValueMap');
      });

      it('should insert multiple indexes at the end (index equal to the length of maps)', () => {
        const indexMapper = new IndexMapper();
        const indexesSequence = new IndexesSequence();
        const pIndexToValueMap = new PIndexToValueMap(index => index + 2);
        const lPIndexToValueMap = new LPIndexToValueMap();

        indexMapper.registerMap('indexesSequence', indexesSequence);
        indexMapper.registerMap('pIndexToValueMap', pIndexToValueMap);
        indexMapper.registerMap('lPIndexToValueMap', lPIndexToValueMap);
        indexMapper.initToLength(10);

        lPIndexToValueMap.setValueAtIndex(2, { a: 'b' });
        lPIndexToValueMap.setValueAtIndex(1, { c: 'd' });
        lPIndexToValueMap.setValueAtIndex(9, { e: 'f' });

        indexMapper.insertIndexes(10, 3);

        expect(indexMapper.getIndexesSequence()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
        // Next values (indexes) are recounted (re-indexed).
        expect(indexesSequence.getValues()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
        // Next values are just preserved, they aren't counted again.
        expect(pIndexToValueMap.getValues()).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
        expect(lPIndexToValueMap.indexedValues).toEqual([null, { c: 'd' }, { a: 'b' }, null, null, null, null, null,
          null, { e: 'f' }, null, null, null]);
        expect(lPIndexToValueMap.getValues()).toEqual([{ a: 'b' }, { c: 'd' }, { e: 'f' }]);
        expect(lPIndexToValueMap.orderOfIndexes).toEqual([2, 1, 9]);

        indexMapper.unregisterMap('indexesSequence');
        indexMapper.unregisterMap('pIndexToValueMap');
        indexMapper.unregisterMap('lPIndexToValueMap');
      });

      it('should insert multiple indexes at the end (index higher than length of maps)', () => {
        const indexMapper = new IndexMapper();
        const indexesSequence = new IndexesSequence();
        const pIndexToValueMap = new PIndexToValueMap(index => index + 2);
        const lPIndexToValueMap = new LPIndexToValueMap();

        indexMapper.registerMap('indexesSequence', indexesSequence);
        indexMapper.registerMap('pIndexToValueMap', pIndexToValueMap);
        indexMapper.registerMap('lPIndexToValueMap', lPIndexToValueMap);
        indexMapper.initToLength(10);

        lPIndexToValueMap.setValueAtIndex(2, { a: 'b' });
        lPIndexToValueMap.setValueAtIndex(1, { c: 'd' });
        lPIndexToValueMap.setValueAtIndex(9, { e: 'f' });

        indexMapper.insertIndexes(12, 3);

        expect(indexMapper.getIndexesSequence()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
        // Next values (indexes) are recounted (re-indexed).
        expect(indexesSequence.getValues()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
        // Next values are just preserved, they aren't counted again.
        expect(pIndexToValueMap.getValues()).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
        expect(lPIndexToValueMap.indexedValues).toEqual([null, { c: 'd' }, { a: 'b' }, null, null, null, null, null,
          null, { e: 'f' }, null, null, null]);
        expect(lPIndexToValueMap.getValues()).toEqual([{ a: 'b' }, { c: 'd' }, { e: 'f' }]);
        expect(lPIndexToValueMap.orderOfIndexes).toEqual([2, 1, 9]);

        indexMapper.unregisterMap('indexesSequence');
        indexMapper.unregisterMap('pIndexToValueMap');
        indexMapper.unregisterMap('lPIndexToValueMap');
      });

      it('should insert index properly when starting sequence of indexes is from `n` to `0`, where `n` is number of indexes minus 1', () => {
        const indexMapper = new IndexMapper();

        indexMapper.initToLength(5);
        indexMapper.setIndexesSequence([4, 3, 2, 1, 0]);
        indexMapper.insertIndexes(1, 1);

        // Index was inserted before 4th element (inserted index "is sticked" to next adjacent element).
        expect(indexMapper.getIndexesSequence()).toEqual([5, 3, 4, 2, 1, 0]);

        indexMapper.insertIndexes(0, 1);

        // Index was inserted before 6th element (inserted index "is sticked" to next adjacent element).
        expect(indexMapper.getIndexesSequence()).toEqual([5, 6, 3, 4, 2, 1, 0]);

        indexMapper.insertIndexes(7, 1);

        expect(indexMapper.getIndexesSequence()).toEqual([5, 6, 3, 4, 2, 1, 0, 7]);
      });

      it('should do nothing if there is nothing to insert', () => {
        const indexMapper = new IndexMapper();
        const indexesSequence = new IndexesSequence();
        const hidingMap = new HidingMap();
        const pIndexToValueMap = new PIndexToValueMap();
        const trimmingMap = new TrimmingMap();

        indexMapper.registerMap('indexesSequence', indexesSequence);
        indexMapper.registerMap('hidingMap', hidingMap);
        indexMapper.registerMap('pIndexToValueMap', pIndexToValueMap);
        indexMapper.registerMap('trimmingMap', trimmingMap);
        indexMapper.initToLength(5);

        trimmingMap.setValues([false, false, false, false, false]);

        indexMapper.insertIndexes(0, 0);

        expect(trimmingMap.getValues()).toEqual([false, false, false, false, false]);
        expect(hidingMap.getValues()).toEqual([false, false, false, false, false]);
        expect(pIndexToValueMap.getValues()).toEqual([null, null, null, null, null]);
      });
    });

    describe('with trimmed indexes', () => {
      it('should insert insert properly then adding it on position of trimmed index', () => {
        const indexMapper = new IndexMapper();
        const indexesSequence = new IndexesSequence();
        const pIndexToValueMap = new PIndexToValueMap(index => index + 2);
        const lPIndexToValueMap = new LPIndexToValueMap();
        const trimmingMap = new TrimmingMap();

        indexMapper.registerMap('indexesSequence', indexesSequence);
        indexMapper.registerMap('pIndexToValueMap', pIndexToValueMap);
        indexMapper.registerMap('lPIndexToValueMap', lPIndexToValueMap);
        indexMapper.registerMap('trimmingMap', trimmingMap);
        indexMapper.initToLength(10);

        trimmingMap.setValues([false, false, false, true, false, false, false, false, false, false]);
        lPIndexToValueMap.setValueAtIndex(4, { a: 'b' });
        lPIndexToValueMap.setValueAtIndex(3, { c: 'd' });
        lPIndexToValueMap.setValueAtIndex(2, { e: 'f' });

        indexMapper.insertIndexes(3, 1);

        expect(indexMapper.getIndexesSequence()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        expect(indexMapper.getNotTrimmedIndexes()).toEqual([0, 1, 2, 4, 5, 6, 7, 8, 9, 10]);
        // Next values (indexes) are recounted (re-indexed).
        expect(indexesSequence.getValues()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        // Next values are just preserved, they aren't counted again.
        // Element is inserted at 4th position (before 5th element, because third element is trimmed).
        expect(pIndexToValueMap.getValues()).toEqual([2, 3, 4, 5, 6, 6, 7, 8, 9, 10, 11]);
        expect(lPIndexToValueMap.indexedValues).toEqual([null, null, { e: 'f' }, { c: 'd' }, null, { a: 'b' },
          null, null, null, null, null]);
        expect(lPIndexToValueMap.getValues()).toEqual([{ a: 'b' }, { c: 'd' }, { e: 'f' }]);
        expect(lPIndexToValueMap.orderOfIndexes).toEqual([5, 3, 2]);
        expect(trimmingMap.getValues())
          .toEqual([false, false, false, true, false, false, false, false, false, false, false]);

        indexMapper.unregisterMap('indexesSequence');
        indexMapper.unregisterMap('pIndexToValueMap');
        indexMapper.unregisterMap('lPIndexToValueMap');
        indexMapper.unregisterMap('trimmingMap');
      });

      it('should insert indexes properly when just some indexes trimmed (not reindexing trimmed indexes)', () => {
        const indexMapper = new IndexMapper();
        const indexesSequence = new IndexesSequence();
        const pIndexToValueMap = new PIndexToValueMap(index => index + 2);
        const lPIndexToValueMap = new LPIndexToValueMap();
        const trimmingMap = new TrimmingMap();

        indexMapper.registerMap('indexesSequence', indexesSequence);
        indexMapper.registerMap('pIndexToValueMap', pIndexToValueMap);
        indexMapper.registerMap('lPIndexToValueMap', lPIndexToValueMap);
        indexMapper.registerMap('trimmingMap', trimmingMap);
        indexMapper.initToLength(10);

        trimmingMap.setValues([true, true, true, true, false, false, false, false, false, false]);
        lPIndexToValueMap.setValueAtIndex(3, { a: 'b' });
        lPIndexToValueMap.setValueAtIndex(0, { c: 'd' });
        lPIndexToValueMap.setValueAtIndex(4, { e: 'f' });

        expect(indexMapper.getNotTrimmedIndexes()).toEqual([4, 5, 6, 7, 8, 9]); // trimmed indexes: 0, 1, 2, 3 <----------------------

        indexMapper.insertIndexes(0, 3);

        expect(indexMapper.getIndexesSequence()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
        expect(indexMapper.getNotTrimmedIndexes()).toEqual([4, 5, 6, 7, 8, 9, 10, 11, 12]); // trimmed indexes: 0, 1, 2, 3 <----------------------
        // // Next values (indexes) are recounted (re-indexed).
        expect(indexesSequence.getValues()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
        // // Next values are just preserved, they aren't counted again.
        expect(pIndexToValueMap.getValues()).toEqual([2, 3, 4, 5, 6, 7, 8, 6, 7, 8, 9, 10, 11]);
        expect(lPIndexToValueMap.indexedValues).toEqual([{ c: 'd' }, null, null, { a: 'b' }, null, null, null,
          { e: 'f' }, null, null, null, null, null]);
        expect(lPIndexToValueMap.getValues()).toEqual([{ a: 'b' }, { c: 'd' }, { e: 'f' }]);
        expect(lPIndexToValueMap.orderOfIndexes).toEqual([3, 0, 7]);
        expect(trimmingMap.getValues())
          .toEqual([true, true, true, true, false, false, false, false, false, false, false, false, false]);

        indexMapper.unregisterMap('indexesSequence');
        indexMapper.unregisterMap('pIndexToValueMap');
        indexMapper.unregisterMap('lPIndexToValueMap');
        indexMapper.unregisterMap('trimmingMap');
      });

      it('should insert indexes properly when just some indexes trimmed (reindexing trimmed indexes)', () => {
        const indexMapper = new IndexMapper();
        const indexesSequence = new IndexesSequence();
        const pIndexToValueMap = new PIndexToValueMap(index => index + 2);
        const lPIndexToValueMap = new LPIndexToValueMap();
        const trimmingMap = new TrimmingMap();

        indexMapper.registerMap('indexesSequence', indexesSequence);
        indexMapper.registerMap('pIndexToValueMap', pIndexToValueMap);
        indexMapper.registerMap('lPIndexToValueMap', lPIndexToValueMap);
        indexMapper.registerMap('trimmingMap', trimmingMap);
        indexMapper.initToLength(10);

        trimmingMap.setValues([false, false, false, false, false, false, true, true, true, true]);
        lPIndexToValueMap.setValueAtIndex(2, { a: 'b' });
        lPIndexToValueMap.setValueAtIndex(1, { c: 'd' });
        lPIndexToValueMap.setValueAtIndex(0, { e: 'f' });

        expect(indexMapper.getNotTrimmedIndexes()).toEqual([0, 1, 2, 3, 4, 5]); // trimmed indexes: 6, 7, 8, 9 <----------------------

        indexMapper.insertIndexes(0, 3);

        expect(indexMapper.getIndexesSequence()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
        expect(indexMapper.getNotTrimmedIndexes()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]); // trimmed indexes: 9, 10, 11, 12 <----------------------
        // // Next values (indexes) are recounted (re-indexed).
        expect(indexesSequence.getValues()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
        // // Next values are just preserved, they aren't counted again.
        expect(pIndexToValueMap.getValues()).toEqual([2, 3, 4, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
        expect(lPIndexToValueMap.indexedValues).toEqual([null, null, null, { e: 'f' }, { c: 'd' }, { a: 'b' }, null,
          null, null, null, null, null, null]);
        expect(lPIndexToValueMap.getValues()).toEqual([{ a: 'b' }, { c: 'd' }, { e: 'f' }]);
        expect(lPIndexToValueMap.orderOfIndexes).toEqual([5, 4, 3]);
        expect(trimmingMap.getValues())
          .toEqual([false, false, false, false, false, false, false, false, false, true, true, true, true]);

        indexMapper.unregisterMap('indexesSequence');
        indexMapper.unregisterMap('pIndexToValueMap');
        indexMapper.unregisterMap('lPIndexToValueMap');
        indexMapper.unregisterMap('trimmingMap');
      });

      it('should insert indexes properly when all indexes are trimmed', () => {
        const indexMapper = new IndexMapper();
        const indexesSequence = new IndexesSequence();
        const pIndexToValueMap = new PIndexToValueMap(index => index + 2);
        const lPIndexToValueMap = new LPIndexToValueMap();
        const trimmingMap = new TrimmingMap();

        indexMapper.registerMap('indexesSequence', indexesSequence);
        indexMapper.registerMap('pIndexToValueMap', pIndexToValueMap);
        indexMapper.registerMap('lPIndexToValueMap', lPIndexToValueMap);
        indexMapper.registerMap('trimmingMap', trimmingMap);
        indexMapper.initToLength(10);

        trimmingMap.setValues([true, true, true, true, true, true, true, true, true, true]);
        lPIndexToValueMap.setValueAtIndex(2, { a: 'b' });
        lPIndexToValueMap.setValueAtIndex(1, { c: 'd' });
        lPIndexToValueMap.setValueAtIndex(0, { e: 'f' });

        indexMapper.insertIndexes(0, 3);

        expect(indexMapper.getIndexesSequence()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
        expect(indexMapper.getNotTrimmedIndexes()).toEqual([10, 11, 12]);
        // // Next values (indexes) are recounted (re-indexed).
        expect(indexesSequence.getValues()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
        // // Next values are just preserved, they aren't counted again.
        expect(pIndexToValueMap.getValues()).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
        expect(lPIndexToValueMap.indexedValues).toEqual([{ e: 'f' }, { c: 'd' }, { a: 'b' }, null, null, null, null,
          null, null, null, null, null, null]);
        expect(lPIndexToValueMap.getValues()).toEqual([{ a: 'b' }, { c: 'd' }, { e: 'f' }]);
        expect(lPIndexToValueMap.orderOfIndexes).toEqual([2, 1, 0]);
        expect(trimmingMap.getValues())
          .toEqual([true, true, true, true, true, true, true, true, true, true, false, false, false]);

        indexMapper.unregisterMap('indexesSequence');
        indexMapper.unregisterMap('pIndexToValueMap');
        indexMapper.unregisterMap('lPIndexToValueMap');
        indexMapper.unregisterMap('trimmingMap');
      });
    });

    describe('with hidden indexes', () => {
      it('should insert indexes properly when some indexes are hidden', () => {
        const indexMapper = new IndexMapper();
        const indexesSequence = new IndexesSequence();
        const pIndexToValueMap = new PIndexToValueMap(index => index + 2);
        const lPIndexToValueMap = new LPIndexToValueMap();
        const hidingMap = new HidingMap();

        indexMapper.registerMap('indexesSequence', indexesSequence);
        indexMapper.registerMap('pIndexToValueMap', pIndexToValueMap);
        indexMapper.registerMap('lPIndexToValueMap', lPIndexToValueMap);
        indexMapper.registerMap('hidingMap', hidingMap);
        indexMapper.initToLength(10);

        hidingMap.setValues([true, true, false, false, false, false, false, false, false, true]);
        lPIndexToValueMap.setValueAtIndex(4, { a: 'b' });
        lPIndexToValueMap.setValueAtIndex(3, { c: 'd' });
        lPIndexToValueMap.setValueAtIndex(2, { e: 'f' });

        indexMapper.insertIndexes(3, 3);

        expect(indexMapper.getIndexesSequence()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
        expect(indexMapper.getNotHiddenIndexes()).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
        // // Next values (indexes) are recounted (re-indexed).
        expect(indexesSequence.getValues()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
        // // Next values are just preserved, they aren't counted again.
        expect(pIndexToValueMap.getValues()).toEqual([2, 3, 4, 5, 6, 7, 5, 6, 7, 8, 9, 10, 11]);
        expect(lPIndexToValueMap.indexedValues).toEqual([null, null, { e: 'f' }, null, null, null, { c: 'd' },
          { a: 'b' }, null, null, null, null, null]);
        expect(lPIndexToValueMap.getValues()).toEqual([{ a: 'b' }, { c: 'd' }, { e: 'f' }]);
        expect(lPIndexToValueMap.orderOfIndexes).toEqual([7, 6, 2]);
        expect(hidingMap.getValues())
          .toEqual([true, true, false, false, false, false, false, false, false, false, false, false, true]);

        indexMapper.unregisterMap('indexesSequence');
        indexMapper.unregisterMap('pIndexToValueMap');
        indexMapper.unregisterMap('lPIndexToValueMap');
        indexMapper.unregisterMap('hidingMap');
      });

      it('should insert indexes properly when all indexes are hidden', () => {
        const indexMapper = new IndexMapper();
        const indexesSequence = new IndexesSequence();
        const pIndexToValueMap = new PIndexToValueMap(index => index + 2);
        const lPIndexToValueMap = new LPIndexToValueMap();
        const hidingMap = new HidingMap();

        indexMapper.registerMap('indexesSequence', indexesSequence);
        indexMapper.registerMap('pIndexToValueMap', pIndexToValueMap);
        indexMapper.registerMap('lPIndexToValueMap', lPIndexToValueMap);
        indexMapper.registerMap('hidingMap', hidingMap);
        indexMapper.initToLength(10);

        hidingMap.setValues([true, true, true, true, true, true, true, true, true, true]);
        lPIndexToValueMap.setValueAtIndex(4, { a: 'b' });
        lPIndexToValueMap.setValueAtIndex(3, { c: 'd' });
        lPIndexToValueMap.setValueAtIndex(2, { e: 'f' });

        indexMapper.insertIndexes(3, 3);

        expect(indexMapper.getIndexesSequence()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
        expect(indexMapper.getNotHiddenIndexes()).toEqual([3, 4, 5]);
        // // Next values (indexes) are recounted (re-indexed).
        expect(indexesSequence.getValues()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
        // // Next values are just preserved, they aren't counted again.
        expect(pIndexToValueMap.getValues()).toEqual([2, 3, 4, 5, 6, 7, 5, 6, 7, 8, 9, 10, 11]);
        expect(lPIndexToValueMap.indexedValues).toEqual([null, null, { e: 'f' }, null, null, null, { c: 'd' },
          { a: 'b' }, null, null, null, null, null]);
        expect(lPIndexToValueMap.getValues()).toEqual([{ a: 'b' }, { c: 'd' }, { e: 'f' }]);
        expect(lPIndexToValueMap.orderOfIndexes).toEqual([7, 6, 2]);
        expect(hidingMap.getValues())
          .toEqual([true, true, true, false, false, false, true, true, true, true, true, true, true]);

        indexMapper.unregisterMap('indexesSequence');
        indexMapper.unregisterMap('pIndexToValueMap');
        indexMapper.unregisterMap('lPIndexToValueMap');
        indexMapper.unregisterMap('hidingMap');
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

    describe('should move indexes properly when there are trimmed indexes', () => {
      it('from the top down to element before trimmed index', () => {
        const indexMapper = new IndexMapper();
        const trimmingMap = new TrimmingMap();

        indexMapper.registerMap('trimmingMap', trimmingMap);
        indexMapper.initToLength(10);
        trimmingMap.setValues([false, false, false, false, true, false, false, false, false, false]);

        indexMapper.moveIndexes([0], 3);

        expect(indexMapper.getIndexesSequence()).toEqual([1, 2, 3, 4, 0, 5, 6, 7, 8, 9]);
        expect(indexMapper.getNotTrimmedIndexes()).toEqual([1, 2, 3, 0, 5, 6, 7, 8, 9]);
      });

      it('from the bottom up to element before trimmed index', () => {
        const indexMapper = new IndexMapper();
        const trimmingMap = new TrimmingMap();

        indexMapper.registerMap('trimmingMap', trimmingMap);
        indexMapper.initToLength(10);
        trimmingMap.setValues([false, false, false, false, true, false, false, false, false, false]);

        indexMapper.moveIndexes([5], 3); // physical index 6, there is one trimmed index before the element.

        expect(indexMapper.getIndexesSequence()).toEqual([0, 1, 2, 6, 3, 4, 5, 7, 8, 9]);
        expect(indexMapper.getNotTrimmedIndexes()).toEqual([0, 1, 2, 6, 3, 5, 7, 8, 9]);
      });

      it('when first few starting indexes are trimmed', () => {
        const indexMapper = new IndexMapper();
        const trimmingMap = new TrimmingMap();

        indexMapper.registerMap('trimmingMap', trimmingMap);
        indexMapper.initToLength(10);
        trimmingMap.setValues([true, true, true, false, false, false, false, false, false, false]);

        indexMapper.moveIndexes([2, 3], 0);

        expect(indexMapper.getIndexesSequence()).toEqual([0, 1, 2, 5, 6, 3, 4, 7, 8, 9]);
        expect(indexMapper.getNotTrimmedIndexes()).toEqual([5, 6, 3, 4, 7, 8, 9]);
      });

      it('when few last indexes are trimmed #1', () => {
        const indexMapper = new IndexMapper();
        const trimmingMap = new TrimmingMap();

        indexMapper.registerMap('trimmingMap', trimmingMap);
        indexMapper.initToLength(10);
        trimmingMap.setValues([false, false, false, false, false, false, false, true, true, true]);

        indexMapper.moveIndexes([0, 1], 5); // Elements will be moved at 5th and 6th position.

        expect(indexMapper.getIndexesSequence()).toEqual([2, 3, 4, 5, 6, 0, 1, 7, 8, 9]);
      });

      it('when few last indexes are trimmed #2', () => {
        const indexMapper = new IndexMapper();
        const trimmingMap = new TrimmingMap();

        indexMapper.registerMap('trimmingMap', trimmingMap);
        indexMapper.initToLength(10);
        trimmingMap.setValues([false, false, false, false, false, false, false, true, true, true]);

        indexMapper.moveIndexes([0, 1], 6); // Elements can't be moved at 6th and 7th position, they will be placed at 5th and 6th position.

        expect(indexMapper.getIndexesSequence()).toEqual([2, 3, 4, 5, 6, 0, 1, 7, 8, 9]);
      });
    });

    it('should move indexes properly when there are hidden indexes', () => {
      const indexMapper = new IndexMapper();
      const hidingMap = new HidingMap();

      indexMapper.registerMap('hidingMap', hidingMap);
      indexMapper.initToLength(10);
      hidingMap.setValues([true, true, true, false, false, false, false, true, true, true]);

      indexMapper.moveIndexes([2, 0], 4);

      expect(hidingMap.getValues()).toEqual([true, true, true, false, false, false, false, true, true, true]);
      expect(indexMapper.getIndexesSequence()).toEqual([1, 3, 4, 5, 2, 0, 6, 7, 8, 9]);
      expect(indexMapper.isHidden(0)).toBe(true);
      expect(indexMapper.isHidden(1)).toBe(true);
      expect(indexMapper.isHidden(2)).toBe(true);
      expect(indexMapper.isHidden(7)).toBe(true);
      expect(indexMapper.isHidden(8)).toBe(true);
      expect(indexMapper.isHidden(9)).toBe(true);

      indexMapper.moveIndexes([6], 0);

      expect(hidingMap.getValues()).toEqual([true, true, true, false, false, false, false, true, true, true]);
      expect(indexMapper.getIndexesSequence()).toEqual([6, 1, 3, 4, 5, 2, 0, 7, 8, 9]);
      expect(indexMapper.isHidden(0)).toBe(true);
      expect(indexMapper.isHidden(1)).toBe(true);
      expect(indexMapper.isHidden(2)).toBe(true);
      expect(indexMapper.isHidden(7)).toBe(true);
      expect(indexMapper.isHidden(8)).toBe(true);
      expect(indexMapper.isHidden(9)).toBe(true);
    });

    it('should move indexes properly when there are hidden and trimmed indexes', () => {
      const indexMapper = new IndexMapper();
      const trimmingMap = new TrimmingMap();
      const hidingMap = new HidingMap();

      indexMapper.registerMap('trimmingMap', trimmingMap);
      indexMapper.registerMap('hidingMap', hidingMap);
      indexMapper.initToLength(10);
      trimmingMap.setValues([true, true, true, false, false, false, false, false, false, true]);
      hidingMap.setValues([false, false, false, true, true, true, false, false, false, false]);

      indexMapper.moveIndexes([2, 0], 3);

      expect(trimmingMap.getValues()).toEqual([true, true, true, false, false, false, false, false, false, true]);
      expect(hidingMap.getValues()).toEqual([false, false, false, true, true, true, false, false, false, false]);
      expect(indexMapper.getIndexesSequence()).toEqual([0, 1, 2, 4, 6, 7, 5, 3, 8, 9]); // Moved indexes: 5, 3
      expect(indexMapper.isTrimmed(0)).toBe(true);
      expect(indexMapper.isTrimmed(1)).toBe(true);
      expect(indexMapper.isTrimmed(2)).toBe(true);
      expect(indexMapper.isTrimmed(9)).toBe(true);
      expect(indexMapper.isHidden(3)).toBe(true);
      expect(indexMapper.isHidden(4)).toBe(true);
      expect(indexMapper.isHidden(5)).toBe(true);

      indexMapper.moveIndexes([5], 0);

      expect(trimmingMap.getValues()).toEqual([true, true, true, false, false, false, false, false, false, true]);
      expect(hidingMap.getValues()).toEqual([false, false, false, true, true, true, false, false, false, false]);
      expect(indexMapper.getIndexesSequence()).toEqual([0, 1, 2, 8, 4, 6, 7, 5, 3, 9]); // Moved index: 8
      expect(indexMapper.isTrimmed(0)).toBe(true);
      expect(indexMapper.isTrimmed(1)).toBe(true);
      expect(indexMapper.isTrimmed(2)).toBe(true);
      expect(indexMapper.isTrimmed(9)).toBe(true);
      expect(indexMapper.isHidden(3)).toBe(true);
      expect(indexMapper.isHidden(4)).toBe(true);
      expect(indexMapper.isHidden(5)).toBe(true);
    });
  });

  describe('cache management', () => {
    it('should reset the cache when `initToLength` function is called', () => {
      const indexMapper = new IndexMapper();
      const cacheUpdatedCallback = jasmine.createSpy('cacheUpdated');
      const notTrimmedIndexesCache = indexMapper.notTrimmedIndexesCache;
      const notHiddenIndexesCache = indexMapper.notHiddenIndexesCache;
      const flattenTrimmingResult = indexMapper.trimmingMapsCollection.mergedValuesCache;
      const flattenHidingResult = indexMapper.hidingMapsCollection.mergedValuesCache;
      const renderablePhysicalIndexesCache = indexMapper.renderablePhysicalIndexesCache;

      indexMapper.addLocalHook('cacheUpdated', cacheUpdatedCallback);

      expect(cacheUpdatedCallback).not.toHaveBeenCalled();

      indexMapper.initToLength(10);

      expect(notTrimmedIndexesCache).not.toBe(indexMapper.notTrimmedIndexesCache);
      expect(notHiddenIndexesCache).not.toBe(indexMapper.notHiddenIndexesCache);
      expect(flattenTrimmingResult).not.toBe(indexMapper.trimmingMapsCollection.mergedValuesCache);
      expect(flattenHidingResult).not.toBe(indexMapper.hidingMapsCollection.mergedValuesCache);
      expect(renderablePhysicalIndexesCache).not.toBe(indexMapper.renderablePhysicalIndexesCache);
      expect(cacheUpdatedCallback.calls.count()).toEqual(1);
    });

    it('should reset the cache when `setIndexesSequence` function is called', () => {
      const indexMapper = new IndexMapper();
      const cacheUpdatedCallback = jasmine.createSpy('cacheUpdated');

      indexMapper.initToLength(10);
      indexMapper.addLocalHook('cacheUpdated', cacheUpdatedCallback);

      const notTrimmedIndexesCache = indexMapper.notTrimmedIndexesCache;
      const notHiddenIndexesCache = indexMapper.notHiddenIndexesCache;
      const flattenTrimmingResult = indexMapper.trimmingMapsCollection.mergedValuesCache;
      const flattenHidingResult = indexMapper.hidingMapsCollection.mergedValuesCache;
      const renderablePhysicalIndexesCache = indexMapper.renderablePhysicalIndexesCache;

      indexMapper.setIndexesSequence([9, 8, 7, 6, 5, 4, 3, 2, 1, 0]);

      expect(notTrimmedIndexesCache).not.toBe(indexMapper.notTrimmedIndexesCache);
      expect(notHiddenIndexesCache).not.toBe(indexMapper.notHiddenIndexesCache);
      expect(flattenTrimmingResult).not.toBe(indexMapper.trimmingMapsCollection.mergedValuesCache);
      expect(flattenHidingResult).not.toBe(indexMapper.hidingMapsCollection.mergedValuesCache);
      expect(renderablePhysicalIndexesCache).not.toBe(indexMapper.renderablePhysicalIndexesCache);
      expect(cacheUpdatedCallback.calls.count()).toEqual(1);
    });

    it('should reset the cache only when the `updateCache` function is called with `force` parameter set to an truthy value', () => {
      // It's internal function responsible for handling batched operation, called often. Just flag set to `true` should reset the cache.
      const indexMapper = new IndexMapper();
      const cacheUpdatedCallback = jasmine.createSpy('cacheUpdated');

      indexMapper.initToLength(10);
      indexMapper.addLocalHook('cacheUpdated', cacheUpdatedCallback);

      const notTrimmedIndexesCache = indexMapper.notTrimmedIndexesCache;
      const notHiddenIndexesCache = indexMapper.notHiddenIndexesCache;
      const flattenTrimmingResult = indexMapper.trimmingMapsCollection.mergedValuesCache;
      const flattenHidingResult = indexMapper.hidingMapsCollection.mergedValuesCache;
      const renderablePhysicalIndexesCache = indexMapper.renderablePhysicalIndexesCache;

      indexMapper.updateCache();

      expect(cacheUpdatedCallback).not.toHaveBeenCalled();
      expect(notTrimmedIndexesCache).toBe(indexMapper.notTrimmedIndexesCache);
      expect(notTrimmedIndexesCache).toEqual(indexMapper.notTrimmedIndexesCache);
      expect(notHiddenIndexesCache).toBe(indexMapper.notHiddenIndexesCache);
      expect(notHiddenIndexesCache).toEqual(indexMapper.notHiddenIndexesCache);
      expect(flattenTrimmingResult).toBe(indexMapper.trimmingMapsCollection.mergedValuesCache);
      expect(flattenTrimmingResult).toEqual(indexMapper.trimmingMapsCollection.mergedValuesCache);
      expect(flattenHidingResult).toBe(indexMapper.hidingMapsCollection.mergedValuesCache);
      expect(flattenHidingResult).toEqual(indexMapper.hidingMapsCollection.mergedValuesCache);
      expect(renderablePhysicalIndexesCache).toBe(indexMapper.renderablePhysicalIndexesCache);
      expect(renderablePhysicalIndexesCache).toEqual(indexMapper.renderablePhysicalIndexesCache);

      indexMapper.updateCache(false);

      expect(cacheUpdatedCallback).not.toHaveBeenCalled();
      expect(notTrimmedIndexesCache).toBe(indexMapper.notTrimmedIndexesCache);
      expect(notTrimmedIndexesCache).toEqual(indexMapper.notTrimmedIndexesCache);
      expect(notHiddenIndexesCache).toBe(indexMapper.notHiddenIndexesCache);
      expect(notHiddenIndexesCache).toEqual(indexMapper.notHiddenIndexesCache);
      expect(flattenTrimmingResult).toBe(indexMapper.trimmingMapsCollection.mergedValuesCache);
      expect(flattenTrimmingResult).toEqual(indexMapper.trimmingMapsCollection.mergedValuesCache);
      expect(flattenHidingResult).toBe(indexMapper.hidingMapsCollection.mergedValuesCache);
      expect(flattenHidingResult).toEqual(indexMapper.hidingMapsCollection.mergedValuesCache);
      expect(renderablePhysicalIndexesCache).toBe(indexMapper.renderablePhysicalIndexesCache);
      expect(renderablePhysicalIndexesCache).toEqual(indexMapper.renderablePhysicalIndexesCache);

      indexMapper.updateCache(true);

      expect(cacheUpdatedCallback).toHaveBeenCalled();
      expect(notTrimmedIndexesCache).not.toBe(indexMapper.notTrimmedIndexesCache);
      expect(notHiddenIndexesCache).not.toBe(indexMapper.notHiddenIndexesCache);
      expect(flattenTrimmingResult).not.toBe(indexMapper.trimmingMapsCollection.mergedValuesCache);
      expect(flattenHidingResult).not.toBe(indexMapper.hidingMapsCollection.mergedValuesCache);
      expect(renderablePhysicalIndexesCache).not.toBe(indexMapper.renderablePhysicalIndexesCache);
    });

    it('should reset caches when any registered `TrimmingMap` is changed', () => {
      const indexMapper = new IndexMapper();
      const trimmingMap1 = new TrimmingMap();
      const trimmingMap2 = new TrimmingMap();
      const cacheUpdatedCallback = jasmine.createSpy('cacheUpdated');

      indexMapper.registerMap('trimmingMap1', trimmingMap1);
      indexMapper.registerMap('trimmingMap2', trimmingMap2);
      indexMapper.initToLength(10);

      let notTrimmedIndexesCache = indexMapper.notTrimmedIndexesCache;
      let notHiddenIndexesCache = indexMapper.notHiddenIndexesCache;
      let flattenTrimmingResult = indexMapper.trimmingMapsCollection.mergedValuesCache;
      let flattenHidingResult = indexMapper.hidingMapsCollection.mergedValuesCache;
      let renderablePhysicalIndexesCache = indexMapper.renderablePhysicalIndexesCache;

      indexMapper.addLocalHook('cacheUpdated', cacheUpdatedCallback);

      trimmingMap1.setValues([false, false, false, false, false, false, false, true, true, true]);
      trimmingMap2.setValues([false, false, false, false, false, false, false, true, true, true]);

      expect(notTrimmedIndexesCache).not.toBe(indexMapper.notTrimmedIndexesCache);
      expect(flattenTrimmingResult).not.toBe(indexMapper.trimmingMapsCollection.mergedValuesCache);
      expect(cacheUpdatedCallback.calls.count()).toEqual(2);

      notTrimmedIndexesCache = indexMapper.notTrimmedIndexesCache;
      notHiddenIndexesCache = indexMapper.notHiddenIndexesCache;
      flattenTrimmingResult = indexMapper.trimmingMapsCollection.mergedValuesCache;
      flattenHidingResult = indexMapper.hidingMapsCollection.mergedValuesCache;
      renderablePhysicalIndexesCache = indexMapper.renderablePhysicalIndexesCache;

      trimmingMap1.setValueAtIndex(0, false);

      // Actions on the first collection. No real change. We rebuild cache anyway (`change` hook should be called?).
      expect(notTrimmedIndexesCache).not.toBe(indexMapper.notTrimmedIndexesCache);
      expect(notTrimmedIndexesCache).toEqual(indexMapper.notTrimmedIndexesCache);
      expect(notHiddenIndexesCache).not.toBe(indexMapper.notHiddenIndexesCache);
      expect(notHiddenIndexesCache).toEqual(indexMapper.notHiddenIndexesCache);
      expect(flattenTrimmingResult).not.toBe(indexMapper.trimmingMapsCollection.mergedValuesCache);
      expect(flattenTrimmingResult).toEqual(indexMapper.trimmingMapsCollection.mergedValuesCache);
      expect(flattenHidingResult).not.toBe(indexMapper.hidingMapsCollection.mergedValuesCache);
      expect(flattenHidingResult).toEqual(indexMapper.hidingMapsCollection.mergedValuesCache);
      expect(renderablePhysicalIndexesCache).not.toBe(indexMapper.renderablePhysicalIndexesCache);
      expect(renderablePhysicalIndexesCache).toEqual(indexMapper.renderablePhysicalIndexesCache);

      expect(flattenTrimmingResult.length).toBe(10);
      expect(flattenHidingResult.length).toBe(0);
      expect(cacheUpdatedCallback.calls.count()).toEqual(3);

      notTrimmedIndexesCache = indexMapper.notTrimmedIndexesCache;
      notHiddenIndexesCache = indexMapper.notHiddenIndexesCache;
      flattenTrimmingResult = indexMapper.trimmingMapsCollection.mergedValuesCache;
      flattenHidingResult = indexMapper.hidingMapsCollection.mergedValuesCache;
      renderablePhysicalIndexesCache = indexMapper.renderablePhysicalIndexesCache;

      trimmingMap1.setValueAtIndex(0, true);

      expect(notTrimmedIndexesCache).not.toBe(indexMapper.notTrimmedIndexesCache);
      expect(notHiddenIndexesCache).not.toBe(indexMapper.notHiddenIndexesCache);
      expect(flattenTrimmingResult).not.toBe(indexMapper.trimmingMapsCollection.mergedValuesCache);
      expect(flattenHidingResult).not.toBe(indexMapper.hidingMapsCollection.mergedValuesCache);
      expect(renderablePhysicalIndexesCache).not.toBe(indexMapper.renderablePhysicalIndexesCache);

      expect(flattenTrimmingResult.length).toBe(10);
      expect(flattenHidingResult.length).toBe(0);
      expect(cacheUpdatedCallback.calls.count()).toEqual(4);

      notTrimmedIndexesCache = indexMapper.notTrimmedIndexesCache;
      notHiddenIndexesCache = indexMapper.notHiddenIndexesCache;
      flattenTrimmingResult = indexMapper.trimmingMapsCollection.mergedValuesCache;
      flattenHidingResult = indexMapper.hidingMapsCollection.mergedValuesCache;
      renderablePhysicalIndexesCache = indexMapper.renderablePhysicalIndexesCache;

      trimmingMap1.setValueAtIndex(0, false);

      expect(notTrimmedIndexesCache).not.toBe(indexMapper.notTrimmedIndexesCache);
      expect(notHiddenIndexesCache).not.toBe(indexMapper.notHiddenIndexesCache);
      expect(flattenTrimmingResult).not.toBe(indexMapper.trimmingMapsCollection.mergedValuesCache);
      expect(flattenHidingResult).not.toBe(indexMapper.hidingMapsCollection.mergedValuesCache);
      expect(renderablePhysicalIndexesCache).not.toBe(indexMapper.renderablePhysicalIndexesCache);

      expect(flattenTrimmingResult.length).toBe(10);
      expect(flattenHidingResult.length).toBe(0);
      expect(cacheUpdatedCallback.calls.count()).toEqual(5);

      notTrimmedIndexesCache = indexMapper.notTrimmedIndexesCache;
      notHiddenIndexesCache = indexMapper.notHiddenIndexesCache;
      flattenTrimmingResult = indexMapper.trimmingMapsCollection.mergedValuesCache;
      flattenHidingResult = indexMapper.hidingMapsCollection.mergedValuesCache;
      renderablePhysicalIndexesCache = indexMapper.renderablePhysicalIndexesCache;

      trimmingMap2.setValueAtIndex(0, false);

      // Actions on the second collection. No real change.  We rebuild cache anyway (`change` hook should be called?).
      expect(notTrimmedIndexesCache).not.toBe(indexMapper.notTrimmedIndexesCache);
      expect(notTrimmedIndexesCache).toEqual(indexMapper.notTrimmedIndexesCache);
      expect(notHiddenIndexesCache).not.toBe(indexMapper.notHiddenIndexesCache);
      expect(notHiddenIndexesCache).toEqual(indexMapper.notHiddenIndexesCache);
      expect(flattenTrimmingResult).not.toBe(indexMapper.trimmingMapsCollection.mergedValuesCache);
      expect(flattenTrimmingResult).toEqual(indexMapper.trimmingMapsCollection.mergedValuesCache);
      expect(flattenHidingResult).not.toBe(indexMapper.hidingMapsCollection.mergedValuesCache);
      expect(flattenHidingResult).toEqual(indexMapper.hidingMapsCollection.mergedValuesCache);
      expect(renderablePhysicalIndexesCache).not.toBe(indexMapper.renderablePhysicalIndexesCache);
      expect(renderablePhysicalIndexesCache).toEqual(indexMapper.renderablePhysicalIndexesCache);

      expect(flattenTrimmingResult.length).toBe(10);
      expect(flattenHidingResult.length).toBe(0);
      expect(cacheUpdatedCallback.calls.count()).toEqual(6);

      trimmingMap2.setValueAtIndex(0, true);

      expect(notTrimmedIndexesCache).not.toBe(indexMapper.notTrimmedIndexesCache);
      expect(notHiddenIndexesCache).not.toBe(indexMapper.notHiddenIndexesCache);
      expect(flattenTrimmingResult).not.toBe(indexMapper.trimmingMapsCollection.mergedValuesCache);
      expect(flattenHidingResult).not.toBe(indexMapper.hidingMapsCollection.mergedValuesCache);
      expect(renderablePhysicalIndexesCache).not.toBe(indexMapper.renderablePhysicalIndexesCache);

      expect(flattenTrimmingResult.length).toBe(10);
      expect(flattenHidingResult.length).toBe(0);
      expect(cacheUpdatedCallback.calls.count()).toEqual(7);

      notTrimmedIndexesCache = indexMapper.notTrimmedIndexesCache;
      notHiddenIndexesCache = indexMapper.notHiddenIndexesCache;
      flattenTrimmingResult = indexMapper.trimmingMapsCollection.mergedValuesCache;
      flattenHidingResult = indexMapper.hidingMapsCollection.mergedValuesCache;
      renderablePhysicalIndexesCache = indexMapper.renderablePhysicalIndexesCache;

      trimmingMap2.setValueAtIndex(0, false);

      expect(notTrimmedIndexesCache).not.toBe(indexMapper.notTrimmedIndexesCache);
      expect(notHiddenIndexesCache).not.toBe(indexMapper.notHiddenIndexesCache);
      expect(flattenTrimmingResult).not.toBe(indexMapper.trimmingMapsCollection.mergedValuesCache);
      expect(flattenHidingResult).not.toBe(indexMapper.hidingMapsCollection.mergedValuesCache);
      expect(renderablePhysicalIndexesCache).not.toBe(indexMapper.renderablePhysicalIndexesCache);

      expect(flattenTrimmingResult.length).toBe(10);
      expect(flattenHidingResult.length).toBe(0);
      expect(cacheUpdatedCallback.calls.count()).toEqual(8);
    });

    it('should reset caches when any registered `HidingMap` is changed', () => {
      const indexMapper = new IndexMapper();
      const hidingMap1 = new HidingMap();
      const hidingMap2 = new HidingMap();
      const cacheUpdatedCallback = jasmine.createSpy('cacheUpdated');

      indexMapper.registerMap('hidingMap1', hidingMap1);
      indexMapper.registerMap('hidingMap2', hidingMap2);
      indexMapper.initToLength(10);

      let notTrimmedIndexesCache = indexMapper.notTrimmedIndexesCache;
      let notHiddenIndexesCache = indexMapper.notHiddenIndexesCache;
      let flattenTrimmingResult = indexMapper.trimmingMapsCollection.mergedValuesCache;
      let flattenHidingResult = indexMapper.hidingMapsCollection.mergedValuesCache;
      let renderablePhysicalIndexesCache = indexMapper.renderablePhysicalIndexesCache;

      indexMapper.addLocalHook('cacheUpdated', cacheUpdatedCallback);

      hidingMap1.setValues([false, false, false, false, false, false, false, true, true, true]);
      hidingMap2.setValues([false, false, false, false, false, false, false, true, true, true]);

      expect(notTrimmedIndexesCache).not.toBe(indexMapper.notTrimmedIndexesCache);
      expect(flattenTrimmingResult).not.toBe(indexMapper.trimmingMapsCollection.mergedValuesCache);
      expect(cacheUpdatedCallback.calls.count()).toEqual(2);

      notTrimmedIndexesCache = indexMapper.notTrimmedIndexesCache;
      notHiddenIndexesCache = indexMapper.notHiddenIndexesCache;
      flattenTrimmingResult = indexMapper.trimmingMapsCollection.mergedValuesCache;
      flattenHidingResult = indexMapper.hidingMapsCollection.mergedValuesCache;
      renderablePhysicalIndexesCache = indexMapper.renderablePhysicalIndexesCache;

      hidingMap1.setValueAtIndex(0, false);

      // Actions on the first collection. No real change. We rebuild cache anyway (`change` hook should be called?).
      expect(notTrimmedIndexesCache).not.toBe(indexMapper.notTrimmedIndexesCache);
      expect(notTrimmedIndexesCache).toEqual(indexMapper.notTrimmedIndexesCache);
      expect(notHiddenIndexesCache).not.toBe(indexMapper.notHiddenIndexesCache);
      expect(notHiddenIndexesCache).toEqual(indexMapper.notHiddenIndexesCache);
      expect(flattenTrimmingResult).not.toBe(indexMapper.trimmingMapsCollection.mergedValuesCache);
      expect(flattenTrimmingResult).toEqual(indexMapper.trimmingMapsCollection.mergedValuesCache);
      expect(flattenHidingResult).not.toBe(indexMapper.hidingMapsCollection.mergedValuesCache);
      expect(flattenHidingResult).toEqual(indexMapper.hidingMapsCollection.mergedValuesCache);
      expect(renderablePhysicalIndexesCache).not.toBe(indexMapper.renderablePhysicalIndexesCache);
      expect(renderablePhysicalIndexesCache).toEqual(indexMapper.renderablePhysicalIndexesCache);

      expect(flattenTrimmingResult.length).toBe(0);
      expect(flattenHidingResult.length).toBe(10);
      expect(cacheUpdatedCallback.calls.count()).toEqual(3);

      notTrimmedIndexesCache = indexMapper.notTrimmedIndexesCache;
      notHiddenIndexesCache = indexMapper.notHiddenIndexesCache;
      flattenTrimmingResult = indexMapper.trimmingMapsCollection.mergedValuesCache;
      flattenHidingResult = indexMapper.hidingMapsCollection.mergedValuesCache;
      renderablePhysicalIndexesCache = indexMapper.renderablePhysicalIndexesCache;

      hidingMap1.setValueAtIndex(0, true);

      expect(notTrimmedIndexesCache).not.toBe(indexMapper.notTrimmedIndexesCache);
      expect(notHiddenIndexesCache).not.toBe(indexMapper.notHiddenIndexesCache);
      expect(flattenTrimmingResult).not.toBe(indexMapper.trimmingMapsCollection.mergedValuesCache);
      expect(flattenHidingResult).not.toBe(indexMapper.hidingMapsCollection.mergedValuesCache);
      expect(renderablePhysicalIndexesCache).not.toBe(indexMapper.renderablePhysicalIndexesCache);

      expect(flattenTrimmingResult.length).toBe(0);
      expect(flattenHidingResult.length).toBe(10);
      expect(cacheUpdatedCallback.calls.count()).toEqual(4);

      notTrimmedIndexesCache = indexMapper.notTrimmedIndexesCache;
      notHiddenIndexesCache = indexMapper.notHiddenIndexesCache;
      flattenTrimmingResult = indexMapper.trimmingMapsCollection.mergedValuesCache;
      flattenHidingResult = indexMapper.hidingMapsCollection.mergedValuesCache;
      renderablePhysicalIndexesCache = indexMapper.renderablePhysicalIndexesCache;

      hidingMap1.setValueAtIndex(0, false);

      expect(notTrimmedIndexesCache).not.toBe(indexMapper.notTrimmedIndexesCache);
      expect(notHiddenIndexesCache).not.toBe(indexMapper.notHiddenIndexesCache);
      expect(flattenTrimmingResult).not.toBe(indexMapper.trimmingMapsCollection.mergedValuesCache);
      expect(flattenHidingResult).not.toBe(indexMapper.hidingMapsCollection.mergedValuesCache);
      expect(renderablePhysicalIndexesCache).not.toBe(indexMapper.renderablePhysicalIndexesCache);

      expect(flattenTrimmingResult.length).toBe(0);
      expect(flattenHidingResult.length).toBe(10);
      expect(cacheUpdatedCallback.calls.count()).toEqual(5);

      notTrimmedIndexesCache = indexMapper.notTrimmedIndexesCache;
      notHiddenIndexesCache = indexMapper.notHiddenIndexesCache;
      flattenTrimmingResult = indexMapper.trimmingMapsCollection.mergedValuesCache;
      flattenHidingResult = indexMapper.hidingMapsCollection.mergedValuesCache;
      renderablePhysicalIndexesCache = indexMapper.renderablePhysicalIndexesCache;

      hidingMap2.setValueAtIndex(0, false);

      // Actions on the second collection. No real change.  We rebuild cache anyway (`change` hook should be called?).
      expect(notTrimmedIndexesCache).not.toBe(indexMapper.notTrimmedIndexesCache);
      expect(notTrimmedIndexesCache).toEqual(indexMapper.notTrimmedIndexesCache);
      expect(notHiddenIndexesCache).not.toBe(indexMapper.notHiddenIndexesCache);
      expect(notHiddenIndexesCache).toEqual(indexMapper.notHiddenIndexesCache);
      expect(flattenTrimmingResult).not.toBe(indexMapper.trimmingMapsCollection.mergedValuesCache);
      expect(flattenTrimmingResult).toEqual(indexMapper.trimmingMapsCollection.mergedValuesCache);
      expect(flattenHidingResult).not.toBe(indexMapper.hidingMapsCollection.mergedValuesCache);
      expect(flattenHidingResult).toEqual(indexMapper.hidingMapsCollection.mergedValuesCache);
      expect(renderablePhysicalIndexesCache).not.toBe(indexMapper.renderablePhysicalIndexesCache);
      expect(renderablePhysicalIndexesCache).toEqual(indexMapper.renderablePhysicalIndexesCache);

      expect(flattenTrimmingResult.length).toBe(0);
      expect(flattenHidingResult.length).toBe(10);
      expect(cacheUpdatedCallback.calls.count()).toEqual(6);

      hidingMap2.setValueAtIndex(0, true);

      expect(notTrimmedIndexesCache).not.toBe(indexMapper.notTrimmedIndexesCache);
      expect(notHiddenIndexesCache).not.toBe(indexMapper.notHiddenIndexesCache);
      expect(flattenTrimmingResult).not.toBe(indexMapper.trimmingMapsCollection.mergedValuesCache);
      expect(flattenHidingResult).not.toBe(indexMapper.hidingMapsCollection.mergedValuesCache);
      expect(renderablePhysicalIndexesCache).not.toBe(indexMapper.renderablePhysicalIndexesCache);

      expect(flattenTrimmingResult.length).toBe(0);
      expect(flattenHidingResult.length).toBe(10);
      expect(cacheUpdatedCallback.calls.count()).toEqual(7);

      notTrimmedIndexesCache = indexMapper.notTrimmedIndexesCache;
      notHiddenIndexesCache = indexMapper.notHiddenIndexesCache;
      flattenTrimmingResult = indexMapper.trimmingMapsCollection.mergedValuesCache;
      flattenHidingResult = indexMapper.hidingMapsCollection.mergedValuesCache;
      renderablePhysicalIndexesCache = indexMapper.renderablePhysicalIndexesCache;

      hidingMap2.setValueAtIndex(0, false);

      expect(notTrimmedIndexesCache).not.toBe(indexMapper.notTrimmedIndexesCache);
      expect(notHiddenIndexesCache).not.toBe(indexMapper.notHiddenIndexesCache);
      expect(flattenTrimmingResult).not.toBe(indexMapper.trimmingMapsCollection.mergedValuesCache);
      expect(flattenHidingResult).not.toBe(indexMapper.hidingMapsCollection.mergedValuesCache);
      expect(renderablePhysicalIndexesCache).not.toBe(indexMapper.renderablePhysicalIndexesCache);

      expect(flattenTrimmingResult.length).toBe(0);
      expect(flattenHidingResult.length).toBe(10);
      expect(cacheUpdatedCallback.calls.count()).toEqual(8);
    });

    it('should not reset cache when any registered map inside various mappings collection is changed', () => {
      const indexMapper = new IndexMapper();
      const valueMap1 = new PIndexToValueMap();
      const valueMap2 = new PIndexToValueMap();
      const cacheUpdatedCallback = jasmine.createSpy('cacheUpdated');

      indexMapper.registerMap('valueMap1', valueMap1);
      indexMapper.registerMap('valueMap2', valueMap2);
      indexMapper.initToLength(10);

      const notTrimmedIndexesCache = indexMapper.notTrimmedIndexesCache;
      const notHiddenIndexesCache = indexMapper.notHiddenIndexesCache;
      const flattenTrimmingResult = indexMapper.trimmingMapsCollection.mergedValuesCache;
      const flattenHidingResult = indexMapper.hidingMapsCollection.mergedValuesCache;
      const renderablePhysicalIndexesCache = indexMapper.renderablePhysicalIndexesCache;

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

      expect(notTrimmedIndexesCache).toBe(indexMapper.notTrimmedIndexesCache);
      expect(notTrimmedIndexesCache).toEqual(indexMapper.notTrimmedIndexesCache);
      expect(notHiddenIndexesCache).toBe(indexMapper.notHiddenIndexesCache);
      expect(notHiddenIndexesCache).toEqual(indexMapper.notHiddenIndexesCache);
      expect(flattenTrimmingResult).toBe(indexMapper.trimmingMapsCollection.mergedValuesCache);
      expect(flattenTrimmingResult).toEqual(indexMapper.trimmingMapsCollection.mergedValuesCache);
      expect(flattenHidingResult).toBe(indexMapper.hidingMapsCollection.mergedValuesCache);
      expect(flattenHidingResult).toEqual(indexMapper.hidingMapsCollection.mergedValuesCache);
      expect(renderablePhysicalIndexesCache).toBe(indexMapper.renderablePhysicalIndexesCache);
      expect(renderablePhysicalIndexesCache).toEqual(indexMapper.renderablePhysicalIndexesCache);
    });

    it('should update cache only once when used the `suspendOperations` function', () => {
      const indexMapper1 = new IndexMapper();
      const indexMapper2 = new IndexMapper();
      const cacheUpdatedCallback1 = jasmine.createSpy('cacheUpdated');
      const cacheUpdatedCallback2 = jasmine.createSpy('cacheUpdated');

      indexMapper1.initToLength(10);
      indexMapper2.initToLength(10);
      indexMapper1.addLocalHook('cacheUpdated', cacheUpdatedCallback1);
      indexMapper2.addLocalHook('cacheUpdated', cacheUpdatedCallback2);

      const notTrimmedIndexesCache1 = indexMapper1.notTrimmedIndexesCache;
      const notTrimmedIndexesCache2 = indexMapper2.notTrimmedIndexesCache;
      const notHiddenIndexesCache1 = indexMapper1.notHiddenIndexesCache;
      const notHiddenIndexesCache2 = indexMapper2.notHiddenIndexesCache;
      const flattenTrimmingResult1 = indexMapper1.trimmingMapsCollection.mergedValuesCache;
      const flattenTrimmingResult2 = indexMapper2.trimmingMapsCollection.mergedValuesCache;
      const flattenHidingResult1 = indexMapper1.hidingMapsCollection.mergedValuesCache;
      const flattenHidingResult2 = indexMapper2.hidingMapsCollection.mergedValuesCache;
      const renderablePhysicalIndexesCache1 = indexMapper1.renderablePhysicalIndexesCache;
      const renderablePhysicalIndexesCache2 = indexMapper2.renderablePhysicalIndexesCache;

      indexMapper1.suspendOperations();
      indexMapper1.setIndexesSequence([9, 8, 7, 6, 5, 4, 3, 2, 1, 0]);
      indexMapper1.setIndexesSequence([0, 1, 2, 3, 4, 9, 8, 7, 6, 5]);
      indexMapper1.setIndexesSequence([9, 8, 7, 6, 0, 1, 2, 3, 4, 5]);
      indexMapper1.resumeOperations();

      expect(notTrimmedIndexesCache1).not.toBe(indexMapper1.notTrimmedIndexesCache);
      expect(notHiddenIndexesCache1).not.toBe(indexMapper1.notHiddenIndexesCache);
      expect(flattenTrimmingResult1).not.toBe(indexMapper1.trimmingMapsCollection.mergedValuesCache);
      expect(flattenHidingResult1).not.toBe(indexMapper1.hidingMapsCollection.mergedValuesCache);
      expect(renderablePhysicalIndexesCache1).not.toBe(indexMapper1.renderablePhysicalIndexesCache);
      expect(cacheUpdatedCallback1.calls.count()).toEqual(1);

      expect(notTrimmedIndexesCache2).toBe(indexMapper2.notTrimmedIndexesCache);
      expect(notTrimmedIndexesCache2).toEqual(indexMapper2.notTrimmedIndexesCache);
      expect(notHiddenIndexesCache2).toBe(indexMapper2.notHiddenIndexesCache);
      expect(notHiddenIndexesCache2).toEqual(indexMapper2.notHiddenIndexesCache);
      expect(flattenTrimmingResult2).toBe(indexMapper2.trimmingMapsCollection.mergedValuesCache);
      expect(flattenTrimmingResult2).toEqual(indexMapper2.trimmingMapsCollection.mergedValuesCache);
      expect(flattenHidingResult2).toBe(indexMapper2.hidingMapsCollection.mergedValuesCache);
      expect(flattenHidingResult2).toEqual(indexMapper2.hidingMapsCollection.mergedValuesCache);
      expect(renderablePhysicalIndexesCache2).toBe(indexMapper2.renderablePhysicalIndexesCache);
      expect(renderablePhysicalIndexesCache2).toEqual(indexMapper2.renderablePhysicalIndexesCache);
      expect(cacheUpdatedCallback2).not.toHaveBeenCalled();
    });

    it('should update cache only once when used the `moveIndexes` function', () => {
      const indexMapper = new IndexMapper();

      indexMapper.initToLength(10);

      const cacheUpdatedCallback = jasmine.createSpy('cacheUpdated');
      const notTrimmedIndexesCache = indexMapper.notTrimmedIndexesCache;
      const notHiddenIndexesCache = indexMapper.notHiddenIndexesCache;
      const flattenTrimmingResult = indexMapper.trimmingMapsCollection.mergedValuesCache;
      const flattenHidingResult = indexMapper.hidingMapsCollection.mergedValuesCache;
      const renderablePhysicalIndexesCache = indexMapper.renderablePhysicalIndexesCache;

      indexMapper.addLocalHook('cacheUpdated', cacheUpdatedCallback);
      indexMapper.moveIndexes([3, 4, 5, 6], 0);

      expect(notTrimmedIndexesCache).not.toBe(indexMapper.notTrimmedIndexesCache);
      expect(notHiddenIndexesCache).not.toBe(indexMapper.notHiddenIndexesCache);
      expect(flattenTrimmingResult).not.toBe(indexMapper.trimmingMapsCollection.mergedValuesCache);
      expect(flattenHidingResult).not.toBe(indexMapper.hidingMapsCollection.mergedValuesCache);
      expect(renderablePhysicalIndexesCache).not.toBe(indexMapper.renderablePhysicalIndexesCache);
      expect(cacheUpdatedCallback.calls.count()).toEqual(1);
    });

    it('should update cache only once when used the `insertIndexes` function', () => {
      const indexMapper = new IndexMapper();

      indexMapper.initToLength(10);

      const cacheUpdatedCallback = jasmine.createSpy('cacheUpdated');
      const notTrimmedIndexesCache = indexMapper.notTrimmedIndexesCache;
      const notHiddenIndexesCache = indexMapper.notHiddenIndexesCache;
      const flattenTrimmingResult = indexMapper.trimmingMapsCollection.mergedValuesCache;
      const flattenHidingResult = indexMapper.hidingMapsCollection.mergedValuesCache;
      const renderablePhysicalIndexesCache = indexMapper.renderablePhysicalIndexesCache;

      indexMapper.addLocalHook('cacheUpdated', cacheUpdatedCallback);
      indexMapper.insertIndexes(0, 5);

      expect(notTrimmedIndexesCache).not.toBe(indexMapper.notTrimmedIndexesCache);
      expect(notHiddenIndexesCache).not.toBe(indexMapper.notHiddenIndexesCache);
      expect(flattenTrimmingResult).not.toBe(indexMapper.trimmingMapsCollection.mergedValuesCache);
      expect(flattenHidingResult).not.toBe(indexMapper.hidingMapsCollection.mergedValuesCache);
      expect(renderablePhysicalIndexesCache).not.toBe(indexMapper.renderablePhysicalIndexesCache);
      expect(cacheUpdatedCallback.calls.count()).toEqual(1);
    });

    it('should update cache only once when used the `removeIndexes` function', () => {
      const indexMapper = new IndexMapper();

      indexMapper.initToLength(10);

      const cacheUpdatedCallback = jasmine.createSpy('cacheUpdated');
      const notTrimmedIndexesCache = indexMapper.notTrimmedIndexesCache;
      const notHiddenIndexesCache = indexMapper.notHiddenIndexesCache;
      const flattenTrimmingResult = indexMapper.trimmingMapsCollection.mergedValuesCache;
      const flattenHidingResult = indexMapper.hidingMapsCollection.mergedValuesCache;
      const renderablePhysicalIndexesCache = indexMapper.renderablePhysicalIndexesCache;

      indexMapper.addLocalHook('cacheUpdated', cacheUpdatedCallback);
      indexMapper.removeIndexes([0, 1, 2]);

      expect(notTrimmedIndexesCache).not.toBe(indexMapper.notTrimmedIndexesCache);
      expect(notHiddenIndexesCache).not.toBe(indexMapper.notHiddenIndexesCache);
      expect(flattenTrimmingResult).not.toBe(indexMapper.trimmingMapsCollection.mergedValuesCache);
      expect(flattenHidingResult).not.toBe(indexMapper.hidingMapsCollection.mergedValuesCache);
      expect(renderablePhysicalIndexesCache).not.toBe(indexMapper.renderablePhysicalIndexesCache);
      expect(cacheUpdatedCallback.calls.count()).toEqual(1);
    });
  });
});
