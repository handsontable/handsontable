import {
  getEditorAnchorHeight,
  getEditorAnchorWidth,
  getSelectionBorderOverhang,
  hasCommentAtCell,
  hasCommentInMeta,
} from 'handsontable/plugins/comments/utils';

describe('Comments', () => {
  describe('getEditorAnchorWidth', () => {
    it('should use the renderable column width for non-merged cells', () => {
      const TD = {
        offsetWidth: 80,
      };

      expect(getEditorAnchorWidth(1, TD, 80)).toBe(80);
    });

    it('should use merged TD width for cells with meta colspan larger than 1', () => {
      const TD = {
        offsetWidth: 160,
      };

      expect(getEditorAnchorWidth(3, TD, 80)).toBe(160);
    });
  });

  describe('getEditorAnchorHeight', () => {
    it('should use the rendered cell height for a cell with meta rowspan larger than 1', () => {
      expect(getEditorAnchorHeight(2, 58)).toBe(58);
      expect(getEditorAnchorHeight(4, 116)).toBe(116);
    });

    it('should leave the default height for a cell that spans one row', () => {
      expect(getEditorAnchorHeight(1, 29)).toBeUndefined();
    });

    it('should leave the default height when the cell has no measurable height', () => {
      expect(getEditorAnchorHeight(3, 0)).toBeUndefined();
    });
  });

  describe('hasCommentInMeta', () => {
    it('should be true for a comment with a value', () => {
      expect(hasCommentInMeta({ comment: { value: 'note' } })).toBe(true);
    });

    it('should be false when the cell has no comment meta', () => {
      expect(hasCommentInMeta({})).toBe(false);
    });

    it('should be false for comment meta without a value', () => {
      expect(hasCommentInMeta({ comment: { readOnly: true } })).toBe(false);
    });

    it('should be false for a hidden cell under a merged block', () => {
      expect(hasCommentInMeta({ hidden: true, comment: { value: 'note' } })).toBe(false);
    });
  });

  describe('hasCommentAtCell', () => {
    // Only (1, 3) holds a comment, off the diagonal, so a row/column swap reads (3, 1) and misses it.
    const hot = {
      getCellMetaTransient: jest.fn((row, col) => (row === 1 && col === 3 ? { comment: { value: 'note' } } : {})),
    };

    it('should read the meta of the cell it is asked about', () => {
      expect(hasCommentAtCell(hot, 1, 3)).toBe(true);
      expect(hot.getCellMetaTransient).toHaveBeenLastCalledWith(1, 3);
    });

    it('should be false for the transposed cell', () => {
      expect(hasCommentAtCell(hot, 3, 1)).toBe(false);
    });
  });

  describe('getSelectionBorderOverhang', () => {
    const MAX = 1;
    let spreader;
    let cell;

    // jsdom lays nothing out, so every box is stated.
    const place = (element, { left, top, width, height }) => {
      element.getBoundingClientRect = () => ({
        left, top, width, height, right: left + width, bottom: top + height,
      });
    };
    const addEdge = (className, box) => {
      const edge = document.createElement('div');

      edge.className = `wtBorder ${className}`;
      place(edge, box);
      spreader.querySelector('.htBorders').appendChild(edge);

      return edge;
    };

    beforeEach(() => {
      spreader = document.createElement('div');
      spreader.className = 'wtSpreader';
      spreader.innerHTML = '<table><tbody><tr><td></td></tr></tbody></table><div class="htBorders"></div>';
      document.body.appendChild(spreader);

      cell = spreader.querySelector('td');
      place(cell, { left: 100, top: 50, width: 80, height: 29 });
    });

    afterEach(() => {
      spreader.remove();
    });

    it('should be 0 for a cell outside any spreader', () => {
      const lone = document.createElement('td');

      expect(getSelectionBorderOverhang(lone, MAX)).toBe(0);
    });

    it('should be 0 when no border is drawn', () => {
      expect(getSelectionBorderOverhang(cell, MAX)).toBe(0);
    });

    it('should be 0 when the only border edges are hidden', () => {
      addEdge('current', { left: 0, top: 0, width: 0, height: 0 });

      expect(getSelectionBorderOverhang(cell, MAX)).toBe(0);
    });

    it('should be the gap between the top edge of the border and the top edge of the cell', () => {
      addEdge('current', { left: 99, top: 49, width: 82, height: 2 });
      addEdge('current', { left: 99, top: 49, width: 2, height: 31 });

      expect(getSelectionBorderOverhang(cell, MAX)).toBe(1);
    });

    it('should be 0 when the border sits on the top edge of the cell', () => {
      addEdge('current', { left: 99, top: 50, width: 82, height: 2 });
      addEdge('current', { left: 99, top: 50, width: 2, height: 30 });

      expect(getSelectionBorderOverhang(cell, MAX)).toBe(0);
    });

    it('should not be negative when the border starts below the top edge of the cell', () => {
      addEdge('current', { left: 99, top: 40, width: 2, height: 60 });
      place(cell, { left: 100, top: 38, width: 80, height: 29 });
      // The cell's center (y 52.5) is inside the border box (y 40 to 100), its top (38) is above the border's top.

      expect(getSelectionBorderOverhang(cell, MAX)).toBe(0);
    });

    it('should not be more than the given maximum', () => {
      addEdge('current', { left: 99, top: 45, width: 82, height: 40 });

      expect(getSelectionBorderOverhang(cell, MAX)).toBe(1);
      expect(getSelectionBorderOverhang(cell, 10)).toBe(5);
    });

    it('should be 0 when the border belongs to another cell', () => {
      addEdge('current', { left: 179, top: 49, width: 82, height: 31 });

      expect(getSelectionBorderOverhang(cell, MAX)).toBe(0);
    });

    it('should leave out the corner handle and the borders that are not the focus highlight', () => {
      addEdge('current corner', { left: 95, top: 40, width: 8, height: 8 });
      addEdge('area', { left: 99, top: 49, width: 82, height: 31 });

      expect(getSelectionBorderOverhang(cell, MAX)).toBe(0);
    });
  });
});
