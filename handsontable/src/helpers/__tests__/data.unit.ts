import {
  cloneRow,
  createSpreadsheetData,
  createSpreadsheetObjectData,
  dataRowToChangesArray,
  hasChangeForCell,
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
  // Handsontable.helper.createSpreadsheetData
  //
  describe('createSpreadsheetData', () => {
    it('should label every cell with its own column letters and row number across multi-letter columns', () => {
      const data = createSpreadsheetData(2, 28);

      expect(data.length).toBe(2);
      expect(data[0].length).toBe(28);
      expect(data[1].length).toBe(28);
      expect(data[0][0]).toBe('A1');
      expect(data[0][1]).toBe('B1');
      expect(data[0][25]).toBe('Z1');
      expect(data[0][26]).toBe('AA1');
      expect(data[0][27]).toBe('AB1');
      expect(data[1]).toEqual(data[0].map(value => value.replace('1', '2')));
      expect(data[1][27]).toBe('AB2');
    });

    it('should label a three-letter column', () => {
      expect(createSpreadsheetData(1, 703)[0][702]).toBe('AAA1');
    });

    it('should return empty rows when no columns are requested', () => {
      expect(createSpreadsheetData(2, 0)).toEqual([[], []]);
    });

    it('should round a fractional column count up, as the column loop does', () => {
      expect(createSpreadsheetData(1, 2.5)).toEqual([['A1', 'B1', 'C1']]);
    });

    it('should not walk the columns when no rows are requested', () => {
      expect(createSpreadsheetData(0, Infinity)).toEqual([]);
    });

    it('should return 100 rows of 4 columns by default', () => {
      const data = createSpreadsheetData();

      expect(data.length).toBe(100);
      expect(data[0]).toEqual(['A1', 'B1', 'C1', 'D1']);
      expect(data[99]).toEqual(['A100', 'B100', 'C100', 'D100']);
    });
  });

  //
  // Handsontable.helper.createSpreadsheetObjectData
  //
  describe('createSpreadsheetObjectData', () => {
    it('should key every cell by its column index and label it with its column letters and row number', () => {
      const data = createSpreadsheetObjectData(2, 28);
      const expectedKeys = Array.from({ length: 28 }, (_, index) => `prop${index}`);

      expect(data.length).toBe(2);
      expect(Object.keys(data[0])).toEqual(expectedKeys);
      expect(Object.keys(data[1])).toEqual(expectedKeys);
      expect(data[0].prop0).toBe('A1');
      expect(data[0].prop25).toBe('Z1');
      expect(data[0].prop26).toBe('AA1');
      expect(data[1].prop0).toBe('A2');
      expect(data[1].prop27).toBe('AB2');
    });

    it('should return empty objects when no columns are requested', () => {
      expect(createSpreadsheetObjectData(1, 0)).toEqual([{}]);
    });

    it('should return 100 rows of 4 props by default', () => {
      const data = createSpreadsheetObjectData();

      expect(data.length).toBe(100);
      expect(data[0]).toEqual({ prop0: 'A1', prop1: 'B1', prop2: 'C1', prop3: 'D1' });
      expect(data[99]).toEqual({ prop0: 'A100', prop1: 'B100', prop2: 'C100', prop3: 'D100' });
    });

    it('should not walk the columns when no rows are requested', () => {
      expect(createSpreadsheetObjectData(0, Infinity)).toEqual([]);
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

  describe('cloneRow', () => {
    it('returns a shallow copy of an array row', () => {
      const row = ['a', 'b', 'c'];
      const result = cloneRow(row);

      expect(result).not.toBe(row);
      expect(result).toEqual(row);
    });

    it('returns a shallow copy of an object row', () => {
      const row = { x: 1, nested: { y: 2 } };
      const result = cloneRow(row);

      expect(result).not.toBe(row);
      expect(result).toEqual(row);
      expect(result.nested).toBe(row.nested);
    });

    it('passes primitives through unchanged', () => {
      expect(cloneRow('abc')).toBe('abc');
      expect(cloneRow(42)).toBe(42);
      expect(cloneRow(null)).toBe(null);
      expect(cloneRow(undefined)).toBe(undefined);
    });

    it('mutating the returned array does not affect the source', () => {
      const row = ['a', 'b'];
      const result = cloneRow(row);

      result[0] = 'X';

      expect(row[0]).toBe('a');
    });

    it('mutating the returned object does not affect the source', () => {
      const row = { x: 1 };
      const result = cloneRow(row);

      result.x = 99;

      expect(row.x).toBe(1);
    });
  });

  describe('hasChangeForCell', () => {
    it('should return `true` only when the visual row and prop pair exists in changes', () => {
      const changes = [
        [0, 'name', 'A1', 'edited'],
        [1, 'id', 1, 2],
        [2, 0, 'C3', 'changed'],
      ];

      expect(hasChangeForCell(changes, 0, 'name')).toBe(true);
      expect(hasChangeForCell(changes, 2, 0)).toBe(true);
      expect(hasChangeForCell(changes, 0, 'id')).toBe(false);
      expect(hasChangeForCell(changes, 1, 'name')).toBe(false);
    });
  });
});
