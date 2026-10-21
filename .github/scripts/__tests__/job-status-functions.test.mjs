import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { repoRoot } from '../lib/repo-root.mjs';

// GitHub's default job condition is `success()`. Writing an `if:` does not replace
// it — writing an `if:` that CONTAINS a status-check function does. Without one,
// `success()` is ANDed on, so a job whose condition reads
// `needs.<job>.result == 'failure'` asks for a dependency that both succeeded and
// failed, and can never run.
//
// It fails in the worst direction: the job reports `skipped`, which looks exactly
// like the skip that was intended, and nothing goes red. `visual-seed.yml`'s
// `notify` job shipped that way — a Slack alert for a failed seed that could not
// fire — which is why this sweep exists rather than a comment in one more file.
//
// Text-based with a YAML parse fallback, like the other workflow tests: no YAML
// parser is a dependency of the repo root, so the job conditions are read with a
// line scanner that understands the two shapes this repo writes.

const root = repoRoot();
const WORKFLOWS = path.join(root, '.github/workflows');

const STATUS_FUNCTION = /\b(always|success|failure|cancelled)\s*\(\s*\)/;
const READS_NEEDS_RESULT = /needs\.[A-Za-z0-9_-]+\.result/;

/**
 * Every job-level `if:` in a workflow, as `{ job, condition }`.
 *
 * A job id sits at two-space indent; its keys at four. An `if:` may be a single
 * line or a folded plain scalar continued on more-indented lines, which is how
 * this repo writes the longer ones.
 *
 * @param {string} source The workflow file's contents.
 * @returns {Array<{job: string, condition: string}>} One entry per job that declares an `if:`.
 */
function jobConditions(source) {
  const [, jobsBlock = ''] = source.split(/^jobs:$/m);
  const lines = jobsBlock.split('\n');
  const found = [];
  let job = null;

  for (let i = 0; i < lines.length; i += 1) {
    const jobStart = lines[i].match(/^ {2}([A-Za-z0-9_-]+):\s*$/);

    if (jobStart) {
      job = jobStart[1];
      continue;
    }

    const condition = lines[i].match(/^ {4}if:\s*(.*)$/);

    if (!condition || !job) {
      continue;
    }

    let expression = condition[1];

    // Fold the continuation lines of a plain scalar: more indented than the key,
    // and not themselves a key.
    for (let j = i + 1; j < lines.length; j += 1) {
      if (!/^ {6,}\S/.test(lines[j]) || /^ {4}[A-Za-z0-9_-]+:/.test(lines[j])) {
        break;
      }
      expression += ` ${lines[j].trim()}`;
    }

    found.push({ job, condition: expression });
  }

  return found;
}

test('every job condition that reads a needs result carries a status-check function', () => {
  const offenders = [];

  for (const file of readdirSync(WORKFLOWS).filter(name => name.endsWith('.yml'))) {
    const source = readFileSync(path.join(WORKFLOWS, file), 'utf8');

    for (const { job, condition } of jobConditions(source)) {
      if (READS_NEEDS_RESULT.test(condition) && !STATUS_FUNCTION.test(condition)) {
        offenders.push(`${file}:${job} — ${condition.trim()}`);
      }
    }
  }

  assert.deepEqual(offenders, [],
    'these job conditions read `needs.<job>.result` with no always(), !cancelled(), failure() or '
      + 'success(), so GitHub ANDs an implicit success() on and the job can never run when its '
      + 'dependency failed. Add `!cancelled() && ` — publish.yml\'s *-notify jobs are the shape:\n'
      + offenders.join('\n'));
});

test('the sweep can actually see the conditions it is judging', () => {
  // A parser that silently matched nothing would make the test above vacuous — the
  // failure this whole file exists to prevent, one level up. So assert it finds the
  // known population: several jobs read a needs result, and every one of them is in
  // a file this repo actually ships.
  const reading = [];

  for (const file of readdirSync(WORKFLOWS).filter(name => name.endsWith('.yml'))) {
    const source = readFileSync(path.join(WORKFLOWS, file), 'utf8');

    for (const { job, condition } of jobConditions(source)) {
      if (READS_NEEDS_RESULT.test(condition)) {
        reading.push(`${file}:${job}`);
      }
    }
  }

  assert.ok(reading.length >= 5,
    `the scanner found only ${reading.length} job conditions reading a needs result, which means it `
      + 'has stopped parsing them — the sweep above would pass vacuously. Found: '
      + reading.join(', '));
  assert.ok(reading.some(entry => entry.startsWith('publish.yml:')),
    'publish.yml carries the largest set of these gates; not finding one means the scanner broke');
});
