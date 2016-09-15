describe('Data helper', function () {
  //
  // Handsontable.helper.spreadsheetColumnLabel
  //
  describe('spreadsheetColumnLabel', function() {
    it("should return valid column names based on provided column index", function () {
      var helper = Handsontable.helper.spreadsheetColumnLabel;

      expect(helper()).toBe('');
      expect(helper(0)).toBe('A');
      expect(helper(11)).toBe('L');
      expect(helper(113)).toBe('DJ');
      expect(helper(33439273)).toBe('BUDNIX');
    });
  });

  //
  // Handsontable.helper.spreadsheetColumnIndex
  //
  describe('spreadsheetColumnIndex', function() {
    it("should return valid column indexes based on provided column name", function () {
      var helper = Handsontable.helper.spreadsheetColumnIndex;

      expect(helper('')).toBe(-1);
      expect(helper('A')).toBe(0);
      expect(helper('L')).toBe(11);
      expect(helper('DJ')).toBe(113);
      expect(helper('BUDNIX')).toBe(33439273);
    });
  });
});
