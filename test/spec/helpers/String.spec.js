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

  //
  // Handsontable.helper.substitute
  //
  describe('substitute', function() {
    it("should properly substitute string to specified values", function() {
      var substitute = Handsontable.helper.substitute;
      var vars = {
        zero: 0,
        empty: '',
        undef: void 0,
        string1: 'foo;',
        string2: 'foo\nbar',
      };

      expect(substitute('', vars)).toBe('');
      expect(substitute('[zero]', vars)).toBe('0');
      expect(substitute('[zero][zero]', vars)).toBe('00');
      expect(substitute('[empty][zero][string1]', vars)).toBe('0foo;');
      expect(substitute('BAZ [string2] test', vars)).toBe('BAZ foo\nbar test');
      expect(substitute('1[undef]', vars)).toBe('1');
    });
  });

  //
  // Handsontable.helper.padStart
  //
  describe('padStart', function() {
    it("should properly add leading chars at the begining of the string", function() {
      var padStart = Handsontable.helper.padStart;

      expect(padStart('x', 5, 'ab')).toBe('ababx');
      expect(padStart('x', 4, 'abcde')).toBe('abcx');
      expect(padStart('abcd', 2, 'z')).toBe('abcd');
      expect(padStart('12345', 10, 'abcdefg')).toBe('abcde12345');
      expect(padStart('a', 3)).toBe('  a');
      expect(padStart(2, 3, '00')).toBe('002');
    });
  });
});
