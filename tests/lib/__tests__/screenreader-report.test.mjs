import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildReport, checkRunName, stepLines } from '../screenreader-report.mjs';
import { matchTokenGroups } from '../screenreader-transcript.mjs';

const step = (id, spoken, groups, action = { press: 'ArrowRight' }) => ({
  id, action, spoken, normalized: spoken.toLowerCase(), tokens: matchTokenGroups(spoken.toLowerCase(), groups), durationMs: 1500,
});
const transcript = (overrides = {}) => ({
  schema: 1,
  scenario: 'grid-core',
  surface: 'The grid.',
  project: 'nvda-chromium',
  mode: 'report',
  attempt: 0,
  environment: { screenReader: 'NVDA 2026.2', browser: 'chromium 141', platform: 'win32 10.0.26100' },
  startedAt: '2026-10-22T03:30:00.000Z',
  durationMs: 3000,
  steps: [step('arrow-right', '34 age row 2', [['34'], ['age']]), step('open-editor', 'edit alice', [['alice']], { press: 'Enter' })],
  golden: { status: 'match', differences: [] },
  ...overrides,
});
const SOURCE = '{\n  "steps": [\n    {\n      "id": "arrow-right",\n      "action": {}\n    },\n    {\n      "id": "open-editor"\n    }\n  ]\n}\n';
const lines = new Map([['grid-core', stepLines(SOURCE)]]);
const build = (transcripts, extra = {}) => buildReport({
  transcripts, expectedScenarios: ['grid-core'], lines, reportUrl: 'https://github.com/o/r/actions/runs/1/artifacts/2', runUrl: 'https://github.com/o/r/actions/runs/1', ...extra,
});

test('stepLines finds the line of every step id', () => {
  assert.deepEqual([...stepLines(SOURCE)], [['arrow-right', 4], ['open-editor', 8]]);
});

test('stepLines never takes the scenario\'s own id for a step named like the scenario', () => {
  const source = '{\n  "schema": 1,\n  "id": "grid-core",\n  "steps": [\n    {\n      "id": "grid-core",\n      "action": {}\n    }\n  ]\n}\n';

  assert.deepEqual([...stepLines(source)], [['grid-core', 6]], 'the scenario id sits two spaces in, a step id four or more');
});

test('a clean run is a success named after the project', () => {
  const report = build([transcript()]);

  assert.equal(report.name, 'Screen reader / nvda-chromium report');
  assert.equal(checkRunName('nvda-firefox'), 'Screen reader / nvda-firefox report');
  assert.equal(report.conclusion, 'success');
  assert.equal(report.title, '✔ 1 scenario, 2 steps: every token group present, every golden matched');
  assert.deepEqual(report.annotations, []);
  assert.match(report.summary, /\*\*Report mode:\*\* this check is neutral/);
  assert.match(report.summary, /\[The workflow run\]\(https:\/\/github\.com\/o\/r\/actions\/runs\/1\)/);
  assert.match(report.summary, /📊 \[Open the Playwright report\]/);
  assert.match(report.summary, /### grid-core on nvda-chromium/);
  assert.match(report.summary, /\| arrow-right \| press ArrowRight \| 34 age row 2 \| ✔ 34<br>✔ age \| ✔ same \| 1500 \|/);
  assert.match(report.summary, /### Timing\n\n\| Scenario \| Steps \| Duration \| Per step \|\n\|---\|---:\|---:\|---:\|\n\| grid-core \| 2 \| 3\.0 s \| 1\.5 s \|\n\| \*\*total\*\* \| 2 \| 3\.0 s \| 1\.5 s \|/);
});

test('the clean headline counts its nouns, and a run that recorded every golden says so', () => {
  const one = build([transcript({ steps: [step('arrow-right', '34 age row 2', [['34']])] })]);

  assert.equal(one.title, '✔ 1 scenario, 1 step: every token group present, every golden matched');
  assert.match(one.summary, /\. 1 step in 3\.0 s,/, 'the scenario line counts its step too');

  const recorded = build([
    transcript({ golden: { status: 'recorded', differences: [] } }),
    transcript({ scenario: 'nested-rows', golden: { status: 'recorded', differences: [] } }),
  ], { expectedScenarios: ['grid-core', 'nested-rows'] });

  assert.equal(recorded.conclusion, 'success');
  assert.equal(recorded.title, '✔ 2 scenarios, 4 steps: every token group present, goldens recorded');
});

test('a scenario that stopped at a step is a tooling failure, and the steps it captured are still rendered', () => {
  const report = build([transcript({
    steps: [step('arrow-right', '34 age row 2', [['34'], ['age']])],
    golden: { status: 'incomplete', differences: [] },
    incomplete: { step: 'open-editor', error: 'step open-editor: .handsontableInput visible\n\nexpect(locator).toBeVisible() failed' },
  })]);

  assert.equal(report.conclusion, 'failure');
  assert.equal(report.title, '✖ Tooling failure: scenario grid-core stopped at step open-editor: step open-editor: .handsontableInput visible expect(locator).toBeVisible() failed');
  assert.match(report.summary, /> Tooling problem: scenario grid-core stopped at step open-editor/);
  assert.match(report.summary, /> Stopped at step open-editor: step open-editor: \.handsontableInput visible/);
  assert.match(report.summary, /1 step in 3\.0 s, every token group present, no golden comparison\./);
  assert.match(report.summary, /\| arrow-right \| press ArrowRight \| 34 age row 2 \| ✔ 34<br>✔ age \| – \| 1500 \|/, 'the captured step is in the table, with no golden verdict');
  assert.doesNotMatch(report.summary, /no transcript for "grid-core"/, 'a partial transcript is a transcript');
  assert.equal(report.counts.goldenMissing, 0, 'a partial run is not a missing golden');
});

test('a missing token group is neutral in report mode, with an annotation on the step line', () => {
  const report = build([transcript({ steps: [step('arrow-right', 'row 2', [['34'], ['age', 'column 3']]), step('open-editor', 'edit alice', [['alice']])] })]);

  assert.equal(report.conclusion, 'neutral');
  assert.equal(report.title, '⚠ 1 step missing a token group (report mode)');
  assert.deepEqual(report.annotations.map(item => [item.path, item.start_line, item.annotation_level, item.title]), [
    ['tests/screenreader/scenarios/grid-core.scenario.json', 4, 'warning', 'Announcement missing a token group: grid-core / arrow-right'],
  ]);
  assert.match(report.annotations[0].message, /^nvda-chromium spoke "row 2" for press ArrowRight; missing \[34\], \[age \| column 3\]\.$/);
  assert.match(report.summary, /✖ missing: 34<br>✖ missing: age \\\| column 3/);
});

test('gate mode fails the check on a missing token group', () => {
  const report = build([transcript({ steps: [step('arrow-right', 'row 2', [['34']])] })], { mode: 'gate' });

  assert.equal(report.conclusion, 'failure');
  assert.equal(report.annotations[0].annotation_level, 'failure');
  assert.match(report.summary, /\*\*Gate mode:\*\*/);
});

test('a golden difference and a missing golden are neutral and listed', () => {
  const differs = build([transcript({ golden: { status: 'differs', differences: [{ id: 'open-editor', expected: 'edit  alice', actual: 'edit alice' }] } })]);

  assert.equal(differs.conclusion, 'neutral');
  assert.equal(differs.title, '⚠ 1 golden difference (report mode)');
  assert.match(differs.summary, /### Golden differences \(advisory\)/);
  assert.match(differs.summary, /\| grid-core \| open-editor \| edit {2}alice \| edit alice \|/);
  assert.match(differs.summary, /\| open-editor \| press Enter \| edit alice \| ✔ alice \| ✖ differs \| 1500 \|/);

  const missing = build([transcript({ golden: { status: 'missing', differences: [] } })]);

  assert.equal(missing.conclusion, 'neutral');
  assert.equal(missing.title, '⚠ 1 scenario without a golden (report mode)');
  assert.match(missing.summary, /no golden recorded yet/);
  assert.equal(build([transcript({ golden: { status: 'recorded', differences: [] } })]).conclusion, 'success', 'a run that records the golden is clean');
});

test('a tooling failure is a failed check: a scenario with no transcript, or no transcript at all', () => {
  const missing = build([transcript()], { expectedScenarios: ['grid-core', 'nested-rows'] });

  assert.equal(missing.conclusion, 'failure');
  assert.equal(missing.title, '✖ Tooling failure: no transcript for "nested-rows": the test did not reach the end of the scenario');
  assert.match(missing.summary, /> Tooling problem: no transcript for "nested-rows"/);

  const none = build([], { expectedScenarios: [], project: 'nvda-firefox' });

  assert.equal(none.name, 'Screen reader / nvda-firefox report');
  assert.equal(none.conclusion, 'failure');
  assert.equal(none.title, '✖ Tooling failure: the run left no transcript');

  const broken = build([transcript()], { problems: ['transcript x.json is not valid JSON: boom'] });

  assert.equal(broken.conclusion, 'failure');
  assert.match(broken.title, /^✖ Tooling failure: transcript x\.json is not valid JSON/);
});

test('every value a screen reader spoke is escaped for the markdown table', () => {
  const report = build([transcript({ steps: [step('arrow-right', 'a | b <i>`x`</i>', [['a']])] })]);

  assert.match(report.summary, /\| a \\\| b \\<i\\>\\`x\\`\\<\/i\\> \|/);
});

test('the summary stays under the Checks API limit', () => {
  const long = transcript({ steps: Array.from({ length: 2000 }, (_, index) => step(`step-${index}`, 'x'.repeat(100), [['x']])) });
  const report = build([long]);

  assert.ok(report.summary.length <= 65200);
  assert.match(report.summary, /… cut at 65000 characters/);
});
