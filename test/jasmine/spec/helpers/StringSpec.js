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

  //
  // Handsontable.helper.startsWith
  //
  describe('startsWith', function() {
    it("should properly recognize whether a string begins with the characters", function() {
      expect(Handsontable.helper.startsWith('', '')).toBe(true);
      expect(Handsontable.helper.startsWith('Base string', '')).toBe(true);
      expect(Handsontable.helper.startsWith('Base string', 'B')).toBe(true);
      expect(Handsontable.helper.startsWith('Base string', 'Base')).toBe(true);
      expect(Handsontable.helper.startsWith('Base string', 'Base string')).toBe(true);

      expect(Handsontable.helper.startsWith('Base string', 'b')).toBe(false);
      expect(Handsontable.helper.startsWith('Base string', 'ase')).toBe(false);
      expect(Handsontable.helper.startsWith('Base string', 'g')).toBe(false);
      expect(Handsontable.helper.startsWith('Base string', '1')).toBe(false);
    });
  });

  //
  // Handsontable.helper.endsWith
  //
  describe('endsWith', function() {
    it("should properly recognize whether a string ends with the characters", function() {
      expect(Handsontable.helper.endsWith('', '')).toBe(true);
      expect(Handsontable.helper.endsWith('Base string', '')).toBe(true);
      expect(Handsontable.helper.endsWith('Base string', 'g')).toBe(true);
      expect(Handsontable.helper.endsWith('Base string', 'ing')).toBe(true);
      expect(Handsontable.helper.endsWith('Base string', 'Base string')).toBe(true);

      expect(Handsontable.helper.endsWith('Base string', 'G')).toBe(false);
      expect(Handsontable.helper.endsWith('Base string', 'strin')).toBe(false);
      expect(Handsontable.helper.endsWith('Base string', 'B')).toBe(false);
      expect(Handsontable.helper.endsWith('Base string', '1')).toBe(false);
    });
  });
});
