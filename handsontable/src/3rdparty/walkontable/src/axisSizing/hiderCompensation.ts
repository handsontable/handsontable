import type { default as Settings } from '../settings';
import type { StylesHandler } from '../types';

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
 * The compensation is the declared `1` **plus** the sub-pixel amount by which the browser inflated
 * the cells' bottom border beyond the whole-pixel value the row heights were summed with. Below 100%
 * zoom or display scaling a browser cannot paint a border thinner than one device pixel, so a
 * declared `1px` resolves to 1.11111px at 90% and 1.49254px at 67%, and every row renders that
 * fraction taller than the sum accounted for. Left out, it put the hider short of the table it
 * holds, which is enough for the browser to show a vertical scrollbar on a grid that needs none
 * (DEV-2525).
 *
 * Adding the inflation to the constant rather than *replacing* it is what keeps this exact at 100%
 * and above, and on a surface that removes the border altogether:
 *
 *   - 1px (100% zoom) — nothing was inflated, so the compensation is the historical `1`;
 *   - 0px (a borderless surface, such as the Filters by-value list or the menu grids, whose
 *     `td:first-child` drops all four borders) — likewise `1`. Returning the border itself here
 *     would have changed the hider by a pixel at 100% zoom, on every platform;
 *   - 2px (50% zoom) or 0.8px (125%) — a whole number of device pixels, or a border narrower than
 *     the pixel it is declared in. Neither is an inflation the row sum missed, so both keep `1`.
 *
 * The `> rounded` test is deliberately the same gate `StylesHandler#calculateRowHeight` uses before
 * it replaces a declared row height with a measured one, because the two have to agree about which
 * borders the row heights already account for. They are read from the same snapshot, so this costs
 * no DOM read.
 *
 * @param {Settings} wtSettings The Walkontable settings accessor.
 * @returns {number} The compensation in CSS pixels.
 */
export function getHiderHeightCompensation(wtSettings: Settings): number {
  if (wtSettings.getSetting<boolean>('externalRowCalculator')) {
    return 0;
  }

  const stylesHandler = wtSettings.getSetting<StylesHandler | null>('stylesHandler');
  // A standalone Walkontable host may supply no styles handler at all, or one implementing only
  // part of the class Handsontable passes in — the engine's own test harness does exactly that.
  const readStyle = stylesHandler?.getStyleForTD;
  const renderedBorderWidth = Number.parseFloat(
    typeof readStyle === 'function' ? `${readStyle.call(stylesHandler, 'border-bottom-width')}` : ''
  );

  if (!Number.isFinite(renderedBorderWidth)) {
    return DECLARED_BOTTOM_BORDER_WIDTH;
  }

  const wholePixelWidth = Math.round(renderedBorderWidth);
  const inflation = renderedBorderWidth > wholePixelWidth
    ? renderedBorderWidth - wholePixelWidth : 0;

  return DECLARED_BOTTOM_BORDER_WIDTH + inflation;
}

/**
 * The slack added to a summed content height so it cannot land a hair under the content it has to
 * hold, in CSS pixels.
 *
 * Summing the rows reproduces the browser's own sub-pixel snapping of each row only to about
 * 0.024px — measured across 5-row and 40-row grids at five zoom levels, and constant rather than
 * accumulating, because the rows all snap alike. That much is still enough to summon a full-size
 * scrollbar: at 67% zoom a hider 0.023px under its table gets one.
 *
 * The value is double the largest residue measured, and still one to two orders of magnitude below
 * one device pixel at every supported zoom (1.49px at 67%, 1px at 100%), which is what keeps it from
 * ever deciding a scrollbar on its own.
 */
const CONTENT_HEIGHT_SLACK = 0.05;

/**
 * How far a summed height may sit from a whole pixel and still count as one, in CSS pixels.
 *
 * Absorbs the binary floating-point error of repeated addition only — orders of magnitude below the
 * smallest real sub-pixel measurement, so it can never mistake a fractional total for a whole one.
 */
const WHOLE_PIXEL_TOLERANCE = 1e-6;

/**
 * Adds the slack above to a summed content height.
 *
 * Rounding up to the next whole *device* pixel was tried first and is wrong here. It is the
 * principled-looking choice — one device pixel is the smallest distance a screen can show, so the
 * extra height is invisible — but the height this produces is also what the browser compares against
 * a fixed `height` setting. On a grid whose box is a fraction of a pixel shorter than its content
 * (a 264px box holding 264.22px of rows at 80% zoom), the browser rounds that deficit away and shows
 * no scrollbar; inflating the content by most of a device pixel pushes it over the threshold and
 * produces a full 15px bar. Trading one unwanted scrollbar for another is no fix. Deciding the snap
 * from the holder's own height cannot work either: with `height: 'auto'` the holder resolves FROM
 * the hider being written here, so the test would read the previous draw's height.
 *
 * A fixed sub-pixel slack has neither problem: it covers the arithmetic residue it is sized for and
 * is far too small to change any scrollbar decision the browser was not already making.
 *
 * **A whole-pixel total is returned untouched**, which is every total at 100% zoom with no display
 * scaling. There is no sub-pixel residue to cover when nothing was measured in fractions, and the
 * total has a second consumer that must not be perturbed: `resolveLayout`'s window-mode prediction
 * adds it to `documentScrollHeight` after subtracting the hider's INTEGER `offsetHeight`, so an
 * unconditional slack would leave the prediction 0.05px over on a page whose document does not
 * scroll — enough for a `>` test to invent a window scrollbar at the default zoom.
 *
 * @param {number} value The content height in CSS pixels.
 * @returns {number} The height with the slack added, or the value unchanged if it needs none.
 */
export function addContentHeightSlack(value: number): number {
  if (!Number.isFinite(value)) {
    return value;
  }

  // Not `Number.isInteger`: the sum is built by repeated addition, so a whole-pixel total can
  // arrive as 1189.9999999999998 and would then be treated as fractional.
  if (Math.abs(value - Math.round(value)) < WHOLE_PIXEL_TOLERANCE) {
    return value;
  }

  return value + CONTENT_HEIGHT_SLACK;
}
