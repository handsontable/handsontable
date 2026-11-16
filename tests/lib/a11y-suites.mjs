/**
 * The two axe scans the comparator, the reports and the findings serve, and what differs between them.
 *
 * - `product`: the fixture pages of `tests/a11y/pages.mjs` on the three grid themes, against
 *   `tests/a11y/axe-baseline.json` (`tests/a11y/axe.spec.ts`; `tests/AGENTS.md`, "A11y: the axe scan and
 *   its baseline").
 * - `docs`: the docs site pages of `tests/a11y/docs/pages.mjs` in the site's light and dark color schemes,
 *   against `tests/a11y/docs/docs-baseline.json` (`tests/a11y/docs/docs-axe.spec.ts`; `tests/AGENTS.md`,
 *   "A11y: the docs site scan").
 *
 * The baseline's shape, its fingerprint, the comparator and the findings document are the same for both,
 * so one report reads like the other and the findings ledger reads both with one reader. A suite only says
 * where its pages are, how to open one, which themes it scans and which files it owns.
 */
import { A11Y_THEMES, BASELINE_FILE } from './a11y-baseline.mjs';
import { A11Y_PAGES, fixtureUrl, stateSteps } from '../a11y/pages.mjs';
import { DEFAULT_DOCS_BASE_URL, DOCS_PAGES, DOCS_THEMES, docsBaseUrl as resolveDocsBaseUrl, docsStateSteps, docsUrl } from '../a11y/docs/pages.mjs';

// The fixture server's default address (`tests/playwright.config.ts`); `HOT_TEST_PORT` moves it.
export const FIXTURE_SERVER = 'http://localhost:8123';
export const DOCS_BASELINE_FILE = 'a11y/docs/docs-baseline.json';
export const A11Y_SUITE_IDS = ['product', 'docs'];

/**
 * A suite whose `locate()` passes the URL each scan opened, so a page that needs one (see
 * `PRODUCT_SUITE.locate()`) links to what was scanned.
 *
 * @param {object} suite The suite.
 * @param {object[]} [scans] The completed scans: `page`, `theme`, `url`.
 * @returns {object} The suite, or the same one when there is no scan.
 */
export function withScannedUrls(suite, scans = []) {
  if (scans.length === 0) {
    return suite;
  }

  const urlOf = new Map(scans.map(scan => [`${scan.page}|${scan.theme}`, scan.url]));

  return Object.freeze({
    ...suite,
    locate: (page, theme) => suite.locate(page, theme, urlOf.get(`${page.id}|${theme}`)),
  });
}

/**
 * The product scan.
 */
export const PRODUCT_SUITE = Object.freeze({
  id: 'product',
  title: 'A11y / axe',
  reportTitle: 'Accessibility report',
  // The HTML report's file name, which is also its artifact's name in CI (uploaded unzipped).
  reportFile: 'a11y-report.html',
  // Relative to `tests/`.
  baselineFile: BASELINE_FILE,
  pagesFile: 'tests/a11y/pages.mjs',
  artifact: 'a11y-axe-results',
  outputDir: 'test-results/a11y',
  pages: A11Y_PAGES,
  themes: A11Y_THEMES,
  policy: { file: 'tests/AGENTS.md', anchor: 'a11y-the-axe-scan-and-its-baseline', title: 'A11y: the axe scan and its baseline' },
  /**
   * Where a page is and how to reach its state.
   *
   * A page with a `licensePreset` needs a key `pages.mjs` cannot build, so its link takes the URL the scan
   * opened (`scannedPath`, a scan's `url`) when the caller has one; without it the link opens the fixture
   * with no license key.
   *
   * @param {object} page The page.
   * @param {string} theme The theme.
   * @param {string} [scannedPath] The URL the scan of this page and theme opened.
   * @returns {{path: string, href: string, steps: string|undefined}} The fixture path, the link and the steps.
   */
  locate(page, theme, scannedPath) {
    const path = page.licensePreset && typeof scannedPath === 'string' && scannedPath.startsWith('/tests/fixtures/demo/')
      ? scannedPath : fixtureUrl(page, theme);

    return { path, href: `${FIXTURE_SERVER}${path}`, steps: stateSteps(page) };
  },
  /**
   * A page as the findings document lists it under `pages`.
   *
   * @param {object} page The page.
   * @returns {object} The entry.
   */
  pageEntry(page) {
    return { fixture: `/tests/fixtures/demo/${page.fixture}`, query: page.query ?? null, steps: stateSteps(page), surface: page.surface ?? null };
  },
  about: 'Accessibility findings of the axe scan (tests/a11y/). Fix a finding, then change tests/a11y/axe-baseline.json as '
    + 'its remedy says. `url` is relative to the fixture server (http://localhost:8123 by default); `steps` reach the scanned '
    + 'state; `selector` and `domPath` locate the element in the browser\'s developer tools.',
  reproduce: {
    build: 'npm --prefix handsontable run build:umd && npm --prefix handsontable run build:styles.min '
      + '&& npm --prefix handsontable run build:themes-css.min',
    scan: 'npm --prefix tests run test:a11y',
    outputs: 'tests/test-results/a11y/ (a11y-report.html, a11y-findings.json, summary.md, comparison.json, scans/)',
  },
  howToFind: 'start the fixture server (<code>npm --prefix tests run test:a11y</code> starts it, or <code>node tests/support/static-server.mjs</code> '
    + 'from the repository root after building), open the fixture link, follow the steps, then paste the selector into the browser\'s '
    + 'developer tools: <code>document.querySelector(\'…\')</code>. The DOM path is the full route from <code>html</code> when the short '
    + 'selector matches more than one element. The fixture links assume the default port, 8123.',
  linkNote: 'A page links to its fixture.',
});

/**
 * The docs site scan, reading the deploy at `baseUrl`.
 *
 * @param {string} [baseUrl] The docs base URL the run scanned (`DOCS_A11Y_BASE_URL`).
 * @returns {object} The suite.
 */
export function docsSuite(baseUrl = DEFAULT_DOCS_BASE_URL) {
  return Object.freeze({
    id: 'docs',
    title: 'A11y / docs axe',
    reportTitle: 'Docs site accessibility report',
    // Not the product's name: a run that calls both scans uploads both reports unzipped, named after the file.
    reportFile: 'docs-a11y-report.html',
    baselineFile: DOCS_BASELINE_FILE,
    pagesFile: 'tests/a11y/docs/pages.mjs',
    artifact: 'docs-a11y-axe-results',
    outputDir: 'test-results/a11y-docs',
    pages: DOCS_PAGES,
    themes: DOCS_THEMES,
    baseUrl,
    policy: { file: 'tests/AGENTS.md', anchor: 'a11y-the-docs-site-scan', title: 'A11y: the docs site scan' },
    /**
     * Where a page is and how to reach its state: the path is root-relative (`/docs/...`), so the
     * findings ledger keeps it whatever deploy the run read.
     *
     * @param {object} page The page.
     * @param {string} theme The color scheme.
     * @returns {{path: string, href: string, steps: string}} The path, the link and the steps.
     */
    locate(page, theme) {
      const href = docsUrl(page, theme, baseUrl);

      return { path: new URL(href).pathname, href, steps: docsStateSteps(page, theme) };
    },
    /**
     * A page as the findings document lists it under `pages`.
     *
     * @param {object} page The page.
     * @returns {object} The entry.
     */
    pageEntry(page) {
      return { fixture: new URL(docsUrl(page, undefined, baseUrl)).pathname, query: null, steps: docsStateSteps(page), surface: page.surface ?? null };
    },
    about: 'Accessibility findings of the docs site scan (tests/a11y/docs/). Fix a finding in docs/, then change '
      + 'tests/a11y/docs/docs-baseline.json as its remedy says. `url` is the page\'s path on the docs deploy the run read '
      + `(${baseUrl}); \`steps\` reach the scanned state, in the light or dark theme; \`selector\` and \`domPath\` locate the element `
      + 'in the browser\'s developer tools.',
    reproduce: {
      build: 'none: the scan reads a deployed docs site (DOCS_A11Y_BASE_URL; the develop staging deploy by default). For a local '
        + 'build: npm --prefix docs run build, then npm --prefix docs run preview, and DOCS_A11Y_BASE_URL=http://localhost:4321/docs',
      scan: 'npm --prefix tests run test:a11y-docs',
      outputs: 'tests/test-results/a11y-docs/ (docs-a11y-report.html, a11y-findings.json, summary.md, comparison.json, scans/)',
    },
    howToFind: `open the page link (the deploy the run read, ${baseUrl}), pick the theme in the header's theme select, follow the steps, `
      + 'then paste the selector into the browser\'s developer tools: <code>document.querySelector(\'…\')</code>. The DOM path is the '
      + 'full route from <code>html</code> when the short selector matches more than one element.',
    linkNote: 'A page links to the deploy the run read.',
  });
}

/**
 * A suite by id.
 *
 * @param {string} id `product` or `docs`.
 * @param {{docsBaseUrl?: string}} [options] The docs base URL (`DOCS_A11Y_BASE_URL`, checked by `docsBaseUrl()`).
 * @returns {object} The suite.
 */
export function suiteFor(id, { docsBaseUrl } = {}) {
  if (id === 'product') {
    return PRODUCT_SUITE;
  }
  if (id === 'docs') {
    return docsSuite(resolveDocsBaseUrl(docsBaseUrl));
  }

  throw new Error(`Unknown a11y suite ${JSON.stringify(id)}; expected one of ${A11Y_SUITE_IDS.join(', ')}`);
}
