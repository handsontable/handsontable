import { resolveRowspanNavigationContextRow } from '../navigation';

describe('NestedHeaders navigation utils', () => {
  describe('resolveRowspanNavigationContextRow', () => {
    it('should keep current row when it is already top-most', () => {
      const row = resolveRowspanNavigationContextRow(-3, 8, -3, () => undefined);

      expect(row).toBe(-3);
    });

    it('should move to a lower concrete row when available', () => {
      const getHeaderSettings = (headerRow, visualColumn) => {
        if (visualColumn !== 8) {
          return undefined;
        }

        if (headerRow === -1) {
          return {
            isPlaceholder: false,
            isRowspanPlaceholder: false,
            isHidden: false,
          };
        }

        return {
          isPlaceholder: true,
          isRowspanPlaceholder: true,
          isHidden: false,
        };
      };
      const row = resolveRowspanNavigationContextRow(-2, 8, -3, getHeaderSettings);

      expect(row).toBe(-1);
    });

    it('should keep current row when lower rows are placeholders only', () => {
      const getHeaderSettings = (headerRow, visualColumn) => {
        if (visualColumn !== 0 || headerRow !== -1) {
          return undefined;
        }

        return {
          isPlaceholder: true,
          isRowspanPlaceholder: true,
          isHidden: false,
        };
      };
      const row = resolveRowspanNavigationContextRow(-2, 0, -2, getHeaderSettings);

      expect(row).toBe(-2);
    });
  });
});
