import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CHROMIUM_LEGS,
  assessTest,
  groupEvidence,
  legRequirement,
  markdownCell,
  projectsFromAssumption,
  projectsFromList,
  renderReplay,
  replay,
  requiredLegs,
  tagsLabel,
} from '../leg-replay.mjs';

// tests/AGENTS.md ("Declaring the legs"): the replay is the proof that the declared matrix still
// catches what the full matrix caught, and the nightly's triage tool after that. Its rules decide
// which ledger entries count as leg evidence and which declaration they ask for; a rule drifting
// (a cross-leg red taken as leg evidence, a `-min` theme leg asking for one tag instead of both, a
// miss counted as caught) would make the proof agree with a tree that loses coverage. These pin them
// on a small synthetic ledger.

let order = 0;

/**
 * One ledger entry, with the fields the replay reads.
 *
 * @param {object} fields Overrides.
 * @returns {object} The entry.
 */
function entry({ leg, file = 'e2e/a.spec.ts', title = 'suite › case', status = 'flaky', runId, tier = 'playwright', seenAt, branch = 'feature/x' }) {
  order += 1;

  return {
    tier, leg, file, title, status, attempts: status === 'flaky' ? 2 : 1, runId, runAttempt: 1,
    runUrl: `https://github.com/handsontable/handsontable/actions/runs/${runId}`,
    workflow: 'Tests', branch, event: 'pull_request',
    seenAt: seenAt ?? `2026-10-${String(order).padStart(2, '0')}T10:00:00Z`,
  };
}

const LEDGER = [
  // A: horizon (flaky) in run 1, horizon-min (failed) in run 2 — strong, needs both.
  entry({ leg: 'e2e-horizon', runId: 1 }),
  entry({ leg: 'e2e-horizon-min', runId: 2, status: 'failed' }),
  // B: main-min once, flaky — weak, needs bundles.
  entry({ leg: 'e2e-main-min', file: 'e2e/b.spec.ts', title: 'b › case', runId: 3 }),
  // C: main and horizon in the same run — cross-leg, never leg evidence.
  entry({ leg: 'e2e-main', file: 'e2e/c.spec.ts', title: 'c › case', runId: 4 }),
  entry({ leg: 'e2e-horizon', file: 'e2e/c.spec.ts', title: 'c › case', runId: 4 }),
  // D: main in run 5, classic in run 6 — flaky suspect, still needs themes under the conservative rule.
  entry({ leg: 'e2e-main', file: 'e2e/d.spec.ts', title: 'd › case', runId: 5 }),
  entry({ leg: 'e2e-classic', file: 'e2e/d.spec.ts', title: 'd › case', runId: 6 }),
  // E: classic and classic-min in one run, both flaky — an axis-consistent pair, strong, needs both.
  entry({ leg: 'e2e-classic', file: 'e2e/e.spec.ts', title: 'e › case', runId: 7 }),
  entry({ leg: 'e2e-classic-min', file: 'e2e/e.spec.ts', title: 'e › case', runId: 7 }),
  // F: horizon-min alone, once — weak, and still needs both (the -min theme legs grep for both).
  entry({ leg: 'e2e-horizon-min', file: 'e2e/f.spec.ts', title: 'f › case', runId: 8 }),
  // G: red on classic with a title the tree has since renamed.
  entry({ leg: 'e2e-classic', file: 'e2e/g.spec.ts', title: 'g › old title', runId: 9 }),
  // Not evidence: the engine legs, the Jasmine tier, and a second attempt of a run already counted.
  entry({ leg: 'e2e-firefox', file: 'e2e/a.spec.ts', runId: 10 }),
  entry({ leg: 'UMD (theme: classic)', tier: 'jasmine', file: 'handsontable/src/x.spec.js', title: 'x', runId: 11 }),
  { ...entry({ leg: 'e2e-horizon', runId: 1, seenAt: '2026-10-01T11:00:00Z' }), runAttempt: 2 },
];

/**
 * A `--list --reporter=json` document for one file with one describe level.
 *
 * @param {string} file The spec file.
 * @param {Array<[string, string, string[]]>} specs Triples of describe title, test title and projects.
 * @returns {object} The file suite.
 */
function fileSuite(file, specs) {
  return {
    title: file,
    file,
    suites: specs.map(([describe, title, projects]) => ({
      title: describe,
      file,
      specs: [{ title, file, tests: projects.map(projectName => ({ projectName })) }],
    })),
  };
}

const ALL = [...CHROMIUM_LEGS];
const THEMES = ['e2e-main', 'e2e-horizon', 'e2e-classic'];
const BUNDLES = ['e2e-main', 'e2e-main-min'];
const MAIN = ['e2e-main'];
const LIST = {
  suites: [
    fileSuite('e2e/a.spec.ts', [['suite', 'case', THEMES]]),
    fileSuite('e2e/b.spec.ts', [['b', 'case', BUNDLES]]),
    fileSuite('e2e/c.spec.ts', [['c', 'case', MAIN]]),
    fileSuite('e2e/d.spec.ts', [['d', 'case', MAIN]]),
    fileSuite('e2e/e.spec.ts', [['e', 'case', ALL]]),
    fileSuite('e2e/g.spec.ts', [['g', 'new title', THEMES]]),
  ],
};

test('each leg asks for the declaration it greps for, and a set of legs for the union', () => {
  assert.deepEqual(legRequirement('e2e-main'), { themes: false, bundles: false });
  assert.deepEqual(legRequirement('e2e-horizon'), { themes: true, bundles: false });
  assert.deepEqual(legRequirement('e2e-classic'), { themes: true, bundles: false });
  assert.deepEqual(legRequirement('e2e-main-min'), { themes: false, bundles: true });
  assert.deepEqual(legRequirement('e2e-horizon-min'), { themes: true, bundles: true }, 'a -min theme leg needs both, strictly');
  assert.deepEqual(legRequirement('e2e-classic-min'), { themes: true, bundles: true });
  assert.throws(() => legRequirement('e2e-firefox'), /not one of the Chromium legs/);
  assert.deepEqual(requiredLegs(['e2e-horizon', 'e2e-main-min']), { themes: true, bundles: true });
  assert.deepEqual(requiredLegs([]), { themes: false, bundles: false });
  assert.equal(tagsLabel({ themes: true, bundles: true }), 'THEMES_TAG + BUNDLES_TAG');
  assert.equal(tagsLabel({ themes: false, bundles: false }), 'none');
});

test('groupEvidence keeps the Chromium Playwright entries, by test and run, merging attempts', () => {
  const tests = groupEvidence(LEDGER);

  assert.deepEqual([...tests.keys()].sort(), [
    'e2e/a.spec.ts|suite › case', 'e2e/b.spec.ts|b › case', 'e2e/c.spec.ts|c › case', 'e2e/d.spec.ts|d › case',
    'e2e/e.spec.ts|e › case', 'e2e/f.spec.ts|f › case', 'e2e/g.spec.ts|g › old title',
  ], 'the engine leg and the Jasmine tier are left out');

  const a = tests.get('e2e/a.spec.ts|suite › case');

  assert.deepEqual([...a.runs.keys()], ['1', '2'], 'the second attempt of run 1 is the same run');
  assert.deepEqual([...a.runs.get('2').statuses], ['failed']);
  assert.deepEqual([...tests.get('e2e/c.spec.ts|c › case').runs.get('4').legs].sort(), ['e2e-horizon', 'e2e-main']);

  const since = groupEvidence(LEDGER, { since: '2026-10-03' });

  assert.ok(!since.has('e2e/a.spec.ts|suite › case'), 'entries before the date are left out');
  assert.ok(since.has('e2e/b.spec.ts|b › case'));
});

test('assessTest sorts the runs and gives the verdict and the required declaration', () => {
  const tests = groupEvidence(LEDGER);
  const of = key => assessTest(tests.get(key));

  const a = of('e2e/a.spec.ts|suite › case');

  assert.equal(a.verdict, 'strong', 'two off-main runs, one of them failed');
  assert.deepEqual(a.required, { themes: true, bundles: true });
  assert.equal(a.offMainRuns.length, 2);
  assert.equal(a.mainRuns.length, 0);

  const b = of('e2e/b.spec.ts|b › case');

  assert.equal(b.verdict, 'weak');
  assert.deepEqual(b.required, { themes: false, bundles: true });

  const c = of('e2e/c.spec.ts|c › case');

  assert.equal(c.verdict, null, 'red on e2e-main in its only run: not leg evidence');
  assert.equal(c.crossLegRuns.length, 1);
  assert.deepEqual(c.required, { themes: false, bundles: false });

  const d = of('e2e/d.spec.ts|d › case');

  assert.equal(d.verdict, 'flaky-suspect', 'red on e2e-main in another run');
  assert.deepEqual(d.required, { themes: true, bundles: false }, 'tagged all the same, under the conservative rule');

  const e = of('e2e/e.spec.ts|e › case');

  assert.equal(e.verdict, 'strong', 'classic with classic-min in one run is an axis-consistent pair');
  assert.deepEqual(e.required, { themes: true, bundles: true });

  const f = of('e2e/f.spec.ts|f › case');

  assert.equal(f.verdict, 'weak');
  assert.deepEqual(f.required, { themes: true, bundles: true }, 'a -min theme leg alone asks for both tags');
});

test('projectsFromList reads the projects per file and per title path as the ledger writes it', () => {
  const { files, tests } = projectsFromList(LIST);

  assert.deepEqual([...files.get('e2e/a.spec.ts')].sort(), [...THEMES].sort());
  assert.deepEqual([...tests.get('e2e/a.spec.ts|suite › case')].sort(), [...THEMES].sort());
  assert.deepEqual([...files.get('e2e/e.spec.ts')].sort(), [...ALL].sort());
  assert.equal(tests.has('e2e/g.spec.ts|g › old title'), false, 'the renamed test is gone at test level');
  assert.ok(files.has('e2e/g.spec.ts'), 'and present at file level');

  // Nested describes join every level; a file suite's own title is not part of the path.
  const nested = projectsFromList({
    suites: [{
      title: 'e2e/n.spec.ts',
      file: 'e2e/n.spec.ts',
      suites: [{
        title: 'outer',
        suites: [{ title: 'inner', specs: [{ title: 'leaf', tests: [{ projectName: 'e2e-main' }, { projectId: 'e2e-classic' }] }] }],
      }],
    }],
  });

  assert.deepEqual([...nested.tests.get('e2e/n.spec.ts|outer › inner › leaf')].sort(), ['e2e-classic', 'e2e-main'],
    'projectId stands in for a missing projectName');
});

test('projectsFromAssumption applies the truth table to a classification, defaulting unlisted files', () => {
  const { files, tests } = projectsFromAssumption(
    { 'e2e/a.spec.ts': { themes: true, bundles: false }, 'e2e/e.spec.ts': { themes: true, bundles: true } },
    ['e2e/a.spec.ts', 'e2e/b.spec.ts', 'e2e/e.spec.ts'],
  );

  assert.deepEqual([...files.get('e2e/a.spec.ts')], THEMES);
  assert.deepEqual([...files.get('e2e/b.spec.ts')], MAIN, 'an unlisted file in the tree is the default');
  assert.equal(files.get('e2e/e.spec.ts').size, 6);
  assert.equal(tests.size, 0, 'a classification knows files, not titles');
});

test('replay without a declared tree lists the needs and counts nothing as caught or missed', () => {
  const result = replay({ entries: LEDGER });

  assert.deepEqual(result.tests.map(test => [test.file, test.verdict, tagsLabel(test.required)]), [
    ['e2e/a.spec.ts', 'strong', 'THEMES_TAG + BUNDLES_TAG'],
    ['e2e/b.spec.ts', 'weak', 'BUNDLES_TAG'],
    ['e2e/d.spec.ts', 'flaky-suspect', 'THEMES_TAG'],
    ['e2e/e.spec.ts', 'strong', 'THEMES_TAG + BUNDLES_TAG'],
    ['e2e/f.spec.ts', 'weak', 'THEMES_TAG + BUNDLES_TAG'],
    ['e2e/g.spec.ts', 'weak', 'THEMES_TAG'],
  ]);
  assert.deepEqual(result.summary, {
    testsConsidered: 6,
    filesConsidered: 6,
    offMainRuns: 7,
    offMainDistinctRuns: 7,
    caught: null,
    missed: null,
    orphanRuns: null,
    crossLegTests: 1,
    strong: 2,
    flakySuspects: 1,
    weak: 3,
  });
  assert.deepEqual(result.filesNeedingTags.get('e2e/a.spec.ts'), { themes: true, bundles: true });
  assert.ok(result.tests.every(test => test.runs.every(run => run.covered === null)));
  assert.match(renderReplay(result), /no declared tree given, so the needs are listed without coverage/);
});

test('replay against a declared tree catches what the tree runs and names every miss', () => {
  const result = replay({ entries: LEDGER, declared: projectsFromList(LIST) });
  const byFile = Object.fromEntries(result.tests.map(test => [test.file, test]));

  // A declares themes only: run 1 (horizon) is caught, run 2 (horizon-min) is missed.
  assert.deepEqual(byFile['e2e/a.spec.ts'].runs.map(run => [run.runId, run.covered, run.missing]),
    [['1', true, []], ['2', false, ['e2e-horizon-min']]]);
  // B declares bundles: caught. D declares nothing: missed. E declares both: caught.
  assert.deepEqual(byFile['e2e/b.spec.ts'].runs.map(run => run.covered), [true]);
  assert.deepEqual(byFile['e2e/d.spec.ts'].runs.map(run => run.covered), [false]);
  assert.deepEqual(byFile['e2e/e.spec.ts'].runs.map(run => run.covered), [true]);
  // F is not in the tree: an orphan, reported and not a miss.
  assert.equal(byFile['e2e/f.spec.ts'].note, 'orphan');
  assert.deepEqual(byFile['e2e/f.spec.ts'].runs.map(run => run.covered), [null]);
  assert.deepEqual(result.orphans, ['e2e/f.spec.ts']);
  // G's title drifted: checked at file level (themes), caught, and marked.
  assert.equal(byFile['e2e/g.spec.ts'].note, 'title-drift');
  assert.deepEqual(byFile['e2e/g.spec.ts'].runs.map(run => run.covered), [true]);

  assert.deepEqual(result.misses.map(miss => [miss.file, miss.runId, miss.missing]), [
    ['e2e/a.spec.ts', '2', ['e2e-horizon-min']],
    ['e2e/d.spec.ts', '6', ['e2e-classic']],
  ]);
  assert.deepEqual([result.summary.offMainRuns, result.summary.caught, result.summary.missed, result.summary.orphanRuns],
    [7, 4, 2, 1]);

  const markdown = renderReplay(result, { heading: 'Proof' });

  assert.match(markdown, /^### Proof\n/);
  assert.match(markdown, /7 off-main red test-run\(s\) \(7 distinct run\(s\)\) over 6 test\(s\) in 6 file\(s\): 4 caught, 2 missed, 1 on orphan file\(s\)/);
  assert.match(markdown, /Orphans \(declare when they merge\): e2e\/f\.spec\.ts/);
  assert.match(markdown, /\| `e2e\/a\.spec\.ts` \| suite › case \| strong \| 2 \| e2e-horizon, e2e-horizon-min \| THEMES_TAG \+ BUNDLES_TAG \| 1\/2 caught \|/);
  assert.match(markdown, /\| `e2e\/g\.spec\.ts` \| g › old title \| weak \| 1 \| e2e-classic \| THEMES_TAG \| 1\/1 caught \(title-drift\) \|/);
  assert.match(markdown, /- `e2e\/d\.spec\.ts` › d › case: red on e2e-classic in run 6, and the declared tree does not run it on e2e-classic/);
});

test('a title with a pipe, a backslash or a line break is one well-formed Markdown cell', () => {
  // A title is pull-request input (the ledger copies it from the report). Backslashes go first, so a
  // title holding `\\|` cannot read back as an unescaped pipe once the pipe is escaped (CodeQL, incomplete
  // string escaping).
  assert.equal(markdownCell('a | b'), 'a \\| b');
  assert.equal(markdownCell('a \\ b'), 'a \\\\ b');
  assert.equal(markdownCell('a \\| b'), 'a \\\\\\| b');
  assert.equal(markdownCell('two\n  lines'), 'two lines');

  const result = replay({
    entries: [{ ...LEDGER[0], title: 'suite › pipes | and \\ slashes' }],
    declared: projectsFromAssumption({ 'e2e/a.spec.ts': { themes: true, bundles: false } }),
  });
  const row = renderReplay(result).split('\n').find(line => line.includes('pipes'));

  assert.ok(row.includes('| suite › pipes \\| and \\\\ slashes |'), row);
  assert.equal(row.split(/(?<!\\)\|/).length, 9, 'split on the unescaped pipes, the row still has seven cells');
});

test('a classification that tags every need replays with zero misses', () => {
  const needs = replay({ entries: LEDGER }).filesNeedingTags;
  const result = replay({
    entries: LEDGER,
    declared: projectsFromAssumption(Object.fromEntries(needs), [...needs.keys(), 'e2e/c.spec.ts']),
  });

  assert.deepEqual(result.misses, []);
  assert.equal(result.summary.caught, 7);
  assert.equal(result.summary.orphanRuns, 0);
  assert.doesNotMatch(renderReplay(result), /Misses:/);
});

test('the command takes the package\'s own spec tree as the known files, so a spec a classification leaves out is the default, not an orphan', () => {
  // `projectsFromAssumption()` without known files treats an unlisted spec as an orphan, and an orphan's
  // red is never a miss: a classification that forgot a spec would then prove itself (budnix, review of
  // the first version). The command passes every spec under e2e/, so the unlisted spec is e2e-main only
  // and its red on another leg is a miss.
  const testsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
  const realSpec = `e2e/${readdirSync(path.join(testsRoot, 'e2e')).find(name => name.endsWith('.spec.ts'))}`;
  const dir = mkdtempSync(path.join(os.tmpdir(), 'leg-replay-cli-'));

  try {
    const ledger = path.join(dir, 'ledger.json');
    const empty = path.join(dir, 'empty.json');
    const tagged = path.join(dir, 'tagged.json');

    writeFileSync(ledger, JSON.stringify({ entries: [entry({ leg: 'e2e-horizon', file: realSpec, title: 'x › y', runId: 99 })] }));
    writeFileSync(empty, '{}');
    writeFileSync(tagged, JSON.stringify({ [realSpec]: { themes: true, bundles: false } }));

    const run = args => spawnSync(process.execPath, [path.join(testsRoot, 'scripts/leg-replay.mjs'), '--ledger', ledger, ...args],
      { cwd: testsRoot, encoding: 'utf8' });
    const missed = run(['--assume', empty]);

    assert.equal(missed.status, 1, missed.stderr);
    assert.match(missed.stdout, /1 caught, 1 missed, 0 on orphan file\(s\)|0 caught, 1 missed, 0 on orphan file\(s\)/);
    assert.doesNotMatch(missed.stdout, /Orphans/);

    const caught = run(['--assume', tagged]);

    assert.equal(caught.status, 0, caught.stderr);
    assert.match(caught.stdout, /1 caught, 0 missed/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
