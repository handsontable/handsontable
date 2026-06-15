import {
  VIEWPORT_MARGIN,
  shrinkSizeToViewport,
  clampPositionToViewport,
} from 'handsontable/plugins/comments/viewport';

describe('Comments / viewport helpers', () => {
  describe('shrinkSizeToViewport', () => {
    it('returns the input size unchanged when it fits with margin', () => {
      const result = shrinkSizeToViewport(
        { width: 200, height: 100 },
        { innerWidth: 800, innerHeight: 600 }
      );

      expect(result).toEqual({ width: 200, height: 100 });
    });

    it('caps the width to innerWidth minus 2*margin', () => {
      const result = shrinkSizeToViewport(
        { width: 9999, height: 100 },
        { innerWidth: 320, innerHeight: 600 }
      );

      expect(result.width).toBe(320 - (2 * VIEWPORT_MARGIN));
      expect(result.height).toBe(100);
    });

    it('caps the height to innerHeight minus 2*margin', () => {
      const result = shrinkSizeToViewport(
        { width: 100, height: 9999 },
        { innerWidth: 800, innerHeight: 400 }
      );

      expect(result.width).toBe(100);
      expect(result.height).toBe(400 - (2 * VIEWPORT_MARGIN));
    });

    it('clamps to 0 when the viewport is smaller than 2*margin', () => {
      const result = shrinkSizeToViewport(
        { width: 100, height: 100 },
        { innerWidth: 4, innerHeight: 4 }
      );

      expect(result).toEqual({ width: 0, height: 0 });
    });

    it('honors a custom margin', () => {
      const result = shrinkSizeToViewport(
        { width: 500, height: 500 },
        { innerWidth: 320, innerHeight: 240 },
        16
      );

      expect(result).toEqual({ width: 288, height: 208 });
    });

    it('subtracts the vertical scrollbar width from the width cap', () => {
      const result = shrinkSizeToViewport(
        { width: 9999, height: 100 },
        { innerWidth: 1024, innerHeight: 768, verticalScrollbarWidth: 17 }
      );

      expect(result.width).toBe(1024 - 17 - (2 * VIEWPORT_MARGIN));
    });

    it('subtracts the horizontal scrollbar width from the height cap', () => {
      const result = shrinkSizeToViewport(
        { width: 100, height: 9999 },
        { innerWidth: 1024, innerHeight: 768, horizontalScrollbarWidth: 17 }
      );

      expect(result.height).toBe(768 - 17 - (2 * VIEWPORT_MARGIN));
    });
  });

  describe('clampPositionToViewport', () => {
    const viewport = {
      innerWidth: 800,
      innerHeight: 600,
      scrollX: 0,
      scrollY: 0,
      verticalScrollbarWidth: 0,
      horizontalScrollbarWidth: 0,
    };

    it('returns the input position unchanged when the rect fits', () => {
      const result = clampPositionToViewport(
        { x: 100, y: 100, width: 200, height: 100 },
        viewport
      );

      expect(result).toEqual({ x: 100, y: 100 });
    });

    it('clamps x to the left margin when negative', () => {
      const result = clampPositionToViewport(
        { x: -50, y: 100, width: 200, height: 100 },
        viewport
      );

      expect(result.x).toBe(VIEWPORT_MARGIN);
    });

    it('clamps x to the right edge minus margin when off-right', () => {
      const result = clampPositionToViewport(
        { x: 700, y: 100, width: 200, height: 100 },
        viewport
      );

      expect(result.x).toBe(800 - 200 - VIEWPORT_MARGIN);
    });

    it('clamps y to the top margin when negative', () => {
      const result = clampPositionToViewport(
        { x: 100, y: -50, width: 200, height: 100 },
        viewport
      );

      expect(result.y).toBe(VIEWPORT_MARGIN);
    });

    it('clamps y to the bottom edge minus margin when off-bottom', () => {
      const result = clampPositionToViewport(
        { x: 100, y: 550, width: 200, height: 100 },
        viewport
      );

      expect(result.y).toBe(600 - 100 - VIEWPORT_MARGIN);
    });

    it('subtracts verticalScrollbarWidth from the right bound', () => {
      const result = clampPositionToViewport(
        { x: 700, y: 100, width: 200, height: 100 },
        { ...viewport, verticalScrollbarWidth: 17 }
      );

      expect(result.x).toBe(800 - 17 - 200 - VIEWPORT_MARGIN);
    });

    it('subtracts horizontalScrollbarWidth from the bottom bound', () => {
      const result = clampPositionToViewport(
        { x: 100, y: 550, width: 200, height: 100 },
        { ...viewport, horizontalScrollbarWidth: 17 }
      );

      expect(result.y).toBe(600 - 17 - 100 - VIEWPORT_MARGIN);
    });

    it('respects non-zero scrollX / scrollY', () => {
      const result = clampPositionToViewport(
        { x: 50, y: 50, width: 200, height: 100 },
        { ...viewport, scrollX: 500, scrollY: 300 }
      );

      expect(result.x).toBe(500 + VIEWPORT_MARGIN);
      expect(result.y).toBe(300 + VIEWPORT_MARGIN);
    });

    it('prefers minX when rect is wider than the available viewport', () => {
      const result = clampPositionToViewport(
        { x: 500, y: 100, width: 5000, height: 100 },
        viewport
      );

      expect(result.x).toBe(VIEWPORT_MARGIN);
    });
  });
});
