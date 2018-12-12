import ColumnsMapper from 'handsontable/plugins/manualColumnMove/columnsMapper';

describe('manualColumnMove', () => {
  describe('columnsMapper', () => {
    it('should set manualColumnMove plugin while constructing', () => {
      const manualColumnMoveMock = {};
      const mapper = new ColumnsMapper(manualColumnMoveMock);

      expect(mapper.manualColumnMove).toBe(manualColumnMoveMock);
    });

    it('should be mixed with arrayMapper object', () => {
      expect(ColumnsMapper.MIXINS).toEqual(['arrayMapper']);
    });

    it('should destroy array after calling destroy method', () => {
      const mapper = new ColumnsMapper();

      expect(mapper._arrayMap).toEqual([]);

      mapper.destroy();

      expect(mapper._arrayMap).toBe(null);
    });

    it('should create map with pairs index->value', () => {
      const mapper = new ColumnsMapper();
      mapper.createMap(6);

      expect(mapper._arrayMap[0]).toBe(0);
      expect(mapper._arrayMap[1]).toBe(1);
      expect(mapper._arrayMap[2]).toBe(2);
      expect(mapper._arrayMap[3]).toBe(3);
      expect(mapper._arrayMap[4]).toBe(4);
      expect(mapper._arrayMap[5]).toBe(5);
    });

    it('should change order after move action', () => {
      const mapper = new ColumnsMapper();
      mapper.createMap(6);

      mapper.moveColumn(1, 0);
      mapper.clearNull();

      expect(mapper._arrayMap[0]).toBe(1);
      expect(mapper._arrayMap[1]).toBe(0);
      expect(mapper._arrayMap[2]).toBe(2);
      expect(mapper._arrayMap[3]).toBe(3);
      expect(mapper._arrayMap[4]).toBe(4);
      expect(mapper._arrayMap[5]).toBe(5);
    });

    it('should clean from null values', () => {
      const mapper = new ColumnsMapper();
      mapper.createMap(6);

      mapper.moveColumn(1, 6);
      mapper.moveColumn(2, 7);
      mapper.moveColumn(4, 8);

      mapper.clearNull();

      expect(mapper._arrayMap.length).toBe(6);
    });
  });
});
