import MultiMap from 'handsontable/multiMap';

describe('MultiMap', () => {
  let multiMap;

  beforeEach(() => {
    multiMap = new MultiMap();
  });

  afterEach(() => {
    multiMap = null;
  });

  it('should use string as key', () => {
    multiMap.set('foo', 'bar');

    expect(multiMap.get('foo')).toEqual('bar');
  });

  it('should use integer as key', () => {
    multiMap.set(1, 'bar');

    expect(multiMap.get(1)).toEqual('bar');
  });

  it('should use integer as key', () => {
    multiMap.set(1.2, 'bar');

    expect(multiMap.get(1.2)).toEqual('bar');
    expect(multiMap.get(1.3)).toBeUndefined();
  });

  it('should use plain object as key', () => {
    const keyObj1 = {};
    const keyObj2 = {};

    multiMap.set(keyObj1, 'bar');

    expect(multiMap.get(keyObj1)).toEqual('bar');
    expect(multiMap.get(keyObj2)).toBeUndefined();
  });

  it('should use array as key', () => {
    const keyArray1 = [];
    const keyArray2 = [];

    multiMap.set(keyArray1, 'bar');

    expect(multiMap.get(keyArray1)).toEqual('bar');
    expect(multiMap.get(keyArray2)).toBeUndefined();
  });

  it('should use regexp as key', () => {
    const keyRegexp1 = /test/;
    const keyRegexp2 = /test/;

    multiMap.set(keyRegexp1, 'bar');

    expect(multiMap.get(keyRegexp1)).toEqual('bar');
    expect(multiMap.get(keyRegexp2)).toBeUndefined();
  });

  it('should not use boolean as key', () => {
    const tryToSetBooleanKey = function() {
      multiMap.set(false, 'bar');
    };

    expect(tryToSetBooleanKey).toThrow();
  });

  it('should not set null as key', () => {
    const tryToSetNullKey = function() {
      multiMap.set(null, 'bar');
    };

    expect(tryToSetNullKey).toThrow();
  });

  it('should not set undefined as key', () => {
    const tryToSetUndefinedKey = function() {
      multiMap.set(undefined, 'bar');
    };

    expect(tryToSetUndefinedKey).toThrow();
  });

  it('should not set NaN as key', () => {
    const tryToSetNaNKey = function() {
      multiMap.set(NaN, 'bar');
    };

    expect(tryToSetNaNKey).toThrow();
  });
});
