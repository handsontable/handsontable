describe('Unicode helper', function () {
  //
  // Handsontable.helper.isKey
  //
  describe('isKey', function() {
    it("should be defined", function () {
      expect(Handsontable.helper.isKey).toBeDefined();
    });

    it("should return true when base code is defined individually", function () {
      expect(Handsontable.helper.isKey(39, 'ARROW_RIGHT')).toBe(true);

      expect(Handsontable.helper.isKey('39', 'ARROW_RIGHT')).toBe(false);
      expect(Handsontable.helper.isKey(30, 'ARROW_RIGHT')).toBe(false);
    });

    it("should return true when base code is defined many times", function () {
      expect(Handsontable.helper.isKey(39, 'ARROW_RIGHT|ARROW_UP|ARROW_DOWN')).toBe(true);
      expect(Handsontable.helper.isKey(38, 'ARROW_RIGHT|ARROW_UP|ARROW_DOWN')).toBe(true);
      expect(Handsontable.helper.isKey(40, 'ARROW_RIGHT|ARROW_UP|ARROW_DOWN')).toBe(true);

      expect(Handsontable.helper.isKey(37, 'ARROW_RIGHT|ARROW_UP|ARROW_BOTTOM')).toBe(false);
      expect(Handsontable.helper.isKey('39', 'ARROW_RIGHT|ARROW_UP|ARROW_BOTTOM')).toBe(false);
      expect(Handsontable.helper.isKey(116, 'ARROW_RIGHT|ARROW_UP|ARROW_BOTTOM')).toBe(false);
    });
  });
});
