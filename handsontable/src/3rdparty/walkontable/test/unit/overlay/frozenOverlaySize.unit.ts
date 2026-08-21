import { resolveFrozenOverlayHeight } from '../../../src/overlay/frozenOverlaySize';
import { OVERLAY_SCROLLBAR_CLEARANCE } from '../../../src/overlay/constants';

describe('resolveFrozenOverlayHeight', () => {
  const input = (overrides = {}) => ({
    workspaceHeight: 340,
    hasHorizontalScroll: true,
    scrollbarWidth: 15,
    hasOverlayScrollbar: false,
    getMasterClientHeight: () => 325,
    ...overrides,
  });

  it('should use the whole workspace height when there is no horizontal scrollbar', () => {
    expect(resolveFrozenOverlayHeight(input({ hasHorizontalScroll: false }))).toBe(340);
  });

  it('should not read the master holder height when there is no horizontal scrollbar', () => {
    const getMasterClientHeight = jest.fn(() => 325);

    resolveFrozenOverlayHeight(input({ hasHorizontalScroll: false, getMasterClientHeight }));

    expect(getMasterClientHeight).not.toHaveBeenCalled();
  });

  describe('classic (space-taking) scrollbar', () => {
    it('should prefer the master holder inner height, which accounts for the scrollbar (#12632)', () => {
      expect(resolveFrozenOverlayHeight(input({ getMasterClientHeight: () => 325 }))).toBe(325);
    });

    it('should keep sub-pixel accuracy instead of subtracting a rounded scrollbar width', () => {
      expect(resolveFrozenOverlayHeight(input({ getMasterClientHeight: () => 324.5 }))).toBe(324.5);
    });

    it('should fall back to subtracting the scrollbar width when the holder is not measurable', () => {
      expect(resolveFrozenOverlayHeight(input({ getMasterClientHeight: () => 0 }))).toBe(325);
    });
  });

  describe('overlay (floating) scrollbar', () => {
    it('should reserve a strip so the scrollbar is not covered by the frozen overlay (#10370)', () => {
      const height = resolveFrozenOverlayHeight(input({
        scrollbarWidth: 0,
        hasOverlayScrollbar: true,
      }));

      expect(height).toBe(340 - OVERLAY_SCROLLBAR_CLEARANCE);
    });

    it('should ignore the master holder height, which never shrinks for an overlay scrollbar', () => {
      const getMasterClientHeight = jest.fn(() => 340);
      const height = resolveFrozenOverlayHeight(input({
        scrollbarWidth: 0,
        hasOverlayScrollbar: true,
        getMasterClientHeight,
      }));

      expect(getMasterClientHeight).not.toHaveBeenCalled();
      expect(height).toBe(340 - OVERLAY_SCROLLBAR_CLEARANCE);
    });

    it('should reserve nothing on engines that do not paint an overlay scrollbar there', () => {
      // A zero-width scrollbar also happens in headless Chrome and on macOS Chrome/Safari, where the
      // scrollbar is composited above the frozen overlay and needs no strip.
      const height = resolveFrozenOverlayHeight(input({
        scrollbarWidth: 0,
        hasOverlayScrollbar: false,
        getMasterClientHeight: () => 340,
      }));

      expect(height).toBe(340);
    });

    it('should not reserve a strip when a real scrollbar is measurable', () => {
      const height = resolveFrozenOverlayHeight(input({
        scrollbarWidth: 15,
        hasOverlayScrollbar: true,
        getMasterClientHeight: () => 325,
      }));

      expect(height).toBe(325);
    });
  });
});
