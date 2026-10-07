import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { repoRoot } from '../lib/repo-root.mjs';

// The golden seed for develop moved out of develop.yml because that run's
// `cancel-in-progress` kept cancelling it and left every open pull request
// comparing against a stale baseline (DEV-2797). Two ways that regresses without
// anything going red: someone adds a `visual:` job back to develop.yml (the seed
// then renders twice and inherits the cancellation again), or someone "tidies"
// the seed's concurrency to cancel in progress like every other orchestrator.
//
// Text-based, like fork-guards.test.mjs: no YAML parser is a dependency of the
// repo root.

const root = repoRoot();
const read = (rel) => readFileSync(path.join(root, rel), 'utf8');
const seed = read('.github/workflows/visual-seed.yml');
const develop = read('.github/workflows/develop.yml');
const visual = read('.github/workflows/visual.yml');
const build = read('.github/workflows/build.yml');

/**
 * The jobs a workflow declares, by the two-space indent that starts each one.
 *
 * @param {string} source The workflow file's contents.
 * @returns {string[]} Job ids in order.
 */
function jobIds(source) {
  const [, jobsBlock = ''] = source.split(/^jobs:$/m);

  return [...jobsBlock.matchAll(/^ {2}([A-Za-z0-9_-]+):$/gm)].map(([, id]) => id);
}

test('develop.yml no longer renders the visual seed itself', () => {
  assert.ok(!jobIds(develop).includes('visual'), 'develop.yml has a `visual:` job again — the seed would render '
    + 'twice per push and the cancelled-run lag would be back');
  assert.doesNotMatch(develop, /uses: \.\/\.github\/workflows\/visual\.yml/,
    'develop.yml calls visual.yml; the seed belongs to visual-seed.yml');
});

test('the seed runs on every develop push and by hand, never on an ordinary pull request', () => {
  // Anchored to the end of the line, so a `paths:`/`paths-ignore:` added under it
  // fails here instead of passing on the prefix. That edit is the predictable one
  // — stopping docs-only merges from spending a render matrix — and it brings back
  // the scope-skip this workflow exists to remove: a pull request renders
  // `refs/pull/N/merge`, so the baseline must follow develop's tip whatever moved
  // it, and any filter list would have to name every input the render depends on.
  assert.match(seed, /^on:\n  push:\n    branches: \[ develop \]\n/m, 'the seed must trigger on a develop push');
  assert.doesNotMatch(seed, /branches: \[ develop \]\n\s+paths(-ignore)?:/,
    'the seed must not be path-filtered — the baseline has to follow every develop push');
  assert.match(seed, /^\s+workflow_dispatch:/m, 'the seed must be re-runnable by hand for a poisoned baseline');
  // The self-validation trigger that develop.yml also carries, and the skip that
  // keeps it from seeding from a pull request.
  assert.match(seed, /pull_request:\n\s+paths: \[ '\.github\/workflows\/visual-seed\.yml' \]/);
  // Anchored to the whole condition: another clause here would change which events
  // or which refs seed. The ref half is covered by its own test below.
  assert.match(seed, /if: github\.event_name != 'pull_request' && github\.ref_name == 'develop'\n/);
});

test('the seed never cancels an in-flight run', () => {
  assert.match(seed, /concurrency:\n(?:\s+#.*\n)*\s+group: visual-seed-\$\{\{ github\.ref \}\}\n\s+cancel-in-progress: false/,
    'the seed group must keep a static prefix and cancel-in-progress: false — that is the whole reason it exists');
  assert.doesNotMatch(seed, /\$\{\{ github\.workflow \}\}/);
  // Pinning the caller alone leaves the hole open: a called workflow may declare
  // its own `concurrency`, that group applies to the jobs that actually run, and a
  // cancelling one there would make the seed cancellable again with all of the
  // assertions above still green.
  assert.doesNotMatch(visual, /^concurrency:/m,
    'visual.yml must declare no concurrency of its own — its group would apply to the seed and could cancel it');
});

test('a run that never cancels is bounded by a timeout instead', () => {
  // The two are a pair: `cancel-in-progress: false` means a wedged render holds
  // the group for GitHub's six-hour default, and every push behind it waits — the
  // gap this workflow exists to close. A caller that `uses:` a reusable workflow
  // cannot carry `timeout-minutes`, so the cap belongs on visual.yml's own jobs.
  const capped = [...visual.matchAll(/^ {4}timeout-minutes: (\d+)$/gm)].map(([, n]) => Number(n));

  assert.equal(capped.length, 2, 'both visual.yml jobs that do work must cap themselves');
  capped.forEach((minutes) => {
    assert.ok(minutes > 0 && minutes <= 120, `an unbounded-ish cap (${minutes}m) defeats the point`);
  });
});

test("the seed's build fallback stays in step with build.yml, or the baseline drifts from every render", () => {
  // The seed downloads no Build artifact, so it ALWAYS takes visual.yml's inline
  // fallback, while pull requests and master take build.yml's artifacts. A task
  // that only one list runs makes `base/develop` describe a tree no pull request
  // ever renders — a permanent diff with nothing to blame it on. The one accepted
  // difference is the theme UMD pair: it emits `dist/themes/**` for the published
  // package, and the demos load a theme as a stylesheet from `styles/`.
  const KNOWN_OMISSIONS = ['build:themes-umd', 'build:themes-umd.min'];
  const tasksIn = (source, from, to) => {
    const block = source.slice(source.indexOf(from), to ? source.indexOf(to) : undefined);

    return new Set([...block.matchAll(/\b(?:npm run(?: in handsontable)? |run\.mjs )(build:[\w.-]+)/g)]
      .map(([, task]) => task));
  };
  const fromBuild = tasksIn(build, '  umd:', '  attw:');
  const fromVisual = tasksIn(visual, '  render:', '  compare:');
  const missing = [...fromBuild].filter(task => !fromVisual.has(task));

  assert.ok(fromBuild.size > 5 && fromVisual.size > 5, 'the task lists were not found; the anchors moved');
  assert.deepEqual(missing.sort(), KNOWN_OMISSIONS.slice().sort(),
    `visual.yml's fallback no longer matches build.yml. Add the task there too, or add it to `
      + 'KNOWN_OMISSIONS with the reason it cannot change a rendered pixel.');
});

test('the seed calls the shared visual module with the secrets it needs', () => {
  // The seed tier is the one that renders everything the golden records hold and
  // writes `base/develop`; any other tier here would reconcile the baseline down
  // to a subset (visual-tiers.test.mjs pins the tier table itself).
  assert.match(seed, /uses: \.\/\.github\/workflows\/visual\.yml\n\s+with:\n\s+tier: seed\n\s+secrets: inherit/);
  // Parity with develop.yml: no caller-level permissions block, or the nested
  // grant in visual.yml would be validated against a second ceiling.
  assert.doesNotMatch(seed, /^permissions:/m, 'visual-seed.yml must not declare a permissions block');
  assert.deepEqual(jobIds(seed), ['guard', 'visual', 'notify']);
});

test('the seed writes develop and refuses every other ref', () => {
  // A workflow_dispatch can be launched from ANY ref, and visual.yml resolves
  // `REG_ACTUAL_KEY=base/<ref>` and reconciles that prefix with `aws s3 sync
  // --delete` for master, release/* and lts/* alike. Dispatching this file from
  // the branch someone happens to be on would therefore rewrite that branch's
  // goldens — an lts/* baseline among them, which visual-tests/README.md says
  // nothing ever refreshes and nothing could put back.
  assert.match(seed, /^\s+if: github\.event_name != 'pull_request' && github\.ref_name == 'develop'$/m,
    'the seeding job must be pinned to develop, not only to the event');
  assert.match(seed, /^\s+if: github\.event_name == 'workflow_dispatch' && github\.ref_name != 'develop'$/m,
    'a wrong-ref dispatch must hit a job that fails, not a silently skipped run');
  // The guard is only worth having if it actually fails.
  const guard = seed.slice(seed.indexOf('  guard:'), seed.indexOf('  visual:'));

  assert.match(guard, /exit 1/, 'the guard job must fail the run');
  assert.match(guard, /::error::/, 'the guard job must say why');
  assert.match(guard, /REF_NAME: \$\{\{ github\.ref_name \}\}/, 'the ref goes through env, never into the script body');
});

test('a failed seed pings Slack, and only a failed one', () => {
  // The seed is the quietest failure here: not a required check, not in
  // test-health.yml's list, and since DEV-2797 it no longer reds the Develop run.
  // Left unannounced, a broken seed surfaces as unrelated pull requests failing
  // on the same items hours later — the investigation DEV-2797 began with.
  // `indexOf` first, and asserted: `slice(-1)` on a miss returns the file's last
  // character, which is a truthy string, so slicing before asserting made the
  // `assert.ok` below unable to fail with the message it carries.
  const notifyAt = seed.indexOf('  notify:');

  assert.notEqual(notifyAt, -1, 'visual-seed.yml lost its Slack notification');

  const notify = seed.slice(notifyAt);

  assert.match(notify, /needs: \[ visual \]/);

  // The status-check function is mandatory, and its absence is the bug this job
  // shipped with: a job `if:` containing none of `always()`, `!cancelled()`,
  // `failure()` or `success()` gets an implicit `success()` ANDed on, so a
  // condition that only wants to run when its need FAILED can never run at all.
  // Pinned textually because nothing here simulates GitHub's evaluator.
  assert.match(notify, /if: \$\{\{ !cancelled\(\) && needs\.visual\.result == 'failure'/,
    'without a status-check function the implicit success() makes this job unreachable on a failed seed');
  // Named rather than a bare `failure()`. The `guard` job fails on a wrong-ref
  // dispatch, which is operator error with its own message, not a broken seed —
  // and naming the job settles it without depending on how ancestor rules read.
  assert.match(notify, /needs\.visual\.result == 'failure'/,
    'the ping must key on the seed job failing, not on any job in the run failing');
  assert.doesNotMatch(notify, /if: \$\{\{ failure\(\)/,
    'a bare failure() would also ping on a wrong-ref dispatch the guard already reported');
  assert.match(notify, /github\.event_name != 'pull_request'/,
    'the self-validation pull request run must not ping');

  // Optional by construction: an absent secret is an empty string, so the step
  // skips itself and the seed's own result is unchanged. Without this the hook
  // could not land before the webhook exists.
  assert.match(notify, /SLACK_WEBHOOK_URL: \$\{\{ secrets\.SLACK_VISUAL_WEBHOOK_URL \}\}/,
    'the webhook goes through env so the step can test it');
  assert.match(notify, /if: env\.SLACK_WEBHOOK_URL != ''/,
    'without the secret the step must skip itself rather than fail the run');
  assert.match(notify, /uses: slackapi\/slack-github-action@[0-9a-f]{40} #/,
    'the Slack action must be SHA-pinned with its release comment, like every other action here');

  // A seed that succeeds WITH differences is the normal case — those differences
  // are what the merge changed, and seed-report.mjs already reports them.
  assert.doesNotMatch(notify, /outputs\.verdict|steps\.report/,
    'only a failed seed pings; a seed with differences is the expected case');
});
