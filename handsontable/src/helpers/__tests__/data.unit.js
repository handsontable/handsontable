import {
  dataRowToChangesArray,
  spreadsheetColumnLabel,
  spreadsheetColumnIndex,
  isArrayOfArrays,
  isArrayOfObjects
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

  describe('isArrayOfArrays', () => {
    it('recognize if the provided argument is an array of arrays', () => {
      expect(isArrayOfArrays()).toBe(false);
      expect(isArrayOfArrays('test')).toBe(false);
      expect(isArrayOfArrays(123)).toBe(false);
      expect(isArrayOfArrays([])).toBe(false);
      expect(isArrayOfArrays([1, 2, 3])).toBe(false);
      expect(isArrayOfArrays(['test', 'test'])).toBe(false);
      expect(isArrayOfArrays([1, 'test', []])).toBe(false);
      expect(isArrayOfArrays([{}])).toBe(false);
      expect(isArrayOfArrays([null])).toBe(false);
      expect(isArrayOfArrays([[]])).toBe(true);
      expect(isArrayOfArrays([['test'], [1]])).toBe(true);
    });
  });

  describe('isArrayOfObjects', () => {
    it('recognize if the provided argument is an array of arrays', () => {
      expect(isArrayOfObjects()).toBe(false);
      expect(isArrayOfObjects('test')).toBe(false);
      expect(isArrayOfObjects(123)).toBe(false);
      expect(isArrayOfObjects([])).toBe(false);
      expect(isArrayOfObjects([1, 2, 3])).toBe(false);
      expect(isArrayOfObjects(['test', 'test'])).toBe(false);
      expect(isArrayOfObjects([1, 'test', []])).toBe(false);
      expect(isArrayOfObjects([{}])).toBe(true);
      expect(isArrayOfObjects([null])).toBe(false);
      expect(isArrayOfObjects([[]])).toBe(false);
      expect(isArrayOfObjects([['test'], [1]])).toBe(false);
    });
  });
});
