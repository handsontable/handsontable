import { insertColWidths, removeColWidths } from '../colWidthsSplice';

describe('colWidthsSplice', () => {
  describe('insertColWidths', () => {
    it('should insert empty slots at the physical index', () => {
      expect(insertColWidths([100, 120, 140], 1, 2)).toEqual([100, undefined, undefined, 120, 140]);
    });

    it('should return a new array and keep the given one untouched', () => {
      const widths = [100, 120];

      expect(insertColWidths(widths, 0, 1)).not.toBe(widths);
      expect(widths).toEqual([100, 120]);
    });

    it('should leave an array shorter than the index as it is', () => {
      const widths = [100];

      expect(insertColWidths(widths, 3, 1)).toBe(widths);
    });
  });

  describe('removeColWidths', () => {
    it('should drop the widths at the given physical indexes', () => {
      expect(removeColWidths([100, 120, 140, 160], [0, 2])).toEqual([120, 160]);
    });

    it('should return a new array and keep the given one untouched', () => {
      const widths = [100, 120];

      expect(removeColWidths(widths, [])).not.toBe(widths);
      expect(widths).toEqual([100, 120]);
    });
  });
});
