/**
 * The run verdict of an accessibility nightly: reads the check runs this workflow run posted on its commit
 * (`listCheckRuns()` of `lib/github-check-run.mjs`, kept by the `external_id` every poster stamps with the
 * run's id) and follows the worst (`runVerdict()` of `lib/a11y-verdict.mjs`): red when any check run is red,
 * when one the run should have posted is missing, or when the run posted none. Writes the verdict to the job
 * summary and exits 1 on red, so the run's own conclusion says what its checks found.
 *
 * Run by the `verdict` job of `.github/workflows/a11y-nightly.yml` and `screenreader-nightly.yml`, after every
 * scan and lane has finished (`needs`, with `!cancelled()`): a red check run never stops another job or a
 * scan mid-way; the run finishes, reports everything, then says it failed.
 *
 * Arguments: `--prefix <name prefix>` (repeatable; the check runs to read, such as `A11y / `), `--expect <name>`
 * (repeatable; a check run the run must have posted), `--a11y-suite <suite>` (expects `A11y / axe report`
 * and one `A11y / <check> report` per check of the suite), `--site <site>` (expects one `A11y / <check> report` per
 * site check of the site, or of `--site-checks <ids>`, the site workflow's `checks` input), and the dispatch as
 * `check-inputs` read it
 * (`dispatchSubset()` of `lib/a11y-dispatch.mjs`): `--ref <github.ref>`, `--a11y-checks <ids>` (with
 * `--a11y-suite`, expects the named checks instead of the suite's, the way `A11Y_CHECKS` narrows the checks
 * job), `--projects <ids>` and `--groups <ids>` (keep only the `--expect` names that carry one of the named
 * reader projects, and one of the named groups, as a word, the way the inputs narrow the lanes). An empty
 * value of a subset means no subset, as an empty dispatch input does; an entry that names nothing, or a
 * subset on develop, is the one-line red verdict `check-inputs` already gave. `--dry-run <file>` reads the
 * check runs from a JSON file (an array, or the API's `{check_runs}`) instead of the API.
 *
 * Environment: `GITHUB_TOKEN` (with `checks: read`), `GITHUB_REPOSITORY`, `HEAD_SHA` (the commit the posters
 * posted on), `GITHUB_RUN_ID`, and optionally `GITHUB_API_URL` and `GITHUB_STEP_SUMMARY`.
 */
import { appendFileSync, readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { CHECK_RUN_NAME } from '../lib/a11y-check-run.mjs';
import { dispatchSubset } from '../lib/a11y-dispatch.mjs';
import { checkRunName } from '../lib/a11y-evidence.mjs';
import { renderRunVerdict, runVerdict } from '../lib/a11y-verdict.mjs';
import { listCheckRuns } from '../lib/github-check-run.mjs';

const env = process.env;
const { values } = parseArgs({
  options: {
    prefix: { type: 'string', multiple: true, default: [] },
    expect: { type: 'string', multiple: true, default: [] },
    ref: { type: 'string' },
    'a11y-suite': { type: 'string' },
    'a11y-checks': { type: 'string' },
    projects: { type: 'string' },
    groups: { type: 'string' },
    site: { type: 'string' },
    'site-checks': { type: 'string' },
    'dry-run': { type: 'string' },
  },
});

if (values.prefix.length === 0) {
  process.stderr.write('a11y-run-verdict: name at least one --prefix, such as "A11y / ".\n');
  process.exit(2);
}

// A subset dispatch ran a subset: the verdict expects that subset, or every subset run would be red for the
// check runs it never posted. The inputs are read the way the check-inputs job read them before the build;
// what it refused (a subset on develop, an entry that names nothing) is refused here the same way, in one
// line, instead of a row per lane the run never had.
let dispatch;

try {
  dispatch = dispatchSubset({ ref: values.ref, suite: values['a11y-suite'], checks: values['a11y-checks'], projects: values.projects, groups: values.groups,
    site: values.site, siteChecks: values['site-checks'] });
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  const refused = renderRunVerdict({ conclusion: 'failure', problems: [message], rows: [] });

  if (env.GITHUB_STEP_SUMMARY) {
    appendFileSync(env.GITHUB_STEP_SUMMARY, `${refused}\n`);
  }
  process.stdout.write(`${refused}\n`);
  process.stderr.write(`a11y-run-verdict: ${message}\n`);
  process.exit(1);
}

// A project or group is matched as a whole word of the expected name, so `vo-chromium` never keeps a
// `chromium` name, and `Screen reader / nvda-chromium menus report` follows both its project and its group.
const named = (name, subset) => subset === null || name.split(' ').some(word => subset.includes(word));
const expected = [
  ...values.expect.filter(name => named(name, dispatch.projects) && named(name, dispatch.groups)),
  ...(values['a11y-suite'] ? [CHECK_RUN_NAME, ...dispatch.checks.map(checkRunName)] : []),
  ...(dispatch.siteChecks ?? []).map(checkRunName),
];
let checkRuns;

if (values['dry-run']) {
  const parsed = JSON.parse(readFileSync(values['dry-run'], 'utf8'));

  checkRuns = Array.isArray(parsed) ? parsed : parsed.check_runs;
} else {
  for (const name of ['GITHUB_TOKEN', 'GITHUB_REPOSITORY', 'HEAD_SHA', 'GITHUB_RUN_ID']) {
    if (!env[name]) {
      process.stderr.write(`a11y-run-verdict: ${name} is not set, so no check run could be read.\n`);
      process.exit(1);
    }
  }
  checkRuns = await listCheckRuns({ token: env.GITHUB_TOKEN, repository: env.GITHUB_REPOSITORY, sha: env.HEAD_SHA, apiUrl: env.GITHUB_API_URL });
}

const result = runVerdict({ checkRuns, runId: env.GITHUB_RUN_ID ?? '', prefixes: values.prefix, expected });
const summary = renderRunVerdict(result);

if (env.GITHUB_STEP_SUMMARY) {
  appendFileSync(env.GITHUB_STEP_SUMMARY, `${summary}\n`);
}
process.stdout.write(`${summary}\n`);

for (const row of result.rows) {
  process.stdout.write(`a11y-run-verdict: ${row.name} (${row.conclusion}): ${row.title}\n`);
}
process.stdout.write(`a11y-run-verdict: the run is ${result.conclusion}\n`);
process.exit(result.conclusion === 'failure' ? 1 : 0);
