import { stripHtmlComments } from './strip-html-comments.mjs';

/**
 * The marker that lets a pull request grow the golden set.
 *
 * Deliberately forgiving about the separator and strict about the number. An author writing this by
 * hand types whichever dash their editor produces — `-`, `–` or `—` — or reaches for a colon, and a
 * gate that refuses the wrong dash teaches people that the gate is broken rather than that the number
 * matters. The number is the part that has to be exact, because it is checked against the file.
 *
 * `\[visual budget: 1700 — the pagination demo grows a leg\]` and
 * `[visual budget: 1700 - ...]` are the same marker.
 */
const MARKER = /\[visual budget:\s*(\d+)\s*[-–—:]\s*([^\]]+)\]/i;

/**
 * How the gate prints the marker back when it is missing. One spelling in the message, whatever the
 * author later types.
 */
export const MARKER_TEMPLATE = '[visual budget: N — why the set has to grow]';

/**
 * Every item this build actually rendered.
 *
 * The RAW comparison result, so a quarantined item still counts: the flake ledger (G5) subtracts
 * quarantined items from the FAILING count so they stop blocking, which must never also subtract them
 * from the SIZE. A quarantined record is a record — it is fetched, rendered, compared and stored like
 * any other, and a budget that stopped counting it would let the set grow by quarantining.
 *
 * That is a CONTRACT on G5, not a property this file can enforce: the quarantine must subtract in the
 * verdict it computes and leave `out.json` alone. Rewriting the file on disk would silently hand this
 * function a filtered set, since the budget step runs after the gate.
 *
 * `deletedItems` are in the baseline and not in this render, so they are not rendered by definition.
 *
 * @param {object} report A reg-suit `out.json`.
 * @returns {string[]} Every rendered item path.
 */
export function renderedItems(report) {
  return [
    ...(report?.passedItems ?? []),
    ...(report?.newItems ?? []),
    ...(report?.failedItems ?? []),
  ];
}

/**
 * Count rendered items per variant prefix (`js/chromium-theme-main/`, `cross-browser/webkit/`, …).
 *
 * @param {string[]} items Rendered item paths.
 * @returns {Map<string, number>} Prefix to count, for the prefixes this build rendered.
 */
export function countByPrefix(items) {
  const counts = new Map();

  items.forEach((item) => {
    const prefix = `${item.split('/').slice(0, 2).join('/')}/`;

    counts.set(prefix, (counts.get(prefix) ?? 0) + 1);
  });

  return counts;
}

/**
 * Count captures per spec, ignoring which variant rendered them.
 *
 * A spec's captures are the same wherever it renders, so the cap is about the spec and the highest
 * per-variant count is what it costs. Summing across variants instead would make the cap a function
 * of the tier, and a `pr`-tier build would appear to comply while a nightly did not.
 *
 * @param {string[]} items Rendered item paths.
 * @returns {Map<string, number>} Reg-suit stem (the path without its variant prefix and `-N.png`) to
 * the largest number of captures any single variant took of it.
 */
export function countByStem(items) {
  const perVariant = new Map();

  items.forEach((item) => {
    const segments = item.split('/');
    const prefix = segments.slice(0, 2).join('/');
    const stem = segments.slice(2).join('/').replace(/-\d+\.png$/, '');

    const key = `${prefix}::${stem}`;

    perVariant.set(key, (perVariant.get(key) ?? 0) + 1);
  });

  const stems = new Map();

  perVariant.forEach((count, key) => {
    const stem = key.slice(key.indexOf('::') + 2);

    stems.set(stem, Math.max(stems.get(stem) ?? 0, count));
  });

  return stems;
}

/**
 * Read the growth marker out of a pull-request description.
 *
 * @param {string} body The description, as the API returns it.
 * @returns {{total: number, reason: string} | null} The declared total and reason, or null.
 */
export function readMarker(body) {
  const match = MARKER.exec(stripHtmlComments(body ?? ''));

  if (!match) {
    return null;
  }

  return { total: Number(match[1]), reason: match[2].trim() };
}

/**
 * The full-tier total the budget file describes.
 *
 * @param {object} budget The parsed `visual-budget.json`.
 * @returns {number} The sum of every prefix.
 */
export function budgetTotal(budget) {
  return Object.values(budget.prefixes).reduce((sum, count) => sum + count, 0);
}

/**
 * Judges one build against the budget file.
 *
 * Four questions, in the order a reader would ask them:
 *
 * 1. did this build render a prefix nobody budgeted? A new variant is the largest possible growth and
 *    the easiest to add by accident — a tier gains a theme and 240 records arrive with it;
 * 2. is any prefix over its number? Per prefix, never on the total, because a `pr`-tier build renders
 *    two of the eleven and its 468 records would clear a 1676 ceiling without meaning anything;
 * 3. does any spec take more captures than the cap allows, without a ticketed exception?
 * 4. and if the set grew, did the author say so in the description and update the file to match?
 *
 * Shrinking is never a violation, and the reason is sharper than "a trim is allowed to". A render that
 * FAILED produces no screenshot, so reg-suit reports that item as deleted and the build comes in under
 * its number — a flake would fail the budget as well as the comparison, on a gate that has nothing to
 * do with it. Under-budget is therefore a note: a trimming pull request is expected to look like that
 * (`deleted > 0` and `rendered < budget` together), and so is an unlucky one. The note asks for the
 * file to be lowered in the same change, which is the part a human has to do.
 *
 * The cost of that choice, stated rather than hidden: a trim that does not lower the file leaves
 * headroom, and later growth into it is free. The ceiling is a ceiling, not a high-water mark.
 *
 * @param {object} options Everything the judgement needs.
 * @param {object} options.report The raw reg-suit `out.json` for this build.
 * @param {object} options.budget The parsed `visual-budget.json`.
 * @param {string} [options.body] The pull-request description, for the growth marker.
 * @param {boolean} [options.isPullRequest] Whether a marker can be asked for at all.
 * @param {boolean} [options.bootstrap] Whether this build is seeding a branch that had no baseline.
 * @returns {{pass: boolean, violations: string[], notes: string[], comment: string, summary: string}}
 * The verdict, the reasons, and the section to prepend to the gate's comment.
 */
export function evaluateBudget({ report, budget, body = '', isPullRequest = true, bootstrap = false }) {
  const items = renderedItems(report);
  const rendered = countByPrefix(items);
  const violations = [];
  const notes = [];

  const unbudgeted = [...rendered.keys()].filter(prefix => !(prefix in budget.prefixes)).sort();

  unbudgeted.forEach((prefix) => {
    violations.push(`\`${prefix}\` rendered ${rendered.get(prefix)} record(s) and is not in `
      + 'visual-budget.json. A variant nobody budgeted is the largest kind of growth: add the prefix '
      + 'with its count, and declare the new total in the description.');
  });

  [...rendered.entries()].sort().forEach(([prefix, count]) => {
    const allowed = budget.prefixes[prefix];

    if (allowed === undefined) {
      return;
    }

    if (count > allowed) {
      violations.push(`\`${prefix}\` rendered ${count} record(s), budget ${allowed} (+${count - allowed}).`);
    } else if (count < allowed) {
      notes.push(`\`${prefix}\` rendered ${count}, budget ${allowed} (−${allowed - count}).`);
    }
  });

  const cap = budget.captureCap;

  [...countByStem(items).entries()].sort().forEach(([stem, captures]) => {
    if (captures <= cap) {
      return;
    }

    const exception = budget.capExceptions?.[stem];

    if (!exception) {
      violations.push(`\`${stem}\` takes ${captures} captures, cap ${cap}. One capture per distinct `
        + 'visual state — a second angle on the same state is not a second state. If it genuinely '
        + 'needs more, add it to `capExceptions` with the ticket that will bring it down.');

      return;
    }

    if (!exception.ticket) {
      violations.push(`\`${stem}\` is in \`capExceptions\` with no \`ticket\`. An exception without one `
        + 'is the policy, not an exception to it.');

      return;
    }

    if (captures > exception.captures) {
      violations.push(`\`${stem}\` takes ${captures} captures; its exception allows `
        + `${exception.captures} (${exception.ticket}). An exception is a ceiling on what is already `
        + 'there, not a licence to keep adding.');
    }
  });

  const grew = (report?.newItems?.length ?? 0) > (report?.deletedItems?.length ?? 0);
  const marker = readMarker(body);
  const total = budgetTotal(budget);

  // On a bootstrap there is no baseline, so reg-suit calls EVERY rendered record new and this would
  // demand a marker for the whole set — 480 records on the first pull request into a branch that has
  // none. Nothing grew; there was simply nothing to compare against. The ceiling still applies, which is
  // the check that matters there.
  if (grew && isPullRequest && !bootstrap) {
    const net = (report.newItems.length) - (report.deletedItems?.length ?? 0);

    if (!marker) {
      violations.push(`This build adds ${net} record(s) net. Growing the golden set needs `
        + `\`${MARKER_TEMPLATE}\` in the pull-request description, with N the new full-tier total, and `
        + 'visual-budget.json updated to match. Every record is rendered, stored and compared on every '
        + 'build from now on, so the number is worth typing by hand.');
    } else if (marker.total !== total) {
      violations.push(`The description declares a total of ${marker.total} and visual-budget.json sums `
        + `to ${total}. Whichever is right, the other is the one to change — the marker exists so the `
        + 'number is stated twice by someone who meant it.');
    }
  }

  if (!grew && (report?.deletedItems?.length ?? 0) > 0 && notes.length > 0) {
    notes.push('This build deletes records and comes in under its own numbers, which is what a '
      + 'trimming change looks like. Lower the prefixes in visual-budget.json in this pull request, or '
      + 'the ceiling stays where the set used to be.');
  }

  const pass = violations.length === 0;
  const summary = pass
    ? `Visual budget: ${items.length} record(s) rendered, within budget.`
    : `Visual budget: ${violations.length} violation(s).`;

  return {
    pass, violations, notes, summary, comment: renderComment({ pass, violations, notes, items, total }),
  };
}

/**
 * Renders the section the gate's comment carries.
 *
 * Prepended to `.reg/comment.md` rather than folded into it, so the visual gate's own wording — and
 * the regexes `visual-gate.test.mjs` pins on it — stay exactly as they were.
 *
 * @param {object} verdict The evaluated verdict.
 * @param {boolean} verdict.pass Whether the budget holds.
 * @param {string[]} verdict.violations Why it does not.
 * @param {string[]} verdict.notes Where the build is under its numbers.
 * @param {string[]} verdict.items Everything rendered.
 * @param {number} verdict.total The full-tier total the file describes.
 * @returns {string} Markdown, ending in a blank line — the gate's own heading follows it directly, and
 * a heading without a blank line before it is not a heading.
 */
function renderComment({ pass, violations, notes, items, total }) {
  const lines = ['## Visual budget', ''];

  if (pass) {
    lines.push(`${items.length} record(s) rendered. The full-tier budget is ${total}.`, '');
  } else {
    lines.push(`This build is outside the golden budget (full-tier budget: ${total}).`, '');
    violations.forEach(violation => lines.push(`- ${violation}`));
    lines.push('');
  }

  if (notes.length > 0) {
    lines.push('<details><summary>Under budget</summary>', '');
    notes.forEach(note => lines.push(`- ${note}`));
    lines.push('', '</details>', '');
  }

  return `${lines.join('\n')}\n`;
}
