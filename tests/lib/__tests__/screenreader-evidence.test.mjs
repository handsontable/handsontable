import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateEvidence } from '../a11y-evidence.mjs';
import { SCREENREADER_CHECK, STEP_VERDICTS, buildScreenreaderEvidence, evidencePart, scenarioTheme, screenreaderChecks, stepRecords } from '../screenreader-evidence.mjs';
import { matchTokenGroups } from '../screenreader-transcript.mjs';

// tests/AGENTS.md ("Screen readers", "The evidence"): every step of every scenario on every lane is a
// record the conformance report generator can cite, in the shared shape of the accessibility checks.

const scenario = (overrides = {}) => ({
  schema: 1,
  id: 'grid-core',
  surface: 'The grid.',
  fixture: 'screenreader-grid.html',
  criteria: ['4.1.2', '1.3.1'],
  steps: [
    { id: 'arrow-right', action: { press: 'ArrowRight' }, expect: [['34'], ['age']] },
    { id: 'enter-grid', action: { read: 'in' }, expect: [], unsupported: { nvda: 'NVDA has no interaction level.' } },
    { id: 'open-editor', action: { press: 'Enter' }, expect: [['alice'], ['edit']] },
    { id: 'listen', action: { read: 'next' }, expect: [] },
  ],
  ...overrides,
});
const step = (id, spoken, groups, action = { press: 'ArrowRight' }) => ({
  id, action, spoken, normalized: spoken, tokens: matchTokenGroups(spoken, groups), durationMs: 1500,
});
const transcript = (overrides = {}) => ({
  schema: 1,
  scenario: 'grid-core',
  surface: 'The grid.',
  page: 'screenreader-grid',
  criteria: ['4.1.2', '1.3.1'],
  project: 'nvda-chromium',
  lane: 'nvda',
  mode: 'report',
  attempt: 0,
  environment: { screenReader: 'NVDA 2026.2', browser: 'chromium 141', platform: 'win32 10.0.26100' },
  startedAt: '2026-11-03T04:30:00.000Z',
  durationMs: 6000,
  steps: [
    step('arrow-right', '34 age row 2', [['34'], ['age']]),
    step('open-editor', 'alice', [['alice'], ['edit']], { press: 'Enter' }),
    step('listen', 'table', [], { read: 'next' }),
  ],
  unsupported: [{ id: 'enter-grid', action: { read: 'in' }, reason: 'NVDA has no interaction level.' }],
  golden: { status: 'match', differences: [] },
  ...overrides,
});

test('a record per step, in the scenario\'s order: pass, missing-fact, unsupported with its reason, recorded', () => {
  const records = stepRecords(transcript(), scenario());

  assert.deepEqual(records.map(record => [record.step, record.verdict]), [
    ['arrow-right', 'pass'], ['enter-grid', 'unsupported'], ['open-editor', 'missing-fact'], ['listen', 'recorded'],
  ]);
  assert.deepEqual(records[0], {
    scenario: 'grid-core', lane: 'nvda', project: 'nvda-chromium', page: 'screenreader-grid', theme: 'main', criteria: ['1.3.1', '4.1.2'],
    step: 'arrow-right', action: 'press ArrowRight', verdict: 'pass',
  }, 'the record says the scenario, step, lane, criteria and verdict, the criteria in WCAG order');
  assert.equal(records[1].reason, 'NVDA has no interaction level.');
  assert.ok(records.every(record => STEP_VERDICTS.includes(record.verdict)));
});

test('a run that stopped leaves the steps after the stop as not run', () => {
  const stopped = transcript({ steps: transcript().steps.slice(0, 1), incomplete: { step: 'open-editor', error: 'timed out' } });

  assert.deepEqual(stepRecords(stopped, scenario()).map(record => [record.step, record.verdict, record.reason ?? null]), [
    ['arrow-right', 'pass', null],
    ['enter-grid', 'unsupported', 'NVDA has no interaction level.'],
    ['open-editor', 'not-run', 'the run stopped at step open-editor'],
    ['listen', 'not-run', 'the run stopped at step open-editor'],
  ]);
});

test('the part is the scenario as a target, with a finding per missing fact and per traversal item off', () => {
  const traversal = { passed: false, steps: ['listen'], items: [{ item: 'A1', count: 2, firstStep: 'listen' }, { item: 'B1', count: 0, firstStep: null }, { item: 'C1', count: 1, firstStep: 'listen' }], outOfOrder: ['C1'] };
  const part = evidencePart(transcript({ traversal }), scenario({ query: 'theme=horizon' }));

  assert.deepEqual(part.target, {
    page: 'screenreader-grid', theme: 'horizon', state: null, variant: 'grid-core', url: '/tests/fixtures/demo/screenreader-grid.html?theme=horizon&bundle=umd',
  });
  assert.deepEqual(part.criteria, ['4.1.2', '1.3.1']);
  assert.deepEqual(part.findings.map(finding => [finding.kind, finding.step, finding.severity]), [
    ['announcement-missing-fact', 'open-editor', 'advisory'],
    ['traversal-duplicate', 'traversal A1', 'advisory'],
    ['traversal-missing', 'traversal B1', 'advisory'],
    ['traversal-order', 'traversal C1', 'advisory'],
  ]);
  assert.deepEqual(part.findings[0].expected, { tokens: 'edit' });
  assert.deepEqual(part.problems, []);
  assert.equal(part.detail.records.length, 4);
  assert.equal(scenarioTheme({}), 'main');
});

test('the document validates in the shared shape, with the project, the lane and every record', () => {
  const scenarios = [scenario(), scenario({ id: 'nested-rows', page: 'nested-rows', fixture: undefined, criteria: ['4.1.3'] })];
  const { doc, details, problems } = buildScreenreaderEvidence({
    project: 'nvda-chromium', lane: 'nvda', transcripts: [transcript()], scenarios, run: { commit: 'abc' },
  });

  assert.deepEqual(problems, [], 'validateEvidence() reads it with the lane\'s registry');
  assert.deepEqual(validateEvidence(doc, { checks: screenreaderChecks(scenarios) }), []);
  assert.equal(doc.check, SCREENREADER_CHECK);
  assert.deepEqual(doc.criteria, ['1.3.1', '4.1.2', '4.1.3'], 'the union of the scenarios\' criteria');
  assert.equal(doc.run.project, 'nvda-chromium');
  assert.equal(doc.run.lane, 'nvda');
  assert.equal(doc.run.commit, 'abc');
  assert.deepEqual(doc.targets.map(target => [target.page, target.variant, target.status]), [
    ['nested-rows', 'nested-rows', 'error'], ['screenreader-grid', 'grid-core', 'measured'],
  ], 'a scenario of the set without a transcript is a target not measured');
  assert.equal(doc.summary.byCriterion['4.1.2'].evaluated, 1);
  assert.equal(doc.summary.byCriterion['4.1.3'].evaluated, 0, 'the scenario that left no transcript evaluated nothing');
  assert.deepEqual(doc.records.filter(record => record.scenario === 'nested-rows').map(record => [record.verdict, record.reason]), [
    ['not-run', 'no transcript'], ['unsupported', 'NVDA has no interaction level.'], ['not-run', 'no transcript'], ['not-run', 'no transcript'],
  ], 'a step the lane does not drive is a declared gap whether the run finished or not');
  assert.deepEqual(details.map(item => item.file), ['screen-reader/screenreader-grid--main--grid-core.json']);
  assert.equal(doc.run.group, null, 'a run of every scenario names no group');
  const grouped = buildScreenreaderEvidence({ project: 'nvda-chromium', lane: 'nvda', group: 'keyboard', transcripts: [transcript()], scenarios });

  assert.equal(grouped.doc.run.group, 'keyboard', 'a job of one group says which, so its scenario list does not read as the whole project');
  assert.deepEqual(grouped.problems, []);
});

test('a scenario that passed only on a retry is flagged in the document, never read as a clean pass', () => {
  const scenarios = [scenario()];
  const first = buildScreenreaderEvidence({ project: 'nvda-chromium', lane: 'nvda', transcripts: [transcript()], scenarios }).doc;
  const retried = buildScreenreaderEvidence({ project: 'nvda-chromium', lane: 'nvda', transcripts: [transcript({ attempt: 2 })], scenarios });

  assert.deepEqual(retried.problems, []);
  assert.deepEqual(first.targets.map(target => target.flaky), [false]);
  assert.deepEqual(retried.doc.targets.map(target => [target.variant, target.status, target.flaky]), [['grid-core', 'measured', true]]);
  assert.match(retried.doc.problems.join('\n'), /nvda-chromium grid-core measured only on a retry .*: the transcript is from attempt 3: an earlier attempt failed/);
});

test('a run that stopped is a problem of its target, which then evaluates no criterion', () => {
  const stopped = transcript({ steps: transcript().steps.slice(0, 1), incomplete: { step: 'open-editor', error: 'timed out' } });
  const { doc } = buildScreenreaderEvidence({ project: 'nvda-chromium', lane: 'nvda', transcripts: [stopped], scenarios: [scenario()] });

  assert.match(doc.problems.join('\n'), /the run stopped at step open-editor: timed out/);
  assert.equal(doc.summary.byCriterion['4.1.2'].evaluated, 0);
});
