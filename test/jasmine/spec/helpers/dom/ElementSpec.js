describe('DomElement helper', function () {
  //
  // Handsontable.helper.isInput
  //
  describe('isInput', function () {
    it("should return true for inputs, selects, and textareas", function () {
      expect(Handsontable.dom.isInput(document.createElement('input'))).toBe(true);
      expect(Handsontable.dom.isInput(document.createElement('select'))).toBe(true);
      expect(Handsontable.dom.isInput(document.createElement('textarea'))).toBe(true);
    });

    it("should return true for contenteditable elements", function () {
      var div = document.createElement('div');
      div.contentEditable = true;
      expect(Handsontable.dom.isInput(div)).toBe(true);
    });
  });
});
