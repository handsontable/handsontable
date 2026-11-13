/**
 * The checks beyond axe on the sites around the product: the registry, the pure half.
 *
 * The product checks (`EVIDENCE_CHECKS` in `lib/a11y-evidence.mjs`) measure the grid on the fixture pages. The
 * site checks measure a deployed site the same way: the keyboard, the page structure, focus and contrast,
 * reflow, forced colors and motion. Each is one Playwright project of `playwright.a11y-sites.config.ts`, which
 * runs one site per run (`HOT_A11Y_SITE`), and each writes the same evidence document as a product check
 * (`mergeEvidence()`), into the site's own folder (`siteOutputDir()`), under a check id that names the site
 * (`docs-keyboard`), so a site's check runs, ledger rows and catalog rules never meet the product's. Policy:
 * `tests/AGENTS.md`, "A11y: the site checks beyond axe". No I/O in here.
 */

/**
 * The sites a check can measure. The docs site is the deploy `DOCS_A11Y_BASE_URL` names (the develop staging
 * deploy by default, `tests/a11y/docs/constants.mjs`).
 */
export const SITES = ['docs'];
/**
 * What a site's checks are called in a check run and a summary.
 */
export const SITE_TITLES = Object.freeze({ docs: 'Docs site' });
/**
 * The kinds of site check: one spec each under `a11y/sites/`, shared by every site that lists the kind in
 * `sites`. `criteria` is what the check evidences on that site; a target may evaluate fewer (a page with no
 * popup evaluates no popup criterion), never more.
 */
export const SITE_CHECK_KINDS = Object.freeze({
  structure: {
    title: 'Page structure, titles, and consistency',
    spec: 'structure.spec.ts',
    // 2.4.4 is advisory only: a link's purpose in context needs a person, and the check lists the names that
    // say nothing on their own.
    criteria: ['1.3.1', '2.4.1', '2.4.2', '2.4.4', '2.4.5', '2.4.6', '3.1.1', '3.2.3', '3.2.4', '3.2.6'],
    sites: ['docs'],
  },
  keyboard: {
    title: 'Keyboard walk',
    spec: 'keyboard.spec.ts',
    criteria: ['2.1.1', '2.1.2', '2.1.4', '2.4.1', '2.4.3', '3.2.1', '3.2.2', '4.1.2'],
    sites: ['docs'],
  },
  'focus-contrast': {
    title: 'Focus appearance and non-text contrast',
    spec: 'focus-contrast.spec.ts',
    criteria: ['1.4.11', '2.4.7', '2.4.11'],
    sites: ['docs'],
  },
  reflow: {
    title: 'Reflow, zoom, text spacing, and orientation',
    spec: 'reflow.spec.ts',
    criteria: ['1.3.4', '1.4.4', '1.4.10', '1.4.12'],
    sites: ['docs'],
  },
  'forced-colors-motion': {
    title: 'Forced colors and motion',
    spec: 'forced-colors-motion.spec.ts',
    criteria: ['1.4.1', '2.2.2', '2.3.3', '2.4.7'],
    sites: ['docs'],
  },
});

/**
 * The id of a site check: the site, then the kind (`docs-keyboard`).
 *
 * @param {string} site The site.
 * @param {string} kind The kind.
 * @returns {string} The check id.
 */
export function siteCheckId(site, kind) {
  return `${site}-${kind}`;
}

/**
 * Every site check, keyed by its id, in the shape of `EVIDENCE_CHECKS`, so `checksForRun()`, `mergeEvidence()`,
 * `validateEvidence()` and the checks reporter read it as a registry of their own. None is in the short suite:
 * a site check reads a deployed site and runs from its site's workflow only.
 */
export const SITE_CHECKS = Object.freeze(Object.fromEntries(SITES.flatMap(site => Object.entries(SITE_CHECK_KINDS)
  .filter(([, kind]) => kind.sites.includes(site))
  .map(([kind, definition]) => [siteCheckId(site, kind), Object.freeze({
    title: `${SITE_TITLES[site]}: ${definition.title}`,
    spec: definition.spec,
    criteria: [...definition.criteria],
    pullRequest: false,
    site,
    kind,
  })]))));

/**
 * The site a run measures, read from `HOT_A11Y_SITE`: one of `SITES`, `docs` when unset.
 *
 * @param {string|undefined} value The configured site.
 * @returns {string} The site.
 * @throws {Error} On a site this tier does not have.
 */
export function siteOf(value) {
  if (value === undefined || value === '') {
    return 'docs';
  }
  if (!SITES.includes(value)) {
    throw new Error(`HOT_A11Y_SITE must be one of ${SITES.join(', ')}, received ${JSON.stringify(value)}.`);
  }

  return value;
}

/**
 * The checks of one site, as a registry.
 *
 * @param {string} site The site.
 * @returns {Record<string, object>} The checks.
 */
export function siteChecks(site) {
  return Object.fromEntries(Object.entries(SITE_CHECKS).filter(([, check]) => check.site === site));
}

/**
 * Where a site's evidence documents go, relative to `tests/`, and the artifact CI uploads them as. Outside the
 * product checks' folder and outside the `playwright-report-*` glob the flake ledger reads.
 *
 * @param {string} site The site.
 * @returns {string} The folder.
 */
export function siteOutputDir(site) {
  return `test-results/a11y-${site}-checks`;
}

/**
 * The artifact a site's evidence goes up as; the findings ledger reads it by this name.
 *
 * @param {string} site The site.
 * @returns {string} The artifact name.
 */
export function siteEvidenceArtifact(site) {
  return `${site}-a11y-checks-evidence`;
}
