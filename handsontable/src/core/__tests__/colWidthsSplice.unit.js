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

      expect(removeColWidths(widths, [0])).not.toBe(widths);
      expect(widths).toEqual([100, 120]);
    });

    it('should keep every remaining width at its index in a sparse array', () => {
      // eslint-disable-next-line no-sparse-arrays
      const removed = removeColWidths([, , 30, , , 80], [0]);

      expect(removed.length).toBe(5);
      expect(removed[1]).toBe(30);
      expect(removed[4]).toBe(80);
    });

    it('should return the given array when no removed index names one of its widths', () => {
      const widths = [100, 120];

      expect(removeColWidths(widths, [5, 9])).toBe(widths);
    });
  });
});
