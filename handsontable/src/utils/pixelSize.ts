/**
 * Matches a size written as a bare number (`'100'`, `'12.5'`) or with a `px` unit (`'100px'`),
 * ignoring surrounding whitespace and the unit's letter case.
 */
const PIXEL_SIZE_PATTERN = /^\s*(\d+(?:\.\d+)?)\s*(?:px)?\s*$/i;

/**
 * Resolves a pixel size setting written as a number or a string into a number.
 *
 * This lives outside `helpers/` on purpose. Every export of `helpers/number` is spread onto
 * `Handsontable.helper` by `index.ts` and typed into the emitted declarations by `base.ts`, which
 * would make this a public API that the no-removal rule then keeps forever. It has one caller,
 * `tableView`, so it stays internal.
 *
 * The grid's size options are documented as numbers of pixels. This additionally accepts the two
 * string forms that carry the same unambiguous meaning – a bare numeric string (`'100'`) and a pixel
 * string (`'100px'`) – so a value arriving from an attribute, a JSON config, or a framework template
 * still resolves.
 *
 * A number is returned unchanged, so the callers' existing behavior for numbers is untouched. That
 * includes a negative number: `-50` is passed through, while the string `'-50'` is rejected. The two
 * forms deliberately disagree there. Numbers keep whatever they did before this helper existed, and
 * a negative string is far more likely to be a typo than an intent, so it gets the default instead
 * of collapsing the header.
 *
 * Any value that does not resolve to a pixel count returns `null`. That covers relative units
 * (`'50%'`, `'20em'`), which depend on a layout context these settings have no access to, and plain
 * text. Returning `null` lets the caller apply its own default instead of rendering a broken size.
 *
 * @param {*} value The value to resolve.
 * @returns {number|null}
 */
export function parsePixelSize(value: unknown): number | null {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const match = PIXEL_SIZE_PATTERN.exec(value);

  return match === null ? null : parseFloat(match[1]);
}
