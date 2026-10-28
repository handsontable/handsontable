import { Positioner } from '../positioner';

/**
 * `Positioner` places a menu from the room around a point. jsdom lays nothing out, so the menu's width
 * and the viewport's are declared here; the placement arithmetic is what is under test.
 */
describe('Positioner', () => {
  const VIEWPORT_WIDTH = 320;
  let container: HTMLElement;

  /**
   * Declares the width of the menu container and the viewport, and the window's horizontal scroll.
   *
   * @param {number} menuWidth The menu's `offsetWidth`.
   * @param {number} scrollX The window's horizontal scroll offset.
   */
  function layOut(menuWidth: number, scrollX = 0) {
    Object.defineProperty(container, 'offsetWidth', { value: menuWidth, configurable: true });
    Object.defineProperty(window, 'scrollX', { value: scrollX, configurable: true, writable: true });
    Object.defineProperty(document.documentElement, 'clientWidth', {
      value: VIEWPORT_WIDTH,
      configurable: true,
    });
  }

  /**
   * Opens a menu at a point of the viewport and reads where the positioner put its left edge.
   *
   * @param {Positioner} positioner The positioner under test.
   * @param {number} left The point's x in viewport coordinates.
   * @returns {number} The menu's `style.left`, in page coordinates.
   */
  function leftAfterOpeningAt(positioner: Positioner, left: number) {
    positioner.setElement(container).updatePosition({ top: 100, left });

    return Number.parseFloat(container.style.left);
  }

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
    delete (document.documentElement as { clientWidth?: number }).clientWidth;
    Object.defineProperty(window, 'scrollX', { value: 0, configurable: true, writable: true });
  });

  describe('keeping a menu inside the viewport', () => {
    it('should leave a menu that fits on the inline-end side where the right-side placement put it', () => {
      layOut(200);

      expect(leftAfterOpeningAt(new Positioner(true), 10)).toBe(10);
    });

    it('should pull a menu that fits on neither side back to the left edge in LTR', () => {
      layOut(200);

      // 150 + 200 passes the viewport on the right, and 150 - 200 starts left of it.
      expect(leftAfterOpeningAt(new Positioner(true), 150)).toBe(0);
    });

    it('should pull a menu that fits on neither side back to the right edge in RTL', () => {
      container.dir = 'rtl';
      layOut(200);

      // 150 is less than the menu's width, so there is no room on the left, and 150 + 200 passes the right edge.
      expect(leftAfterOpeningAt(new Positioner(true), 150)).toBe(VIEWPORT_WIDTH - 200);
    });

    it('should keep the left edge of a menu wider than the viewport in LTR', () => {
      layOut(400);

      expect(leftAfterOpeningAt(new Positioner(true), 150)).toBe(0);
    });

    it('should keep the right edge of a menu wider than the viewport in RTL', () => {
      container.dir = 'rtl';
      layOut(400);

      expect(leftAfterOpeningAt(new Positioner(true), 150)).toBe(VIEWPORT_WIDTH - 400);
    });

    it('should measure the viewport from the window\'s scroll offset', () => {
      layOut(200, 1000);

      // The point is 150px into the viewport, which is 1150 in the page, and the viewport starts at 1000.
      expect(leftAfterOpeningAt(new Positioner(true), 150)).toBe(1000);
    });

    it('should measure the viewport from a negative scroll offset in an RTL document', () => {
      container.dir = 'rtl';
      layOut(200, -1000);

      // The viewport spans -1000 to -680, so the menu's right edge may not pass -680.
      expect(leftAfterOpeningAt(new Positioner(true), 150)).toBe(-1000 + VIEWPORT_WIDTH - 200);
    });

    it('should not move a menu when the viewport is not kept', () => {
      layOut(200);

      expect(leftAfterOpeningAt(new Positioner(false), 150)).toBe(150);
    });
  });
});
