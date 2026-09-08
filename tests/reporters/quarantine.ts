import { appendFileSync } from 'node:fs';
import path from 'node:path';
import type { FullConfig, FullResult, Reporter, Suite, TestError } from '@playwright/test/reporter';
import { QUARANTINE_CAP, evaluateRun } from '../lib/quarantine-policy.mjs';

/**
 * Applies the quarantine policy to the finished run and sets its exit status.
 *
 * Playwright's own verdict comes first: with `failOnFlakyTests` a flaky test
 * makes the run `failed`. This reporter re-reads every test's outcome and its
 * `quarantine` annotation (`tests/fixtures/quarantine.ts`) and asks the pure
 * policy (`tests/lib/quarantine-policy.mjs`) what the run's status should be:
 * `passed` when the only failures were flaky tests under a live quarantine,
 * `failed` when a quarantine expired, the cap was exceeded, or an annotation is
 * unreadable — and never anything better than Playwright said when a test
 * failed outright or the run had an error outside any test.
 *
 * On GitHub Actions it also writes one `::warning` per quarantined flaky test
 * and per expired tag, and sets the step output `quarantined-flaky=true` so
 * `e2e.yml` uploads the report (and the ledger records the test) even though
 * the leg stays green.
 */
export default class QuarantineReporter implements Reporter {
  #suite: Suite | undefined;

  #rootDir = '';

  #hadErrors = false;

  onBegin(config: FullConfig, suite: Suite): void {
    this.#suite = suite;
    this.#rootDir = config.rootDir;
  }

  onError(_error: TestError): void {
    this.#hadErrors = true;
  }

  async onEnd(result: FullResult): Promise<{ status?: FullResult['status'] }> {
    const tests = (this.#suite?.allTests() ?? []).map((test) => {
      const [, project, , ...titles] = test.titlePath();

      return {
        title: titles.join(' › '),
        file: path.relative(this.#rootDir, test.location.file).split(path.sep).join('/'),
        project,
        outcome: test.outcome(),
        annotations: test.annotations,
      };
    });
    const verdict = evaluateRun({
      tests,
      now: new Date(),
      runStatus: result.status,
      hadErrors: this.#hadErrors,
      cap: QUARANTINE_CAP,
    });
    const lines: string[] = [];

    if (verdict.quarantineCount > 0 || verdict.problems.length > 0) {
      lines.push('', `Quarantine: ${verdict.quarantineCount} of at most ${QUARANTINE_CAP} tests quarantined, `
        + `${verdict.quarantinedFlaky} flaky under quarantine this run.`);
    }
    lines.push(...verdict.notes.map(note => `  ${note}`));
    lines.push(...verdict.problems.map(problem => `  ✘ ${problem}`));

    if (verdict.downgraded) {
      lines.push('  The run passes: every failure was a flaky test under a live quarantine (reported above).');
    }
    if (lines.length > 0) {
      process.stdout.write(`${lines.join('\n')}\n`);
    }
    if (process.env.GITHUB_ACTIONS === 'true') {
      for (const warning of verdict.warnings) {
        process.stdout.write(`${warning}\n`);
      }
      for (const problem of verdict.problems) {
        process.stdout.write(`::error title=Quarantine policy::${problem}\n`);
      }
    }
    if (verdict.quarantinedFlaky > 0 && process.env.GITHUB_OUTPUT) {
      appendFileSync(process.env.GITHUB_OUTPUT, 'quarantined-flaky=true\n');
    }

    return { status: verdict.status };
  }

  printsToStdio(): boolean {
    return true;
  }
}
