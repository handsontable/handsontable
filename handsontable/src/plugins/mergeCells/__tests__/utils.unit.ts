import { getRangeFromChanges, toMergeAreaKey } from '../utils';

describe('mergeCells utils', () => {
  describe('toMergeAreaKey', () => {
    it('should produce the same key for two areas covering the same cells', () => {
      expect(toMergeAreaKey({ row: 1, col: 2, rowspan: 3, colspan: 4 }))
        .toBe(toMergeAreaKey({ row: 1, col: 2, rowspan: 3, colspan: 4 }));
    });

    it('should produce different keys for areas that differ in any dimension', () => {
      const base = toMergeAreaKey({ row: 1, col: 2, rowspan: 3, colspan: 4 });

      expect(toMergeAreaKey({ row: 0, col: 2, rowspan: 3, colspan: 4 })).not.toBe(base);
      expect(toMergeAreaKey({ row: 1, col: 0, rowspan: 3, colspan: 4 })).not.toBe(base);
      expect(toMergeAreaKey({ row: 1, col: 2, rowspan: 1, colspan: 4 })).not.toBe(base);
      expect(toMergeAreaKey({ row: 1, col: 2, rowspan: 3, colspan: 1 })).not.toBe(base);
    });
  });

  describe('getRangeFromChanges', () => {
    const hot = { propToCol: (prop: number) => prop };

    it('should derive the rectangle the changes cover', () => {
      const changes = [
        [7, 4, 'old', 'new'],
        [9, 8, 'old', 'new'],
        [8, 6, 'old', 'new'],
      ];

      expect(getRangeFromChanges(hot as never, changes as never)).toEqual({
        from: { row: 7, column: 4 },
        to: { row: 9, column: 8 },
      });
    });

    it('should derive a single-cell rectangle from a single change', () => {
      expect(getRangeFromChanges(hot as never, [[3, 5, 'old', 'new']] as never)).toEqual({
        from: { row: 3, column: 5 },
        to: { row: 3, column: 5 },
      });
    });

    it('should resolve column properties through `propToCol`', () => {
      const propHot = { propToCol: (prop: string) => parseInt(prop.replace('propFor', ''), 10) };
      const changes = [
        [1, 'propFor4', 'old', 'new'],
        [2, 'propFor9', 'old', 'new'],
      ];

      expect(getRangeFromChanges(propHot as never, changes as never)).toEqual({
        from: { row: 1, column: 4 },
        to: { row: 2, column: 9 },
      });
    });

    // Another `beforeChange` listener may null an entry out to drop that change. Such an entry
    // addresses no cell, so it must not stretch the rectangle - reading `[0]`/`[1]` off it would
    // otherwise contribute `undefined` to the min/max comparisons.
    it('should ignore entries that another listener nullified', () => {
      const changes = [
        null,
        [7, 4, 'old', 'new'],
        undefined,
        [9, 8, 'old', 'new'],
        null,
      ];

      expect(getRangeFromChanges(hot as never, changes as never)).toEqual({
        from: { row: 7, column: 4 },
        to: { row: 9, column: 8 },
      });
    });

    it('should fall back to the origin when every entry was nullified', () => {
      expect(getRangeFromChanges(hot as never, [null, null] as never)).toEqual({
        from: { row: 0, column: 0 },
        to: { row: 0, column: 0 },
      });
    });

    it('should fall back to the origin for an empty change list', () => {
      expect(getRangeFromChanges(hot as never, [])).toEqual({
        from: { row: 0, column: 0 },
        to: { row: 0, column: 0 },
      });
    });
  });
});
