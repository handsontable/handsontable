import { getElementScaleFactor, normalizeVisualDelta } from 'handsontable/plugins/manualColumnResize/utils';

describe('manualColumnResize/utils', () => {
  describe('getElementScaleFactor', () => {
    it('should return a horizontal scale factor', () => {
      const elementMock = {
        offsetWidth: 200,
        getBoundingClientRect() {
          return {
            width: 100,
            height: 40,
          };
        },
      };

      expect(getElementScaleFactor(elementMock)).toBe(0.5);
    });

    it('should return a vertical scale factor', () => {
      const elementMock = {
        offsetHeight: 100,
        getBoundingClientRect() {
          return {
            width: 120,
            height: 200,
          };
        },
      };

      expect(getElementScaleFactor(elementMock, 'vertical')).toBe(2);
    });

    it('should return 1 when values cannot be used to calculate the factor', () => {
      const elementMock = {
        offsetWidth: 0,
        getBoundingClientRect() {
          return {
            width: 120,
            height: 200,
          };
        },
      };

      expect(getElementScaleFactor(elementMock)).toBe(1);
    });
  });

  describe('normalizeVisualDelta', () => {
    it('should convert delta using the scale factor', () => {
      expect(normalizeVisualDelta(25, 0.5)).toBe(50);
      expect(normalizeVisualDelta(20, 2)).toBe(10);
    });

    it('should return unchanged delta for invalid scale factor', () => {
      expect(normalizeVisualDelta(25, 0)).toBe(25);
      expect(normalizeVisualDelta(25, NaN)).toBe(25);
    });
  });
});
