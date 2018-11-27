import RowsMapper from 'handsontable/plugins/trimRows/rowsMapper';

describe('TrimRows -> RowsMapper', () => {
  it('should set trimRows plugin while constructing', () => {
    const trimRowsMock = {};
    const mapper = new RowsMapper(trimRowsMock);

    expect(mapper.trimRows).toBe(trimRowsMock);
  });

  it('should be mixed with arrayMapper object', () => {
    expect(RowsMapper.MIXINS).toEqual(['arrayMapper']);
  });

  it('should destroy array after calling destroy method', () => {
    const mapper = new RowsMapper();

    expect(mapper._arrayMap).toEqual([]);

    mapper.destroy();

    expect(mapper._arrayMap).toBe(null);
  });

  it('should call isTrimmed method "length" times', () => {
    const trimRowsMock = {
      isTrimmed() {
        return false;
      }
    };
    const mapper = new RowsMapper(trimRowsMock);

    spyOn(trimRowsMock, 'isTrimmed').and.callThrough();
    mapper.createMap(5);

    expect(trimRowsMock.isTrimmed.calls.count()).toBe(5);
    expect(trimRowsMock.isTrimmed.calls.argsFor(0)).toEqual([0]);
    expect(trimRowsMock.isTrimmed.calls.argsFor(1)).toEqual([1]);
    expect(trimRowsMock.isTrimmed.calls.argsFor(2)).toEqual([2]);
    expect(trimRowsMock.isTrimmed.calls.argsFor(3)).toEqual([3]);
    expect(trimRowsMock.isTrimmed.calls.argsFor(4)).toEqual([4]);
  });

  it('should create map with pairs index->value', () => {
    const trimRowsMock = {
      isTrimmed() {
        return false;
      }
    };
    const mapper = new RowsMapper(trimRowsMock);

    spyOn(trimRowsMock, 'isTrimmed').and.callThrough();
    mapper.createMap(6);

    expect(mapper._arrayMap[0]).toBe(0);
    expect(mapper._arrayMap[1]).toBe(1);
    expect(mapper._arrayMap[2]).toBe(2);
    expect(mapper._arrayMap[3]).toBe(3);
    expect(mapper._arrayMap[4]).toBe(4);
    expect(mapper._arrayMap[5]).toBe(5);
  });

  it('should create map with pairs index->value with some gaps', () => {
    const trimRowsMock = {
      isTrimmed(index) {
        return index === 2 || index === 5;
      }
    };
    const mapper = new RowsMapper(trimRowsMock);

    spyOn(trimRowsMock, 'isTrimmed').and.callThrough();
    mapper.createMap(6);

    expect(mapper._arrayMap[0]).toBe(0);
    expect(mapper._arrayMap[1]).toBe(1);
    expect(mapper._arrayMap[2]).toBe(3);
    expect(mapper._arrayMap[3]).toBe(4);
    expect(mapper._arrayMap[4]).toBeUndefined();
    expect(mapper._arrayMap[5]).toBeUndefined();
  });
});
