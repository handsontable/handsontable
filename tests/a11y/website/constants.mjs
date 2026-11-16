/**
 * What other modules need to know about the website scan without loading its page list: the viewports it scans and
 * the deploy it reads by default. No import and no I/O, so the findings catalog (`lib/a11y-issues.mjs`) and the findings
 * ledger (`.github/scripts/lib/a11y-ledger.mjs`) read them without `pages.mjs`.
 */

/**
 * The widths the website scan reads each page at, by name: what a baseline entry's `theme` holds. The website repository's
 * own scan (`scripts/axe-baseline.mjs` there, `VIEWPORTS`) uses the same names and sizes, so its baseline seeds this one.
 */
export const WEBSITE_VIEWPORTS = Object.freeze({
  phone: Object.freeze({ width: 390, height: 844 }),
  desktop: Object.freeze({ width: 1440, height: 900 }),
});
export const WEBSITE_THEMES = Object.keys(WEBSITE_VIEWPORTS);
/**
 * Where the website scan reads the site when `WEBSITE_A11Y_BASE_URL` is not set: production, the site visitors get. The
 * findings ledger records a scan of this deploy only.
 */
export const DEFAULT_WEBSITE_BASE_URL = 'https://handsontable.com';
