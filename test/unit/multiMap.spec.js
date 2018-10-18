import MultiMap from 'handsontable/multiMap';

describe('MultiMap', () => {

  beforeEach(function() {
    this.multiMap = new MultiMap();
  });

  afterEach(function() {
    delete this.multiMap;
  });

  it('should use string as key', function() {
    this.multiMap.set('foo', 'bar');

    expect(this.multiMap.get('foo')).toEqual('bar');
  });

  it('should use integer as key', function() {
    this.multiMap.set(1, 'bar');

    expect(this.multiMap.get(1)).toEqual('bar');
  });

  it('should use integer as key', function() {
    this.multiMap.set(1.2, 'bar');

    expect(this.multiMap.get(1.2)).toEqual('bar');
    expect(this.multiMap.get(1.3)).toBeUndefined();
  });

  it('should use plain object as key', function() {
    const keyObj1 = {};
    const keyObj2 = {};

    this.multiMap.set(keyObj1, 'bar');

    expect(this.multiMap.get(keyObj1)).toEqual('bar');
    expect(this.multiMap.get(keyObj2)).toBeUndefined();
  });

  it('should use array as key', function() {
    const keyArray1 = [];
    const keyArray2 = [];

    this.multiMap.set(keyArray1, 'bar');

    expect(this.multiMap.get(keyArray1)).toEqual('bar');
    expect(this.multiMap.get(keyArray2)).toBeUndefined();
  });

  it('should use regexp as key', function() {
    const keyRegexp1 = /test/;
    const keyRegexp2 = /test/;

    this.multiMap.set(keyRegexp1, 'bar');

    expect(this.multiMap.get(keyRegexp1)).toEqual('bar');
    expect(this.multiMap.get(keyRegexp2)).toBeUndefined();
  });

  it('should not use boolean as key', () => {
    const tryToSetBooleanKey = function() {
      this.multiMap.set(false, 'bar');
    };

    expect(tryToSetBooleanKey).toThrow();
  });

  it('should not set null as key', () => {
    const tryToSetNullKey = function() {
      this.multiMap.set(null, 'bar');
    };

    expect(tryToSetNullKey).toThrow();
  });

  it('should not set undefined as key', () => {
    const tryToSetUndefinedKey = function() {
      this.multiMap.set(undefined, 'bar');
    };

    expect(tryToSetUndefinedKey).toThrow();
  });

  it('should not set NaN as key', () => {
    const tryToSetNaNKey = function() {
      this.multiMap.set(NaN, 'bar');
    };

    expect(tryToSetNaNKey).toThrow();
  });
});
