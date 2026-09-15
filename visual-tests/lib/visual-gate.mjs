/**
 * Decides the visual verdict and renders the pull request comment.
 *
 * Pure: no file, network, or environment access, so the branching that governs
 * whether a pull request can merge is unit-testable. `scripts/visual-gate.mjs`
 * is the thin wrapper that reads `.reg/out.json` and writes `.reg/comment.md`.
 */

/**
 * @typedef {object} Verdict
 * @property {boolean} blocked Whether the check should fail outright (the comparison itself failed).
 * @property {'bootstrap' | 'error' | 'clean' | 'changed'} verdict What the comparison found; `changed`
 * is the one verdict a human has to act on — the workflow holds an environment-protected job on it.
 * @property {string} summary One-line result for the job log.
 * @property {string} comment Markdown body for the pull request comment.
 */

/**
 * Evaluate a comparison result.
 *
 * Differences do not fail the gate here. They yield the `changed` verdict, and the workflow turns that
 * into a job that waits on the `visual-approval` environment: a reviewer approves the pending
 * deployment on the run page (one click, recorded with their name), or rejects it and the run goes
 * red. Approval is per run, so a push re-asks; nothing is re-committed and nothing is re-run. The gate
 * therefore blocks only when it cannot tell what the visual state is.
 *
 * @param {object} options Evaluation inputs.
 * @param {object|null} options.report Parsed `out.json`, or `null` when unreadable.
 * @param {boolean} [options.bootstrap] Whether the probe found no golden records.
 * @param {boolean} [options.seeded] Whether this run may write the baseline.
 * @param {string} [options.reportUrl] Published report URL, or '' when nothing was published.
 * @param {string} [options.runUrl] Workflow run URL, when known.
 * @returns {Verdict} The verdict.
 */
export function evaluate({
  report, bootstrap = false, seeded = true, reportUrl = '', runUrl = '',
}) {
  // `bootstrap` comes from a probe of `out.json`, which is a different source of
  // truth from the comparison itself. A base build killed mid-publish can leave
  // `actual/**` uploaded with no manifest: the probe then says "no baseline"
  // while reg-suit fetches those actuals and produces a report with real
  // differences. Trusting the probe alone would pass that build and overwrite
  // the baseline with it, so a real comparison always wins.
  // `deletedItems` counts too: an expected file that matched nothing still
  // proves a baseline existed. Without it, a torn manifest plus a build that
  // renames every screenshot slips through and seeds over the real records.
  const compared = Boolean(report
    && (report.failedItems.length || report.passedItems.length || report.deletedItems.length));

  // Checked before `bootstrap`, not after. reg-suit exits 0 having globbed
  // nothing when the config or the screenshots are missing, and that report has
  // no failed and no passed items either -- so it looks exactly like a legitimate
  // first build. Left later in the order, a broken first run would pass as
  // "baseline created" and seed a blank manifest, after which the probe returns
  // 200 forever and every later pull request compares against nothing.
  // A null report is the credential-free path, which legitimately writes none.
  if (report && report.failedItems.length + report.newItems.length
    + report.deletedItems.length + report.passedItems.length === 0) {
    return {
      blocked: true,
      verdict: 'error',
      summary: 'The comparison found no screenshots at all, so nothing was checked.',
      comment: [
        '## Visual tests — nothing was compared',
        '',
        'The report lists no passing, changed, new, or deleted screenshots. That means',
        'the comparison never found them, not that they match.',
        runUrl ? `\n[Workflow run](${runUrl})\n` : '',
      ].join('\n'),
    };
  }

  if (bootstrap && !compared) {
    return seeded
      ? {
        blocked: false,
        verdict: 'bootstrap',
        summary: 'No golden records existed for this base branch, so this build seeds them.',
        comment: [
          '## Visual tests — baseline created',
          '',
          'This branch had no golden records, so this build became the baseline.',
          'There was nothing to compare against yet, and the next build of the base',
          'branch replaces it with the authoritative render.',
          '',
        ].join('\n'),
      }
      : {
        blocked: false,
        verdict: 'bootstrap',
        summary: 'No golden records exist for this base branch, and this run cannot seed them.',
        comment: [
          '## Visual tests — nothing to compare',
          '',
          'This base branch has no golden records yet, and a fork or Dependabot run',
          'cannot create them. Nothing was compared and nothing was seeded.',
          '',
          'A build from the main repository has to publish the baseline first; after',
          'that this pull request is compared normally on its next run.',
          '',
        ].join('\n'),
      };
  }

  if (!report) {
    return {
      blocked: true,
      verdict: 'error',
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
      verdict: 'clean',
      summary: `No visual changes. ${passed} screenshots match the golden records.`,
      comment: [
        '## Visual tests — no changes',
        '',
        `All ${passed} screenshots match the golden records.`,
        '',
      ].join('\n'),
    };
  }

  return {
    blocked: false,
    verdict: 'changed',
    summary: `Visual changes detected: ${changed} changed, ${added} new, ${deleted} deleted. `
      + 'Waiting for a reviewer to approve the visual-approval deployment.',
    comment: [
      '## Visual tests — changes detected, approval pending',
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
      '**If these differences are a regression** — push a commit that fixes them. The next run',
      'compares again and the approval request goes away on its own.',
      '',
      '**If these differences are intentional** — a reviewer approves them on the workflow run',
      `page: ${runUrl ? `[open the run](${runUrl}), then` : 'open the run, then'} **Review pending`
        + ' deployments → visual-approval → Approve**. One click, no new commit, no re-run; the',
      'approval is recorded with the reviewer\'s name. **Reject** turns the run red instead.',
      '',
      'Approval is all-or-nothing and per run: it accepts every difference in this build at once,',
      'so read the report before approving, and a new push asks for a new approval, so',
      'screenshots nobody looked at never inherit one.',
      '',
      // A fork or Dependabot contributor reads this in the job summary. Their
      // token cannot post the comment, but the environment gate does not depend
      // on their token at all: a maintainer approves the deployment the same way.
      ...(seeded
        ? []
        : [
          '> This run comes from a fork or from Dependabot, so it published no report; the',
          '> `visual-diff-report` artifact holds the images. A maintainer approves the',
          '> deployment as above.',
          '',
        ]),
    ].join('\n'),
  };
}
