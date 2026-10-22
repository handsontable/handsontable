import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { FullConfig, FullResult, Reporter, Suite, TestError } from '@playwright/test/reporter';
import {
  A11Y_MODE,
  A11Y_MODES,
  BASELINE_FILE,
  compareViolations,
  engineVersionNote,
  findingsFromScan,
  renderAnnotations,
  renderSummary,
  validateBaseline,
  workflowCommand,
  type A11yMode,
  type BaselineDocument,
  type ScanLike,
} from '../lib/a11y-baseline.mjs';
import { renderHtmlReport } from '../lib/a11y-report.mjs';
import { agentFindings } from '../lib/a11y-findings.mjs';
import { A11Y_PAGES } from '../a11y/pages.mjs';

/**
 * Compares the run's axe scans with the committed baseline, writes every report, and sets the
 * run's exit status.
 *
 * Each test of `a11y/axe.spec.ts` attaches its scan (`axe-scan`, a JSON file under
 * `test-results/a11y/scans/`, with a screenshot beside it when the scan marked findings). This
 * reporter reads the last attempt of every test, flattens the scans into findings
 * (`findingsFromScan()`), and asks `compareViolations()` what is new, grown, matched, improved,
 * stale and unverified. Into `test-results/a11y/` it writes:
 *
 * - `comparison.json`: the verdict, the tooling problems and notes, and the scans' count, pages,
 *   themes and engines (the check run and the pull request comment are built from it,
 *   `scripts/a11y-check-run.mjs` and `scripts/a11y-pr-comment.mjs`);
 * - `summary.md`: the job summary, also appended to the GitHub job summary;
 * - `a11y-report.html`: the HTML report (`lib/a11y-report.mjs`), one self-contained file built to
 *   locate every element, with the scans' screenshots inlined;
 * - `a11y-findings.json`: the same findings, concise and machine-readable, for an implementer
 *   agent (`lib/a11y-findings.mjs`).
 *
 * On GitHub Actions it prints one annotation per finding that needs action. It returns the status
 * the mode decides: in `warn` mode Playwright's own status (a failed scan is a tooling failure and
 * stays red; a violation never is), in `block` mode `failed` on a finding that needs action as
 * well. Three things are red whatever the mode, because they mean the run proved nothing: a
 * baseline that does not validate, a run that completed no scan, and a scan that cannot be read.
 */
export default class A11yReporter implements Reporter {
  #suite: Suite | undefined;

  // `baseline` and `mode` exist for `e2e/a11y-reporter.spec.ts`, which proves the exit status on
  // synthetic projects; `playwright.a11y.config.ts` passes neither, so CI reads the committed
  // baseline and `A11Y_MODE`.
  #baselinePath: string;

  #mode: A11yMode;

  #optionProblem: string | null = null;

  // The package root (`tests/`), where the baseline lives: `config.rootDir` is the a11y
  // config's `testDir`, one level down.
  #packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

  #outputDir = '';

  #hadErrors = false;

  constructor(options: { baseline?: string; mode?: string } = {}) {
    this.#baselinePath = options.baseline ?? path.join(this.#packageDir, BASELINE_FILE);
    this.#mode = A11Y_MODE;
    if (options.mode !== undefined) {
      if ((A11Y_MODES as readonly string[]).includes(options.mode)) {
        this.#mode = options.mode as A11yMode;
      } else {
        this.#optionProblem = `the reporter's mode option ${JSON.stringify(options.mode)} is not one of ${A11Y_MODES.join(', ')}`;
      }
    }
  }

  onBegin(config: FullConfig, suite: Suite): void {
    this.#suite = suite;
    this.#outputDir = config.projects[0]?.outputDir ?? path.join(config.rootDir, 'test-results');
  }

  onError(_error: TestError): void {
    this.#hadErrors = true;
  }

  async onEnd(result: FullResult): Promise<{ status?: FullResult['status'] }> {
    const problems: string[] = this.#optionProblem ? [this.#optionProblem] : [];
    const baseline = readJson<BaselineDocument>(this.#baselinePath, problems);
    const pages = A11Y_PAGES.map(page => page.id);

    if (baseline) {
      const label = path.relative(path.dirname(this.#packageDir), this.#baselinePath);

      problems.push(...validateBaseline(baseline, { pages }).map(problem => `${label}: ${problem}`));
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
      mode: this.#mode,
    });
    const scannedPages = new Set(scans.map(scan => scan.page)).size;
    const scannedThemes = new Set(scans.map(scan => scan.theme)).size;
    const summary = [
      renderSummary(verdict),
      `${scans.length} scans completed (${scannedPages} pages × ${scannedThemes} themes); axe-core ${engines.join(', ') || 'none'}.`,
      ...notes.map(note => `\n> ${note}`),
      ...(problems.length > 0 ? ['', '### Tooling problems', '', ...problems.map(problem => `- ${problem}`)] : []),
      '',
    ].join('\n');

    mkdirSync(this.#outputDir, { recursive: true });
    writeFileSync(path.join(this.#outputDir, 'comparison.json'),
      `${JSON.stringify({ ...verdict, problems, notes, engines, scans: scans.length, scannedPages, scannedThemes }, null, 2)}\n`);
    writeFileSync(path.join(this.#outputDir, 'summary.md'), summary);
    writeFileSync(path.join(this.#outputDir, 'a11y-report.html'), renderHtmlReport({
      verdict,
      scans: scans.map(scan => ({ ...scan, screenshot: inlineScreenshot(scan, path.join(this.#outputDir, 'scans')) })),
      pages: A11Y_PAGES,
      run: { ...runDetails(), engines, notes, problems, generatedAt: new Date().toISOString() },
    }));
    writeFileSync(path.join(this.#outputDir, 'a11y-findings.json'),
      `${JSON.stringify(agentFindings({ verdict, pages: A11Y_PAGES, problems }), null, 2)}\n`);
    process.stdout.write(`\n${summary}\nHTML report: ${path.join(this.#outputDir, 'a11y-report.html')}\n`);

    if (process.env.GITHUB_ACTIONS === 'true') {
      for (const line of renderAnnotations(verdict)) {
        process.stdout.write(`${line}\n`);
      }
      for (const note of notes) {
        process.stdout.write(`${workflowCommand('warning', 'A11y axe: engine version', note)}\n`);
      }
      for (const problem of problems) {
        process.stdout.write(`${workflowCommand('error', 'A11y axe: tooling', problem)}\n`);
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
  screenshot: string | null;
}

/**
 * A scan's screenshot as a data URI, or `null`. It is read from the spec's `scans/` folder, not
 * from beside the attachment: Playwright copies an attached file into its own attachments folder.
 *
 * @param scan The scan.
 * @param scansDir The folder the spec writes scans and screenshots to.
 * @returns The data URI.
 */
function inlineScreenshot(scan: Scan, scansDir: string): string | null {
  if (!scan.screenshot || !/^[a-z0-9-]+--[a-z]+\.jpg$/.test(scan.screenshot)) {
    return null;
  }

  const file = path.join(scansDir, scan.screenshot);

  return existsSync(file) ? `data:image/jpeg;base64,${readFileSync(file).toString('base64')}` : null;
}

/**
 * The links the HTML report carries, from the GitHub Actions environment; only the commit locally.
 *
 * @returns The commit and the pull request, run and policy URLs that apply.
 */
function runDetails(): { commit?: string; prUrl?: string; runUrl?: string; docsUrl?: string } {
  const { GITHUB_SERVER_URL: server, GITHUB_REPOSITORY: repository, GITHUB_RUN_ID: runId, GITHUB_REF: ref } = process.env;
  const commit = process.env.A11Y_HEAD_SHA || process.env.GITHUB_SHA;

  if (!server || !repository) {
    return { commit };
  }

  const pull = /^refs\/pull\/(\d+)\//.exec(ref ?? '')?.[1];

  return {
    commit,
    prUrl: pull ? `${server}/${repository}/pull/${pull}` : undefined,
    runUrl: runId ? `${server}/${repository}/actions/runs/${runId}` : undefined,
    docsUrl: `${server}/${repository}/blob/${commit ?? 'develop'}/tests/AGENTS.md#a11y-the-axe-scan-and-its-baseline`,
  };
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
