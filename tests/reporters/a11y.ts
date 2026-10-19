import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { FullConfig, FullResult, Reporter, Suite, TestError } from '@playwright/test/reporter';
import {
  A11Y_MODE,
  BASELINE_FILE,
  compareViolations,
  renderAnnotations,
  renderSummary,
  targetFingerprint,
  validateBaseline,
  type BaselineDocument,
  type Finding,
} from '../lib/a11y-baseline.mjs';
import { A11Y_PAGES } from '../a11y/pages.mjs';

/**
 * Compares the run's axe scans with the committed baseline and sets the run's exit status.
 *
 * Each test of `a11y/axe.spec.ts` attaches its raw scan (`axe-scan`, a JSON file under
 * `test-results/a11y/scans/`). This reporter reads every attachment of the last attempt of every
 * test, flattens the violations into findings keyed by page, theme, rule and target fingerprint
 * (`lib/a11y-baseline.mjs`), and asks `compareViolations()` what is new, matched, stale and
 * unverified. It then writes `test-results/a11y/comparison.json` and `summary.md`, appends the
 * summary to the GitHub job summary, prints one annotation per new finding and stale entry, and
 * returns the status the mode decides: in `warn` mode Playwright's own status (a failed scan is a
 * tooling failure and stays red; a violation never is), in `block` mode `failed` on a new finding
 * or a stale entry as well.
 *
 * Three things are red whatever the mode, because they mean the run proved nothing: a baseline
 * that does not validate, a run that completed no scan at all, and an attachment that cannot be
 * read.
 */
export default class A11yReporter implements Reporter {
  #suite: Suite | undefined;

  // The package root (`tests/`), where the baseline lives: `config.rootDir` is the a11y
  // config's `testDir`, one level down.
  #packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

  #outputDir = '';

  #hadErrors = false;

  onBegin(config: FullConfig, suite: Suite): void {
    this.#suite = suite;
    this.#outputDir = config.projects[0]?.outputDir ?? path.join(config.rootDir, 'test-results');
  }

  onError(_error: TestError): void {
    this.#hadErrors = true;
  }

  async onEnd(result: FullResult): Promise<{ status?: FullResult['status'] }> {
    const problems: string[] = [];
    const baselinePath = path.join(this.#packageDir, BASELINE_FILE);
    const baseline = readJson<BaselineDocument>(baselinePath, problems);
    const pages = A11Y_PAGES.map(page => page.id);

    if (baseline) {
      problems.push(...validateBaseline(baseline, { pages }).map(problem => `tests/${BASELINE_FILE}: ${problem}`));
    }

    const scans: Scan[] = [];

    for (const test of this.#suite?.allTests() ?? []) {
      const last = test.results.at(-1);
      const attachment = last?.attachments.find(item => item.name === 'axe-scan');

      if (!attachment?.path || last?.status !== 'passed') {
        continue;
      }

      const scan = readJson<Scan>(attachment.path, problems);

      if (scan) {
        scans.push(scan);
      }
    }

    const installedAxe = createRequire(import.meta.url)('axe-core/package.json').version as string;
    const notes: string[] = [];

    if (baseline && baseline.axeCoreVersion !== installedAxe) {
      notes.push(`axe-core ${installedAxe} is installed and the baseline was taken with ${baseline.axeCoreVersion}: `
        + 're-run the scan and refresh the baseline together with the version bump.');
    }
    if (scans.length === 0 && problems.length === 0) {
      problems.push('no scan completed: every test failed before it attached its axe result, so the run proved nothing.');
    }

    const verdict = compareViolations({
      baseline: baseline?.entries ?? [],
      violations: scans.flatMap(flattenScan),
      scanned: scans.map(({ page, theme }) => ({ page, theme })),
      mode: A11Y_MODE,
    });
    const summary = [
      renderSummary(verdict),
      `${scans.length} scans completed (${new Set(scans.map(scan => scan.page)).size} pages × `
        + `${new Set(scans.map(scan => scan.theme)).size} themes); axe-core ${installedAxe}.`,
      ...notes.map(note => `\n> ${note}`),
      ...(problems.length > 0 ? ['', '### Tooling problems', '', ...problems.map(problem => `- ${problem}`)] : []),
      '',
    ].join('\n');

    mkdirSync(this.#outputDir, { recursive: true });
    writeFileSync(path.join(this.#outputDir, 'comparison.json'), `${JSON.stringify({ ...verdict, scans: scans.length, problems, notes }, null, 2)}\n`);
    writeFileSync(path.join(this.#outputDir, 'summary.md'), summary);
    process.stdout.write(`\n${summary}\n`);

    if (process.env.GITHUB_ACTIONS === 'true') {
      for (const line of renderAnnotations(verdict)) {
        process.stdout.write(`${line}\n`);
      }
      for (const note of notes) {
        process.stdout.write(`::warning title=A11y axe%3A baseline version::${note}\n`);
      }
      for (const problem of problems) {
        process.stdout.write(`::error title=A11y axe%3A tooling::${problem}\n`);
      }
      if (process.env.GITHUB_STEP_SUMMARY) {
        appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${summary}\n`);
      }
    }
    if (process.env.GITHUB_OUTPUT) {
      appendFileSync(process.env.GITHUB_OUTPUT, `new-violations=${verdict.newViolations.length}\nstale-entries=${verdict.stale.length}\n`);
    }

    if (problems.length > 0 || this.#hadErrors) {
      return { status: 'failed' };
    }
    if (result.status !== 'passed') {
      return { status: result.status };
    }

    return { status: verdict.status };
  }

  printsToStdio(): boolean {
    return true;
  }
}

interface Scan {
  page: string;
  theme: string;
  violations: Array<{
    id: string;
    impact?: string | null;
    help: string;
    helpUrl: string;
    nodes: Array<{ target: Array<string | string[]>; html: string }>;
  }>;
}

/**
 * One finding per violation node, keyed by the node's target fingerprint; the comparator folds
 * the nodes that share a fingerprint into one finding.
 *
 * @param scan A scan.
 * @returns The findings.
 */
function flattenScan(scan: Scan): Finding[] {
  return scan.violations.flatMap(violation => violation.nodes.map(node => ({
    page: scan.page,
    theme: scan.theme,
    rule: violation.id,
    target: targetFingerprint(node.target, node.html),
    impact: violation.impact ?? null,
    help: violation.help,
    helpUrl: violation.helpUrl,
    html: node.html,
    nodes: 1,
  })));
}

/**
 * Parses a JSON file, recording a problem instead of throwing.
 *
 * @param file The path.
 * @param problems Where a problem goes.
 * @returns The parsed value, or `null`.
 */
function readJson<T>(file: string, problems: string[]): T | null {
  if (!existsSync(file)) {
    problems.push(`${file} does not exist`);

    return null;
  }
  try {
    return JSON.parse(readFileSync(file, 'utf8')) as T;
  } catch (error) {
    problems.push(`${file} is not valid JSON: ${(error as Error).message}`);

    return null;
  }
}
