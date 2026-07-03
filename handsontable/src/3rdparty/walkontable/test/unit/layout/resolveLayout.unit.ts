import { resolveLayout } from '../../../src/layout/resolveLayout';
import type { LayoutInput } from '../../../src/layout/layoutSnapshot';

/**
 * Builds a `LayoutInput` with sane element-mode defaults, overridden per test. Defaults: a 500x400
 * element workspace, a 15px scrollbar, no headers, content that fits both axes, `auto` overflow.
 *
 * @param {Partial<LayoutInput>} overrides The fields to override.
 * @returns {LayoutInput}
 */
function input(overrides: Partial<LayoutInput> = {}): LayoutInput {
  return {
    scrollMode: 'element',
    workspaceWidth: 500,
    workspaceHeight: 400,
    totalContentWidth: 300,
    totalContentHeight: 200,
    scrollbarSize: 15,
    overflowX: 'auto',
    overflowY: 'auto',
    rowHeaderWidth: 0,
    columnHeaderHeight: 0,
    isRtl: false,
    ...overrides,
  };
}

describe('resolveLayout', () => {
  describe('element mode — scrollbar fix-point', () => {
    it('should report no scrollbars when content fits both axes', () => {
      const snapshot = resolveLayout(input());

      expect(snapshot.hasVerticalScroll).toBe(false);
      expect(snapshot.hasHorizontalScroll).toBe(false);
    });

    it('should report a vertical scrollbar only when content is taller but fits in width', () => {
      const snapshot = resolveLayout(input({ totalContentHeight: 900, totalContentWidth: 300 }));

      expect(snapshot.hasVerticalScroll).toBe(true);
      expect(snapshot.hasHorizontalScroll).toBe(false);
    });

    it('should report a horizontal scrollbar only when content is wider but fits in height', () => {
      const snapshot = resolveLayout(input({ totalContentWidth: 900, totalContentHeight: 200 }));

      expect(snapshot.hasVerticalScroll).toBe(false);
      expect(snapshot.hasHorizontalScroll).toBe(true);
    });

    it('should report both scrollbars when content overflows both axes', () => {
      const snapshot = resolveLayout(input({ totalContentWidth: 900, totalContentHeight: 900 }));

      expect(snapshot.hasVerticalScroll).toBe(true);
      expect(snapshot.hasHorizontalScroll).toBe(true);
    });

    it('should induce a vertical scrollbar when a horizontal one steals the last of the height', () => {
      // Height fits the raw box (390 <= 400) but not once a horizontal scrollbar takes 15px
      // (390 > 385). Width overflows, so the horizontal scrollbar appears and forces the vertical.
      const snapshot = resolveLayout(input({
        totalContentHeight: 390,
        totalContentWidth: 900,
      }));

      expect(snapshot.hasHorizontalScroll).toBe(true);
      expect(snapshot.hasVerticalScroll).toBe(true);
    });

    it('should induce a horizontal scrollbar when a vertical one steals the last of the width', () => {
      // Width fits the raw box (490 <= 500) but not once a vertical scrollbar takes 15px (490 > 485).
      // Height overflows, so the vertical scrollbar appears and forces the horizontal.
      const snapshot = resolveLayout(input({
        totalContentWidth: 490,
        totalContentHeight: 900,
      }));

      expect(snapshot.hasVerticalScroll).toBe(true);
      expect(snapshot.hasHorizontalScroll).toBe(true);
    });

    it('should NOT induce a horizontal scrollbar when the width still fits under a vertical one', () => {
      // Width fits even after a vertical scrollbar (480 <= 485); only the vertical appears.
      const snapshot = resolveLayout(input({
        totalContentWidth: 480,
        totalContentHeight: 900,
      }));

      expect(snapshot.hasVerticalScroll).toBe(true);
      expect(snapshot.hasHorizontalScroll).toBe(false);
    });
  });

  describe('element mode — forced and suppressed overflow', () => {
    it('should force a vertical scrollbar when overflowY is "scroll" even if content fits', () => {
      const snapshot = resolveLayout(input({ overflowY: 'scroll' }));

      expect(snapshot.hasVerticalScroll).toBe(true);
      expect(snapshot.hasHorizontalScroll).toBe(false);
    });

    it('should force a horizontal scrollbar when overflowX is "scroll" even if content fits', () => {
      const snapshot = resolveLayout(input({ overflowX: 'scroll' }));

      expect(snapshot.hasHorizontalScroll).toBe(true);
      expect(snapshot.hasVerticalScroll).toBe(false);
    });

    it('should suppress the vertical scrollbar when overflowY is "hidden" despite tall content', () => {
      const snapshot = resolveLayout(input({ overflowY: 'hidden', totalContentHeight: 900 }));

      expect(snapshot.hasVerticalScroll).toBe(false);
    });

    it('should suppress the horizontal scrollbar when overflowX is "hidden" despite wide content', () => {
      const snapshot = resolveLayout(input({ overflowX: 'hidden', totalContentWidth: 900 }));

      expect(snapshot.hasHorizontalScroll).toBe(false);
    });

    it('should not induce a hidden vertical scrollbar via horizontal overflow', () => {
      const snapshot = resolveLayout(input({
        overflowY: 'hidden',
        totalContentHeight: 390,
        totalContentWidth: 900,
      }));

      expect(snapshot.hasHorizontalScroll).toBe(true);
      expect(snapshot.hasVerticalScroll).toBe(false);
    });
  });

  describe('element mode — overlay scrollbars (zero thickness)', () => {
    it('should never induce the opposite scrollbar when scrollbarSize is 0', () => {
      // Content exactly equals the box on width; a 0px vertical scrollbar cannot push it over.
      const snapshot = resolveLayout(input({
        scrollbarSize: 0,
        totalContentWidth: 500,
        totalContentHeight: 900,
      }));

      expect(snapshot.hasVerticalScroll).toBe(true);
      expect(snapshot.hasHorizontalScroll).toBe(false);
    });
  });

  describe('derived boxes', () => {
    it('should subtract the scrollbar from the inner box only on the present axis', () => {
      const snapshot = resolveLayout(input({ totalContentHeight: 900 })); // vertical only

      expect(snapshot.hasVerticalScroll).toBe(true);
      expect(snapshot.innerWidth).toBe(485); // 500 - 15
      expect(snapshot.innerHeight).toBe(400); // no horizontal scrollbar
    });

    it('should derive the viewport box by removing the headers from the inner box', () => {
      const snapshot = resolveLayout(input({ rowHeaderWidth: 50, columnHeaderHeight: 26 }));

      expect(snapshot.viewportWidth).toBe(450); // 500 - 50
      expect(snapshot.viewportHeight).toBe(374); // 400 - 26
    });

    it('should set the hider extents to the total content size', () => {
      const snapshot = resolveLayout(input({ totalContentWidth: 300, totalContentHeight: 200 }));

      expect(snapshot.hiderWidth).toBe(300);
      expect(snapshot.hiderHeight).toBe(200);
    });

    it('should return a frozen snapshot', () => {
      const snapshot = resolveLayout(input());

      expect(Object.isFrozen(snapshot)).toBe(true);
    });
  });

  describe('render band vs visible band viewport', () => {
    it('should keep render and visible viewports equal when no scrollbar is present', () => {
      const snapshot = resolveLayout(input({ rowHeaderWidth: 50, columnHeaderHeight: 26 }));

      expect(snapshot.hasVerticalScroll).toBe(false);
      expect(snapshot.hasHorizontalScroll).toBe(false);
      expect(snapshot.renderViewportWidth).toBe(snapshot.visibleViewportWidth);
      expect(snapshot.renderViewportHeight).toBe(snapshot.visibleViewportHeight);
      // Both equal workspace minus header on each axis.
      expect(snapshot.renderViewportWidth).toBe(450); // 500 - 50
      expect(snapshot.renderViewportHeight).toBe(374); // 400 - 26
    });

    it('should keep the render viewport height scrollbar-unaware when a horizontal scrollbar is present', () => {
      // Wide content forces a horizontal scrollbar, which eats height from the visible band only.
      const snapshot = resolveLayout(input({ totalContentWidth: 900, columnHeaderHeight: 26 }));

      expect(snapshot.hasHorizontalScroll).toBe(true);
      // Render band ignores the scrollbar: workspace - header.
      expect(snapshot.renderViewportHeight).toBe(374); // 400 - 26
      // Visible band subtracts the scrollbar: workspace - header - scrollbar.
      expect(snapshot.visibleViewportHeight).toBe(359); // 400 - 26 - 15
      expect(snapshot.renderViewportHeight - snapshot.visibleViewportHeight).toBe(15);
      // The width axis has no scrollbar, so its two viewports match.
      expect(snapshot.renderViewportWidth).toBe(snapshot.visibleViewportWidth);
    });

    it('should keep the render viewport width scrollbar-unaware when a vertical scrollbar is present', () => {
      // Tall content forces a vertical scrollbar, which eats width from the visible band only.
      const snapshot = resolveLayout(input({ totalContentHeight: 900, rowHeaderWidth: 50 }));

      expect(snapshot.hasVerticalScroll).toBe(true);
      // Render band ignores the scrollbar: workspace - header.
      expect(snapshot.renderViewportWidth).toBe(450); // 500 - 50
      // Visible band subtracts the scrollbar: workspace - header - scrollbar.
      expect(snapshot.visibleViewportWidth).toBe(435); // 500 - 50 - 15
      expect(snapshot.renderViewportWidth - snapshot.visibleViewportWidth).toBe(15);
      // The height axis has no scrollbar, so its two viewports match.
      expect(snapshot.renderViewportHeight).toBe(snapshot.visibleViewportHeight);
    });

    it('should keep the visible band equal to the legacy viewport box on both axes', () => {
      const snapshot = resolveLayout(input({
        totalContentWidth: 900,
        totalContentHeight: 900,
        rowHeaderWidth: 50,
        columnHeaderHeight: 26,
      }));

      expect(snapshot.hasVerticalScroll).toBe(true);
      expect(snapshot.hasHorizontalScroll).toBe(true);
      expect(snapshot.visibleViewportWidth).toBe(snapshot.viewportWidth);
      expect(snapshot.visibleViewportHeight).toBe(snapshot.viewportHeight);
    });
  });

  describe('window mode', () => {
    /**
     * Builds a window-mode input with a document context, overridable.
     *
     * @param {Partial<LayoutInput>} overrides Top-level overrides.
     * @param {Partial<LayoutInput['windowContext']>} contextOverrides Window-context overrides.
     * @returns {LayoutInput}
     */
    function windowInput(
      overrides: Partial<LayoutInput> = {},
      contextOverrides: Partial<NonNullable<LayoutInput['windowContext']>> = {}
    ): LayoutInput {
      return input({
        scrollMode: 'window',
        windowContext: {
          documentScrollWidth: 800,
          documentScrollHeight: 600,
          documentClientWidth: 800,
          documentClientHeight: 600,
          currentHiderWidth: 300,
          currentHiderHeight: 200,
          ...contextOverrides,
        },
        ...overrides,
      });
    }

    it('should report no scrollbars when the predicted document fits the client box', () => {
      const snapshot = resolveLayout(windowInput({ totalContentHeight: 200, totalContentWidth: 300 }));

      expect(snapshot.hasVerticalScroll).toBe(false);
      expect(snapshot.hasHorizontalScroll).toBe(false);
    });

    it('should report a vertical scrollbar when the table grows the document past the client box', () => {
      // Predicted doc scroll height = 600 - 200 (current hider) + 700 (new hider) = 1100 > 600.
      const snapshot = resolveLayout(windowInput({ totalContentHeight: 700 }));

      expect(snapshot.hasVerticalScroll).toBe(true);
    });

    it('should account for other page content via the scroll-size delta', () => {
      // The document already scrolls (scrollHeight 1000) from content outside the table. Even a
      // small table keeps the document over the client box: 1000 - 200 + 250 = 1050 > 600.
      const snapshot = resolveLayout(windowInput(
        { totalContentHeight: 250 },
        { documentScrollHeight: 1000 }
      ));

      expect(snapshot.hasVerticalScroll).toBe(true);
    });

    it('should honor forced and hidden overflow in window mode', () => {
      expect(resolveLayout(windowInput({ overflowY: 'scroll', totalContentHeight: 10 }))
        .hasVerticalScroll).toBe(true);
      expect(resolveLayout(windowInput({ overflowY: 'hidden', totalContentHeight: 5000 }))
        .hasVerticalScroll).toBe(false);
    });

    it('should report no scrollbars when the window context is missing', () => {
      const snapshot = resolveLayout(input({ scrollMode: 'window', windowContext: undefined }));

      expect(snapshot.hasVerticalScroll).toBe(false);
      expect(snapshot.hasHorizontalScroll).toBe(false);
    });
  });

  describe('RTL', () => {
    it('should carry the isRtl flag through to the snapshot', () => {
      expect(resolveLayout(input({ isRtl: true })).isRtl).toBe(true);
      expect(resolveLayout(input({ isRtl: false })).isRtl).toBe(false);
    });

    it('should decide scrollbars identically regardless of direction', () => {
      const sizes = { totalContentWidth: 900, totalContentHeight: 390 };
      const ltr = resolveLayout(input({ ...sizes, isRtl: false }));
      const rtl = resolveLayout(input({ ...sizes, isRtl: true }));

      expect(rtl.hasVerticalScroll).toBe(ltr.hasVerticalScroll);
      expect(rtl.hasHorizontalScroll).toBe(ltr.hasHorizontalScroll);
    });
  });
});
