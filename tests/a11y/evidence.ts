import { writeFileSync } from 'node:fs';
import { expect, type Page, type TestInfo } from '@playwright/test';
import { EVIDENCE_ATTACHMENT, EVIDENCE_SCHEMA, TARGET_ANNOTATION } from '../lib/a11y-evidence.mjs';

/**
 * The spec side of the evidence shape (`lib/a11y-evidence.mjs`): what a check's test says about its
 * target before it measures, and the part it attaches once it has. The reporter
 * (`reporters/a11y-checks.ts`) merges the parts of one check into `test-results/a11y-checks/<check>.json`.
 * Policy: `tests/AGENTS.md`, "A11y: the checks beyond axe".
 */

export interface EvidenceTarget {
  /** The page's id in the catalog (`pages.mjs`), or the id a check gives a page of its own. */
  page: string;
  theme: string;
  /** The catalog state the page was measured in. */
  state?: string | null;
  /** A variant of the page the check made (`dark`, `rtl`, `pixel-7`), or none. */
  variant?: string | null;
  /** The fixture URL, relative to the fixture server. */
  url?: string | null;
}

export interface EvidenceFinding {
  /** What was found, as a kebab-case id (`keyboard-trap`). */
  kind: string;
  /** The WCAG 2.2 criteria it is evidence against (`['2.1.2']`). */
  criteria: string[];
  severity: 'critical' | 'serious' | 'moderate' | 'minor' | 'advisory';
  /** The element, as a selector. A finding names an element, a step, or both. */
  selector?: string;
  /** The step that showed it, in words (`Tab 4`, `ArrowDown from (1, 1)`). */
  step?: string;
  /** What was measured, as flat values. */
  measured?: Record<string, unknown>;
  /** What was expected instead, when there is a value to compare. */
  expected?: Record<string, unknown>;
  /** Why it is a finding, one sentence. */
  reason: string;
  /** A file under `tests/` the annotation goes on instead of the page's line in `pages.mjs`. */
  file?: string;
  line?: number;
}

export interface EvidenceEnvironment {
  browser: string;
  browserVersion: string | null;
  handsontableVersion: string | null;
  handsontableBuildDate: string | null;
}

/**
 * Names the target of the running test, before anything can fail: the reporter reads it from the
 * annotation to record a test that failed before it attached its part as a target that was not
 * measured.
 *
 * @param testInfo The running test.
 * @param target The target.
 */
export function declareTarget(testInfo: TestInfo, target: EvidenceTarget): void {
  testInfo.annotations.push({ type: TARGET_ANNOTATION, description: JSON.stringify(target) });
}

/**
 * The browser and the Handsontable build the page runs, for the document's run metadata.
 *
 * @param page The page, with the bundle loaded.
 * @returns The environment.
 */
export async function readEnvironment(page: Page): Promise<EvidenceEnvironment> {
  const build = await page.evaluate(() => {
    const hot = (window as unknown as { Handsontable?: { version?: string; buildDate?: string } }).Handsontable;

    return { version: hot?.version ?? null, buildDate: hot?.buildDate ?? null };
  });

  return {
    browser: page.context().browser()?.browserType().name() ?? 'unknown',
    browserVersion: page.context().browser()?.version() ?? null,
    handsontableVersion: build.version,
    handsontableBuildDate: build.buildDate,
  };
}

/**
 * Attaches the part of the running test: its target, its findings, and what it measured. A page that
 * threw while it was measured (a plugin's focus handler under a key the check pressed) gets no part: the
 * test fails, and the reporter records the target as not measured, with the error, the same way
 * `reachState()` treats an error before the state is reached. An empty `findings` list from a page
 * that crashed halfway would read as a clean target.
 *
 * @param testInfo The running test.
 * @param part The part.
 * @param part.target The target.
 * @param part.startedAt When the test started measuring (`Date.now()`).
 * @param part.environment What `readEnvironment()` returned.
 * @param part.findings The findings; an empty list is evidence that nothing was found.
 * @param part.criteria The criteria this target evaluated, when it is fewer than the check's.
 * @param part.detail Everything measured, written to the target's detail file beside the document.
 * @param part.problems Steps the test could not take (a probe whose setup never came): tooling problems
 *   the document lists, while the findings of the steps that ran are kept.
 * @param part.pageErrors The errors the page threw that the test has not reported elsewhere: `opened.pageErrors`
 *   of `openTarget()`, or, for a test that loaded the page more than once, the one list it passed to every
 *   `openTarget()` as `pageErrors`.
 */
export async function attachEvidence(testInfo: TestInfo, {
  target, startedAt, environment, findings, criteria, detail, problems, pageErrors,
}: {
  target: EvidenceTarget;
  startedAt: number;
  environment: EvidenceEnvironment;
  findings: EvidenceFinding[];
  criteria?: string[];
  detail?: unknown;
  problems?: string[];
  pageErrors: string[];
}): Promise<void> {
  expect(pageErrors, 'the page threw no error while it was measured').toEqual([]);

  const part = {
    schema: EVIDENCE_SCHEMA,
    target,
    durationMs: Date.now() - startedAt,
    environment,
    ...(criteria ? { criteria } : {}),
    findings,
    ...(problems && problems.length > 0 ? { problems } : {}),
    ...(detail === undefined ? {} : { detail }),
  };
  const file = testInfo.outputPath('evidence.json');

  writeFileSync(file, `${JSON.stringify(part, null, 2)}\n`);
  await testInfo.attach(EVIDENCE_ATTACHMENT, { path: file, contentType: 'application/json' });
}
