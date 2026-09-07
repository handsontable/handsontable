import { getHiderHeightCompensation, addContentHeightSlack } from '../../../src/axisSizing/hiderCompensation';

/**
 * Builds a settings double exposing only the two keys the compensation reads.
 *
 * @param {object} options The values to report.
 * @param {boolean} options.externalRowCalculator Whether AutoRowSize supplies exact heights.
 * @param {string|undefined} options.borderBottomWidth The computed `border-bottom-width` of a `td`.
 * @param {boolean} options.noStylesHandler Report no styles handler at all.
 * @returns {object} The settings double.
 */
function settingsMock({ externalRowCalculator = false, borderBottomWidth = '1px', noStylesHandler = false } = {}) {
  return {
    getSetting(key: string) {
      if (key === 'externalRowCalculator') {
        return externalRowCalculator;
      }

      if (key === 'stylesHandler') {
        return noStylesHandler ? null : { getStyleForTD: () => borderBottomWidth };
      }

      return undefined;
    },
  } as never;
}

describe('getHiderHeightCompensation', () => {
  it('should compensate the declared 1px border at 100% zoom', () => {
    expect(getHiderHeightCompensation(settingsMock({ borderBottomWidth: '1px' }))).toBe(1);
  });

  // The whole defect: below 100% the browser cannot paint a border thinner than one device pixel,
  // so it widens the declared 1px and every row renders that much taller than the sum accounted
  // for. The compensation carries the excess, or the hider ends up short of the table and the
  // browser draws a scrollbar.
  it.each([
    ['90%', '1.11111px', 1.11111],
    ['80%', '1.25px', 1.25],
    ['75%', '1.33333px', 1.33333],
    ['67%', '1.49254px', 1.49254],
  ])('should add the border inflation at %s zoom', (_zoom, computed, expected) => {
    expect(getHiderHeightCompensation(settingsMock({ borderBottomWidth: computed }))).toBeCloseTo(expected, 5);
  });

  // Nothing was inflated in these three, so the compensation must stay the historical `1`.
  // Returning the border itself instead changed the hider by a whole pixel at 100% zoom — on a
  // borderless surface by -1, at 50% zoom by +1 — which is what the row sum already accounts for.
  it.each([
    ['a border on a whole number of device pixels (50% zoom)', '2px'],
    ['a border narrower than its declared pixel (125% zoom)', '0.8px'],
    ['a surface that removes the border entirely', '0px'],
  ])('should keep the declared 1px for %s', (_label, computed) => {
    expect(getHiderHeightCompensation(settingsMock({ borderBottomWidth: computed }))).toBe(1);
  });

  // The menu grids and the Filters by-value list drop all four borders on `td:first-child`, and
  // `StylesHandler`'s probe cell IS a `td:first-child` inside them, so it reads `0px` there at
  // 100% zoom on every platform. Compensating with the border itself would have resized those
  // grids by a pixel — a change at the default zoom, which this fix must not make.
  it('should not change a borderless surface at 100% zoom', () => {
    expect(getHiderHeightCompensation(settingsMock({ borderBottomWidth: '0px' })))
      .toBe(getHiderHeightCompensation(settingsMock({ borderBottomWidth: '1px' })));
  });

  it('should not compensate when AutoRowSize supplies exact heights', () => {
    expect(getHiderHeightCompensation(settingsMock({
      externalRowCalculator: true,
      borderBottomWidth: '1.25px',
    }))).toBe(0);
  });

  it.each([
    ['an unreadable value', 'auto'],
    ['an empty value', ''],
    ['an absent value', undefined],
  ])('should fall back to the declared 1px for %s', (_label, computed) => {
    expect(getHiderHeightCompensation(settingsMock({ borderBottomWidth: computed as string }))).toBe(1);
  });

  it('should fall back to the declared 1px when no styles handler is available yet', () => {
    expect(getHiderHeightCompensation(settingsMock({ noStylesHandler: true }))).toBe(1);
  });

  // Walkontable is a standalone engine and `stylesHandler` is a user-supplied setting, so a host can
  // legitimately implement only part of the class Handsontable passes in. The engine's own Puppeteer
  // harness did exactly that, and an unguarded call threw inside the draw — 695 of 816 specs.
  it('should fall back to the declared 1px for a styles handler without getStyleForTD', () => {
    const partialHandler = {
      getSetting(key: string) {
        return key === 'stylesHandler' ? { getDefaultRowHeight: () => 23 } : undefined;
      },
    } as never;

    expect(getHiderHeightCompensation(partialHandler)).toBe(1);
  });
});

describe('addContentHeightSlack', () => {
  // The residue it exists for: summing the rows reproduces the browser's own snapping only to about
  // 0.024px, and a hider that far under its table still gets a full-size scrollbar at 67% zoom.
  it('should cover the largest arithmetic residue measured', () => {
    const largestResidueMeasured = 0.024;

    expect(addContentHeightSlack(1210.075) - 1210.075).toBeGreaterThan(largestResidueMeasured);
  });

  it('should never return less than the value it was given', () => {
    for (const value of [0, 0.5, 29.0972, 175.694, 1194.097, 1210.075]) {
      expect(addContentHeightSlack(value)).toBeGreaterThanOrEqual(value);
    }
  });

  // The whole point of a sub-pixel slack rather than a device-pixel rounding: it must be far too
  // small to decide a scrollbar the browser was not already going to draw. One device pixel is
  // 1.49px at 67% zoom and 1px at 100%, the two extremes the grid is supported at.
  it('should stay an order of magnitude below one device pixel at every supported zoom', () => {
    const smallestDevicePixel = 1;

    for (const value of [29.0972, 175.694, 1194.097, 1210.075]) {
      expect(addContentHeightSlack(value) - value).toBeLessThan(smallestDevicePixel / 10);
    }
  });

  it('should add the same amount whatever the magnitude of the total', () => {
    const added = v => addContentHeightSlack(v) - v;

    expect(added(1)).toBeCloseTo(added(100000), 9);
  });

  // The no-op that matters most. At 100% zoom with no display scaling every total is whole pixels,
  // so the grid must be sized exactly as it was before this correction existed — and the layout
  // solver's window-mode prediction, which subtracts the hider's integer `offsetHeight` before
  // adding this total back, must not be left a fraction over either.
  it.each([0, 1, 175, 262, 1190, 1204])('should leave the whole pixel %p untouched', (value) => {
    expect(addContentHeightSlack(value)).toBe(value);
  });

  it('should treat a whole pixel reached by repeated addition as whole', () => {
    // What summing forty row heights actually produces.
    expect(addContentHeightSlack(1189.9999999999998)).toBe(1189.9999999999998);
  });

  it.each([1194.097, 1199.219, 1210.075, 175.694])('should add the slack to the fraction %p', (value) => {
    expect(addContentHeightSlack(value)).toBeGreaterThan(value);
  });

  it('should pass a non-finite value through', () => {
    expect(addContentHeightSlack(NaN)).toBeNaN();
  });
});
