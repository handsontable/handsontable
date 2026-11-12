/**
 * What other modules need to know about the docs site scan without loading its page list: the color schemes
 * it scans and the deploy it reads by default. No import and no I/O, so the findings catalog
 * (`lib/a11y-issues.mjs`) and the findings ledger (`.github/scripts/lib/a11y-ledger.mjs`) read them without
 * `pages.mjs`, which loads the docs visual list and reads every guide's source to find its permalink.
 */

export const DOCS_THEMES = ['light', 'dark'];
/**
 * Where the scan reads the docs from when `DOCS_A11Y_BASE_URL` is not set: the staging deploy of `develop`,
 * which the docs staging workflow redeploys after every docs merge. The findings ledger records a scan of this
 * deploy only.
 */
export const DEFAULT_DOCS_BASE_URL = 'https://handsontable-docs-staging.pages.dev/docs';
