import { getEditorAnchorWidth } from 'handsontable/plugins/comments/utils';

describe('Comments', () => {
  describe('getEditorAnchorWidth', () => {
    it('should use the renderable column width for non-merged cells', () => {
      const TD = {
        colSpan: 1,
        offsetWidth: 160,
      };

      expect(getEditorAnchorWidth(TD, 80)).toBe(80);
    });

    it('should use merged TD width for cells with colSpan larger than 1', () => {
      const TD = {
        colSpan: 3,
        offsetWidth: 160,
      };

      expect(getEditorAnchorWidth(TD, 80)).toBe(160);
    });
  });
});
