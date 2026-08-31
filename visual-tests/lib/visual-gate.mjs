/**
 * Decides the visual verdict and renders the pull request comment.
 *
 * Pure: no file, network, or environment access, so the branching that governs
 * whether a pull request can merge is unit-testable. `scripts/visual-gate.mjs`
 * is the thin wrapper that reads `.reg/out.json` and writes `.reg/comment.md`.
 */

/**
 * @typedef {object} Verdict
 * @property {boolean} blocked Whether the check should fail.
 * @property {string} summary One-line result for the job log.
 * @property {string} comment Markdown body for the pull request comment.
 */

/**
 * Evaluate a comparison result.
 *
 * @param {object} options Evaluation inputs.
 * @param {object|null} options.report Parsed `out.json`, or `null` when unreadable.
 * @param {boolean} [options.bootstrap] Whether this build is seeding the baseline.
 * @param {boolean} [options.approved] Whether `visual-approved` is on the pull request.
 * @param {string} [options.reportUrl] Published report URL, when known.
 * @param {string} [options.runUrl] Workflow run URL, when known.
 * @returns {Verdict} The verdict.
 */
export function evaluate({ report, bootstrap = false, approved = false, reportUrl = '', runUrl = '' }) {
  if (bootstrap) {
    return {
      blocked: false,
      summary: 'No golden records existed for this base branch, so this build seeds them.',
      comment: [
        '## Visual tests — baseline created',
        '',
        'This branch had no golden records, so this build became the baseline.',
        'There was nothing to compare against yet, and the next build of the base',
        'branch replaces it with the authoritative render.',
        '',
      ].join('\n'),
    };
  }

  if (!report) {
    return {
      blocked: true,
      summary: 'The comparison step produced no report, so the visual state is unknown.',
      comment: [
        '## Visual tests — could not compare',
        '',
        'The comparison step produced no report, so the visual state is unknown.',
        runUrl ? `\n[Workflow run](${runUrl})\n` : '',
      ].join('\n'),
    };
  }

  const changed = report.failedItems.length;
  const added = report.newItems.length;
  const deleted = report.deletedItems.length;
  const passed = report.passedItems.length;
  const table = [
    '| 🔴 Changed | 🟡 New | ⚪ Deleted | 🔵 Passing |',
    '| ---: | ---: | ---: | ---: |',
    `| ${changed} | ${added} | ${deleted} | ${passed} |`,
  ];

  if (changed + added + deleted === 0) {
    return {
      blocked: false,
      summary: `No visual changes. ${passed} screenshots match the golden records.`,
      comment: [
        '## Visual tests — no changes',
        '',
        `All ${passed} screenshots match the golden records.`,
        '',
      ].join('\n'),
    };
  }

  const summary = `Visual changes detected: ${changed} changed, ${added} new, ${deleted} deleted.`;

  if (approved) {
    return {
      blocked: false,
      summary: `${summary} Accepted via the visual-approved label.`,
      comment: [
        '## Visual tests — changes approved',
        '',
        ...table,
        '',
        'The **`visual-approved`** label accepted these differences as intentional.',
        reportUrl ? `\n[Review the report](${reportUrl}) if you want to double-check them.\n` : '',
        'The label is removed on the next push, so a later change is compared again.',
        '',
      ].join('\n'),
    };
  }

  return {
    blocked: true,
    summary,
    comment: [
      '## Visual tests — changes detected',
      '',
      ...table,
      '',
      reportUrl
        ? `**[Open the visual report](${reportUrl})** — compare each screenshot side by side, `
          + 'with slider, blend, and toggle views.'
        : 'The report URL is unavailable; download the `visual-diff-report` artifact instead.',
      '',
      'If the report is unreachable, the `visual-diff-report` artifact on the '
        + `${runUrl ? `[workflow run](${runUrl})` : 'workflow run'} holds the same thing.`,
      '',
      '### What to do next',
      '',
      '**If these differences are a regression** — push a commit that fixes them. The check',
      'goes green on its own.',
      '',
      '**If these differences are intentional** — accept them as the new baseline:',
      '',
      '1. Add the **`visual-approved`** label to this pull request.',
      '2. Re-run the **Visual / Compare** job.',
      '',
      'Approval is all-or-nothing: the label accepts every difference in this build at once,',
      'so read the report before applying it.',
      '',
      '> The label is removed automatically on every push, so an approval only ever covers',
      '> the screenshots someone actually looked at. If you push again, re-apply it.',
      '',
    ].join('\n'),
  };
}
