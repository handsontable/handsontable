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

  //
  // Handsontable.helper.closestDown
  //
  describe('closestDown', function () {
    var test1 = '<div><table><tbody><tr><td class="test1">test1</td></tr></tbody></table></div>';
    var test2 = '<div><table><tbody><tr><td class="test2">test2' + test1 + '</td></tr></tbody></table></div>';

    it("should return last TD element (starting from last child element)", function () {
      var closestDown = Handsontable.dom.closestDown;

      var wrapper = document.createElement('div');
      wrapper.innerHTML = test2;
      var td1 = wrapper.querySelector('.test1');
      var td2 = wrapper.querySelector('.test2');

      expect(closestDown(td1, ['TD'])).toBe(td2);
    });
  });
});
