import { readFileSync } from 'node:fs';
import { test, type Page, type TestInfo } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { PORTAL, emulate } from '../harness';
import { attachEvidence, declareTarget, readEnvironment } from '../evidence';
import { pageLines } from '../../lib/a11y-check-run.mjs';
import { DISCOVERY_TAGS, discoveryFindings } from '../../lib/axe-discovery.mjs';
import { DISCOVERY_SCANS, discoveryUrl, openDiscoveryTarget, type DiscoveryScan } from './discovery-targets';

/**
 * The axe discovery run: axe with the best-practice, AAA and experimental rules beside the WCAG 2.2 A
 * and AA ones (`DISCOVERY_TAGS`), over the catalog, the states of `discovery-pages.mjs`, every page in
 * the dark scheme and right to left, and the phone page on a Pixel 7 beside the iPhone. It never reads
 * or writes the baseline (`../axe-baseline.json`) and never posts to the `A11y / axe report` check run:
 * its records are for triage (`lib/axe-discovery.mjs`), every "needs review" result listed with axe's
 * reason, and its check run is `A11y / axe-discovery report`. Nightly only.
 *
 * The targets, their states and their variants are `discovery-targets.ts`, which the pull request's
 * guard (`../discovery-targets.spec.ts`) opens too. A variant that did not apply (no dark class on the
 * grid, or a grid still left to right) fails its test as a tooling error: the document lists the target
 * as not measured, never as a clean pass.
 *
 * Report-only: a test fails for tooling only. Policy: `tests/AGENTS.md`, "A11y: the checks beyond axe".
 */

// A discovery page is not in `a11y/pages.mjs`, the file the check run annotates a page's findings on, so
// its records name their entry in `discovery-pages.mjs` instead.
const DISCOVERY_FILE = 'tests/a11y/checks/discovery-pages.mjs';
const DISCOVERY_LINES = pageLines(readFileSync(new URL('./discovery-pages.mjs', import.meta.url), 'utf8'));

/**
 * Scans one target.
 *
 * @param page The page.
 * @param testInfo The running test.
 * @param scan The target.
 */
async function discover(page: Page, testInfo: TestInfo, scan: DiscoveryScan): Promise<void> {
  const { entry, theme, variant } = scan;
  const startedAt = Date.now();
  const target = { page: entry.id, theme, state: entry.state, variant, url: discoveryUrl(scan) };

  declareTarget(testInfo, target);

  const opened = await openDiscoveryTarget(page, scan);
  const { root } = opened;
  const environment = await readEnvironment(page);
  // Passing rules keep one node each: only their count is read. `options()` replaces every option, so it
  // comes before `withTags()`.
  const results = await new AxeBuilder({ page }).options({ resultTypes: ['violations', 'incomplete'] })
    .withTags(DISCOVERY_TAGS).include(root).include(PORTAL).analyze();
  const line = DISCOVERY_LINES.get(entry.id);
  const findings = discoveryFindings({ violations: results.violations, incomplete: results.incomplete }, line ? { file: DISCOVERY_FILE, line } : {});

  await attachEvidence(testInfo, {
    target,
    startedAt,
    environment,
    findings,
    criteria: [],
    pageErrors: opened.pageErrors,
    detail: {
      axeCoreVersion: results.testEngine.version,
      counts: { violations: results.violations.length, incomplete: results.incomplete.length, passes: results.passes.length },
      rules: {
        violations: results.violations.map(rule => ({ id: rule.id, impact: rule.impact, tags: rule.tags, nodes: rule.nodes.length })),
        incomplete: results.incomplete.map(rule => ({ id: rule.id, impact: rule.impact, tags: rule.tags, nodes: rule.nodes.length })),
      },
    },
  });
}

for (const scan of DISCOVERY_SCANS) {
  const body = async({ page }: { page: Page }, testInfo: TestInfo) => discover(page, testInfo, scan);

  if (scan.entry.device) {
    const device = scan.entry.device;

    test.describe(() => {
      test.use(emulate(device));
      test(scan.title, body);
    });
  } else {
    test(scan.title, body);
  }
}
