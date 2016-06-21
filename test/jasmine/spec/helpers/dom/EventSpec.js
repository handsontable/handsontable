describe('DomEvent helper', function () {
  //
  // Handsontable.dom.isLeftClick
  //
  describe('isLeftClick', function () {
    it("should return true for valid mouse events", function () {
      var isLeftClick = Handsontable.dom.isLeftClick;

      expect(isLeftClick({button: 0})).toBe(true);
    });

    it("should return false for invalid mouse events", function () {
      var isLeftClick = Handsontable.dom.isLeftClick;

      expect(isLeftClick({button: '0'})).toBe(false);
      expect(isLeftClick({button: 1})).toBe(false);
      expect(isLeftClick({button: 2})).toBe(false);
      expect(isLeftClick({button: 3})).toBe(false);
      expect(isLeftClick({button: null})).toBe(false);
      expect(isLeftClick({button: void 0})).toBe(false);
      expect(isLeftClick({})).toBe(false);
    });
  });
  //
  // Handsontable.dom.isRightClick
  //
  describe('isRightClick', function () {
    it("should return true for valid mouse events", function () {
      var isRightClick = Handsontable.dom.isRightClick;

      expect(isRightClick({button: 2})).toBe(true);
    });

    it("should return false for invalid mouse events", function () {
      var isRightClick = Handsontable.dom.isRightClick;

      expect(isRightClick({button: '0'})).toBe(false);
      expect(isRightClick({button: 1})).toBe(false);
      expect(isRightClick({button: -2})).toBe(false);
      expect(isRightClick({button: 3})).toBe(false);
      expect(isRightClick({button: null})).toBe(false);
      expect(isRightClick({button: void 0})).toBe(false);
      expect(isRightClick({})).toBe(false);
    });
  });
});
