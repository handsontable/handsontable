import {
  spreadsheetColumnLabel,
  spreadsheetColumnIndex,
} from 'handsontable/helpers/data';

describe('Data helper', function() {
  //
  // Handsontable.helper.spreadsheetColumnLabel
  //
  describe('spreadsheetColumnLabel', function() {
    it('should return valid column names based on provided column index', function() {
      expect(spreadsheetColumnLabel()).toBe('');
      expect(spreadsheetColumnLabel(0)).toBe('A');
      expect(spreadsheetColumnLabel(11)).toBe('L');
      expect(spreadsheetColumnLabel(113)).toBe('DJ');
      expect(spreadsheetColumnLabel(33439273)).toBe('BUDNIX');
    });
  });

  //
  // Handsontable.helper.spreadsheetColumnIndex
  //
  describe('spreadsheetColumnIndex', function() {
    it('should return valid column indexes based on provided column name', function() {
      expect(spreadsheetColumnIndex('')).toBe(-1);
      expect(spreadsheetColumnIndex('A')).toBe(0);
      expect(spreadsheetColumnIndex('L')).toBe(11);
      expect(spreadsheetColumnIndex('DJ')).toBe(113);
      expect(spreadsheetColumnIndex('BUDNIX')).toBe(33439273);
    });
  });
});
