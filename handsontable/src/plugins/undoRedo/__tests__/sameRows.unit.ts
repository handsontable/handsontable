import { copyRows, hasSameRows, MAX_COPIED_ROWS } from '../sameRows';

describe('hasSameRows', () => {
  const a = ['A'];
  const b = ['B'];

  it('should answer `false` when no rows were recorded', () => {
    expect(hasSameRows(null, [a])).toBe(false);
  });

  it('should answer `true` for the same array, empty or not', () => {
    const rows = [a, b];

    expect(hasSameRows(rows, rows)).toBe(true);
    expect(hasSameRows([], [])).toBe(true);
  });

  it('should answer `true` for a copy that holds the same rows in the same order', () => {
    expect(hasSameRows([a, b], [a, b])).toBe(true);
  });

  it('should answer `false` for another row, another order, or another length', () => {
    expect(hasSameRows([a, b], [a, ['B']])).toBe(false);
    expect(hasSameRows([a, b], [b, a])).toBe(false);
    expect(hasSameRows([a, b], [a])).toBe(false);
    expect(hasSameRows([a], [a, b])).toBe(false);
  });

  it('should answer `false` for collections that are not arrays', () => {
    const collection = { length: 1, push() {}, splice() {}, 0: a };
    const other = { length: 1, push() {}, splice() {}, 0: b };

    expect(hasSameRows(collection as unknown as unknown[], other as unknown as unknown[])).toBe(false);
    expect(hasSameRows([a], other as unknown as unknown[])).toBe(false);
  });

  describe('by value', () => {
    it('should accept another row array with equal cells, and another plain object with equal keys', () => {
      expect(hasSameRows([['A', 1]], [['A', 1]], true)).toBe(true);
      expect(hasSameRows([{ a: 1, b: 2 }], [{ b: 2, a: 1 }], true)).toBe(true);
      expect(hasSameRows([Object.create(null)], [{}], true)).toBe(true);
    });

    it('should not read the values of another row unless asked', () => {
      expect(hasSameRows([['A']], [['A']])).toBe(false);
    });

    it('should refuse a row with another cell, another length, other keys, or another kind', () => {
      expect(hasSameRows([['A', 1]], [['A', 2]], true)).toBe(false);
      expect(hasSameRows([['A']], [['A', null]], true)).toBe(false);
      expect(hasSameRows([{ a: 1 }], [{ a: 1, b: undefined }], true)).toBe(false);
      expect(hasSameRows([{ a: undefined }], [{ b: undefined }], true)).toBe(false);
      expect(hasSameRows([['A']], [{ 0: 'A' }], true)).toBe(false);
    });

    it('should compare a nested object and a class instance by reference', () => {
      class Row { a = 1; }

      expect(hasSameRows([[{ id: 1 }]], [[{ id: 1 }]], true)).toBe(false);
      expect(hasSameRows([new Row()], [new Row()], true)).toBe(false);
    });

    it('should accept as many copied rows as the limit, and refuse one more', () => {
      const rows = Array.from({ length: MAX_COPIED_ROWS + 1 }, (_, row) => [row]);
      const copy = rows.map(row => row.slice());

      expect(hasSameRows(rows.slice(0, MAX_COPIED_ROWS), copy.slice(0, MAX_COPIED_ROWS), true)).toBe(true);
      expect(hasSameRows(rows, copy, true)).toBe(false);
    });

    it('should not count a row that is the same object against the limit', () => {
      const rows = Array.from({ length: MAX_COPIED_ROWS + 5 }, (_, row) => [row]);
      const next = rows.map((row, index) => (index < 5 ? row.slice() : row));

      expect(hasSameRows(rows, next, true)).toBe(true);
    });
  });
});

describe('copyRows', () => {
  it('should copy the row references of an array', () => {
    const row = ['A'];
    const rows = [row];
    const copy = copyRows(rows);

    expect(copy).not.toBe(rows);
    expect(copy?.[0]).toBe(row);
  });

  it('should answer `null` for what is not an array', () => {
    expect(copyRows(undefined)).toBeNull();
    expect(copyRows(null)).toBeNull();
    expect(copyRows({ push() {}, splice() {} } as unknown as unknown[])).toBeNull();
  });
});
