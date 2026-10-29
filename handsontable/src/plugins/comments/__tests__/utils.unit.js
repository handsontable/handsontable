import {
  getEditorAnchorHeight,
  getEditorAnchorWidth,
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
});
