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
// total (a pr-tier build renders two of eleven, and 468 clears a 1676 ceiling without meaning
// anything), the raw item list so quarantining cannot shrink the set, and growth refused unless the
// author states the new number and the file agrees with them.

const root = path.join(import.meta.dirname, '../../..');
const BUDGET = JSON.parse(readFileSync(path.join(root, 'visual-tests/visual-budget.json'), 'utf8'));

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

/**
 * A build that grew, while still rendering exactly its budgeted number.
 *
 * The new items are MOVED out of the passed list rather than added to it, so the only thing under test
 * is the growth marker. Adding them on top would put a prefix over its ceiling too, and the test would
 * pass on the wrong violation.
 *
 * @param {number} newCount How many records are new.
 * @param {number} deletedCount How many the baseline has that this build does not.
 * @returns {object} A reg-suit-shaped `out.json`.
 */
function grewBy(newCount, deletedCount) {
  const report = reportWith(atBudget());

  report.newItems = report.passedItems.splice(0, newCount);
  report.deletedItems = Array.from({ length: deletedCount }, (unused, index) => `js/chromium/gone-${index}.png`);

  return report;
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
  // and still sit far under 1676 — which is the whole reason the file is eleven numbers and not one.
  const prTier = reportWith({
    'js/chromium-theme-main/': BUDGET.prefixes['js/chromium-theme-main/'] + 1,
    'js/chromium-theme-main-dark/': BUDGET.prefixes['js/chromium-theme-main-dark/'],
  });
  const verdict = evaluateBudget({ report: prTier, budget: BUDGET });

  assert.equal(verdict.pass, false, 'one prefix over its own number must fail even far under the total');
  assert.match(verdict.violations.join('\n'), /js\/chromium-theme-main\/. rendered 241/);
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
  assert.match(verdict.comment, /1676 record\(s\) rendered/);
});

test('growth needs the marker, and the marker has to agree with the file', () => {
  const grown = grewBy(2, 1);

  const silent = evaluateBudget({ report: grown, budget: BUDGET, body: 'Adds a demo.' });

  assert.equal(silent.pass, false, 'net growth with no marker must fail');
  assert.match(silent.violations.join('\n'), /adds 1 record\(s\) net/);
  assert.match(silent.violations.join('\n'), /\[visual budget: N — why the set has to grow\]/);

  const wrongNumber = evaluateBudget({
    report: grown, budget: BUDGET, body: '[visual budget: 9999 — a new demo]',
  });

  assert.equal(wrongNumber.pass, false, 'a marker that disagrees with the file must fail');
  assert.match(wrongNumber.violations.join('\n'), /declares a total of 9999 and visual-budget\.json sums to 1676/);

  const agreed = evaluateBudget({
    report: grown, budget: BUDGET, body: `[visual budget: ${budgetTotal(BUDGET)} — a new demo]`,
  });

  assert.equal(agreed.pass, true, agreed.violations.join('\n'));
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
  const grown = grewBy(1, 0);

  assert.equal(evaluateBudget({ report: grown, budget: BUDGET, isPullRequest: false }).pass, true);
  assert.equal(evaluateBudget({ report: grown, budget: BUDGET, isPullRequest: true }).pass, false);
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
      ...process.env, VISUAL_GATE_DIR: dir, GITHUB_EVENT_NAME: 'pull_request', VISUAL_PR_BODY: '', ...env,
    },
  });

  return {
    status: result.status,
    stdout: `${result.stdout}${result.stderr}`,
    comment: existsSync(join(dir, 'comment.md')) ? readFileSync(join(dir, 'comment.md'), 'utf8') : null,
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

test('a bootstrap is not growth, so no marker is demanded — but the ceiling still is', () => {
  // With no baseline, reg-suit calls every rendered record new. Asking for a marker there would demand
  // `[visual budget: 1676 — ...]` on the first pull request into a branch that has no goldens yet, for
  // a set that did not grow. The ceiling is the check that still means something.
  const everythingNew = reportWith({});

  everythingNew.newItems = renderedItems(reportWith(atBudget()));

  const seeding = evaluateBudget({ report: everythingNew, budget: BUDGET, bootstrap: true });

  assert.equal(seeding.pass, true, seeding.violations.join('\n'));

  const sameWithoutBootstrap = evaluateBudget({ report: everythingNew, budget: BUDGET });

  assert.equal(sameWithoutBootstrap.pass, false,
    'outside a bootstrap the same shape IS growth and must ask for the marker');

  // And a bootstrap that is genuinely over a prefix still fails: the ceiling does not depend on there
  // being a baseline to compare against.
  const tooBig = reportWith({});

  tooBig.newItems = renderedItems(reportWith({ ...atBudget(), 'js/chromium/': BUDGET.prefixes['js/chromium/'] + 1 }));

  assert.equal(evaluateBudget({ report: tooBig, budget: BUDGET, bootstrap: true }).pass, false,
    'a bootstrap over a prefix ceiling must still fail');
});
