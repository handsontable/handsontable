import { test, expect, type Page } from '@playwright/test';
import { A11Y_PAGES } from './pages.mjs';
import { emulate } from './harness';
import { DISCOVERY_SCANS, openDiscoveryTarget } from './checks/discovery-targets';

/**
 * The pull request's guard for the axe discovery run (`checks/axe-discovery.spec.ts`). That run opens
 * every page of the catalog and of `checks/discovery-pages.mjs` in the dark scheme, right to left and
 * on a second phone, and it runs in the audit only (its weekly schedule or a dispatch). So a page
 * whose fixture does not build a variant, or whose state the keyboard does not reach in one, used to
 * fail first in the next audit, as a target that was not measured, long after the pull request that
 * added it had merged.
 *
 * This spec opens the same targets the same way (`openDiscoveryTarget()`, the function the discovery
 * run calls) and scans nothing: the fixture builds, the variant applies, the state is reached, and the
 * page throws no error. It runs in the axe scan's job, where a failed test is a tooling failure, and
 * covers what no pull request builds otherwise, on the main theme:
 *
 * - every page in each variant (the scan builds a catalog page as its fixture loads only);
 * - the pages of `checks/discovery-pages.mjs` as their fixtures load too, since the scan never opens them.
 *
 * One theme is enough. A theme is a stylesheet: it decides neither whether a fixture reads the
 * direction query or writes a class the dark script sees, nor which key reaches a state. The discovery
 * run itself builds right to left on the main theme only.
 *
 * Policy: `tests/AGENTS.md`, "A11y: the checks beyond axe", the axe discovery run.
 */
const CATALOG = new Set(A11Y_PAGES.map(page => page.id));
const GUARDED = DISCOVERY_SCANS.filter(({ entry, theme, variant }) => theme === 'main' && (variant !== null || !CATALOG.has(entry.id)));

for (const scan of GUARDED) {
  const body = async({ page }: { page: Page }) => {
    const opened = await openDiscoveryTarget(page, scan);

    // The discovery run refuses a target whose page threw while it was measured (`attachEvidence()`).
    expect(opened.pageErrors, 'the page threw no error while it was built and its state was reached').toEqual([]);
  };
  // The discovery run's own title for the target, so a failure here names the audit target it would break.
  const title = scan.title.replace(/^discover /, 'open ');

  if (scan.entry.device) {
    const device = scan.entry.device;

    test.describe(() => {
      test.use(emulate(device));
      test(title, body);
    });
  } else {
    test(title, body);
  }
}
