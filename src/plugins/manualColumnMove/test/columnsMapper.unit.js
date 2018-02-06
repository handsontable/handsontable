import ColumnsMapper from 'handsontable/plugins/manualColumnMove/columnsMapper';

describe('manualColumnMove', () => {
  describe('columnsMapper', () => {
    it('should set manualColumnMove plugin while constructing', () => {
      var manualColumnMoveMock = {};
      var mapper = new ColumnsMapper(manualColumnMoveMock);

      expect(mapper.manualColumnMove).toBe(manualColumnMoveMock);
    });

    it('should be mixed with arrayMapper object', () => {
      expect(ColumnsMapper.MIXINS).toEqual(['arrayMapper']);
    });

    it('should destroy array after calling destroy method', () => {
      var mapper = new ColumnsMapper();

      expect(mapper._arrayMap).toEqual([]);

      mapper.destroy();

      expect(mapper._arrayMap).toBe(null);
    });

    it('should create map with pairs index->value', () => {
      var mapper = new ColumnsMapper();
      mapper.createMap(6);

      expect(mapper._arrayMap[0]).toBe(0);
      expect(mapper._arrayMap[1]).toBe(1);
      expect(mapper._arrayMap[2]).toBe(2);
      expect(mapper._arrayMap[3]).toBe(3);
      expect(mapper._arrayMap[4]).toBe(4);
      expect(mapper._arrayMap[5]).toBe(5);
    });
  });
});
