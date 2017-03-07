import {
  isKey,
} from 'handsontable/helpers/unicode';

describe('Unicode helper', () => {
  //
  // Handsontable.helper.isKey
  //
  describe('isKey', () => {
    it('should be defined', () => {
      expect(isKey).toBeDefined();
    });

    it('should return true when base code is defined individually', () => {
      expect(isKey(39, 'ARROW_RIGHT')).toBe(true);

      expect(isKey('39', 'ARROW_RIGHT')).toBe(false);
      expect(isKey(30, 'ARROW_RIGHT')).toBe(false);
    });

    it('should return true when base code is defined many times', () => {
      expect(isKey(39, 'ARROW_RIGHT|ARROW_UP|ARROW_DOWN')).toBe(true);
      expect(isKey(38, 'ARROW_RIGHT|ARROW_UP|ARROW_DOWN')).toBe(true);
      expect(isKey(40, 'ARROW_RIGHT|ARROW_UP|ARROW_DOWN')).toBe(true);

      expect(isKey(37, 'ARROW_RIGHT|ARROW_UP|ARROW_BOTTOM')).toBe(false);
      expect(isKey('39', 'ARROW_RIGHT|ARROW_UP|ARROW_BOTTOM')).toBe(false);
      expect(isKey(116, 'ARROW_RIGHT|ARROW_UP|ARROW_BOTTOM')).toBe(false);
    });
  });
});
