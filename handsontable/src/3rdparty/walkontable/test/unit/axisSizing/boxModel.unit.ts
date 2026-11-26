import {
  getRowBorderCompensation,
  getBoxAdjustedRowHeight,
  firstRowTopBorderOutsideHeight,
} from '../../../src/axisSizing/boxModel';

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

  describe('firstRowTopBorderOutsideHeight', () => {
    const emptyHead = document.createElement('thead');
    const filledHead = document.createElement('thead');

    filledHead.appendChild(document.createElement('tr'));

    it.each(['bottom', 'bottom_inline_start_corner', 'bottom_inline_end_corner'])(
      'should draw the line outside the first row of the %s table when it has no head row',
      (name) => {
        expect(firstRowTopBorderOutsideHeight(name, emptyHead, true)).toBe(true);
        expect(firstRowTopBorderOutsideHeight(name, null, true)).toBe(true);
      }
    );

    it.each(['master', 'top', 'inline_start', 'inline_end', 'top_inline_start_corner'])(
      'should leave the %s table alone',
      (name) => {
        expect(firstRowTopBorderOutsideHeight(name, emptyHead, true)).toBe(false);
      }
    );

    it('should leave a table that renders a head row alone', () => {
      expect(firstRowTopBorderOutsideHeight('bottom', filledHead, true)).toBe(false);
    });

    it('should leave content-box cells alone, whose row height already leaves the border out', () => {
      expect(firstRowTopBorderOutsideHeight('bottom', emptyHead, false)).toBe(false);
    });
  });
});
