describe('manualColumnMove', function () {
  describe('columnsMapper', function () {
    it('should set manualColumnMove plugin while constructing', function() {
      var manualColumnMoveMock = {};
      var mapper = new Handsontable.utils.ManualColumnMoveColumnsMapper(manualColumnMoveMock);

      expect(mapper.manualColumnMove).toBe(manualColumnMoveMock);
    });

    it('should be mixed with arrayMapper object', function() {
      expect(Handsontable.utils.ManualColumnMoveColumnsMapper.MIXINS).toEqual(['arrayMapper']);
    });

    it('should destroy array after calling destroy method', function() {
      var mapper = new Handsontable.utils.ManualColumnMoveColumnsMapper();

      expect(mapper._arrayMap).toEqual([]);

      mapper.destroy();

      expect(mapper._arrayMap).toBe(null);
    });

    it('should create map with pairs index->value', function() {
      var mapper = new Handsontable.utils.ManualColumnMoveColumnsMapper();
      mapper.createMap(6);

      expect(mapper._arrayMap[0]).toBe(0);
      expect(mapper._arrayMap[1]).toBe(1);
      expect(mapper._arrayMap[2]).toBe(2);
      expect(mapper._arrayMap[3]).toBe(3);
      expect(mapper._arrayMap[4]).toBe(4);
      expect(mapper._arrayMap[5]).toBe(5);
    });

    it('should change order after move action', function() {
      var mapper = new Handsontable.utils.ManualColumnMoveColumnsMapper();
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

    it('should clean from null values', function() {
      var mapper = new Handsontable.utils.ManualColumnMoveColumnsMapper();
      mapper.createMap(6);

      mapper.moveColumn(1, 6);
      mapper.moveColumn(2, 7);
      mapper.moveColumn(4, 8);

      mapper.clearNull();

      expect(mapper._arrayMap.length).toBe(6);
    });
  });
});
