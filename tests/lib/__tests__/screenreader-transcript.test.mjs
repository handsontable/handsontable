import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CHATTER,
  compareWithGolden,
  describeAction,
  goldenFromTranscript,
  matchTokenGroups,
  matchTraversal,
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

test('every token group carries its severity: serious unless the step declares one for it', () => {
  const verdict = matchTokenGroups('row 2', [['34'], ['age', 'column 3'], ['row 2']], { age: 'minor' });

  assert.deepEqual(verdict.groups.map(group => [group.synonyms[0], group.matched, group.severity]), [
    ['34', null, 'serious'],
    ['age', null, 'minor'],
    ['row 2', 'row 2', 'serious'],
  ]);
  assert.deepEqual(matchTokenGroups('x', [['y']]).groups[0].severity, 'serious', 'no declaration at all');
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

  assert.deepEqual(counts, { steps: 2, tokenFailures: 1, unsupported: 0, traversalFailed: false, goldenStatus: 'missing', goldenDifferences: 0, durationMs: 4200 });

  const log = renderTranscriptLog(transcript({ golden: { status: 'differs', differences: [{ id: 'open-editor', expected: 'x', actual: 'edit multi line alice' }] } }));

  assert.match(log, /^# grid-core on nvda-chromium \(NVDA 2026\.2, chromium 141\.0\.0\.0\)/);
  assert.match(log, /\[arrow-right\] press ArrowRight \(2100 ms\)\n {2}spoken: "34 {2}Age {2}row 2 column 3"\n {2}tokens PASS: 34, age \| golden same/);
  assert.match(log, /\[open-editor\] press Enter[^\n]*\n[^\n]*\n {2}tokens FAIL: alice, MISSING \[text area\] \| golden DIFF/);
  assert.equal(describeAction({ selectCell: [0, -1] }), 'selectCell [0, -1]');
  assert.equal(describeAction({ read: 'next' }), 'read next');
  assert.equal(describeAction({ activate: true }), 'activate', 'a primitive without a value is its name');
  assert.equal(describeAction({ call: ['resolveRequest', 0, 'New A'] }), 'call resolveRequest(0, "New A")', 'a host event reads as the call it makes');
  assert.equal(describeAction({ call: ['htReleaseFetch'] }), 'call htReleaseFetch()');
});

test('the log lists the steps the lane did not drive, what the reader said preparing a step, and the traversal', () => {
  const log = renderTranscriptLog(transcript({
    steps: [{ ...transcript().steps[0], preparing: ['browse mode'] }],
    unsupported: [{ id: 'enter-grid', action: { read: 'in' }, reason: 'NVDA has no interaction level.' }],
    traversal: { passed: false, steps: ['arrow-right'], items: [{ item: 'A1', count: 2, firstStep: 'arrow-right' }, { item: 'B1', count: 1, firstStep: 'arrow-right' }], outOfOrder: ['B1'] },
  }));

  assert.match(log, /\[arrow-right\] press ArrowRight \(2100 ms\)\n {2}preparing: \["browse mode"\]\n {2}spoken:/);
  assert.match(log, /^\[enter-grid\] read in: not run on this lane \(NVDA has no interaction level\.\)$/m);
  assert.match(log, /^# traversal FAIL over arrow-right: A1×2 B1×1; out of order: B1$/m);
  assert.equal(transcriptCounts(transcript({ unsupported: [{ id: 'x', action: { read: 'in' }, reason: 'r' }] })).unsupported, 1);
  assert.equal(transcriptCounts(transcript({ traversal: { passed: false, steps: [], items: [], outOfOrder: [] } })).traversalFailed, true);
});

test('a traversal reads every item once and in order, and names the twice, the never and the out of order', () => {
  const step = (id, normalized) => ({ id, normalized });
  const traversal = { from: 'b', to: 'd', items: ['A1', 'B1', 'C1', '2'] };

  assert.deepEqual(matchTraversal([step('a', 'c1 b1'), step('b', 'table a1'), step('c', 'b1 row 2'), step('d', 'c1 2'), step('e', 'a1')], traversal), {
    passed: true,
    steps: ['b', 'c', 'd'],
    items: [{ item: 'A1', count: 1, firstStep: 'b' }, { item: 'B1', count: 1, firstStep: 'c' }, { item: 'C1', count: 1, firstStep: 'd' }, { item: '2', count: 1, firstStep: 'd' }],
    outOfOrder: [],
  }, 'only the steps from `from` to `to` count, and a digits item is never part of `row 2`');

  const off = matchTraversal([step('b', 'a1 c1'), step('c', 'a1 b1'), step('d', 'row 2 column 2')], traversal);

  assert.equal(off.passed, false);
  assert.deepEqual(off.items.map(entry => [entry.item, entry.count, entry.firstStep]), [['A1', 2, 'b'], ['B1', 1, 'c'], ['C1', 1, 'b'], ['2', 0, null]]);
  assert.deepEqual(off.outOfOrder, ['C1'], 'C1 was first read before B1, which is listed ahead of it');
  assert.equal(matchTraversal([step('b', 'a10 b1'), step('d', 'c1 2')], traversal).items[0].count, 0, 'a whole word: A1 is not inside A10');
  assert.equal(matchTraversal([step('b', 'a1 b1')], { from: 'b', to: 'b', items: ['A1.', 'B1'] }).passed, true, 'items normalize as tokens do');

  const spelled = matchTraversal([step('b', 'a 1 b1'), step('c', 'row 2 a a column 2 a 1')], { from: 'b', to: 'c', items: [['A1', 'A 1'], ['B1', 'B 1']] });

  assert.deepEqual(spelled.items, [{ item: 'A1', count: 2, firstStep: 'b' }, { item: 'B1', count: 1, firstStep: 'b' }],
    'every synonym of an item counts (NVDA spells A1 as "A 1"), and the first names it');
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
