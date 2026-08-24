import { isLeftClick, isMiddleClick, isRightClick } from '../event';

describe('DOM event helpers', () => {
  describe('isMiddleClick', () => {
    it('should return `true` when the middle mouse button (button 1) is pressed', () => {
      expect(isMiddleClick({ button: 1 })).toBe(true);
    });

    it('should return `false` for the left mouse button (button 0)', () => {
      expect(isMiddleClick({ button: 0 })).toBe(false);
    });

    it('should return `false` for the right mouse button (button 2)', () => {
      expect(isMiddleClick({ button: 2 })).toBe(false);
    });

    it('should not overlap with `isLeftClick` and `isRightClick`', () => {
      const middleClick = { button: 1 };

      expect(isMiddleClick(middleClick)).toBe(true);
      expect(isLeftClick(middleClick)).toBe(false);
      expect(isRightClick(middleClick)).toBe(false);
    });
  });
});
