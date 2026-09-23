#!/usr/bin/env node
/**
 * Judges a build against `visual-budget.json` and prepends its verdict to the gate's comment.
 *
 * Runs AFTER `visual-gate.mjs` on the same `.reg/` directory, on both comparison paths (the credential
 * -carrying one and the fork one), and needs no credentials of its own: everything it reads is already
 * on disk or in the event payload. Ordering matters in one direction only — the gate writes
 * `comment.md`, and this prepends a section to it — so it cannot run first.
 *
 * Reads the RAW `out.json`. A quarantined item (G5) is subtracted from the FAILING count so it stops
 * blocking; it is never subtracted from the SIZE, or the set could be grown by quarantining.
 *
 * Environment:
 *
 *   VISUAL_GATE_DIR    where `out.json` is and `comment.md` was written (default: `.reg/`)
 *   VISUAL_BUDGET_FILE the budget file (default: `visual-tests/visual-budget.json`)
 *   VISUAL_PR_BODY_FILE     the LIVE description, written by the workflow's github-script step
 *   VISUAL_PR_BODY          the event payload's description, used only when the live read failed
 *   VISUAL_BUDGET_BASE_FILE the budget file as the base branch has it, which is what makes "did this
 *                           pull request raise it" answerable
 *   GITHUB_EVENT_NAME       whether a marker can be asked for at all
 *
 * Exits 1 on a violation. A missing `out.json` — the bootstrap path, where there is no comparison —
 * exits 0: there is nothing to judge, and failing there would block the first build on a new branch.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { evaluateBudget } from '../lib/visual-budget.mjs';

const WORKING_DIR = process.env.VISUAL_GATE_DIR
  ? resolve(process.env.VISUAL_GATE_DIR)
  : resolve(import.meta.dirname, '../.reg');
const BUDGET_FILE = process.env.VISUAL_BUDGET_FILE
  ? resolve(process.env.VISUAL_BUDGET_FILE)
  : resolve(import.meta.dirname, '../visual-budget.json');

let report = null;

try {
  report = JSON.parse(await readFile(join(WORKING_DIR, 'out.json'), 'utf-8'));
} catch (error) {
  console.log(`No comparison result to judge: ${error.message}`);
  process.exit(0);
}

const budget = JSON.parse(await readFile(BUDGET_FILE, 'utf-8'));

// The LIVE description, falling back to the event payload. The payload is frozen at the triggering
// event and `test.yml` has no `edited` trigger, so an author who adds the marker after opening the pull
// request is invisible to it — and the gate would print a remedy they cannot apply without pushing a
// commit and paying a full re-render. A stale body can only ask for a marker that is already there:
// a false red, never a false green.
let body = process.env.VISUAL_PR_BODY ?? '';

if (process.env.VISUAL_PR_BODY_FILE) {
  try {
    body = await readFile(process.env.VISUAL_PR_BODY_FILE, 'utf-8');
  } catch {
    console.log('No live pull-request body on disk; falling back to the event payload.');
  }
}

// The base branch's budget file. Absent means the growth question cannot be answered, which the verdict
// reports rather than passing over — see evaluateBudget().
let baseBudget = null;

if (process.env.VISUAL_BUDGET_BASE_FILE) {
  try {
    baseBudget = JSON.parse(await readFile(process.env.VISUAL_BUDGET_BASE_FILE, 'utf-8'));
  } catch {
    console.log('No base-branch budget file on disk; the growth check will report that it did not run.');
  }
}

const verdict = evaluateBudget({
  report,
  budget,
  body,
  baseBudget,
  isPullRequest: process.env.GITHUB_EVENT_NAME === 'pull_request',
});

// Prepended, not merged: the visual gate's own wording is pinned by regex in visual-gate.test.mjs, and
// a section above it leaves every one of those intact.
try {
  const existing = await readFile(join(WORKING_DIR, 'comment.md'), 'utf-8');

  await writeFile(join(WORKING_DIR, 'comment.md'), `${verdict.comment}${existing}`, 'utf-8');
} catch {
  // The gate writes that file on every path it runs; if it is absent the gate did not run, and a
  // budget section with no verdict under it would be a comment about nothing.
  console.log('No comment.md to prepend to — visual-gate.mjs did not run.');
}

console.log(verdict.summary);

if (!verdict.pass) {
  console.log('');
  verdict.violations.forEach(violation => console.error(`- ${violation}`));

  process.exitCode = 1;
}
