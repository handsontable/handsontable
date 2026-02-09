import {
  createIndexMap,
  HidingMap,
  IndexMap,
  LinkedPhysicalIndexToValueMap,
  PhysicalIndexToValueMap,
  TrimmingMap,
} from 'handsontable/translations/maps';

describe('createIndexMap', () => {
  it('should throw an error when not supported map type is passed', () => {
    expect(() => {
      createIndexMap('hidding2');
    }).toThrowError('The provided map type ("hidding2") does not exist.');
  });

  it('should create and return a new index map by its type', () => {
    const hidingMap = createIndexMap('hiding');
    const indexMap = createIndexMap('index');
    const linkedPhysicalIndexToValueMap = createIndexMap('linkedPhysicalIndexToValue');
    const physicalIndexToValueMap = createIndexMap('physicalIndexToValue');
    const trimmingMap = createIndexMap('trimming');

    expect(hidingMap).toBeInstanceOf(HidingMap);
    expect(indexMap).toBeInstanceOf(IndexMap);
    expect(linkedPhysicalIndexToValueMap).toBeInstanceOf(LinkedPhysicalIndexToValueMap);
    expect(physicalIndexToValueMap).toBeInstanceOf(PhysicalIndexToValueMap);
    expect(trimmingMap).toBeInstanceOf(TrimmingMap);
  });

  it('should create a new index map by its type and set default initial values', () => {
    const hidingMap = createIndexMap('hiding', 'initial');
    const indexMap = createIndexMap('index', 'initial');
    const linkedPhysicalIndexToValueMap = createIndexMap('linkedPhysicalIndexToValue', 'initial');
    const physicalIndexToValueMap = createIndexMap('physicalIndexToValue', 'initial');
    const trimmingMap = createIndexMap('trimming', 'initial');

    expect(hidingMap.initValueOrFn).toBe('initial');
    expect(indexMap.initValueOrFn).toBe('initial');
    expect(linkedPhysicalIndexToValueMap.initValueOrFn).toBe('initial');
    expect(physicalIndexToValueMap.initValueOrFn).toBe('initial');
    expect(trimmingMap.initValueOrFn).toBe('initial');
  });
});
