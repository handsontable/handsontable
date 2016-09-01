describe('manualRowMove', function () {
  describe('rowsMapper', function () {
    it('should set manualRowMove plugin while constructing', function() {
      var manualRowMoveMock = {};
      var mapper = new Handsontable.utils.ManualRowMoveRowsMapper(manualRowMoveMock);

      expect(mapper.manualRowMove).toBe(manualRowMoveMock);
    });

    it('should be mixed with arrayMapper object', function() {
      expect(Handsontable.utils.ManualRowMoveRowsMapper.MIXINS).toEqual(['arrayMapper']);
    });

    it('should destroy array after calling destroy method', function() {
      var mapper = new Handsontable.utils.ManualRowMoveRowsMapper();

      expect(mapper._arrayMap).toEqual([]);

      mapper.destroy();

      expect(mapper._arrayMap).toBe(null);;
    });

    it('should create map with pairs index->value', function() {
      var mapper = new Handsontable.utils.ManualRowMoveRowsMapper();
      mapper.createMap(6);

      expect(mapper._arrayMap[0]).toBe(0);
      expect(mapper._arrayMap[1]).toBe(1);
      expect(mapper._arrayMap[2]).toBe(2);
      expect(mapper._arrayMap[3]).toBe(3);
      expect(mapper._arrayMap[4]).toBe(4);
      expect(mapper._arrayMap[5]).toBe(5);
    });

    it('should change order after move action', function() {
      var mapper = new Handsontable.utils.ManualRowMoveRowsMapper();
      mapper.createMap(6);

      mapper.moveRow(1, 0);
      mapper.clearNull();

      expect(mapper._arrayMap[0]).toBe(1);
      expect(mapper._arrayMap[1]).toBe(0);
      expect(mapper._arrayMap[2]).toBe(2);
      expect(mapper._arrayMap[3]).toBe(3);
      expect(mapper._arrayMap[4]).toBe(4);
      expect(mapper._arrayMap[5]).toBe(5);
    });

    it('should clean from null values', function() {
      var mapper = new Handsontable.utils.ManualRowMoveRowsMapper();
      mapper.createMap(6);

      mapper.moveRow(1, 6);
      mapper.moveRow(2, 7);
      mapper.moveRow(4, 8);

      mapper.clearNull();

      expect(mapper._arrayMap.length).toBe(6);
    });
  });
});
