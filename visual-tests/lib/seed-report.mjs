/**
 * Summarizes a non-pull-request build's comparison for the job summary.
 *
 * `visual-gate.mjs` runs on pull requests only, so a seed (a push to a base branch) compared its
 * render, reconciled the goldens and said nothing about what the merged commit changed, and a
 * nightly full render — which never writes the goldens — would have found a wrapper drifting from
 * js and stayed green. Pure: `scripts/seed-report.mjs` reads `.reg/out.json` and the environment.
 *
 * The seed's summary also carries the attribution a pull request cannot give itself. The `pr` tier
 * renders js × {main, main-dark}, plus a wrapper when `VISUAL_WRAPPERS` names one — so a merge that
 * changed the classic render, a horizon theme, Firefox or WebKit passed its own visual check without
 * showing it, and so did a wrapper copy UNLESS that pull request changed that wrapper's own tree. The
 * split here cannot tell those apart: it is computed from the raw `VISUAL_TIERS.pr` row, which lists no
 * wrapper, while `resolveTier` appends whatever `VISUAL_WRAPPERS` carried. So a wrapper item in
 * `outsidePrItems` MAY be one the merged pull request rendered and its author already reviewed, and
 * nothing downstream may tell them it could not have been shown. The seed is the first build that
 * renders the rest of those variants, and it reconciles them straight into the baseline. The
 * out-of-tier differences are therefore turned into a comment on the merged pull request, so the author
 * sees them minutes after the merge rather than in a run summary nobody opens — and so the nightly,
 * which compares against that same seed, is not expected to catch them (it cannot: they are the baseline
 * by then). What the nightly does catch is what the seed does not render for real: a wrapper drifting
 * from js, a flaky or poisoned golden, or a commit whose seed never landed.
 */

import { VISUAL_TIERS } from '../src/config.mjs';
import { isInTier, tierPrefixes } from './visual-tiers.mjs';

/**
 * How many differing items the summary lists before it says how many more there are.
 */
const MAX_LISTED_ITEMS = 60;
const PULL_REQUEST_URL = 'https://github.com/handsontable/handsontable/pull/';
const CDN_NOTE = 'the images behind it are cached for four hours; add `?cb=<anything>` to an image URL for the'
  + ' fresh one';

/**
 * @typedef {object} BuildSummary
 * @property {'clean' | 'changed' | 'error'} verdict What the comparison found.
 * @property {boolean} blocking Whether the step fails: on `error` always, and on any difference in the `full`
 * tier — its render is never written to the goldens, so a difference there is a regression, a flake or a
 * poisoned golden, never the build's own change. The seed never blocks on a difference: its differences are
 * what the merged commit changed, and the seed must land.
 * @property {string} summary One-line result for the job log.
 * @property {string} markdown Body for `$GITHUB_STEP_SUMMARY`.
 * @property {string[]} changedItems Every differing item; new and deleted ones tagged.
 * @property {string[]} outsidePrItems The differing items outside the `pr` tier's base prefixes — the
 * variants a pull request usually does not render. "Usually", not "never": the `pr` tier also renders a
 * wrapper when `VISUAL_WRAPPERS` names it, and this split is computed from the raw table row, which has
 * no wrapper in it. A wrapper item here may therefore be one the merged pull request did render and its
 * author already reviewed, so nothing downstream may claim these were invisible to that check.
 * @property {string | null} pull The squash-merged pull request number, when the commit message names one.
 * @property {string} comment Markdown for a comment on that pull request: set only for a seed whose
 * out-of-tier differences and pull request number are both known, '' otherwise.
 */

/**
 * The pull request number a squash merge leaves at the end of the commit message's first line.
 *
 * @param {string} message The head commit message; empty on a schedule or a dispatch.
 * @returns {string | null} The number, or `null` when the first line ends in no `(#NNNN)`.
 */
export function pullNumberOf(message) {
  const match = (message ?? '').split('\n')[0].match(/\(#(\d+)\)\s*$/);

  return match ? match[1] : null;
}

/**
 * The items of one bucket of a reg-suit report, or none when the report lacks it.
 *
 * @param {object | null} report The parsed report.
 * @param {string} bucket `failedItems`, `newItems`, `deletedItems` or `passedItems`.
 * @returns {string[]} The bucket's items.
 */
function itemsOf(report, bucket) {
  return Array.isArray(report?.[bucket]) ? report[bucket] : [];
}

/**
 * Summarizes the comparison of a seed or a nightly build.
 *
 * @param {object} options Inputs.
 * @param {object | null} options.report Parsed `.reg/out.json`, or `null` when it could not be read.
 * @param {string} options.tier The tier name; `full` is the nightly, anything else reports as a seed.
 * @param {string} options.branch The branch rendered.
 * @param {string} options.sha The commit rendered.
 * @param {string} [options.headCommitMessage] The head commit message, for the pull request number.
 * @param {string} [options.reportUrl] The published report URL, or '' when nothing was published.
 * @param {string} [options.runUrl] The workflow run URL, when known.
 * @param {string[]} [options.prPrefixes] The golden-path prefixes the `pr` tier renders; defaults to the
 * table's. Injectable for tests.
 * @returns {BuildSummary} The summary.
 */
export function summarizeBuild({
  report, tier, branch, sha, headCommitMessage = '', reportUrl = '', runUrl = '',
  prPrefixes = tierPrefixes(VISUAL_TIERS.pr),
}) {
  const nightly = tier === 'full';
  const kind = nightly ? 'nightly' : 'seed';
  const pull = pullNumberOf(headCommitMessage);
  const shortSha = (sha ?? '').slice(0, 7);
  const where = `${branch} @ ${shortSha}`;
  const heading = `## Visual ${kind} — ${where}${pull ? ` ([#${pull}](${PULL_REQUEST_URL}${pull}))` : ''}`;
  let link = '';

  if (reportUrl) {
    link = `**[Open the report](${reportUrl})**`;
  } else if (runUrl) {
    link = `**[Open the workflow run](${runUrl})**`;
  }

  const failed = itemsOf(report, 'failedItems');
  const added = itemsOf(report, 'newItems');
  const deleted = itemsOf(report, 'deletedItems');
  const passed = itemsOf(report, 'passedItems');

  // The shape `visual-gate.mjs` blocks on too: reg-suit exits 0 having globbed nothing when the
  // config or the screenshots are missing, and that report reads as "everything matched" unless the
  // counts are checked. A missing report is the comparison step having died.
  if (failed.length + added.length + deleted.length + passed.length === 0) {
    return {
      verdict: 'error',
      blocking: true,
      changedItems: [],
      outsidePrItems: [],
      pull,
      comment: '',
      summary: `Visual ${kind} on ${where}: nothing was compared`
        + `${report ? ' — the report lists no screenshots' : ' — the comparison produced no report'}.`,
      markdown: [
        heading,
        '',
        report
          ? 'The report lists no passing, changed, new, or deleted screenshots. That means the comparison'
            + ' never found them, not that they match.'
          : 'The comparison step produced no report, so the visual state of this build is unknown.',
        link ? `\n${link}\n` : '',
      ].join('\n'),
    };
  }

  const changedItems = [
    ...failed,
    ...added.map(item => `${item} (new)`),
    ...deleted.map(item => `${item} (deleted)`),
  ];
  const verdict = changedItems.length ? 'changed' : 'clean';
  // The tag is not part of the path reg-suit keyed the item by.
  const outsidePrItems = changedItems
    .filter(item => !isInTier(item.replace(/ \((?:new|deleted)\)$/, ''), prPrefixes));
  const counts = `${failed.length} changed, ${added.length} new, ${deleted.length} deleted, ${passed.length} passing`;
  const markdown = [
    heading,
    '',
    '| 🔴 Changed | 🟡 New | ⚪ Deleted | 🔵 Passing |',
    '| ---: | ---: | ---: | ---: |',
    `| ${failed.length} | ${added.length} | ${deleted.length} | ${passed.length} |`,
    '',
  ];

  if (link) {
    markdown.push(link, '');
  }

  if (verdict === 'clean') {
    markdown.push(`All ${passed.length} screenshots match the golden records.`, '');
  } else {
    markdown.push(
      ...itemList(changedItems),
      nightly
        ? 'A full render is never written to the golden records. A difference here is a flake, a wrapper'
          + ' that no longer renders like js (the js-copied baseline gotcha in visual-tests/AGENTS.md), or a'
          + ' poisoned golden — compare with the seed\'s report and, for a poisoned golden, dispatch'
          + ' `Visual seed` on develop.'
        : 'These differences are what this commit changed; the golden records now hold this render.',
      '',
    );

    if (!nightly && outsidePrItems.length > 0) {
      markdown.push(
        `${outsidePrItems.length} of them are in variants a pull request may not render, so the merged pull`
          + ` request's own visual check may not have shown them${pull ? ` — commented on #${pull}` : ''}.`,
        '',
      );
    }
  }

  return {
    verdict,
    blocking: nightly && verdict !== 'clean',
    changedItems,
    outsidePrItems,
    pull,
    comment: !nightly && pull && outsidePrItems.length > 0
      ? pullRequestComment({
        pull,
        shortSha,
        branch,
        outsidePrItems,
        insideCount: changedItems.length - outsidePrItems.length,
        reportUrl,
        runUrl,
      })
      : '',
    summary: `Visual ${kind} on ${where}: ${counts}.`,
    markdown: markdown.join('\n'),
  };
}

/**
 * A collapsible Markdown list of differing items, truncated at `MAX_LISTED_ITEMS`.
 *
 * @param {string[]} items The items to list.
 * @returns {string[]} Markdown lines, ending in a blank line.
 */
function itemList(items) {
  const listed = items.slice(0, MAX_LISTED_ITEMS);
  const rest = items.length - listed.length;

  return [
    `<details><summary>${items.length} item${items.length === 1 ? '' : 's'}</summary>`,
    '',
    ...listed.map(item => `- \`${item}\``),
    ...(rest > 0 ? ['', `…and ${rest} more`] : []),
    '',
    '</details>',
    '',
  ];
}

/**
 * The comment the seed leaves on the merged pull request when the merge changed variants the pull
 * request never rendered.
 *
 * @param {object} options What to say.
 * @param {string} options.pull The pull request number.
 * @param {string} options.shortSha The merged commit.
 * @param {string} options.branch The base branch the seed rendered.
 * @param {string[]} options.outsidePrItems The differing items outside the `pr` tier.
 * @param {number} options.insideCount How many differing items the pull request's own check did cover.
 * @param {string} options.reportUrl The seed report URL, or ''.
 * @param {string} options.runUrl The workflow run URL, or ''.
 * @returns {string} Markdown.
 */
function pullRequestComment({ pull, shortSha, branch, outsidePrItems, insideCount, reportUrl, runUrl }) {
  const count = outsidePrItems.length;
  let link = '';

  if (reportUrl) {
    link = `**[Open the seed report](${reportUrl})** — ${CDN_NOTE}.`;
  } else if (runUrl) {
    link = `**[Open the seed run](${runUrl})** — the \`visual-diff-report\` artifact holds the images.`;
  }

  return [
    '## Visual seed — this merge changed screenshots the pull request may not have rendered',
    '',
    `The \`${branch}\` seed for #${pull} (\`${shortSha}\`) found ${count} difference${count === 1 ? '' : 's'} in`
      + ' variants a pull request may not render — the classic delivery path, the horizon themes, Firefox,'
      + ' WebKit, or the wrapper copies. The wrappers are the reason for "may": a pull request renders one'
      + ' for real when it changed that wrapper\'s own tree, so a wrapper item below may be one this pull'
      + ' request already rendered and reviewed.',
    '',
    ...itemList(outsidePrItems),
    ...(link ? [link, ''] : []),
    ...(insideCount > 0
      ? [
        `${insideCount} more difference${insideCount === 1 ? ' was' : 's were'} in the variants the pull request`
          + ' rendered; its own visual check covered those.',
        '',
      ]
      : []),
    'These renders are now the golden records every open pull request compares against. If the change is',
    'intended, there is nothing to do. If it is not, fix forward or revert, and read the next seed here:',
    'a pull request re-renders only the variants its own tier covers, so its check may not show the fix.',
  ].join('\n');
}
