// The overlay barrel goes first: the table modules and the overlays import each other, and only this entry
// point resolves that cycle.
import { InlineStartOverlay } from 'walkontable/overlay';

/**
 * `InlineStartOverlay#getTableParentOffset`, run on a stub `this` that carries only the fields it reads, so
 * no DOM layout and no grid are built. The window-scroll behavior it feeds is pinned in
 * `tests/e2e/rtl-shrink-wrapped-grid-scroll.spec.ts`; the measurement itself in
 * `table/holderInlineStartMargin.unit.ts`.
 */
describe('InlineStartOverlay#getTableParentOffset', () => {
  /**
   * Builds the stub for a grid the window scrolls.
   *
   * @param {object} state The state the stub reports.
   * @param {boolean} state.isRtl Whether the grid is right-to-left.
   * @param {number} [state.left=0] The holder's left offset from the page.
   * @param {number} [state.margin=0] The right-hand page margin the master draw measured.
   * @param {boolean} [state.preventOverflow=false] The `preventOverflow` setting.
   * @param {boolean} [state.windowOwnsAxis=true] Whether the window is the trimming container.
   * @param {boolean} [state.windowScrolls=true] Whether the window, not the holder, scrolls the columns.
   * @returns {object}
   */
  function createStub({
    isRtl, left = 0, margin = 0, preventOverflow = false, windowOwnsAxis = true, windowScrolls = true,
  }:
    { isRtl: boolean, left?: number, margin?: number, preventOverflow?: boolean, windowOwnsAxis?: boolean,
      windowScrolls?: boolean }) {
    const rootWindow = {};

    return {
      trimmingContainer: windowOwnsAxis ? rootWindow : {},
      wtSettings: { getSetting: () => preventOverflow },
      isRtl: () => isRtl,
      isScrolledByWindow: () => windowScrolls,
      deps: {
        rootWindow,
        getWtTable: () => ({ holderOffset: { left, top: 0 }, holderInlineStartMargin: margin }),
      },
    };
  }

  const offsetOf = (self: object): number =>
    (InlineStartOverlay.prototype as unknown as { getTableParentOffset(this: object): number })
      .getTableParentOffset.call(self);

  it('should return the left offset in LTR', () => {
    expect(offsetOf(createStub({ isRtl: false, left: 40 }))).toBe(40);
  });

  it('should return 0 in LTR while the holder, not the window, scrolls the columns', () => {
    expect(offsetOf(createStub({ isRtl: false, left: 200, windowScrolls: false }))).toBe(0);
  });

  it('should return the right-hand margin the draw measured in RTL, and not the left offset', () => {
    expect(offsetOf(createStub({ isRtl: true, left: -3770, margin: 0 }))).toBe(0);
    expect(offsetOf(createStub({ isRtl: true, left: 0, margin: 600 }))).toBe(600);
  });

  it('should return 0 in RTL while the holder, not the window, scrolls the columns', () => {
    expect(offsetOf(createStub({ isRtl: true, margin: 300, windowScrolls: false }))).toBe(0);
  });

  it('should return 0 when the window does not own the horizontal axis', () => {
    expect(offsetOf(createStub({ isRtl: true, margin: 600, windowOwnsAxis: false }))).toBe(0);
  });

  it('should return 0 when `preventOverflow` is set', () => {
    expect(offsetOf(createStub({ isRtl: true, margin: 600, preventOverflow: true }))).toBe(0);
  });
});
