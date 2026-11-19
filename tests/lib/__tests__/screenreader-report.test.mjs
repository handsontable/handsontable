import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildReport, checkRunName, stepLines } from '../screenreader-report.mjs';
import { matchTokenGroups } from '../screenreader-transcript.mjs';

const RULE = '(critical/serious = red, moderate/minor = warning)';
const step = (id, spoken, groups, action = { press: 'ArrowRight' }, severity = undefined) => ({
  id, action, spoken, normalized: spoken.toLowerCase(), tokens: matchTokenGroups(spoken.toLowerCase(), groups, severity), durationMs: 1500,
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
  assert.equal(report.title, `✔ Green: 0 critical, 0 serious, 0 moderate, 0 minor ${RULE} · 1 scenario, 2 steps: every token group present, every golden matched`);
  assert.deepEqual(report.annotations, []);
  assert.match(report.summary, /\*\*Verdict: green\.\*\* Red on a critical or serious finding/);
  assert.match(report.summary, /\*\*Report mode:\*\* the test and the job never fail on an announcement; this check run's verdict says what the lane found\./);
  assert.match(report.summary, /\[The workflow run\]\(https:\/\/github\.com\/o\/r\/actions\/runs\/1\)/);
  assert.match(report.summary, /📊 \[Open the Playwright report\]/);
  assert.match(report.summary, /### grid-core on nvda-chromium/);
  assert.match(report.summary, /\| arrow-right \| press ArrowRight \| 34 age row 2 \| ✔ 34<br>✔ age \| ✔ same \| 1500 \|/);
  assert.match(report.summary, /### Timing\n\n\| Scenario \| Steps \| Duration \| Per step \|\n\|---\|---:\|---:\|---:\|\n\| grid-core \| 2 \| 3\.0 s \| 1\.5 s \|\n\| \*\*total\*\* \| 2 \| 3\.0 s \| 1\.5 s \|/);
});

test('the clean headline counts its nouns, and a run that recorded every golden says so', () => {
  const one = build([transcript({ steps: [step('arrow-right', '34 age row 2', [['34']])] })]);

  assert.equal(one.title, `✔ Green: 0 critical, 0 serious, 0 moderate, 0 minor ${RULE} · 1 scenario, 1 step: every token group present, every golden matched`);
  assert.match(one.summary, /\. 1 step in 3\.0 s,/, 'the scenario line counts its step too');

  const recorded = build([
    transcript({ golden: { status: 'recorded', differences: [] } }),
    transcript({ scenario: 'nested-rows', golden: { status: 'recorded', differences: [] } }),
  ], { expectedScenarios: ['grid-core', 'nested-rows'] });

  assert.equal(recorded.conclusion, 'success');
  assert.equal(recorded.title, `✔ Green: 0 critical, 0 serious, 0 moderate, 0 minor ${RULE} · 2 scenarios, 4 steps: every token group present, goldens recorded`);
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

test('a missing token group is serious unless the step says otherwise, so the check is red, annotated on the step line', () => {
  const report = build([transcript({ steps: [step('arrow-right', 'row 2', [['34'], ['age', 'column 3']]), step('open-editor', 'edit alice', [['alice']])] })]);

  assert.equal(report.conclusion, 'failure');
  assert.equal(report.title, `✖ Red: 0 critical, 1 serious, 0 moderate, 0 minor ${RULE} · 1 step missing a token group (report mode)`);
  assert.deepEqual(report.annotations.map(item => [item.path, item.start_line, item.annotation_level, item.title]), [
    ['tests/screenreader/scenarios/grid-core.scenario.json', 4, 'failure', 'Announcement missing a token group (serious): grid-core / arrow-right'],
  ]);
  assert.match(report.annotations[0].message, /^nvda-chromium spoke "row 2" for press ArrowRight; missing \[34\], \[age \| column 3\]\.$/);
  assert.match(report.summary, /✖ missing: 34<br>✖ missing: age \\\| column 3/);
});

test('a step that declares a lower severity for its group turns the check neutral, with a warning annotation', () => {
  const minor = build([transcript({ steps: [step('arrow-right', '34 row 2', [['34'], ['column 3']], { press: 'ArrowRight' }, { 'column 3': 'minor' })] })]);

  assert.equal(minor.conclusion, 'neutral');
  assert.equal(minor.title, `⚠ Warning: 0 critical, 0 serious, 0 moderate, 1 minor ${RULE} · 1 step missing a token group (report mode)`);
  assert.equal(minor.annotations[0].annotation_level, 'warning');
  assert.equal(minor.annotations[0].title, 'Announcement missing a token group (minor): grid-core / arrow-right');

  const worst = build([transcript({ steps: [step('arrow-right', 'row 2', [['34'], ['column 3']], { press: 'ArrowRight' }, { 'column 3': 'minor' })] })]);

  assert.equal(worst.conclusion, 'failure', 'a step is as severe as the worst group it missed: [34] stays serious');

  const critical = build([transcript({ steps: [step('arrow-right', 'row 2', [['34']], { press: 'ArrowRight' }, { 34: 'critical' })] })]);

  assert.equal(critical.conclusion, 'failure');
  assert.match(critical.title, /^✖ Red: 1 critical, 0 serious/);
});

test('a transcript recorded before groups carried a severity reads its failed groups as serious', () => {
  const legacy = transcript({ steps: [{ ...step('arrow-right', 'row 2', [['34']]), tokens: { passed: false, groups: [{ synonyms: ['34'], matched: null }] } }] });

  assert.equal(build([legacy]).conclusion, 'failure');
});

test('on a change run a step whose cluster has a tracker is a warning; on an audit every step counts', () => {
  const failing = [transcript({ steps: [step('arrow-right', 'row 2', [['34']])] })];
  const tracked = (source, check, item) => source === 'reader' && check === 'nvda-chromium' && item.scenario === 'grid-core' && item.step === 'arrow-right';
  const change = build(failing, { scope: 'change', tracked });

  assert.equal(change.conclusion, 'neutral', 'known debt with a tracker is a warning on a change run, never red');
  assert.equal(change.annotations[0].annotation_level, 'warning');
  assert.match(change.summary, /\*\*Change run\*\*/);

  const audit = build(failing, { scope: 'audit', tracked });

  assert.equal(audit.conclusion, 'failure', 'an audit says the truth: tracked or not, a serious step is red');
  assert.match(audit.summary, /\*\*Audit run\*\* \(a schedule or a dispatch\): every open finding counts, tracked or not\./);
});

test('gate mode fails the check on a missing token group', () => {
  const report = build([transcript({ steps: [step('arrow-right', 'row 2', [['34']])] })], { mode: 'gate' });

  assert.equal(report.conclusion, 'failure');
  assert.equal(report.annotations[0].annotation_level, 'failure');
  assert.match(report.summary, /\*\*Gate mode:\*\*/);

  const minor = build([transcript({ steps: [step('arrow-right', 'row 2', [['34']], { press: 'ArrowRight' }, { 34: 'minor' })] })], { mode: 'gate' });

  assert.equal(minor.conclusion, 'failure', 'gate mode fails on any missing group, whatever its severity');
});

test('a golden difference and a missing golden are advisory: listed, never a warning', () => {
  const differs = build([transcript({ golden: { status: 'differs', differences: [{ id: 'open-editor', expected: 'edit  alice', actual: 'edit alice' }] } })]);

  assert.equal(differs.conclusion, 'success');
  assert.equal(differs.title, `✔ Green: 0 critical, 0 serious, 0 moderate, 0 minor ${RULE} · 1 advisory · 1 golden difference (report mode)`);
  assert.match(differs.summary, /### Golden differences \(advisory\)/);
  assert.match(differs.summary, /\| grid-core \| open-editor \| edit {2}alice \| edit alice \|/);
  assert.match(differs.summary, /\| open-editor \| press Enter \| edit alice \| ✔ alice \| ✖ differs \| 1500 \|/);

  const missing = build([transcript({ golden: { status: 'missing', differences: [] } })]);

  assert.equal(missing.conclusion, 'success');
  assert.equal(missing.title, `✔ Green: 0 critical, 0 serious, 0 moderate, 0 minor ${RULE} · 1 advisory · 1 scenario without a golden (report mode)`);
  assert.match(missing.summary, /no golden recorded yet/);
  assert.equal(build([transcript({ golden: { status: 'recorded', differences: [] } })]).conclusion, 'success', 'a run that records the golden is clean');
});

test('a tooling failure is a failed check: a scenario with no transcript, or no transcript at all', () => {
  const missing = build([transcript()], { expectedScenarios: ['grid-core', 'nested-rows'] });

  assert.equal(missing.conclusion, 'failure');
  assert.equal(missing.title, '✖ Tooling failure: no transcript for "nested-rows": the test did not reach the end of the scenario');
  assert.match(missing.summary, /> Tooling problem: no transcript for "nested-rows"/);
  assert.match(missing.summary, /\*\*Verdict: red, a tooling failure\.\*\*/, 'red for a reason of its own, which the summary names apart from any finding');

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

test('a step the lane does not drive is a declared gap: listed per scenario and per primitive, never a reason for neutral', () => {
  const report = build([transcript({ unsupported: [{ id: 'enter-grid', action: { read: 'in' }, reason: 'NVDA has no interaction level.' }] })]);

  assert.equal(report.conclusion, 'success', 'the lane ran every step it can drive, and every one matched');
  assert.match(report.headline, /, 1 step not driven on this lane$/);
  assert.match(report.summary, /### Not driven on this lane\n\n[^\n]+\n\n\| Primitive \| Steps \| Why \|\n\|---\|---:\|---\|\n\| read in \| 1 \| NVDA has no interaction level\. \|/);
  assert.match(report.summary, /\| enter-grid \| read in \| \*\(not driven on this lane: NVDA has no interaction level\.\)\* \| – \| – \| – \|/);
  assert.doesNotMatch(build([transcript()]).summary, /Not driven on this lane/, 'a lane that drove every step lists nothing');
});

test('a scenario\'s table lists the captured and the unsupported steps in the scenario\'s order', () => {
  const source = '{\n  "steps": [\n    {\n      "id": "arrow-right"\n    },\n    {\n      "id": "enter-grid"\n    },\n    {\n      "id": "open-editor"\n    }\n  ]\n}\n';
  const report = build([transcript({ unsupported: [{ id: 'enter-grid', action: { read: 'in' }, reason: 'NVDA has no interaction level.' }] })],
    { lines: new Map([['grid-core', stepLines(source)]]) });
  const order = [...report.summary.matchAll(/^\| (arrow-right|enter-grid|open-editor) \|/gm)].map(([, id]) => id);

  assert.deepEqual(order, ['arrow-right', 'enter-grid', 'open-editor'], 'the unsupported step sits where the scenario has it, not after every captured row');
  assert.deepEqual([...build([transcript({ unsupported: [{ id: 'enter-grid', action: { read: 'in' }, reason: 'NVDA has no interaction level.' }] })], { lines: new Map() })
    .summary.matchAll(/^\| (arrow-right|enter-grid|open-editor) \|/gm)].map(([, id]) => id), ['arrow-right', 'open-editor', 'enter-grid'],
  'without the scenario\'s lines the rows keep the captured order, the unsupported ones after');
});

test('a reading traversal that read an item twice is a serious finding, a warning when tracked, and the summary names the item', () => {
  const traversal = { passed: false, steps: ['arrow-right', 'open-editor'], items: [{ item: 'A1', count: 2, firstStep: 'arrow-right' }, { item: 'B1', count: 0, firstStep: null }], outOfOrder: [] };
  const report = build([transcript({ traversal })]);
  const asked = [];
  const tracked = build([transcript({ traversal })], { tracked: (source, check, item) => asked.push([source, check, item]) > 0 });

  assert.equal(report.conclusion, 'failure', 'an item read twice or never is serious, as a missing fact is');
  assert.equal(tracked.conclusion, 'neutral', 'a traversal whose cluster has a tracker is a warning at most on a change run');
  assert.deepEqual(asked, [['reader', 'nvda-chromium', { scenario: 'grid-core', step: 'traversal', kind: 'traversal-off' }]]);
  assert.equal(build([transcript({ traversal })], { scope: 'audit', tracked: () => true }).conclusion, 'failure', 'an audit counts every finding');
  assert.match(report.headline, /^1 reading traversal off \(report mode\)$/);
  assert.match(report.summary, /Reading traversal \(arrow-right to open-editor\): ✖ read more than once: A1 ×2; never read: B1\./);
  assert.match(build([transcript({ traversal: { ...traversal, passed: true, items: [{ item: 'A1', count: 1, firstStep: 'arrow-right' }] } })]).summary,
    /Reading traversal \(arrow-right to open-editor\): ✔ each of the 1 items read once, in order\./);
});

test('a job that ran one scenario group names its check run after the group too', () => {
  assert.equal(checkRunName('nvda-chromium'), 'Screen reader / nvda-chromium report');
  assert.equal(checkRunName('vo-webkit', 'reading'), 'Screen reader / vo-webkit reading report');
  assert.equal(build([transcript()], { group: 'keyboard' }).name, 'Screen reader / nvda-chromium keyboard report');
});

test('a variant\'s annotations go on its base\'s file and lines', () => {
  const variant = transcript({ scenario: 'grid-core-horizon', steps: [step('arrow-right', 'age', [['34']])] });
  const report = buildReport({
    transcripts: [variant],
    expectedScenarios: ['grid-core-horizon'],
    lines: new Map([['grid-core-horizon', stepLines(SOURCE)]]),
    files: new Map([['grid-core-horizon', 'grid-core.scenario.json']]),
  });

  assert.deepEqual(report.annotations.map(item => [item.path, item.start_line]), [['tests/screenreader/scenarios/grid-core.scenario.json', 4]]);
});
