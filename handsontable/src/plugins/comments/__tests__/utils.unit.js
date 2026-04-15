import { getEditorAnchorWidth } from 'handsontable/plugins/comments/utils';

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
});
