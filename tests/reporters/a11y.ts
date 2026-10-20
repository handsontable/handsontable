import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { FullConfig, FullResult, Reporter, Suite, TestError } from '@playwright/test/reporter';
import { createHtmlReport } from 'axe-html-reporter';
import {
  A11Y_MODE,
  BASELINE_FILE,
  compareViolations,
  engineVersionNote,
  findingsFromScan,
  renderAnnotations,
  renderSummary,
  validateBaseline,
  type BaselineDocument,
  type ScanLike,
} from '../lib/a11y-baseline.mjs';
import { combineScans, summaryHtml } from '../lib/a11y-axe-report.mjs';
import { A11Y_PAGES } from '../a11y/pages.mjs';

/**
 * Compares the run's axe scans with the committed baseline, writes every report, and sets the
 * run's exit status.
 *
 * Each test of `a11y/axe.spec.ts` attaches its scan (`axe-scan`, a JSON file under
 * `test-results/a11y/scans/`). This
 * reporter reads the last attempt of every test, flattens the scans into findings
 * (`findingsFromScan()`), and asks `compareViolations()` what is new, grown, matched, improved,
 * stale and unverified. Into `test-results/a11y/` it writes:
 *
 * - `comparison.json`: the verdict, the tooling problems and notes (the check run is built from it,
 *   `scripts/a11y-check-run.mjs`);
 * - `summary.md`: the job summary, also appended to the GitHub job summary;
 * - `a11y-report.html`: the stock axe HTML report (`axe-html-reporter`) over every scan of the run,
 *   with the comparison in its summary slot (`lib/a11y-axe-report.mjs`).
 *
 * On GitHub Actions it prints one annotation per finding that needs action. It returns the status
 * the mode decides: in `warn` mode Playwright's own status (a failed scan is a tooling failure and
 * stays red; a violation never is), in `block` mode `failed` on a finding that needs action as
 * well. Three things are red whatever the mode, because they mean the run proved nothing: a
 * baseline that does not validate, a run that completed no scan, and a scan that cannot be read.
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
    const baseline = readJson<BaselineDocument>(path.join(this.#packageDir, BASELINE_FILE), problems);
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
    if (scans.length === 0 && problems.length === 0) {
      problems.push('no scan completed: every test failed before it attached its axe result, so the run proved nothing.');
    }

    const engines = [...new Set(scans.map(scan => scan.axeCoreVersion))].sort();
    const engineNote = baseline ? engineVersionNote({ engines, baselineVersion: baseline.axeCoreVersion }) : null;
    const notes = engineNote ? [engineNote] : [];
    const verdict = compareViolations({
      baseline: baseline?.entries ?? [],
      issues: baseline?.issues ?? [],
      violations: scans.flatMap(scan => findingsFromScan(scan)),
      scanned: scans.map(({ page, theme }) => ({ page, theme })),
      mode: A11Y_MODE,
    });
    const summary = [
      renderSummary(verdict),
      `${scans.length} scans completed (${new Set(scans.map(scan => scan.page)).size} pages × `
        + `${new Set(scans.map(scan => scan.theme)).size} themes); axe-core ${engines.join(', ') || 'none'}.`,
      ...notes.map(note => `\n> ${note}`),
      ...(problems.length > 0 ? ['', '### Tooling problems', '', ...problems.map(problem => `- ${problem}`)] : []),
      '',
    ].join('\n');

    mkdirSync(this.#outputDir, { recursive: true });
    writeFileSync(path.join(this.#outputDir, 'comparison.json'),
      `${JSON.stringify({ ...verdict, problems, notes, engines, scans: scans.length }, null, 2)}\n`);
    writeFileSync(path.join(this.#outputDir, 'summary.md'), summary);
    writeFileSync(path.join(this.#outputDir, 'a11y-report.html'), createHtmlReport({
      results: combineScans(scans, runUrl()),
      options: {
        projectKey: 'Handsontable',
        customSummary: summaryHtml(verdict, { scans: scans.length, problems, notes }),
        doNotCreateReportFile: true,
      },
    }));
    process.stdout.write(`\n${summary}\nHTML report: ${path.join(this.#outputDir, 'a11y-report.html')}\n`);

    if (process.env.GITHUB_ACTIONS === 'true') {
      for (const line of renderAnnotations(verdict)) {
        process.stdout.write(`${line}\n`);
      }
      for (const note of notes) {
        process.stdout.write(`::warning title=A11y axe%3A engine version::${note}\n`);
      }
      for (const problem of problems) {
        process.stdout.write(`::error title=A11y axe%3A tooling::${problem}\n`);
      }
      if (process.env.GITHUB_STEP_SUMMARY) {
        appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${summary}\n`);
      }
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

interface Scan extends ScanLike {
  fixture: string;
  axeCoreVersion: string;
  incomplete?: ScanLike['violations'];
}

/**
 * The workflow run's URL, which the report's title links to; `undefined` outside GitHub Actions.
 *
 * @returns The URL.
 */
function runUrl(): string | undefined {
  const { GITHUB_SERVER_URL: server, GITHUB_REPOSITORY: repository, GITHUB_RUN_ID: runId } = process.env;

  return server && repository && runId ? `${server}/${repository}/actions/runs/${runId}` : undefined;
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
