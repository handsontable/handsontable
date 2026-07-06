import { getRowBorderCompensation, getBoxAdjustedRowHeight } from '../../../src/axisSizing/boxModel';

// `isBorderBox` is the theme axis: the classic theme uses content-box cells (compensation 1), the new
// themes use border-box cells (compensation 0). Both values are exercised here.
describe('boxModel', () => {
  describe('getRowBorderCompensation', () => {
    it('should compensate 1px in content-box mode (classic theme)', () => {
      expect(getRowBorderCompensation(false)).toBe(1);
    });

    it('should not compensate in border-box mode (new themes)', () => {
      expect(getRowBorderCompensation(true)).toBe(0);
    });
  });

  describe('getBoxAdjustedRowHeight', () => {
    it('should subtract the 1px top border in content-box mode', () => {
      expect(getBoxAdjustedRowHeight(23, false)).toBe(22);
      expect(getBoxAdjustedRowHeight(100, false)).toBe(99);
    });

    it('should write the logical height unchanged in border-box mode', () => {
      expect(getBoxAdjustedRowHeight(23, true)).toBe(23);
      expect(getBoxAdjustedRowHeight(100, true)).toBe(100);
    });

    it('should keep the rendered row occupying the logical height once the 1px border is added back', () => {
      // Content-box: renderer writes `logical - 1`, the 1px top border restores the total to `logical`.
      const logical = 40;
      const contentBoxWritten = getBoxAdjustedRowHeight(logical, false);

      expect(contentBoxWritten + getRowBorderCompensation(false)).toBe(logical);

      // Border-box: the border is inside the written height, so it already equals `logical`.
      const borderBoxWritten = getBoxAdjustedRowHeight(logical, true);

      expect(borderBoxWritten + getRowBorderCompensation(true)).toBe(logical);
    });
  });
});
