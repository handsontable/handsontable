describe('Handsontable.helper', function () {
  //
  // Handsontable.helper.isObjectEquals
  //
  describe('isObjectEquals', function() {
    it("should returns true on equal objects", function () {
      expect(Handsontable.helper.isObjectEquals({}, {})).toBe(true);
      expect(Handsontable.helper.isObjectEquals({test: 1}, {test: 1})).toBe(true);
      expect(Handsontable.helper.isObjectEquals({test: {test2: [{}]}}, {test: {test2: [{}]}})).toBe(true);

      expect(Handsontable.helper.isObjectEquals([], [])).toBe(true);
      expect(Handsontable.helper.isObjectEquals([33], [33])).toBe(true);
      expect(Handsontable.helper.isObjectEquals([{test: 1}], [{test: 1}])).toBe(true);
    });

    it("should returns false for not equal objects", function () {
      expect(Handsontable.helper.isObjectEquals({}, [])).toBe(false);

      expect(Handsontable.helper.isObjectEquals({test: 2}, {test: 1})).toBe(false);
      expect(Handsontable.helper.isObjectEquals({test: {test3: [{}]}}, {test: {test2: [{}]}})).toBe(false);

      expect(Handsontable.helper.isObjectEquals([12], [33])).toBe(false);
      expect(Handsontable.helper.isObjectEquals([{test: 3}], [{test: 1}])).toBe(false);
    });
  });

  //
  // Handsontable.helper.isInput
  //
  describe('isInput', function () {
    it("should return true for inputs, selects, and textareas", function () {
      expect(Handsontable.helper.isInput(document.createElement('input'))).toBe(true);
      expect(Handsontable.helper.isInput(document.createElement('select'))).toBe(true);
      expect(Handsontable.helper.isInput(document.createElement('textarea'))).toBe(true);
    });
    
    it("should return true for contenteditable elements", function () {
      var div = document.createElement('div');
      div.contentEditable = true;
      expect(Handsontable.helper.isInput(div)).toBe(true);
    });
  });

  //
  // Handsontable.helper.duckSchema
  //
  describe('duckSchema', function() {
    it("should returns valid schema object", function () {
      expect(Handsontable.helper.duckSchema({})).toEqual({});
      expect(Handsontable.helper.duckSchema({test: 1})).toEqual({test: null});
      expect(Handsontable.helper.duckSchema({test: 'foo'})).toEqual({test: null});
      expect(Handsontable.helper.duckSchema({test: undefined})).toEqual({test: null});
      expect(Handsontable.helper.duckSchema({test: null})).toEqual({test: null});
      expect(Handsontable.helper.duckSchema({test: []})).toEqual({test: []});
      expect(Handsontable.helper.duckSchema({test: [1, 2, 3]})).toEqual({test: []});
    });

    it("should returns valid schema object (deeply)", function () {
      expect(Handsontable.helper.duckSchema({test: {a: {b: 11}}})).toEqual({test: {a: {b: null}}});
      expect(Handsontable.helper.duckSchema({test: {a: {b: []}}})).toEqual({test: {a: {b: []}}});
      expect(Handsontable.helper.duckSchema({test: {a: {b: [{q: 1, w: 2}]}}})).toEqual({test: {a: {b: [{q: null, w: null}]}}});
    });
  });
});
