import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CHATTER,
  compareWithGolden,
  describeAction,
  goldenFromTranscript,
  matchTokenGroups,
  normalizeAnnouncement,
  renderTranscriptLog,
  transcriptCounts,
} from '../screenreader-transcript.mjs';

const transcript = (overrides = {}) => ({
  schema: 1,
  scenario: 'grid-core',
  surface: 'The grid.',
  project: 'nvda-chromium',
  mode: 'report',
  attempt: 0,
  environment: { screenReader: 'NVDA 2026.2', browser: 'chromium 141.0.0.0', platform: 'win32 10.0.26100' },
  startedAt: '2026-10-22T03:30:00.000Z',
  durationMs: 4200,
  steps: [
    { id: 'arrow-right', action: { press: 'ArrowRight' }, spoken: '34  Age  row 2 column 3', normalized: '34 age row 2 column 3', tokens: matchTokenGroups('34 age row 2 column 3', [['34'], ['age', 'column 3']]), durationMs: 2100 },
    { id: 'open-editor', action: { press: 'Enter' }, spoken: 'edit  multi line  Alice', normalized: 'edit multi line alice', tokens: matchTokenGroups('edit multi line alice', [['alice'], ['text area']]), durationMs: 2100 },
  ],
  golden: { status: 'missing', differences: [] },
  ...overrides,
});

test('normalizeAnnouncement lowercases, folds Unicode, drops punctuation and collapses whitespace', () => {
  assert.equal(normalizeAnnouncement('Insert row above.  Menu item,\n1 of 14'), 'insert row above menu item 1 of 14');
  assert.equal(normalizeAnnouncement('Ａlice — Ｎame'), 'alice name');
  assert.equal(normalizeAnnouncement('A-1  column header'), 'a 1 column header');
  assert.equal(normalizeAnnouncement(undefined), '');
});

test('normalizeAnnouncement strips the screen reader chatter wherever it sits', () => {
  assert.deepEqual([...CHATTER], ['focus mode', 'browse mode', 'clickable']);
  assert.equal(normalizeAnnouncement('focus mode. Alice  clickable  row 2'), 'alice row 2');
  assert.equal(normalizeAnnouncement('Alice. Browse mode'), 'alice');
  assert.equal(normalizeAnnouncement('clickable'), '');
  assert.equal(normalizeAnnouncement('unclickable thing'), 'unclickable thing', 'only a whole phrase is chatter');
});

test('normalizeAnnouncement strips adjacent chatter phrases, every repeat of them', () => {
  assert.equal(normalizeAnnouncement('alice clickable clickable row 2'), 'alice row 2', 'NVDA says `clickable` once per nested clickable element');
  assert.equal(normalizeAnnouncement('focus mode focus mode'), '');
  assert.equal(normalizeAnnouncement('Browse mode. Focus mode. Alice'), 'alice');
  assert.equal(normalizeAnnouncement('focus  mode'), '', 'a phrase split by extra whitespace is still the phrase');
  CHATTER.forEach(phrase => assert.match(phrase, /^[a-z]+(?: [a-z]+)*$/, `"${phrase}": a chatter phrase is lowercase words joined by single spaces, so the pattern needs no escaping`));
});

test('normalizeAnnouncement keeps a `.` or `,` between two digits as part of the number', () => {
  assert.equal(normalizeAnnouncement('Price: 34.5, row 2'), 'price 34.5 row 2');
  assert.equal(normalizeAnnouncement('1,000 rows.'), '1,000 rows');
  assert.equal(normalizeAnnouncement('row 2, 3 cells'), 'row 2 3 cells', 'a comma followed by a space is punctuation');
  assert.equal(normalizeAnnouncement('A.1 and 5.a'), 'a 1 and 5 a', 'a dot with a letter on one side is punctuation');
  assert.equal(normalizeAnnouncement('34..'), '34');
});

test('matchTokenGroups needs one synonym per group, as a whole phrase', () => {
  const verdict = matchTokenGroups('34 age row 2 column 3', [['34'], ['name', 'column 3'], ['row 22', 'row 2']]);

  assert.equal(verdict.passed, true);
  assert.deepEqual(verdict.groups.map(group => group.matched), ['34', 'column 3', 'row 2']);
  assert.equal(matchTokenGroups('row 22', [['row 2']]).passed, false, '`row 2` is not inside `row 22`');
  assert.equal(matchTokenGroups('alice', [['ALICE.']]).passed, true, 'a synonym is normalized the way the announcement was');
  assert.equal(matchTokenGroups('', [['alice']]).passed, false);
  assert.equal(matchTokenGroups('anything', []).passed, true, 'a step with no group asserts nothing');
});

test('a synonym of digits alone is a value: a position phrase never satisfies it', () => {
  assert.equal(matchTokenGroups('name column header row 1 column 2', [['1']]).passed, false, '`row 1` is a position, not the value 1');
  assert.equal(matchTokenGroups('1 row header row 8 column 1', [['1']]).passed, true, 'the leading label is the value 1; `column 1` is not');
  assert.equal(matchTokenGroups('collapsed row 1', [['1']]).passed, false);
  assert.equal(matchTokenGroups('1 of 3', [['1']]).passed, false, '`1 of 3` is a position in a set');
  assert.equal(matchTokenGroups('1 of 3', [['3']]).passed, false, 'so is its `3`');
  assert.equal(matchTokenGroups('level 2 a 1', [['2']]).passed, false, '`level 2` is a position too');
  assert.equal(matchTokenGroups('col 4 4', [['4']]).passed, true, 'a standalone 4 after the position still counts');
  assert.equal(matchTokenGroups('34 age row 2 column 3', [['34'], ['3']]).groups[1].matched, null, '`3` is not inside `34`, and `column 3` is a position');
  assert.equal(matchTokenGroups('collapsed row 1', [['row 1']]).passed, true, 'a position is asked for by spelling it out');
  assert.equal(matchTokenGroups('row 8 column 1', [['column 1']]).passed, true, 'a synonym with words keeps the whole-phrase match');
});

test('a whole-word number never matches inside a decimal or a grouped number, and the digit rule has two known limits', () => {
  assert.equal(matchTokenGroups(normalizeAnnouncement('Price 34.5'), [['34']]).passed, false, '`34` is not the value 34.5');
  assert.equal(matchTokenGroups(normalizeAnnouncement('1,000 rows'), [['1']]).passed, false, '`1` is not the value 1,000');
  assert.equal(matchTokenGroups(normalizeAnnouncement('Price 34.5'), [['34.5']]).passed, true, 'a decimal is asked for as written');
  assert.equal(matchTokenGroups(normalizeAnnouncement('-34'), [['34']]).passed, true, 'limit: a negative number loses its sign');
  assert.equal(matchTokenGroups(normalizeAnnouncement('Total of 34'), [['34']]).passed, false, 'limit: a number right after `of` is a set position');
});

test('compareWithGolden reports every differing, new and vanished step', () => {
  const steps = [{ id: 'a', normalized: 'alice' }, { id: 'b', normalized: 'bruno' }];

  assert.deepEqual(compareWithGolden(null, steps), { status: 'missing', differences: [] });
  assert.deepEqual(compareWithGolden({ steps: { a: 'alice', b: 'bruno' } }, steps), { status: 'match', differences: [] });
  assert.deepEqual(compareWithGolden({ steps: { a: 'alice', c: 'carla' } }, steps), {
    status: 'differs',
    differences: [{ id: 'b', expected: null, actual: 'bruno' }, { id: 'c', expected: 'carla', actual: null }],
  });
  assert.deepEqual(compareWithGolden({ steps: { a: 'alice name', b: 'bruno' } }, steps).differences, [{ id: 'a', expected: 'alice name', actual: 'alice' }]);
});

test('a golden recorded from a transcript compares as a match with it', () => {
  const golden = goldenFromTranscript(transcript());

  assert.equal(golden.schema, 1);
  assert.equal(golden.project, 'nvda-chromium');
  assert.deepEqual(golden.recorded, { screenReader: 'NVDA 2026.2', browser: 'chromium 141.0.0.0', platform: 'win32 10.0.26100', at: '2026-10-22T03:30:00.000Z' });
  assert.deepEqual(golden.steps, { 'arrow-right': '34 age row 2 column 3', 'open-editor': 'edit multi line alice' });
  assert.equal(compareWithGolden(golden, transcript().steps).status, 'match');
});

test('transcriptCounts and the log say what passed and what did not', () => {
  const counts = transcriptCounts(transcript());

  assert.deepEqual(counts, { steps: 2, tokenFailures: 1, goldenStatus: 'missing', goldenDifferences: 0, durationMs: 4200 });

  const log = renderTranscriptLog(transcript({ golden: { status: 'differs', differences: [{ id: 'open-editor', expected: 'x', actual: 'edit multi line alice' }] } }));

  assert.match(log, /^# grid-core on nvda-chromium \(NVDA 2026\.2, chromium 141\.0\.0\.0\)/);
  assert.match(log, /\[arrow-right\] press ArrowRight \(2100 ms\)\n {2}spoken: "34 {2}Age {2}row 2 column 3"\n {2}tokens PASS: 34, age \| golden same/);
  assert.match(log, /\[open-editor\] press Enter[^\n]*\n[^\n]*\n {2}tokens FAIL: alice, MISSING \[text area\] \| golden DIFF/);
  assert.equal(describeAction({ selectCell: [0, -1] }), 'selectCell [0, -1]');
});

test('the log of a run that stopped at a step names the step and the error above the steps it captured', () => {
  const log = renderTranscriptLog(transcript({
    steps: transcript().steps.slice(0, 1),
    golden: { status: 'incomplete', differences: [] },
    incomplete: { step: 'open-editor', error: 'step open-editor: .handsontableInput visible\n  timed out' },
  }));

  assert.match(log, /^# golden: incomplete\n# INCOMPLETE: stopped at step open-editor: step open-editor: \.handsontableInput visible timed out\n\n\[arrow-right\]/m);
  assert.match(log, /tokens PASS: 34, age\n$/, 'no golden verdict on a step of a partial run');
  assert.doesNotMatch(renderTranscriptLog(transcript()), /INCOMPLETE/);
});

test('the log of a run that recorded the golden gives no golden verdict per step: nothing was compared', () => {
  const log = renderTranscriptLog(transcript({ golden: { status: 'recorded', differences: [] } }));

  assert.match(log, /^# golden: recorded$/m);
  assert.match(log, /tokens PASS: 34, age\n/);
  assert.doesNotMatch(log, /\| golden/, 'no `golden same` on a step nothing was compared with');
  assert.match(renderTranscriptLog(transcript({ golden: { status: 'match', differences: [] } })), /tokens PASS: 34, age \| golden same/, 'a compared run keeps its verdict');
});
