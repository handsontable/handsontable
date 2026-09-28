import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { repoRoot } from '../lib/repo-root.mjs';

// Doc pins for the `visual-only-coverage` presence-gate advisory. The detector
// itself is tested in presence-warnings.test.mjs (pure cases) and
// presence-gate-cli.test.mjs (end to end, annotation title included); this file
// pins the PROSE around it: the five places that enumerate the detectors, and
// the month-later tally recipe in .ai/LOCAL-ENFORCEMENT.md that turns the
// annotation into a decision.
//
// Every match here is sliced to the region it guards before it is asserted. A
// whole-file `/visual-only[ -]coverage/` looked like a pin and was not: the lib's
// `type: 'visual-only-coverage'` literal, the CLI header's tally sentence, and
// LOCAL-ENFORCEMENT's measurement paragraph each kept it green after the
// enumeration itself was deleted (three of five surfaces, measured in review).
// The slices follow fork-guards.test.mjs, which cuts one bullet out of .ai/CI.md
// before it greps.

const root = repoRoot();
const read = rel => readFileSync(path.join(root, rel), 'utf8');

/**
 * The file's leading block comment: everything before the first `import`.
 * Both the lib and the CLI open with a header that enumerates the detectors and
 * then import; slicing there keeps a code literal or a later comment from
 * satisfying a header pin.
 *
 * @param {string} source The module text.
 * @param {string} name The file, for the failure message.
 * @returns {string} The header text.
 */
function headerOf(source, name) {
  const firstImport = source.indexOf('\nimport ');

  assert.notEqual(firstImport, -1, `${name} has no import to end its header at`);

  return source.slice(0, firstImport);
}

/**
 * The text between two unique anchors, asserting that both exist. Anchored on
 * content, not line numbers, so a paragraph inserted above moves nothing.
 *
 * @param {string} source The document text.
 * @param {string} from The opening anchor (included).
 * @param {string} to The closing anchor (excluded).
 * @param {string} name The file, for the failure message.
 * @returns {string} The region.
 */
function between(source, from, to, name) {
  const start = source.indexOf(from);

  assert.notEqual(start, -1, `${name}: anchor "${from}" is gone`);

  const end = source.indexOf(to, start + from.length);

  assert.notEqual(end, -1, `${name}: anchor "${to}" is gone (after "${from}")`);

  return source.slice(start, end);
}

test('the lib header enumerates visual-only coverage as a detector bullet', () => {
  // Prevents: the fifth bullet leaving the header while the `type:` literal in
  // collectWarnings() keeps a whole-file grep green.
  const header = headerOf(read('.github/scripts/lib/presence-warnings.mjs'), 'presence-warnings.mjs');

  assert.match(header, /^ \* - visual-only coverage — /m,
    'presence-warnings.mjs: the header\'s detector list has no visual-only coverage bullet');
});

test('the CLI header lists visual-only coverage in its detector sentence', () => {
  // Prevents: the list reverting to four names while the header's later
  // sentence about the tally still mentions the type.
  const header = headerOf(read('.github/scripts/test-presence-gate.mjs'), 'test-presence-gate.mjs');

  assert.match(header, /RTL correlation, Walkontable routing, visual-only coverage\./,
    'test-presence-gate.mjs: the header\'s detector sentence does not end in visual-only coverage');
});

test('the checks.yml comment above the gate step lists visual-only coverage', () => {
  // Prevents: the parenthetical above `Evaluate test-presence gate (warn)`
  // dropping the fifth name. Only the comment block directly above that step
  // counts — the step name itself is pinned by presence-warnings.test.mjs.
  const lines = read('.github/workflows/checks.yml').split('\n');
  const at = lines.findIndex(line => /-\s+name:\s+Evaluate test-presence gate \(warn\)/.test(line));

  assert.notEqual(at, -1, 'checks.yml has no `Evaluate test-presence gate (warn)` step');

  const comment = [];

  for (let i = at - 1; i >= 0 && /^\s*#/.test(lines[i]); i -= 1) {
    comment.unshift(lines[i]);
  }

  assert.match(comment.join('\n'), /Walkontable routing, visual-only coverage\)/,
    'checks.yml: the comment above the gate step does not list visual-only coverage');
});

test('LOCAL-ENFORCEMENT\'s advisory paragraph names visual-only coverage after Walkontable routing', () => {
  // Prevents: the `**visual-only coverage** (…)` item leaving the detector list
  // while the measurement paragraph below it keeps the phrase in the file.
  const paragraph = between(
    read('.ai/LOCAL-ENFORCEMENT.md'),
    '**The presence gate also prints advisory warnings',
    'In CI each one is also a',
    '.ai/LOCAL-ENFORCEMENT.md'
  );

  assert.match(paragraph, /\*\*Walkontable routing\*\*[\s\S]*?\*\*visual-only coverage\*\* \(/,
    '.ai/LOCAL-ENFORCEMENT.md: the advisory paragraph does not list **visual-only coverage** as the fifth item');
});

test('TESTING.md names the visual-only-coverage advisory inside the Pillar 1 section', () => {
  // Prevents: the sentence drifting out of "What to test, and in which
  // framework" — the section the gate's decision rule lives in — to anywhere
  // else in the file, where a whole-file grep would still find it.
  const testing = read('handsontable/.ai/TESTING.md');
  const start = testing.indexOf('\n## What to test, and in which framework');

  assert.notEqual(start, -1, 'TESTING.md has no "What to test, and in which framework" section');

  const nextHeading = testing.indexOf('\n## ', start + 1);
  const section = testing.slice(start, nextHeading === -1 ? undefined : nextHeading);

  assert.match(section, /`visual-only-coverage`/,
    'handsontable/.ai/TESTING.md: the Pillar 1 section does not name the visual-only-coverage advisory');
});

test('the tally recipe filters on the annotation title the CLI emits, by check-run name, over PR head SHAs', () => {
  // Prevents: the month-later `gh` recipe reading zero because the CLI's title
  // format drifted, the check-run name changed, or the recipe started reading
  // develop's squash commits — whose presence run is skipped and carries no
  // annotations — and so deciding the question the wrong way.
  const cli = read('.github/scripts/test-presence-gate.mjs');
  const recipe = between(
    read('.ai/LOCAL-ENFORCEMENT.md'),
    '**The visual-only-coverage advisory is a one-month measurement',
    '**Coverage is a CI floor',
    '.ai/LOCAL-ENFORCEMENT.md'
  );

  assert.match(cli, /::warning title=Test-presence gate \(\$\{warning\.type\}\)::/,
    'the CLI\'s annotation title format changed; the recipe below filters on it');
  assert.ok(recipe.includes('Test-presence gate (visual-only-coverage)'),
    'the recipe filters on the exact title the CLI emits');
  assert.ok(recipe.includes('Checks / test presence'),
    'the recipe names the check run as GitHub does (called through test.yml)');
  assert.ok(recipe.includes('headRefOid'), 'the recipe reads the pull request head SHA');
  assert.match(recipe, /COVERAGE_ANY_STATUS/, 'the criterion names what a "stop counting" decision narrows');
});

test('the presence job is PR-only, which is why develop\'s check run carries no annotations', () => {
  // Prevents: the recipe's rationale in LOCAL-ENFORCEMENT going stale. The
  // recipe reads PR head SHAs because the `presence` job does not run on a
  // develop push (its run there is `skipped`); if the job ever ran on push,
  // the squash commit would carry annotations too and the recipe would
  // under-count. Sliced to the job so another job's `if:` cannot satisfy it.
  const job = between(read('.github/workflows/checks.yml'), '\n  presence:\n', '\n  changelog:\n', 'checks.yml');

  assert.match(job, /^\s+if: github\.event_name == 'pull_request'\s*$/m,
    'checks.yml: the presence job is no longer PR-only; re-check the tally recipe in .ai/LOCAL-ENFORCEMENT.md');
});
