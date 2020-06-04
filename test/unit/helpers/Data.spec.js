import {
  dataRowToChangesArray,
  spreadsheetColumnLabel,
  spreadsheetColumnIndex,
} from 'handsontable/helpers/data';

describe('Data helper', () => {
  //
  // Handsontable.helper.spreadsheetColumnLabel
  //
  describe('spreadsheetColumnLabel', () => {
    it('should return valid column names based on provided column index', () => {
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
  describe('spreadsheetColumnIndex', () => {
    it('should return valid column indexes based on provided column name', () => {
      expect(spreadsheetColumnIndex('')).toBe(-1);
      expect(spreadsheetColumnIndex('A')).toBe(0);
      expect(spreadsheetColumnIndex('L')).toBe(11);
      expect(spreadsheetColumnIndex('DJ')).toBe(113);
      expect(spreadsheetColumnIndex('BUDNIX')).toBe(33439273);
    });
  });

  //
  // Handsontable.helper.dataRowToChangesArray
  //
  describe('dataRowToChangesArray', () => {
    it('should transform an representation of a data row (object or array) into an array of changes in form of `[[row, col, val],...]` ' +
      'with an optional row offset', () => {
      expect(dataRowToChangesArray(['first-column', 'second-column']))
        .toMatchObject([[0, 0, 'first-column'], [0, 1, 'second-column']]);
      expect(dataRowToChangesArray(['first-column', 'second-column'], 3))
        .toMatchObject([[3, 0, 'first-column'], [3, 1, 'second-column']]);
      expect(dataRowToChangesArray({
        a: 'first-column',
        b: 'second-column'
      })).toMatchObject([[0, 'a', 'first-column'], [0, 'b', 'second-column']]);
      expect(dataRowToChangesArray({
        a: 'first-column',
        b: 'second-column'
      }, 3)).toMatchObject([[3, 'a', 'first-column'], [3, 'b', 'second-column']]);
    });
  });
});
