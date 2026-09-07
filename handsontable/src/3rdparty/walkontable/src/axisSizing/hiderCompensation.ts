import type { default as Settings } from '../settings';

/**
 * The width the theme declares for a cell's bottom border, in CSS pixels.
 */
const DECLARED_BOTTOM_BORDER_WIDTH = 1;

/**
 * The compensation added to the summed row heights to get the height the table actually renders at.
 *
 * The internal row-height calculator carries a known miscalculation worth one cell bottom border,
 * which both the hider write (`SpreaderSize#adjustElementsSize`) and the single-pass layout
 * prediction (`gatherLayoutInput`) have to fold in. It is not needed when AutoRowSize supplies exact
 * heights — the `externalRowCalculator` case.
 *
 * The compensation is the border's *rendered* width, not the declared `1`. Below 100% zoom or
 * display scaling the browser cannot paint a border thinner than one device pixel, so a declared
 * `1px` resolves to 1.11111px at 90% and 1.49254px at 67%. Using the literal left the hider that
 * fraction short of the table it holds, which is enough for the browser to show a vertical scrollbar
 * on a grid that needs none (DEV-2525). At 100% the computed value is exactly `1px`, so this returns
 * the same number it always did.
 *
 * The value comes from the `StylesHandler` snapshot, so it costs no DOM read.
 *
 * @param {Settings} wtSettings The Walkontable settings accessor.
 * @returns {number} The compensation in CSS pixels.
 */
export function getHiderHeightCompensation(wtSettings: Settings): number {
  if (wtSettings.getSetting<boolean>('externalRowCalculator')) {
    return 0;
  }

  const stylesHandler = wtSettings.getSetting('stylesHandler');
  // A standalone Walkontable host may supply no styles handler at all, or one implementing only
  // part of the class Handsontable passes in — the engine's own test harness does exactly that.
  const readStyle = stylesHandler?.getStyleForTD;
  const renderedBorderWidth = Number.parseFloat(
    typeof readStyle === 'function' ? `${readStyle.call(stylesHandler, 'border-bottom-width')}` : ''
  );

  // A theme that removes the border reports `0px`, which is a legitimate answer and must survive.
  // Only an unreadable snapshot (no theme applied yet) falls back to the declared width.
  return Number.isFinite(renderedBorderWidth) ? renderedBorderWidth : DECLARED_BOTTOM_BORDER_WIDTH;
}

/**
 * Absorbs the floating-point slack left in a content height so it cannot land a hair under the
 * content it has to hold.
 *
 * Summing the rows reproduces the browser's own sub-pixel snapping only to about 0.02px, and that is
 * enough: a hider 0.02px under its table is still a scrollbar on a small grid at 67% zoom. Rounding
 * the total up to the next device pixel removes the question — the hider's bottom edge then lands on
 * the same physical pixel row as the table's, or one past it. One device pixel is the smallest
 * distance the screen can show, so the extra height is never visible.
 *
 * A total already on the grid is returned unchanged, which is every total at 100% zoom, where the
 * row heights are whole pixels. The epsilon keeps binary floating-point error from pushing such a
 * total onto the next pixel.
 *
 * @param {number} value The content height in CSS pixels.
 * @param {number} devicePixelRatio The device pixel ratio to snap against.
 * @returns {number} The height rounded up to the next device pixel.
 */
export function snapUpToDevicePixel(value: number, devicePixelRatio: number): number {
  if (!Number.isFinite(value) || !(devicePixelRatio > 0)) {
    return value;
  }

  const snapped = Math.ceil((value * devicePixelRatio) - 1e-6) / devicePixelRatio;

  // `Math.ceil` answers -0 for a zero total, which would reach the DOM as the string "-0px".
  return snapped === 0 ? 0 : snapped;
}
