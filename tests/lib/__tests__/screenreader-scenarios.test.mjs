import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ACTIONS, SCENARIO_FILE_SUFFIX, loadScenarios, scenarioUrl, validateScenario } from '../screenreader-scenario.mjs';
import { stepLines } from '../screenreader-report.mjs';
import { SCREENREADER_MODE, SCREENREADER_MODES } from '../screenreader-transcript.mjs';

// tests/AGENTS.md ("Screen readers: the NVDA lane"): a scenario is data the Windows job reads, and a
// mistake in it would surface inside a 30-minute job on the next nightly. The committed files are
// validated here, on every pull request, against the schema the spec loads them with.

const TESTS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SCENARIOS_DIR = path.join(TESTS_ROOT, 'screenreader/scenarios');
const FIXTURES = readdirSync(path.join(TESTS_ROOT, 'fixtures/demo')).filter(name => name.endsWith('.html'));
const valid = () => ({
  schema: 1,
  id: 'sample',
  surface: 'A sample surface for the validator.',
  fixture: 'screenreader-grid.html',
  setup: [{ selectCell: [0, 0] }],
  steps: [
    { id: 'right', action: { press: 'ArrowRight' }, expect: [['34'], ['age', 'column 3']] },
    { id: 'menu', action: { press: 'Shift+F10' }, after: { visible: '.htContextMenu td' }, expect: [['menu']], note: 'opens the menu' },
  ],
});

test('every committed scenario validates against the schema, names an existing fixture and is named after its id', () => {
  const loaded = loadScenarios(SCENARIOS_DIR, { fixtures: FIXTURES });

  assert.ok(loaded.length >= 2, 'the grid-core and nested-rows scenarios are committed');
  loaded.forEach(({ fileName, problems }) => assert.deepEqual(problems, [], `${fileName}`));
  assert.ok(loaded.some(({ scenario }) => scenario.id === 'grid-core'), 'grid-core is the first surface');
});

test('every step of every committed scenario has a line the check run can annotate', () => {
  readdirSync(SCENARIOS_DIR).filter(name => name.endsWith(SCENARIO_FILE_SUFFIX)).forEach((name) => {
    const source = readFileSync(path.join(SCENARIOS_DIR, name), 'utf8');
    const lines = stepLines(source);

    JSON.parse(source).steps.forEach((step) => {
      assert.ok(lines.has(step.id), `${name}: step "${step.id}" opens with "id": "…" on its own line`);
    });
  });
});

test('the validator accepts the sample and names each problem', () => {
  assert.deepEqual(validateScenario(valid(), { fixtures: FIXTURES, fileName: 'sample.scenario.json' }), []);

  const problems = shape => validateScenario({ ...valid(), ...shape }, { fixtures: FIXTURES, fileName: 'sample.scenario.json' });

  assert.match(problems({ schema: 2 }).join('\n'), /schema must be 1/);
  assert.match(problems({ id: 'Sample Id' }).join('\n'), /kebab-case/);
  assert.match(validateScenario(valid(), { fileName: 'other.scenario.json' }).join('\n'), /must be "sample\.scenario\.json"/);
  assert.match(problems({ surface: 'short' }).join('\n'), /surface must say/);
  assert.match(problems({ fixture: 'missing.html' }).join('\n'), /not under fixtures\/demo/);
  assert.match(problems({ fixture: '../grid.html' }).join('\n'), /fixture must be a file name/);
  assert.match(problems({ query: '?theme=main' }).join('\n'), /query must be/);
  assert.match(problems({ extra: 1 }).join('\n'), /unknown field "extra"/);
  assert.match(problems({ setup: [{ press: '' }] }).join('\n'), /setup\[0\]: press takes a non-empty string/);
  assert.match(problems({ steps: [] }).join('\n'), /steps must be a non-empty array/);
  assert.match(problems({ steps: [{ id: 'a', action: { click: 'x' }, expect: [] }] }).join('\n'), /unknown action "click"/);
  assert.match(problems({ steps: [{ id: 'a', action: { press: 'a', type: 'b' }, expect: [] }] }).join('\n'), /exactly one of/);
  assert.match(problems({ steps: [{ id: 'a', action: { selectCell: [0] }, expect: [] }] }).join('\n'), /selectCell takes \[row, col\]/);
  assert.match(problems({ steps: [{ id: 'a', action: { press: 'a' }, expect: [[]] }] }).join('\n'), /non-empty array of non-empty strings/);
  assert.match(problems({ steps: [{ id: 'a', action: { press: 'a' }, expect: [['x']], after: { shown: 'td' } }] }).join('\n'), /after must be/);
  assert.match(problems({ steps: [{ id: 'a', action: { press: 'a' }, expect: [] }, { id: 'a', action: { press: 'b' }, expect: [] }] }).join('\n'), /duplicate id "a"/);
  assert.match(problems({ steps: [{ id: 'a', action: { press: 'a' }, expect: [], later: 1 }] }).join('\n'), /unknown field "later"/);
  assert.deepEqual(validateScenario('nope'), ['the scenario is not an object']);
});

test('the action vocabulary is the three the runner implements', () => {
  assert.deepEqual([...ACTIONS], ['press', 'type', 'selectCell']);
});

test('the fixture URL carries the project theme and bundle first, then the scenario query', () => {
  assert.equal(scenarioUrl({ fixture: 'screenreader-grid.html' }), '/tests/fixtures/demo/screenreader-grid.html?theme=main&bundle=umd');
  assert.equal(scenarioUrl({ fixture: 'x.html', query: 'aria=off' }, { theme: 'horizon', bundle: 'full-min' }),
    '/tests/fixtures/demo/x.html?theme=horizon&bundle=full-min&aria=off');
});

test('the lane is report-only: the mode constant is `report`, and the flip is the one other value', () => {
  assert.equal(SCREENREADER_MODE, 'report', 'the lane reports and never gates until the token groups are proven precise');
  assert.deepEqual([...SCREENREADER_MODES], ['report', 'gate']);
});
