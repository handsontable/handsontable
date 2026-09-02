// Orchestrator for the prompt/skill regression eval (DEV-2061).
//
// For every fixture case in evals/fixtures/ it scores the hand-written
// reference test(s) — the harness self-test: every reference must clear the
// meaningfulness bar — and any counterexample(s) — the other half of the
// self-test: every counterexample must FAIL the bar, so the smell it
// demonstrates is proven to fire — plus any candidate (agent-generated) file
// passed via `--candidate <case> <file>`. Prints a table; exits 1 when a
// reference fails its own bar, a counterexample passes it, or a fixture is
// malformed; 2 on usage errors.
//
// Usage: node evals/run-eval.mjs [--candidate <case> <file>]... [--json]

import { readdir, access } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { scoreTestFile } from './score.mjs';

const EVALS_DIR = import.meta.dirname;
const FIXTURES_DIR = join(EVALS_DIR, 'fixtures');

/**
 * Check whether a path exists.
 *
 * @param {string} path The path to check.
 * @returns {Promise<boolean>} True when the path is accessible.
 */
const exists = async path => access(path).then(() => true, () => false);

/**
 * List the plain files in a directory, sorted; an absent directory is empty.
 *
 * @param {string} dir The directory to list.
 * @returns {Promise<string[]>} Absolute file paths.
 */
async function listFiles(dir) {
  if (!await exists(dir)) {
    return [];
  }

  return (await readdir(dir, { withFileTypes: true }))
    .filter(entry => entry.isFile())
    .map(entry => join(dir, entry.name))
    .sort();
}

/**
 * Parse the CLI arguments.
 *
 * @param {string[]} args Raw arguments (after the script path).
 * @returns {{candidates: {caseName: string, file: string}[], json: boolean}|null}
 *   The parsed options, or null on a usage error.
 */
function parseArgs(args) {
  const candidates = [];
  let json = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--candidate') {
      const caseName = args[i + 1];
      const file = args[i + 2];

      if (!caseName || !file) {
        return null;
      }
      candidates.push({ caseName, file });
      i += 2;

    } else if (args[i] === '--json') {
      json = true;

    } else {
      return null;
    }
  }

  return { candidates, json };
}

/**
 * Render rows as a plain-text table with padded columns.
 *
 * @param {string[]} header The column names.
 * @param {string[][]} rows The row cells.
 * @returns {string} The rendered table.
 */
function renderTable(header, rows) {
  const widths = header.map((cell, col) => Math.max(
    cell.length,
    ...rows.map(row => row[col].length),
  ));
  const renderRow = row => row.map((cell, col) => cell.padEnd(widths[col])).join('  ').trimEnd();

  return [
    renderRow(header),
    renderRow(widths.map(width => '-'.repeat(width))),
    ...rows.map(renderRow),
  ].join('\n');
}

const parsed = parseArgs(process.argv.slice(2));

if (parsed === null) {
  console.error('Usage: node evals/run-eval.mjs [--candidate <case> <file>]... [--json]');
  process.exit(2);
}

const caseNames = (await readdir(FIXTURES_DIR, { withFileTypes: true }))
  .filter(entry => entry.isDirectory())
  .map(entry => entry.name)
  .sort();

for (const { caseName } of parsed.candidates) {
  if (!caseNames.includes(caseName)) {
    console.error(`Unknown case "${caseName}". Available cases: ${caseNames.join(', ')}`);
    process.exit(2);
  }
}

const structuralErrors = [];
const results = [];

for (const caseName of caseNames) {
  const caseDir = join(FIXTURES_DIR, caseName);

  if (!await exists(join(caseDir, 'case.md'))) {
    structuralErrors.push(`${caseName}: missing case.md (the change brief)`);
  }

  const diffPath = join(caseDir, 'change.diff');
  const diffOptions = await exists(diffPath) ? { diffPath } : {};
  const referenceFiles = await listFiles(join(caseDir, 'reference'));
  const counterexampleFiles = await listFiles(join(caseDir, 'counterexample'));

  if (referenceFiles.length === 0) {
    structuralErrors.push(`${caseName}: no reference test in reference/`);
  }

  for (const file of referenceFiles) {
    results.push({ caseName, role: 'reference', score: await scoreTestFile(file, diffOptions) });
  }

  for (const file of counterexampleFiles) {
    results.push({ caseName, role: 'counterexample', score: await scoreTestFile(file, diffOptions) });
  }

  for (const candidate of parsed.candidates.filter(c => c.caseName === caseName)) {
    results.push({
      caseName,
      role: 'candidate',
      score: await scoreTestFile(candidate.file, diffOptions),
    });
  }
}

if (parsed.json) {
  console.log(JSON.stringify({ results, structuralErrors }, null, 2));
} else {
  const sum = items => items.reduce((total, item) => total + item.count, 0);
  const rows = results.map(({ caseName, role, score }) => [
    caseName,
    role,
    basename(score.file),
    String(score.tests),
    String(score.assertions),
    String(score.hollowTests.length),
    String(sum(score.gamingSignals)),
    String(sum(score.determinismSmells)),
    String(sum(score.structureSmells)),
    score.verdict,
  ]);

  console.log('Test-generation eval — references (must score clean) and counterexamples (must be caught) '
    + 'are the harness self-test; candidates are agent output.\n');
  console.log(renderTable(
    ['Case', 'Role', 'File', 'Tests', 'Asserts', 'Hollow', 'Gaming', 'Determ', 'Struct', 'Verdict'],
    rows,
  ));

  const noisy = results.filter(({ score }) => score.problems.length > 0 || score.warnings.length > 0);

  if (noisy.length > 0) {
    console.log('');

    for (const { caseName, role, score } of noisy) {
      for (const problem of score.problems) {
        console.log(`  problem  ${caseName}/${basename(score.file)} (${role}): ${problem.type} — ${problem.detail}`);
      }

      for (const warning of score.warnings) {
        console.log(`  warning  ${caseName}/${basename(score.file)} (${role}): ${warning.type} — ${warning.detail}`);
      }
    }
  }
}

const references = results.filter(result => result.role === 'reference');
const failedReferences = references.filter(result => result.score.verdict !== 'meaningful');
// A counterexample demonstrates one smell; the scorer must catch it, or the
// smell is documented without being detected.
const counterexamples = results.filter(result => result.role === 'counterexample');
const uncaughtCounterexamples = counterexamples.filter(result => result.score.verdict === 'meaningful');
const candidates = results.filter(result => result.role === 'candidate');
const meaningfulCandidates = candidates.filter(result => result.score.verdict === 'meaningful');
const selfTestPassed = failedReferences.length === 0
  && uncaughtCounterexamples.length === 0
  && structuralErrors.length === 0;

if (!parsed.json) {
  console.log('');
  console.log(`References: ${references.length - failedReferences.length}/${references.length} meaningful`
    + ` — harness self-test ${selfTestPassed ? 'PASSED' : 'FAILED'}.`);

  if (counterexamples.length > 0) {
    const caught = counterexamples.length - uncaughtCounterexamples.length;

    console.log(`Counterexamples: ${caught}/${counterexamples.length} caught as suspect.`);
  }

  if (candidates.length > 0) {
    console.log(`Candidates: ${meaningfulCandidates.length}/${candidates.length} meaningful.`);
  }

  for (const error of structuralErrors) {
    console.log(`  fixture error: ${error}`);
  }

  const mutation = results[0]?.score.mutation;

  console.log(`Mutation layer: ${mutation?.available ? 'available' : `unavailable (${mutation?.reason})`}.`);
}

if (!selfTestPassed) {
  process.exitCode = 1;
}
