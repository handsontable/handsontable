import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { repoRoot } from '../lib/repo-root.mjs';

// The stability matrix is the acceptance instrument for visual-suite flakes: it
// renders one commit on N runners and reports what differed. Two properties make
// it safe to dispatch from any branch without a fork guard, and both are the kind
// that erode silently:
//
//   1. it must stay credential-free and write nothing: no secret, no comment, no
//      label, no publish — the verdict goes to the job summary only. The moment a
//      step writes through the API it needs the canonical fork guard and a place
//      in fork-guards.test.mjs;
//   2. it must stay a probe, not a second suite: only the spec groups under
//      investigation render, or a dispatch costs ten full renders.
//
// Text-based, like fork-guards.test.mjs: no YAML parser is a dependency of the
// repo root.

const root = repoRoot();
const read = (rel) => readFileSync(path.join(root, rel), 'utf8');
const workflow = read('.github/workflows/visual-stability.yml');

test('the stability matrix runs on weekday nights and on demand, and never on an event', () => {
  // The nightly catches drift (one render against the baseline); this catches noise (runners against each
  // other). They run on the same nights so a flake and a drift seen the same morning can be told apart —
  // thirty minutes apart, so they do not contend for runner slots at the same instant.
  assert.match(workflow, /^on:\n {2}schedule:\n(?:\s+#.*\n)*\s+- cron: '30 2 \* \* 2-6'\n {2}workflow_dispatch:/m,
    'the matrix runs at 02:30 UTC Tue–Sat, thirty minutes after the nightly, and on demand');
  assert.match(read('.github/workflows/visual-nightly.yml'), /- cron: '0 2 \* \* 2-6'/,
    'the nightly moved; move this schedule with it so the two still share their nights');
  assert.doesNotMatch(workflow, /^\s+(push|pull_request|pull_request_target|workflow_run):/m,
    'an event-driven trigger turns the probe into a per-change suite');
});

test('a scheduled run falls back for every input a schedule does not carry', () => {
  // A schedule has no inputs. Without a fallback the iteration gate compares against an empty string (a
  // bash error on every iteration, so nothing renders) and the themed pass runs with no theme at all.
  assert.match(workflow, /ITERATIONS: \$\{\{ inputs\.iterations \|\| '3' \}\}/);
  assert.match(workflow, /HOT_THEME_UNDER_TEST: \$\{\{ inputs\.theme \|\| 'main-dark' \}\}/);
  assert.match(workflow, /SCOPE: \$\{\{ inputs\.scope \|\| 'investigation' \}\}/);
  assert.doesNotMatch(workflow.replace(/\$\{\{ inputs\.\w+ \|\| '[^']*' \}\}/g, ''), /inputs\.\w+/,
    'every read of an input carries a fallback');
  // The dispatch keeps the DEV-2797 acceptance count of ten. Sliced to the input and matched flat: a
  // pattern spanning the lines between would be the ambiguous `(?:\s+.*\n)*?` shape this file already
  // had to remove once (CodeQL js/redos).
  const iterationsAt = workflow.indexOf('      iterations:\n');
  const themeAt = workflow.indexOf('      theme:\n', iterationsAt);

  assert.ok(iterationsAt > -1 && themeAt > iterationsAt, 'the dispatch lost its iterations or theme input');
  assert.match(workflow.slice(iterationsAt, themeAt), /^ {8}default: '10'$/m);
});

test('the stability matrix publishes nothing and reads one secret, in the notify job only', () => {
  assert.match(workflow, /^permissions:\n  contents: read\n/m, 'the workflow must ask for read access only');
  assert.doesNotMatch(workflow, /sticky-pull-request-comment|gh pr edit|gh api .*(comments|labels)|aws s3/,
    'the matrix must not comment, label, or publish; the verdict belongs in the job summary');
  assert.match(workflow, /GITHUB_STEP_SUMMARY/, 'the verdict must reach the job summary');

  const secrets = [...workflow.matchAll(/secrets\.(\w+)/g)].map(([, name]) => name);

  assert.deepEqual(secrets, ['SLACK_VISUAL_WEBHOOK_URL'], 'the one secret is the Slack webhook');

  const notifyAt = workflow.indexOf('\n  notify:\n');

  assert.notEqual(notifyAt, -1, 'the matrix lost its notify job');
  assert.ok(workflow.indexOf('secrets.SLACK_VISUAL_WEBHOOK_URL') > notifyAt, 'the webhook is read in notify alone');

  const notify = workflow.slice(notifyAt);

  // A status function, or the implicit success() makes the job unreachable exactly when it is needed.
  assert.match(notify, /\n {4}if: \$\{\{ failure\(\) && github\.event_name == 'schedule' \}\}\n/);
  assert.match(notify, /needs: \[ render, verdict \]/);
  assert.match(notify, /if: env\.SLACK_WEBHOOK_URL != ''/, 'the step skips itself when the secret is absent');
});

test('the matrix renders only the spec groups under investigation', () => {
  assert.match(workflow, /MULTI_SPECS: tests\/multi-frameworks\/filters/, 'the multi-framework render must stay '
    + 'scoped to the filters family');
  assert.match(workflow, /CROSS_SPECS: selection/, 'the cross-browser render must stay scoped to the selection spec');
  assert.doesNotMatch(workflow, /npm run in visual-tests test(:cross-browser)?\b/, 'the matrix must not run '
    + 'the full suite through run-tests.mjs');
});

test('the render job composes the screenshot tree the way visual.yml does', () => {
  // partial-packaging.test.mjs asserts the types and language packs; this pins
  // that the job builds the package at all rather than expecting artifacts a
  // dispatch never has.
  assert.match(workflow, /build:es\b/);
  assert.match(workflow, /postbuild:partial/);
  assert.match(workflow, /examples:install next\/visual-tests/);
});

test('the render job builds the theme stylesheets the themed passes load, before the tree is composed', () => {
  // The base stylesheet comes for free — `build:es` pulls `build:styles.min` and `build:styles`
  // through handsontable/scripts/tasks.json — but the theme files are prerequisites of `build:umd`
  // alone, which is how visual.yml's fallback gets them and which this job never runs. Left out,
  // `postbuild:partial` copies a styles/ with no theme in it and says nothing, the demo's theme
  // <link> is answered with index.html and a 200, and every themed pass renders an unstyled grid —
  // ten runners agreed on it in run 35230835319, and the matrix called that "stable" because it only
  // compares runners with each other. `indexOf` asserted before the ordering comparison: on a miss
  // both would be -1 and `-1 < -1` could never fail with a useful message.
  const [, buildBlock = ''] = workflow.split('Build the Handsontable package the demos import');
  const [renderBlock = ''] = buildBlock.split('Build the js visual-test demo');

  for (const task of ['build:themes-css', 'build:themes-css.min']) {
    assert.match(renderBlock, new RegExp(`npm run in handsontable ${task.replace('.', '\\.')}(?![.\\w-])`),
      `the build step lost \`${task}\`; the themed passes would render unstyled`);
  }

  // The command lines, not the bare task names: the step's comment names both tasks while explaining
  // the order, and a lookup on the word alone lands in the comment first.
  const themesAt = renderBlock.indexOf('npm run in handsontable build:themes-css');
  const postbuildAt = renderBlock.indexOf('npm run in handsontable postbuild:partial');
  const checkAt = renderBlock.indexOf('test -f handsontable/tmp/styles/ht-theme-main.css || {');

  assert.notEqual(themesAt, -1, 'the build step lost the build:themes-css command');
  assert.notEqual(postbuildAt, -1, 'the build step lost the postbuild:partial command');
  assert.ok(themesAt < postbuildAt, 'the theme stylesheets must exist before postbuild:partial copies styles/ into tmp/');
  // And the tree is checked before a browser is launched, so a regression here fails in seconds with
  // the file named, not eight minutes later inside a capture.
  assert.notEqual(checkAt, -1, 'the build step lost the ht-theme-main.css presence check');
  assert.ok(checkAt > postbuildAt,
    'the stylesheet check must run after postbuild:partial, which is what puts the file in tmp/');
});

test('the verdict step runs the checked-in script, and the script exists', () => {
  assert.match(workflow, /node \.\/visual-tests\/scripts\/stability-verdict\.mjs runs/);
  assert.ok(existsSync(path.join(root, 'visual-tests/scripts/stability-verdict.mjs')));
  assert.ok(existsSync(path.join(root, 'visual-tests/lib/tolerance-flags.mjs')));
  assert.ok(existsSync(path.join(root, 'visual-tests/lib/stability-report.mjs')));
});

test('the concurrency group carries a static prefix and never cancels a sibling dispatch', () => {
  // A measurement means something only when all N renders finish, so a second dispatch on the same
  // branch — `main-dark`, then `horizon` — must queue beside the first rather than throw away ten
  // runners mid-render. Keyed on the run, that cannot happen; keyed on the ref, it is the default.
  assert.match(workflow, /group: visual-stability-\$\{\{ github\.run_id \}\}/);
  assert.doesNotMatch(workflow, /group: visual-stability-\$\{\{ github\.ref \}\}/);
  assert.match(workflow, /cancel-in-progress: false/);
  assert.doesNotMatch(workflow, /\$\{\{ github\.workflow \}\}/);
});

test('the matrix measures what it renders: no retries, every render attempted, artifacts overwritable', () => {
  const [, renderBlock = ''] = workflow.split('Render the specs under investigation');

  // A retry overwrites the same screenshot path, so an iteration would keep the retry's clean capture
  // and the matrix would under-report the flakiness it exists to measure.
  assert.equal((renderBlock.match(/--retries=0/g) || []).length, 3,
    'all three renders must run with --retries=0');
  // Actions runs the block with -e: without collecting a status, one failing render ends the step and
  // the rest never run, which the verdict then reports as missing captures rather than as a skip.
  assert.match(renderBlock, /status=0/);
  assert.match(renderBlock, /exit \$status/);
  assert.equal((renderBlock.match(/\|\| status=1/g) || []).length, 3);
  // "Re-run failed jobs" re-uploads under a name the first attempt published. Sliced to the upload
  // step and asserted with two flat patterns rather than one spanning regex: `(?:\s+.*\n)*?` between
  // them is ambiguous (`\s` matches the newline `.*\n` already consumed), which is exponential
  // backtracking on the right input and a CodeQL `js/redos` alert.
  // `indexOf` asserted before the slice. On a miss `slice(-1)` returns the block's
  // last character — truthy — so asserting after the slice could never fail with
  // the message below; a renamed step fell through to the `assert.match` instead.
  const uploadAt = renderBlock.indexOf('name: Upload the screenshots');

  assert.notEqual(uploadAt, -1, 'the render job lost its upload step');

  const upload = renderBlock.slice(uploadAt);

  assert.match(upload, /name: stability-\$\{\{ matrix\.iteration \}\}/);
  assert.match(upload, /overwrite: true/);
});

test('the cross-browser render owns the port before the shared server starts', () => {
  // playwright-cross-browser.config.ts declares a webServer on 8082 with reuseExistingServer
  // off under CI, so it must run before `serve-example` binds the port — the other order
  // fails every iteration before a spec renders.
  const [, renderBlock = ''] = workflow.split('Render the specs under investigation');
  const cross = renderBlock.indexOf('playwright-cross-browser.config.ts');
  const serve = renderBlock.indexOf('npm run serve-example &');

  assert.ok(cross > -1 && serve > -1, 'the render step lost one of its two phases');
  assert.ok(cross < serve, 'the cross-browser config must run before the shared server is started');
  assert.doesNotMatch(renderBlock, /^\s+sleep \d+\s*$/m, 'server readiness is polled, not slept on');
  assert.match(renderBlock, /curl -sf http:\/\/localhost:8082\//, 'the readiness poll is missing');
});

test('the browser install matches the cache key it saves under', () => {
  // The key is visual.yml's `all` key. Saving a two-browser cache under it would leave the
  // cross-browser leg without webkit on its next cache hit.
  assert.match(workflow, /key: playwright-all-/);
  assert.match(workflow, /playwright install chromium firefox webkit/);
});

test('a red iteration still uploads what it rendered', () => {
  assert.match(workflow, /name: Upload the screenshots\n\s+if: steps\.gate\.outputs\.run == 'true' && !cancelled\(\)/);
});
