import { getEditorAnchorHeight, getEditorAnchorWidth } from 'handsontable/plugins/comments/utils';

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
});
