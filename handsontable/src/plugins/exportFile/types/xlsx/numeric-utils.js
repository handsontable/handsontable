/**
 * Converts a Numbro.js format pattern to an Excel `numFmt` string.
 *
 * Applies the minimum transformation needed for common patterns.
 * Numbro uses `0,0` to mean "thousands-grouped, at least one digit";
 * Excel uses `#,##0` for the same. All other pattern characters are
 * compatible between the two systems.
 *
 * Examples:
 * - `'$0,0.00'` → `'$#,##0.00'`
 * - `'0,0.00'`  → `'#,##0.00'`
 * - `'0,0'`     → `'#,##0'`
 * - `'0.00'`    → `'0.00'` (unchanged)
 * - `'0%'`      → `'0%'` (unchanged)
 *
 * @private
 * @param {*} pattern Numbro format pattern string (e.g. `'$0,0.00'`).
 * @returns {string|null}
 */
export function numbroPatternToExcelNumFmt(pattern) {
  if (!pattern || typeof pattern !== 'string') {
    return null;
  }

  return pattern.replace(/0,0/g, '#,##0');
}
