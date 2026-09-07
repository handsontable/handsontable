import { getHiderHeightCompensation, snapUpToDevicePixel } from '../../../src/axisSizing/hiderCompensation';

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
  // so it widens the declared 1px and the row is that much taller than the theme asked for. The
  // compensation has to follow, or the hider ends up short of the table and grows a scrollbar.
  it.each([
    ['90%', '1.11111px', 1.11111],
    ['80%', '1.25px', 1.25],
    ['75%', '1.33333px', 1.33333],
    ['67%', '1.49254px', 1.49254],
    ['50%', '2px', 2],
  ])('should carry the rendered border width at %s zoom', (_zoom, computed, expected) => {
    expect(getHiderHeightCompensation(settingsMock({ borderBottomWidth: computed }))).toBeCloseTo(expected, 5);
  });

  it('should not compensate when AutoRowSize supplies exact heights', () => {
    expect(getHiderHeightCompensation(settingsMock({
      externalRowCalculator: true,
      borderBottomWidth: '1.25px',
    }))).toBe(0);
  });

  // A surface that removes the border (the Filters by-value list) reports `0px`, and that is the
  // right answer — not a missing reading to fall back from.
  it('should keep a genuine zero border', () => {
    expect(getHiderHeightCompensation(settingsMock({ borderBottomWidth: '0px' }))).toBe(0);
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

describe('snapUpToDevicePixel', () => {
  // The no-op that matters most: at 100% zoom the totals are whole pixels already, so the grid
  // must be sized exactly as it was before this rounding existed.
  it.each([0, 1, 175, 1190, 1204])('should leave the whole pixel %p unchanged at ratio 1', (value) => {
    expect(snapUpToDevicePixel(value, 1)).toBe(value);
  });

  it('should leave a total that already lands on a device pixel unchanged', () => {
    // 1198.75 * 0.8 = 959 exactly.
    expect(snapUpToDevicePixel(1198.75, 0.8)).toBeCloseTo(1198.75, 6);
  });

  it.each([
    [0.9, 1194.097, 1194.4444],
    [0.8, 1199.219, 1200],
    [0.67, 1210.075, 1210.4478],
  ])('should round up to the next device pixel at ratio %p', (ratio, value, expected) => {
    expect(snapUpToDevicePixel(value, ratio)).toBeCloseTo(expected, 3);
  });

  it('should never return less than the value it was given', () => {
    for (const ratio of [0.5, 0.67, 0.75, 0.8, 0.9, 1, 1.25, 2]) {
      for (const value of [0.5, 29.0972, 175.694, 1194.097, 1210.075]) {
        expect(snapUpToDevicePixel(value, ratio)).toBeGreaterThanOrEqual(value);
      }
    }
  });

  // The slack has to stay under one device pixel, or the grid gains a visible strip of dead space
  // below its last row.
  it('should add less than one device pixel of slack', () => {
    for (const ratio of [0.5, 0.67, 0.75, 0.8, 0.9, 1, 1.25, 2]) {
      for (const value of [29.0972, 175.694, 1194.097, 1210.075]) {
        expect(snapUpToDevicePixel(value, ratio) - value).toBeLessThan(1 / ratio);
      }
    }
  });

  it.each([
    ['a zero ratio', 100, 0],
    ['a negative ratio', 100, -1],
    ['an unreadable ratio', 100, NaN],
  ])('should pass the value through for %s', (_label, value, ratio) => {
    expect(snapUpToDevicePixel(value, ratio)).toBe(value);
  });

  it('should pass a non-finite value through', () => {
    expect(snapUpToDevicePixel(NaN, 0.8)).toBeNaN();
  });
});
