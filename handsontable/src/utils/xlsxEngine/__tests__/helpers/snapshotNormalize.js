/**
 * The cross-engine snapshot normalizers, in ONE place.
 *
 * `xlsxEngine/AGENTS.md` makes "exactly four normalizations, each with its reason, and never
 * widen one" a reviewable invariant. It can only be reviewed in one place while the code lives in
 * one place, so every file that diffs a native snapshot against an ExcelJS one imports from here
 * (`nativeRead.unit.js`, `enginesParity.unit.js`) instead of hand-copying it.
 *
 * THE FOUR NORMALIZATIONS, AND WHY EACH ONE IS LEGITIMATE:
 *
 * 1. Cell values are rounded to nine decimals (`roundNumber`, on `value` and `result` keys only:
 *    a width, a height or any other number is compared exactly). The ExcelJS adapter reads a
 *    time-formatted cell as a `Date` and converts it back into a serial on the way out, which loses
 *    a few ulps in the last place (`0.5208333333333334` round-trips as `0.52083333333212`). The
 *    native adapter never routes a value through `Date`, so without this the two would disagree on
 *    float noise, never on content. `exceljsRead.unit.js` uses `toBeCloseTo` on that same cell.
 *
 * 2. Conditional-formatting blocks are compared by their `ref` only (`strip`). ExcelJS's own rule
 *    objects carry its bookkeeping keys, which have no equivalent in the native reader's output, so
 *    comparing full rule content would fail on that bookkeeping rather than on anything the two
 *    engines disagree about. This does NOT blind the suite to rule content: `cfShape()` in
 *    `enginesParity.unit.js` compares `ref` + rule count + each rule's `type`, `operator`,
 *    `formulae`, `text`, `rank` and differential `style` across all four legs.
 *
 * 3. A default font/fill collapses to `null` (`normalizeFont` / `normalizeFill`). A cell whose only
 *    xf difference from the base is its number format (e.g. `values.xlsx`'s "Amount"/"Hired"/
 *    "Start"/"Ratio" columns) still references the SAME font/fill ids as the base xf (verified
 *    against the fixture's own `xl/styles.xml`) — no style is actually applied. ExcelJS's
 *    `cell.font`/`cell.fill` getters resolve those shared ids into a full object anyway
 *    (`{color:{theme:1},family:2,name:'Calibri',scheme:'minor',size:11}` / `{pattern:'none',…}`)
 *    purely because the cell carries an `s` attribute at all, while `cell.border`/`cell.alignment`
 *    correctly resolve to `{}`/`undefined` in the same case. That is a quirk of ExcelJS's object
 *    model, not a difference in what the file means, and the native reader's `style: null` for
 *    exactly this shape is already pinned by `nativeStyles.unit.js`.
 *
 * 4. The snapshot is JSON round-tripped (`strip`), which turns `NaN`, `Infinity` and `-Infinity`
 *    into `null` and drops a key whose value is `undefined`. It is what makes two snapshots of
 *    independently built objects comparable with `toEqual`; the price is that a non-finite number
 *    and an empty cell compare equal, so a test about non-finite values reads the raw snapshots
 *    (`enginesParity.unit.js` does), never `strip()`.
 *
 * THERE IS NO FIFTH. A real divergence between the engines is asserted explicitly, with both
 * engines' actual values, instead of being normalized into agreement. The divergences pinned that
 * way in `enginesParity.unit.js`, the ONE list of them:
 *
 * - the theme fill (the native reader has no theme palette);
 * - the conditional-formatting rule-kind subset the native writer supports;
 * - the `containsText` `text` attribute, which ExcelJS neither writes nor reads;
 * - non-finite numbers, which ExcelJS writes as `<v>NaN</v>` and the readers then disagree on;
 * - ExcelJS stripping the backslash escapes of a number format (`0.0\%` reads as `0.0%`);
 * - four sheet-name rows (a control character, over 31 characters, `history`, `HISTORY`);
 * - the `lossy.xlsx` dropped ORDER;
 * - an empty-string cached formula result, which the ExcelJS reader loses;
 * - the LibreOffice attribute dialect (`"true"`/`"false"`), which the ExcelJS reader misses.
 *
 * If a parity test fails, the OOXML is the arbiter: read the fixture's raw XML before changing a
 * reader, and never widen a normalization to make it pass.
 */

/**
 * Rounds a number to nine decimal places. Normalization #1; anything else is passed through.
 *
 * @param {*} value The value to round.
 * @returns {*}
 */
export function roundNumber(value) {
  return typeof value === 'number' ? Math.round(value * 1e9) / 1e9 : value;
}

/**
 * Collapses a font object to `null` unless it carries a property the model actually tracks (bold,
 * italic, underline, or an explicit argb color). Normalization #3, font half.
 *
 * @param {object|null|undefined} font The font as a reader reported it.
 * @returns {object|null}
 */
export function normalizeFont(font) {
  if (!font) {
    return null;
  }

  const { bold, italic, underline, color } = font;
  const argb = color && typeof color.argb === 'string' ? color : undefined;

  return bold || italic || underline || argb ? { bold, italic, underline, color: argb } : null;
}

/**
 * Collapses a fill object to `null` unless it is a solid pattern carrying a foreground color.
 * Normalization #3, fill half.
 *
 * @param {object|null|undefined} fill The fill as a reader reported it.
 * @returns {object|null}
 */
export function normalizeFill(fill) {
  return fill && fill.pattern === 'solid' && fill.fgColor ? fill : null;
}

/**
 * Applies `normalizeFont`/`normalizeFill` to a cell style. Alignment and border are passed through
 * UNNORMALIZED on purpose: a previous review confirmed the existing normalizations leave those two
 * exposed, and that property must survive here too, or a real alignment/border divergence would be
 * silently hidden rather than caught.
 *
 * @param {object|null|undefined} style The cell style as a reader reported it.
 * @returns {object|null}
 */
export function normalizeStyle(style) {
  if (!style) {
    return null;
  }

  const font = normalizeFont(style.font);
  const fill = normalizeFill(style.fill);
  const { alignment = null, border = null } = style;

  return font || fill || alignment || border ? { alignment, font, fill, border } : null;
}

/**
 * `JSON.stringify`'s replacer for one snapshot: every cell value and cached result is rounded,
 * every cell style is normalized, everything else is passed through as-is.
 *
 * @param {string} key The property name.
 * @param {*} value The property value.
 * @returns {*}
 */
export function normalizeValue(key, value) {
  if (key === 'style') {
    return normalizeStyle(value);
  }

  return key === 'value' || key === 'result' ? roundNumber(value) : value;
}

/**
 * Normalizes a whole workbook snapshot for cross-engine comparison: normalization #2 reduces every
 * conditional-formatting block to its `ref`, #1/#3 run through `normalizeValue`, and the JSON round
 * trip is #4.
 *
 * @param {object} snapshot The workbook snapshot.
 * @returns {Array} The snapshot's sheets, normalized and JSON round-tripped.
 */
export function strip(snapshot) {
  return JSON.parse(JSON.stringify(
    snapshot.sheets.map(sheet => ({
      ...sheet, conditionalFormatting: sheet.conditionalFormatting.map(cf => cf.ref),
    })),
    normalizeValue,
  ));
}
