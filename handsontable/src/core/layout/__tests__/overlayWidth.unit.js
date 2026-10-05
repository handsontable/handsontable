import { getOverlayLayerWidth } from '../overlayWidth';

describe('getOverlayLayerWidth', () => {
  /**
   * Builds the slice of a grid instance the helper reads. The view reports fixed widths and the
   * side slots report their `offsetWidth`, which jsdom cannot lay out on its own.
   *
   * @param {object} options The stub options.
   * @param {boolean} options.byWindow Whether the window scrolls the columns.
   * @param {number|null} options.startWidth The start slot width, or `null` for no slot element.
   * @param {number|null} options.endWidth The end slot width, or `null` for no slot element.
   * @returns {object}
   */
  function stubInstance({ byWindow = false, startWidth = 0, endWidth = 0 } = {}) {
    return {
      view: {
        isHorizontallyScrollableByWindow: () => byWindow,
        getWorkspaceWidth: () => 500,
        getTotalTableWidth: () => 2000,
      },
      rootSlotStartElement: startWidth === null ? null : { offsetWidth: startWidth },
      rootSlotEndElement: endWidth === null ? null : { offsetWidth: endWidth },
    };
  }

  it('returns the workspace width when the side slots are empty', () => {
    expect(getOverlayLayerWidth(stubInstance())).toBe(500);
  });

  it('adds the start and end slot widths to the workspace width', () => {
    expect(getOverlayLayerWidth(stubInstance({ startWidth: 160, endWidth: 120 }))).toBe(780);
    expect(getOverlayLayerWidth(stubInstance({ startWidth: 160 }))).toBe(660);
    expect(getOverlayLayerWidth(stubInstance({ endWidth: 120 }))).toBe(620);
  });

  it('uses the total table width when the window scrolls the columns', () => {
    expect(getOverlayLayerWidth(stubInstance({ byWindow: true, startWidth: 160, endWidth: 120 }))).toBe(2280);
  });

  it('treats a missing slot element as zero width', () => {
    expect(getOverlayLayerWidth(stubInstance({ startWidth: null, endWidth: null }))).toBe(500);
  });
});
