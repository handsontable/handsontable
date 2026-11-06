import {
  getEngineColumnLayout,
  readCell,
  toEngineContent,
  writeFormulaTextChanges,
} from '../formulaSheetData';

describe('formulaSheetData', () => {
  describe('readCell', () => {
    it('reads an own property named exactly the dotted key before the nested path', () => {
      const row = { 'address.city': 'Own', address: { city: 'Nested' } };

      expect(readCell(row, 'address.city')).toBe('Own');
    });

    it('walks the dotted path when the row has no own property of that name', () => {
      const row = { address: { city: 'Nested' } };

      expect(readCell(row, 'address.city')).toBe('Nested');
    });

    it('reads a cell through an accessor function', () => {
      expect(readCell({ a: 2 }, row => row.a * 10)).toBe(20);
    });
  });

  describe('getEngineColumnLayout', () => {
    it('feeds only the first `maxCols` columns of array rows', () => {
      const data = [[1, 2, 3, 4], [5, 6, 7, 8]];

      expect(getEngineColumnLayout(data, { maxCols: 2 })).toEqual({ kind: 'keys', keys: [0, 1] });
    });

    it('feeds array rows as they are when `maxCols` covers every column', () => {
      expect(getEngineColumnLayout([[1, 2]], { maxCols: 5 })).toEqual({ kind: 'rows' });
    });

    it('caps the `columns` of object rows at `maxCols`', () => {
      const data = [{ a: 1, b: 2, c: 3 }];
      const columns = [{ data: 'a' }, { data: 'b' }, { data: 'c' }];

      expect(getEngineColumnLayout(data, { columns, maxCols: 2 })).toEqual({ kind: 'keys', keys: ['a', 'b'] });
    });

    it('caps the leaf columns of object rows at `maxCols`', () => {
      const data = [{ a: 1, nested: { b: 2 }, c: 3 }];

      expect(getEngineColumnLayout(data, { maxCols: 2 })).toEqual({ kind: 'keys', keys: ['a', 'nested.b'] });
    });

    it('returns `null` when a `columns` function or a `dataSchema` decides the layout', () => {
      expect(getEngineColumnLayout([[1]], { columns: () => ({}) })).toBeNull();
      expect(getEngineColumnLayout([[1]], { dataSchema: {} })).toBeNull();
    });
  });

  describe('toEngineContent', () => {
    it('drops the array columns past `maxCols`', () => {
      expect(toEngineContent([[1, 2, 3], [4, 5, 6]], { maxCols: 2 })).toEqual([[1, 2], [4, 5]]);
    });

    it('passes `null` for a cell that holds an object or a function', () => {
      const data = [{ a: 1, b: { kind: 'object' }, c: 'x' }];
      const columns = [{ data: 'a' }, { data: 'b' }, { data: 'c' }, { data: 'd' }];

      data[0].d = () => 'fn';

      expect(toEngineContent(data, { columns })).toEqual([[1, null, 'x', null]]);
    });

    it('reads the own dotted property of an object row, not the nested value', () => {
      const data = [{ 'address.city': 'Own', address: { city: 'Nested' } }];

      expect(toEngineContent(data, { columns: [{ data: 'address.city' }] })).toEqual([['Own']]);
    });
  });

  describe('writeFormulaTextChanges', () => {
    it('writes to the own dotted property when the row has one', () => {
      const row = { 'address.city': '=A1', address: { city: '=B1' } };

      writeFormulaTextChanges([row], [{ path: [0], key: 'address.city', text: '=A2' }]);

      expect(row['address.city']).toBe('=A2');
      expect(row.address.city).toBe('=B1');
    });

    it('writes to the nested path when the row has no own dotted property', () => {
      const row = { address: { city: '=B1' } };

      writeFormulaTextChanges([row], [{ path: [0], key: 'address.city', text: '=B2' }]);

      expect(row.address.city).toBe('=B2');
      expect(Object.prototype.hasOwnProperty.call(row, 'address.city')).toBe(false);
    });
  });
});
