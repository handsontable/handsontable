import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path, { join } from 'node:path';
import {
  budgetTotal,
  countByPrefix,
  countByStem,
  evaluateBudget,
  readMarker,
  renderedItems,
} from '../visual-budget.mjs';

// The budget exists because a golden set grows one reasonable capture at a time and nobody is ever
// against the capture in front of them. Every record is rendered, stored and compared on every build
// from then on, so the size is a number somebody has to change on purpose — which is what the marker
// in the pull-request description is for.
//
// What these pin is the shape of the judgement rather than today's counts: per prefix and never on the
// total (a pr-tier build renders two of eleven, and 480 clears a 1676 ceiling without meaning
// anything), the raw item list so quarantining cannot shrink the set, and growth refused unless the
// author states the new number and the file agrees with them.

const root = path.join(import.meta.dirname, '../../..');
const BUDGET = JSON.parse(readFileSync(path.join(root, 'visual-tests/visual-budget.json'), 'utf8'));
// The live total, so a trim that lowers the file (the consolidation does, family by family) moves the
// arithmetic below with it; what the numbers are is the declaration sweep's business, not this file's.
const TOTAL = budgetTotal(BUDGET);

/**
 * A report whose rendered items are exactly the counts asked for.
 *
 * @param {object} counts Prefix to how many records it rendered.
 * @param {object} [extra] `newItems` / `deletedItems` overrides.
 * @returns {object} A reg-suit-shaped `out.json`.
 */
function reportWith(counts, extra = {}) {
  const passedItems = [];

  Object.entries(counts).forEach(([prefix, count]) => {
    for (let index = 0; index < count; index += 1) {
      passedItems.push(`${prefix}js-only/spec-${index}-1.png`);
    }
  });

  return { passedItems, newItems: [], failedItems: [], deletedItems: [], ...extra };
}

/**
 * Today's full-tier shape, so a test can vary one prefix and leave the rest legal.
 *
 * @returns {object} Prefix to its budgeted count.
 */
function atBudget() {
  return { ...BUDGET.prefixes };
}

test('the checked-in budget describes the eleven prefixes develop renders', () => {
  // The file is the contract; if it stops covering a prefix, every build rendering that prefix fails
  // as "not budgeted" and the message sends the reader here.
  assert.deepEqual(Object.keys(BUDGET.prefixes).sort(), [
    'angular-wrapper/chromium/',
    'cross-browser/chromium/',
    'cross-browser/firefox/',
    'cross-browser/webkit/',
    'js/chromium-theme-horizon-dark/',
    'js/chromium-theme-horizon/',
    'js/chromium-theme-main-dark/',
    'js/chromium-theme-main/',
    'js/chromium/',
    'react-wrapper/chromium/',
    'vue3/chromium/',
  ]);
  // Deliberately no hardcoded total here. `visual-declarations.test.mjs` derives the eleven counts from
  // the checked-in specs and asserts them against this same file, so the VALUE is proved by the spec
  // tree rather than by a number typed twice. What is worth pinning here is that every count is a
  // positive integer — a zero or a string would make the ceiling meaningless while still parsing.
  Object.entries(BUDGET.prefixes).forEach(([prefix, count]) => {
    assert.ok(Number.isInteger(count) && count > 0, `${prefix} is budgeted as ${count}`);
  });
});

test('every cap exception carries a ticket that will bring it down', () => {
  // An exception list without tickets is just a higher cap with extra steps. The nine specs over the
  // cap today are the consolidation backlog, and each names the task that owns it.
  const exceptions = Object.entries(BUDGET.capExceptions ?? {});

  assert.ok(exceptions.length > 0, 'the exception list is empty — if the specs were trimmed, drop the key');

  exceptions.forEach(([stem, exception]) => {
    assert.match(exception.ticket ?? '', /^(DEV|PRO|SU)-\d+$/,
      `${stem} has no ticket; an exception without one is the policy, not an exception to it`);
    assert.ok(exception.captures > BUDGET.captureCap,
      `${stem} is listed as an exception but takes ${exception.captures}, within the cap of `
      + `${BUDGET.captureCap} — drop it from the list`);
  });
});

test('rendered means rendered: deleted items are not, quarantined ones are', () => {
  // The flake ledger (G5) subtracts a quarantined item from the FAILING count so it stops blocking.
  // Subtracting it from the SIZE as well would let the set be grown by quarantining, so this reads the
  // raw lists: passed + new + failed, and never deleted.
  const items = renderedItems({
    passedItems: ['js/chromium/a-1.png'],
    newItems: ['js/chromium/b-1.png'],
    failedItems: ['js/chromium/c-1.png'],
    deletedItems: ['js/chromium/gone-1.png'],
  });

  assert.deepEqual(items.sort(), ['js/chromium/a-1.png', 'js/chromium/b-1.png', 'js/chromium/c-1.png']);
});

test('the ceiling is per prefix, because a subset render would clear a total', () => {
  // A pr-tier build renders two of the eleven prefixes. Judged on the total it could double either one
  // and still sit far under the total — which is the whole reason the file is eleven numbers and not one.
  const prTier = reportWith({
    'js/chromium-theme-main/': BUDGET.prefixes['js/chromium-theme-main/'] + 1,
    'js/chromium-theme-main-dark/': BUDGET.prefixes['js/chromium-theme-main-dark/'],
  });
  const verdict = evaluateBudget({ report: prTier, budget: BUDGET });

  assert.equal(verdict.pass, false, 'one prefix over its own number must fail even far under the total');
  assert.match(verdict.violations.join('\n'),
    new RegExp(`js\\/chromium-theme-main\\/. rendered ${BUDGET.prefixes['js/chromium-theme-main/'] + 1}`));
});

test('a prefix nobody budgeted is refused, with its count named', () => {
  // A tier gaining a theme arrives as 240 records at once. Failing on the unknown prefix is the only
  // check that sees it before the records exist.
  const verdict = evaluateBudget({
    report: reportWith({ ...atBudget(), 'js/chromium-theme-cobalt/': 240 }),
    budget: BUDGET,
  });

  assert.equal(verdict.pass, false);
  assert.match(verdict.violations.join('\n'),
    /js\/chromium-theme-cobalt\/. rendered 240 record\(s\) and is not in visual-budget\.json/);
});

test('a build at its numbers passes, and says what it rendered', () => {
  const verdict = evaluateBudget({ report: reportWith(atBudget()), budget: BUDGET });

  assert.equal(verdict.pass, true, verdict.violations.join('\n'));
  assert.match(verdict.comment, /^## Visual budget/);
  assert.match(verdict.comment, new RegExp(`${TOTAL} record\\(s\\) rendered`));
});

/**
 * The budget file as a base branch would have it: this one with a prefix lowered by `by`.
 *
 * @param {number} by How many records smaller the base is, i.e. how much this pull request adds.
 * @returns {object} A budget file.
 */
function baseSmallerBy(by) {
  return {
    ...BUDGET,
    prefixes: { ...BUDGET.prefixes, 'js/chromium/': BUDGET.prefixes['js/chromium/'] - by },
  };
}

test('raising the budget file needs the marker, and the marker has to agree with the file', () => {
  // The question is whether THIS pull request raised the file, which is a fact about the diff — not
  // about reg-suit's new-vs-deleted counts. A rename nets those to zero while the set grows, and a
  // bootstrap reports every record as new.
  const atFile = reportWith(atBudget());
  const base = baseSmallerBy(10);

  const silent = evaluateBudget({ report: atFile, budget: BUDGET, baseBudget: base, body: 'Adds a demo.' });

  assert.equal(silent.pass, false, 'raising the file with no marker must fail');
  assert.match(silent.violations.join('\n'), new RegExp(`raises the golden budget from ${TOTAL - 10} to ${TOTAL}`));
  assert.match(silent.violations.join('\n'), /\[visual budget: N — why the set has to grow\]/);

  const wrongNumber = evaluateBudget({
    report: atFile, budget: BUDGET, baseBudget: base, body: '[visual budget: 9999 — a new demo]',
  });

  assert.equal(wrongNumber.pass, false, 'a marker that disagrees with the file must fail');
  assert.match(wrongNumber.violations.join('\n'),
    new RegExp(`declares a total of 9999 and visual-budget\\.json sums to ${TOTAL}`));

  const agreed = evaluateBudget({
    report: atFile, budget: BUDGET, baseBudget: base, body: `[visual budget: ${budgetTotal(BUDGET)} — a new demo]`,
  });

  assert.equal(agreed.pass, true, agreed.violations.join('\n'));

  // An unchanged file is not growth, whatever reg-suit reported.
  assert.equal(evaluateBudget({ report: atFile, budget: BUDGET, baseBudget: BUDGET }).pass, true);
});

test('a rename cannot grow the set behind a net-zero count', () => {
  // The shape that defeated the previous rule: the same number deleted and added, so `newItems >
  // deletedItems` is false, while the file — and therefore the set — went up.
  const renamed = reportWith(atBudget());

  renamed.newItems = renamed.passedItems.splice(0, 10);
  renamed.deletedItems = Array.from({ length: 10 }, (unused, index) => `js/chromium/gone-${index}.png`);

  const verdict = evaluateBudget({ report: renamed, budget: BUDGET, baseBudget: baseSmallerBy(10) });

  assert.equal(verdict.pass, false, 'a net-zero rename that raised the file must still ask for the marker');
  assert.match(verdict.violations.join('\n'), /raises the golden budget/);
});

test('a bootstrap cannot raise the ceiling in the same commit that fills it', () => {
  // The first pull request into a base branch with no baseline: reg-suit reports every rendered record
  // as new. The previous rule switched the marker off there and leaned on the ceiling — but the ceiling
  // is this pull request's own file, so the set could be grown to any size with nothing red. Keying on
  // the file's diff makes the bootstrap case identical to every other.
  const everythingNew = reportWith({});

  everythingNew.newItems = renderedItems(reportWith(atBudget()));

  const raised = evaluateBudget({
    report: everythingNew, budget: BUDGET, baseBudget: baseSmallerBy(20),
  });

  assert.equal(raised.pass, false, 'a bootstrap that raises the file must ask for the marker like any other');
  assert.match(raised.violations.join('\n'), new RegExp(`raises the golden budget from ${TOTAL - 20} to ${TOTAL}`));

  // And a bootstrap that changed nothing is not asked for one.
  assert.equal(evaluateBudget({ report: everythingNew, budget: BUDGET, baseBudget: BUDGET }).pass, true);
});

test('an unreadable base budget is reported, not passed over', () => {
  // The growth question cannot be answered without the base file. Saying so in the comment is the
  // difference between a check that did not run and a check that passed.
  const verdict = evaluateBudget({ report: reportWith(atBudget()), budget: BUDGET, baseBudget: null });

  assert.equal(verdict.pass, true, 'it must not block on an infrastructure failure');
  assert.match(verdict.advisories.join('\n'), /could not be read/);
  assert.match(verdict.comment, /the growth check did not run/);

  // An advisory is not an under-budget note. Putting it in `notes` made a build that is AT every prefix
  // render an "Under budget" section, and armed the trim message that keys on that list.
  assert.deepEqual(verdict.notes, [], 'a check that could not run is not a prefix under its number');
  assert.doesNotMatch(verdict.comment, /Under budget/);
});

test('the marker accepts whichever dash the author typed, and a commented one is inert', () => {
  // A gate that refuses an en dash teaches people the gate is broken rather than that the number
  // matters. The number is the part that is checked; the separator is not worth a failed build.
  const total = budgetTotal(BUDGET);

  ['-', '–', '—', ':'].forEach((separator) => {
    assert.deepEqual(readMarker(`[visual budget: ${total} ${separator} a reason]`),
      { total, reason: 'a reason' },
      `the marker must accept "${separator}" as the separator`);
  });

  assert.equal(readMarker(`<!-- [visual budget: ${total} — the template documenting it] -->`), null,
    'a commented marker must not activate the opt-out — the template carries one');
  assert.equal(readMarker(''), null);
});

test('deleting records never fails, and the message asks for the file to come down with them', () => {
  // A trimming pull request is expected to come in under its own numbers; that is what it is for. The
  // gate says so rather than reporting it as drift, because an unlowered ceiling keeps the budget at
  // the size the set used to be.
  const trimmed = reportWith({ ...atBudget(), 'js/chromium/': BUDGET.prefixes['js/chromium/'] - 10 },
    { deletedItems: Array.from({ length: 10 }, (unused, index) => `js/chromium/gone-${index}.png`) });
  const verdict = evaluateBudget({ report: trimmed, budget: BUDGET });

  assert.equal(verdict.pass, true, verdict.violations.join('\n'));
  assert.match(verdict.notes.join('\n'), /Lower the prefixes in visual-budget\.json in this pull request/);
  assert.match(verdict.comment, /Under budget/);
});

test('the capture cap counts per spec, not per tier', () => {
  // A spec's captures are the same wherever it renders, so the cap is about the spec and the highest
  // per-variant count is what it costs. Summing across variants would make the cap a function of the
  // tier: the same spec would comply on a pr build and fail on a nightly.
  const items = [
    'js/chromium/js-only/demo/thing-1.png',
    'js/chromium/js-only/demo/thing-2.png',
    'js/chromium-theme-main/js-only/demo/thing-1.png',
    'js/chromium-theme-main/js-only/demo/thing-2.png',
  ];

  assert.equal(countByStem(items).get('js-only/demo/thing'), 2,
    'two variants of a two-capture spec is a two-capture spec, not a four-capture one');
  assert.equal(countByPrefix(items).get('js/chromium/'), 2);
});

test('a spec over the cap fails unless a ticketed exception already covers it', () => {
  const overCap = {
    passedItems: Array.from({ length: 6 }, (unused, index) => `js/chromium/js-only/demo/busy-${index + 1}.png`),
    newItems: [],
    failedItems: [],
    deletedItems: [],
  };

  const unlisted = evaluateBudget({ report: overCap, budget: BUDGET });

  assert.equal(unlisted.pass, false);
  assert.match(unlisted.violations.join('\n'), /js-only\/demo\/busy. takes 6 captures, cap 4/);

  const listed = evaluateBudget({
    report: overCap,
    budget: { ...BUDGET, capExceptions: { 'js-only/demo/busy': { captures: 6, ticket: 'DEV-2981' } } },
  });

  assert.equal(listed.pass, true, listed.violations.join('\n'));

  const untickted = evaluateBudget({
    report: overCap,
    budget: { ...BUDGET, capExceptions: { 'js-only/demo/busy': { captures: 6 } } },
  });

  assert.equal(untickted.pass, false, 'an exception with no ticket must be refused');
  assert.match(untickted.violations.join('\n'), /no `ticket`/);

  const grown = evaluateBudget({
    report: overCap,
    budget: { ...BUDGET, capExceptions: { 'js-only/demo/busy': { captures: 5, ticket: 'DEV-2981' } } },
  });

  assert.equal(grown.pass, false, 'an exception is a ceiling on what is there, not a licence to add');
  assert.match(grown.violations.join('\n'), /its exception allows 5/);
});

test('the marker is not asked for outside a pull request', () => {
  // A seed or a nightly has no description to carry one, and failing them would block develop for a
  // growth the merging pull request already accounted for.
  const atFile = reportWith(atBudget());
  const base = baseSmallerBy(5);

  assert.equal(evaluateBudget({ report: atFile, budget: BUDGET, baseBudget: base, isPullRequest: false }).pass,
    true, 'a push build must not be asked for a description it does not have');
  assert.equal(evaluateBudget({ report: atFile, budget: BUDGET, baseBudget: base, isPullRequest: true }).pass,
    false, 'the same change on a pull request must be');
});

test('the growth marker is read through the shared comment stripper', () => {
  // The marker lives in a pull-request description, which carries the PR template's commented example
  // of it. Reading a commented marker would let the template itself authorise every growth.
  //
  // `stripHtmlComments` is a COPY of the changelog gate's, because visual-tests/ is its own package and
  // a relative import across the tree breaks the moment either side is packaged. The two are pinned
  // equal — text and behaviour — in .github/scripts/__tests__/changelog-gate.test.mjs, which is the
  // side that owns the original.
  assert.equal(readMarker('<!-- [visual budget: 1 — from the template] -->'), null);
  assert.deepEqual(readMarker('real [visual budget: 1 — a reason] <!-- and a comment -->'),
    { total: 1, reason: 'a reason' });
});

// --- the wrapper, not just the judgement ---

/**
 * Run `scripts/visual-budget.mjs` over a throwaway `.reg/` directory.
 *
 * The CLI carries real decisions the pure functions cannot: it PREPENDS to the gate's comment (the
 * whole reason for the step order), it exits 0 when there is nothing to judge, and it survives a
 * missing comment. Those were smoke-tested by hand and not committed, which is the same as untested.
 *
 * @param {object} options What to put on disk and in the environment.
 * @param {object|null} options.report The `out.json` to write, or null to write none.
 * @param {string|null} [options.comment] The `comment.md` to write, or null to write none.
 * @param {object} [options.env] Extra environment for the run.
 * @returns {{status: number, stdout: string, comment: string|null}} What it did.
 */
function runBudgetCli({ report, comment = null, env = {} }) {
  const dir = mkdtempSync(join(tmpdir(), 'visual-budget-'));

  if (report) {
    writeFileSync(join(dir, 'out.json'), JSON.stringify(report));
  }

  if (comment !== null) {
    writeFileSync(join(dir, 'comment.md'), comment);
  }

  const result = spawnSync(process.execPath, [path.join(root, 'visual-tests/scripts/visual-budget.mjs')], {
    encoding: 'utf8',
    env: {
      ...process.env,
      VISUAL_GATE_DIR: dir,
      GITHUB_EVENT_NAME: 'pull_request',
      VISUAL_PR_BODY: '',
      VISUAL_PR_BODY_FILE: '',
      VISUAL_BUDGET_BASE_FILE: '',
      ...env,
    },
  });

  return {
    status: result.status,
    stdout: `${result.stdout}${result.stderr}`,
    comment: existsSync(join(dir, 'comment.md')) ? readFileSync(join(dir, 'comment.md'), 'utf8') : null,
    dir,
  };
}

test('the wrapper prepends its section above the gate comment, with a blank line between', () => {
  // Prepending rather than merging is what keeps every regex in visual-gate.test.mjs intact, and it is
  // the only reason the step has to run after the verdict. The blank line is not cosmetic: a `##`
  // heading with text directly above it is not a heading.
  const run = runBudgetCli({
    report: reportWith(atBudget()),
    comment: '## Visual tests\n\nthe gate said this\n',
  });

  assert.equal(run.status, 0, run.stdout);
  assert.match(run.comment, /^## Visual budget\n\n/, 'the budget section must come first');
  assert.match(run.comment, /\n\n## Visual tests\n/, 'the gate heading must keep a blank line above it');
  assert.ok(run.comment.includes('the gate said this'), 'the gate comment must survive intact');
});

test('the wrapper exits 0 when there is nothing to judge, and survives a missing comment', () => {
  // No `out.json` is the bootstrap-before-comparison path. Failing there would block the first build on
  // a new branch over a file that was never written.
  const noReport = runBudgetCli({ report: null });

  assert.equal(noReport.status, 0, 'a missing out.json must not fail the job');
  assert.match(noReport.stdout, /No comparison result to judge/);

  // No `comment.md` means the gate did not run. Writing a budget section with no verdict under it would
  // be a comment about nothing, so it says so and still reports its own verdict.
  const noComment = runBudgetCli({ report: reportWith(atBudget()), comment: null });

  assert.equal(noComment.status, 0, noComment.stdout);
  assert.match(noComment.stdout, /visual-gate\.mjs did not run/);
});

test('the wrapper exits 1 on a violation, and names it', () => {
  const over = reportWith({ ...atBudget(), 'js/chromium/': BUDGET.prefixes['js/chromium/'] + 5 });
  const run = runBudgetCli({ report: over, comment: '## Visual tests\n' });

  assert.equal(run.status, 1, 'a violation must fail the step, or the budget is a comment');
  assert.match(run.stdout, /js\/chromium\/. rendered \d+ record\(s\), budget \d+ \(\+5\)/);
  assert.match(run.comment, /outside the golden budget/, 'the comment must carry it too');
});

test('the wrapper prefers the live body file and falls back to the payload', () => {
  // The seam the whole live-body fix rests on, and it is environment plumbing — the pure functions
  // cannot see it. Getting it backwards would read the frozen payload while the step names a file,
  // which is the bug this round of review found, still present and now invisible.
  const dir = mkdtempSync(join(tmpdir(), 'visual-budget-body-'));
  const bodyFile = join(dir, 'pr-body.md');
  const baseFile = join(dir, 'base.json');
  const total = budgetTotal(BUDGET);

  writeFileSync(baseFile, JSON.stringify(baseSmallerBy(10)));

  // The payload says nothing; the live file carries the marker. Reading the payload would block.
  writeFileSync(bodyFile, `[visual budget: ${total} — the live description]`);

  const live = runBudgetCli({
    report: reportWith(atBudget()),
    comment: '## Visual tests\n',
    env: { VISUAL_PR_BODY: 'no marker here', VISUAL_PR_BODY_FILE: bodyFile, VISUAL_BUDGET_BASE_FILE: baseFile },
  });

  assert.equal(live.status, 0, `the live body must win over the payload:\n${live.stdout}`);

  // No live file: the payload is the fallback, so a marker there still works.
  const fallback = runBudgetCli({
    report: reportWith(atBudget()),
    comment: '## Visual tests\n',
    env: {
      VISUAL_PR_BODY: `[visual budget: ${total} — the payload]`,
      VISUAL_PR_BODY_FILE: join(dir, 'absent.md'),
      VISUAL_BUDGET_BASE_FILE: baseFile,
    },
  });

  assert.equal(fallback.status, 0, `the payload must be the fallback:\n${fallback.stdout}`);
  assert.match(fallback.stdout, /falling back to the event payload/);
});

test('the wrapper says so when it could not read the base budget', () => {
  // An unreadable base file means the growth question did not get asked. Passing silently there would
  // be the quietest possible way for this gate to stop working.
  const run = runBudgetCli({
    report: reportWith(atBudget()),
    comment: '## Visual tests\n',
    env: { VISUAL_BUDGET_BASE_FILE: '/nonexistent/base-visual-budget.json' },
  });

  assert.equal(run.status, 0, 'an infrastructure failure must not block');
  assert.match(run.stdout, /the growth check will report that it did not run/);
  assert.match(run.comment, /the growth check did not run/);
});

test('the comment carries the violations, not just the summary line', () => {
  // The PR comment is the only place most readers meet this gate; the step log is one click further.
  const over = reportWith({ ...atBudget(), 'js/chromium/': BUDGET.prefixes['js/chromium/'] + 3 });
  const verdict = evaluateBudget({ report: over, budget: BUDGET, baseBudget: BUDGET });

  assert.equal(verdict.pass, false);
  verdict.violations.forEach((violation) => {
    assert.ok(verdict.comment.includes(violation),
      `the comment omits a violation the log prints: ${violation}`);
  });
});
