import { Cursor } from '../../menu/cursor';

describe('ContextMenu', () => {
  describe('Cursor', () => {
    it('should initialize internal properties on construct (object literal)', () => {
      const coords = {
        top: 10,
        left: 50,
        width: 100,
        height: 200
      };
      const cursor = new Cursor(coords, window);

      expect(cursor.top).toBe(coords.top);
      expect(cursor.topRelative).toBeLessThan(coords.top + 1);
      expect(cursor.left).toBe(coords.left);
      expect(cursor.leftRelative).toBeLessThan(coords.left + 1);
      expect(cursor.scrollLeft).toBeGreaterThan(-1);
      expect(cursor.scrollTop).toBeGreaterThan(-1);
      expect(cursor.cellHeight).toBe(coords.height);
      expect(cursor.cellWidth).toBe(coords.width);
    });

    it('should returns boolean value related to if element fits above the cursor', () => {
      const coords = {
        top: 10,
        left: 50,
        width: 100,
        height: 200
      };
      const cursor = new Cursor(coords, window);
      const fakeElement = {
        offsetHeight: 9
      };

      expect(cursor.fitsAbove(fakeElement)).toBe(true);

      fakeElement.offsetHeight = 10;

      expect(cursor.fitsAbove(fakeElement)).toBe(true);

      fakeElement.offsetHeight = 11;

      expect(cursor.fitsAbove(fakeElement)).toBe(false);
    });

    it('should returns boolean value related to if element fits below the cursor', () => {
      const coords = {
        top: 10,
        left: 50,
        width: 100,
        height: 200
      };
      const cursor = new Cursor(coords, window);
      const fakeElement = {
        offsetHeight: 9
      };
      const viewportHeight = 100;

      expect(cursor.fitsBelow(fakeElement, viewportHeight)).toBe(true);

      fakeElement.offsetHeight = 90;

      expect(cursor.fitsBelow(fakeElement, viewportHeight)).toBe(true);

      fakeElement.offsetHeight = 91;

      expect(cursor.fitsBelow(fakeElement, viewportHeight)).toBe(false);
    });

    it('should returns boolean value related to if element fits on the right of the cursor', () => {
      const coords = {
        top: 10,
        left: 20,
        width: 30,
        height: 200
      };
      const cursor = new Cursor(coords, window);
      const fakeElement = {
        offsetWidth: 9
      };
      const viewportWidth = 100;

      expect(cursor.fitsOnRight(fakeElement, viewportWidth)).toBe(true);

      fakeElement.offsetWidth = 50;

      expect(cursor.fitsOnRight(fakeElement, viewportWidth)).toBe(true);

      fakeElement.offsetWidth = 51;

      expect(cursor.fitsOnRight(fakeElement, viewportWidth)).toBe(false);
    });

    it('should returns boolean value related to if element fits on the left of the cursor', () => {
      const coords = {
        top: 10,
        left: 50,
        width: 100,
        height: 200
      };
      const cursor = new Cursor(coords, window);
      const fakeElement = {
        offsetWidth: 9
      };

      expect(cursor.fitsOnLeft(fakeElement)).toBe(true);

      fakeElement.offsetWidth = 50;

      expect(cursor.fitsOnLeft(fakeElement)).toBe(true);

      fakeElement.offsetWidth = 51;

      expect(cursor.fitsOnLeft(fakeElement)).toBe(false);
    });
  });
});
