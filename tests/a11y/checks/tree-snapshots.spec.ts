import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { test, type Page, type TestInfo } from '@playwright/test';
import { A11Y_PAGES, fixtureUrl, type A11yPage } from '../pages.mjs';
import { emulate, openTarget, reachState } from '../harness';
import { attachEvidence, declareTarget, readEnvironment, type EvidenceFinding } from '../evidence';
import { A11Y_THEMES } from '../../lib/a11y-baseline.mjs';
import { TREE_CRITERIA, diffSnapshot, maskSnapshot, nameFindings, structureFindings } from '../../lib/aria-tree.mjs';
import { flattenAxTree, treeSnapshot } from './ax-tree';

/**
 * The accessibility-tree snapshots: WCAG 1.3.1, 1.3.2 and 4.1.2, read from Chromium's accessibility
 * tree of the grid's root container and its portal, on every page of the catalog (`../pages.mjs`) in its
 * state and on every theme.
 *
 * - **Structure** (`structureFindings()` in `lib/aria-tree.mjs`): each grid's rows in reading order, with
 *   their row and column headers, their row and column indexes, and whether one row is exposed twice.
 * - **Names and roles** (`nameFindings()`): every control has a name, every header has one, every tab
 *   stop has a role.
 * - **Goldens**: Playwright's `ariaSnapshot()` of the grid and the portal, on the main theme, kept under
 *   `../tree-goldens/<page>.yml`. A difference is advisory (`tree-snapshot-changed`): a change to a role,
 *   a name or the structure for a reviewer to read. The server's origin and the installed version are
 *   masked first (`maskSnapshot()`). `HOT_A11Y_UPDATE_GOLDENS=1` records them.
 *
 * The axe scan checks the tree against axe's rules; this check reads the tree as a screen reader gets it,
 * in order. Report-only: a test fails for tooling only. Policy: `tests/AGENTS.md`, "A11y: the checks
 * beyond axe".
 */

const GOLDENS = new URL('../tree-goldens/', import.meta.url);
const GOLDEN_THEME = 'main';
const UPDATE_GOLDENS = process.env.HOT_A11Y_UPDATE_GOLDENS === '1';

/**
 * Compares the snapshot with the page's golden, or records it in update mode.
 *
 * @param pageId The page.
 * @param snapshot The snapshot.
 * @returns The advisory findings.
 */
function compareGolden(pageId: string, snapshot: string): EvidenceFinding[] {
  const file = new URL(`${pageId}.yml`, GOLDENS);

  if (UPDATE_GOLDENS) {
    mkdirSync(GOLDENS, { recursive: true });
    writeFileSync(file, snapshot);

    return [];
  }
  if (!existsSync(file)) {
    return [{
      kind: 'tree-golden-missing', criteria: ['1.3.1'], severity: 'advisory', step: 'accessibility snapshot',
      reason: `No accessibility-tree golden is recorded for this page: run the check with HOT_A11Y_UPDATE_GOLDENS=1 and review ${pageId}.yml`,
    }];
  }

  const difference = diffSnapshot(readFileSync(file, 'utf8'), snapshot);

  return difference ? [{
    kind: 'tree-snapshot-changed',
    criteria: ['1.3.1', '4.1.2'],
    severity: 'advisory',
    step: `accessibility snapshot, line ${difference.line}`,
    measured: { expected: difference.expected ?? '(end)', actual: difference.actual ?? '(end)', lines: `${difference.expectedLines} -> ${difference.actualLines}` },
    reason: `The accessibility tree differs from its golden (tests/a11y/tree-goldens/${pageId}.yml): review the change, and record it again when it is right`,
  }] : [];
}

/**
 * Reads the tree of one page in one theme.
 *
 * @param page The page.
 * @param testInfo The running test.
 * @param entry The catalog entry.
 * @param theme The theme.
 */
async function readTree(page: Page, testInfo: TestInfo, entry: A11yPage, theme: string): Promise<void> {
  const startedAt = Date.now();
  const target = { page: entry.id, theme, state: entry.state, url: fixtureUrl(entry, theme) };

  declareTarget(testInfo, target);

  const opened = await openTarget(page, entry, theme);

  await reachState(page, entry, opened);

  const environment = await readEnvironment(page);
  const cdp = await page.context().newCDPSession(page);

  await cdp.send('DOM.enable');
  await cdp.send('Accessibility.enable');

  const nodes = await flattenAxTree(page, cdp, opened.root);
  const findings: EvidenceFinding[] = [...structureFindings(nodes), ...nameFindings(nodes)];
  // What the run decides (the server's port, the version) is masked, so a golden moves for the tree only.
  const snapshot = maskSnapshot(await treeSnapshot(page, opened.root), {
    origin: new URL(page.url()).origin, version: environment.handsontableVersion,
  });

  if (theme === GOLDEN_THEME) {
    findings.push(...compareGolden(entry.id, snapshot));
  }

  const roles: Record<string, number> = {};

  for (const node of nodes) {
    roles[node.role] = (roles[node.role] ?? 0) + 1;
  }

  await attachEvidence(testInfo, {
    target, startedAt, environment, findings, criteria: TREE_CRITERIA, detail: { nodes: nodes.length, roles, snapshot },
    pageErrors: opened.pageErrors,
  });
}

for (const theme of A11Y_THEMES) {
  for (const entry of A11Y_PAGES) {
    const body = async({ page }: { page: Page }, testInfo: TestInfo) => readTree(page, testInfo, entry, theme);
    const title = `tree of ${entry.id} on ${theme}`;

    if (entry.device) {
      const device = entry.device;

      test.describe(() => {
        test.use(emulate(device));
        test(title, body);
      });
    } else {
      test(title, body);
    }
  }
}
