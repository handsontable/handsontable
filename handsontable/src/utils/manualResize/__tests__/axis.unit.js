import { COLUMN_RESIZE_AXIS, ROW_RESIZE_AXIS } from '../axis';

/**
 * Most axis entries are naming. These pin the two that hold logic a refactor can quietly break, and that
 * no other test reaches directly: which headers may show the handle, and the size the resize hooks report.
 */
describe('manual resize axes', () => {
  function header(colspan) {
    const th = document.createElement('th');

    if (colspan !== undefined) {
      th.setAttribute('colspan', colspan);
    }

    return th;
  }

  function hotRenderingRowAt(renderedHeight) {
    return { view: { _wt: { wtTable: { getRowHeight: () => renderedHeight } } } };
  }

  describe('canResizeHeader', () => {
    it('should let a column header spanning one column show the handle', () => {
      expect(COLUMN_RESIZE_AXIS.canResizeHeader(header())).toBe(true);
      expect(COLUMN_RESIZE_AXIS.canResizeHeader(header('1'))).toBe(true);
    });

    it('should refuse a column header spanning several columns, which has no single column to resize', () => {
      expect(COLUMN_RESIZE_AXIS.canResizeHeader(header('2'))).toBe(false);
    });

    it('should let every row header show the handle', () => {
      expect(ROW_RESIZE_AXIS.canResizeHeader(header('2'))).toBe(true);
    });
  });

  describe('getHookSize', () => {
    it('should report the rendered height when a row renders taller than it was dragged, because rows can only grow', () => {
      expect(ROW_RESIZE_AXIS.getHookSize(hotRenderingRowAt(45), 2, 30)).toBe(45);
    });

    it('should report the dragged height when a row renders no taller than it was dragged', () => {
      expect(ROW_RESIZE_AXIS.getHookSize(hotRenderingRowAt(45), 2, 60)).toBe(60);
      expect(ROW_RESIZE_AXIS.getHookSize(hotRenderingRowAt(undefined), 2, 30)).toBe(30);
    });

    it('should report no row height before anything was dragged', () => {
      expect(ROW_RESIZE_AXIS.getHookSize(hotRenderingRowAt(45), 2, null)).toBe(null);
    });

    it('should report the stored width unchanged, because a width is final', () => {
      expect(COLUMN_RESIZE_AXIS.getHookSize(hotRenderingRowAt(45), 2, 30)).toBe(30);
    });
  });
});
