import { Positioner } from '../positioner';

/**
 * `Positioner` places a menu from the room around a point. jsdom lays nothing out, so the menu's width
 * and the viewport's are declared here; the placement arithmetic is what is under test.
 */
describe('Positioner', () => {
  const VIEWPORT_WIDTH = 320;
  const VIEWPORT_HEIGHT = 390;
  let container: HTMLElement;

  /**
   * Declares the width of the menu container and the viewport, and the window's horizontal scroll. The
   * menu's own direction is set on the container, the document's on the root element.
   *
   * @param {number} menuWidth The menu's `offsetWidth`.
   * @param {number} scrollX The window's horizontal scroll offset.
   * @param {'ltr' | 'rtl'} documentDir The direction of the document, which decides the way it scrolls.
   */
  function layOut(menuWidth: number, scrollX = 0, documentDir: 'ltr' | 'rtl' = 'ltr') {
    document.documentElement.style.direction = documentDir;
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

  /**
   * Declares the height of the menu container and the viewport, and the window's vertical scroll. The
   * viewport is `VIEWPORT_WIDTH` wide and the menu has no width, so the horizontal clamp has nothing to
   * move and only `style.top` is under test.
   *
   * @param {number} menuHeight The menu's `offsetHeight`.
   * @param {number} scrollY The window's vertical scroll offset.
   */
  function layOutVertically(menuHeight: number, scrollY = 0) {
    Object.defineProperty(container, 'offsetHeight', { value: menuHeight, configurable: true });
    Object.defineProperty(window, 'scrollY', { value: scrollY, configurable: true, writable: true });
    // `fitsBelow()` picks the side from `innerHeight`, and the clamp holds the menu to `clientHeight`.
    Object.defineProperty(window, 'innerHeight', { value: VIEWPORT_HEIGHT, configurable: true, writable: true });
    Object.defineProperty(document.documentElement, 'clientHeight', {
      value: VIEWPORT_HEIGHT,
      configurable: true,
    });
    Object.defineProperty(document.documentElement, 'clientWidth', {
      value: VIEWPORT_WIDTH,
      configurable: true,
    });
  }

  /**
   * Opens a menu at a point of the viewport and reads where the positioner put its top edge.
   *
   * @param {Positioner} positioner The positioner under test.
   * @param {number} top The point's y in viewport coordinates.
   * @returns {number} The menu's `style.top`, in page coordinates.
   */
  function topAfterOpeningAt(positioner: Positioner, top: number) {
    positioner.setElement(container).updatePosition({ top, left: 10 });

    return Number.parseFloat(container.style.top);
  }

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
    delete (document.documentElement as { clientWidth?: number }).clientWidth;
    delete (document.documentElement as { clientHeight?: number }).clientHeight;
    document.documentElement.style.removeProperty('direction');
    Object.defineProperty(window, 'scrollX', { value: 0, configurable: true, writable: true });
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 768, configurable: true, writable: true });
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
      layOut(200, 0, 'rtl');

      // 150 is less than the menu's width, so there is no room on the left, and 150 + 200 passes the right edge.
      expect(leftAfterOpeningAt(new Positioner(true), 150)).toBe(VIEWPORT_WIDTH - 200);
    });

    it('should keep the left edge of a menu wider than the viewport in LTR', () => {
      layOut(400);

      expect(leftAfterOpeningAt(new Positioner(true), 150)).toBe(0);
    });

    it('should keep the right edge of a menu wider than the viewport in RTL', () => {
      container.dir = 'rtl';
      layOut(400, 0, 'rtl');

      expect(leftAfterOpeningAt(new Positioner(true), 150)).toBe(VIEWPORT_WIDTH - 400);
    });

    it('should keep the left edge of a menu wider than the viewport in an RTL grid on an LTR page', () => {
      container.dir = 'rtl';
      layOut(400);

      // An LTR page can not scroll to a negative x, so the strip left of 0 would be out of reach for good.
      expect(leftAfterOpeningAt(new Positioner(true), 150)).toBe(0);
    });

    it('should keep the right edge of a menu wider than the viewport in an LTR grid on an RTL page', () => {
      layOut(400, 0, 'rtl');

      expect(leftAfterOpeningAt(new Positioner(true), 150)).toBe(VIEWPORT_WIDTH - 400);
    });

    it('should measure the viewport from the window\'s scroll offset', () => {
      layOut(200, 1000);

      // The point is 150px into the viewport, which is 1150 in the page, and the viewport starts at 1000.
      expect(leftAfterOpeningAt(new Positioner(true), 150)).toBe(1000);
    });

    it('should measure the viewport from a negative scroll offset in an RTL document', () => {
      container.dir = 'rtl';
      layOut(200, -1000, 'rtl');

      // The viewport spans -1000 to -680, so the menu's right edge may not pass -680.
      expect(leftAfterOpeningAt(new Positioner(true), 150)).toBe(-1000 + VIEWPORT_WIDTH - 200);
    });

    it('should not move a menu when the viewport is not kept', () => {
      layOut(200);

      expect(leftAfterOpeningAt(new Positioner(false), 150)).toBe(150);
    });
  });

  describe('keeping a menu inside the viewport vertically', () => {
    it('should leave a menu that fits below the point where the below placement put it', () => {
      layOutVertically(200);

      // One pixel under the point, which is the below placement's own offset.
      expect(topAfterOpeningAt(new Positioner(true), 100)).toBe(101);
    });

    it('should leave a menu that fits above the point where the above placement put it', () => {
      layOutVertically(200);

      // 350 + 200 passes the viewport at the bottom, and the menu's bottom edge goes on the point.
      expect(topAfterOpeningAt(new Positioner(true), 350)).toBe(150);
    });

    it('should pull a menu that fits neither below nor above up to the bottom edge', () => {
      layOutVertically(372);

      // 123 + 372 passes the viewport at the bottom, and 123 is less than the menu's height.
      expect(topAfterOpeningAt(new Positioner(true), 123)).toBe(VIEWPORT_HEIGHT - 372);
    });

    it('should keep the top edge of a menu taller than the viewport', () => {
      layOutVertically(542);

      expect(topAfterOpeningAt(new Positioner(true), 27)).toBe(0);
    });

    it('should keep the bottom edge of the menu above a horizontal scrollbar', () => {
      const SCROLLBAR_HEIGHT = 17;

      layOutVertically(372);
      // `innerHeight` still counts the scrollbar, `clientHeight` does not.
      Object.defineProperty(document.documentElement, 'clientHeight', {
        value: VIEWPORT_HEIGHT - SCROLLBAR_HEIGHT,
        configurable: true,
      });

      expect(topAfterOpeningAt(new Positioner(true), 123)).toBe(VIEWPORT_HEIGHT - SCROLLBAR_HEIGHT - 372);
    });

    it('should measure the viewport from the window\'s scroll offset', () => {
      layOutVertically(372, 1000);

      // The point is 123px into the viewport, which is 1123 in the page, and the viewport starts at 1000.
      expect(topAfterOpeningAt(new Positioner(true), 123)).toBe(1000 + VIEWPORT_HEIGHT - 372);
    });

    it('should not move a menu when the viewport is not kept', () => {
      layOutVertically(372);

      expect(topAfterOpeningAt(new Positioner(false), 123)).toBe(124);
    });
  });
});
