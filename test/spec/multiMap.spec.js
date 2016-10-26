describe('MultiMap', function () {

  beforeEach(function () {
    this.multiMap = new MultiMap();
  });

  afterEach(function () {
    delete this.multiMap;
  });

  it("should use string as key", function () {
    this.multiMap.set('foo', 'bar');

    expect(this.multiMap.get('foo')).toEqual('bar');

  });

  it("should use integer as key", function () {
    this.multiMap.set(1, 'bar');

    expect(this.multiMap.get(1)).toEqual('bar');

  });

  it("should use integer as key", function () {
    this.multiMap.set(1.2, 'bar');

    expect(this.multiMap.get(1.2)).toEqual('bar');
    expect(this.multiMap.get(1.3)).toBeUndefined();

  });

  it("should use plain object as key", function () {
    var keyObj1 = {};
    var keyObj2 = {};

    this.multiMap.set(keyObj1, 'bar');

    expect(this.multiMap.get(keyObj1)).toEqual('bar');
    expect(this.multiMap.get(keyObj2)).toBeUndefined();

  });

  it("should use array as key", function () {
    var keyArray1 = [];
    var keyArray2 = [];

    this.multiMap.set(keyArray1, 'bar');

    expect(this.multiMap.get(keyArray1)).toEqual('bar');
    expect(this.multiMap.get(keyArray2)).toBeUndefined();

  });

  it("should use regexp as key", function () {
    var keyRegexp1 = /test/;
    var keyRegexp2 = /test/;

    this.multiMap.set(keyRegexp1, 'bar');

    expect(this.multiMap.get(keyRegexp1)).toEqual('bar');
    expect(this.multiMap.get(keyRegexp2)).toBeUndefined();

  });

  it("should not use boolean as key", function () {

    var tryToSetBooleanKey = function () {
      this.multiMap.set(false, 'bar');
    };

    expect(tryToSetBooleanKey).toThrow();

  });

  it("should not set null as key", function () {

    var tryToSetNullKey = function () {
      this.multiMap.set(null, 'bar');
    };

    expect(tryToSetNullKey).toThrow();

  });

  it("should not set undefined as key", function () {

    var tryToSetUndefinedKey = function () {
      this.multiMap.set(undefined, 'bar');
    };

    expect(tryToSetUndefinedKey).toThrow();

  });

  it("should not set NaN as key", function () {

    var tryToSetNaNKey = function () {
      this.multiMap.set(NaN, 'bar');
    };

    expect(tryToSetNaNKey).toThrow();

  });



});