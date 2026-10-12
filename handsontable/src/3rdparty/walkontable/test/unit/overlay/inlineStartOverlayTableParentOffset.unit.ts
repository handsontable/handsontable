// The overlay barrel goes first: the table modules and the overlays import each other, and only this entry
// point resolves that cycle.
import { InlineStartOverlay } from 'walkontable/overlay';

/**
 * `InlineStartOverlay#getTableParentOffset`, run on a stub `this` that carries only the fields it reads, so
 * no DOM layout and no grid are built. The window-scroll behavior it feeds is pinned in
 * `tests/e2e/rtl-shrink-wrapped-grid-scroll.spec.ts`.
 */
describe('InlineStartOverlay#getTableParentOffset', () => {
  const DOC_WIDTH = 1280;

  /**
   * Builds the stub for a grid the window scrolls.
   *
   * @param {object} state The geometry the stub reports.
   * @param {boolean} state.isRtl Whether the grid is right-to-left.
   * @param {number} state.left The holder's left offset from the page.
   * @param {number} state.width The holder's width.
   * @param {boolean} [state.preventOverflow=false] The `preventOverflow` setting.
   * @param {boolean} [state.windowOwnsAxis=true] Whether the window is the trimming container.
   * @returns {object}
   */
  function createStub({ isRtl, left, width, preventOverflow = false, windowOwnsAxis = true }:
    { isRtl: boolean, left: number, width: number, preventOverflow?: boolean, windowOwnsAxis?: boolean }) {
    const rootWindow = {};
    const holder = {};

    return {
      trimmingContainer: windowOwnsAxis ? rootWindow : {},
      wtSettings: { getSetting: () => preventOverflow },
      isRtl: () => isRtl,
      deps: {
        rootWindow,
        rootDocument: { documentElement: {} },
        geometryReader: { clientWidth: () => DOC_WIDTH, offsetWidth: () => width },
        getWtTable: () => ({ holder, holderOffset: { left, top: 0 } }),
      },
    };
  }

  const offsetOf = (self: object): number =>
    (InlineStartOverlay.prototype as unknown as { getTableParentOffset(this: object): number })
      .getTableParentOffset.call(self);

  it('should return the left offset in LTR', () => {
    expect(offsetOf(createStub({ isRtl: false, left: 40, width: 600 }))).toBe(40);
  });

  it('should return the margin on the right in RTL for a grid that fills the page width', () => {
    expect(offsetOf(createStub({ isRtl: true, left: 0, width: DOC_WIDTH }))).toBe(0);
  });

  it('should return the margin on the right in RTL for a grid narrower than the page', () => {
    expect(offsetOf(createStub({ isRtl: true, left: 0, width: 680 }))).toBe(600);
  });

  it('should return 0 in RTL for a grid wider than the page that ends at the right edge', () => {
    // A shrink-to-fit wrapper: the holder runs from -3770 to 1280.
    expect(offsetOf(createStub({ isRtl: true, left: -3770, width: 5050 }))).toBe(0);
  });

  it('should return 0 when the window does not own the horizontal axis', () => {
    expect(offsetOf(createStub({ isRtl: true, left: 0, width: 680, windowOwnsAxis: false }))).toBe(0);
  });

  it('should return 0 when `preventOverflow` is set', () => {
    expect(offsetOf(createStub({ isRtl: true, left: 0, width: 680, preventOverflow: true }))).toBe(0);
  });
});
