import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as policy from '../../../tests/lib/quarantine-policy.mjs';
import {
  LEGS,
  QUARANTINE_CAP,
  QUARANTINE_MAX_DAYS,
  VISUAL_QUARANTINE_ITEM_CAP,
  expandItems,
  isLive,
  lapseOf,
  partitionReport,
  quarantineLines,
  quarantineLookup,
  validateQuarantineFile,
} from '../visual-quarantine.mjs';

// The quarantine decides which differences stop holding a pull request and the nightly, so both halves
// are pinned: what may be parked (the file's rules, checked against the real clock on every pull request)
// and what parking does (only changed items, only while live, always listed).

const PACKAGE_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const REPO_ROOT = join(PACKAGE_ROOT, '..');
const CROSS_BROWSER = readdirSync(join(PACKAGE_ROOT, 'tests', 'cross-browser'))
  .filter(name => name.endsWith('.spec.ts'))
  .map(name => name.slice(0, -'.spec.ts'.length));
const specExists = spec => existsSync(join(REPO_ROOT, spec));
const NOW = new Date('2026-09-23T12:00:00Z');
// The capture behind the 10 ms condition timer, which is what WHY says flakes, and the one after it.
const CAPTURE = 'js-only/filters/tab-navigation-through-condition-components-2';
const NEXT_CAPTURE = 'js-only/filters/tab-navigation-through-condition-components-3';
// A multi-framework spec renders on the five js variants and the three wrappers.
const MULTI_FRAMEWORK_CAPTURES = ['multi-frameworks/tab-navigation-1', 'multi-frameworks/tab-navigation-2'];
const entry = overrides => ({
  taskId: 'DEV-1234',
  expires: '2026-10-10',
  capture: CAPTURE,
  legs: ['js/chromium-theme-main-dark'],
  why: 'focus hand-off lands on either side of the 10 ms condition timer',
  ...overrides,
});
const validate = (entries, now = NOW) => validateQuarantineFile({ entries }, now, {
  crossBrowserSpecs: CROSS_BROWSER, specExists,
});
const WHY = 'focus hand-off lands on either side of the 10 ms condition timer';
const SHAPE_PROBLEM = 'visual-quarantine.json must be an object with an `entries` array';

test('the checked-in quarantine holds today', () => {
  // The ratchet, and deliberately on the real clock: the day after an entry expires, this fails on every
  // pull request until the entry is removed or renewed. That blocks unrelated work on purpose – a visual
  // quarantine left to lapse quietly is a golden nobody is fixing – so the message names the remedy.
  const file = JSON.parse(readFileSync(join(PACKAGE_ROOT, 'visual-quarantine.json'), 'utf8'));

  assert.deepEqual(validateQuarantineFile(file, new Date(), { crossBrowserSpecs: CROSS_BROWSER, specExists }), []);
});

test('the visual quarantine shares the functional tier\'s limits rather than copying them', () => {
  // One horizon, one cap, one task-id and date check for both tiers: the module imports them, so there is
  // no second definition to drift. This pins that the import stays an import.
  assert.equal(QUARANTINE_CAP, policy.QUARANTINE_CAP);
  assert.equal(QUARANTINE_MAX_DAYS, policy.QUARANTINE_MAX_DAYS);
  assert.equal(QUARANTINE_CAP, 6);
  assert.equal(QUARANTINE_MAX_DAYS, 30);
  assert.equal(VISUAL_QUARANTINE_ITEM_CAP, 12);
});

test('the legs are the eleven variants the suite renders', () => {
  assert.deepEqual(LEGS, [
    'js/chromium', 'js/chromium-theme-main', 'js/chromium-theme-main-dark', 'js/chromium-theme-horizon',
    'js/chromium-theme-horizon-dark', 'angular-wrapper/chromium', 'react-wrapper/chromium', 'vue3/chromium',
    'cross-browser/chromium', 'cross-browser/firefox', 'cross-browser/webkit',
  ]);
});

test('a valid entry passes', () => {
  assert.deepEqual(validate([entry()]), []);
});

test('each broken rule is reported, naming the entry', () => {
  const cases = [
    [entry({ taskId: 'dev-1234' }), /names the owning task id/],
    [entry({ expires: '2026-02-30' }), /carries an expiry date/],
    [entry({ expires: '2026-11-30' }), /expires within 30 days; 2026-11-30 is further away/],
    // The expiry message carries the remedy, because it reds every pull request until someone acts.
    [entry({ expires: '2026-09-20' }), /expired on 2026-09-20 \(DEV-1234\)\. Remove the entry from visual-tests\//],
    [entry({ why: '' }), /`why` says in one line what flakes/],
    [entry({ capture: `${CAPTURE}.png` }), /`capture` is the item path without its variant prefix/],
    [entry({ legs: [] }), /`legs` names the variants that flake/],
    [entry({ legs: ['js/firefox'] }), /`js\/firefox` is not a variant this suite renders/],
    [entry({ capture: 'js-only/filters/no-such-spec-1' }), /no-such-spec\.spec\.ts, which does not exist/],
    // A cross-browser capture on a js leg resolves to a js spec that is not there.
    [entry({ capture: 'selection-arabic-rtl-demo-2', legs: ['js/chromium'] }), /which does not exist/],
  ];

  cases.forEach(([bad, expected]) => {
    const problems = validate([bad]);

    assert.equal(problems.length, 1, `${JSON.stringify(bad)} → ${JSON.stringify(problems)}`);
    assert.match(problems[0], /^entry 1/);
    assert.match(problems[0], expected);
  });
});

test('the file shape itself is checked', () => {
  assert.deepEqual(validateQuarantineFile(null, NOW), [SHAPE_PROBLEM]);
  assert.deepEqual(validateQuarantineFile({ entries: {} }, NOW), [SHAPE_PROBLEM]);
});

test('an item quarantined twice is reported', () => {
  const problems = validate([entry(), entry({ taskId: 'DEV-5678' })]);

  assert.equal(problems.length, 1);
  assert.match(problems[0], /already quarantined by entry 1/);
});

test('the caps count entries and the items their legs expand to', () => {
  // Six entries at most, like the functional tier's six tests.
  const seven = [
    ...[1, 2, 3, 4].map(i => `js-only/filters/tab-navigation-through-condition-components-${i}`),
    ...[1, 2, 3].map(i => `js-only/filters/tab-navigation-through-action-buttons-${i}`),
  ].map(capture => entry({ capture }));

  assert.match(validate(seven).join('\n'), /7 entries are in the quarantine and the cap is 6/);

  // Twelve items at most, one per leg: one capture parked on all eight multi-framework legs is within the
  // cap, and a second one parked everywhere is not.
  const everywhere = LEGS.filter(leg => !leg.startsWith('cross-browser/'));

  assert.equal(everywhere.length, 8, 'a multi-framework capture renders on eight variants');
  const sixteen = MULTI_FRAMEWORK_CAPTURES.map(capture => entry({ capture, legs: everywhere }));

  assert.match(validate(sixteen).join('\n'), /16 items are quarantined and the cap is 12/);
  assert.deepEqual(validate(sixteen.slice(0, 1)), [], 'eight items are within the cap');

  // Only live items count: an expired entry on the same eight legs is its own problem, not a ninth item.
  const oneLapsed = [
    entry({ capture: MULTI_FRAMEWORK_CAPTURES[0], legs: everywhere, expires: '2026-09-01' }),
    sixteen[1],
  ];
  const problems = validate(oneLapsed).join('\n');

  assert.match(problems, /expired on 2026-09-01/);
  assert.doesNotMatch(problems, /items are quarantined/, 'the expired entry\'s legs are not counted');
});

test('expandItems gives one item per leg, and none for a malformed entry', () => {
  const [multi] = MULTI_FRAMEWORK_CAPTURES;

  assert.deepEqual(expandItems(entry({ capture: multi, legs: ['js/chromium', 'react-wrapper/chromium'] })), [
    `js/chromium/${multi}.png`,
    `react-wrapper/chromium/${multi}.png`,
  ]);
  // The gate and the nightly read the file before anything validates it, so a malformed entry must cover
  // nothing rather than throw a TypeError into the comment.
  [null, 'x', { capture: CAPTURE, legs: 'js/chromium' }, { legs: ['js/chromium'] }].forEach((bad) => {
    assert.deepEqual(expandItems(bad), [], JSON.stringify(bad));
  });
});

test('lapseOf separates an expired entry from one that never held', () => {
  assert.equal(lapseOf(entry(), NOW), null);
  assert.deepEqual(lapseOf(entry({ expires: '2026-09-01' }), NOW), { expired: true, reason: 'expired on 2026-09-01' });

  const beyond = lapseOf(entry({ expires: '2027-06-01' }), NOW);

  assert.equal(beyond.expired, false, 'a date beyond the horizon has not expired, it never held');
  assert.match(beyond.reason, /within 30 days/);
  assert.equal(lapseOf(entry({ taskId: 'nope' }), NOW).expired, false);
  [null, { capture: CAPTURE, legs: 'js/chromium' }].forEach((bad) => {
    assert.deepEqual(lapseOf(bad, NOW),
      { expired: false, reason: 'not a valid entry: it needs a `capture` and a non-empty `legs` array' });
  });
});

test('an entry is live until the end of its expiry day, and only within the horizon', () => {
  assert.equal(isLive(entry({ expires: '2026-09-23' }), NOW), true, 'the expiry day itself still counts');
  assert.equal(isLive(entry({ expires: '2026-09-22' }), NOW), false);
  // Re-checked at run time: an entry pushed with a far-future date never holds.
  assert.equal(isLive(entry({ expires: '2027-01-01' }), NOW), false);
  assert.equal(isLive(entry({ taskId: 'nope' }), NOW), false, 'an invalid entry is never live');
});

test('partitionReport parks only changed items under a live entry, and says why the rest block', () => {
  const quarantinedItem = `js/chromium-theme-main-dark/${CAPTURE}.png`;
  const expiredItem = 'js/chromium-theme-main/js-only/sheetsBar/tabs-6.png';
  const plain = 'js/chromium-theme-main/js-only/dialog/dialog-focus-5.png';
  const report = {
    failedItems: [quarantinedItem, expiredItem, plain],
    // A quarantined capture that reg-suit calls new is structure, not a flake, and still counts.
    newItems: [`js/chromium-theme-main-dark/${NEXT_CAPTURE}.png`],
    deletedItems: [],
    passedItems: ['ok.png'],
  };
  const entries = [
    entry(),
    entry({ capture: NEXT_CAPTURE }),
    entry({ capture: 'js-only/sheetsBar/tabs-6', legs: ['js/chromium-theme-main'], expires: '2026-09-01' }),
  ];
  const { report: rest, quarantined, expired } = partitionReport(report, entries, NOW);

  assert.deepEqual(rest.failedItems, [expiredItem, plain], 'only the live entry\'s changed item leaves failedItems');
  assert.deepEqual(rest.newItems, report.newItems, 'a new item is never quarantined');
  assert.deepEqual(rest.passedItems, report.passedItems);
  assert.deepEqual(quarantined.map(q => q.item), [quarantinedItem]);
  assert.deepEqual(expired.map(e => e.item), [expiredItem], 'an expired entry blocks again and says so');
  assert.deepEqual(expired.map(e => [e.expired, e.reason]), [[true, 'expired on 2026-09-01']]);
  assert.deepEqual(report.failedItems.length, 3, 'the input report is not mutated');
});

test('partitionReport says why an entry that never held does not, and survives a malformed one', () => {
  const beyondItem = `js/chromium-theme-main-dark/${CAPTURE}.png`;
  const report = { failedItems: [beyondItem], newItems: [], deletedItems: [], passedItems: [] };
  const entries = [null, { capture: CAPTURE, legs: 'js/chromium' }, entry({ expires: '2027-06-01' })];
  const { report: rest, quarantined, expired } = partitionReport(report, entries, NOW);

  assert.deepEqual(rest.failedItems, [beyondItem], 'it still blocks');
  assert.deepEqual(quarantined, []);
  assert.equal(expired.length, 1);
  assert.equal(expired[0].expired, false, 'not listed as expired: its date has not come');
  assert.match(expired[0].reason, /within 30 days; 2027-06-01 is further away/);
});

test('partitionReport passes a missing report through', () => {
  assert.deepEqual(partitionReport(null, [entry()], NOW), { report: null, quarantined: [], expired: [] });
});

test('the lookup names a live entry for the record, and nothing for the rest', () => {
  const lookup = quarantineLookup([entry(), entry({ capture: 'x-1', expires: '2026-09-01' })], NOW);

  assert.equal(lookup(`js/chromium-theme-main-dark/${CAPTURE}.png`),
    'DEV-1234 until 2026-10-10 — focus hand-off lands on either side of the 10 ms condition timer');
  assert.equal(lookup(`js/chromium/${CAPTURE}.png`), null, 'a leg the entry does not name');
  assert.equal(lookup('js/chromium-theme-main-dark/x-1.png'), null, 'an expired entry');
});

test('the listing is empty with nothing to list, so a suite with no quarantine renders as before', () => {
  assert.deepEqual(quarantineLines([], []), []);

  const lines = quarantineLines(
    [{ item: 'a.png', entry: entry() }],
    [{ item: 'b.png', entry: entry({ expires: '2026-09-01' }) }],
  );

  assert.equal(lines[0], '### Quarantined — reported, not blocking');
  assert.ok(lines.includes(`- \`a.png\` — DEV-1234 until 2026-10-10 — ${WHY}`));
  assert.ok(lines.includes('### Expired quarantine — blocking again'));
  assert.ok(lines.some(line => /Remove the entry from visual-tests\/visual-quarantine\.json/.test(line)));
  assert.ok(!lines.includes('### Quarantine entry not in force — blocking'), 'no heading without an item');

  const invalid = quarantineLines([], [{ item: 'c.png', entry: null, expired: false, reason: 'not a valid entry' }]);

  assert.deepEqual(invalid.slice(0, 3), ['### Quarantine entry not in force — blocking', '',
    '- `c.png` — not a valid entry']);
  assert.ok(!invalid.includes('### Expired quarantine — blocking again'), 'an invalid entry is not called expired');
  assert.ok(invalid.some(line => /Checks \/ tooling tests. names what is wrong/.test(line)));
});
