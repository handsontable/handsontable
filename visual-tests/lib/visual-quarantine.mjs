/**
 * The visual quarantine: known-flaky captures, reported but not blocking, for a fixed time.
 *
 * Pure: `scripts/visual-gate.mjs`, `scripts/seed-report.mjs`, and `scripts/compare-record.mjs` read
 * `visual-tests/visual-quarantine.json`; the tooling suite validates it against the real clock.
 *
 * A flaky capture used to leave two choices, both bad. Approving it on every pull request it touched
 * taught reviewers to click through a `changed` verdict without reading it, and on the nightly there was
 * nothing to approve at all – one flaky golden turned every weekday night red until someone fixed the
 * render. The functional tier solved the same problem for Playwright tests (`tests/lib/quarantine-policy.mjs`,
 * `tests/AGENTS.md` → Quarantine), and this is that policy applied to captures, with the same limits:
 *
 * - **A quarantined capture still renders, still compares, and is still listed** – in the pull request
 *   comment, the nightly summary, and the flake ledger. Only its verdict changes, from "blocks" to "reported".
 * - **Only a changed item is covered.** A quarantined capture that reg-suit calls new or deleted still
 *   counts: that is a renamed spec, a changed capture count, or a half-written baseline, which is structure,
 *   not a flake. The functional tier draws the same line between a flake and a failure.
 * - **Every entry names the owning task and expires within 30 days**, checked by the functional tier's own
 *   `validateQuarantine()`, imported rather than copied – a copy is a second definition to keep in step,
 *   and the `stripHtmlComments` copy the golden budget first shipped was replaced by one shared module for
 *   exactly that reason.
 * - **At most six entries and twelve live items.** An entry must name the legs it covers (`legs`, required),
 *   and each leg is one item. One capture parked on all eight of its renders takes eight of the twelve, so
 *   the cap allows one such entry, not two.
 * - **An expired entry fails the tooling suite on every pull request** until it is removed or renewed. That
 *   is stricter than the functional tier, where an expired tag on a passing test only warns, and it blocks
 *   unrelated pull requests the day after an entry lapses – deliberately, because a visual quarantine left to
 *   lapse quietly is a golden nobody is fixing. The failure message carries the one-line remedy.
 */

import { VISUAL_TIERS } from '../src/config.mjs';
import {
  QUARANTINE_CAP,
  QUARANTINE_MAX_DAYS,
  describeQuarantine,
  isExpired,
  validateQuarantine,
} from '../../tests/lib/quarantine-policy.mjs';
import { tierPrefixes } from './visual-tiers.mjs';
import { itemToSpec } from './visual-compare-record.mjs';

export { QUARANTINE_CAP, QUARANTINE_MAX_DAYS };

/**
 * How many items (one per leg of every live entry) may be quarantined at once.
 */
export const VISUAL_QUARANTINE_ITEM_CAP = 12;

/**
 * Every variant the suite renders, as the leg an item path starts with: the full tier's prefixes without
 * their trailing slash. Eleven on 2026-09-23, the same eleven the golden budget counts.
 */
export const LEGS = tierPrefixes(VISUAL_TIERS.full).map(prefix => prefix.replace(/\/$/, ''));

const REMEDY = 'Remove the entry from visual-tests/visual-quarantine.json, or renew it with a new expiry under its '
  + 'task once the capture is being fixed.';
const INVALID_REMEDY = 'Fix the entry in visual-tests/visual-quarantine.json; `Checks / tooling tests` names what '
  + 'is wrong with it.';

/**
 * The items an entry covers: one per leg. A malformed entry (not an object, no `capture`, `legs` not an
 * array) covers none, so its items keep blocking and the tooling suite reports it.
 *
 * @param {unknown} entry The entry.
 * @returns {string[]} The item paths, as reg-suit lists them.
 */
export function expandItems(entry) {
  if (!entry || typeof entry !== 'object' || typeof entry.capture !== 'string' || !Array.isArray(entry.legs)) {
    return [];
  }

  return entry.legs.map(leg => `${leg}/${entry.capture}.png`);
}

/**
 * Why an entry does not hold today, or `null` when it does. `expired` separates an entry past its date,
 * which is the normal end of a quarantine, from one that never held: a bad task id or date, a date beyond
 * the horizon, or a malformed entry. The horizon is re-checked here and not only when the file is
 * validated, for the reason `evaluateRun()` re-checks it: an entry pushed with a far-future date would
 * otherwise hold forever.
 *
 * @param {unknown} entry The entry.
 * @param {Date} now The current time.
 * @returns {{expired: boolean, reason: string} | null} Why it does not hold.
 */
export function lapseOf(entry, now) {
  if (expandItems(entry).length === 0) {
    return { expired: false, reason: 'not a valid entry: it needs a `capture` and a non-empty `legs` array' };
  }

  const policy = validateQuarantine(entry.taskId, entry.expires, now);

  if (policy !== null) {
    return { expired: false, reason: policy };
  }

  return isExpired(entry.expires, now) ? { expired: true, reason: `expired on ${entry.expires}` } : null;
}

/**
 * Whether an entry holds today: well formed, within the horizon, and not expired (see `lapseOf()`).
 *
 * @param {unknown} entry The entry.
 * @param {Date} now The current time.
 * @returns {boolean} Whether the entry is live.
 */
export function isLive(entry, now) {
  return lapseOf(entry, now) === null;
}

/**
 * The entry text the ledger and the comments show: `DEV-1234 until 2026-10-08 — why`.
 *
 * @param {{taskId: string, expires: string, why?: string}} entry The entry.
 * @returns {string} The text.
 */
export function describeEntry(entry) {
  return describeQuarantine(entry.taskId, entry.expires, entry.why);
}

/**
 * Everything wrong with a quarantine file. An empty list means it may be used as it is.
 *
 * @param {unknown} file The parsed `visual-quarantine.json`.
 * @param {Date} now The current time.
 * @param {object} [options] Options.
 * @param {string[]} [options.crossBrowserSpecs] The cross-browser spec basenames, to resolve a capture.
 * @param {(spec: string) => boolean} [options.specExists] Whether a repository-relative spec path exists. When
 * omitted, captures are not resolved against the tree.
 * @returns {string[]} The problems, each a sentence naming the entry.
 */
export function validateQuarantineFile(file, now, { crossBrowserSpecs = [], specExists } = {}) {
  if (!file || typeof file !== 'object' || !Array.isArray(file.entries)) {
    return ['visual-quarantine.json must be an object with an `entries` array'];
  }

  const problems = [];
  const seenItems = new Map();
  let liveItems = 0;

  file.entries.forEach((entry, index) => {
    const where = `entry ${index + 1}${entry?.capture ? ` (${entry.capture})` : ''}`;

    if (!entry || typeof entry !== 'object') {
      problems.push(`${where}: an entry is an object`);

      return;
    }

    const policy = validateQuarantine(entry.taskId, entry.expires, now);

    if (policy) {
      problems.push(`${where}: ${policy}`);
    } else if (isExpired(entry.expires, now)) {
      problems.push(`${where}: expired on ${entry.expires} (${entry.taskId}). ${REMEDY}`);
    }

    if (typeof entry.why !== 'string' || entry.why.trim() === '') {
      problems.push(`${where}: \`why\` says in one line what flakes, for the comment and the ledger`);
    }

    if (typeof entry.capture !== 'string' || entry.capture === '' || /\.png$/.test(entry.capture)) {
      problems.push(`${where}: \`capture\` is the item path without its variant prefix and without \`.png\``);

      return;
    }

    if (!Array.isArray(entry.legs) || entry.legs.length === 0) {
      problems.push(`${where}: \`legs\` names the variants that flake (one or more of: ${LEGS.join(', ')})`);

      return;
    }

    entry.legs.forEach((leg) => {
      if (!LEGS.includes(leg)) {
        problems.push(`${where}: \`${leg}\` is not a variant this suite renders (${LEGS.join(', ')})`);

        return;
      }

      const item = `${leg}/${entry.capture}.png`;
      const origin = itemToSpec(item, crossBrowserSpecs);

      if (!origin) {
        problems.push(`${where}: \`${item}\` is not a path this suite writes`);
      } else if (specExists && !specExists(origin.spec)) {
        problems.push(`${where}: \`${item}\` would come from ${origin.spec}, which does not exist`);
      }

      if (seenItems.has(item)) {
        problems.push(`${where}: \`${item}\` is already quarantined by entry ${seenItems.get(item)}`);
      } else {
        seenItems.set(item, index + 1);
      }
    });

    if (policy === null && !isExpired(entry.expires, now)) {
      liveItems += entry.legs.length;
    }
  });

  if (file.entries.length > QUARANTINE_CAP) {
    problems.push(`${file.entries.length} entries are in the quarantine and the cap is ${QUARANTINE_CAP}; fix one `
      + 'before parking another');
  }

  if (liveItems > VISUAL_QUARANTINE_ITEM_CAP) {
    problems.push(`${liveItems} items are quarantined and the cap is ${VISUAL_QUARANTINE_ITEM_CAP}; name only `
      + 'the variants that flake');
  }

  return problems;
}

/**
 * Split a report's changed items into those a live entry covers and the rest.
 *
 * Only `failedItems` is touched, and the returned report is what the verdict is computed from – so a run
 * whose only differences are quarantined reads as clean, while the quarantined items are still returned to
 * be listed. An item under an entry that does not hold stays in `failedItems` and is returned in `expired`
 * as well, with `lapseOf()`'s answer, so the reader is told why it blocks: `expired: true` for an entry past
 * its date, `false` for one that never held.
 *
 * @param {object} report The parsed `out.json`.
 * @param {Array<object>} entries The quarantine entries.
 * @param {Date} now The current time.
 * @returns {{report: object, quarantined: Array<{item: string, entry: object}>,
 *   expired: Array<{item: string, entry: object, expired: boolean, reason: string}>}} The partition.
 */
export function partitionReport(report, entries, now) {
  const live = new Map();
  const lapsed = new Map();

  entries.forEach((entry) => {
    const lapse = lapseOf(entry, now);

    expandItems(entry).forEach((item) => {
      if (lapse === null) {
        live.set(item, entry);
      } else {
        lapsed.set(item, { entry, ...lapse });
      }
    });
  });

  const quarantined = [];
  const expired = [];
  const failedItems = [];

  (report?.failedItems ?? []).forEach((item) => {
    if (live.has(item)) {
      quarantined.push({ item, entry: live.get(item) });

      return;
    }

    failedItems.push(item);

    if (lapsed.has(item)) {
      expired.push({ item, ...lapsed.get(item) });
    }
  });

  return { report: report ? { ...report, failedItems } : report, quarantined, expired };
}

/**
 * The entry text for an item, when a live entry covers it – what the compare record stamps on the item so
 * the ledger shows the quarantine instead of asking for a ticket.
 *
 * @param {Array<object>} entries The quarantine entries.
 * @param {Date} now The current time.
 * @returns {(item: string) => string | null} The lookup.
 */
export function quarantineLookup(entries, now) {
  const live = new Map();

  entries.filter(entry => isLive(entry, now)).forEach((entry) => {
    expandItems(entry).forEach(item => live.set(item, describeEntry(entry)));
  });

  return item => live.get(item) ?? null;
}

/**
 * Markdown lines listing quarantined items and items under an entry that does not hold, for the pull
 * request comment and the nightly summary. Empty when there is nothing to list, so a suite with no
 * quarantine renders exactly as before.
 *
 * @param {Array<{item: string, entry: object}>} quarantined Items a live entry covered.
 * @param {Array<{item: string, entry: object, expired?: boolean, reason?: string}>} expired Items under an
 * entry that does not hold, as `partitionReport()` returns them. `expired: false` lists the item under its
 * own heading with the reason.
 * @returns {string[]} The lines, ending in a blank line when non-empty.
 */
export function quarantineLines(quarantined, expired) {
  const lines = [];

  if (quarantined.length > 0) {
    lines.push('### Quarantined — reported, not blocking', '');
    quarantined.forEach(({ item, entry }) => lines.push(`- \`${item}\` — ${describeEntry(entry)}`));
    lines.push('');
  }

  const lapsedOnes = expired.filter(({ expired: pastDate }) => pastDate !== false);
  const invalid = expired.filter(({ expired: pastDate }) => pastDate === false);

  if (lapsedOnes.length > 0) {
    lines.push('### Expired quarantine — blocking again', '');
    lapsedOnes.forEach(({ item, entry }) => lines.push(`- \`${item}\` — ${describeEntry(entry)}`));
    lines.push('', REMEDY, '');
  }

  if (invalid.length > 0) {
    lines.push('### Quarantine entry not in force — blocking', '');
    invalid.forEach(({ item, reason }) => lines.push(`- \`${item}\` — ${reason}`));
    lines.push('', INVALID_REMEDY, '');
  }

  return lines;
}
