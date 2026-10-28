import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { FullConfig, FullResult, Reporter, Suite, TestCase, TestResult } from '@playwright/test/reporter';
import {
  EVIDENCE_ATTACHMENT,
  EVIDENCE_CHECKS,
  TARGET_ANNOTATION,
  isTriageCheck,
  mergeEvidence,
  renderEvidenceSummary,
  runCommit,
  targetFileName,
  validatePart,
} from '../lib/a11y-evidence.mjs';

/**
 * Merges the evidence parts of the checks beyond axe into one document per check.
 *
 * Each project of `playwright.a11y-checks.config.ts` is one check, named by the project. Each of its
 * tests measures one target and attaches an evidence part (`a11y/evidence.ts`). For every project that
 * ran, this reporter reads the last attempt of every test and writes, into
 * `test-results/a11y-checks/`:
 *
 * - `<check>.json`: the evidence document (`mergeEvidence()`), which the conformance report generator
 *   reads and `scripts/a11y-evidence-report.mjs` turns into the job summary and the check run;
 * - `<check>/<page>--<theme>[--<variant>].json`: what each target measured in full (its `detail`);
 * - `summary.md`: every check's summary, for a local run.
 *
 * A test that did not pass is a target that was not measured, with its error, and so is a test the run
 * never started (`maxFailures`, the global timeout, an interrupt), one skipped after a failure before it
 * (a `beforeAll` hook, an earlier test of a serial group, or the worker; both are Playwright's "did not
 * run"), and one whose part is not readable JSON or is malformed. Only a test that asked to be skipped is left out. A test that passed only on a retry is
 * flagged. All of them are tooling problems in the document, never a finding. The reporter does
 * not change the run's status: these checks are report-only, a red run is a tooling failure, and the
 * workflow step that runs them carries `continue-on-error`.
 */
export default class A11yChecksReporter implements Reporter {
  #suite: Suite | undefined;

  #startedAt = new Date();

  // `checks` and `outputDir` exist for `e2e/a11y-checks-reporter.spec.ts`, which proves the reporter on
  // synthetic projects; `playwright.a11y-checks.config.ts` passes neither.
  #checks: Record<string, { title: string; criteria: string[]; triage?: boolean }>;

  #outputDir: string;

  constructor(options: { checks?: Record<string, { title: string; criteria: string[]; triage?: boolean }>; outputDir?: string } = {}) {
    const packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

    this.#checks = options.checks ?? EVIDENCE_CHECKS;
    this.#outputDir = options.outputDir ?? path.join(packageDir, 'test-results/a11y-checks');
  }

  onBegin(_config: FullConfig, suite: Suite): void {
    this.#suite = suite;
    this.#startedAt = new Date();
  }

  async onEnd(_result: FullResult): Promise<void> {
    const run = runMetadata(this.#startedAt);
    const summaries: string[] = [];

    mkdirSync(this.#outputDir, { recursive: true });

    for (const project of this.#suite?.suites ?? []) {
      const check = project.project()?.name ?? project.title;
      // A test that asked to be skipped (`test.skip()`, `test.fixme()`) is not a target of this run.
      const tests = project.allTests().filter(test => test.expectedStatus !== 'skipped');

      if (tests.length === 0) {
        continue;
      }

      const parts: Array<{ target: { page: string; theme: string; variant?: string | null }; detail?: unknown }> = [];
      const failures: Array<{ title: string; target: object | null; error: string; flaky?: boolean }> = [];

      for (const test of tests) {
        const last = test.results.at(-1);
        const target = declaredTarget(test);

        if (!last || last.status !== 'passed') {
          failures.push({ title: test.title, target, error: notMeasured(last) });
          continue;
        }

        const attachment = last.attachments.find(item => item.name === EVIDENCE_ATTACHMENT);

        if (!attachment?.path) {
          failures.push({ title: test.title, target, error: 'the test passed without attaching its evidence part' });
          continue;
        }

        let part: unknown;

        try {
          part = JSON.parse(readFileSync(attachment.path, 'utf8'));
        } catch (error) {
          failures.push({ title: test.title, target, error: `the evidence part is not readable JSON: ${error instanceof Error ? error.message : String(error)}` });
          continue;
        }

        // A triage check's record may name no criterion, so the part is read the way `mergeEvidence()` reads it.
        const partProblems = validatePart(part, { triage: isTriageCheck(check, this.#checks) });

        if (partProblems.length > 0) {
          failures.push({ title: test.title, target, error: `the evidence part is malformed: ${partProblems.join('; ')}` });
          continue;
        }
        parts.push(part as (typeof parts)[number]);
        if (test.results.length > 1) {
          failures.push({ title: test.title, target, error: test.results[0].error?.message ?? test.results[0].status, flaky: true });
        }
      }

      // The document carries each target's detail as a path; the detail itself goes to its own file. Of
      // two parts for one target, the document keeps the first (`mergeEvidence()`), and so does the file.
      const doc = mergeEvidence({ check, parts, failures, run, checks: this.#checks });
      const written = new Set<string>();

      for (const part of parts) {
        const file = targetFileName(part.target);

        if (part.detail !== undefined && !written.has(file)) {
          written.add(file);
          mkdirSync(path.join(this.#outputDir, check), { recursive: true });
          writeFileSync(path.join(this.#outputDir, check, file), `${JSON.stringify(part.detail, null, 2)}\n`);
        }
      }
      writeFileSync(path.join(this.#outputDir, `${check}.json`), `${JSON.stringify(doc, null, 2)}\n`);
      summaries.push(renderEvidenceSummary(doc));
      process.stdout.write(`a11y-checks: ${check}: ${doc.summary.findings} findings on ${doc.summary.measured} targets measured`
        + `${doc.summary.errors > 0 ? `, ${doc.summary.errors} not measured` : ''} -> ${path.join(this.#outputDir, `${check}.json`)}\n`);
    }

    if (summaries.length > 0) {
      writeFileSync(path.join(this.#outputDir, 'summary.md'), `${summaries.join('\n')}\n`);
    }
  }

  printsToStdio(): boolean {
    return false;
  }
}

/**
 * Why a test measured nothing: its error, or why it has none.
 *
 * @param last The test's last attempt, or `undefined` when the run never started it.
 * @returns The reason.
 */
function notMeasured(last: TestResult | undefined): string {
  if (!last) {
    return 'the test did not run: the run stopped before it started (maxFailures, the global timeout or an interrupt)';
  }
  if (last.error?.message) {
    return last.error.message;
  }

  return last.status === 'skipped' ? 'the test was skipped after a failure before it (a beforeAll hook, an earlier test of a serial group, or the worker)' : `the test ended ${last.status}`;
}

/**
 * The target a test declared (`declareTarget()` in `a11y/evidence.ts`), read from its annotations.
 *
 * @param test The test.
 * @returns The target, or `null` when the test failed before it declared one.
 */
function declaredTarget(test: TestCase): object | null {
  const last = test.results.at(-1);
  const annotations = [...(last?.annotations ?? []), ...test.annotations];
  const annotation = annotations.find(item => item.type === TARGET_ANNOTATION);

  if (!annotation?.description) {
    return null;
  }
  try {
    return JSON.parse(annotation.description);
  } catch {
    return null;
  }
}

/**
 * The run's metadata: the commit the run tested (`runCommit()`: the pull request's head, never the merge
 * commit), the ref, the run's URL and when it started.
 *
 * @param startedAt When the run started.
 * @returns The metadata.
 */
function runMetadata(startedAt: Date) {
  const env = process.env;
  const git = (args: string[]) => {
    try {
      return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() || null;
    } catch {
      return null;
    }
  };

  return {
    commit: runCommit(env, () => git(['rev-parse', 'HEAD'])),
    ref: env.GITHUB_HEAD_REF || env.GITHUB_REF_NAME || git(['rev-parse', '--abbrev-ref', 'HEAD']),
    runUrl: env.GITHUB_SERVER_URL && env.GITHUB_REPOSITORY && env.GITHUB_RUN_ID
      ? `${env.GITHUB_SERVER_URL}/${env.GITHUB_REPOSITORY}/actions/runs/${env.GITHUB_RUN_ID}`
      : null,
    startedAt: startedAt.toISOString(),
    durationMs: Date.now() - startedAt.getTime(),
  };
}
