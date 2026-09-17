/**
 * Decides the visual verdict and renders the pull request comment.
 *
 * Pure: no file, network, or environment access, so the branching that governs
 * whether a pull request can merge is unit-testable. `scripts/visual-gate.mjs`
 * is the thin wrapper that reads `.reg/out.json` and writes `.reg/comment.md`.
 *
 * Two suites go through it. The core one names itself "Visual tests" and holds a `changed` verdict on
 * the `visual-approval` environment; the docs one (DEV-2860, `.github/actions/docs-visual-run`) reads
 * the manifest `docs/tests/lib/visual-manifest.mjs` builds from Playwright's report and holds its own
 * on `docs-visual-approval`. Only the three names differ, so they are the `labels` option and nothing
 * else is duplicated — a change to the verdicts or to the comment reaches both suites at once.
 */

/**
 * The names the core suite calls itself by. `labels` overrides them per suite.
 */
const DEFAULT_LABELS = {
  title: 'Visual tests',
  environment: 'visual-approval',
  artifact: 'visual-diff-report',
};

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
 * @param {object} [options.labels] What this suite calls itself: `title` (the comment's heading),
 * `environment` (the one the approval waits on) and `artifact` (the images when the report is not
 * reachable). Defaults are the core suite's.
 * @returns {Verdict} The verdict.
 */
export function evaluate({
  report, bootstrap = false, seeded = true, reportUrl = '', runUrl = '', labels = {},
}) {
  const { title, environment, artifact } = { ...DEFAULT_LABELS, ...labels };
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

  // Pages that failed before they compared anything. reg-suit never emits this key, so the core suite
  // is untouched; the docs adapter (`docs/tests/lib/visual-manifest.mjs`) writes it for a test that
  // never reached `toHaveScreenshot` — the preview 500'd, navigation timed out, the loading overlay
  // never cleared.
  //
  // It has to block HERE rather than only in the adapter's CLI. The CLI already exits non-zero, but
  // the action's verdict step runs on `!cancelled()`, so it executes anyway, reads the manifest the
  // CLI had already written, and would otherwise report `clean` or `changed` over a run where pages
  // never rendered — asking for an approval on a build whose own job has failed, and linking a report
  // the publish step (which has no status function, so it skips) never uploaded.
  //
  // FIRST, above the empty-report check, and that placement is the point rather than a style choice.
  // When the preview is down EVERY page fails before its screenshot, so the four reg-suit buckets are
  // all empty and the "nothing was compared" branch below would answer first — blocking correctly, but
  // with a generic message, in exactly the case this branch exists to explain. Both verdicts are
  // `error`, so only the reader notices the difference; that is what makes it easy to reorder by
  // accident, and why a test pins it.
  const errored = Array.isArray(report?.erroredItems) ? report.erroredItems : [];

  if (errored.length > 0) {
    return {
      blocked: true,
      verdict: 'error',
      summary: `${errored.length} page(s) failed without comparing a screenshot, so this build's visual `
        + 'state is unknown.',
      comment: [
        `## ${title} — could not compare`,
        '',
        `${errored.length} page${errored.length === 1 ? '' : 's'} failed before taking a screenshot, so `
          + 'there is nothing to approve. The usual causes are a preview that did not come up, a',
        'navigation timeout, or an example that never finished loading.',
        '',
        ...errored.slice(0, 20).map(item => `- \`${item}\``),
        errored.length > 20 ? `- …and ${errored.length - 20} more` : '',
        '',
        'Fix the run and push again; the comparison reports nothing until every page renders.',
        runUrl ? `\n[Workflow run](${runUrl})\n` : '',
      ].filter(line => line !== '').join('\n'),
    };
  }

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
        `## ${title} — nothing was compared`,
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
          `## ${title} — baseline created`,
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
          `## ${title} — nothing to compare`,
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
        `## ${title} — could not compare`,
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
        `## ${title} — no changes`,
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
      + `Waiting for a reviewer to approve the ${environment} deployment.`,
    comment: [
      `## ${title} — changes detected, approval pending`,
      '',
      ...table,
      '',
      reportUrl
        ? `**[Open the visual report](${reportUrl})** — compare each screenshot side by side, `
          + 'with slider, blend, and toggle views.'
        : `The report URL is unavailable; download the \`${artifact}\` artifact instead.`,
      '',
      `If the report is unreachable, the \`${artifact}\` artifact on the `
        + `${runUrl ? `[workflow run](${runUrl})` : 'workflow run'} holds the same thing.`,
      '',
      '### What to do next',
      '',
      '**If these differences are a regression** — push a commit that fixes them. The next run',
      'compares again and the approval request goes away on its own.',
      '',
      '**If these differences are intentional** — a reviewer approves them on the workflow run',
      `page: ${runUrl ? `[open the run](${runUrl}), then` : 'open the run, then'} **Review pending`
        + ` deployments → ${environment} → Approve**. One click, no new commit, no re-run; the`,
      'approval is recorded with the reviewer\'s name. **Reject** turns the run red instead.',
      '',
      'Approval is all-or-nothing and per run: it accepts every difference in this build at once,',
      'so read the report before approving, and a new push asks for a new approval, so',
      'screenshots nobody looked at never inherit one.',
      '',
      // A fork or Dependabot contributor reads this in the job summary. Their
      // token cannot post the comment, but the environment gate does not depend
      // on their token at all: a maintainer approves the deployment the same way.
      //
      // Keyed on `reportUrl`, not on `seeded`. They say different things —
      // `seeded` is whether this run may WRITE the baseline, and this note is
      // about whether it PUBLISHED a report. The workflow happens to set both
      // from one condition today, so the two are indistinguishable here; the day
      // a same-repo run seeds without publishing, keying on `seeded` would hide
      // the note on the run that needs it and show a fork notice on a run that is
      // not a fork. The absent URL is the fact the sentence is actually about.
      ...(reportUrl
        ? []
        : [
          '> This run published no hosted report — normally a fork or Dependabot pull request,',
          `> whose token cannot publish one — so the \`${artifact}\` artifact holds the images.`,
          '> A maintainer approves the deployment as above.',
          '',
        ]),
    ].join('\n'),
  };
}
