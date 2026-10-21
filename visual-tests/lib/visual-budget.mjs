import { stripHtmlComments } from '../../.github/scripts/lib/strip-html-comments.mjs';

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
 * The prefixes where the golden records this build compared against disagree with a budget file.
 *
 * The goldens are reg-suit's `expectedItems`: what `compare.mjs` fetched from `base/<branch>` and pruned to
 * the tier's prefixes before comparing (`compare-fork.mjs` downloads the same subset). Per prefix they equal
 * the budget of whichever base commit the seed last rendered, because the seed renders exactly what the
 * specs declare and `lib/__tests__/visual-declarations.test.mjs` holds the budget file equal to that. Only
 * the prefixes this build compared are looked at, so a change to one it did not render cannot make it
 * stale.
 *
 * @param {object} report The raw reg-suit `out.json`.
 * @param {object} budget A parsed `visual-budget.json`.
 * @returns {string[]} The disagreeing prefixes, sorted; empty when they agree, or when nothing was compared
 * (a bootstrap has no goldens).
 */
export function goldensDisagree(report, budget) {
  const goldens = countByPrefix(report?.expectedItems ?? []);

  return [...goldens.keys()].filter(prefix => goldens.get(prefix) !== budget.prefixes[prefix]).sort();
}

/**
 * Judges one build against the budget file.
 *
 * Four questions, in the order a reader would ask them:
 *
 * 1. did this build render a prefix nobody budgeted? A new variant is the largest possible growth and
 *    the easiest to add by accident — a tier gains a theme and 240 records arrive with it;
 * 2. is any prefix over its number? Per prefix, never on the total, because a `pr`-tier build renders
 *    two of the eleven and its 480 records would clear a 1676 ceiling without meaning anything;
 * 3. does any spec take more captures than the cap allows, without a ticketed exception?
 * 4. and did this pull request RAISE the file? If so the description has to say so, with the number.
 *
 * Question 4 keys on the budget FILE's own diff against the base, not on reg-suit's
 * `newItems`/`deletedItems`. Three things go wrong when it keys on the counts instead, and all three
 * were found by review rather than by reasoning:
 *
 * - a rename nets to zero — the same count deleted and added — while the set is free to grow around it;
 * - a bootstrap build has no baseline, so every rendered record is reported as new; the check then has
 *   to be switched off there, and the first pull request into a new base branch can add any number of
 *   records while raising the ceiling to match, in the same commit, with nothing red. On `lts/*`, where
 *   nothing re-seeds, that render becomes the permanent baseline;
 * - and a build that adds records WITHOUT raising the file is already caught by question 2, so keying
 *   on the counts was asking the same question twice and missing the one that mattered.
 *
 * "The base" is the commit this run's merge ref was built on (`builtOnBudget`), not the base branch as it
 * stands when the Compare job gets there (`baseBudget`). The render and the checked-out budget file both
 * come from the merge ref, which GitHub builds when the run is triggered. The golden records and the
 * base-branch tip are read twenty minutes later, after whatever merged in between. On 2026-09-28 a trim
 * (#13647, 1676 goldens to 1225) merged two minutes into #13642's run. That run rendered the old specs
 * against the new goldens (496 new, 45 deleted), and the growth check, judging the pull request's file
 * against the base tip, told it that it "raises the golden budget from 1225 to 1676" and asked for a
 * marker. The pull request had never touched the file, and adding the marker would have re-allowed the
 * 451 records the trim removed. So there is a fifth question:
 *
 * 5. are the golden records this build compared against the set the base it was built on describes?
 *    When they are not, the comparison is stale whatever this pull request did, and the differences it
 *    reports include the base's own. It fails, because a stale comparison must never reach the approval,
 *    and it says which way it is stale instead of asking for a marker. Goldens that match the base TIP
 *    mean the base changed its golden set after the merge ref was built: merge the base branch and push
 *    (a re-run replays the same merge ref). Goldens that match neither the built-on base nor a moved tip
 *    mean the seed has not caught up with a change this run was built on: re-run once it has.
 *
 * It compares the goldens (`goldensDisagree()`), not two budget files. A budget-file comparison was the
 * first version, and review found it wrong three ways. The tip's file changes the moment a merge lands,
 * and the seed rewrites the goldens about fifteen minutes later, so a Compare in between was flagged
 * although it compared against the very goldens its specs describe. A change to a prefix this tier does
 * not render was flagged although the comparison never saw it. And a trim that merged just before the
 * run, before its seed, was missed: the built-on base and the tip agree, while the goldens are the old
 * set. Measured on 2026-09-29: `base/develop` held 1114 goldens matching develop's budget on all eleven
 * prefixes, and #13658's report compared 1225, matching the budget of the base it was built on.
 *
 * A base branch whose goldens changed without their counts changing (a restyle, reconciled by the seed)
 * is stale in the same way, and this cannot see it: counts are all the budget records. That is the
 * README's "A visual change merged into the branch you target" case.
 *
 * Shrinking is never a violation: a trim, and a spec that stops declaring a variant, both legitimately
 * render fewer records than the file allows — the shape `visual-tests/AGENTS.md` → Tiers describes,
 * where a trim shows `deleted > 0` and a count under the budget together. The note asks for the file to
 * come down in the same change. It cannot be left undone: `lib/__tests__/visual-declarations.test.mjs`
 * derives the eleven counts from the checked-in specs and asserts them EQUAL to this file, so a trim
 * that does not lower it fails the tooling suite. Under-budget is a note here because the render is not
 * where that is enforced, not because nothing enforces it.
 *
 * @param {object} options Everything the judgement needs.
 * @param {object} options.report The raw reg-suit `out.json` for this build.
 * @param {object} options.budget The parsed `visual-budget.json`.
 * @param {string} [options.body] The pull-request description, for the growth marker.
 * @param {boolean} [options.isPullRequest] Whether a marker can be asked for at all.
 * @param {object|null} [options.baseBudget] The budget file as the BASE branch has it now, or null when it
 * could not be read — in which case the growth question is reported as unanswered rather than passed.
 * @param {object|null} [options.builtOnBudget] The budget file at the base commit this run's merge ref was
 * built on. Omitted, the growth question falls back to `baseBudget`, as before this parameter existed;
 * null, it could not be read, which is reported, and the fallback is the same.
 * @returns {{pass: boolean, stale: boolean, violations: string[], notes: string[], comment: string,
 * summary: string}} The verdict, whether the comparison was stale, the reasons, and the section to prepend
 * to the gate's comment.
 */
export function evaluateBudget({
  report, budget, body = '', isPullRequest = true, baseBudget = null, builtOnBudget,
}) {
  const items = renderedItems(report);
  const rendered = countByPrefix(items);
  const violations = [];
  const notes = [];
  const advisories = [];

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

  const marker = readMarker(body);
  const total = budgetTotal(budget);

  // What this pull request changed is its file against the base its merge ref was built on. Against the
  // base tip, a base that moved during the run reads as this pull request's own change (question 5).
  const ownBase = builtOnBudget ?? baseBudget;
  let stale = false;

  if (isPullRequest && ownBase === null) {
    // An advisory, deliberately NOT a note: `notes` means "a prefix rendered under its number", and the
    // trim message below keys on that. Pushing this there made an unreadable base file look like a trim
    // — the comment grew an "Under budget" section on a build that was at or over every prefix.
    advisories.push('The budget file on the base branch could not be read, so this build cannot tell '
      + 'whether the pull request raised it. The ceiling above still applies; the growth check did not '
      + 'run.');
  } else if (isPullRequest) {
    const baseTotal = budgetTotal(ownBase);

    if (builtOnBudget === null) {
      advisories.push('The budget file at the base commit this run was built on could not be read, so this '
        + 'build cannot tell whether the golden records it compared against are the set its specs describe, '
        + 'nor whether a raise is this pull request\'s own. The growth check compared against the base branch '
        + 'as it is now.');
    } else if (baseBudget === null) {
      advisories.push('The budget file on the base branch could not be read. The growth and staleness checks '
        + 'used the base commit this run was built on, so both still ran; only the advice for a stale '
        + 'comparison cannot say whether the base moved or its seed is behind.');
    }

    const offBuiltOn = builtOnBudget ? goldensDisagree(report, builtOnBudget) : [];

    if (offBuiltOn.length > 0) {
      const goldens = countByPrefix(report.expectedItems);
      const detail = offBuiltOn.slice(0, 3)
        .map(prefix => `\`${prefix}\` ${goldens.get(prefix)} compared, ${builtOnBudget.prefixes[prefix] ?? 0} budgeted`)
        .join('; ') + (offBuiltOn.length > 3 ? `; and ${offBuiltOn.length - 3} more` : '');
      const matchesTip = baseBudget !== null && goldensDisagree(report, baseBudget).length === 0;
      const tipMoved = baseBudget !== null
        && offBuiltOn.some(prefix => baseBudget.prefixes[prefix] !== builtOnBudget.prefixes[prefix]);
      const opening = 'The golden records this build compared against are not the set the base it was built on '
        + `describes (${detail}).`;
      let remedy;

      if (matchesTip) {
        remedy = 'They match the base branch as it is now: the base changed its golden set after this run\'s merge ref '
          + 'was built. Merge the base branch into this branch and push. Re-running the job replays the same merge '
          + 'ref and fails the same way.';
      } else if (baseBudget !== null && !tipMoved) {
        remedy = 'The base branch still describes the set this run was built on, so its seed has not written that set '
          + 'yet, as happens for about fifteen minutes after a change to the golden set merges. Re-run this job '
          + 'once the base\'s latest `Visual seed` has finished; nothing in this pull request needs to change.';
      } else {
        remedy = 'Wait for the base\'s latest `Visual seed` to finish, then merge the base branch into this branch '
          + 'and push.';
      }

      stale = true;
      violations.unshift(`${opening} The differences below include the base's own, not only this pull request's. `
        + `${remedy} No \`[visual budget: …]\` marker is needed for this.`);
    }

    if (total > baseTotal) {
      if (!marker && builtOnBudget === null) {
        // Run 36392712913's trap, one layer down: without the built-on base, a base that lowered its budget
        // during the run and a pull request that raised it look the same from here.
        violations.push(`This pull request's visual-budget.json sums to ${total} and the base branch's to `
          + `${baseTotal}. The base commit this run was built on could not be read, so either this pull request `
          + 'raises the budget or the base branch lowered it during the run. If this pull request changes '
          + `visual-budget.json, say so with \`${MARKER_TEMPLATE}\`, where N is ${total}. If it does not, merge the `
          + 'base branch and push instead: a marker would re-allow every record the base removed.');
      } else if (!marker) {
        violations.push(`This pull request raises the golden budget from ${baseTotal} to ${total}. `
          + `Say so in the description with \`${MARKER_TEMPLATE}\`, where N is ${total}. Every record is `
          + 'rendered, stored and compared on every build from now on, so the number is worth typing by '
          + 'hand.');
      } else if (marker.total !== total) {
        violations.push(`The description declares a total of ${marker.total} and visual-budget.json sums `
          + `to ${total}. Whichever is right, the other is the one to change — the marker exists so the `
          + 'number is stated twice by someone who meant it.');
      }
    }
  }

  if ((report?.deletedItems?.length ?? 0) > 0 && notes.length > 0) {
    notes.push('This build deletes records and comes in under its own numbers, which is what a '
      + 'trimming change looks like. Lower the prefixes in visual-budget.json in this pull request — '
      + 'the declaration sweep in lib/__tests__/visual-declarations.test.mjs asserts the file EQUALS '
      + 'what the specs derive, so leaving it high fails the tooling suite rather than passing quietly.');
  }

  const pass = violations.length === 0;
  const summary = pass
    ? `Visual budget: ${items.length} record(s) rendered, within budget.`
    : `Visual budget: ${violations.length} violation(s).`;

  return {
    pass,
    violations,
    notes,
    advisories,
    summary,
    stale,
    comment: renderComment({ pass, violations, notes, advisories, items, total, stale }),
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
 * @param {string[]} verdict.advisories Checks that could not run, which is not the same as passing.
 * @param {string[]} verdict.items Everything rendered.
 * @param {number} verdict.total The full-tier total the file describes.
 * @param {boolean} verdict.stale Whether the goldens compared are not the set the built-on base describes.
 * @returns {string} Markdown, ending in a blank line — the gate's own heading follows it directly, and
 * a heading without a blank line before it is not a heading.
 */
function renderComment({ pass, violations, notes, advisories, items, total, stale = false }) {
  const lines = ['## Visual budget', ''];

  if (pass) {
    lines.push(`${items.length} record(s) rendered. The full-tier budget is ${total}.`, '');
  } else {
    // A build whose only problem is a stale comparison is not over anything: "outside the golden budget"
    // would send the reader to the numbers. With problems of its own as well, the usual heading stands,
    // and the stale item is listed first.
    lines.push(stale && violations.length === 1
      ? `This build cannot be judged against the golden budget (full-tier budget: ${total}): the golden `
        + 'records it compared against belong to another commit of the base branch.'
      : `This build is outside the golden budget (full-tier budget: ${total}).`, '');
    violations.forEach(violation => lines.push(`- ${violation}`));

    // The gate's own comment sits directly below this one and tells a reviewer to approve the pending
    // deployment. With the budget red the compare job fails, so `approve` is skipped and there is
    // nothing to approve — saying so here is cheaper than a reviewer looking for a button that is not
    // on the page.
    lines.push('',
      'The visual differences below cannot be approved until this holds: a budget violation fails the '
      + 'Compare job, and the approval job does not run on a failed compare.', '');
  }

  if (notes.length > 0) {
    lines.push('<details><summary>Under budget</summary>', '');
    notes.forEach(note => lines.push(`- ${note}`));
    lines.push('', '</details>', '');
  }

  advisories.forEach(advisory => lines.push(`> ${advisory}`, ''));

  return `${lines.join('\n')}\n`;
}
