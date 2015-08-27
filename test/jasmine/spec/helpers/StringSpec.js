describe('String helper', function () {
  //
  // Handsontable.helper.equalsIgnoreCase
  //
  describe('equalsIgnoreCase', function() {
    it("should correct equals strings", function () {
      expect(Handsontable.helper.equalsIgnoreCase()).toEqual(false);
      expect(Handsontable.helper.equalsIgnoreCase('', '')).toEqual(true);
      expect(Handsontable.helper.equalsIgnoreCase('True', 'TRUE', 'TrUe', true)).toEqual(true);
      expect(Handsontable.helper.equalsIgnoreCase('FALSE', 'false')).toEqual(true);

      expect(Handsontable.helper.equalsIgnoreCase('True', 'TRUE', false)).toEqual(false);
      expect(Handsontable.helper.equalsIgnoreCase('fals e', false)).toEqual(false);
    });
  });
});
