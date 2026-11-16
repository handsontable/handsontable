import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ACTIONS,
  LANE_PRIMITIVES,
  PRESS_PATTERN,
  SCENARIO_FILE_SUFFIX,
  SCENARIO_GROUPS,
  SCREENREADER_LANES,
  SETUP_ACTIONS,
  laneDrives,
  laneOfProject,
  laneUnsupported,
  loadScenarios,
  resolveVariants,
  scenarioPageId,
  scenarioUrl,
  unsupportedReason,
  validateScenario,
} from '../screenreader-scenario.mjs';
import { stepLines } from '../screenreader-report.mjs';
import { DEFAULT_TOKEN_SEVERITY, SCREENREADER_MODE, SCREENREADER_MODES, TOKEN_SEVERITIES } from '../screenreader-transcript.mjs';

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
  group: 'keyboard',
  fixture: 'screenreader-grid.html',
  catalogPages: ['grid'],
  criteria: ['4.1.2'],
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

    // A variant has no steps of its own: its annotations go on its base's lines.
    (JSON.parse(source).steps ?? []).forEach((step) => {
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

test('a step may declare the severity of a token group, named by its first synonym; a group that declares none is serious', () => {
  const declaring = severity => validateScenario({ ...valid(), steps: [{ id: 'right', action: { press: 'ArrowRight' }, expect: [['34'], ['age', 'column 3']], severity }] },
    { fixtures: FIXTURES, fileName: 'sample.scenario.json' });

  assert.deepEqual(declaring({ age: 'minor' }), [], 'a group is named by its first synonym');
  assert.deepEqual(declaring({ 34: 'critical', age: 'moderate' }), []);
  assert.deepEqual(TOKEN_SEVERITIES, ['critical', 'serious', 'moderate', 'minor'], 'axe\'s four: an advisory group would not be required');
  assert.equal(DEFAULT_TOKEN_SEVERITY, 'serious');
  assert.deepEqual(declaring({ age: 'advisory' }), ['steps[0]: severity of "age" must be one of critical, serious, moderate, minor, got "advisory"']);
  assert.deepEqual(declaring({ 'column 3': 'minor' }), ['steps[0]: severity names "column 3", which is not the first synonym of a token group of the step (34, age)'],
    'a synonym that is not the first names no group: renaming a group must not leave its severity behind');
  assert.deepEqual(declaring({}), ['steps[0]: severity must name at least one token group'], 'an empty declaration is a leftover');
  assert.deepEqual(declaring('minor'), ['steps[0]: severity must be an object of { "<first synonym of a group>": "<severity>" }']);
  assert.deepEqual(declaring(['minor']), ['steps[0]: severity must be an object of { "<first synonym of a group>": "<severity>" }']);

  const twice = validateScenario({ ...valid(), steps: [{ id: 'right', action: { press: 'ArrowRight' }, expect: [['age'], ['age', 'column 3']], severity: { age: 'minor' } }] },
    { fixtures: FIXTURES, fileName: 'sample.scenario.json' });

  assert.deepEqual(twice, ['steps[0]: severity names "age", the first synonym of more than one token group, so it names none of them']);
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

test('the action vocabulary is the five primitives the runner implements and a host event, and the setup has its own', () => {
  assert.deepEqual([...ACTIONS], ['press', 'type', 'selectCell', 'read', 'activate', 'call']);
  assert.deepEqual([...SETUP_ACTIONS], ['press', 'type', 'selectCell', 'updateSettings', 'spreadsheetData', 'sentinels', 'focus', 'call']);
});

test('a call names a function the fixture puts on window, with JSON arguments, in a step or the setup', () => {
  const step = action => validateScenario({ ...valid(), steps: [{ id: 'a', action, expect: [] }] }, { fixtures: FIXTURES, fileName: 'sample.scenario.json' }).join('\n');
  const setup = action => validateScenario({ ...valid(), setup: [action] }, { fixtures: FIXTURES, fileName: 'sample.scenario.json' }).join('\n');

  assert.equal(step({ call: ['resolveRequest', 0, 'New A'] }), '');
  assert.equal(step({ call: ['htReleaseFetch'] }), '', 'a call without arguments');
  assert.equal(setup({ call: ['startRequest', 0, 1] }), '', 'the setup may start a request before the reader settles');
  assert.equal(step({ call: ['$_x1', { nested: [1, null] }] }), '');
  ['htServer.release', 'window["x"]', '1st', '', 'a b', 'alert()'].forEach(name => assert.match(step({ call: [name] }),
    /steps\[0\]\.action: call takes \["name", \.\.\.args\], where name is a function the fixture puts on window/, `name ${JSON.stringify(name)}`));
  [[], 'resolveRequest', { name: 'resolveRequest' }, [0, 'resolveRequest'], true].forEach(value => assert.match(setup({ call: value }),
    /setup\[0\]: call takes \["name", \.\.\.args\]/, `value ${JSON.stringify(value)}`));
});

test('the fixture URL carries the project theme and bundle first, then the scenario query', () => {
  assert.equal(scenarioUrl({ fixture: 'screenreader-grid.html' }), '/tests/fixtures/demo/screenreader-grid.html?theme=main&bundle=umd');
  assert.equal(scenarioUrl({ fixture: 'x.html', query: 'aria=off' }, { theme: 'horizon', bundle: 'full-min' }),
    '/tests/fixtures/demo/x.html?theme=horizon&bundle=full-min&aria=off');
});

test('a scenario on a catalog page opens its fixture and query; its own theme takes the project\'s place', () => {
  assert.equal(scenarioUrl({ page: 'rtl-grid' }), '/tests/fixtures/demo/grid-layouts.html?theme=main&bundle=umd&layout=rtl-nested-headers');
  assert.equal(scenarioUrl({ fixture: 'screenreader-grid.html', query: 'theme=horizon' }),
    '/tests/fixtures/demo/screenreader-grid.html?theme=horizon&bundle=umd', 'a fixture reads the first value of a repeated parameter, so the scenario\'s replaces the project\'s');
  assert.equal(scenarioUrl({ page: 'dialog', query: 'bundle=full-min&x=1' }),
    '/tests/fixtures/demo/dialog-states.html?theme=main&bundle=full-min&template=confirm&x=1');
  assert.equal(scenarioPageId({ page: 'grid' }), 'grid');
  assert.equal(scenarioPageId({ fixture: 'screenreader-grid.html' }), 'screenreader-grid');
});

test('a scenario opens exactly one place, names its criteria, and says where the reader starts', () => {
  const problems = shape => validateScenario({ ...valid(), ...shape }, { fixtures: FIXTURES, fileName: 'sample.scenario.json' }).join('\n');

  assert.match(problems({ page: 'grid' }), /exactly one of page/);
  assert.match(problems({ fixture: undefined }), /exactly one of page/);
  assert.match(problems({ fixture: undefined, page: 'grid' }), /catalogPages is for a scenario on a fixture/);
  assert.equal(problems({ fixture: undefined, catalogPages: undefined, page: 'grid' }), '');
  assert.match(problems({ fixture: undefined, catalogPages: undefined, page: 'no-such-page' }), /page "no-such-page" is not a page of tests\/a11y\/pages\.mjs/);
  assert.match(problems({ catalogPages: undefined }), /catalogPages must list the pages of tests\/a11y\/pages\.mjs this fixture stands for/,
    'a scenario on its own fixture says which catalog pages it stands for, so the coverage map can be checked against it');
  assert.match(problems({ catalogPages: ['grid', 'grid'] }), /each once/);
  assert.match(problems({ catalogPages: ['no-such-page'] }), /catalogPages must list/);
  assert.equal(problems({ catalogPages: ['grid', 'text-editor'] }), '');
  assert.match(problems({ criteria: undefined }), /criteria must name/);
  assert.match(problems({ criteria: [] }), /criteria must name/);
  assert.match(problems({ criteria: ['4.1.1'] }), /"4\.1\.1" is not a WCAG 2\.2 success criterion/, 'Parsing is obsolete in 2.2');
  assert.match(problems({ criteria: ['4.1.2', '4.1.2'] }), /twice/);
  assert.match(problems({ start: 'table' }), /start must be one of grid, page/);
  assert.equal(problems({ start: 'page' }), '');
  assert.match(problems({ query: 'theme=dark' }), /theme=dark is not one of main, horizon, classic/);
  assert.match(problems({ query: 'theme=main&theme=horizon' }), /sets theme more than once/);
});

test('a scenario runs in one group, the job of the lane workflow that runs it, and a variant may move to another', () => {
  const problems = shape => validateScenario({ ...valid(), ...shape }, { fixtures: FIXTURES, fileName: 'sample.scenario.json' }).join('\n');

  assert.deepEqual([...SCENARIO_GROUPS], ['keyboard', 'reading', 'menus', 'editors', 'selection', 'structure', 'status']);
  assert.match(problems({ group: undefined }), /group must be one of keyboard, reading, menus, editors, selection, structure, status/);
  assert.match(problems({ group: 'slow' }), /group must be one of keyboard, reading, menus, editors, selection, structure, status/);
  assert.equal(problems({ group: 'reading' }), '');

  const variant = { schema: 1, id: 'v', surface: 'A variant of the sample.', variantOf: 'sample' };
  const [, inherited] = resolveVariants([{ fileName: 'sample.scenario.json', scenario: valid(), problems: [] }, { fileName: 'v.scenario.json', scenario: variant, problems: [] }]);
  const [, moved] = resolveVariants([{ fileName: 'sample.scenario.json', scenario: valid(), problems: [] }, { fileName: 'v.scenario.json', scenario: { ...variant, group: 'reading' }, problems: [] }]);

  assert.deepEqual(validateScenario(variant, { fileName: 'v.scenario.json' }), [], 'a variant without a group runs in its base\'s');
  assert.equal(inherited.scenario.group, 'keyboard');
  assert.equal(moved.scenario.group, 'reading');
});

test('the setup sets the scene: settings, sentinels and a focus, and never a reader command', () => {
  const setup = actions => validateScenario({ ...valid(), setup: actions }, { fixtures: FIXTURES, fileName: 'sample.scenario.json' }).join('\n');

  assert.equal(setup([{ updateSettings: { fixedRowsTop: 1 } }, { sentinels: true }, { focus: '[data-sr-sentinel="before"]' }]), '');
  assert.match(setup([{ updateSettings: {} }]), /updateSettings takes an object of settings/);
  assert.equal(setup([{ spreadsheetData: [200, 3] }]), '', 'a grid larger than its viewport');
  [[0, 3], [200], [1001, 3], [200, 27], [2.5, 3], 'A1'].forEach(value => assert.match(setup([{ spreadsheetData: value }]),
    /spreadsheetData takes \[rows, columns\], at most 1000 rows and 26 columns/, JSON.stringify(value)));
  assert.match(setup([{ sentinels: 'yes' }]), /sentinels takes true/);
  assert.match(setup([{ focus: '' }]), /focus takes the selector/);
  assert.match(setup([{ read: 'next' }]), /unknown action "read"/, 'a lane that cannot drive a reader command has no way to declare it in the setup');
  assert.match(setup([{ activate: true }]), /unknown action "activate"/);
});

test('a reader primitive is read or activate, and a lane that cannot drive one is declared, with a reason', () => {
  const step = shape => validateScenario({ ...valid(), steps: [{ id: 'a', expect: [], ...shape }] }, { fixtures: FIXTURES, fileName: 'sample.scenario.json' }).join('\n');

  assert.equal(step({ action: { read: 'next' } }), '');
  assert.equal(step({ action: { activate: true } }), '');
  assert.match(step({ action: { read: 'down' } }), /read takes one of next, previous, in, out/);
  assert.match(step({ action: { activate: 'yes' } }), /activate takes true/);
  assert.match(step({ action: { read: 'in' } }), /the nvda lane cannot drive \{"read":"in"\} \(LANE_PRIMITIVES\), so the step declares unsupported\.nvda/,
    'NVDA has no interaction level: a step that needs one names the gap');
  assert.equal(step({ action: { read: 'in' }, unsupported: { nvda: 'NVDA has no interaction level.' } }), '');
  assert.match(step({ action: { read: 'in' }, unsupported: { nvda: 'no' } }), /unsupported\.nvda must say why/);
  assert.match(step({ action: { press: 'a' }, unsupported: { talkback: 'not yet a lane at all' } }), /names "talkback", not a lane/);
  assert.match(step({ action: { press: 'a' }, unsupported: {} }), /unsupported must be an object of lane to reason/);
  assert.equal(step({ action: { press: 'a' }, unsupported: { voiceover: 'VoiceOver steals this key from the page.' } }), '',
    'a lane may declare a primitive it drives in general unsupported for a reason of its own');
});

test('each lane drives the primitives LANE_PRIMITIVES lists; dom-echo drives every one', () => {
  assert.deepEqual([...SCREENREADER_LANES], ['nvda', 'voiceover']);
  assert.deepEqual(Object.keys(LANE_PRIMITIVES), [...SCREENREADER_LANES]);
  assert.equal(laneDrives('nvda', { read: 'next' }), true);
  assert.equal(laneDrives('nvda', { read: 'out' }), false);
  assert.equal(laneDrives('voiceover', { read: 'in' }), true);
  assert.equal(laneDrives('voiceover', { activate: true }), true);
  assert.equal(laneDrives('nvda', { press: 'Tab' }), true, 'the page drives a key the same way on every lane');
  assert.equal(laneDrives('dom-echo', { read: 'in' }), true);
  assert.equal(laneOfProject('nvda-firefox'), 'nvda');
  assert.equal(laneOfProject('vo-webkit'), 'voiceover');
  assert.equal(laneOfProject('dom-echo-chromium'), 'dom-echo');
  assert.equal(unsupportedReason({ unsupported: { nvda: 'why' } }, 'nvda'), 'why');
  assert.equal(unsupportedReason({ unsupported: { nvda: 'why' } }, 'voiceover'), null);
  assert.equal(unsupportedReason({}, 'nvda'), null);
  assert.deepEqual(laneUnsupported([
    { steps: [{ action: { read: 'in' }, unsupported: { nvda: 'why' } }, { action: { read: 'out' }, unsupported: { nvda: 'why' } }] },
    { steps: [{ action: { read: 'in' }, unsupported: { nvda: 'why' } }, { action: { press: 'a' } }] },
  ], 'nvda'), ['read in', 'read out'], 'each primitive once, sorted');
});

test('a traversal names read steps and items that are each distinct', () => {
  const steps = [{ id: 'a', action: { read: 'next' }, expect: [] }, { id: 'b', action: { read: 'next' }, expect: [] }];
  const traversal = shape => validateScenario({ ...valid(), steps, traversal: { from: 'a', to: 'b', items: ['A1', 'B1'], ...shape } },
    { fixtures: FIXTURES, fileName: 'sample.scenario.json' }).join('\n');

  assert.equal(traversal({}), '');
  assert.match(traversal({ from: 'z' }), /traversal\.from must be a step id/);
  assert.equal(traversal({ to: 'z' }), 'traversal.to must be a step id, got "z"', 'one typo is one problem, never also an order problem');
  assert.match(traversal({ from: 'b', to: 'a' }), /from comes after traversal\.to/);
  assert.match(traversal({ items: [] }), /items must be a non-empty array/);
  assert.match(traversal({ items: ['A1', 'a1'] }), /lists an item twice/, 'items compare normalized');
  assert.match(traversal({ items: ['.'] }), /each a string with a fact in it/);
  assert.equal(traversal({ items: [['A1', 'A 1'], 'B1'] }), '', 'an item may be the synonyms of one fact');
  assert.match(traversal({ items: [['A1', 'A 1'], ['a 1']] }), /each, and each synonym, is distinct/);
  assert.match(traversal({ items: [[]] }), /or a list of synonyms for one/);
  assert.match(traversal({ every: true }), /traversal: unknown field "every"/);

  const skipped = [{ ...steps[0], unsupported: { nvda: 'NVDA has no interaction level here.' } }, steps[1]];
  const bounded = validateScenario({ ...valid(), steps: skipped, traversal: { from: 'a', to: 'b', items: ['A1'] } },
    { fixtures: FIXTURES, fileName: 'sample.scenario.json' }).join('\n');

  assert.match(bounded, /traversal\.from names step "a", which nvda does not drive: a bound of the window is a step every lane runs/,
    'a lane that skips a bound would widen the window to the start or end of the run');
});

test('a scenario on a catalog page names the state its steps reach, and never sets a key of the page\'s query', () => {
  const onPage = extra => validateScenario({ ...valid(), fixture: undefined, catalogPages: undefined, page: 'grid', ...extra },
    { fixtures: FIXTURES, fileName: 'sample.scenario.json' }).join('\n');

  assert.equal(onPage({}), '', 'a page at rest needs no state');
  assert.match(onPage({ state: 'editor' }), /page "grid" is at rest in the catalog, so a scenario on it names no state/);
  assert.match(onPage({ page: 'text-editor' }), /page "text-editor" is in the "editor" state in the catalog, which the runner does not set up: the scenario's steps reach it, and the scenario says so with "state": "editor"/,
    'a scenario that never opened the editor would close the page\'s coverage gap without reading it');
  assert.equal(onPage({ page: 'text-editor', state: 'editor' }), '');
  assert.match(onPage({ page: 'text-editor', state: 'dropdown-menu' }), /"state": "editor"/);
  assert.match(onPage({ page: 'mobile-selection-handles', state: 'selection' }), /emulates a device \(iPhone 13\), and the screen reader lanes run desktop browsers/);
  assert.match(validateScenario({ ...valid(), state: 'editor' }).join('\n'), /a scenario on a fixture has none/);

  assert.equal(onPage({ page: 'merge-cells', query: 'theme=horizon' }), '', 'theme and bundle go first, so the scenario\'s apply');
  assert.match(onPage({ page: 'merge-cells', query: 'scenario=thick' }),
    /query sets "scenario", which page "merge-cells" sets already \(scenario=areas\): the fixture reads the page's first value/);

  const base = { ...valid(), id: 'base', fixture: undefined, catalogPages: undefined, page: 'merge-cells' };
  const [, variant] = resolveVariants([
    { fileName: 'base.scenario.json', scenario: base, problems: [] },
    { fileName: 'base-thick.scenario.json', scenario: { schema: 1, id: 'base-thick', surface: 'The base on thick rows.', variantOf: 'base', query: 'scenario=thick' }, problems: [] },
  ]);

  assert.match(variant.problems.join('\n'), /query sets "scenario", which page "merge-cells" sets already/, 'a variant\'s query meets its base\'s page');
});

test('a variant takes its base\'s steps and sets only its own id, surface, query, setup and criteria', () => {
  const base = { ...valid(), id: 'base', traversal: undefined };
  const variant = { schema: 1, id: 'base-horizon', surface: 'The base on the horizon theme.', variantOf: 'base', query: 'theme=horizon' };

  assert.deepEqual(validateScenario(variant, { fixtures: FIXTURES, fileName: 'base-horizon.scenario.json' }), []);
  assert.match(validateScenario({ ...variant, steps: [] }).join('\n'), /field "steps" is not allowed in a variant/);
  assert.match(validateScenario({ ...variant, variantOf: 'base-horizon' }).join('\n'), /variantOf names the scenario itself/);

  const [, resolved] = resolveVariants([
    { fileName: 'base.scenario.json', scenario: base, problems: [] },
    { fileName: 'base-horizon.scenario.json', scenario: variant, problems: [] },
  ]);

  assert.deepEqual(resolved.problems, []);
  assert.equal(resolved.scenario.id, 'base-horizon');
  assert.equal(resolved.scenario.query, 'theme=horizon');
  assert.deepEqual(resolved.scenario.steps, base.steps, 'the steps are the base\'s, one copy');
  assert.deepEqual(resolved.scenario.setup, base.setup, 'a variant without a setup takes the base\'s');
  assert.deepEqual(resolved.scenario.criteria, base.criteria, 'a variant without criteria evidences what its base does');

  const [, orphan] = resolveVariants([{ fileName: 'x.scenario.json', scenario: { ...base, id: 'x' }, problems: [] }, { fileName: 'v.scenario.json', scenario: { ...variant, variantOf: 'missing' }, problems: [] }]);

  assert.match(orphan.problems.join('\n'), /variantOf "missing" is not a committed scenario/);

  const [, ofInvalid] = resolveVariants([
    { fileName: 'base.scenario.json', scenario: base, problems: ['schema must be 1, got 2'] },
    { fileName: 'base-horizon.scenario.json', scenario: variant, problems: [] },
  ]);

  assert.deepEqual(ofInvalid.problems, ['variantOf "base" names a scenario that does not validate (base.scenario.json): fix it first'],
    'a base with a typo is not a missing file');

  const [, , chained] = resolveVariants([
    { fileName: 'base.scenario.json', scenario: base, problems: [] },
    { fileName: 'base-horizon.scenario.json', scenario: variant, problems: [] },
    { fileName: 'c.scenario.json', scenario: { ...variant, id: 'c', variantOf: 'base-horizon' }, problems: [] },
  ]);

  assert.match(chained.problems.join('\n'), /is a variant itself/);
});

test('the lane is report-only: the mode constant is `report`, and the flip is the one other value', () => {
  assert.equal(SCREENREADER_MODE, 'report', 'the lane reports and never gates until the token groups are proven precise');
  assert.deepEqual([...SCREENREADER_MODES], ['report', 'gate']);
});
