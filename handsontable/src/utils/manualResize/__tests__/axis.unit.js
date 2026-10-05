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

  describe('the frozen end columns (the top inline-end corner overlay)', () => {
    function hotWithEndCorner(cornerHeader, { clone = true, horizontalScroll = true } = {}) {
      const position = { top: 1, start: 2 };
      const topInlineEndCornerOverlay = {
        clone: clone ?
          { wtTable: { THEAD: document.createElement('thead'), holder: document.createElement('div') } } : undefined,
        getRelativeCellPosition: jest.fn(() => position),
      };

      if (cornerHeader && clone) {
        topInlineEndCornerOverlay.clone.wtTable.holder.appendChild(cornerHeader);
      }

      const startCorner = {
        clone: { wtTable: { THEAD: document.createElement('thead') } },
        getRelativeCellPosition: jest.fn(),
      };
      const topOverlay = {
        clone: { wtTable: { THEAD: document.createElement('thead') } },
        getRelativeCellPosition: jest.fn(),
      };

      return {
        position,
        topInlineEndCornerOverlay,
        topOverlay,
        hot: {
          view: {
            _wt: {
              getSetting: () => 0,
              wtViewport: { hasHorizontalScroll: () => horizontalScroll },
              wtOverlays: { topOverlay, topInlineStartCornerOverlay: startCorner, topInlineEndCornerOverlay },
            },
          },
        },
      };
    }

    it('should position the handle of a header of the end corner against that corner', () => {
      const endHeader = header();
      const { hot, position, topInlineEndCornerOverlay, topOverlay } = hotWithEndCorner(endHeader);

      expect(COLUMN_RESIZE_AXIS.getHeaderPosition(hot, endHeader, { row: -1, col: 28 })).toBe(position);
      expect(topInlineEndCornerOverlay.getRelativeCellPosition).toHaveBeenCalledWith(endHeader, -1, 28);
      expect(topOverlay.getRelativeCellPosition).not.toHaveBeenCalled();
    });

    it('should recognize the head of the end corner as a header of the column axis', () => {
      const { hot, topInlineEndCornerOverlay } = hotWithEndCorner(null);
      const inside = document.createElement('th');

      topInlineEndCornerOverlay.clone.wtTable.THEAD.appendChild(inside);
      hot.rootElement = document.body;
      document.body.appendChild(topInlineEndCornerOverlay.clone.wtTable.THEAD);

      expect(COLUMN_RESIZE_AXIS.isHeaderElement(hot, inside)).toBe(true);

      topInlineEndCornerOverlay.clone.wtTable.THEAD.remove();
    });

    it('should anchor only the headers rendered by the end corner to the inline end', () => {
      const endHeader = header();
      const { hot } = hotWithEndCorner(endHeader);

      expect(COLUMN_RESIZE_AXIS.isAnchoredAtInlineEnd(hot, endHeader)).toBe(true);
      expect(COLUMN_RESIZE_AXIS.isAnchoredAtInlineEnd(hot, header())).toBe(false);
    });

    it('should not anchor the end headers while the columns do not fill the holder', () => {
      // The end columns rest against the last column then: there is no inline-end edge to keep.
      const endHeader = header();
      const { hot } = hotWithEndCorner(endHeader, { horizontalScroll: false });

      expect(COLUMN_RESIZE_AXIS.isAnchoredAtInlineEnd(hot, endHeader)).toBe(false);
    });

    it('should not anchor any header when the grid has no end columns', () => {
      const { hot } = hotWithEndCorner(null, { clone: false });

      expect(COLUMN_RESIZE_AXIS.isAnchoredAtInlineEnd(hot, header())).toBe(false);
    });

    it('should not anchor a row header', () => {
      expect(ROW_RESIZE_AXIS.isAnchoredAtInlineEnd).toBeUndefined();
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
