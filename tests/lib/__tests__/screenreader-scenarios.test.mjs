import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ACTIONS, PRESS_PATTERN, SCENARIO_FILE_SUFFIX, loadScenarios, scenarioUrl, validateScenario } from '../screenreader-scenario.mjs';
import { stepLines } from '../screenreader-report.mjs';
import { SCREENREADER_MODE, SCREENREADER_MODES } from '../screenreader-transcript.mjs';

// tests/AGENTS.md ("Screen readers: the NVDA and VoiceOver lanes"): a scenario is data the Windows and macOS jobs read, and a
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

test('a synonym that normalizes to nothing is refused, naming the step and the token', () => {
  const expecting = expect => validateScenario({ ...valid(), steps: [{ id: 'close-editor', action: { press: 'Escape' }, expect }] },
    { fixtures: FIXTURES, fileName: 'sample.scenario.json' });

  ['.', '-', 'clickable', 'Focus mode.'].forEach((token) => {
    const problems = expecting([['alice'], ['x', token]]).join('\n');

    assert.ok(problems.includes(`steps[0].expect[1]: step "close-editor": the synonym ${JSON.stringify(token)} normalizes to an empty string`), `${token}: ${problems}`);
  });
  assert.deepEqual(expecting([['alice'], ['34.5', 'row 2']]), [], 'a synonym with a fact in it is fine');
});

test('a step id starts with a letter: JSON.parse would move an integer-like key ahead of the others in the golden', () => {
  const ids = id => validateScenario({ ...valid(), steps: [{ id, action: { press: 'a' }, expect: [] }] }, { fixtures: FIXTURES, fileName: 'sample.scenario.json' });

  assert.match(ids('2').join('\n'), /steps\[0\]: id must be a kebab-case slug that starts with a letter, got "2"/);
  assert.match(ids('2-cells').join('\n'), /starts with a letter/);
  assert.deepEqual(ids('cell-2'), []);
  assert.deepEqual(Object.keys(JSON.parse('{"a": 1, "2": 2}')), ['2', 'a'], 'why: an integer-like key is reordered');
  assert.match(validateScenario({ ...valid(), id: '1st' }).join('\n'), /^id must be a kebab-case slug that starts with a letter/m, 'the scenario id too');
});

test('loadScenarios reports a file that does not parse as invalid JSON, and lets a validator exception through', () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'screenreader-scenarios-'));

  try {
    writeFileSync(path.join(dir, 'broken.scenario.json'), '{ "schema": 1,');
    writeFileSync(path.join(dir, 'sample.scenario.json'), JSON.stringify({ ...valid(), surface: 'short' }));

    const [broken, sample] = loadScenarios(dir, { fixtures: FIXTURES });

    assert.equal(broken.fileName, 'broken.scenario.json');
    assert.equal(broken.scenario, null);
    assert.match(broken.problems.join('\n'), /^not valid JSON: /);
    assert.equal(sample.scenario.id, 'sample');
    assert.deepEqual(sample.problems, ['surface must say what the scenario covers, in at least ten characters'], 'a parsed file gets the validator\'s problems');

    const throwing = {
      includes() {
        throw new Error('validator bug');
      },
    };

    assert.throws(() => loadScenarios(dir, { fixtures: throwing }), /validator bug/, 'an exception from the validator is not reported as invalid JSON');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a press is a Playwright key name or chord, checked on the pull request', () => {
  const press = key => validateScenario({ ...valid(), steps: [{ id: 'a', action: { press: key }, expect: [] }] }, { fixtures: FIXTURES, fileName: 'sample.scenario.json' });

  assert.match(press('ArrowRigth').join('\n'), /steps\[0\]\.action: press "ArrowRigth" is not a Playwright key/, 'a misspelled key names itself');
  assert.match(validateScenario({ ...valid(), setup: [{ press: 'Ctrl+A' }] }).join('\n'), /setup\[0\]: press "Ctrl\+A" is not a Playwright key/, 'the setup is checked too; the modifier is Control');
  assert.deepEqual(press('Shift+F10'), []);
  assert.deepEqual(press('Control+Alt+M'), []);
  assert.deepEqual(press('a'), []);
  assert.deepEqual(press('ControlOrMeta+KeyA'), []);
  ['ArrowRigth', 'F13', 'Shift+', 'shift+a', 'Keyz', 'Enter ', 'Shift+ArrowRigth'].forEach(key => assert.equal(PRESS_PATTERN.test(key), false, key));
  ['ArrowUp', 'Escape', 'Tab', 'PageDown', 'Space', 'F1', 'F12', 'Digit0', 'KeyZ', 'Shift+ArrowRight', 'Alt+Shift+ArrowDown', '/'].forEach(key => assert.equal(PRESS_PATTERN.test(key), true, key));
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
